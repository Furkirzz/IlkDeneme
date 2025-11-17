from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
)

from rest_framework.permissions import AllowAny

permission_classes = [AllowAny]

from .models import (
    AcademicYear,
    Semester,
    Term,
    Lesson,
    ScheduleType,
    ScheduleTypeDayDetail,
    CourseProgram,
    CourseProgramInstance,
    AttendanceSession,
    AttendanceRecord,
)

from .serializers import (
    AcademicYearSerializer,
    SemesterSerializer,
    TermSerializer,
    LessonSerializer,
    ScheduleTypeSerializer,
    ScheduleTypeDayDetailSerializer,
    ScheduleTypeWithDaysSerializer,
    CourseProgramSerializer,
    CourseProgramDetailSerializer,
    CourseProgramInstanceSerializer,
    CourseProgramInstanceDetailSerializer,
    AttendanceSessionSerializer,
    AttendanceSessionDetailSerializer,
    AttendanceRecordSerializer,
    AttendanceRecordDetailSerializer,
)


# ============================================================
# ACADEMIC YEAR VIEWSET
# ============================================================

@extend_schema_view(
    list=extend_schema(description="Tüm akademik yılları listeler"),
    retrieve=extend_schema(description="Belirli bir akademik yılı getirir"),
    create=extend_schema(description="Yeni akademik yıl oluşturur"),
    update=extend_schema(description="Akademik yılı günceller"),
    partial_update=extend_schema(description="Akademik yılı kısmi günceller"),
    destroy=extend_schema(description="Akademik yılı siler"),
)
class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all().order_by("-start_year")
    serializer_class = AcademicYearSerializer


# ============================================================
# SEMESTER VIEWSET
# ============================================================

@extend_schema_view(
    list=extend_schema(description="Tüm dönem (semester) kayıtlarını listeler"),
    retrieve=extend_schema(description="Belirli bir dönemi getirir"),
    create=extend_schema(description="Yeni dönem oluşturur"),
    update=extend_schema(description="Dönemi günceller"),
    partial_update=extend_schema(description="Dönemi kısmi günceller"),
    destroy=extend_schema(description="Dönemi siler"),
)
class SemesterViewSet(viewsets.ModelViewSet):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer


# ============================================================
# TERM VIEWSET (AcademicYear + Semester)
# ============================================================

@extend_schema_view(
    list=extend_schema(description="Tüm dönem (academic year + semester) kayıtlarını listeler"),
    retrieve=extend_schema(description="Belirli bir dönemi getirir"),
    create=extend_schema(description="Yeni dönem oluşturur"),
    update=extend_schema(description="Dönemi günceller"),
    partial_update=extend_schema(description="Dönemi kısmi günceller"),
    destroy=extend_schema(description="Dönemi siler"),
)
class TermViewSet(viewsets.ModelViewSet):
    queryset = Term.objects.all().select_related("academic_year", "semester")
    serializer_class = TermSerializer

# ============================================================
# LESSON
# ============================================================

@extend_schema_view(
    list=extend_schema(description="Tüm dersleri listeler"),
    retrieve=extend_schema(description="Belirli bir dersi getirir"),
    create=extend_schema(description="Yeni ders oluşturur"),
    update=extend_schema(description="Dersi tamamen günceller"),
    partial_update=extend_schema(description="Dersi kısmi günceller"),
    destroy=extend_schema(description="Dersi siler"),
)
class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer


# ============================================================
# SCHEDULE TYPE
# ============================================================

@extend_schema_view(
    list=extend_schema(description="Tüm program tiplerini listeler"),
    retrieve=extend_schema(description="Belirli bir program tipini getirir"),
    create=extend_schema(description="Yeni program tipi oluşturur"),
    update=extend_schema(description="Program tipini günceller"),
    partial_update=extend_schema(description="Program tipini kısmi günceller"),
    destroy=extend_schema(description="Program tipini siler"),
)
class ScheduleTypeViewSet(viewsets.ModelViewSet):
    queryset = ScheduleType.objects.all()
    serializer_class = ScheduleTypeSerializer

    @extend_schema(
        description="Program tipini tüm gün detaylarıyla birlikte döndürür",
        responses=ScheduleTypeWithDaysSerializer
    )
    @action(detail=True, methods=["get"])
    def with_days(self, request, pk=None):
        schedule = self.get_object()
        serializer = ScheduleTypeWithDaysSerializer(schedule)
        return Response(serializer.data)


# ============================================================
# SCHEDULE TYPE DAY DETAIL
# ============================================================

