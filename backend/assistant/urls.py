from django.urls import path
from . import views  # varsa ViewSet değil de function-based view'lar kullanıyorsanız

urlpatterns = [
    path("assistantqa/", views.QAListAPIView.as_view(), name="qa-list"),
    path('ask/', views.ask_assistant, name='ask_assistant'),
]