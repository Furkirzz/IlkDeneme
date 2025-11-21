# pdf_okuma/ai_parser.py
import json
import os
import re
from typing import Any, Dict, List, Optional

from openai import OpenAI
from django.conf import settings


def _get_openai_client() -> Optional[OpenAI]:
    api_key = getattr(settings, "OPENAI_API_KEY", "") or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        return None
    return OpenAI()


def detect_grade_from_text(filename: str, text: str) -> Optional[str]:
    """
    Çok kritik değil, ama modele ipucu olarak verebiliriz.
    5 / 6 / 7 / 8. sınıf tespiti.
    """
    up = (filename + " " + text).upper()

    # Örnek: 7.SINIF, 7 SINIF, 7.SINIFLAR vb.
    for pat in [
        r"(\b[5-8])\s*\.?\s*SINIFLAR?\b",
        r"(\b[5-8])\s*\.?\s*SINIF\b",
    ]:
        m = re.search(pat, up)
        if m:
            return m.group(1)

    # Dosya adında "7" geçiyorsa (zayıf ipucu)
    m = re.search(r"\b(5|6|7|8)\b", filename)
    if m:
        return m.group(1)

    return None


def extract_main_table_block(text: str) -> str:
    """
    Özellikle 'ŞUBE DERECE LİSTESİ' ve benzeri raporlarda:
    - Üstte açıklamalar
    - Ortada büyük öğrenci listesi tablosu
    - Altta özetler (Okul Ort, Genel Ort, Sınav Ortalaması...) var.

    Amaç: Ders başlıkları + öğrenci satırlarını içeren ana tablo bloğunu
    ayıklayıp modele göndermek.
    """
    lines = text.splitlines()

    row_start_idx = None
    end_idx = None

    # 7-243581-8-A-Report-3-Sube-Listeler.pdf tarzı dosyalarda
    # satırlar genelde:
    # "A VERA ÇÜRÜK163 18 2 20 0 0 20 1 0 10 10 90 ..."
    # gibi "Şube harfi + isim" ile başlıyor.
    row_start_pattern = re.compile(r"^\s*[A-ZÇĞİÖŞÜ]\s+\S+")

    for i, line in enumerate(lines):
        if row_start_pattern.match(line.strip()):
            row_start_idx = i
            break

    if row_start_idx is None:
        # Hiç bulamazsak, fallback: tüm metni döneriz (eski davranış)
        return text

    # Öğrenci satırından birkaç satır yukarıda:
    # AD SOYAD, D Y D Y D Y..., TOP NET PUAN..., Trk/Bil Mat. Fen. B. ... başlıkları var.
    # Güvenli olsun diye 6 satır yukarıdan başlatalım.
    start_idx = max(row_start_idx - 6, 0)

    # Bitiş: "Okul Ort", "GENEL Ort", "Türkiye Ort", "Sınav Ortalaması" gibi özet satırları
    for j in range(row_start_idx + 1, len(lines)):
        ul = lines[j].upper()
        if (
            "OKUL ORT" in ul
            or "GENEL ORT" in ul
            or "TURKIYE ORT" in ul
            or "TÜRKİYE ORT" in ul
            or "SINAV ORTALAMASI" in ul
        ):
            end_idx = j
            break

    if end_idx is None:
        end_idx = len(lines)

    block = "\n".join(lines[start_idx:end_idx])
    return block



