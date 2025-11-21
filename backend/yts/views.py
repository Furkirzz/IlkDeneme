from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from . import models
from . import serializers


# ============================================================
# LIST + CREATE
# ============================================================

class AcademicYearListCreateAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="Academic Year List",
        operation_description="Tüm akademik yılları listeler.",
        responses={
            200: openapi.Response(
                description="Liste başarıyla getirildi.",
                schema=serializers.AcademicYearSerializer(many=True)
            )
        }
    )
    def get(self, request):
        years = models.AcademicYear.objects.all().order_by("-start_year")
        serializer = serializers.AcademicYearSerializer(years, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary="Create Academic Year",
        operation_description="Yeni akademik yıl oluşturur.",
        request_body=serializers.AcademicYearSerializer,
        responses={
            201: openapi.Response("Oluşturuldu", serializers.AcademicYearSerializer),
            400: "Geçersiz veri"
        }
    )
    def post(self, request):
        serializer = serializers.AcademicYearSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# ============================================================
# DETAIL + UPDATE + DELETE
# ============================================================

class AcademicYearDetailAPIView(APIView):

    def get_object(self, pk):
        try:
            return models.AcademicYear.objects.get(pk=pk)
        except models.AcademicYear.DoesNotExist:
            return None

    @swagger_auto_schema(
        operation_summary="Get Academic Year by ID",
        operation_description="Belirtilen ID’ye göre akademik yıl bilgisini getirir.",
        responses={
            200: openapi.Response("Başarılı", serializers.AcademicYearSerializer),
            404: "Bulunamadı"
        }
    )
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializers.AcademicYearSerializer(obj).data)

    @swagger_auto_schema(
        operation_summary="Update Academic Year (PUT)",
        operation_description="Var olan yılı tamamen günceller.",
        request_body=serializers.AcademicYearSerializer,
        responses={
            200: openapi.Response("Başarılı", serializers.AcademicYearSerializer),
            400: "Geçersiz veri",
            404: "Bulunamadı",
        }
    )
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = serializers.AcademicYearSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Partial Update Academic Year (PATCH)",
        operation_description="Var olan yılın belirli alanlarını günceller.",
        request_body=serializers.AcademicYearSerializer,
        responses={
            200: openapi.Response("Güncellendi", serializers.AcademicYearSerializer),
            400: "Geçersiz veri",
            404: "Bulunamadı",
        }
    )
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = serializers.AcademicYearSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Delete Academic Year",
        operation_description="Belirtilen ID’deki akademik yılı siler.",
        responses={
            204: "Silindi",
            404: "Bulunamadı"
        }
    )
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

# ============================================================
# SEMESTER LIST + CREATE
# ============================================================

class SemesterListCreateAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="Semester List",
        operation_description="Tüm dönemleri (semester) listeler.",
        responses={
            200: openapi.Response(
                description="Liste başarıyla getirildi.",
                schema=serializers.SemesterSerializer(many=True),
            )
        }
    )
    def get(self, request):
        semesters = models.Semester.objects.all().order_by("id")
        serializer = serializers.SemesterSerializer(semesters, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary="Create Semester",
        operation_description="Yeni bir semester (dönem) oluşturur.",
        request_body=serializers.SemesterSerializer,
        responses={
            201: openapi.Response("Oluşturuldu", serializers.SemesterSerializer),
            400: "Geçersiz veri"
        }
    )
    def post(self, request):
        serializer = serializers.SemesterSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# ============================================================
# SEMESTER DETAIL: RETRIEVE + PUT + PATCH + DELETE
# ============================================================

