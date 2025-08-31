"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path,include
from django.conf import settings
from django.conf.urls.static import static

from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.urls import path, re_path
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import EmailTokenObtainPairView, get_user_profile
from base.views import DersProgramiList, GoogleLoginAPIView


schema_view = get_schema_view(
    openapi.Info(
        title="E-Ürün Dokümantasyonu",
        default_version='v1',
        description="Bu proje için Swagger API dokümantasyonudur.",
        contact=openapi.Contact(email="destek@ornek.com"),
        license=openapi.License(name="MIT Lisansı"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)



urlpatterns = [
    re_path(r'^swagger(?P<format>\.json|\.yaml)$',
        schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),

    path('admin/', admin.site.urls),
    path('api/', include('base.urls')),
    path('api/', include('assistant.urls')), # --> Bu satırı buraya taşıdık!
    path("api/token/", EmailTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/user/", get_user_profile, name="user_profile"),
    # path('api/ders-programi/', DersProgramiList.as_view(), name='ders-programi-list'),  # BURASI ŞU AN SORUNLU


    
   



    # allauth (Google sosyal login için gerekli)
    path('auth/social/', include('allauth.socialaccount.urls')),


    # Google login endpoint (React frontend'den access_token geldiğinde kullanılır)
    path('auth/google/', GoogleLoginAPIView.as_view(), name='google_login'),
    

    # Eğer dj-rest-auth ve allauth ile ilgili yollarınız varsa, onları da ekleyin
    # path('auth/', include('dj_rest_auth.urls')),
    # path('auth/registration/', include('dj_rest_auth.registration.urls')),
    # path('auth/social/', include('allauth.socialaccount.urls')),
    # path('auth/google/', GoogleLoginAPIView.as_view(), name='google_login'), # GoogleLoginAPIView import etmeniz gerekebilir
]

# static() çağrısını sadece bir kez yapıyoruz ve if bloğunun dışına çıkarıyoruz
# Eğer DEBUG modunda ek olarak medya dosyaları servis etmek istiyorsanız,
# if bloğunu kullanmaya devam edebilirsiniz.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)