# pdf_okuma/views.py
import io
import re
from decimal import Decimal, ROUND_HALF_UP

import pdfplumber
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework.permissions import AllowAny
from drf_yasg.utils import swagger_auto_schema


from .models import ExamSet, ExamResult



class DenemeSinaviListAPIView(APIView):
    """Tüm deneme sınavlarını listeler (ExamSet)"""
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Deneme Sınavları Listesi",
        operation_description="Yüklenmiş tüm deneme sınavlarını (ExamSet) listeler."
    )
    def get(self, request):
        exams = ExamSet.objects.all().order_by("-date")

        deneme_listesi = []
        for exam in exams:
            deneme_listesi.append({
                "id": exam.id,
                "adi": exam.name,                       # eski 'adi' -> ExamSet.name
                "aciklama": exam.description,           # ExamSet.description
                "tarih": exam.date,                     # ExamSet.date (oluşturulma zamanı)
                "oturum_sayisi": exam.session_count,    # ExamSet.session_count
                "kitapcik_turleri": exam.booklet_types, # ExamSet.booklet_types
                "is_active": exam.is_active,
                # Geriye dönük uyumluluk: created_at alanı yok; date'i geri döndürüyoruz
                "created_at": exam.date,
            })

        return Response({
            "denemeler": deneme_listesi,
            "total_count": len(deneme_listesi),
        })

