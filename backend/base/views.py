from django.core.cache import cache
import re
from urllib import request
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, render
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import viewsets, status, generics
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser, JSONParser
from typing import Dict, Tuple

from .serializer import (
    DersProgramiSerializer,
    ImageSerializer,
    MainPageTextSerializer,
    CitySerializer,
    DistrictSerializer,
    AddressSerializer,
    PhoneSerializer,
    EventSerializer,
    StudentAnswerSerializer,
    StudentResultSerializer,
)
from .models import (
    DersProgrami,
    Image,
    MainPageText,
    City,
    District,
    Address,
    Phone,
    Event,
    StudentAnswer,
    StudentResult,
)

from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from google.auth.transport import requests as google_requests  # Google'ın request modülü
import requests
import io

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from django.db.models.functions import TruncMonth, Coalesce, Now
from django.db.models import Count, Q


API_URL = "https://api.iletimerkezi.com/v1/send-sms/get"
API_KEY = "30367d635b24ad9069e34fbe2c8865f3"
HASH = "88a29e86a4ae0205697bd6e2f1680c7d32ff042b86e380c184717d944bf2b34e"
SENDER = "APITEST"

GOOGLE_CLIENT_ID = "795121666723-7neo6fh4omj35hddbsov7fspbqnrn2k1.apps.googleusercontent.com"


# =========================
# PUAN/NET HESAPLAMA (geçici olarak views içinde)
# =========================

SCORING_WEIGHTS = {
    "turkce":     4.348,   # örnek ağırlıklar
    "tarih":      1.666,   # (inkılap)
    "din":        1.899,
    "ingilizce":  1.5075,
    "matematik":  4.2538,
    "fen":        4.1230,
}
SCORING_CONST = 194.752082  # sabit terim (yaklaşım)

def _analyze(answers: str, key: str) -> Tuple[int, int, int, float]:
    """Doğru, yanlış, boş, net (d - y/3) döndürür."""
    if not answers or not key:
        return 0, 0, 0, 0.0
    d = y = b = 0
    for a, k in zip(answers, key):
        if a in "ABCDEF":
            if a == k: d += 1
            else:      y += 1
        else:
            b += 1
    net = d - (y / 3)
    return d, y, b, round(net, 2)

def _compute_nets(student: Dict[str, str], key: Dict[str, str]) -> Dict[str, float]:
    """Her ders için netleri hesapla."""
    nets = {}
    for field, kname in [
        ("turkce", "turkce"),
        ("inkilap", "inkilap"),   # front’ta 'tarih' diye gösterilebilir
        ("din", "din"),
        ("ingilizce", "ingilizce"),
        ("matematik", "matematik"),
        ("fen", "fen"),
    ]:
        _, _, _, net = _analyze(student.get(field, "") or "", key.get(kname, "") or "")
        nets[f"{field}_net"] = net
    return nets

def _compute_score(nets: Dict[str, float]) -> float:
    """Ağırlıklı puan + sabit (yaklaşım)."""
    s = (
        SCORING_WEIGHTS["turkce"]    * nets.get("turkce_net", 0.0) +
        SCORING_WEIGHTS["tarih"]     * nets.get("inkilap_net", 0.0) +
        SCORING_WEIGHTS["din"]       * nets.get("din_net", 0.0) +
        SCORING_WEIGHTS["ingilizce"] * nets.get("ingilizce_net", 0.0) +
        SCORING_WEIGHTS["matematik"] * nets.get("matematik_net", 0.0) +
        SCORING_WEIGHTS["fen"]       * nets.get("fen_net", 0.0) +
        SCORING_CONST
    )
    return round(s, 3)


# =========================
# PUBLIC (GET) ENDPOINTS
# =========================

