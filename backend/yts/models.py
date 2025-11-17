from django.db import models
from datetime import date
from accounts.models import Classroom, StudentProfile, TeacherProfile


# ============================================================
# ACADEMIC YEAR  (örn: 2025–2026)
# ============================================================

class AcademicYear(models.Model):
    start_year = models.PositiveIntegerField(
        null=True, blank=True, default=date.today().year
    )
    end_year = models.PositiveIntegerField(
        null=True, blank=True, default=date.today().year + 1
    )

    class Meta:
        unique_together = ("start_year", "end_year")
        ordering = ["-start_year"]

    def __str__(self):
        if self.start_year and self.end_year:
            return f"{self.start_year}-{self.end_year}"
        return "Belirtilmemiş Yıl"
    

# ============================================================
# SEMESTER (Dönem)
# ============================================================

class Semester(models.Model):
    name = models.CharField(max_length=50, unique=True)

    DEFAULT_CHOICES = [
        "Güz Dönemi",
        "Bahar Dönemi",
        "Yaz Dönemi",
        "Sömestır Dönemi",
    ]

    def __str__(self):
        return self.name


# ============================================================
# TERM  (Akademik Yıl + Dönem)
# ============================================================

class Term(models.Model):
    academic_year = models.ForeignKey(
        AcademicYear,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="terms"
    )
    semester = models.ForeignKey(
        Semester,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="terms"
    )

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    class Meta:
        unique_together = ("academic_year", "semester")

    def __str__(self):
        year = str(self.academic_year) if self.academic_year else "Belirsiz Yıl"
        sem = str(self.semester) if self.semester else "Belirsiz Dönem"
        return f"{year} - {sem}"




# ============================================================
# LESSON
# ============================================================

class Lesson(models.Model):
    name = models.CharField(max_length=100, default="Unnamed Lesson")
    description = models.TextField(blank=True, default="")
    weekly_hours = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


# ============================================================
# SCHEDULE TYPE
# ============================================================

class ScheduleType(models.Model):
    term = models.ForeignKey(
        Term,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="schedule_types",
    )
    name = models.CharField(max_length=100, default="Unnamed Schedule Type")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.term})"


# ============================================================
# SCHEDULE TYPE DAY DETAIL
# ============================================================

DAY_CHOICES = [
    ("monday", "Monday"),
    ("tuesday", "Tuesday"),
    ("wednesday", "Wednesday"),
    ("thursday", "Thursday"),
    ("friday", "Friday"),
    ("saturday", "Saturday"),
    ("sunday", "Sunday"),
]

class ScheduleTypeDayDetail(models.Model):
    schedule_type = models.ForeignKey(
        ScheduleType, on_delete=models.CASCADE, related_name="day_details"
    )

    day_of_week = models.CharField(
        max_length=10, choices=DAY_CHOICES, default="monday"
    )

    start_time = models.TimeField(null=True, blank=True)
    lesson_duration = models.PositiveIntegerField(default=40)    # dakika
    break_duration = models.PositiveIntegerField(default=10)
    lunch_break_duration = models.PositiveIntegerField(default=60)
    lessons_before_noon = models.PositiveIntegerField(default=4)
    lessons_after_noon = models.PositiveIntegerField(default=3)

    class Meta:
        unique_together = ("schedule_type", "day_of_week")

    def __str__(self):
        return f"{self.schedule_type.name} - {self.day_of_week}"


# ============================================================
# COURSE PROGRAM (WEEKLY TEMPLATE)
# ============================================================

class CourseProgram(models.Model):
    term = models.ForeignKey(
        Term, on_delete=models.SET_NULL, null=True, blank=True
    )
    schedule_type = models.ForeignKey(
        ScheduleType, on_delete=models.SET_NULL, null=True, blank=True
    )
    classroom = models.ForeignKey(
        Classroom, on_delete=models.SET_NULL, null=True, blank=True
    )
    lesson = models.ForeignKey(
        Lesson, on_delete=models.SET_NULL, null=True, blank=True
    )

    teacher = models.ForeignKey(
        TeacherProfile, on_delete=models.SET_NULL, null=True, blank=True
    )

    day_of_week = models.CharField(
        max_length=10, choices=DAY_CHOICES, default="monday"
    )

    start_time = models.TimeField(null=True, blank=True)
    end_time = models.TimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return (
            f"{self.classroom} - {self.lesson} "
            f"- {self.day_of_week} ({self.start_time}-{self.end_time})"
        )


# ============================================================
# COURSE PROGRAM INSTANCE (DAILY)
# ============================================================

class CourseProgramInstance(models.Model):
    template = models.ForeignKey(
        CourseProgram,
        on_delete=models.CASCADE,
        related_name="instances",
        null=True,
        blank=True
    )
    date = models.DateField(null=True, blank=True)

    is_cancelled = models.BooleanField(default=False)
    is_rescheduled = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("template", "date")

    def __str__(self):
        return f"{self.template} - {self.date}"


# ============================================================
# ATTENDANCE
# ============================================================

ATTENDANCE_STATUS = [
    ("present", "Present"),
    ("absent", "Absent"),
    ("late", "Late"),
    ("excused", "Excused"),
]


class AttendanceSession(models.Model):
    instance = models.ForeignKey(
        CourseProgramInstance,
        on_delete=models.CASCADE,
        related_name="attendance_sessions",
        null=True,
        blank=True
    )
    date = models.DateField(null=True, blank=True)

    teacher = models.ForeignKey(
        TeacherProfile, on_delete=models.SET_NULL, null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attendance: {self.instance} - {self.date}"


class AttendanceRecord(models.Model):
    attendance_session = models.ForeignKey(
        AttendanceSession,
        on_delete=models.CASCADE,
        related_name="records",
        null=True,
        blank=True
    )
    student = models.ForeignKey(
        StudentProfile, on_delete=models.CASCADE, null=True, blank=True
    )

    status = models.CharField(
        max_length=10, choices=ATTENDANCE_STATUS, default="present"
    )
    notes = models.TextField(blank=True, default="")

    class Meta:
        unique_together = ("attendance_session", "student")

    def __str__(self):
        return f"{self.student} - {self.status}"