class ExamImportView(APIView):
    permission_classes = [permissions.AllowAny]

    # 8A, 10B ...
    CLASS_RE = re.compile(r"^\d{1,2}[A-ZÇĞİÖŞÜ]$")
    # 12 0 10,67 -0,33 488,407
    NUM_RE = re.compile(r"-?\d+(?:,\d+)?")
    # 319,130 / 463,711 / 488,407
    THREE_DEC_RE = re.compile(r"^\d{2,3},\d{3}$")

    # ----------------- helpers -----------------
    @staticmethod
    def _to_int(s: str) -> int:
        return int(s.replace(",", ""))

    @staticmethod
    def _to_dec(s: str) -> Decimal:
        return Decimal(s.replace(",", "."))

    @staticmethod
    def _q2(d: Decimal) -> Decimal:
        return d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    @staticmethod
    def _q3(d: Decimal) -> Decimal:
        return d.quantize(Decimal("0.001"), rounding=ROUND_HALF_UP)

    def _clip_to_field(self, field_name: str, value: str) -> str:
        if value is None:
            return value
        try:
            max_len = ExamResult._meta.get_field(field_name).max_length
        except Exception:
            return value
        if max_len and isinstance(value, str):
            return value[:max_len]
        return value

    def _rows_from_page(self, text: str):
        """
        Öğrenci satırları gelene kadar veri biriktirme.
        'Genel/Okul Ortalaması' ve '%' satırlarını atla.
        """
        lines = [l.strip() for l in (text or "").splitlines() if l.strip()]
        buf = ""
        collecting = False
        for line in lines:
            UL = line.upper()
            if "GENEL ORTALAMA" in UL or "OKUL ORTALAMASI" in UL:
                continue
            if UL.startswith("%"):
                continue

            is_row_start = re.match(r"^\s*\d+\s+\d+\s+", line) is not None
            if is_row_start:
                collecting = True
                if buf:
                    yield buf
                buf = line
            else:
                if collecting and buf:
                    buf += " " + line
                else:
                    continue
        if buf:
            yield buf

    @staticmethod
    def _fits_subject(d: int, y: int, n: Decimal, max_q: int) -> bool:
        """
        Üçlü belirli bir ders için mantıklı mı?
        Soru üst sınırlarına ve n ≈ d - y/3 kuralına göre kontrol.
        """
        if d < 0 or y < 0 or d > max_q or y > max_q:
            return False
        expected = Decimal(d) - Decimal(y) / Decimal(3)
        return abs(n - expected) <= Decimal("0.34")  # yuvarlama toleransı

    # --------------------- POST ---------------------
    def post(self, request):
        pdf_file = request.FILES.get("file")
        exam_name = request.data.get("exam_name")

        if not pdf_file:
            return Response({"error": "PDF dosyası gerekli."}, status=400)

        exam = ExamSet.objects.create(
            name=exam_name or f"Otomatik Sınav - {pdf_file.name}",
            description=f"{pdf_file.name} yüklenerek otomatik oluşturuldu.",
            is_active=True,
        )

        imported = 0
        skipped = 0
        err_samples = []
        pdf_buffer = io.BytesIO(pdf_file.read())

        with pdfplumber.open(pdf_buffer) as pdf:
            for page in pdf.pages:
                text = page.extract_text(layout=True) or ""
                for raw_line in self._rows_from_page(text):
                    try:
                        tokens = raw_line.split()
                        if len(tokens) < 5 or not (tokens[0].isdigit() and tokens[1].isdigit()):
                            skipped += 1
                            continue

                        # Ö.No -> student_no
                        student_no = tokens[1]

                        # Sınıf & isim
                        cls_idx = None
                        for i in range(2, len(tokens)):
                            if self.CLASS_RE.match(tokens[i].upper()):
                                cls_idx = i
                                break

                        if cls_idx is not None:
                            name_tokens = tokens[2:cls_idx]
                            classroom = tokens[cls_idx]
                            rest_tokens = tokens[cls_idx + 1:]
                        else:
                            name_tokens, start_num_idx = [], None
                            for i in range(2, len(tokens) - 2):
                                if (self.NUM_RE.fullmatch(tokens[i]) and
                                    self.NUM_RE.fullmatch(tokens[i+1]) and
                                    self.NUM_RE.fullmatch(tokens[i+2])):
                                    start_num_idx = i
                                    break
                                else:
                                    name_tokens.append(tokens[i])
                            classroom = ""
                            rest_tokens = tokens[start_num_idx:] if start_num_idx is not None else []

                        full_name = " ".join(name_tokens).strip()
                        if not full_name:
                            skipped += 1
                            continue

                        # ---- sayı normalizasyonları ----
                        rest_text = " ".join(rest_tokens)
                        # '488, 407' → '488,407'
                        rest_text = re.sub(r"(\d+),\s+(\d{1,3})\b", r"\1,\2", rest_text)
                        # '87,33488,407' → '87,33 488,407'
                        rest_text = re.sub(r"(\d+,\d{1,2})(\d+,\d{3})", r"\1 \2", rest_text)

                        nums_all = self.NUM_RE.findall(rest_text)
                        if len(nums_all) < 4:
                            skipped += 1
                            continue

                        as_dec = self._to_dec

                        def looks_int_token(s: str) -> bool:
                            return ("," not in s) and s.lstrip("-").isdigit()

                        # ---- toplam ve puanı saptama ----
                        score_idx = None
                        best_subjects = -1
                        best_is_three = False
                        for k in range(3, len(nums_all)):
                            td, ty, tn = nums_all[k-3:k]
                            if not (looks_int_token(td) and looks_int_token(ty)):
                                continue
                            try:
                                tn_v = as_dec(tn)
                            except Exception:
                                continue
                            td_i, ty_i = int(td), int(ty)
                            if not (0 <= td_i <= 120 and 0 <= ty_i <= 120):
                                continue
                            if not (Decimal("-30") <= tn_v <= Decimal("120")):
                                continue
                            prev_cnt = k - 3
                            if prev_cnt % 3 != 0:
                                continue
                            subjects = prev_cnt // 3
                            if not (0 <= subjects <= 6):
                                continue
                            try:
                                sv = as_dec(nums_all[k])
                            except Exception:
                                continue
                            in_range = 100 <= float(sv) <= 600
                            is_three = bool(self.THREE_DEC_RE.match(nums_all[k]))
                            if not in_range:
                                continue
                            if (is_three and not best_is_three) or \
                               (is_three == best_is_three and subjects >= best_subjects):
                                best_is_three = is_three
                                best_subjects = subjects
                                score_idx = k

                        # yedek stratejiler
                        if score_idx is None:
                            for j in range(len(nums_all)):
                                if self.THREE_DEC_RE.match(nums_all[j]):
                                    score_idx = j
                                    break
                        if score_idx is None:
                            for j in range(len(nums_all)):
                                try:
                                    if float(as_dec(nums_all[j])) >= 100:
                                        score_idx = j
                                        break
                                except Exception:
                                    pass

                        if score_idx is None or score_idx < 3:
                            skipped += 1
                            continue

                        totals_D = self._to_int(nums_all[score_idx-3])
                        totals_Y = self._to_int(nums_all[score_idx-2])
                        totals_N = as_dec(nums_all[score_idx-1])
                        score_val = as_dec(nums_all[score_idx])

                        subject_nums = nums_all[:score_idx-3]
                        if len(subject_nums) % 3 != 0:
                            subject_nums = subject_nums[: (len(subject_nums)//3) * 3]

                        # ---- aday üçlüler ----
                        cands = []
                        for i in range(0, len(subject_nums), 3):
                            d = self._to_int(subject_nums[i])
                            y = self._to_int(subject_nums[i+1])
                            n = self._q2(as_dec(subject_nums[i+2]))
                            cands.append((d, y, n))

                        SUBJECT_MAX = [20, 10, 10, 10, 20, 20]  # TR, TAR, DİN, İNG, MAT, FEN

                        def fits(candidate, idx):
                            d, y, n = candidate
                            return self._fits_subject(d, y, n, SUBJECT_MAX[idx])

                        # ---- adayları derslere yerleştir (kayma önleyici kural dahil) ----
                        assigned = []
                        ci = 0
                        missing_positions = []

                        for idx in range(6):
                            if ci >= len(cands):
                                assigned.append((0, 0, Decimal("0.00")))
                                missing_positions.append(idx)
                                continue

                            cand = cands[ci]

                            # Özel kural: DİN boşken İngilizce'ye kaymayı engelle
                            if idx == 2:
                                fits_cur = fits(cand, idx)     # Din
                                fits_eng = fits(cand, 3)       # İngilizce
                                next_fits_eng = False
                                if ci + 1 < len(cands):
                                    next_fits_eng = fits(cands[ci+1], 3)
                                if fits_eng and not next_fits_eng:
                                    assigned.append((0, 0, Decimal("0.00")))
                                    missing_positions.append(idx)
                                    # cand'ı tüketme; İngilizce için sakla
                                    continue

                            if fits(cand, idx):
                                assigned.append(cand)
                                ci += 1
                            else:
                                assigned.append((0, 0, Decimal("0.00")))
                                missing_positions.append(idx)

                        # ---- tek eksik ders varsa toplam farkından doldur ----
                        sumD = sum(d for d, _, _ in assigned)
                        sumY = sum(y for _, y, _ in assigned)
                        sumN = sum(n for _, _, n in assigned)

                        missD = totals_D - sumD
                        missY = totals_Y - sumY
                        missN = self._q2(totals_N - sumN)

                        if (missD != 0 or missY != 0 or missN != Decimal("0.00")) and missing_positions:
                            pos = missing_positions[0]
                            if missD >= 0 and missY >= 0:
                                assigned[pos] = (missD, missY, missN)

                        # Sıra: Türkçe, Tarih, Din, İngilizce, Matematik, Fen
                        (tD,tY,tN), (hD,hY,hN), (rD,rY,rN), (eD,eY,eN), (mD,mY,mN), (sD,sY,sN) = assigned

                        data = dict(
                            turkish_correct=tD,  turkish_wrong=tY,  turkish_net=float(self._q2(tN)),
                            history_correct=hD,  history_wrong=hY,  history_net=float(self._q2(hN)),
                            religion_correct=rD, religion_wrong=rY, religion_net=float(self._q2(rN)),
                            english_correct=eD,  english_wrong=eY,  english_net=float(self._q2(eN)),
                            math_correct=mD,     math_wrong=mY,     math_net=float(self._q2(mN)),
                            science_correct=sD,  science_wrong=sY,  science_net=float(self._q2(sN)),
                            total_correct=totals_D,
                            total_wrong=totals_Y,
                            total_net=float(self._q2(totals_N)),
                            score=float(self._q3(score_val)),
                        )

                        # isim ve alan kırpma
                        parts = full_name.split()
                        first_name = parts[0]
                        last_name = " ".join(parts[1:]) if len(parts) > 1 else ""
                        student_no_c = self._clip_to_field("student_no", str(student_no))
                        first_name_c = self._clip_to_field("first_name", first_name)
                        last_name_c  = self._clip_to_field("last_name", last_name)
                        classroom_c  = self._clip_to_field("classroom", classroom)

                        ExamResult.objects.create(
                            exam_set=exam,
                            student_no=student_no_c,
                            first_name=first_name_c,
                            last_name=last_name_c,
                            classroom=classroom_c,
                            raw_line=raw_line[:2000],
                            **data
                        )
                        imported += 1

                    except Exception as e:
                        skipped += 1
                        if len(err_samples) < 5:
                            err_samples.append({"line": raw_line[:200], "error": str(e)[:200]})

        return Response({
            "exam_id": exam.id,
            "exam_name": exam.name,
            "imported": imported,
            "skipped": skipped,
            "errors_sample": err_samples,
        }, status=200)

# pdf_okuma/views.py (dosyanıza ekleyin)
from rest_framework.permissions import AllowAny
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

# ... mevcut importlarınız ve sınıflarınız ...

class CombinedResults(APIView):
    """
    Bir ExamSet'e ait sonuçları (ExamResult) tablo formatında döndürür.
    Sıralama: score DESC, total_net DESC, id ASC
    """
    permission_classes = [AllowAny]

    @staticmethod
    def _q2(val):
        if val is None:
            return 0.0
        return float(Decimal(str(val)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))

    @staticmethod
    def _q3(val):
        if val is None:
            return 0.0
        return float(Decimal(str(val)).quantize(Decimal("0.001"), rounding=ROUND_HALF_UP))

    def _row_from_result(self, r, rank):
        return {
            "genel_siralama": rank,

            "student_no": r.student_no,
            "first_name": r.first_name,
            "last_name": r.last_name,
            "classroom": r.classroom,

            "turkish_correct":  r.turkish_correct,   "turkish_wrong":  r.turkish_wrong,   "turkish_net":  self._q2(r.turkish_net),
            "history_correct":  r.history_correct,   "history_wrong":  r.history_wrong,   "history_net":  self._q2(r.history_net),
            "religion_correct": r.religion_correct,  "religion_wrong": r.religion_wrong,  "religion_net": self._q2(r.religion_net),
            "english_correct":  r.english_correct,   "english_wrong":  r.english_wrong,   "english_net":  self._q2(r.english_net),
            "math_correct":     r.math_correct,      "math_wrong":     r.math_wrong,      "math_net":     self._q2(r.math_net),
            "science_correct":  r.science_correct,   "science_wrong":  r.science_wrong,   "science_net":  self._q2(r.science_net),

            "total_net": self._q2(r.total_net),
            "score":     self._q3(r.score),
        }

    @swagger_auto_schema(
        operation_summary="Bir denemenin (ExamSet) sonuç tablosu",
        operation_description=(
            "`deneme_id` (ya da `exam_id`) verilirse o denemenin; "
            "verilmezse EN SON oluşturulan denemenin sonuçlarını döner."
        ),
        manual_parameters=[
            openapi.Parameter(
                name="deneme_id",
                in_=openapi.IN_QUERY,
                description="ExamSet id (opsiyonel). `exam_id` ile de verilebilir.",
                type=openapi.TYPE_INTEGER,
                required=False,
            ),
            openapi.Parameter(
                name="exam_id",
                in_=openapi.IN_QUERY,
                description="ExamSet id (opsiyonel). `deneme_id` ile aynı işlev.",
                type=openapi.TYPE_INTEGER,
                required=False,
            ),
        ],
        responses={200: "OK"},
        security=[],
    )
    def get(self, request):
        exam_id = request.query_params.get("deneme_id") or request.query_params.get("exam_id")

        if exam_id:
            try:
                exam = ExamSet.objects.get(id=exam_id)
            except ExamSet.DoesNotExist:
                return Response({"error": "Exam not found."}, status=404)
        else:
            exam = ExamSet.objects.order_by("-date").first()
            if not exam:
                return Response({"results": [], "total_students": 0, "deneme_sinavi": None})

        qs = exam.results.all().order_by("-score", "-total_net", "id")

        rows = [self._row_from_result(r, rank=i + 1) for i, r in enumerate(qs)]
        payload = {
            "deneme_sinavi": {
                "id": exam.id,
                "adi": exam.name,
                "tarih": exam.date,
                "oturum_sayisi": exam.session_count,
                "kitapcik_turleri": exam.booklet_types,
            },
            "results": rows,
            "total_students": len(rows),
        }
        return Response(payload, status=200)
