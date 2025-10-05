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
    # GET public, yazma işlemleri için altta kontrol var
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
        serializer = EventSerializer(event, data=request.data, partial=True)  # partial=True ile kısmi güncelleme
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventListCreateView(APIView):
    # GET public; POST için altta kontrol var
    permission_classes = [AllowAny]

    def get(self, request):
        events = Event.objects.filter(active=True)  # 🔹 Sadece aktif olanlar
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
            # Google ID token doğrulama
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
            """
            Cevapları normalize eder:
            - Beklenen uzunluğa kadar boş yerler * ile doldurulur
            - A,B,C,D,E,F dışındaki karakterler * ile değiştirilir
            """
            # Eğer cevap beklenen uzunluktan kısaysa, sonuna * ekle
            if len(cevaplar) < expected_length:
                cevaplar = cevaplar.ljust(expected_length, '*')

            # Sadece ilk expected_length kadarını al
            cevaplar = cevaplar[:expected_length]

            # A,B,C,D,E,F dışındaki tüm karakterleri * yap
            normalized = ""
            for char in cevaplar:
                if char.upper() in "ABCDEF":
                    normalized += char.upper()
                else:
                    normalized += "*"

            return normalized

        def analiz_et(ogr_cevaplari: str, dogru_cevaplar: str):
            """
            Öğrenci cevaplarını analiz eder ve doğru/yanlış/boş sayılarını hesaplar
            * karakteri boş cevap olarak sayılır
            """
            dogru, yanlis, bos = 0, 0, 0

            # Uzunluk kontrolü
            expected_length = len(dogru_cevaplar)
            if len(ogr_cevaplari) != expected_length:
                # Bu durumda zaten normalize edilmiş olmalı, ama güvenlik için
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
                    # Bu duruma gelmemeli (normalize edilmişse) ama güvenlik için
                    bos += 1

            # Net = Doğru - (Yanlış ÷ 3)
            net = dogru - (yanlis / 3)
            return dogru, yanlis, bos, round(net, 2)

        def safe_decode(line_bytes):
            """Türkçe karakterleri düzgün okumak için farklı encoding'leri dene"""
            encodings = ['utf-8', 'windows-1254', 'iso-8859-9', 'cp1252']

            for encoding in encodings:
                try:
                    return line_bytes.decode(encoding).strip()
                except (UnicodeDecodeError, UnicodeError):
                    continue

            # Hiçbiri çalışmazsa son çare olarak errors='replace' kullan
            return line_bytes.decode('utf-8', errors='replace').strip()

        def safe_get_field(line, start, end, default=""):
            """String slice işlemini güvenli şekilde yapar"""
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
            """
            Toplam soru sayısının 90 olduğunu kontrol eder
            """
            toplam = len(turkce) + len(inkilap) + len(din) + len(ing) + len(matematik) + len(fen)
            expected = 90  # 20+10+10+10+20+20 = 90

            if toplam != expected:
                raise ValueError(f"Toplam soru sayısı {toplam}, beklenen {expected}")

            return True

        def otomatik_oturum_tespit(line):
            """
            Öğrenci cevaplarına bakarak hangi oturumda olduğunu otomatik tespit eder
            """
            # Cevap alanlarını oku
            turkce_raw = safe_get_field(line, 51, 71).strip()
            inkilap_raw = safe_get_field(line, 71, 81).strip()
            din_raw = safe_get_field(line, 91, 101).strip()
            ing_raw = safe_get_field(line, 111, 121).strip()
            matematik_raw = safe_get_field(line, 131, 151).strip()
            fen_raw = safe_get_field(line, 151, 171).strip()

            def has_answers(raw_answer):
                """Cevap alanında gerçek cevap var mı kontrol eder"""
                if not raw_answer:
                    return False
                # A,B,C,D,E,F harflerinden en az biri varsa cevap var demektir
                return any(char.upper() in "ABCDEF" for char in raw_answer)

            def count_answers(raw_answer):
                """Cevap alanındaki gerçek cevap sayısını döndürür"""
                if not raw_answer:
                    return 0
                return sum(1 for char in raw_answer if char.upper() in "ABCDEF")

            # 1. oturum dersleri (TYT)
            turkce_var = has_answers(turkce_raw)
            inkilap_var = has_answers(inkilap_raw)
            din_var = has_answers(din_raw)
            ing_var = has_answers(ing_raw)

            # 2. oturum dersleri (Sayısal)
            matematik_var = has_answers(matematik_raw)
            fen_var = has_answers(fen_raw)

            # Cevap sayılarını hesapla (daha detaylı analiz için)
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

            # Oturum tespiti mantığı
            oturum_1_cevap_var = turkce_var or inkilap_var or din_var or ing_var
            oturum_2_cevap_var = matematik_var or fen_var

            # Eğer her iki oturuma da cevap vermişse, daha çok cevap verdiği oturumu seç
            if oturum_1_cevap_var and oturum_2_cevap_var:
                return 1 if oturum_1_cevap_sayisi >= oturum_2_cevap_sayisi else 2
            elif oturum_1_cevap_var and not oturum_2_cevap_var:
                return 1  # Sadece 1. oturum derslerine cevap vermiş
            elif oturum_2_cevap_var and not oturum_1_cevap_var:
                return 2  # Sadece 2. oturum derslerine cevap vermiş
            else:
                return 0  # Hiçbirine cevap verilmemiş (hatalı durum)

        hatalar = []
        basarili = 0
        oturum_tespit_sayisi = 0  # Otomatik tespit edilen öğrenci sayısı

        for i, line_bytes in enumerate(uploaded_file.readlines(), start=1):
            try:
                # Türkçe karakter desteği için düzeltilmiş decode
                line = safe_decode(line_bytes)

                # Temel bilgileri oku
                okul_kodu = safe_get_field(line, 0, 10).strip()
                ogrenci_no = safe_get_field(line, 10, 15).strip()
                ad = safe_get_field(line, 15, 25).strip()
                soyad = safe_get_field(line, 25, 35).strip()
                sinif = safe_get_field(line, 35, 37).strip()
                tc_kimlik = safe_get_field(line, 37, 48).strip()
                cinsiyet = safe_get_field(line, 48, 49).strip() or "?"

                # Oturum bilgisini önce normal yoldan oku
                oturum_str = safe_get_field(line, 49, 50).strip()
                try:
                    oturum_from_field = int(oturum_str) if oturum_str.isdigit() else 0
                except:
                    oturum_from_field = 0

                # Eğer oturum bilgisi yoksa veya 0 ise, otomatik tespit et
                otomatik_tespit = False
                if oturum_from_field in [0, None]:
                    oturum = otomatik_oturum_tespit(line)
                    otomatik_tespit = True
                    oturum_tespit_sayisi += 1
                else:
                    oturum = oturum_from_field

                # Eğer otomatik tespit de başarısız olursa hata ver
                if oturum == 0:
                    hatalar.append(f"{i}. satır ({ad} {soyad}): Oturum tespit edilemedi - hiçbir derse cevap verilmemiş")
                    continue

                kitapcik = safe_get_field(line, 50, 51).strip().upper()

                # Ders cevaplarını initialize et
                turkce = inkilap = din = ing = matematik = fen = ""

                # Oturum bazında cevapları oku ve normalize et
                if oturum == 1:
                    # 1. Oturum: Sadece TYT dersleri
                    turkce_raw = safe_get_field(line, 51, 71)
                    inkilap_raw = safe_get_field(line, 71, 81)
                    din_raw = safe_get_field(line, 91, 101)
                    ing_raw = safe_get_field(line, 111, 121)

                    # 1. oturum derslerini normalize et
                    turkce = normalize_cevaplar(turkce_raw, 20)    # 20 soru Türkçe
                    inkilap = normalize_cevaplar(inkilap_raw, 10)  # 10 soru İnkılap
                    din = normalize_cevaplar(din_raw, 10)          # 10 soru Din
                    ing = normalize_cevaplar(ing_raw, 10)          # 10 soru İngilizce

                    # 2. oturum dersleri tamamen boş (çünkü bu oturuma girmemiş)
                    matematik = "*" * 20  # 20 soru boş
                    fen = "*" * 20        # 20 soru boş

                elif oturum == 2:
                    # 2. Oturum: Sadece Sayısal dersler
                    matematik_raw = safe_get_field(line, 131, 151)
                    fen_raw = safe_get_field(line, 151, 171)

                    # 2. oturum derslerini normalize et
                    matematik = normalize_cevaplar(matematik_raw, 20)  # 20 soru Matematik
                    fen = normalize_cevaplar(fen_raw, 20)              # 20 soru Fen

                    # 1. oturum dersleri tamamen boş (çünkü bu oturuma girmemiş)
                    turkce = "*" * 20   # 20 soru boş
                    inkilap = "*" * 10  # 10 soru boş
                    din = "*" * 10      # 10 soru boş
                    ing = "*" * 10      # 10 soru boş

                else:
                    # Bu duruma gelmemeli artık, ama güvenlik için
                    hatalar.append(f"{i}. satır ({ad} {soyad}): Geçersiz oturum numarası: {oturum}")
                    continue

                # Toplam soru sayısı kontrolü
                try:
                    toplam_soru_kontrol(turkce, inkilap, din, ing, matematik, fen)
                except ValueError as e:
                    hatalar.append(f"{i}. satır ({ad} {soyad}): {str(e)}")
                    continue

                # Kitapçık türüne göre uygun cevap anahtarını seç
                cevap_anahtari = cevap_anahtari_a if kitapcik == "A" else cevap_anahtari_b

                # Net hesaplamaları - detaylı analiz
                turkce_analiz = analiz_et(turkce, cevap_anahtari["turkce"])
                inkilap_analiz = analiz_et(inkilap, cevap_anahtari["inkilap"])
                din_analiz = analiz_et(din, cevap_anahtari["din"])
                ing_analiz = analiz_et(ing, cevap_anahtari["ingilizce"])
                mat_analiz = analiz_et(matematik, cevap_anahtari["matematik"])
                fen_analiz = analiz_et(fen, cevap_anahtari["fen"])

                # Net puanlar
                net_turkce = turkce_analiz[3]
                net_inkilap = inkilap_analiz[3]
                net_din = din_analiz[3]
                net_ing = ing_analiz[3]
                net_mat = mat_analiz[3]
                net_fen = fen_analiz[3]

                # Toplam istatistikler (kontrol için)
                toplam_dogru = sum([turkce_analiz[0], inkilap_analiz[0], din_analiz[0],
                                   ing_analiz[0], mat_analiz[0], fen_analiz[0]])
                toplam_yanlis = sum([turkce_analiz[1], inkilap_analiz[1], din_analiz[1],
                                    ing_analiz[1], mat_analiz[1], fen_analiz[1]])
                toplam_bos = sum([turkce_analiz[2], inkilap_analiz[2], din_analiz[2],
                                 ing_analiz[2], mat_analiz[2], fen_analiz[2]])

                # Toplam kontrol: Doğru + Yanlış + Boş = 90 olmalı
                if toplam_dogru + toplam_yanlis + toplam_bos != 90:
                    hatalar.append(f"{i}. satır ({ad} {soyad}): Toplam soru sayısı kontrolü başarısız. "
                                   f"Doğru: {toplam_dogru}, Yanlış: {toplam_yanlis}, Boş: {toplam_bos}")
                    continue

                total_net = round(net_turkce + net_inkilap + net_din + net_ing + net_mat + net_fen, 2)

                # Veritabanına kaydet
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

        # Sonuç mesajını oluştur
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
    permission_classes = [AllowAny]
    """
    Her öğrencinin 1. ve 2. oturumunu birleştirerek genel sonuç tablosu oluşturur
    """
    @swagger_auto_schema(
        operation_summary="Birleştirilmiş Sınav Sonuçları",
        operation_description="Seçili deneme için her öğrencinin 1. ve 2. oturumunu birleştirerek net puana göre sıralı tablo döndürür",
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
        from django.db.models import Sum, Q
        from collections import defaultdict
        from .models import AnswerKey, DenemeSinavi

        # Deneme ID'sini al veya en son denemeyi seç
        deneme_id = request.query_params.get("deneme_id")

        if deneme_id:
            try:
                deneme_sinavi = DenemeSinavi.objects.get(id=deneme_id)
            except DenemeSinavi.DoesNotExist:
                return Response({"error": "Belirtilen deneme bulunamadı."}, status=404)
        else:
            # En son denemeyi al
            deneme_sinavi = DenemeSinavi.objects.order_by('-created_at').first()
            if not deneme_sinavi:
                return Response({"error": "Henüz hiç deneme yüklenmemiş."}, status=404)

        # Seçili deneme için cevap anahtarlarını al
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

        # Seçili denemeye ait öğrenci sonuçlarını al
        results = StudentResult.objects.filter(deneme_sinavi=deneme_sinavi)

        # Öğrenci numarası normalize fonksiyonu
        def normalize_student_number(student_no):
            """Öğrenci numarasını normalize et (önünde sıfır olmadan)"""
            if not student_no:
                return ""
            # String'e çevir ve önündeki sıfırları kaldır
            return str(student_no).lstrip('0') or '0'

        # İlk geçişte öğrenci numaralarını normalize et ve ad-soyad eşleşmelerini tespit et
        student_mappings = {}  # {(ad, soyad, okul_kodu): canonical_student_no}
        normalized_results = []

        for result in results:
            normalized_no = normalize_student_number(result.ogrenci_no)
            key = (result.ad.strip().upper(), result.soyad.strip().upper(), result.okul_kodu)

            # Aynı ad-soyad-okul kombinasyonu için canonical öğrenci numarasını belirle
            if key in student_mappings:
                # Mevcut kayıt varsa, daha uzun olan (daha detaylı) numarayı kullan
                existing_no = student_mappings[key]
                if len(str(result.ogrenci_no)) > len(str(existing_no)):
                    student_mappings[key] = result.ogrenci_no
            else:
                student_mappings[key] = result.ogrenci_no

            normalized_results.append(result)

        # Öğrenci bazında birleştir
        from collections import defaultdict
        student_data = defaultdict(lambda: {
            'ad': '',
            'soyad': '',
            'okul_kodu': '',
            'ogrenci_no': '',
            'sinif': '',
            'cinsiyet': '',
            'kitapcik_turu': '',
            'turkce_dogru': 0, 'turkce_yanlis': 0, 'turkce_bos': 0, 'turkce_net': 0,
            'tarih_dogru': 0, 'tarih_yanlis': 0, 'tarih_bos': 0, 'tarih_net': 0,
            'din_dogru': 0, 'din_yanlis': 0, 'din_bos': 0, 'din_net': 0,
            'ingilizce_dogru': 0, 'ingilizce_yanlis': 0, 'ingilizce_bos': 0, 'ingilizce_net': 0,
            'matematik_dogru': 0, 'matematik_yanlis': 0, 'matematik_bos': 0, 'matematik_net': 0,
            'fen_dogru': 0, 'fen_yanlis': 0, 'fen_bos': 0, 'fen_net': 0,
            'toplam_net': 0,
            'genel_siralama': 0
        })

        def hesapla_net(cevaplar, dogru_cevaplar):
            """Cevapları analiz ederek doğru, yanlış, boş sayılarını ve net skorunu hesaplar"""
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
            # Net = Doğru - (Yanlış ÷ 3)
            net = dogru - (yanlis / 3)
            return dogru, yanlis, bos, round(net, 2)

        # Her sonuç için işlem yap
        for result in normalized_results:
            # Ad-soyad-okul anahtarını kullanarak canonical öğrenci numarasını al
            name_key = (result.ad.strip().upper(), result.soyad.strip().upper(), result.okul_kodu)
            canonical_student_no = student_mappings.get(name_key, result.ogrenci_no)

            # Unique key olarak canonical öğrenci no ve okul kodunu kullan
            key = f"{canonical_student_no}_{result.okul_kodu}"
            student = student_data[key]

            # Temel bilgileri güncelle (canonical öğrenci numarasını kullan)
            student['ad'] = result.ad
            student['soyad'] = result.soyad
            student['okul_kodu'] = result.okul_kodu
            student['ogrenci_no'] = canonical_student_no  # Canonical numarayı kullan
            student['sinif'] = result.sinif
            student['cinsiyet'] = result.cinsiyet
            student['kitapcik_turu'] = result.kitapcik_turu

            # Kitapçık türüne göre doğru cevap anahtarını seç
            if result.kitapcik_turu == 'A' and cevap_anahtari_a:
                cevap_anahtari = cevap_anahtari_a
            elif result.kitapcik_turu == 'B' and cevap_anahtari_b:
                cevap_anahtari = cevap_anahtari_b
            else:
                # Cevap anahtarı yoksa sadece mevcut net'i kullan
                student['toplam_net'] += (result.net or 0)
                continue

            # Ders bazında gerçek hesaplama
            if result.oturum == 1 or result.oturum == "1":
                # 1. oturum dersleri - turkce, inkilap(tarih), din, ingilizce
                if result.turkce:
                    dogru, yanlis, bos, net = hesapla_net(result.turkce, cevap_anahtari["turkce"])
                    student['turkce_dogru'] += dogru
                    student['turkce_yanlis'] += yanlis
                    student['turkce_bos'] += bos
                    student['turkce_net'] += net

                if result.inkilap:
                    dogru, yanlis, bos, net = hesapla_net(result.inkilap, cevap_anahtari["inkilap"])
                    student['tarih_dogru'] += dogru
                    student['tarih_yanlis'] += yanlis
                    student['tarih_bos'] += bos
                    student['tarih_net'] += net

                if result.din:
                    dogru, yanlis, bos, net = hesapla_net(result.din, cevap_anahtari["din"])
                    student['din_dogru'] += dogru
                    student['din_yanlis'] += yanlis
                    student['din_bos'] += bos
                    student['din_net'] += net

                if result.ingilizce:
                    dogru, yanlis, bos, net = hesapla_net(result.ingilizce, cevap_anahtari["ingilizce"])
                    student['ingilizce_dogru'] += dogru
                    student['ingilizce_yanlis'] += yanlis
                    student['ingilizce_bos'] += bos
                    student['ingilizce_net'] += net

            elif result.oturum == 2 or result.oturum == "2":
                # 2. oturum dersleri - matematik, fen
                if result.matematik:
                    dogru, yanlis, bos, net = hesapla_net(result.matematik, cevap_anahtari["matematik"])
                    student['matematik_dogru'] += dogru
                    student['matematik_yanlis'] += yanlis
                    student['matematik_bos'] += bos
                    student['matematik_net'] += net

                if result.fen:
                    dogru, yanlis, bos, net = hesapla_net(result.fen, cevap_anahtari["fen"])
                    student['fen_dogru'] += dogru
                    student['fen_yanlis'] += yanlis
                    student['fen_bos'] += bos
                    student['fen_net'] += net

            # Toplam net hesapla
            student['toplam_net'] = (student['turkce_net'] + student['tarih_net'] +
                                     student['din_net'] + student['ingilizce_net'] +
                                     student['matematik_net'] + student['fen_net'])

        # Listeye dönüştür ve sırala
        combined_results = list(student_data.values())
        combined_results.sort(key=lambda x: x['toplam_net'], reverse=True)

        # Sıralama numarası ekle
        for i, student in enumerate(combined_results, 1):
            student['genel_siralama'] = i

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
                # anahtar alan eksikse atla
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
            if is_created:
                created += 1
            else:
                updated += 1

        return Response({"created": created, "updated": updated}, status=status.HTTP_200_OK)


class StudentResultStatsAPIView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        Model = StudentResult

        # Pie: cinsiyet
        gender = (
            Model.objects
            .exclude(cinsiyet="")
            .values('cinsiyet')
            .annotate(value=Count('id'))
            .order_by('cinsiyet')
        )

        # Pie: kitapçık türü
        kits = (
            Model.objects
            .exclude(kitapcik_turu="")
            .values('kitapcik_turu')
            .annotate(value=Count('id'))
            .order_by('kitapcik_turu')
        )

        # Line: aylık kayıt (created_at yoksa boş)
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
    permission_classes = [AllowAny]
    queryset = StudentResult.objects.all()
    serializer_class = StudentResultSerializer


class StudentResultDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [AllowAny]
    queryset = StudentResult.objects.all
    serializer_class = StudentResultSerializer


class StudentResultBulkUpsertAPIView(APIView):
    permission_classes = [AllowAny]
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
    """
    Sadece rakamları al, baştaki +90/90/0 gibi önekleri temizle.
    05XXXXXXXXX, 5XXXXXXXXX veya +905XXXXXXXXX → 5XXXXXXXXX
    """
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
        cache.set(f"sms_code_{normalized}", code, timeout=300)  # 5 dk

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
    """
    Tüm deneme sınavlarını listeler
    """
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
