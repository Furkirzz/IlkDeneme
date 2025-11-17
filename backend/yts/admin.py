from django.contrib import admin
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
# ACADEMIC YEAR ADMIN
# ============================================================

@admin.register(AcademicYear)
class AcademicYearAdmin(admin.ModelAdmin):
    list_display = ("start_year", "end_year", "__str__")
    ordering = ("-start_year",)
    search_fields = ("start_year", "end_year")


# ============================================================
# SEMESTER ADMIN
# ============================================================

@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ("id", "name")
    search_fields = ("name",)
    ordering = ("id",)


# ============================================================
# TERM ADMIN
# ============================================================

@admin.register(Term)
class TermAdmin(admin.ModelAdmin):
    list_display = (
        "academic_year",
        "semester",
        "start_date",
        "end_date",
    )
    list_filter = ("academic_year", "semester")
    search_fields = ("academic_year__start_year", "academic_year__end_year")



# ======================================================
# LESSON
# ======================================================

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("name", "weekly_hours", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name",)
    ordering = ("name",)


# ======================================================
# SCHEDULE TYPE + DAY DETAILS INLINE
# ======================================================

class ScheduleTypeDayDetailInline(admin.TabularInline):
    model = ScheduleTypeDayDetail
    extra = 1


@admin.register(ScheduleType)
class ScheduleTypeAdmin(admin.ModelAdmin):
    list_display = ("name", "term", "created_at")
    list_filter = ("term",)
    inlines = [ScheduleTypeDayDetailInline]


# ======================================================
# COURSE PROGRAM (WEEKLY TEMPLATE)
# ======================================================

@admin.register(CourseProgram)
class CourseProgramAdmin(admin.ModelAdmin):
    list_display = (
        "classroom",
        "lesson",
        "teacher",
        "day_of_week",
        "start_time",
        "end_time",
        "term",
    )
    list_filter = ("term", "classroom", "lesson", "teacher", "day_of_week")
    search_fields = ("classroom__name", "lesson__name", "teacher__user__full_name")
    ordering = ("classroom__name", "day_of_week", "start_time")


# ======================================================
# COURSE PROGRAM INSTANCE (DAILY)
# ======================================================

@admin.register(CourseProgramInstance)
class CourseProgramInstanceAdmin(admin.ModelAdmin):
    list_display = (
        "template",
        "date",
        "is_cancelled",
        "is_rescheduled",
        "created_at",
    )
    list_filter = ("template__term", "date", "template__classroom")
    ordering = ("-date",)
    search_fields = ("template__classroom__name",)


# ======================================================
# ATTENDANCE RECORD INLINE
# ======================================================

class AttendanceRecordInline(admin.TabularInline):
    model = AttendanceRecord
    extra = 0
    autocomplete_fields = ("student",)
    fields = ("student", "status", "notes")
    readonly_fields = ()


# ======================================================
# ATTENDANCE SESSION
# ======================================================

@admin.register(AttendanceSession)
class AttendanceSessionAdmin(admin.ModelAdmin):
    list_display = (
        "instance",
        "teacher",
        "date",
        "created_at",
    )
    list_filter = ("date", "teacher", "instance__template__classroom")
    search_fields = ("teacher__user__full_name", "instance__template__classroom__name")
    ordering = ("-date",)
    inlines = [AttendanceRecordInline]


# ======================================================
# ATTENDANCE RECORD (Single view)
# ======================================================

@admin.register(AttendanceRecord)
class AttendanceRecordAdmin(admin.ModelAdmin):
    list_display = ("attendance_session", "student", "status")
    list_filter = ("status", "attendance_session__date")
    search_fields = ("student__user__full_name",)
    ordering = ("attendance_session",)
