# backend/settings.py
from datetime import timedelta
from pathlib import Path
import os
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Güvenlik ---
SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "INSECURE-CHANGE-ME")
DEBUG = os.getenv("DJANGO_DEBUG", "True").strip().lower() in ("1", "true", "yes", "on")

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
    "storages",  # MinIO / S3
    "rest_framework.authtoken",
    "dj_rest_auth",
    "dj_rest_auth.registration",
    "allauth",
    "allauth.account",
    "allauth.socialaccount",
    "allauth.socialaccount.providers.google",
    "allauth.socialaccount.providers.facebook",

    "drf_spectacular",
    "drf_spectacular_sidecar", 

    # your apps
    "base",
    "assistant",
    "accounts",
    "coach",
    "yts",
    "pdf_okuma"
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
        "rest_framework.permissions.IsAuthenticated",  # geliştirmede AllowAny yapabilirsiniz
    ),
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "Akademi API",
    "DESCRIPTION": "Ders / Yoklama servisleri",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,  # şemayı ayrıca route'ladığımız için
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
]

LANGUAGE_CODE = "tr-TR"
TIME_ZONE = "Europe/Istanbul"
USE_I18N = True
USE_TZ = True

# ===========================
# Veritabanı (PG2_* -> yoksa SQLite)
# ===========================
def _env(name: str, default: str = "") -> str:
    return (os.getenv(name, default) or "").strip()

PG2_NAME = _env("PG2_NAME")
PG2_USER = _env("PG2_USER")
PG2_PASSWORD = _env("PG2_PASSWORD")
PG2_HOST = _env("PG2_HOST")
PG2_PORT = _env("PG2_PORT")
DB_CONN_MAX_AGE = int(_env("DB_CONN_MAX_AGE", "60"))
DB_CONNECT_TIMEOUT = int(_env("DB_CONNECT_TIMEOUT", "5"))
DB_SSLMODE = _env("DB_SSLMODE")  # örn: require / prefer / disable
USE_SQLITE_FALLBACK = (_env("USE_SQLITE_FALLBACK", "1").lower() in ("1", "true", "yes", "on"))

PG_READY = all([PG2_NAME, PG2_USER, PG2_PASSWORD, PG2_HOST, PG2_PORT])

if PG_READY:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.postgresql",
            "NAME": PG2_NAME,
            "USER": PG2_USER,
            "PASSWORD": PG2_PASSWORD,
            "HOST": PG2_HOST,
            "PORT": PG2_PORT,  # 55432 gibi özel portu destekler
            "CONN_MAX_AGE": DB_CONN_MAX_AGE,
            "OPTIONS": {
                "connect_timeout": DB_CONNECT_TIMEOUT,
                **({"sslmode": DB_SSLMODE} if DB_SSLMODE else {}),
            },
        }
    }
else:
    if USE_SQLITE_FALLBACK:
        DATABASES = {
            "default": {
                "ENGINE": "django.db.backends.sqlite3",
                "NAME": BASE_DIR / "db.sqlite3",
            }
        }
        print("[settings] PG2_* boş => SQLite kullanılıyor. PostgreSQL için .env içindeki PG2_* değerlerini doldurun.")
    else:
        raise RuntimeError(
            "PG2_* boş ve USE_SQLITE_FALLBACK=0. "
            "Ya PG2_* değerlerini doldurun ya da USE_SQLITE_FALLBACK=1 yapın."
        )

# ===========================
# Statik dosyalar
# ===========================
STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# ===========================
# Media (MinIO/S3 -> yoksa yerel)
# ===========================
AWS_ACCESS_KEY_ID = _env("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = _env("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = _env("AWS_STORAGE_BUCKET_NAME")
AWS_S3_ENDPOINT_URL = _env("AWS_S3_ENDPOINT_URL")  # örn: http://46.31.79.7:9000
AWS_S3_REGION_NAME = _env("AWS_S3_REGION_NAME") or "us-east-1"
AWS_S3_SIGNATURE_VERSION = _env("AWS_S3_SIGNATURE_VERSION") or "s3v4"
AWS_S3_ADDRESSING_STYLE = _env("AWS_S3_ADDRESSING_STYLE") or "path"
AWS_S3_FILE_OVERWRITE = (_env("AWS_S3_FILE_OVERWRITE", "0").lower() in ("1", "true", "yes", "on"))
AWS_QUERYSTRING_AUTH = (_env("AWS_QUERYSTRING_AUTH", "0").lower() in ("1", "true", "yes", "on"))

USE_S3 = all([
    AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY,
    AWS_STORAGE_BUCKET_NAME,
    AWS_S3_ENDPOINT_URL,
])

if USE_S3:
    # Django 4.2+ STORAGES tanımı
    STORAGES = {
        "default": {"BACKEND": "storages.backends.s3boto3.S3Boto3Storage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }

    # MinIO / S3 ayarları
    AWS_DEFAULT_ACL = None  # modern django-storages
    # MEDIA_URL'i endpoint'ten türet (http://HOST:PORT/<bucket>/)
    _parsed = urlparse(AWS_S3_ENDPOINT_URL)
    _scheme = _parsed.scheme or "http"
    _netloc = _parsed.netloc  # host[:port]
    MEDIA_URL = f"{_scheme}://{_netloc}/{AWS_STORAGE_BUCKET_NAME}/"
    # İsterseniz path-style yerine custom domain kullanabilirsiniz:
    # AWS_S3_CUSTOM_DOMAIN = _netloc
else:
    # Yerel dosya sistemi
    STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
    MEDIA_URL = "/media/"
    MEDIA_ROOT = BASE_DIR / "media"
    print("[settings] AWS_*/MinIO değişkenleri boş => yerel media (/media/) kullanılacak.")

DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
