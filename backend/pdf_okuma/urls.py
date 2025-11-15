from django.urls import path
from .views import DenemeSinaviListAPIView, ExamImportView, CombinedResults

urlpatterns = [
    path("import-pdf/", ExamImportView.as_view(), name="import-pdf"),
    path("exams/", DenemeSinaviListAPIView.as_view(), name="deneme-list"),
    path("results/combined/", CombinedResults.as_view(), name="combined-results"),
]
