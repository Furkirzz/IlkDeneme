from rest_framework import serializers

from accounts.models import (
    Classroom,
    StudentProfile,
    TeacherProfile
)

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



# ============================================================
# ACADEMIC YEAR SERIALIZER
# ============================================================

class AcademicYearSerializer(serializers.ModelSerializer):
    display = serializers.SerializerMethodField()

    class Meta:
        model = AcademicYear
        fields = ["id", "start_year", "end_year", "display"]

    def get_display(self, obj):
        return f"{obj.start_year}-{obj.end_year}"


# ============================================================
# SEMESTER SERIALIZER
# ============================================================

class SemesterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Semester
        fields = "__all__"

    def validate_name(self, value):
        if not value:
            raise serializers.ValidationError("Dönem adı boş olamaz.")
        return value


# ============================================================
# TERM SERIALIZER (AcademicYear + Semester)
# ============================================================

class TermSerializer(serializers.ModelSerializer):
    academic_year_display = serializers.SerializerMethodField()
    semester_display = serializers.SerializerMethodField()

    academic_year = serializers.PrimaryKeyRelatedField(
        queryset=AcademicYear.objects.all()
    )
    semester = serializers.PrimaryKeyRelatedField(
        queryset=Semester.objects.all()
    )

    class Meta:
        model = Term
        fields = [
            "id",
            "academic_year",
            "academic_year_display",
            "semester",
            "semester_display",
            "start_date",
            "end_date",
        ]

    def get_academic_year_display(self, obj):
        return f"{obj.academic_year.start_year}-{obj.academic_year.end_year}"

    def get_semester_display(self, obj):
        mapping = dict(obj._meta.get_field("semester").related_model._meta.get_field("name").choices)
        return mapping.get(obj.semester.name, obj.semester.name)



# ============================================================
# LESSON
# ============================================================

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = '__all__'


# ============================================================
# CLASSROOM  (accounts’dan)
# ============================================================

class ClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom
        fields = ['id', 'name', 'grade_level']


# ============================================================
# TEACHER / STUDENT  (accounts’dan)
# ============================================================

class TeacherProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherProfile
        fields = ['id', 'user', 'branch']
        depth = 1  # user bilgisi için


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ['id', 'user', 'school_number', 'classroom']
        depth = 1


# ============================================================
# SCHEDULE TYPE
# ============================================================

class ScheduleTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleType
        fields = '__all__'


# ============================================================
# SCHEDULE TYPE DAY DETAIL
# ============================================================

class ScheduleTypeDayDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduleTypeDayDetail
        fields = '__all__'


# ScheduleType + day details nested
class ScheduleTypeWithDaysSerializer(serializers.ModelSerializer):
    day_details = ScheduleTypeDayDetailSerializer(many=True)

    class Meta:
        model = ScheduleType
        fields = ['id', 'term', 'name', 'day_details']


# ============================================================
# COURSE PROGRAM (Weekly Template)
# ============================================================

class CourseProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseProgram
        fields = '__all__'


# Detailed view (nested)
class CourseProgramDetailSerializer(serializers.ModelSerializer):
    lesson = LessonSerializer()
    classroom = ClassroomSerializer()
    teacher = TeacherProfileSerializer()

    class Meta:
        model = CourseProgram
        fields = '__all__'
        depth = 1


# ============================================================
# COURSE PROGRAM INSTANCE (Daily Calendar)
# ============================================================

class CourseProgramInstanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CourseProgramInstance
        fields = '__all__'


# Detailed version
class CourseProgramInstanceDetailSerializer(serializers.ModelSerializer):
    template = CourseProgramDetailSerializer()

    class Meta:
        model = CourseProgramInstance
        fields = '__all__'


# ============================================================
# ATTENDANCE SESSION
# ============================================================

class AttendanceSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceSession
        fields = '__all__'


# Detailed
class AttendanceSessionDetailSerializer(serializers.ModelSerializer):
    instance = CourseProgramInstanceDetailSerializer()
    teacher = TeacherProfileSerializer()

    class Meta:
        model = AttendanceSession
        fields = '__all__'


# ============================================================
# ATTENDANCE RECORD
# ============================================================

class AttendanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = AttendanceRecord
        fields = '__all__'


# Detailed (student nested)
class AttendanceRecordDetailSerializer(serializers.ModelSerializer):
    student = StudentProfileSerializer()

    class Meta:
        model = AttendanceRecord
        fields = '__all__'
