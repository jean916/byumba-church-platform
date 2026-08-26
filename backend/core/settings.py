"""
Django settings for the Byumba Church Platform.
Multi-tenant model: Diocese -> Parish -> Members/Groups/Offerings
"""
import os
from datetime import timedelta
from pathlib import Path
from dotenv import load_dotenv
import dj_database_url

BASE_DIR = Path(__file__).resolve().parent.parent

# Loads variables from a .env file in the backend/ folder (not committed to
# git - see .env.example for the template). Locally this holds DEBUG=True
# and a dev secret key; in production it holds DEBUG=False, a real secret
# key, and your actual domain.
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "DJANGO_SECRET_KEY is not set. Copy .env.example to .env and fill it in "
        "(see the backend README section on environment setup)."
    )

DEBUG = os.environ.get("DJANGO_DEBUG", "False") == "True"
ALLOWED_HOSTS = [h for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",") if h]
if DEBUG and not ALLOWED_HOSTS:
    ALLOWED_HOSTS = ["localhost", "127.0.0.1"]

# Render sets this automatically for every deployed service - adding it
# means you don't have to manually list Render's generated *.onrender.com
# URL in DJANGO_ALLOWED_HOSTS (your real domain still needs to be added
# there once it's connected).
RENDER_HOSTNAME = os.environ.get("RENDER_EXTERNAL_HOSTNAME")
if RENDER_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_HOSTNAME)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "cloudinary_storage",
    "cloudinary",
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "accounts",
    "dioceses",
    "content",
    "offerings",
]

AUTH_USER_MODEL = "accounts.User"

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.locale.LocaleMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"

# Use PostgreSQL in production; SQLite is fine for local development.
DATABASES = {
    "default": {
        "ENGINE": os.environ.get("DB_ENGINE") or "django.db.backends.sqlite3",
        "NAME": os.environ.get("DB_NAME") or (BASE_DIR / "db.sqlite3"),
        "USER": os.environ.get("DB_USER", ""),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
        "HOST": os.environ.get("DB_HOST", ""),
        "PORT": os.environ.get("DB_PORT", ""),
    }
}

# Render (and most hosts) provide a single DATABASE_URL connection string
# for PostgreSQL rather than separate host/user/password variables - this
# overrides the block above with that single URL when present, so nothing
# needs to change here when you deploy.
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    DATABASES["default"] = dj_database_url.parse(DATABASE_URL, conn_max_age=600)

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- Localization: Kinyarwanda + English ---
LANGUAGE_CODE = "en"
LANGUAGES = [
    ("en", "English"),
    ("rw", "Kinyarwanda"),
]
LOCALE_PATHS = [BASE_DIR / "locale"]
TIME_ZONE = "Africa/Kigali"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Uploaded photos (parishes, groups, clergy, etc). Render's free web
# services don't have persistent disk - any file saved locally disappears
# on the next deploy/restart. Cloudinary gives free, permanent storage for
# these; when CLOUDINARY_URL isn't set (e.g. local development), uploads
# just go to the local media/ folder as before, so nothing extra is needed
# to develop locally.
CLOUDINARY_URL = os.environ.get("CLOUDINARY_URL")
if CLOUDINARY_URL:
    STORAGES = {
        "default": {"BACKEND": "cloudinary_storage.storage.MediaCloudinaryStorage"},
        "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
    }
else:
    STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# Some third-party static files (notably a couple of icons referenced by
# Django's own admin CSS) don't always get collected in every environment.
# Without this, WhiteNoise's strict manifest storage fails the entire
# collectstatic step over one missing icon reference - this makes it warn
# instead of crash, matching WhiteNoise's own documented recommendation.
WHITENOISE_MANIFEST_STRICT = False

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    # Rate limiting - protects the login endpoint (and everything else)
    # from brute-force password guessing. "anon" covers login/register
    # attempts before someone's authenticated.
    "DEFAULT_THROTTLE_CLASSES": (
        "rest_framework.throttling.AnonRateThrottle",
        "rest_framework.throttling.UserRateThrottle",
    ),
    "DEFAULT_THROTTLE_RATES": {
        "anon": "20/minute",
        "user": "1000/day",
    },
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),
}

CORS_ALLOW_ALL_ORIGINS = DEBUG

# --- Email (for password reset) ---
# Uses any standard SMTP provider - set these in .env locally or in Render's
# environment variables in production. Free options that work well: Brevo,
# Resend, Mailgun. Without these set, emails print to the console instead
# of sending (useful for local testing without a real email account).
EMAIL_HOST = os.environ.get("EMAIL_HOST", "")
if EMAIL_HOST:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_PORT = int(os.environ.get("EMAIL_PORT", "587"))
    EMAIL_HOST_USER = os.environ.get("EMAIL_HOST_USER", "")
    EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")
    EMAIL_USE_TLS = os.environ.get("EMAIL_USE_TLS", "True") == "True"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "no-reply@byumbaanglican.rw")

# The frontend URL used to build password-reset links in emails.
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:5173")
CORS_ALLOWED_ORIGINS = [o for o in os.environ.get("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",") if o]

# --- Production-only security hardening ---
# These only kick in once DEBUG=False (i.e. once you're live on a real
# domain with HTTPS) - they'd break local development over plain http://,
# so they stay off while DEBUG=True.
if not DEBUG:
    SECURE_SSL_REDIRECT = True
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_HSTS_SECONDS = 31536000  # 1 year
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True
    CSRF_TRUSTED_ORIGINS = [
        o for o in os.environ.get("CSRF_TRUSTED_ORIGINS", "").split(",") if o
    ]

# --- File upload limits ---
# Applied per-field via validators (see core/validators.py) so uploads are
# checked for type; this caps the raw upload size DRF/Django will even read
# into memory before that check runs.
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10 MB

# --- Logging ---
# Django's own default logging config only prints errors to the console
# when DEBUG=True - in production (DEBUG=False) they'd normally go nowhere
# unless email alerting (ADMINS) is configured, which we haven't set up.
# This makes unhandled server errors (500s) show up in Render's Logs tab
# regardless of DEBUG, which is essential for debugging a live site.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
        },
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}
