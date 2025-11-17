from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework_simplejwt.views import TokenRefreshView
from accounts.views import EmailTokenObtainPairView
from base.views import GoogleLoginAPIView

schema_view = get_schema_view(
    openapi.Info(
        title="E-Ürün Dokümantasyonu",
        default_version="v1",
        description="Bu proje için Swagger API dokümantasyonudur.",
        contact=openapi.Contact(email="destek@ornek.com"),
        license=openapi.License(name="MIT Lisansı"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    re_path(
        r"^swagger(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    path("swagger/", schema_view.with_ui("swagger", cache_timeout=0), name="schema-swagger-ui"),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),

    path("admin/", admin.site.urls),

    # ✅ Tüm API rotalarını buraya ekle
    path("api/", include("base.urls")),
    path("api/", include("assistant.urls")),
    path("api/", include("pdf_okuma.urls")), 
    path("api/", include("accounts.urls")),

    path("api/yts/", include("yts.urls")),

    # JWT Auth
    path("api/token/", EmailTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Google Login
    path("auth/google/", GoogleLoginAPIView.as_view(), name="google_login"),
    path("auth/social/", include("allauth.socialaccount.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
