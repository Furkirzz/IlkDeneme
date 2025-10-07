# lessons/views.py
from django.db import transaction
from rest_framework import viewsets, status, serializers
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import calendar

from drf_spectacular.utils import (
    extend_schema, extend_schema_view, OpenApiResponse, OpenApiExample, inline_serializer
)

from accounts.models import CustomUser
from .models import Lesson, Attendance
from .serializers import (
    LessonSerializer, LessonDetailSerializer,
    AttendanceSerializer, UserMiniSerializer, ClassroomMiniSerializer
)
# lessons/views.py - Öğrenci İstatistik View'leri

from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q
from datetime import datetime, timedelta
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes

from accounts.models import CustomUser, StudentProfile, TeacherProfile
from .models import Lesson, Attendance
from .serializers import UserMiniSerializer
from .serializers import LessonSerializer, LessonDetailSerializer, AttendanceSerializer

# lessons/views.py (güncellenmiş kritik kısımlar)
from datetime import datetime, timedelta, time
from django.utils.dateparse import parse_time as dj_parse_time
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiExample, OpenApiParameter
from django.db.models import Q

# --- yardımcılar -------------------------------------------------------------
def _parse_hhmm_or_hhmmss(val: str):
    """
    '09:00' veya '09:00:00' -> datetime.time
    Uyumlu değilse None döner.
    """
    if not val:
        return None
    # Django'nun parse_time'ı HH:MM ve HH:MM:SS'yi destekler
    t = dj_parse_time(val)
    return t

def _validate_30_min_step(t: time):
    """00 veya 30 dakikalık slot doğrulaması."""
    return t is not None and t.minute in (0, 30) and t.second == 0 and t.microsecond == 0

def _coerce_payload_times(data: dict):
    """
    create/update istekleri için HH:MM gelenleri HH:MM:SS'e normalize eder.
    Ayrıca 30 dk kuralını ihlal ediyorsa ValidationError mesajı üretmek için
    (None döndürmeyelim; views içinde kontrol edeceğiz).
    """
    out = data.copy()
    for key in ("start_time", "end_time"):
        if key in out and out[key] not in (None, ""):
            t = _parse_hhmm_or_hhmmss(str(out[key]))
            if t is None:
                # serializer zaten yakalayacak ama mesajı netleştirelim
                out[key] = out[key]  # dokunma; serializer invalid diyecek
            else:
                # normalize: HH:MM:SS string
                out[key] = t.strftime("%H:%M:%S")
    return out