class SemesterDetailAPIView(APIView):

    def get_object(self, pk):
        try:
            return models.Semester.objects.get(pk=pk)
        except models.Semester.DoesNotExist:
            return None

    @swagger_auto_schema(
        operation_summary="Get Semester by ID",
        operation_description="ID ile belirtilen semester bilgilerini getirir.",
        responses={
            200: openapi.Response("Başarılı", serializers.SemesterSerializer),
            404: "Bulunamadı"
        }
    )
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(serializers.SemesterSerializer(obj).data)

    @swagger_auto_schema(
        operation_summary="Update Semester (PUT)",
        operation_description="Semesterin tüm alanlarını günceller.",
        request_body=serializers.SemesterSerializer,
        responses={
            200: openapi.Response("Güncellendi", serializers.SemesterSerializer),
            400: "Geçersiz veri",
            404: "Bulunamadı"
        }
    )
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = serializers.SemesterSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Partial Update Semester (PATCH)",
        operation_description="Semesterin belirli alanlarını günceller.",
        request_body=serializers.SemesterSerializer,
        responses={
            200: openapi.Response("Güncellendi", serializers.SemesterSerializer),
            400: "Geçersiz veri",
            404: "Bulunamadı"
        }
    )
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = serializers.SemesterSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Delete Semester",
        operation_description="Belirtilen semester kaydını siler.",
        responses={
            204: "Silindi",
            404: "Bulunamadı"
        }
    )
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ============================================================
# TERM LIST + CREATE
# ============================================================

class TermListCreateAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="Term List",
        operation_description="Tüm dönem (term) kayıtlarını listeler.",
        responses={
            200: openapi.Response(
                description="Liste başarıyla getirildi.",
                schema=serializers.TermSerializer(many=True)
            )
        }
    )
    def get(self, request):
        terms = models.Term.objects.all().order_by("-id")
        serializer = serializers.TermSerializer(terms, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary="Create Term",
        operation_description=(
            "Yeni bir Term oluşturur. AcademicYear ve Semester ID verilmelidir.\n\n"
            "Örnek body:\n"
            "{\n"
            '   "academic_year": 1,\n'
            '   "semester": 2,\n'
            '   "start_date": "2024-09-01",\n'
            '   "end_date": "2025-01-15"\n'
            "}"
        ),
        request_body=serializers.TermSerializer,
        responses={
            201: openapi.Response("Oluşturuldu", serializers.TermSerializer),
            400: "Geçersiz veri"
        }
    )
    def post(self, request):
        serializer = serializers.TermSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# ============================================================
# TERM DETAIL + PUT + PATCH + DELETE
# ============================================================

class TermDetailAPIView(APIView):

    def get_object(self, pk):
        try:
            return models.Term.objects.get(pk=pk)
        except models.Term.DoesNotExist:
            return None

    @swagger_auto_schema(
        operation_summary="Get Term by ID",
        operation_description="Belirtilen ID'deki Term kaydını getirir.",
        responses={
            200: openapi.Response("Başarılı", serializers.TermSerializer),
            404: "Bulunamadı"
        }
    )
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(serializers.TermSerializer(obj).data)

    @swagger_auto_schema(
        operation_summary="Update Term (PUT)",
        operation_description="Term kaydını tamamen günceller.",
        request_body=serializers.TermSerializer,
        responses={
            200: openapi.Response("Güncellendi", serializers.TermSerializer),
            400: "Geçersiz veri",
            404: "Bulunamadı"
        }
    )
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = serializers.TermSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Partial Update Term (PATCH)",
        operation_description="Term kaydını kısmen günceller.",
        request_body=serializers.TermSerializer,
        responses={
            200: openapi.Response("Güncellendi", serializers.TermSerializer),
            400: "Geçersiz veri",
            404: "Bulunamadı"
        }
    )
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = serializers.TermSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Delete Term",
        operation_description="Term kaydını siler.",
        responses={
            204: "Silindi",
            404: "Bulunamadı"
        }
    )
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

# ============================================================
# LESSON LIST + CREATE
# ============================================================

class LessonListCreateAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="Lesson List",
        operation_description="Tüm dersleri listeler.",
        responses={
            200: openapi.Response(
                description="Liste başarıyla getirildi.",
                schema=serializers.LessonSerializer(many=True),
            )
        }
    )
    def get(self, request):
        lessons = models.Lesson.objects.all().order_by("id")
        serializer = serializers.LessonSerializer(lessons, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary="Create Lesson",
        operation_description="Yeni bir ders (Lesson) oluşturur.",
        request_body=serializers.LessonSerializer,
        responses={
            201: openapi.Response("Oluşturuldu", serializers.LessonSerializer),
            400: "Geçersiz veri"
        }
    )
    def post(self, request):
        serializer = serializers.LessonSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