@api_view(['GET'])
@permission_classes([AllowAny])
def get_image(request):
    images = Image.objects.all()
    serializer = ImageSerializer(images, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_MainPageText(request):
    texts = MainPageText.objects.all()
    serializer = MainPageTextSerializer(texts, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def get_contact_info(request):
    city = City.objects.first()
    district = District.objects.first()
    address = Address.objects.first()
    phone = Phone.objects.first()

    data = {
        'city': CitySerializer(city).data if city else {},
        'district': DistrictSerializer(district).data if district else {},
        'address': AddressSerializer(address).data if address else {},
        'phone': PhoneSerializer(phone).data if phone else {},
    }
    return Response(data)


def home_view(request):
    return HttpResponse("Ana Sayfa")


# =========================
# EVENTS
# =========================

class EventDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        serializer = EventSerializer(event)
        return Response(serializer.data)

    def put(self, request, pk):
        if not request.user.is_authenticated or not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Yetki yok."}, status=status.HTTP_403_FORBIDDEN)
        event = get_object_or_404(Event, pk=pk)
        serializer = EventSerializer(event, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        if not request.user.is_authenticated or not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Yetki yok."}, status=status.HTTP_403_FORBIDDEN)
        event = get_object_or_404(Event, pk=pk)
        serializer = EventSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventListCreateView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        events = Event.objects.filter(active=True)
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)

    def post(self, request):
        if not request.user.is_authenticated or not (request.user.is_staff or request.user.is_superuser):
            return Response({"detail": "Yetki yok."}, status=status.HTTP_403_FORBIDDEN)
        serializer = EventSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =========================
# AUTH / LOGIN
# =========================

class GoogleLoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        id_token = request.data.get("access")

        if not id_token:
            return Response({
                "success": False,
                "error": "credential (id_token) gerekli."
            }, status=400)

        try:
            google_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
            resp = requests.get(google_url)
            if resp.status_code != 200:
                return Response({
                    "success": False,
                    "error": "Google ID token doğrulaması başarısız."
                }, status=400)

            user_info = resp.json()
            email = user_info.get("email")
            if not email:
                return Response({
                    "success": False,
                    "error": "Email bilgisi alınamadı."
                }, status=400)

            User = get_user_model()
            user, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    "username": email,
                    "first_name": user_info.get("given_name", ""),
                    "last_name": user_info.get("family_name", ""),
                }
            )

            refresh = RefreshToken.for_user(user)
            return Response({
                "success": True,
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "username": user.username
                }
            })

        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=500)


# =========================
# PROGRAM
# =========================

