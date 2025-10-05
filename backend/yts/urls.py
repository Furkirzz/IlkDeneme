# lessons/urls.py
from django.urls import path
from . import views

app_name = 'lessons'

urlpatterns = [
    # Ders işlemleri
    path('lessons/', views.list_lessons, name='lesson-list'),
    path('lessons/<int:lesson_id>/', views.get_lesson_detail, name='lesson-detail'),
    path('lessons/create/', views.create_lesson, name='lesson-create'),
    path('lessons/<int:lesson_id>/update/', views.update_lesson, name='lesson-update'),
    path('lessons/<int:lesson_id>/partial-update/', views.partial_update_lesson, name='lesson-partial-update'),
    path('lessons/<int:lesson_id>/delete/', views.delete_lesson, name='lesson-delete'),
    
    # Sınıf öğrencileri
    path('lessons/<int:lesson_id>/students/', views.list_classroom_students, name='classroom-students'),
    
    # Yoklama işlemleri
    path('lessons/<int:lesson_id>/attendance/roster/', views.get_attendance_roster, name='attendance-roster'),
    path('lessons/<int:lesson_id>/attendance/bulk/', views.bulk_upsert_attendance, name='attendance-bulk'),
    path('lessons/<int:lesson_id>/attendance/save/', views.save_single_attendance, name='attendance-save'),
    path('attendance/<int:attendance_id>/delete/', views.delete_attendance, name='attendance-delete'),


    path('students/<int:student_id>/attendance-stats/', views.student_attendance_stats, name='student-attendance-stats'),
    path('students/<int:student_id>/attendance-report/', views.student_attendance_report, name='student-attendance-report'),
]