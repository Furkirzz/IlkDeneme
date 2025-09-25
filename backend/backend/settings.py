from datetime import timedelta
from pathlib import Path
import os
from dotenv import load_dotenv
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Güvenlik ---
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", default="INSECURE-CHANGE-ME")
DEBUG = os.getenv("DJANGO_DEBUG", "True").lower() == "true"

ALLOWED_HOSTS = [
    "46.31.79.7",
    "localhost",
    "127.0.0.1",
    
]

# --- Uygulamalar ---
INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # 3rd party
    "rest_framework",
    "corsheaders",
    "drf_yasg",
    "storages",  # <-- MinIO/S3 için gerekli
    "rest_framework.authtoken",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "allauth.socialaccount.providers.facebook",

    # your apps
    "base",
    "assistant",
    "accounts",
]

AUTH_USER_MODEL = "accounts.CustomUser"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",  # CORS üstte olsun
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "allauth.account.middleware.AccountMiddleware",
]

ROOT_URLCONF = "backend.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "backend.wsgi.application"

# --- DRF + JWT ---
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",  # geliştirirken gerekirse AllowAny yapabilirsiniz
    ),
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=1),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# --- CORS / CSRF ---
CORS_ALLOW_ALL_ORIGINS = True  # prod'da sabitleyin
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://46.31.79.7:3000",
]
CSRF_TRUSTED_ORIGINS = [
    "http://46.31.79.7",
    "http://46.31.79.7:3000",
    "http://localhost:3000",
    # "https://alanadiniz.com",
]

LANGUAGE_CODE = "tr-TR"
TIME_ZONE = "Europe/Istanbul"
USE_I18N = True
USE_TZ = True

# --- Veritabanı (PostgreSQL) ---
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.getenv("PG2_NAME", default="dersane_db"),
        "USER": os.getenv("PG2_USER", default="dersane_user"),
        "PASSWORD": os.getenv("PG2_PASSWORD", default="DersanePass_123"),
        "HOST": os.getenv("PG2_HOST", default="127.0.0.1"),
        "PORT": os.getenv("PG2_PORT", default="5432"),
        "CONN_MAX_AGE": 60,  # basit pooling
    }
}

# --- Statik dosyalar (yerel) ---
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# --- Media dosyaları (MinIO / S3) ---
# Django 4.2+ için önerilen STORAGES yapısı:
STORAGES = {
    "default": {
        "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
    },
    "staticfiles": {
        "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
    },
}

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME")
AWS_S3_ENDPOINT_URL = os.getenv("AWS_S3_ENDPOINT_URL")  # örn: http://46.31.79.7:9000
AWS_S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME", default="us-east-1")
AWS_S3_SIGNATURE_VERSION = os.getenv("AWS_S3_SIGNATURE_VERSION", default="s3v4")
AWS_S3_ADDRESSING_STYLE = os.getenv("AWS_S3_ADDRESSING_STYLE", default="path")
AWS_S3_FILE_OVERWRITE = os.getenv("AWS_S3_FILE_OVERWRITE", "False").lower() == "true"
AWS_QUERYSTRING_AUTH = os.getenv("AWS_QUERYSTRING_AUTH", "False").lower() == "true"
AWS_DEFAULT_ACL = None  # modern django-storages için

# MinIO path-style + public bucket için URL'yi netleştirelim:
# path-style olduğundan URL: http://HOST:9000/<bucket>/<key>
AWS_S3_CUSTOM_DOMAIN = "46.31.79.7:9000"
MEDIA_URL = f"http://{AWS_S3_CUSTOM_DOMAIN}/{AWS_STORAGE_BUCKET_NAME}/"

# (MinIO self-signed SSL kullanmıyorsanız aşağıdakine gerek yok.
# HTTP kullanıyorsunuz, bu yeterli.)
# AWS_S3_VERIFY = False

# Yerel media klasörü KULLANMAYACAĞIZ (S3 kullanıyoruz)
# MEDIA_ROOT tanımlamayın

DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
