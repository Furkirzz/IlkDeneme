from django.db import router
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from accounts.views import LoginView, MeView
from .views import   DersProgramiList, EventDetailView, EventListCreateView, GoogleLoginAPIView, SendSMSView, StudentAnswerBulkUpsertAPIView, StudentResultBulkUpsertAPIView, StudentResultDetailAPIView, StudentResultListCreateAPIView, StudentResultStatsAPIView, UploadResultsView, CombinedResultsAPIView, DenemeSinaviListAPIView, VerifyCodeView  # <== yeni eklenen viewset
from . import views
from rest_framework_simplejwt.views import (   
    TokenRefreshView,
)
# router = DefaultRouter()
# router.register(r'events', EventViewSet)



urlpatterns = [

    path('', views.home_view, name="Routes"),
    path('images/', views.get_image, name="images"),
    path('texts/', views.get_MainPageText, name='Texts'),
    path('contact-info/', views.get_contact_info, name='contact_info'),
    # path('', include(router.urls)),  # <== en alttaki satır yeni
    path('events/', EventListCreateView.as_view(), name='event-list-create'),        # GET tüm event'ler, POST yeni event oluşturma
    path('events/<int:pk>/', EventDetailView.as_view(), name='event-detail'),
    path('ders-programi/', DersProgramiList.as_view(), name='ders-programi-list'),  # BURASI ŞU AN SORUNLU
    

    #kullanıcı Yönetim
    path('google-login/', GoogleLoginAPIView.as_view(), name='google_login'),

    #cevap kağıdı okuma
    
    path("upload-results/", UploadResultsView.as_view(), name="upload-results"),

    # StudentResult CRUD
    path("results/", StudentResultListCreateAPIView.as_view(), name="studentresult-list-create"),
    path("results/<int:pk>/", StudentResultDetailAPIView.as_view(), name="studentresult-detail"),

    # Ek işlemler
    path("results/bulk_upsert/", StudentResultBulkUpsertAPIView.as_view(), name="studentresult-bulk-upsert"),
    path("results/stats/", StudentResultStatsAPIView.as_view(), name="studentresult-stats"),
    # path("results/combined/", CombinedResultsAPIView.as_view(), name="studentresult-combined"),
    # path("denemeler/", DenemeSinaviListAPIView.as_view(), name="deneme-list"),

    path("send-sms/", SendSMSView.as_view(), name="send_sms"),
    path("verify-code/", VerifyCodeView.as_view(), name="verify_code"),
    
    # path('register/', views.RegisterView.as_view(), name='register'),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("auth/me/", MeView.as_view(), name="me"),
]





