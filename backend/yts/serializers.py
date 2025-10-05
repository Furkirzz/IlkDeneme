# lessons/serializers.py (örnek konum)
from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator

from accounts.models import CustomUser, Classroom
from .models import Lesson, Attendance


# --- Küçük yardımcı özetler ---
class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "full_name", "email", "profile_type"]


class ClassroomMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom
        fields = ["id", "name", "grade_level"]


# --- Attendance ---
class AttendanceSerializer(serializers.ModelSerializer):
    # write
    lesson = serializers.PrimaryKeyRelatedField(queryset=Lesson.objects.all())
    student = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all())

    # read-only özet
    student_detail = UserMiniSerializer(source="student", read_only=True)

    class Meta:
        model = Attendance
        fields = [
            "id", "lesson", "student", "student_detail",
            "status", "notes", "recorded_at"
        ]
        read_only_fields = ["recorded_at"]
        validators = [
            UniqueTogetherValidator(
                queryset=Attendance.objects.all(),
                fields=["lesson", "student"],
                message="Bu öğrenci için bu derste zaten yoklama kaydı var."
            )
        ]

    def validate_student(self, user: CustomUser):
        if user.profile_type != CustomUser.ProfileType.STUDENT:
            raise serializers.ValidationError("Seçilen kullanıcı 'student' tipinde olmalı.")
        return user


# --- Lesson (temel) ---
class LessonSerializer(serializers.ModelSerializer):
    # write
    teacher = serializers.PrimaryKeyRelatedField(queryset=CustomUser.objects.all())
    classroom = serializers.PrimaryKeyRelatedField(
        queryset=Classroom.objects.all(), allow_null=True, required=False
    )

    # read-only özet
    teacher_detail = UserMiniSerializer(source="teacher", read_only=True)
    classroom_detail = ClassroomMiniSerializer(source="classroom", read_only=True)

    class Meta:
        model = Lesson
        fields = [
            "id",
            "date", "description",
            "start_time", "end_time",
            "teacher", "teacher_detail",
            "classroom", "classroom_detail",
            "created_at",
        ]
        read_only_fields = ["created_at"]

    def validate_teacher(self, user: CustomUser):
        if user.profile_type != CustomUser.ProfileType.TEACHER:
            raise serializers.ValidationError("Seçilen kullanıcı 'teacher' tipinde olmalı.")
        return user


# --- Lesson + attendances (detay görünüm için) ---
class LessonDetailSerializer(LessonSerializer):
    attendances = AttendanceSerializer(many=True, read_only=True)

    class Meta(LessonSerializer.Meta):
        fields = LessonSerializer.Meta.fields + ["attendances"]
