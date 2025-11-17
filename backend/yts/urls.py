from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    AcademicYearViewSet,
    SemesterViewSet,
    TermViewSet,
    LessonViewSet,
    ScheduleTypeViewSet,
    ScheduleTypeDayDetailViewSet,
    CourseProgramViewSet,
    CourseProgramInstanceViewSet,
    AttendanceSessionViewSet,
    AttendanceRecordViewSet,
)

router = DefaultRouter()
router.register("academic-years", AcademicYearViewSet)
router.register("semesters", SemesterViewSet)
router.register("terms", TermViewSet)
router.register("lessons", LessonViewSet)
router.register("schedule-types", ScheduleTypeViewSet)
router.register("schedule-day-details", ScheduleTypeDayDetailViewSet)
router.register("course-programs", CourseProgramViewSet)
router.register("course-instances", CourseProgramInstanceViewSet)
router.register("attendance-sessions", AttendanceSessionViewSet)
router.register("attendance-records", AttendanceRecordViewSet)

urlpatterns = [
    path("", include(router.urls)),
]
