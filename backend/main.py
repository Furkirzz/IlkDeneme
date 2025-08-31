#!/usr/bin/env python3
"""
ocr_gpt.py — İki PNG dosyasından (A ve B kitapçığı) OCR + GPT çıktısı alır.

Kurulum:
    1) pip install paddleocr paddlepaddle openai==1.* python-dotenv
    2) .env dosyasına:
        OPENAI_API_KEY="sk-..."

Çalıştırma:
    python ocr_gpt.py deneme deneme Adile Karci, Recep, Furkan,deneme3, merge2
    python ocr_gpt.py deneme deneme Adile Karci, Recep, Furkan, deneme1, deneme2
    python ocr_gpt.py deneme deneme Adile Karci, Recep, Furkan,deneme3
    python ocr_gpt.py deneme deneme Adile Karci, Recep, Furkan, deneme1, deneme2,merge1
"""

import sys
import os
import cv2
import numpy as np
from pathlib import Path
from datetime import datetime
from paddleocr import PaddleOCR
from openai import OpenAI
from dotenv import load_dotenv

# .env yükle
load_dotenv()

MODEL = "gpt-4o-mini"

# GPT'ye gönderilecek sabit instructions
INSTRUCTIONS = (
    "Bu belgede bir A ve bir B kitapçığına ait cevap anahtarları verilmiştir. "
    "Senin görevin, bu iki cevap anahtarını da derslere göre ayrı ayrı düzenlemektir.\n\n"
    "Derslerin sırası ve soru sayıları şöyledir:\n"
    "- Türkçe: 20 soru\n"
    "- T.C. İnkılap Tarihi ve Atatürkçülük: 10 soru\n"
    "- Din Kültürü ve Ahlak Bilgisi: 10 soru\n"
    "- İngilizce: 10 soru\n"
    "- Matematik: 20 soru\n"
    "- Fen Bilgisi: 20 soru\n\n"
    "Cevap anahtarını şu formata göre düzenle:\n"
    "- Önce A kitapçığının cevaplarını, sonra B kitapçığının cevaplarını başlıklarla ayırarak yaz.\n"
    "- Her ders için cevapları art arda 90 karakterlik yaz."
)

def run_ocr_on_image(img_path: Path, ocr_instance: PaddleOCR) -> str | None:
    """Belirtilen resim yolu üzerinde OCR çalıştırır ve metni döndürür."""
    if not img_path.exists():
        print(f"Hata: {img_path} bulunamadı")
        return None
    
    print(f"'{img_path.name}' için OCR işlemi başlatılıyor...")
    
    try:
        # Türkçe karakter sorununu çözmek için OpenCV ile resmi okuyup numpy array'e çeviriyoruz
        # OpenCV imread Türkçe karakterleri desteklemiyor, bu yüzden farklı yöntem kullanıyoruz
        img_buffer = np.fromfile(str(img_path), dtype=np.uint8)
        img = cv2.imdecode(img_buffer, cv2.IMREAD_COLOR)
        
        if img is None:
            print(f"Hata: {img_path} okunamadı")
            return None
            
        # Resim ön işleme - OCR kalitesini artırmak için
        # Gri tona çevir
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Kontrast ve parlaklık ayarla
        alpha = 1.2  # Kontrast çarpanı
        beta = 10    # Parlaklık ekleme
        enhanced = cv2.convertScaleAbs(gray, alpha=alpha, beta=beta)
        
        # Gürültü azaltma
        denoised = cv2.fastNlMeansDenoising(enhanced)
        
        # OCR için optimum boyuta getir (yükseklik 1000 pixel)
        height, width = denoised.shape
        if height < 1000:
            scale = 1000 / height
            new_width = int(width * scale)
            resized = cv2.resize(denoised, (new_width, 1000), interpolation=cv2.INTER_CUBIC)
        else:
            resized = denoised
            
        # 3 kanala geri çevir (PaddleOCR RGB bekliyor)
        img = cv2.cvtColor(resized, cv2.COLOR_GRAY2RGB)
            
        # PaddleOCR'a numpy array olarak gönder
        result = ocr_instance.ocr(img)
        
        # OCR çıktısını metinleştir - result yapısını düzgün işle
        print(f"OCR result structure: {type(result)}")
        if result:
            print(f"Result length: {len(result)}")
            if result[0]:
                print(f"First page lines: {len(result[0])}")
                # İlk birkaç satırı debug için yazdır
                for i in range(min(3, len(result[0]))):
                    line = result[0][i]
                    print(f"Line {i}: {line}")
        
        ocr_text_lines = []
        if result and result[0]:  # Sonuç var mı kontrol et
            for line in result[0]:  # İlk sayfa
                if line and len(line) >= 2:  # Line geçerli mi
                    text = line[1][0] if isinstance(line[1], tuple) else line[1]
                    confidence = line[1][1] if isinstance(line[1], tuple) else 0.5
                    print(f"Metin: '{text}', Güven: {confidence}")
                    # Sadece yüksek güven skorlu metinleri al
                    if confidence > 0.1:  # Eşiği düşürdük
                        ocr_text_lines.append(text)
        
        ocr_text = " ".join(ocr_text_lines)  # Yeni satır yerine boşluk
        print(f"Final OCR metni: {ocr_text}")
        return ocr_text
        
    except Exception as e:
        print(f"OCR işlemi sırasında hata: {e}")
        return None

def main():
    # --- DEĞİŞİKLİK: A ve B kitapçıkları için iki ayrı dosya yolu belirtiyoruz ---
    # Kendi resim dosyalarınızın adını ve yolunu buraya yazın.
    img_path_a = Path("./samples/cevap_anahtari_A.png").resolve()
    img_path_b = Path("./samples/cevap_anahtari_B.png").resolve()

    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        print("Hata: OPENAI_API_KEY ayarlanmamış (.env içinde).")
        sys.exit(1)

    # OCR'ı bir kez başlat
    # Türkçe karakterli metinler için daha uygun ayarlar
    ocr = PaddleOCR(use_angle_cls=True, lang='tr')

    # Her iki resim için de OCR işlemini çalıştır
    ocr_text_a = run_ocr_on_image(img_path_a, ocr)
    ocr_text_b = run_ocr_on_image(img_path_b, ocr)

    # Eğer dosyalardan biri bulunamazsa programı durdur
    if ocr_text_a is None or ocr_text_b is None:
        sys.exit(1)

    # --- DEĞİŞİKLİK: İki metni GPT'ye göndermeden önce birleştiriyoruz ---
    combined_ocr_text = (
        f"A KİTAPÇIĞI METNİ:\n{ocr_text_a}\n\n"
        f"---\n\n"
        f"B KİTAPÇIĞI METNİ:\n{ocr_text_b}"
    )

    print("\n=== Birleştirilmiş OCR Metni (İlk 500 karakter) ===")
    print(combined_ocr_text[:500], "...")

    # OpenAI Client
    client = OpenAI(api_key=api_key)

    # GPT isteği
    resp = client.chat.completions.create(
        model=MODEL,
        messages=[{
            "role": "system", "content": INSTRUCTIONS
        },{
            "role": "user", "content": combined_ocr_text
        }],
    )

    output_text = resp.choices[0].message.content

    # --- DEĞİŞİKLİK: Çıktı dosyasını daha genel bir isimle kaydediyoruz ---
    out_path = Path("birlesik_cevap_anahtari.md")
    header = (
        f"# OCR + GPT Birleşik Çıktı\n\n"
        f"- Model: {MODEL}\n"
        f"- Zaman: {datetime.now().isoformat(timespec='seconds')}\n"
        f"- Kaynaklar: {img_path_a.name}, {img_path_b.name}\n\n"
    )
    out_path.write_text(header + output_text, encoding="utf-8")

    print("\n=== GPT Çıktısı ===")
    print(output_text[:1000], "...")
    print(f"\n[✓] Kaydedildi: {out_path}")

if __name__ == "__main__":
    main()