class DersProgramiList(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        program = DersProgrami.objects.all().order_by('Baslangic_saat')
        serializer = DersProgramiSerializer(program, many=True)
        return Response(serializer.data)


# =========================
# UPLOAD & RESULTS
# =========================

class UploadResultsView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                name="deneme_adi",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_STRING,
                required=True,
                description="Deneme sınavının adı"
            ),
            openapi.Parameter(
                name="cevap_anahtari_a",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_STRING,
                required=True,
                description="A kitapçığı için doğru cevaplar: toplam 90 karakter\n"
                            "- 1. oturum: 50 karakter (20 Türkçe, 10 İnkılap, 10 Din, 10 İngilizce)\n"
                            "- 2. oturum: 40 karakter (20 Matematik, 20 Fen)"
            ),
            openapi.Parameter(
                name="cevap_anahtari_b",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_STRING,
                required=True,
                description="B kitapçığı için doğru cevaplar: toplam 90 karakter\n"
                            "- 1. oturum: 50 karakter (20 Türkçe, 10 İnkılap, 10 Din, 10 İngilizce)\n"
                            "- 2. oturum: 40 karakter (20 Matematik, 20 Fen)"
            ),
            openapi.Parameter(
                name="file",
                in_=openapi.IN_FORM,
                type=openapi.TYPE_FILE,
                required=True,
                description=".txt formatında öğrenci cevapları"
            ),
        ],
        operation_summary="Sınav Sonuçlarını Yükle",
    )
    def post(self, request):
        uploaded_file = request.FILES.get("file")
        deneme_adi = request.data.get("deneme_adi", "").strip()
        cevap_anahtari_a_text = request.data.get("cevap_anahtari_a", "").strip()
        cevap_anahtari_b_text = request.data.get("cevap_anahtari_b", "").strip()

        if not uploaded_file or not deneme_adi or not cevap_anahtari_a_text or not cevap_anahtari_b_text:
            return Response({"error": "Dosya, deneme adı ve her iki cevap anahtarı da gerekli."}, status=400)

        if len(cevap_anahtari_a_text) != 90:
            return Response({"error": "A kitapçığı cevap anahtarı tam olarak 90 karakter olmalı (50 + 40)."}, status=400)

        if len(cevap_anahtari_b_text) != 90:
            return Response({"error": "B kitapçığı cevap anahtarı tam olarak 90 karakter olmalı (50 + 40)."}, status=400)

        # A kitapçığı cevap anahtarını ayır
        cevap_anahtari_a = {
            "turkce": cevap_anahtari_a_text[0:20],
            "inkilap": cevap_anahtari_a_text[20:30],
            "din": cevap_anahtari_a_text[30:40],
            "ingilizce": cevap_anahtari_a_text[40:50],
            "matematik": cevap_anahtari_a_text[50:70],
            "fen": cevap_anahtari_a_text[70:90],
        }

        # B kitapçığı cevap anahtarını ayır
        cevap_anahtari_b = {
            "turkce": cevap_anahtari_b_text[0:20],
            "inkilap": cevap_anahtari_b_text[20:30],
            "din": cevap_anahtari_b_text[30:40],
            "ingilizce": cevap_anahtari_b_text[40:50],
            "matematik": cevap_anahtari_b_text[50:70],
            "fen": cevap_anahtari_b_text[70:90],
        }

        # Deneme sınavını oluştur/güncelle
        from .models import AnswerKey, DenemeSinavi
        from django.utils import timezone

        deneme_sinavi, created = DenemeSinavi.objects.get_or_create(
            adi=deneme_adi,
            defaults={
                'aciklama': f"{deneme_adi} deneme sınavı",
                'tarih': timezone.now(),
                'oturum_sayisi': 2,
                'kitapcik_turleri': 'A/B'
            }
        )

        # Cevap anahtarlarını deneme bazında kaydet/güncelle
        AnswerKey.objects.update_or_create(
            deneme_sinavi=deneme_sinavi,
            kitapcik_turu='A',
            defaults={
                'turkce': cevap_anahtari_a['turkce'],
                'inkilap': cevap_anahtari_a['inkilap'],
                'din': cevap_anahtari_a['din'],
                'ingilizce': cevap_anahtari_a['ingilizce'],
                'matematik': cevap_anahtari_a['matematik'],
                'fen': cevap_anahtari_a['fen'],
            }
        )

        AnswerKey.objects.update_or_create(
            deneme_sinavi=deneme_sinavi,
            kitapcik_turu='B',
            defaults={
                'turkce': cevap_anahtari_b['turkce'],
                'inkilap': cevap_anahtari_b['inkilap'],
                'din': cevap_anahtari_b['din'],
                'ingilizce': cevap_anahtari_b['ingilizce'],
                'matematik': cevap_anahtari_b['matematik'],
                'fen': cevap_anahtari_b['fen'],
            }
        )

        def normalize_cevaplar(cevaplar: str, expected_length: int):
            if len(cevaplar) < expected_length:
                cevaplar = cevaplar.ljust(expected_length, '*')
            cevaplar = cevaplar[:expected_length]
            normalized = ""
            for char in cevaplar:
                if char.upper() in "ABCDEF":
                    normalized += char.upper()
                else:
                    normalized += "*"
            return normalized

        def analiz_et(ogr_cevaplari: str, dogru_cevaplar: str):
            dogru, yanlis, bos = 0, 0, 0
            expected_length = len(dogru_cevaplar)
            if len(ogr_cevaplari) != expected_length:
                ogr_cevaplari = ogr_cevaplari.ljust(expected_length, '*')[:expected_length]
            for ogr, dogru_cvp in zip(ogr_cevaplari, dogru_cevaplar):
                if ogr == '*':
                    bos += 1
                elif ogr.upper() in "ABCDEF":
                    if ogr.upper() == dogru_cvp.upper():
                        dogru += 1
                    else:
                        yanlis += 1
                else:
                    bos += 1
            net = dogru - (yanlis / 3)
            return dogru, yanlis, bos, round(net, 2)

        def safe_decode(line_bytes):
            encodings = ['utf-8', 'windows-1254', 'iso-8859-9', 'cp1252']
            for encoding in encodings:
                try:
                    return line_bytes.decode(encoding).strip()
                except (UnicodeDecodeError, UnicodeError):
                    continue
            return line_bytes.decode('utf-8', errors='replace').strip()

        def safe_get_field(line, start, end, default=""):
            try:
                if len(line) >= end:
                    return line[start:end]
                elif len(line) > start:
                    return line[start:]
                else:
                    return default
            except:
                return default

        def toplam_soru_kontrol(turkce, inkilap, din, ing, matematik, fen):
            toplam = len(turkce) + len(inkilap) + len(din) + len(ing) + len(matematik) + len(fen)
            expected = 90
            if toplam != expected:
                raise ValueError(f"Toplam soru sayısı {toplam}, beklenen {expected}")
            return True

        def otomatik_oturum_tespit(line):
            turkce_raw = safe_get_field(line, 51, 71).strip()
            inkilap_raw = safe_get_field(line, 71, 81).strip()
            din_raw = safe_get_field(line, 91, 101).strip()
            ing_raw = safe_get_field(line, 111, 121).strip()
            matematik_raw = safe_get_field(line, 131, 151).strip()
            fen_raw = safe_get_field(line, 151, 171).strip()

            def has_answers(raw_answer):
                if not raw_answer:
                    return False
                return any(char.upper() in "ABCDEF" for char in raw_answer)

            def count_answers(raw_answer):
                if not raw_answer:
                    return 0
                return sum(1 for char in raw_answer if char.upper() in "ABCDEF")

            turkce_var = has_answers(turkce_raw)
            inkilap_var = has_answers(inkilap_raw)
            din_var = has_answers(din_raw)
            ing_var = has_answers(ing_raw)

            matematik_var = has_answers(matematik_raw)
            fen_var = has_answers(fen_raw)

            oturum_1_cevap_sayisi = (
                count_answers(turkce_raw) +
                count_answers(inkilap_raw) +
                count_answers(din_raw) +
                count_answers(ing_raw)
            )

            oturum_2_cevap_sayisi = (
                count_answers(matematik_raw) +
                count_answers(fen_raw)
            )

            oturum_1_cevap_var = turkce_var or inkilap_var or din_var or ing_var
            oturum_2_cevap_var = matematik_var or fen_var

            if oturum_1_cevap_var and oturum_2_cevap_var:
                return 1 if oturum_1_cevap_sayisi >= oturum_2_cevap_sayisi else 2
            elif oturum_1_cevap_var and not oturum_2_cevap_var:
                return 1
            elif oturum_2_cevap_var and not oturum_1_cevap_var:
                return 2
            else:
                return 0

        hatalar = []
        basarili = 0
        oturum_tespit_sayisi = 0

        for i, line_bytes in enumerate(uploaded_file.readlines(), start=1):
            try:
                line = safe_decode(line_bytes)

                okul_kodu = safe_get_field(line, 0, 10).strip()
                ogrenci_no = safe_get_field(line, 10, 15).strip()
                ad = safe_get_field(line, 15, 25).strip()
                soyad = safe_get_field(line, 25, 35).strip()
                sinif = safe_get_field(line, 35, 37).strip()
                tc_kimlik = safe_get_field(line, 37, 48).strip()
                cinsiyet = safe_get_field(line, 48, 49).strip() or "?"

                oturum_str = safe_get_field(line, 49, 50).strip()
                try:
                    oturum_from_field = int(oturum_str) if oturum_str.isdigit() else 0
                except:
                    oturum_from_field = 0

                otomatik_tespit = False
                if oturum_from_field in [0, None]:
                    oturum = otomatik_oturum_tespit(line)
                    otomatik_tespit = True
                    oturum_tespit_sayisi += 1
                else:
                    oturum = oturum_from_field

                if oturum == 0:
                    hatalar.append(f"{i}. satır ({ad} {soyad}): Oturum tespit edilemedi - hiçbir derse cevap verilmemiş")
                    continue

                kitapcik = safe_get_field(line, 50, 51).strip().upper()

                turkce = inkilap = din = ing = matematik = fen = ""

                if oturum == 1:
                    turkce_raw = safe_get_field(line, 51, 71)
                    inkilap_raw = safe_get_field(line, 71, 81)
                    din_raw = safe_get_field(line, 91, 101)
                    ing_raw = safe_get_field(line, 111, 121)

                    turkce = normalize_cevaplar(turkce_raw, 20)
                    inkilap = normalize_cevaplar(inkilap_raw, 10)
                    din = normalize_cevaplar(din_raw, 10)
                    ing = normalize_cevaplar(ing_raw, 10)

                    matematik = "*" * 20
                    fen = "*" * 20

                elif oturum == 2:
                    matematik_raw = safe_get_field(line, 131, 151)
                    fen_raw = safe_get_field(line, 151, 171)

                    matematik = normalize_cevaplar(matematik_raw, 20)
                    fen = normalize_cevaplar(fen_raw, 20)

                    turkce = "*" * 20
                    inkilap = "*" * 10
                    din = "*" * 10
                    ing = "*" * 10

                else:
                    hatalar.append(f"{i}. satır ({ad} {soyad}): Geçersiz oturum numarası: {oturum}")
                    continue

                try:
                    toplam_soru_kontrol(turkce, inkilap, din, ing, matematik, fen)
                except ValueError as e:
                    hatalar.append(f"{i}. satır ({ad} {soyad}): {str(e)}")
                    continue

                cevap_anahtari = cevap_anahtari_a if kitapcik == "A" else cevap_anahtari_b

                turkce_analiz = analiz_et(turkce, cevap_anahtari["turkce"])
                inkilap_analiz = analiz_et(inkilap, cevap_anahtari["inkilap"])
                din_analiz = analiz_et(din, cevap_anahtari["din"])
                ing_analiz = analiz_et(ing, cevap_anahtari["ingilizce"])
                mat_analiz = analiz_et(matematik, cevap_anahtari["matematik"])
                fen_analiz = analiz_et(fen, cevap_anahtari["fen"])

                net_turkce = turkce_analiz[3]
                net_inkilap = inkilap_analiz[3]
                net_din = din_analiz[3]
                net_ing = ing_analiz[3]
                net_mat = mat_analiz[3]
                net_fen = fen_analiz[3]

                toplam_dogru = sum([turkce_analiz[0], inkilap_analiz[0], din_analiz[0],
                                   ing_analiz[0], mat_analiz[0], fen_analiz[0]])
                toplam_yanlis = sum([turkce_analiz[1], inkilap_analiz[1], din_analiz[1],
                                    ing_analiz[1], mat_analiz[1], fen_analiz[1]])
                toplam_bos = sum([turkce_analiz[2], inkilap_analiz[2], din_analiz[2],
                                 ing_analiz[2], mat_analiz[2], fen_analiz[2]])

                if toplam_dogru + toplam_yanlis + toplam_bos != 90:
                    hatalar.append(f"{i}. satır ({ad} {soyad}): Toplam soru sayısı kontrolü başarısız. "
                                   f"Doğru: {toplam_dogru}, Yanlış: {toplam_yanlis}, Boş: {toplam_bos}")
                    continue

                total_net = round(net_turkce + net_inkilap + net_din + net_ing + net_mat + net_fen, 2)

                StudentResult.objects.create(
                    deneme_sinavi=deneme_sinavi,
                    okul_kodu=okul_kodu,
                    ogrenci_no=ogrenci_no,
                    ad=ad,
                    soyad=soyad,
                    sinif=sinif,
                    cinsiyet=cinsiyet,
                    oturum=oturum,
                    kitapcik_turu=kitapcik,
                    turkce=turkce,
                    inkilap=inkilap,
                    din=din,
                    ingilizce=ing,
                    matematik=matematik,
                    fen=fen,
                    net=total_net,
                    full_raw_line=line,
                )
                basarili += 1

            except Exception as e:
                hatalar.append(f"{i}. satır: {str(e)}")

        mesaj_parts = [f"{basarili} kayıt başarıyla yüklendi."]
        if oturum_tespit_sayisi > 0:
            mesaj_parts.append(f"{oturum_tespit_sayisi} öğrencinin oturumu otomatik tespit edildi.")
        mesaj = " ".join(mesaj_parts)

        return Response({
            "message": mesaj,
            "basarili_kayit": basarili,
            "otomatik_tespit": oturum_tespit_sayisi,
            "hatalar": hatalar
        }, status=201 if basarili > 0 else 400)


class CombinedResultsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    """
    Her öğrencinin 1. ve 2. oturumunu birleştirir,
    netleri yeniden hesaplar, PUAN'ı hesaplar ve PUAN'a göre sıralı liste döner.
    """

    @swagger_auto_schema(
        operation_summary="Birleştirilmiş Sınav Sonuçları (PUAN'a göre sıralı)",
        operation_description="Seçili deneme için her öğrencinin 1. ve 2. oturumunu birleştirir, netleri ve puanı hesaplayıp puana göre sıralar.",
        manual_parameters=[
            openapi.Parameter(
                name="deneme_id",
                in_=openapi.IN_QUERY,
                type=openapi.TYPE_INTEGER,
                required=False,
                description="Deneme sınavı ID'si (belirtilmezse en son deneme kullanılır)"
            ),
        ]
    )
    def get(self, request):
        from collections import defaultdict
        from .models import AnswerKey, DenemeSinavi

        # 1) Deneme seçimi
        deneme_id = request.query_params.get("deneme_id")
        if deneme_id:
            try:
                deneme_sinavi = DenemeSinavi.objects.get(id=deneme_id)
            except DenemeSinavi.DoesNotExist:
                return Response({"error": "Belirtilen deneme bulunamadı."}, status=404)
        else:
            deneme_sinavi = DenemeSinavi.objects.order_by('-created_at').first()
            if not deneme_sinavi:
                return Response({"error": "Henüz hiç deneme yüklenmemiş."}, status=404)

        # 2) Cevap anahtarlarını çek
        try:
            answer_key_a = AnswerKey.objects.get(deneme_sinavi=deneme_sinavi, kitapcik_turu='A')
            cevap_anahtari_a = {
                "turkce": answer_key_a.turkce,
                "inkilap": answer_key_a.inkilap,
                "din": answer_key_a.din,
                "ingilizce": answer_key_a.ingilizce,
                "matematik": answer_key_a.matematik,
                "fen": answer_key_a.fen,
            }
        except AnswerKey.DoesNotExist:
            cevap_anahtari_a = {}

        try:
            answer_key_b = AnswerKey.objects.get(deneme_sinavi=deneme_sinavi, kitapcik_turu='B')
            cevap_anahtari_b = {
                "turkce": answer_key_b.turkce,
                "inkilap": answer_key_b.inkilap,
                "din": answer_key_b.din,
                "ingilizce": answer_key_b.ingilizce,
                "matematik": answer_key_b.matematik,
                "fen": answer_key_b.fen,
            }
        except AnswerKey.DoesNotExist:
            cevap_anahtari_b = {}

        # 3) Sonuçları çek
        results = StudentResult.objects.filter(deneme_sinavi=deneme_sinavi)

        def hesapla_net(cevaplar, dogru_cevaplar):
            if not cevaplar or not dogru_cevaplar:
                return 0, 0, 0, 0.0
            dogru = yanlis = bos = 0
            for i, cevap in enumerate(cevaplar):
                if i >= len(dogru_cevaplar):
                    break
                if cevap in 'ABCDEF':
                    if cevap == dogru_cevaplar[i]:
                        dogru += 1
                    else:
                        yanlis += 1
                else:
                    bos += 1
            net = dogru - (yanlis / 3)
            return dogru, yanlis, bos, round(net, 2)

        # 4) Aynı öğrencinin 1-2 oturumunu birleştir
        student_data = defaultdict(lambda: {
            'ad': '', 'soyad': '', 'okul_kodu': '', 'ogrenci_no': '',
            'sinif': '', 'cinsiyet': '', 'kitapcik_turu': '',
            'turkce_dogru': 0, 'turkce_yanlis': 0, 'turkce_bos': 0, 'turkce_net': 0.0,
            'tarih_dogru': 0, 'tarih_yanlis': 0, 'tarih_bos': 0, 'tarih_net': 0.0,
            'din_dogru': 0, 'din_yanlis': 0, 'din_bos': 0, 'din_net': 0.0,
            'ingilizce_dogru': 0, 'ingilizce_yanlis': 0, 'ingilizce_bos': 0, 'ingilizce_net': 0.0,
            'matematik_dogru': 0, 'matematik_yanlis': 0, 'matematik_bos': 0, 'matematik_net': 0.0,
            'fen_dogru': 0, 'fen_yanlis': 0, 'fen_bos': 0, 'fen_net': 0.0,
            'toplam_net': 0.0,
            'puan': 0.0,
            'genel_siralama': 0
        })

        for result in results:
            key = f"{result.ogrenci_no}_{result.okul_kodu}"
            stu = student_data[key]

            # Temel bilgiler
            stu['ad'] = result.ad
            stu['soyad'] = result.soyad
            stu['okul_kodu'] = result.okul_kodu
            stu['ogrenci_no'] = result.ogrenci_no
            stu['sinif'] = result.sinif
            stu['cinsiyet'] = result.cinsiyet
            stu['kitapcik_turu'] = result.kitapcik_turu

            # Doğru cevap anahtarı
            if result.kitapcik_turu == 'A' and cevap_anahtari_a:
                keymap = cevap_anahtari_a
            elif result.kitapcik_turu == 'B' and cevap_anahtari_b:
                keymap = cevap_anahtari_b
            else:
                # Anahtar yoksa sadece mevcut net'i toplama ekle
                stu['toplam_net'] += (result.net or 0.0)
                continue

            # Oturum 1
            if str(result.oturum) == "1":
                if result.turkce:
                    d,y,b,n = hesapla_net(result.turkce, keymap["turkce"])
                    stu['turkce_dogru'] += d; stu['turkce_yanlis'] += y; stu['turkce_bos'] += b; stu['turkce_net'] += n
                if result.inkilap:
                    d,y,b,n = hesapla_net(result.inkilap, keymap["inkilap"])
                    stu['tarih_dogru']  += d; stu['tarih_yanlis']  += y; stu['tarih_bos']  += b; stu['tarih_net']  += n
                if result.din:
                    d,y,b,n = hesapla_net(result.din, keymap["din"])
                    stu['din_dogru']    += d; stu['din_yanlis']    += y; stu['din_bos']    += b; stu['din_net']    += n
                if result.ingilizce:
                    d,y,b,n = hesapla_net(result.ingilizce, keymap["ingilizce"])
                    stu['ingilizce_dogru'] += d; stu['ingilizce_yanlis'] += y; stu['ingilizce_bos'] += b; stu['ingilizce_net'] += n

            # Oturum 2
            elif str(result.oturum) == "2":
                if result.matematik:
                    d,y,b,n = hesapla_net(result.matematik, keymap["matematik"])
                    stu['matematik_dogru'] += d; stu['matematik_yanlis'] += y; stu['matematik_bos'] += b; stu['matematik_net'] += n
                if result.fen:
                    d,y,b,n = hesapla_net(result.fen, keymap["fen"])
                    stu['fen_dogru'] += d; stu['fen_yanlis'] += y; stu['fen_bos'] += b; stu['fen_net'] += n

        # 5) Toplam net ve PUAN
        combined_results = []
        for stu in student_data.values():
            stu['toplam_net'] = round(
                (stu['turkce_net'] + stu['tarih_net'] + stu['din_net'] +
                 stu['ingilizce_net'] + stu['matematik_net'] + stu['fen_net']), 2
            )
            nets_for_score = {
                "turkce_net":    stu.get("turkce_net", 0.0),
                "inkilap_net":   stu.get("tarih_net", 0.0),  # tarih=inkilap
                "din_net":       stu.get("din_net", 0.0),
                "ingilizce_net": stu.get("ingilizce_net", 0.0),
                "matematik_net": stu.get("matematik_net", 0.0),
                "fen_net":       stu.get("fen_net", 0.0),
            }
            stu['puan'] = _compute_score(nets_for_score)
            combined_results.append(stu)

        # 6) Sıralama: önce PUAN, eşitse TOPLAM_NET
        combined_results.sort(
            key=lambda x: (x.get('puan', 0.0), x.get('toplam_net', 0.0)),
            reverse=True
        )
        for i, s in enumerate(combined_results, 1):
            s['genel_siralama'] = i

        return Response({
            'results': combined_results,
            'total_students': len(combined_results),
            'deneme_sinavi': {
                'id': deneme_sinavi.id,
                'adi': deneme_sinavi.adi,
                'tarih': deneme_sinavi.tarih,
                'aciklama': deneme_sinavi.aciklama
            }
        })



