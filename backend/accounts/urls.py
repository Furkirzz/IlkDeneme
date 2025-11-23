# Örn. urls.py
from django.urls import path
from . import views
# ... diğer view'lar ve routerlar ...

urlpatterns = [
    # ... mevcut url yolları ...
    
    # Frontend'in beklediği endpoint:
    path('current/profile/', views.CurrentUserProfileAPIView.as_view(), name='current-user-profile'),
    path("classrooms/", views.ClassroomListCreateAPIView.as_view()),
    path("classrooms/<int:pk>/", views.ClassroomDetailAPIView.as_view()),
    path("teachers/", views.TeacherListAPIView.as_view()),
    path("teachers/<int:pk>/", views.TeacherDetailAPIView.as_view()),
]