# ============================================================
# LESSON DETAIL + PUT + PATCH + DELETE
# ============================================================

class LessonDetailAPIView(APIView):

    def get_object(self, pk):
        try:
            return models.Lesson.objects.get(pk=pk)
        except models.Lesson.DoesNotExist:
            return None

    @swagger_auto_schema(
        operation_summary="Get Lesson by ID",
        operation_description="ID ile belirtilen dersi getirir.",
        responses={
            200: openapi.Response("Başarılı", serializers.LessonSerializer),
            404: "Bulunamadı"
        }
    )
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        return Response(serializers.LessonSerializer(obj).data)

    @swagger_auto_schema(
        operation_summary="Update Lesson (PUT)",
        operation_description="Dersi tamamen günceller.",
        request_body=serializers.LessonSerializer,
        responses={
            200: openapi.Response("Güncellendi", serializers.LessonSerializer),
            400: "Geçersiz veri",
            404: "Bulunamadı",
        }
    )
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = serializers.LessonSerializer(obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Partial Update Lesson (PATCH)",
        operation_description="Dersin belirli alanlarını günceller.",
        request_body=serializers.LessonSerializer,
        responses={
            200: openapi.Response("Güncellendi", serializers.LessonSerializer),
            400: "Geçersiz veri",
            404: "Bulunamadı",
        }
    )
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = serializers.LessonSerializer(obj, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @swagger_auto_schema(
        operation_summary="Delete Lesson",
        operation_description="Belirtilen dersi siler.",
        responses={
            204: "Silindi",
            404: "Bulunamadı"
        }
    )
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)

        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

# ============================================================
# SCHEDULE TYPE — LIST + CREATE
# ============================================================

class ScheduleTypeListCreateAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List ScheduleTypes",
        operation_description="Tüm program tiplerini listeler.",
        responses={200: serializers.ScheduleTypeSerializer(many=True)}
    )
    def get(self, request):
        items = models.ScheduleType.objects.all().order_by("id")
        return Response(serializers.ScheduleTypeSerializer(items, many=True).data)

    @swagger_auto_schema(
        operation_summary="Create ScheduleType",
        request_body=serializers.ScheduleTypeSerializer,
        responses={201: serializers.ScheduleTypeSerializer}
    )
    def post(self, request):
        ser = serializers.ScheduleTypeSerializer(data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data, status=201)
        return Response(ser.errors, status=400)



# ============================================================
# SCHEDULE TYPE — DETAIL (GET, PUT, PATCH, DELETE)
# ============================================================