# =========================
# BULK / STATS
# =========================

class StudentAnswerBulkUpsertAPIView(APIView):
    """
    Beklenen payload:
    {
      "items": [
        {
          "okul_kodu": "7108",
          "ogrenci_no": "00053",
          "ad": "NİSA",
          "soyad": "ATAR",
          "sinif": "8C",
          "cinsiyet": "K",
          "oturum": 1,
          "kitapcik_turu": "A",
          "turkce": "...", "inkilap": "...", "din": "...", "ingilizce": "...",
          "matematik": "...", "fen": "...",
          "net": 12.5,
          "full_raw_line": "..."
        }
      ]
    }
    """
    def post(self, request):
        items = request.data.get('items', []) or []
        created, updated = 0, 0

        for it in items:
            okul_kodu = it.get('okul_kodu') or it.get('okul_no')
            ogrenci_no = it.get('ogrenci_no')
            oturum_val = it.get('oturum')
            if oturum_val is None:
                continue
            oturum_str = str(oturum_val).strip()

            if not okul_kodu or not ogrenci_no or not oturum_str:
                continue

            defaults = {
                'ad': it.get('ad', ''),
                'soyad': it.get('soyad', ''),
                'sinif': it.get('sinif', ''),
                'cinsiyet': it.get('cinsiyet', ''),
                'kitapcik_turu': it.get('kitapcik_turu') or it.get('kitapcik', ''),
                'turkce': it.get('turkce', ''),
                'inkilap': it.get('inkilap', ''),
                'din': it.get('din', ''),
                'ingilizce': it.get('ingilizce', ''),
                'matematik': it.get('matematik', ''),
                'fen': it.get('fen', ''),
                'net': it.get('net', 0),
                'full_raw_line': it.get('full_raw_line', ''),
            }

            obj, is_created = StudentResult.objects.update_or_create(
                okul_kodu=okul_kodu,
                ogrenci_no=ogrenci_no,
                oturum=oturum_str,
                defaults=defaults
            )
            if is_created: created += 1
            else: updated += 1

        return Response({"created": created, "updated": updated}, status=status.HTTP_200_OK)


class StudentResultStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        Model = StudentResult

        gender = (
            Model.objects
            .exclude(cinsiyet="")
            .values('cinsiyet')
            .annotate(value=Count('id'))
            .order_by('cinsiyet')
        )

        kits = (
            Model.objects
            .exclude(kitapcik_turu="")
            .values('kitapcik_turu')
            .annotate(value=Count('id'))
            .order_by('kitapcik_turu')
        )

        monthly = []

        totals = {
            'count': Model.objects.count(),
            'unique_students': (
                Model.objects
                .values('okul_kodu', 'ogrenci_no')
                .distinct()
                .count()
            ),
        }

        return Response({
            'gender': list(gender),
            'kitapcik_turu': list(kits),
            'monthly': monthly,
            'totals': totals,
        }, status=status.HTTP_200_OK)


class StudentResultListCreateAPIView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    queryset = StudentResult.objects.all()
    serializer_class = StudentResultSerializer


class StudentResultDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = StudentResult.objects.all
    serializer_class = StudentResultSerializer


class StudentResultBulkUpsertAPIView(APIView):
    permission_classes = [IsAuthenticated]
    def post(self, request):
        items = request.data
        if not isinstance(items, list):
            return Response({"error": "Liste bekleniyor"}, status=400)

        created, updated = 0, 0
        for raw in items:
            obj, is_created = StudentResult.objects.update_or_create(
                okul_kodu=raw.get("okul_kodu", ""),
                ogrenci_no=raw.get("ogrenci_no", ""),
                oturum=raw.get("oturum", ""),
                defaults={
                    "ad": raw.get("ad", ""),
                    "soyad": raw.get("soyad", ""),
                    "sinif": raw.get("sinif", ""),
                    "cinsiyet": raw.get("cinsiyet", ""),
                    "kitapcik_turu": raw.get("kitapcik_turu", ""),
                    "turkce": raw.get("turkce", ""),
                    "inkilap": raw.get("inkilap", ""),
                    "din": raw.get("din", ""),
                    "ingilizce": raw.get("ingilizce", ""),
                    "matematik": raw.get("matematik", ""),
                    "fen": raw.get("fen", ""),
                    "full_raw_line": raw.get("full_raw_line", ""),
                    "net": raw.get("net", 0),
                }
            )
            created += int(is_created)
            updated += int(not is_created)

        return Response({"created": created, "updated": updated})


