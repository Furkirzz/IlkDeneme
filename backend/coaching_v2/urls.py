from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import CoachingAssignmentViewSet, StudentAssignmentStatusViewSet

router = DefaultRouter()
router.register("assignments", CoachingAssignmentViewSet, basename="coaching-assignment")
router.register("student-status", StudentAssignmentStatusViewSet, basename="student-status")

urlpatterns = [
    path("", include(router.urls)),
]