@extend_schema_view(
    list=extend_schema(description="Program tipine ait tüm günlük ayarları listeler"),
    retrieve=extend_schema(description="Belirli bir gün ayarını getirir"),
    create=extend_schema(description="Yeni gün ayarı oluşturur"),
    update=extend_schema(description="Gün ayarını günceller"),
    partial_update=extend_schema(description="Gün ayarını kısmi günceller"),
    destroy=extend_schema(description="Gün ayarını siler"),
)
class ScheduleTypeDayDetailViewSet(viewsets.ModelViewSet):
    queryset = ScheduleTypeDayDetail.objects.all()
    serializer_class = ScheduleTypeDayDetailSerializer


# ============================================================
# COURSE PROGRAM (WEEKLY TEMPLATE)
# ============================================================

@extend_schema_view(
    list=extend_schema(description="Tüm haftalık ders programlarını listeler"),
    retrieve=extend_schema(description="Belirli bir haftalık dersi getirir"),
    create=extend_schema(description="Yeni haftalık ders programı oluşturur"),
    update=extend_schema(description="Haftalık dersi günceller"),
    partial_update=extend_schema(description="Haftalık dersi kısmi günceller"),
    destroy=extend_schema(description="Haftalık dersi siler"),
)
class CourseProgramViewSet(viewsets.ModelViewSet):
    queryset = CourseProgram.objects.all()
    serializer_class = CourseProgramSerializer

    @extend_schema(
        description="Ders programını tüm detaylarıyla döndürür",
        responses=CourseProgramDetailSerializer
    )
    @action(detail=True, methods=["get"])
    def details(self, request, pk=None):
        program = self.get_object()
        serializer = CourseProgramDetailSerializer(program)
        return Response(serializer.data)


# ============================================================
# COURSE PROGRAM INSTANCE (DAILY)
# ============================================================

@extend_schema_view(
    list=extend_schema(description="Tüm günlük program instance'larını listeler"),
    retrieve=extend_schema(description="Belirli bir günlük instance getirir"),
    create=extend_schema(description="Yeni günlük ders instance'ı oluşturur"),
    update=extend_schema(description="Günlük instance'ı günceller"),
    partial_update=extend_schema(description="Günlük instance'ı kısmi günceller"),
    destroy=extend_schema(description="Günlük instance'ı siler"),
)
class CourseProgramInstanceViewSet(viewsets.ModelViewSet):
    queryset = CourseProgramInstance.objects.all()
    serializer_class = CourseProgramInstanceSerializer

    @extend_schema(
        description="Günlük ders instance'ını tüm detaylarıyla döndürür",
        responses=CourseProgramInstanceDetailSerializer
    )
    @action(detail=True, methods=["get"])
    def details(self, request, pk=None):
        instance = self.get_object()
        serializer = CourseProgramInstanceDetailSerializer(instance)
        return Response(serializer.data)


# ============================================================
# ATTENDANCE SESSION
# ============================================================

@extend_schema_view(
    list=extend_schema(description="Tüm yoklama oturumlarını listeler"),
    retrieve=extend_schema(description="Belirli bir yoklama oturumunu getirir"),
    create=extend_schema(description="Yeni yoklama oturumu oluşturur"),
    update=extend_schema(description="Yoklama oturumunu günceller"),
    partial_update=extend_schema(description="Yoklama oturumunu kısmi günceller"),
    destroy=extend_schema(description="Yoklama oturumunu siler"),
)
class AttendanceSessionViewSet(viewsets.ModelViewSet):
    queryset = AttendanceSession.objects.all()
    serializer_class = AttendanceSessionSerializer

    @extend_schema(
        description="Yoklama oturumunu tüm detaylarıyla döndürür",
        responses=AttendanceSessionDetailSerializer
    )
    @action(detail=True, methods=["get"])
    def details(self, request, pk=None):
        session = self.get_object()
        serializer = AttendanceSessionDetailSerializer(session)
        return Response(serializer.data)


# ============================================================
# ATTENDANCE RECORD
# ============================================================

@extend_schema_view(
    list=extend_schema(description="Tüm yoklama kayıtlarını listeler"),
    retrieve=extend_schema(description="Belirli bir yoklama kaydını getirir"),
    create=extend_schema(description="Yeni yoklama kaydı oluşturur"),
    update=extend_schema(description="Yoklama kaydını günceller"),
    partial_update=extend_schema(description="Yoklama kaydını kısmi günceller"),
    destroy=extend_schema(description="Yoklama kaydını siler"),
)
class AttendanceRecordViewSet(viewsets.ModelViewSet):
    queryset = AttendanceRecord.objects.all()
    serializer_class = AttendanceRecordSerializer

    @extend_schema(
        description="Yoklama kaydını tüm detaylarıyla döndürür",
        responses=AttendanceRecordDetailSerializer
    )
    @action(detail=True, methods=["get"])
    def details(self, request, pk=None):
        record = self.get_object()
        serializer = AttendanceRecordDetailSerializer(record)
        return Response(serializer.data)