class ScheduleTypeDetailAPIView(APIView):

    def get_obj(self, pk):
        try:
            return models.ScheduleType.objects.get(pk=pk)
        except models.ScheduleType.DoesNotExist:
            return None

    @swagger_auto_schema(
        operation_summary="Retrieve ScheduleType",
        responses={200: serializers.ScheduleTypeSerializer, 404: "Not found"}
    )
    def get(self, request, pk):
        obj = self.get_obj(pk)
        if not obj: return Response({"detail": "Not found"}, status=404)
        return Response(serializers.ScheduleTypeSerializer(obj).data)

    @swagger_auto_schema(
        operation_summary="Update ScheduleType (PUT)",
        request_body=serializers.ScheduleTypeSerializer,
        responses={200: serializers.ScheduleTypeSerializer}
    )
    def put(self, request, pk):
        obj = self.get_obj(pk)
        if not obj: return Response({"detail": "Not found"}, status=404)
        ser = serializers.ScheduleTypeSerializer(obj, data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    @swagger_auto_schema(
        operation_summary="Partial Update ScheduleType (PATCH)",
        request_body=serializers.ScheduleTypeSerializer,
        responses={200: serializers.ScheduleTypeSerializer}
    )
    def patch(self, request, pk):
        obj = self.get_obj(pk)
        if not obj: return Response({"detail": "Not found"}, status=404)
        ser = serializers.ScheduleTypeSerializer(obj, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    @swagger_auto_schema(
        operation_summary="Delete ScheduleType",
        responses={204: "Deleted"}
    )
    def delete(self, request, pk):
        obj = self.get_obj(pk)
        if not obj: return Response({"detail": "Not found"}, status=404)
        obj.delete()
        return Response(status=204)
    
# ============================================================
# DAY DETAIL — LIST + CREATE
# ============================================================

class ScheduleTypeDayDetailListCreateAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List ScheduleTypeDayDetails",
        operation_description="Gün detaylarını listeler.",
        responses={200: serializers.ScheduleTypeDayDetailSerializer(many=True)}
    )
    def get(self, request):
        items = models.ScheduleTypeDayDetail.objects.all().order_by("id")
        return Response(serializers.ScheduleTypeDayDetailSerializer(items, many=True).data)

    @swagger_auto_schema(
        operation_summary="Create ScheduleTypeDayDetail",
        request_body=serializers.ScheduleTypeDayDetailSerializer,
        responses={201: serializers.ScheduleTypeDayDetailSerializer}
    )
    def post(self, request):
        ser = serializers.ScheduleTypeDayDetailSerializer(data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data, status=201)
        return Response(ser.errors, status=400)


class ScheduleTypeDayDetailScheduleTypeIDListAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List ScheduleTypeDayDetail by schedule_type ID",
        responses={200: serializers.ScheduleTypeDayDetailSerializer(many=True)}
    )
    def get(self, request, schedule_type_id=None):
        qs = models.ScheduleTypeDayDetail.objects.all()

        if schedule_type_id:
            qs = qs.filter(schedule_type_id=schedule_type_id)

        return Response(serializers.ScheduleTypeDayDetailSerializer(qs, many=True).data)





# ============================================================
# DAY DETAIL — DETAIL (GET, PUT, PATCH, DELETE)
# ============================================================