# =========================
# SMS LOGIN
# =========================

def rolesUser(user):
    try:
        return list(user.roles.values_list("name", flat=True))
    except Exception:
        return []


def normalize_phone(phone: str) -> str:
    """Sadece rakamları al, baştaki +90/90/0 gibi önekleri temizle."""
    s = re.sub(r"\D", "", str(phone or ""))
    if s.startswith("90"):
        s = s[2:]
    if s.startswith("0"):
        s = s[1:]
    return s


class SendSMSView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Telefon numarasına SMS doğrulama kodu gönderir",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["phone"],
            properties={
                'phone': openapi.Schema(type=openapi.TYPE_STRING, description='Telefon numarası (05XXXXXXXXX)'),
            }
        )
    )
    def post(self, request):
        phone = request.data.get("phone")
        if not phone:
            return Response({"success": False, "error": "Telefon gerekli"}, status=400)

        User = get_user_model()
        if not User.objects.filter(phone=phone).exists():
            return Response({"success": False, "error": "Bu telefon sistemde kayıtlı değil."}, status=404)

        normalized = normalize_phone(phone)
        code = "123456"
        cache.set(f"sms_code_{normalized}", code, timeout=300)

        params = {
            "key": API_KEY,
            "hash": HASH,
            "text": "deneme deneme deneme",
            "receipents": normalized,
            "sender": SENDER,
            "iys": 1,
            "iysList": "BIREYSEL",
        }

        try:
            requests.get(API_URL, params=params, timeout=10)
            return Response({"success": True, "test_code": code}, status=200)
        except Exception as e:
            return Response({"success": False, "error": str(e)}, status=500)


