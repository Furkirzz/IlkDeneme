from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from accounts.models import TeacherProfile, StudentProfile
from .models import CoachingAssignment, StudentAssignmentStatus
from .serializers import (
    CoachingAssignmentSerializer,
    StudentAssignmentStatusSerializer,
)


class CanManageCoaching:
    """
    Aşağıdaki kullanıcılar görev oluşturabilir:
    1) Admin (is_superuser=True)
    2) Staff (is_staff=True)
    3) Rehber Öğretmen (teacher_profile.is_advisor == True)
    """

    def has_permission(self, request, view):
        user = request.user

        if not user.is_authenticated:
            return False

        # 1) Admin yetkisi
        if user.is_superuser:
            return True

        # 2) Staff yetkisi
        if user.is_staff:
            return True

        # 3) Danışman öğretmen
        if user.profile_type == "teacher" and hasattr(user, "teacher_profile"):
            return getattr(user.teacher_profile, "is_advisor", False) is True

        return False



class CoachingAssignmentViewSet(viewsets.ModelViewSet):
    queryset = CoachingAssignment.objects.all()
    serializer_class = CoachingAssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ["create", "update", "partial_update", "destroy"]:
            return [IsAuthenticated(), CanManageCoaching()]

        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user

        if user.is_teacher:
            return CoachingAssignment.objects.filter(created_by=user.teacher_profile)

        if user.is_student:
            st = user.student_profile
            ids = StudentAssignmentStatus.objects.filter(student=st).values_list("assignment_id", flat=True)
            return CoachingAssignment.objects.filter(id__in=ids)

        return CoachingAssignment.objects.none()

    # Swagger for CREATE
    @swagger_auto_schema(
        operation_summary="Koçluk Görevi Oluştur (Sadece Rehber Öğretmen)",
        request_body=CoachingAssignmentSerializer,
        responses={201: CoachingAssignmentSerializer()},
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    # Swagger for LIST
    @swagger_auto_schema(
        operation_summary="Görev Listesi (Teacher → kendi görevleri, Student → kendisine atananlar)",
        responses={200: CoachingAssignmentSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    # Swagger for DETAIL
    @swagger_auto_schema(
        operation_summary="Tek bir görevin detaylarını getir",
        responses={200: CoachingAssignmentSerializer()},
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    # ------------- REPORT ENDPOINT -------------
    @swagger_auto_schema(
        method="get",
        operation_summary="Görev Raporu (Sadece Öğretmen)",
        responses={200: openapi.Schema(
            type=openapi.TYPE_OBJECT,
            properties={
                "assignment": openapi.Schema(type=openapi.TYPE_INTEGER),
                "lesson": openapi.Schema(type=openapi.TYPE_STRING),
                "topic": openapi.Schema(type=openapi.TYPE_STRING),
                "target_question_count": openapi.Schema(type=openapi.TYPE_INTEGER),
                "completion_rate": openapi.Schema(type=openapi.TYPE_STRING),
                "avg_accuracy": openapi.Schema(type=openapi.TYPE_NUMBER),
                "students": openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_OBJECT)),
            }
        )}
    )
    @action(detail=True, methods=["get"])
    def report(self, request, pk=None):
        assignment = self.get_object()

        user = request.user

        # izin kontrolü
        if not (
            user.is_superuser or
            user.is_staff or
            (user.is_teacher and getattr(user.teacher_profile, "is_advisor", False))
        ):
            return Response({"detail": "Not authorized"}, status=403)

        statuses = assignment.student_statuses.all()
        total = statuses.count()
        completed = statuses.filter(is_completed=True).count()

        accuracy_list = []
        for s in statuses:
            t = s.correct_count + s.wrong_count + s.blank_count
            if t > 0:
                accuracy_list.append(s.correct_count / t)
        avg_accuracy = round(sum(accuracy_list) / len(accuracy_list), 2) if accuracy_list else 0

        data = {
            "assignment": assignment.id,
            "lesson": assignment.lesson,
            "topic": assignment.topic,
            "target_question_count": assignment.target_question_count,
            "total_students": total,
            "completed_students": completed,
            "completion_rate": f"{(completed/total)*100:.2f}%" if total else "0%",
            "avg_accuracy": avg_accuracy,
            "students": StudentAssignmentStatusSerializer(statuses, many=True).data,
        }

        return Response(data)


        


# ------------------------------------------------------
#  StudentAssignmentStatus ViewSet
#  (Student can update only own)
# ------------------------------------------------------
class StudentAssignmentStatusViewSet(viewsets.ModelViewSet):
    queryset = StudentAssignmentStatus.objects.all()
    serializer_class = StudentAssignmentStatusSerializer
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_summary="Öğrencinin kendi assignment durumlarını listeler",
        responses={200: StudentAssignmentStatusSerializer(many=True)},
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        user = self.request.user

        if user.is_student:
            return StudentAssignmentStatus.objects.filter(student=user.student_profile)

        if user.is_teacher:
            ids = CoachingAssignment.objects.filter(
                created_by=user.teacher_profile
            ).values_list("id", flat=True)
            return StudentAssignmentStatus.objects.filter(assignment_id__in=ids)

        return StudentAssignmentStatus.objects.none()

    @swagger_auto_schema(
        operation_summary="Öğrenci görevini tamamlar (Doğru / Yanlış / Boş girer)",
        request_body=StudentAssignmentStatusSerializer,
        responses={200: StudentAssignmentStatusSerializer()},
    )
    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()

        if request.user.is_student and instance.student != request.user.student_profile:
            return Response({"detail": "Unauthorized"}, status=403)

        data = request.data

        instance.correct_count = data.get("correct_count", instance.correct_count)
        instance.wrong_count = data.get("wrong_count", instance.wrong_count)
        instance.blank_count = data.get("blank_count", instance.blank_count)
        instance.is_completed = True
        instance.completed_at = timezone.now()

        instance.save()

        return Response(StudentAssignmentStatusSerializer(instance).data)