class ScheduleTypeDayDetailDetailAPIView(APIView):

    def get_obj(self, pk):
        try:
            return models.ScheduleTypeDayDetail.objects.get(pk=pk)
        except models.ScheduleTypeDayDetail.DoesNotExist:
            return None

    @swagger_auto_schema(
        operation_summary="Retrieve ScheduleTypeDayDetail",
        responses={200: serializers.ScheduleTypeDayDetailSerializer}
    )
    def get(self, request, pk):
        obj = self.get_obj(pk)
        if not obj: return Response({"detail": "Not found"}, status=404)
        return Response(serializers.ScheduleTypeDayDetailSerializer(obj).data)

    @swagger_auto_schema(
        operation_summary="Update ScheduleTypeDayDetail (PUT)",
        request_body=serializers.ScheduleTypeDayDetailSerializer,
        responses={200: serializers.ScheduleTypeDayDetailSerializer}
    )
    def put(self, request, pk):
        obj = self.get_obj(pk)
        if not obj: return Response({"detail": "Not found"}, status=404)
        ser = serializers.ScheduleTypeDayDetailSerializer(obj, data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    @swagger_auto_schema(
        operation_summary="Partial Update ScheduleTypeDayDetail (PATCH)",
        request_body=serializers.ScheduleTypeDayDetailSerializer,
        responses={200: serializers.ScheduleTypeDayDetailSerializer}
    )
    def patch(self, request, pk):
        obj = self.get_obj(pk)
        if not obj: return Response({"detail": "Not found"}, status=404)
        ser = serializers.ScheduleTypeDayDetailSerializer(obj, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    @swagger_auto_schema(
        operation_summary="Delete ScheduleTypeDayDetail",
        responses={204: "Deleted"}
    )
    def delete(self, request, pk):
        obj = self.get_obj(pk)
        if not obj: return Response({"detail": "Not found"}, status=404)
        obj.delete()
        return Response(status=204)


# ============================================================
# COURSE PROGRAM LIST + CREATE
# ============================================================

class CourseProgramListCreateAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List CoursePrograms",
        operation_description="Tüm CourseProgram kayıtlarını listeler.",
        responses={200: serializers.CourseProgramSerializer(many=True)},
    )
    def get(self, request):
        qs = models.CourseProgram.objects.all().order_by("id")
        ser = serializers.CourseProgramSerializer(qs, many=True)
        return Response(ser.data, status=status.HTTP_200_OK)

    @swagger_auto_schema(
        operation_summary="Create CourseProgram",
        operation_description="Yeni bir CourseProgram oluşturur.",
        request_body=serializers.CourseProgramSerializer,
        responses={
            201: serializers.CourseProgramSerializer,
            400: "Invalid data",
        },
    )
    def post(self, request):
        ser = serializers.CourseProgramSerializer(data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)



# ============================================================
# COURSE PROGRAM DETAIL + PUT + PATCH + DELETE
# ============================================================

class CourseProgramDetailAPIView(APIView):

    def get_object(self, pk):
        try:
            return models.CourseProgram.objects.get(pk=pk)
        except models.CourseProgram.DoesNotExist:
            return None

    @swagger_auto_schema(
        operation_summary="Retrieve CourseProgram",
        responses={200: serializers.CourseProgramSerializer, 404: "Not Found"},
    )
    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found"}, status=404)
        ser = serializers.CourseProgramSerializer(obj)
        return Response(ser.data)

    @swagger_auto_schema(
        operation_summary="Update CourseProgram (PUT)",
        request_body=serializers.CourseProgramSerializer,
        responses={200: serializers.CourseProgramSerializer},
    )
    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found"}, status=404)

        ser = serializers.CourseProgramSerializer(obj, data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    @swagger_auto_schema(
        operation_summary="Partial Update CourseProgram (PATCH)",
        request_body=serializers.CourseProgramSerializer,
        responses={200: serializers.CourseProgramSerializer},
    )
    def patch(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found"}, status=404)

        ser = serializers.CourseProgramSerializer(obj, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    @swagger_auto_schema(
        operation_summary="Delete CourseProgram",
        responses={204: "Deleted"},
    )
    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({"detail": "Not found"}, status=404)

        obj.delete()
        return Response(status=204)



# ============================================================
# GET BY CLASSROOM
# ============================================================

class CourseProgramByClassroomAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List CoursePrograms by Classroom ID",
        operation_description="Belirtilen sınıfa ait CourseProgram kayıtlarını listeler.",
        responses={200: serializers.CourseProgramDetailSerializer(many=True)},
    )
    def get(self, request, classroom_id):
        qs = models.CourseProgram.objects.filter(classroom_id=classroom_id)
        ser = serializers.CourseProgramDetailSerializer(qs, many=True)
        return Response(ser.data, status=200)



# ============================================================
# GET BY TEACHER
# ============================================================

class CourseProgramByTeacherAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List CoursePrograms by Teacher ID",
        operation_description="Belirtilen öğretmene ait CourseProgram kayıtlarını listeler.",
        responses={200: serializers.CourseProgramDetailSerializer(many=True)},
    )
    def get(self, request, teacher_id):
        qs = models.CourseProgram.objects.filter(teacher_id=teacher_id)
        ser = serializers.CourseProgramDetailSerializer(qs, many=True)
        return Response(ser.data, status=200)
    

# ============================================================
# COURSE PROGRAM INSTANCE — LIST + CREATE
# ============================================================

class CourseProgramInstanceListCreateAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List CourseProgramInstances",
        operation_description="Tüm CourseProgramInstance kayıtlarını listeler.",
        responses={200: serializers.CourseProgramInstanceSerializer(many=True)}
    )
    def get(self, request):
        qs = models.CourseProgramInstance.objects.all().order_by("id")
        ser = serializers.CourseProgramInstanceSerializer(qs, many=True)
        return Response(ser.data)

    @swagger_auto_schema(
        operation_summary="Create CourseProgramInstance",
        request_body=serializers.CourseProgramInstanceSerializer,
        responses={201: serializers.CourseProgramInstanceSerializer}
    )
    def post(self, request):
        ser = serializers.CourseProgramInstanceSerializer(data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data, status=201)
        return Response(ser.errors, status=400)



# ============================================================
# COURSE PROGRAM INSTANCE — DETAIL + PUT + PATCH + DELETE
# ============================================================

class CourseProgramInstanceDetailAPIView(APIView):

    def get_obj(self, pk):
        try:
            return models.CourseProgramInstance.objects.get(pk=pk)
        except models.CourseProgramInstance.DoesNotExist:
            return None

    @swagger_auto_schema(
        operation_summary="Retrieve CourseProgramInstance by ID",
        responses={200: serializers.CourseProgramInstanceSerializer}
    )
    def get(self, request, pk):
        obj = self.get_obj(pk)
        if not obj: return Response({"detail": "Not found"}, status=404)
        return Response(serializers.CourseProgramInstanceSerializer(obj).data)

    @swagger_auto_schema(
        operation_summary="Update CourseProgramInstance (PUT)",
        request_body=serializers.CourseProgramInstanceSerializer,
        responses={200: serializers.CourseProgramInstanceSerializer}
    )
    def put(self, request, pk):
        obj = self.get_obj(pk)
        if not obj: return Response({"detail": "Not found"}, status=404)

        ser = serializers.CourseProgramInstanceSerializer(obj, data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    @swagger_auto_schema(
        operation_summary="Partial Update CourseProgramInstance (PATCH)",
        request_body=serializers.CourseProgramInstanceSerializer,
        responses={200: serializers.CourseProgramInstanceSerializer}
    )
    def patch(self, request, pk):
        obj = self.get_obj(pk)
        if not obj: return Response({"detail": "Not found"}, status=404)

        ser = serializers.CourseProgramInstanceSerializer(obj, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    @swagger_auto_schema(
        operation_summary="Delete CourseProgramInstance",
        responses={204: "Deleted"}
    )
    def delete(self, request, pk):
        obj = self.get_obj(pk)
        if not obj: return Response({"detail": "Not found"}, status=404)

        obj.delete()
        return Response(status=204)



# ============================================================
# FILTERS — CLASSROOM ID
# ============================================================

class CourseProgramInstanceByClassroomAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List CourseProgramInstances by Classroom ID",
        responses={200: serializers.CourseProgramInstanceSerializer(many=True)}
    )
    def get(self, request, classroom_id):
        qs = models.CourseProgramInstance.objects.filter(template__classroom_id=classroom_id)
        ser = serializers.CourseProgramInstanceSerializer(qs, many=True)
        return Response(ser.data)



# ============================================================
# FILTERS — TEACHER ID
# ============================================================

class CourseProgramInstanceByTeacherAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List CourseProgramInstances by Teacher ID",
        responses={200: serializers.CourseProgramInstanceSerializer(many=True)}
    )
    def get(self, request, teacher_id):
        qs = models.CourseProgramInstance.objects.filter(template__teacher_id=teacher_id)
        ser = serializers.CourseProgramInstanceSerializer(qs, many=True)
        return Response(ser.data)



# ============================================================
# FILTER — is_cancelled = true
# ============================================================

class CourseProgramInstanceCancelledAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List Cancelled CourseProgramInstances",
        operation_description="is_cancelled = true olan instance'ları listeler.",
        responses={200: serializers.CourseProgramInstanceSerializer(many=True)}
    )
    def get(self, request):
        qs = models.CourseProgramInstance.objects.filter(is_cancelled=True)
        ser = serializers.CourseProgramInstanceSerializer(qs, many=True)
        return Response(ser.data)



