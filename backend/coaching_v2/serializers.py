from rest_framework import serializers
from django.utils import timezone

from accounts.models import StudentProfile
from .models import CoachingAssignment, StudentAssignmentStatus


class StudentAssignmentStatusSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source="student.user.full_name", read_only=True)
    classroom_name = serializers.CharField(source="student.classroom.name", read_only=True)

    assignment_lesson = serializers.CharField(source="assignment.lesson", read_only=True)
    assignment_topic = serializers.CharField(source="assignment.topic", read_only=True)
    assignment_target = serializers.IntegerField(source="assignment.target_question_count", read_only=True)

    class Meta:
        model = StudentAssignmentStatus
        fields = [
            "id",
            "student",
            "student_name",
            "classroom_name",
            "correct_count",
            "wrong_count",
            "blank_count",
            "is_completed",
            "completed_at",
            "assignment_lesson",
            "assignment_topic",
            "assignment_target",
        ]
        read_only_fields = ["student", "is_completed", "completed_at"]



class CoachingAssignmentSerializer(serializers.ModelSerializer):

    student_statuses = StudentAssignmentStatusSerializer(many=True, read_only=True)

    class Meta:
        model = CoachingAssignment
        fields = [
            "id",
            "created_by",
            "lesson",
            "topic",
            "target_question_count",
            "target_type",
            "grade_level",
            "classroom",
            "students",
            "week_start",
            "week_end",
            "created_at",
            "student_statuses",
        ]
        read_only_fields = ["created_by", "created_at"]

    def create(self, validated_data):
        request = self.context["request"]
        user = request.user

        # Admin ve staff için created_by None
        if user.is_superuser or user.is_staff:
            created_by = None
        else:
            created_by = getattr(user, "teacher_profile", None)

        target_type = validated_data.pop("target_type")
        grade_level = validated_data.pop("grade_level", None)
        classroom = validated_data.pop("classroom", None)

        # ❗ students listesi M2M olduğu için validated_data içinde YOK
        raw_students = request.data.get("students", [])
        student_id_list = [int(s) for s in raw_students] if raw_students else []

        # 1) Görev oluştur
        assignment = CoachingAssignment.objects.create(
            created_by=created_by,
            target_type=target_type,
            **validated_data
        )

        # 2) Hedef öğrenci listesi
        final_students = []

        if target_type == "students":
            final_students = StudentProfile.objects.filter(id__in=student_id_list)

        elif target_type == "grade" and grade_level:
            final_students = StudentProfile.objects.filter(grade_level=grade_level)

        elif target_type == "classroom" and classroom:
            final_students = StudentProfile.objects.filter(classroom=classroom)

        elif target_type == "all":
            final_students = StudentProfile.objects.all()

        # 3) Öğrencilere status oluştur
        for st in final_students:
            StudentAssignmentStatus.objects.create(
                assignment=assignment,
                student=st
            )

        # M2M alanına da öğrencileri ekle
        if target_type == "students":
            assignment.students.set(final_students)

        return assignment