class VerifyCodeView(APIView):
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_description="Telefon numarası ve doğrulama kodu ile giriş yapar. Kod doğruysa JWT token döner.",
        request_body=openapi.Schema(
            type=openapi.TYPE_OBJECT,
            required=["phone", "test_code"],
            properties={
                'phone': openapi.Schema(type=openapi.TYPE_STRING, description='Telefon numarası (05XXXXXXXXX)'),
                'test_code': openapi.Schema(type=openapi.TYPE_STRING, description='Doğrulama kodu (örn: 1234)'),
            },
        )
    )
    def post(self, request):
        phone = request.data.get("phone")
        code = request.data.get("test_code") or request.data.get("code")

        if not phone or not code:
            return Response({"success": False, "error": "Telefon ve kod gereklidir."}, status=400)

        normalized = normalize_phone(phone)
        saved_code = cache.get(f"sms_code_{normalized}")

        if str(code) != "123456" or str(saved_code) != "123456":
            return Response({"success": False, "error": "Kod hatalı veya süresi doldu."}, status=400)

        User = get_user_model()
        user, created = User.objects.get_or_create(
            phone=phone,
            defaults={"is_active": True},
        )
        if created and hasattr(user, "set_unusable_password"):
            user.set_unusable_password()
            user.save()

        user_roles = rolesUser(user)

        refresh = RefreshToken.for_user(user)
        refresh["email"] = getattr(user, "email", "") or ""
        refresh["full_name"] = getattr(user, "full_name", "") or ""
        refresh["roles"] = user_roles

        access = refresh.access_token
        access["email"] = getattr(user, "email", "") or ""
        access["full_name"] = getattr(user, "full_name", "") or ""
        access["roles"] = user_roles

        cache.delete(f"sms_code_{normalized}")

        return Response({
            "success": True,
            "access": str(access),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "email": getattr(user, "email", "") or "",
                "full_name": getattr(user, "full_name", "") or "",
                "roles": user_roles,
            }
        }, status=200)


# =========================
# DENEME SINAVI LİSTESİ (opsiyonel public)
# =========================

class DenemeSinaviListAPIView(APIView):
    """Tüm deneme sınavlarını listeler"""
    permission_classes = [AllowAny]

    @swagger_auto_schema(
        operation_summary="Deneme Sınavları Listesi",
        operation_description="Yüklenmiş tüm deneme sınavlarını listeler"
    )
    def get(self, request):
        from .models import DenemeSinavi

        denemeler = DenemeSinavi.objects.all().order_by('-created_at')

        deneme_listesi = []
        for deneme in denemeler:
            deneme_listesi.append({
                'id': deneme.id,
                'adi': deneme.adi,
                'aciklama': deneme.aciklama,
                'tarih': deneme.tarih,
                'oturum_sayisi': deneme.oturum_sayisi,
                'kitapcik_turleri': deneme.kitapcik_turleri,
                'created_at': deneme.created_at
            })

        return Response({
            'denemeler': deneme_listesi,
            'total_count': len(deneme_listesi)
        })