# ============================================================
# FILTER — is_rescheduled = true
# ============================================================

class CourseProgramInstanceRescheduledAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List Rescheduled CourseProgramInstances",
        operation_description="is_rescheduled = true olan instance'ları listeler.",
        responses={200: serializers.CourseProgramInstanceSerializer(many=True)}
    )
    def get(self, request):
        qs = models.CourseProgramInstance.objects.filter(is_rescheduled=True)
        ser = serializers.CourseProgramInstanceSerializer(qs, many=True)
        return Response(ser.data)



# ============================================================
# FILTER — BOTH TRUE (is_cancelled=True AND is_rescheduled=True)
# ============================================================

class CourseProgramInstanceCancelledAndRescheduledAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List Instances cancelled AND rescheduled",
        operation_description="Hem is_cancelled hem is_rescheduled = true olanları listeler.",
        responses={200: serializers.CourseProgramInstanceSerializer(many=True)}
    )
    def get(self, request):
        qs = models.CourseProgramInstance.objects.filter(is_cancelled=True, is_rescheduled=True)
        ser = serializers.CourseProgramInstanceSerializer(qs, many=True)
        return Response(ser.data)



# ============================================================
# FILTER — BOTH FALSE (is_cancelled=False AND is_rescheduled=False)
# ============================================================

class CourseProgramInstanceNormalAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List Instances that are NOT cancelled and NOT rescheduled",
        operation_description="Hem is_cancelled hem is_rescheduled false olanları listeler.",
        responses={200: serializers.CourseProgramInstanceSerializer(many=True)}
    )
    def get(self, request):
        qs = models.CourseProgramInstance.objects.filter(is_cancelled=False, is_rescheduled=False)
        ser = serializers.CourseProgramInstanceSerializer(qs, many=True)
        return Response(ser.data)
    

class AttendanceSessionListCreateAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List Attendance Sessions",
        operation_description="Tüm AttendanceSession (yoklama oturumları) kayıtlarını listeler.",
        responses={200: serializers.AttendanceSessionSerializer(many=True)}
    )
    def get(self, request):
        qs = models.AttendanceSession.objects.all().order_by("id")
        ser = serializers.AttendanceSessionSerializer(qs, many=True)
        return Response(ser.data)

    @swagger_auto_schema(
        operation_summary="Create Attendance Session",
        request_body=serializers.AttendanceSessionSerializer,
        responses={201: serializers.AttendanceSessionSerializer}
    )
    def post(self, request):
        ser = serializers.AttendanceSessionSerializer(data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data, status=201)
        return Response(ser.errors, status=400)



# ============================================================
# ATTENDANCE SESSION — DETAIL
# ============================================================

class AttendanceSessionDetailAPIView(APIView):

    def get_obj(self, pk):
        try:
            return models.AttendanceSession.objects.get(pk=pk)
        except models.AttendanceSession.DoesNotExist:
            return None

    @swagger_auto_schema(
        operation_summary="Retrieve Attendance Session by ID",
        responses={200: serializers.AttendanceSessionSerializer, 404: "Not found"}
    )
    def get(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not found"}, status=404)
        return Response(serializers.AttendanceSessionSerializer(obj).data)

    @swagger_auto_schema(
        operation_summary="Update Attendance Session (PUT)",
        request_body=serializers.AttendanceSessionSerializer,
        responses={200: serializers.AttendanceSessionSerializer}
    )
    def put(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not found"}, status=404)

        ser = serializers.AttendanceSessionSerializer(obj, data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    @swagger_auto_schema(
        operation_summary="Partial Update Attendance Session (PATCH)",
        request_body=serializers.AttendanceSessionSerializer,
        responses={200: serializers.AttendanceSessionSerializer}
    )
    def patch(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not found"}, status=404)

        ser = serializers.AttendanceSessionSerializer(obj, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    @swagger_auto_schema(
        operation_summary="Delete Attendance Session",
        responses={204: "Deleted"}
    )
    def delete(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not found"}, status=404)
        obj.delete()
        return Response(status=204)



# ============================================================
# FILTER — TEACHER ID
# ============================================================

class AttendanceSessionByTeacherAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List Attendance Sessions by Teacher ID",
        operation_description="teacher_id referansına göre AttendanceSession listeler.",
        responses={200: serializers.AttendanceSessionSerializer(many=True)}
    )
    def get(self, request, teacher_id):
        qs = models.AttendanceSession.objects.filter(teacher_id=teacher_id)
        ser = serializers.AttendanceSessionSerializer(qs, many=True)
        return Response(ser.data)
    


# ============================================================
# LIST + CREATE
# ============================================================

class AttendanceRecordListCreateAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List Attendance Records",
        operation_description="Tüm AttendanceRecord kayıtlarını listeler.",
        responses={200: serializers.AttendanceRecordSerializer(many=True)},
    )
    def get(self, request):
        qs = models.AttendanceRecord.objects.all().order_by("id")
        ser = serializers.AttendanceRecordSerializer(qs, many=True)
        return Response(ser.data)

    @swagger_auto_schema(
        operation_summary="Create Attendance Record",
        request_body=serializers.AttendanceRecordSerializer,
        responses={201: serializers.AttendanceRecordSerializer},
    )
    def post(self, request):
        ser = serializers.AttendanceRecordSerializer(data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data, status=201)
        return Response(ser.errors, status=400)



# ============================================================
# DETAIL — GET / PUT / PATCH / DELETE
# ============================================================

class AttendanceRecordDetailAPIView(APIView):

    def get_obj(self, pk):
        try:
            return models.AttendanceRecord.objects.get(pk=pk)
        except models.AttendanceRecord.DoesNotExist:
            return None

    @swagger_auto_schema(
        operation_summary="Retrieve Attendance Record",
        responses={200: serializers.AttendanceRecordSerializer, 404: "Not found"},
    )
    def get(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not found"}, status=404)
        return Response(serializers.AttendanceRecordSerializer(obj).data)

    @swagger_auto_schema(
        operation_summary="Update Attendance Record (PUT)",
        request_body=serializers.AttendanceRecordSerializer,
        responses={200: serializers.AttendanceRecordSerializer},
    )
    def put(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not found"}, status=404)

        ser = serializers.AttendanceRecordSerializer(obj, data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    @swagger_auto_schema(
        operation_summary="Partial Update Attendance Record (PATCH)",
        request_body=serializers.AttendanceRecordSerializer,
        responses={200: serializers.AttendanceRecordSerializer},
    )
    def patch(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not found"}, status=404)

        ser = serializers.AttendanceRecordSerializer(obj, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    @swagger_auto_schema(
        operation_summary="Delete Attendance Record",
        responses={204: "Deleted"},
    )
    def delete(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not found"}, status=404)

        obj.delete()
        return Response(status=204)



# ============================================================
# FILTER — student_id
# ============================================================

class AttendanceRecordByStudentAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List by Student ID",
        responses={200: serializers.AttendanceRecordSerializer(many=True)},
    )
    def get(self, request, student_id):
        qs = models.AttendanceRecord.objects.filter(student_id=student_id)
        return Response(serializers.AttendanceRecordSerializer(qs, many=True).data)



# ============================================================
# FILTER — attendance_session_id
# ============================================================

class AttendanceRecordBySessionAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List by Attendance Session ID",
        responses={200: serializers.AttendanceRecordSerializer(many=True)},
    )
    def get(self, request, session_id):
        qs = models.AttendanceRecord.objects.filter(attendance_session_id=session_id)
        return Response(serializers.AttendanceRecordSerializer(qs, many=True).data)



# ============================================================
# FILTER — classroom_id (instance → template → classroom)
# ============================================================

class AttendanceRecordByClassroomAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List by Classroom ID",
        operation_description=(
            "Zincir:\n"
            "AttendanceRecord → attendance_session → instance → template → classroom_id"
        ),
        responses={200: serializers.AttendanceRecordSerializer(many=True)},
    )
    def get(self, request, classroom_id):
        qs = models.AttendanceRecord.objects.filter(
            attendance_session__instance__template__classroom_id=classroom_id
        )
        return Response(serializers.AttendanceRecordSerializer(qs, many=True).data)



# ============================================================
# FILTER — teacher_id (session → teacher)
# ============================================================

class AttendanceRecordByTeacherAPIView(APIView):

    @swagger_auto_schema(
        operation_summary="List by Teacher ID",
        operation_description=(
            "Zincir:\n"
            "AttendanceRecord → attendance_session → teacher_id"
        ),
        responses={200: serializers.AttendanceRecordSerializer(many=True)},
    )
    def get(self, request, teacher_id):
        qs = models.AttendanceRecord.objects.filter(
            attendance_session__teacher_id=teacher_id
        )
        return Response(serializers.AttendanceRecordSerializer(qs, many=True).data)