def build_exam_prompt(filename: str, grade: Optional[str], text: str) -> str:
    """
    PDF'ten çekilmiş ham metni (öğrenci tablosu bloğu) alıp
    modele verilecek prompt'u oluşturur.
    """
    grade_info = grade or "unknown"

    prompt = f"""
You are given OCR text extracted from Turkish multiple-choice exam result PDFs
(LGS-style). The text you see below is the **student result table block** for one school.
This block includes:

- Column headers (subject names, D/Y indicators, etc.)
- One row per student (sube, name, scores...)
- Possibly some minor noise, but NO global averages (we have cut them off).

Your job is to extract a clean student-level results table.

IMPORTANT RULES:

1. You MUST output one JSON object for EVERY student row.
   - Do NOT skip rows.
   - Do NOT merge rows.
   - Do NOT summarise or group students.
   - There can be more than 50 students; output them all.

2. Use the **table header line(s)** to determine subject order.
   Example (one possible header):

     "Trk/Bil Mat. Fen. B. Sos. B. Din. K. İng."

   This means that, for each student row, the D/Y pairs after the name are in this
   exact left-to-right order:

     1) Turkish language (TÜRKÇE, Trk/Bil)
     2) Mathematics (MATEMATİK, Mat.)
     3) Science (FEN BİLİMLERİ, Fen. B.)
     4) History / Social (SOSYAL BİLGİLER or İNKILAP)
     5) Religion (DİN KÜLTÜRÜ ve AHL. BİL.)
     6) English (İNGİLİZCE or Yabancı Dil)

   More generally:
   - Read the subject names from the header (e.g. "TÜRKÇE", "MAT.", "FEN. B.", "SOS. B.",
     "DİN K.", "İNG.", etc.).
   - For each student row, the D/Y pairs appear vertically under these header columns.
   - You MUST NOT reorder subjects.
   - Your task is to map each D/Y pair under its subject header to the correct
     canonical field: turkish_*, math_*, science_*, history_*, religion_*, english_*.

3. For each student row:

   - Find the student number if there is one (for example a column called "Öğrenci No"
     or a 'No' column that looks like a true ID). If there is only ranking and no real ID,
     set "student_no" to an empty string "".

   - Extract first_name and last_name separately:
     - first_name: all given names except the surname,
     - last_name: only the surname (the last word of the full name).
     Examples:
       "ZEYNEP ECE GÜVEN"  -> first_name: "ZEYNEP ECE", last_name: "GÜVEN"
       "HAZAN ÇOKÇALIŞKAN" -> first_name: "HAZAN",       last_name: "ÇOKÇALIŞKAN"

   - Extract classroom as a short code like "7A", "7F", "8B":
     - If it appears as "7 / A" or "7 /A" or "7-A", normalize to "7A".
     - If there is both grade and section, always include both (e.g. "7A", "8F").
     - If you cannot find it, set to empty string "".

4. For each of the 6 subjects, extract:

   - <subject>_correct : number of correct answers (columns usually labelled D or DS)
   - <subject>_wrong   : number of wrong answers   (Y or YS)

   In the text, decimal numbers may use comma as decimal separator (e.g. "18,67").
   Convert all decimal numbers to standard English format: "18.67".

   If a NET column exists for that subject, you may read it but this is optional.
   The backend will recompute net scores from correct / wrong, so it is acceptable
   to set all *_net fields to 0.0.

5. Also extract the overall exam score for each student:

   - score : exam score (e.g. "LGS_2023-24 Puan" or "LGS Puan")

   The backend will recompute total_correct, total_wrong and total_net from
   per-subject values, so you may set these total_* fields to 0 if they are not obvious.

6. Ignore:

   - Any kind of averages or summary rows:
     - "Genel Ortalama", "İl Ortalaması", "Okul Ortalaması",
       "SINAV ORTALAMASI", "Türkiye Ort", "Sınıf Karnesi" summary rows, etc.
   - Any class-level or school-level summary (like "8A", "8B" class averages).
   - Headers and footers, report explanations (outside the main table).

7. If a particular value is missing or ambiguous, set it to 0 (for numeric fields)
   or empty string "" (for text fields like student_no or classroom).

The grade level for this exam (if known) is: {grade_info}.
Use it only as a hint (for example, question counts), but do not output it.

Return ONLY valid JSON with this EXACT structure, nothing else:

{{
  "students": [
    {{
      "student_no": "string",
      "first_name": "string",
      "last_name": "string",
      "classroom": "string",
      "turkish_correct": 0,
      "turkish_wrong": 0,
      "turkish_net": 0.0,
      "history_correct": 0,
      "history_wrong": 0,
      "history_net": 0.0,
      "religion_correct": 0,
      "religion_wrong": 0,
      "religion_net": 0.0,
      "english_correct": 0,
      "english_wrong": 0,
      "english_net": 0.0,
      "math_correct": 0,
      "math_wrong": 0,
      "math_net": 0.0,
      "science_correct": 0,
      "science_wrong": 0,
      "science_net": 0.0,
      "total_correct": 0,
      "total_wrong": 0,
      "total_net": 0.0,
      "score": 0.0
    }}
  ]
}}

Do not include any comments or explanations. Do not add any extra keys.

Here is the OCR text for the student table in PDF file "{filename}":

{text}
"""
    return prompt



def parse_exam_with_ai(filename: str, raw_text: str) -> List[Dict[str, Any]]:
    """
    Ham PDF metnini OpenAI ile parse eder ve students listesi döner.
    Burada önce 'öğrenci tablosu' bloğunu ayıklıyoruz, sonra AI'e veriyoruz.
    """
    client = _get_openai_client()
    if client is None:
        raise RuntimeError("OPENAI_API_KEY not configured")

    # 1) Metinden sadece ana öğrenci tablosunu çek
    table_text = extract_main_table_block(raw_text)

    # 2) Sınıf tespiti ipucunu bu bloktan veya tüm metinden çıkar
    grade = detect_grade_from_text(filename, table_text)

    # 3) Prompt oluştur
    prompt = build_exam_prompt(filename, grade, table_text)

    model_name = getattr(settings, "OPENAI_MODEL", None) or os.environ.get("OPENAI_MODEL", "gpt-4.1-mini")

    response = client.chat.completions.create(
        model=model_name,
        temperature=0,
        messages=[
            {"role": "system", "content": "You are a precise JSON-only extraction engine."},
            {"role": "user", "content": prompt},
        ],
    )

    content = response.choices[0].message.content
    data = json.loads(content)

    students = data.get("students", [])
    if not isinstance(students, list):
        raise ValueError("AI response does not contain 'students' list")

    # Sayısal alanları float'a çevir, olmayanları 0 yap
    num_fields = [
        "turkish_correct", "turkish_wrong", "turkish_net",
        "history_correct", "history_wrong", "history_net",
        "religion_correct", "religion_wrong", "religion_net",
        "english_correct", "english_wrong", "english_net",
        "math_correct", "math_wrong", "math_net",
        "science_correct", "science_wrong", "science_net",
        "total_correct", "total_wrong", "total_net", "score",
    ]

    cleaned: List[Dict[str, Any]] = []
    for st in students:
        if not isinstance(st, dict):
            continue

        # Text alanları
        student_no = str(st.get("student_no", "") or "").strip()
        first_name = str(st.get("first_name", "") or "").strip()
        last_name = str(st.get("last_name", "") or "").strip()
        classroom = str(st.get("classroom", "") or "").replace(" ", "").replace("/", "").replace("-", "").strip()

        row: Dict[str, Any] = {
            "student_no": student_no,
            "first_name": first_name,
            "last_name": last_name,
            "classroom": classroom,
        }

        for field in num_fields:
            val = st.get(field, 0)
            try:
                if isinstance(val, str):
                    val = val.replace(",", ".")
                row[field] = float(val)
            except Exception:
                row[field] = 0.0

        cleaned.append(row)

    return cleaned