# ==================== DERS LİSTELE (FİLTRELİ) ====================
@extend_schema(
    tags=["Lessons"],
    summary="Tüm dersleri listele (filtreli)",
    description="Sistemdeki tüm dersleri döndürür. Tarih/saat aralığına göre filtrelenebilir.",
    parameters=[
        OpenApiParameter(
            name="date",
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            description="Ders tarihi (YYYY-MM-DD)",
            required=False,
        ),
        OpenApiParameter(
            name="start_time_gte",
            type=OpenApiTypes.TIME,
            location=OpenApiParameter.QUERY,
            description="Başlangıç saati alt sınırı (HH:MM veya HH:MM:SS)",
            required=False,
        ),
        OpenApiParameter(
            name="end_time_lte",
            type=OpenApiTypes.TIME,
            location=OpenApiParameter.QUERY,
            description="Bitiş saati üst sınırı (HH:MM veya HH:MM:SS)",
            required=False,
        ),
    ],
    responses={200: LessonSerializer(many=True)}
)
@api_view(['GET'])
@permission_classes([AllowAny])
def list_lessons(request):
    """
    Tüm dersleri listeler. İsteğe bağlı filtreler:
      - ?date=YYYY-MM-DD
      - ?start_time_gte=HH:MM
      - ?end_time_lte=HH:MM
    """
    qs = Lesson.objects.select_related("teacher", "classroom").all()

    date_str = request.query_params.get("date")
    s_gte_str = request.query_params.get("start_time_gte")
    e_lte_str = request.query_params.get("end_time_lte")

    if date_str:
        qs = qs.filter(date=date_str)

    # Saat filtreleri hem HH:MM hem HH:MM:SS kabul eder
    s_gte = _parse_hhmm_or_hhmmss(s_gte_str) if s_gte_str else None
    e_lte = _parse_hhmm_or_hhmmss(e_lte_str) if e_lte_str else None

    if s_gte:
        qs = qs.filter(start_time__gte=s_gte)
    if e_lte:
        qs = qs.filter(end_time__lte=e_lte)

    serializer = LessonSerializer(qs.order_by("date", "start_time"), many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

# ==================== DERS DETAYI ====================

@extend_schema(
    tags=["Lessons"],
    summary="Ders detayını getir",
    description="Belirtilen ID'li dersin detaylarını ve varsa mevcut yoklama kayıtlarını döndürür.",
    responses={
        200: OpenApiResponse(description="Başarılı"),
        404: OpenApiResponse(description="Ders bulunamadı"),
    }
)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_lesson_detail(request, lesson_id):
    """
    Ders detayını getirir (+ mevcut yoklamalar).
    Saat alanlarını HH:MM olarak döner.
    """
    # teacher ve classroom'u tek sorguda al; yoklamalar için student'i de çek
    lesson = get_object_or_404(
        Lesson.objects.select_related("teacher", "classroom"),
        id=lesson_id
    )

    # Bu derse ait mevcut yoklamalar (öğrenci adıyla sıralı)
    attendances = (
        Attendance.objects
        .filter(lesson=lesson)
        .select_related("student")
        .order_by("student__full_name")
    )

    # Zamanları HH:MM formatlayalım
    def _fmt_time(t):
        return t.strftime("%H:%M") if t else None

    payload = {
        "id": lesson.id,
        "date": lesson.date,  # ISO (YYYY-MM-DD) olarak serialize edilir
        "start_time": _fmt_time(lesson.start_time),
        "end_time": _fmt_time(lesson.end_time),
        "description": lesson.description,
        "teacher": UserMiniSerializer(lesson.teacher).data if lesson.teacher else None,
        "classroom": ClassroomMiniSerializer(lesson.classroom).data if lesson.classroom else None,
        "attendances": AttendanceSerializer(attendances, many=True).data,
    }

    return Response(payload, status=status.HTTP_200_OK)

# ==================== DERS OLUŞTUR ====================
@extend_schema(
    tags=["Lessons"],
    summary="Yeni ders oluştur",
    description="Yeni bir ders kaydı oluşturur. start_time ve end_time HH:MM (veya HH:MM:SS) kabul eder; 30 dakikalık dilim kuralı uygulanır.",
    request=LessonSerializer,
    responses={201: LessonSerializer, 400: OpenApiResponse(description="Geçersiz veri")},
)
@api_view(['POST'])
@permission_classes([AllowAny])
def create_lesson(request):
    """Yeni ders oluşturur (30 dk slot doğrulaması içerir)."""
    data = _coerce_payload_times(request.data)

    # 30 dk kontrolü için parse edelim
    st = _parse_hhmm_or_hhmmss(data.get("start_time"))
    et = _parse_hhmm_or_hhmmss(data.get("end_time"))
    errors = {}
    if st and not _validate_30_min_step(st):
        errors["start_time"] = ["Saat 30 dakikalık dilim olmalı (HH:00 veya HH:30)."]
    if et and not _validate_30_min_step(et):
        errors["end_time"] = ["Saat 30 dakikalık dilim olmalı (HH:00 veya HH:30)."]
    if st and et and et <= st:
        errors["end_time"] = ["Bitiş saati başlangıçtan sonra olmalı."]
    if errors:
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)

    serializer = LessonSerializer(data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== DERS GÜNCELLE ====================
@extend_schema(
    tags=["Lessons"],
    summary="Dersi güncelle",
    description="Mevcut bir dersin tüm bilgilerini günceller. start_time/end_time HH:MM kabul eder; 30 dk kuralı uygulanır.",
    request=LessonSerializer,
    responses={200: LessonSerializer, 400: OpenApiResponse(description="Geçersiz veri"), 404: OpenApiResponse(description="Ders bulunamadı")},
)
@api_view(['PUT'])
@permission_classes([AllowAny])
def update_lesson(request, lesson_id):
    try:
        lesson = Lesson.objects.get(id=lesson_id)
    except Lesson.DoesNotExist:
        return Response({"detail": "Ders bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

    data = _coerce_payload_times(request.data)

    st = _parse_hhmm_or_hhmmss(data.get("start_time"))
    et = _parse_hhmm_or_hhmmss(data.get("end_time"))
    errors = {}
    if st and not _validate_30_min_step(st):
        errors["start_time"] = ["Saat 30 dakikalık dilim olmalı (HH:00 veya HH:30)."]
    if et and not _validate_30_min_step(et):
        errors["end_time"] = ["Saat 30 dakikalık dilim olmalı (HH:00 veya HH:30)."]
    if st and et and et <= st:
        errors["end_time"] = ["Bitiş saati başlangıçtan sonra olmalı."]
    if errors:
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)

    serializer = LessonSerializer(lesson, data=data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ==================== DERS KISMİ GÜNCELLE ====================
@extend_schema(
    tags=["Lessons"],
    summary="Dersi kısmi güncelle",
    description="Belirli alanları günceller. start_time/end_time HH:MM kabul eder; 30 dk kuralı uygulanır.",
    request=LessonSerializer,
    responses={200: LessonSerializer, 400: OpenApiResponse(description="Geçersiz veri"), 404: OpenApiResponse(description="Ders bulunamadı")},
)
@api_view(['PATCH'])
@permission_classes([AllowAny])
def partial_update_lesson(request, lesson_id):
    try:
        lesson = Lesson.objects.get(id=lesson_id)
    except Lesson.DoesNotExist:
        return Response({"detail": "Ders bulunamadı."}, status=status.HTTP_404_NOT_FOUND)

    data = _coerce_payload_times(request.data)

    # yalnız gönderilen alanlar doğrulansın
    st = _parse_hhmm_or_hhmmss(data.get("start_time")) if "start_time" in data else None
    et = _parse_hhmm_or_hhmmss(data.get("end_time")) if "end_time" in data else None
    errors = {}
    if st and not _validate_30_min_step(st):
        errors["start_time"] = ["Saat 30 dakikalık dilim olmalı (HH:00 veya HH:30)."]
    if et and not _validate_30_min_step(et):
        errors["end_time"] = ["Saat 30 dakikalık dilim olmalı (HH:00 veya HH:30)."]

    # PATCH’te başlangıç/bitiş ikilisini birlikte değerlendirelim:
    # eldeki (varsa payload’tan, yoksa mevcut kayıttan) değerlere bakalım
    st_eff = st or lesson.start_time
    et_eff = et or lesson.end_time
    if st_eff and et_eff and et_eff <= st_eff:
        errors["end_time"] = ["Bitiş saati başlangıçtan sonra olmalı."]

    if errors:
        return Response(errors, status=status.HTTP_400_BAD_REQUEST)

    serializer = LessonSerializer(lesson, data=data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# ==================== DERS SİL ====================
@extend_schema(
    tags=["Lessons"],
    summary="Dersi sil",
    description="Belirtilen ID'ye sahip dersi sistemden siler.",
    responses={
        204: OpenApiResponse(description="Ders başarıyla silindi"),
        404: OpenApiResponse(description="Ders bulunamadı"),
    }
)
@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_lesson(request, lesson_id):
    """Dersi siler"""
    try:
        lesson = Lesson.objects.get(id=lesson_id)
    except Lesson.DoesNotExist:
        return Response({"detail": "Ders bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
    
    lesson.delete()
    return Response({"detail": "Ders başarıyla silindi."}, status=status.HTTP_204_NO_CONTENT)


# ==================== YOKLAMA LİSTESİNİ GETİR ====================
@extend_schema(
    tags=["Attendance"],
    summary="Ders yoklama listesini getir",
    description="Dersin sınıf roster'ı ve mevcut yoklama kayıtlarını döndürür.",
    responses={
        200: OpenApiResponse(
            response=inline_serializer(
                name="AttendanceRosterResponse",
                fields={
                    "lesson": inline_serializer(
                        name="LessonMini",
                        fields={
                            "id": serializers.IntegerField(),
                            "date": serializers.DateField(),
                            "start_time": serializers.TimeField(),
                            "end_time": serializers.TimeField(),
                            "teacher": UserMiniSerializer(),
                            "classroom": ClassroomMiniSerializer(),
                        }
                    ),
                    "roster": serializers.ListField(
                        child=inline_serializer(
                            name="RosterItem",
                            fields={
                                "student": UserMiniSerializer(),
                                "attendance": AttendanceSerializer(allow_null=True),
                            }
                        )
                    )
                }
            ),
            description="Ders ve öğrenci yoklama listesi"
        ),
        400: OpenApiResponse(description="Dersin sınıfı yok"),
        404: OpenApiResponse(description="Ders bulunamadı"),
    },
    examples=[
        OpenApiExample(
            "Yoklama listesi örneği",
            value={
                "lesson": {
                    "id": 15,
                    "date": "2025-10-03",
                    "start_time": "09:00:00",
                    "end_time": "09:40:00",
                    "teacher": {"id": 7, "full_name": "Ali Öğretmen", "email": "ali@okul.tr", "profile_type": "teacher"},
                    "classroom": {"id": 3, "name": "10-A", "grade_level": 10}
                },
                "roster": [
                    {
                        "student": {"id": 21, "full_name": "Ayşe", "email": "ayse@okul.tr", "profile_type": "student"},
                        "attendance": {
                            "id": 112, "lesson": 15, "student": 21,
                            "student_detail": {"id": 21, "full_name": "Ayşe", "email": "ayse@okul.tr", "profile_type": "student"},
                            "status": "present", "notes": "", "recorded_at": "2025-10-03T09:10:02Z"
                        }
                    },
                    {
                        "student": {"id": 22, "full_name": "Mehmet", "email": "mehmet@okul.tr", "profile_type": "student"},
                        "attendance": None
                    }
                ]
            },
            response_only=True,
        ),
    ]
)
@api_view(['GET'])
@permission_classes([AllowAny])
def get_attendance_roster(request, lesson_id):
    """Ders için yoklama listesi getirir"""
    try:
        lesson = Lesson.objects.select_related("teacher", "classroom").get(id=lesson_id)
    except Lesson.DoesNotExist:
        return Response({"detail": "Ders bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
    
    if not lesson.classroom:
        return Response(
            {"detail": "Bu dersin 'classroom' alanı boş. Sınıf atayın."},
            status=status.HTTP_400_BAD_REQUEST
        )

    students_qs = CustomUser.objects.filter(
        profile_type=CustomUser.ProfileType.STUDENT,
        student_profile__classroom=lesson.classroom
    )

    existing = {
        a.student_id: a 
        for a in Attendance.objects.filter(lesson=lesson).select_related("student")
    }
    
    roster = []
    for stu in students_qs:
        att = existing.get(stu.id)
        roster.append({
            "student": UserMiniSerializer(stu).data,
            "attendance": AttendanceSerializer(att).data if att else None
        })
    
    payload = {
        "lesson": {
            "id": lesson.id,
            "date": lesson.date,
            "start_time": lesson.start_time,
            "end_time": lesson.end_time,
            "teacher": UserMiniSerializer(lesson.teacher).data,
            "classroom": ClassroomMiniSerializer(lesson.classroom).data,
        },
        "roster": roster
    }
    return Response(payload, status=status.HTTP_200_OK)


# ==================== TOPLU YOKLAMA KAYDET ====================
@extend_schema(
    tags=["Attendance"],
    summary="Toplu yoklama kaydet (Upsert)",
    description="Birden fazla öğrenci için yoklama kaydı oluşturur veya günceller.",
    request=inline_serializer(
        name="AttendanceBulkUpsertRequest",
        fields={
            "items": serializers.ListField(
                child=inline_serializer(
                    name="AttendanceUpsertItem",
                    fields={
                        "student": serializers.IntegerField(help_text="Öğrenci ID"),
                        "status": serializers.ChoiceField(
                            choices=[("present", "Mevcut"), ("absent", "Devamsız"), ("late", "Geç Kaldı")],
                            help_text="Yoklama durumu"
                        ),
                        "notes": serializers.CharField(
                            allow_blank=True, 
                            allow_null=True, 
                            required=False,
                            help_text="Notlar"
                        ),
                    }
                ),
                help_text="Toplu yoklama girdileri"
            )
        }
    ),
    responses={
        200: OpenApiResponse(
            response=inline_serializer(
                name="AttendanceBulkResponse",
                fields={
                    "updated": serializers.ListField(
                        child=AttendanceSerializer(),
                        help_text="Oluşan/Güncellenen yoklama kayıtları"
                    ),
                    "errors": serializers.ListField(
                        child=inline_serializer(
                            name="AttendanceBulkError",
                            fields={
                                "index": serializers.IntegerField(),
                                "student": serializers.IntegerField(),
                                "error": serializers.CharField(),
                            }
                        ),
                        help_text="Validasyon hataları"
                    ),
                }
            ),
            description="Başarılı toplu upsert"
        ),
        400: OpenApiResponse(description="Hatalı istek"),
        404: OpenApiResponse(description="Ders bulunamadı"),
    },
    examples=[
        OpenApiExample(
            "Toplu yoklama kaydetme örneği",
            value={
                "items": [
                    {"student": 21, "status": "present", "notes": "—"},
                    {"student": 22, "status": "absent", "notes": "Raporlu"},
                    {"student": 23, "status": "late", "notes": "10 dakika geç geldi"}
                ]
            },
            request_only=True,
        ),
    ]
)
@api_view(['POST'])
@permission_classes([AllowAny])
def bulk_upsert_attendance(request, lesson_id):
    """Toplu yoklama kaydı oluşturur veya günceller"""
    try:
        lesson = Lesson.objects.select_related("teacher", "classroom").get(id=lesson_id)
    except Lesson.DoesNotExist:
        return Response({"detail": "Ders bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
    
    if not lesson.classroom:
        return Response(
            {"detail": "Bu dersin 'classroom' alanı boş. Sınıf atayın."},
            status=status.HTTP_400_BAD_REQUEST
        )

    items = request.data.get("items")
    if not items:
        return Response(
            {"detail": "Gönderimde 'items' listesi bulunamadı."},
            status=status.HTTP_400_BAD_REQUEST
        )

    students_qs = CustomUser.objects.filter(
        profile_type=CustomUser.ProfileType.STUDENT,
        student_profile__classroom=lesson.classroom
    )
    valid_student_ids = set(students_qs.values_list("id", flat=True))
    
    upserted, errors = [], []

    with transaction.atomic():
        for i, row in enumerate(items):
            student_id = row.get("student")
            status_val = row.get("status")
            notes_val = row.get("notes", None)

            if student_id not in valid_student_ids:
                errors.append({
                    "index": i,
                    "student": student_id,
                    "error": "Öğrenci bu sınıfa ait değil."
                })
                continue

            try:
                stu = CustomUser.objects.get(
                    id=student_id,
                    profile_type=CustomUser.ProfileType.STUDENT
                )
            except CustomUser.DoesNotExist:
                errors.append({
                    "index": i,
                    "student": student_id,
                    "error": "Geçersiz öğrenci."
                })
                continue

            obj, _ = Attendance.objects.update_or_create(
                lesson=lesson,
                student=stu,
                defaults={"status": status_val, "notes": notes_val}
            )
            upserted.append(AttendanceSerializer(obj).data)

    return Response(
        {"updated": upserted, "errors": errors},
        status=(status.HTTP_200_OK if upserted else status.HTTP_400_BAD_REQUEST)
    )


# ==================== TEK YOKLAMA KAYDET/GÜNCELLE ====================
@extend_schema(
    tags=["Attendance"],
    summary="Tek öğrenci yoklama kaydet/güncelle",
    description="Belirli bir öğrenci için yoklama kaydı oluşturur veya günceller.",
    request=inline_serializer(
        name="SingleAttendanceRequest",
        fields={
            "student": serializers.IntegerField(help_text="Öğrenci ID"),
            "status": serializers.ChoiceField(
                choices=[("present", "Mevcut"), ("absent", "Devamsız"), ("late", "Geç Kaldı")]
            ),
            "notes": serializers.CharField(allow_blank=True, allow_null=True, required=False),
        }
    ),
    responses={
        200: AttendanceSerializer,
        400: OpenApiResponse(description="Geçersiz veri"),
        404: OpenApiResponse(description="Ders veya öğrenci bulunamadı"),
    }
)
@api_view(['POST'])
@permission_classes([AllowAny])
def save_single_attendance(request, lesson_id):
    """Tek öğrenci için yoklama kaydeder"""
    try:
        lesson = Lesson.objects.select_related("teacher", "classroom").get(id=lesson_id)
    except Lesson.DoesNotExist:
        return Response({"detail": "Ders bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
    
    if not lesson.classroom:
        return Response(
            {"detail": "Bu dersin 'classroom' alanı boş. Sınıf atayın."},
            status=status.HTTP_400_BAD_REQUEST
        )

    student_id = request.data.get("student")
    status_val = request.data.get("status")
    notes_val = request.data.get("notes", "")

    if not student_id or not status_val:
        return Response(
            {"detail": "'student' ve 'status' alanları gereklidir."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        student = CustomUser.objects.get(
            id=student_id,
            profile_type=CustomUser.ProfileType.STUDENT,
            student_profile__classroom=lesson.classroom
        )
    except CustomUser.DoesNotExist:
        return Response(
            {"detail": "Öğrenci bulunamadı veya bu sınıfa ait değil."},
            status=status.HTTP_404_NOT_FOUND
        )

    obj, created = Attendance.objects.update_or_create(
        lesson=lesson,
        student=student,
        defaults={"status": status_val, "notes": notes_val}
    )

    return Response(
        AttendanceSerializer(obj).data,
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK
    )


# ==================== YOKLAMA SİL ====================
@extend_schema(
    tags=["Attendance"],
    summary="Yoklama kaydını sil",
    description="Belirtilen ID'ye sahip yoklama kaydını siler.",
    responses={
        204: OpenApiResponse(description="Yoklama kaydı silindi"),
        404: OpenApiResponse(description="Yoklama kaydı bulunamadı"),
    }
)
@api_view(['DELETE'])
@permission_classes([AllowAny])
def delete_attendance(request, attendance_id):
    """Yoklama kaydını siler"""
    try:
        attendance = Attendance.objects.get(id=attendance_id)
    except Attendance.DoesNotExist:
        return Response(
            {"detail": "Yoklama kaydı bulunamadı."},
            status=status.HTTP_404_NOT_FOUND
        )
    
    attendance.delete()
    return Response(
        {"detail": "Yoklama kaydı başarıyla silindi."},
        status=status.HTTP_204_NO_CONTENT
    )


# ==================== SINIF ÖĞRENCİLERİNİ LİSTELE ====================
@extend_schema(
    tags=["Lessons"],
    summary="Dersin sınıfındaki tüm öğrencileri listele",
    description="Belirtilen dersin bağlı olduğu sınıftaki tüm öğrencileri döndürür.",
    responses={
        200: OpenApiResponse(
            response=inline_serializer(
                name="ClassroomStudentsResponse",
                fields={
                    "lesson_id": serializers.IntegerField(),
                    "classroom": ClassroomMiniSerializer(),
                    "students": serializers.ListField(
                        child=UserMiniSerializer(),
                        help_text="Sınıftaki tüm öğrenciler"
                    ),
                    "total_students": serializers.IntegerField(help_text="Toplam öğrenci sayısı"),
                }
            ),
            description="Sınıftaki öğrenci listesi"
        ),
        400: OpenApiResponse(description="Dersin sınıfı yok"),
        404: OpenApiResponse(description="Ders bulunamadı"),
    },
    examples=[
        OpenApiExample(
            "Sınıf öğrencileri örneği",
            value={
                "lesson_id": 15,
                "classroom": {
                    "id": 3,
                    "name": "10-A",
                    "grade_level": 10
                },
                "students": [
                    {
                        "id": 21,
                        "full_name": "Ayşe Yılmaz",
                        "email": "ayse@okul.tr",
                        "profile_type": "student"
                    },
                    {
                        "id": 22,
                        "full_name": "Mehmet Demir",
                        "email": "mehmet@okul.tr",
                        "profile_type": "student"
                    },
                    {
                        "id": 23,
                        "full_name": "Zeynep Kaya",
                        "email": "zeynep@okul.tr",
                        "profile_type": "student"
                    }
                ],
                "total_students": 3
            },
            response_only=True,
        ),
    ]
)
@api_view(['GET'])
@permission_classes([AllowAny])
def list_classroom_students(request, lesson_id):
    """Dersin sınıfındaki tüm öğrencileri listeler"""
    try:
        lesson = Lesson.objects.select_related("classroom").get(id=lesson_id)
    except Lesson.DoesNotExist:
        return Response({"detail": "Ders bulunamadı."}, status=status.HTTP_404_NOT_FOUND)
    
    if not lesson.classroom:
        return Response(
            {"detail": "Bu dersin 'classroom' alanı boş. Sınıf atayın."},
            status=status.HTTP_400_BAD_REQUEST
        )

    students = CustomUser.objects.filter(
        profile_type=CustomUser.ProfileType.STUDENT,
        student_profile__classroom=lesson.classroom
    ).order_by('full_name')

    payload = {
        "lesson_id": lesson.id,
        "classroom": ClassroomMiniSerializer(lesson.classroom).data,
        "students": UserMiniSerializer(students, many=True).data,
        "total_students": students.count()
    }
    
    return Response(payload, status=status.HTTP_200_OK)



@extend_schema(
    tags=["Student Statistics"],
    summary="Öğrenci katılım istatistikleri",
    description="""
    Öğrencinin tüm katılım verilerini analiz eder ve aşağıdaki bilgileri döndürür:
    - Genel özet (toplam ders, katılım oranları)
    - Branş/Ders bazlı detaylar (Matematik dersinin 10 seanına 8 kez katılmış gibi)
    - Aylık istatistikler (son 6 ay)
    - Günlük katılım verisi (son 30 gün)
    - Sınıf bazlı istatistikler
    """,
    responses={
        200: OpenApiResponse(description="Başarılı - Öğrenci istatistikleri"),
        404: OpenApiResponse(description="Öğrenci bulunamadı"),
        400: OpenApiResponse(description="Geçersiz öğrenci ID veya öğrenci profili yok")
    }
)
@api_view(['GET'])
@permission_classes([AllowAny])
def student_attendance_stats(request, student_id):
    """
    Öğrenci katılım istatistiklerini döndürür
    URL: /api/yts/students/{student_id}/attendance-stats/
    """
    try:
        # CustomUser'dan öğrenciyi çek
        student_user = get_object_or_404(
            CustomUser,
            id=student_id,
            profile_type=CustomUser.ProfileType.STUDENT
        )
        
        # StudentProfile'ı kontrol et
        try:
            student_profile = student_user.student_profile
        except StudentProfile.DoesNotExist:
            return Response(
                {'error': 'Öğrenci profili bulunamadı'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Tüm katılım kayıtlarını çek
        attendances = Attendance.objects.filter(
            student=student_user
        ).select_related(
            'lesson',
            'lesson__classroom',
            'lesson__teacher',
            'lesson__teacher__teacher_profile'
        )
        
        # Toplam istatistikler
        total_lessons = attendances.count()
        present_count = attendances.filter(status='present').count()
        absent_count = attendances.filter(status='absent').count()
        late_count = attendances.filter(status='late').count()
        
        # Yüzdeler
        present_percentage = (present_count / total_lessons * 100) if total_lessons > 0 else 0
        absent_percentage = (absent_count / total_lessons * 100) if total_lessons > 0 else 0
        late_percentage = (late_count / total_lessons * 100) if total_lessons > 0 else 0
        
        # Branş/Ders bazlı istatistikler
        subject_stats = {}
        
        for attendance in attendances:
            lesson = attendance.lesson
            teacher = lesson.teacher
            
            # Öğretmenin branşını al
            branch = 'Belirtilmemiş'
            if teacher and hasattr(teacher, 'teacher_profile'):
                try:
                    branch = teacher.teacher_profile.branch if teacher.teacher_profile.branch else 'Belirtilmemiş'
                except (AttributeError, TeacherProfile.DoesNotExist):
                    branch = 'Belirtilmemiş'
            
            teacher_name = teacher.full_name if teacher else 'Bilinmiyor'
            teacher_id = teacher.id if teacher else None
            
            # Key oluştur (branş + öğretmen)
            key = f"{branch}_{teacher_id}"
            
            if key not in subject_stats:
                subject_stats[key] = {
                    'subject': branch,
                    'teacher': teacher_name,
                    'teacher_id': teacher_id,
                    'total': 0,
                    'present': 0,
                    'absent': 0,
                    'late': 0
                }
            
            subject_stats[key]['total'] += 1
            
            if attendance.status == 'present':
                subject_stats[key]['present'] += 1
            elif attendance.status == 'absent':
                subject_stats[key]['absent'] += 1
            elif attendance.status == 'late':
                subject_stats[key]['late'] += 1
        
        # Branş istatistiklerini formatlama
        subject_stats_list = []
        for stats in subject_stats.values():
            attended = stats['present'] + stats['late']
            attendance_rate = (attended / stats['total'] * 100) if stats['total'] > 0 else 0
            
            subject_stats_list.append({
                'subject': stats['subject'],
                'teacher': stats['teacher'],
                'teacher_id': stats['teacher_id'],
                'total_lessons': stats['total'],
                'attended': attended,
                'present': stats['present'],
                'absent': stats['absent'],
                'late': stats['late'],
                'attendance_rate': round(attendance_rate, 2),
                'description': f"{stats['subject']} dersinin {stats['total']} seanına {attended} kez katılmış"
            })
        
        # Katılım oranına göre sırala
        subject_stats_list.sort(key=lambda x: x['attendance_rate'], reverse=True)
        
        # Son 30 günlük veri
        thirty_days_ago = datetime.now().date() - timedelta(days=30)
        recent_attendances = attendances.filter(
            lesson__date__gte=thirty_days_ago
        ).order_by('lesson__date')
        
        daily_data = []
        for attendance in recent_attendances:
            lesson = attendance.lesson
            teacher = lesson.teacher
            
            branch = 'Belirtilmemiş'
            if teacher and hasattr(teacher, 'teacher_profile'):
                try:
                    branch = teacher.teacher_profile.branch if teacher.teacher_profile.branch else 'Belirtilmemiş'
                except (AttributeError, TeacherProfile.DoesNotExist):
                    pass
            
            daily_data.append({
                'date': lesson.date.isoformat(),
                'status': attendance.status,
                'lesson_name': lesson.classroom.name if lesson.classroom else 'N/A',
                'subject': branch,
                'teacher': teacher.full_name if teacher else 'Bilinmiyor',
                'start_time': lesson.start_time.strftime('%H:%M') if lesson.start_time else None,
                'end_time': lesson.end_time.strftime('%H:%M') if lesson.end_time else None,
                'notes': attendance.notes or ''
            })
        
        # Aylık özet (son 6 ay) - DÜZELTİLMİŞ
        monthly_stats = []
        today = datetime.now().date()
        current_year = today.year
        current_month = today.month
        
        # Türkçe ay isimleri
        month_names_tr = {
            1: 'Ocak', 2: 'Şubat', 3: 'Mart', 4: 'Nisan',
            5: 'Mayıs', 6: 'Haziran', 7: 'Temmuz', 8: 'Ağustos',
            9: 'Eylül', 10: 'Ekim', 11: 'Kasım', 12: 'Aralık'
        }
        
        for i in range(5, -1, -1):
            # Ay ve yıl hesapla
            target_month = current_month - i
            target_year = current_year
            
            # Ay geçişlerini düzenle
            while target_month <= 0:
                target_month += 12
                target_year -= 1
            
            while target_month > 12:
                target_month -= 12
                target_year += 1
            
            # Ayın ilk ve son günü
            month_start = datetime(target_year, target_month, 1).date()
            last_day = calendar.monthrange(target_year, target_month)[1]
            month_end = datetime(target_year, target_month, last_day).date()
            
            # Eğer bu ay ise, bugüne kadar
            if i == 0:
                month_end = today
            
            # Ay içindeki yoklamaları filtrele
            month_attendances = attendances.filter(
                lesson__date__gte=month_start,
                lesson__date__lte=month_end
            )
            
            month_total = month_attendances.count()
            month_present = month_attendances.filter(status='present').count()
            month_absent = month_attendances.filter(status='absent').count()
            month_late = month_attendances.filter(status='late').count()
            
            monthly_stats.append({
                'month': f"{target_year}-{target_month:02d}",
                'month_name': f"{month_names_tr[target_month]} {target_year}",
                'total': month_total,
                'present': month_present,
                'absent': month_absent,
                'late': month_late,
                'attendance_rate': round((month_present / month_total * 100), 2) if month_total > 0 else 0
            })
        
        # Sınıf bazlı istatistikler
        classroom_stats = attendances.values(
            'lesson__classroom__name',
            'lesson__classroom__grade_level'
        ).annotate(
            total=Count('id'),
            present=Count('id', filter=Q(status='present')),
            absent=Count('id', filter=Q(status='absent')),
            late=Count('id', filter=Q(status='late'))
        ).order_by('-total')[:5]
        
        classroom_stats_list = []
        for stat in classroom_stats:
            total = stat['total']
            present = stat['present']
            attendance_rate = (present / total * 100) if total > 0 else 0
            
            classroom_stats_list.append({
                'classroom': stat['lesson__classroom__name'] or 'Bilinmiyor',
                'grade_level': stat['lesson__classroom__grade_level'],
                'total': total,
                'present': present,
                'absent': stat['absent'],
                'late': stat['late'],
                'attendance_rate': round(attendance_rate, 2)
            })
        
        # Response data
        data = {
            'student': {
                'id': student_user.id,
                'full_name': student_user.full_name,
                'email': student_user.email,
                'classroom': student_profile.classroom.name if student_profile.classroom else None,
                'grade_level': student_profile.classroom.grade_level if student_profile.classroom else None,
            },
            'summary': {
                'total_lessons': total_lessons,
                'present_count': present_count,
                'absent_count': absent_count,
                'late_count': late_count,
                'present_percentage': round(present_percentage, 2),
                'absent_percentage': round(absent_percentage, 2),
                'late_percentage': round(late_percentage, 2),
                'attendance_rate': round(present_percentage, 2)
            },
            'subject_stats': subject_stats_list,
            'daily_data': daily_data,
            'monthly_stats': monthly_stats,
            'classroom_stats': classroom_stats_list,
            'last_updated': datetime.now().isoformat()
        }
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@extend_schema(
    tags=["Student Statistics"],
    summary="Öğrenci detaylı katılım raporu",
    description="Tarih aralığına göre filtrelenebilir detaylı yoklama kayıtları",
    parameters=[
        OpenApiParameter(
            name='start_date',
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            description='Başlangıç tarihi (YYYY-MM-DD)',
            required=False
        ),
        OpenApiParameter(
            name='end_date',
            type=OpenApiTypes.DATE,
            location=OpenApiParameter.QUERY,
            description='Bitiş tarihi (YYYY-MM-DD)',
            required=False
        ),
    ],
    responses={
        200: OpenApiResponse(description="Başarılı"),
        404: OpenApiResponse(description="Öğrenci bulunamadı")
    }
)
@api_view(['GET'])
@permission_classes([AllowAny])
def student_attendance_report(request, student_id):
    """
    Detaylı öğrenci raporu
    URL: /api/yts/students/{student_id}/attendance-report/
    """
    try:
        student_user = get_object_or_404(
            CustomUser,
            id=student_id,
            profile_type=CustomUser.ProfileType.STUDENT
        )
        
        # Tarih filtreleme
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        queryset = Attendance.objects.filter(
            student=student_user
        ).select_related(
            'lesson',
            'lesson__classroom',
            'lesson__teacher'
        )
        
        if start_date:
            queryset = queryset.filter(lesson__date__gte=start_date)
        if end_date:
            queryset = queryset.filter(lesson__date__lte=end_date)
        
        # Detaylı liste
        attendance_list = []
        for att in queryset.order_by('-lesson__date', '-lesson__start_time'):
            lesson = att.lesson
            teacher = lesson.teacher
            
            branch = 'Belirtilmemiş'
            if teacher and hasattr(teacher, 'teacher_profile'):
                try:
                    branch = teacher.teacher_profile.branch if teacher.teacher_profile.branch else 'Belirtilmemiş'
                except (AttributeError, TeacherProfile.DoesNotExist):
                    pass
            
            attendance_list.append({
                'id': att.id,
                'date': lesson.date.isoformat() if lesson.date else None,
                'start_time': lesson.start_time.strftime('%H:%M') if lesson.start_time else None,
                'end_time': lesson.end_time.strftime('%H:%M') if lesson.end_time else None,
                'classroom': lesson.classroom.name if lesson.classroom else 'N/A',
                'grade_level': lesson.classroom.grade_level if lesson.classroom else None,
                'subject': branch,
                'teacher': teacher.full_name if teacher else 'Bilinmiyor',
                'teacher_id': teacher.id if teacher else None,
                'status': att.status,
                'status_display': {
                    'present': 'Katıldı',
                    'absent': 'Katılmadı',
                    'late': 'Geç Kaldı'
                }.get(att.status, att.status),
                'notes': att.notes or '',
                'recorded_at': att.recorded_at.isoformat() if hasattr(att, 'recorded_at') and att.recorded_at else None
            })
        
        data = {
            'student': {
                'id': student_user.id,
                'full_name': student_user.full_name,
                'email': student_user.email
            },
            'filters': {
                'start_date': start_date,
                'end_date': end_date
            },
            'total_records': len(attendance_list),
            'attendance_records': attendance_list
        }
        
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )