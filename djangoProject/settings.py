from pathlib import Path
from datetime import timedelta
import os

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'default-insecure-key-replace-in-production'
DEBUG = False
GOOGLE_CLIENT_ID = ''
GOOGLE_CLIENT_SECRET = ''
EMAIL_HOST_PASSWORD = ''

try:
    from .local_settings import *
except ImportError:
    pass

ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',  
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'WIND',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
    'allauth.socialaccount.providers.google',
    'dj_rest_auth',
    'dj_rest_auth.registration',
]

SITE_ID = 1

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
]

SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': GOOGLE_CLIENT_ID,
            'secret': GOOGLE_CLIENT_SECRET,
            'key': ''
        },
        'SCOPE': [
            'profile',
            'email',
        ],
        'AUTH_PARAMS': {
            'access_type': 'online',
        },
        'OAUTH_PKCE_ENABLED': True,
        'VERIFIED_EMAIL': True,
        'VERSION': 'v2',
    }
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.BasicAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ]
}

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware',  # Nouveau middleware pour allauth
]

CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'cookie',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = False  
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False  
CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_HTTPONLY = True

ACCOUNT_USER_MODEL_USERNAME_FIELD = None
ACCOUNT_EMAIL_REQUIRED = True
ACCOUNT_USERNAME_REQUIRED = False
ACCOUNT_AUTHENTICATION_METHOD = 'email'
ACCOUNT_EMAIL_VERIFICATION = 'none'
SOCIALACCOUNT_AUTO_SIGNUP = True
SOCIALACCOUNT_EMAIL_REQUIRED = True
SOCIALACCOUNT_STORE_TOKENS = True
LOGIN_REDIRECT_URL = 'http://localhost:3000/dashboard'
ACCOUNT_LOGOUT_REDIRECT_URL = 'http://localhost:3000'
ACCOUNT_ADAPTER = 'WIND.adapters.CustomAccountAdapter'
SOCIALACCOUNT_ADAPTER = 'WIND.adapters.CustomSocialAccountAdapter'

OAUTH2_REDIRECT_URI = 'http://localhost:3000/google-callback'
OAUTH2_CALLBACK_URL = 'http://localhost:3000/google-callback'

ROOT_URLCONF = 'djangoProject.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'djangoProject.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

SITE_URL = 'http://localhost:3000'

EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'noreplywiind2025@gmail.com'
EMAIL_HOST_PASSWORD = EMAIL_HOST_PASSWORD  
DEFAULT_FROM_EMAIL = 'noreplywiind2025@gmail.com'


STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'WIND.Utilisateur'

REST_AUTH = {
    'USER_DETAILS_SERIALIZER': 'WIND.serializers.user_serializers.UserDetailsSerializer',
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'auth',
    'JWT_AUTH_REFRESH_COOKIE': 'refresh-token',
    'JWT_AUTH_HTTPONLY': False,
    'TOKEN_MODEL': None,
    'REGISTER_SERIALIZER': 'WIND.serializers.user_serializers.InscriptionSerializer',
}

REST_USE_JWT = True
JWT_AUTH_COOKIE = 'auth'
JWT_AUTH_REFRESH_COOKIE = 'refresh-token'

SIMPLE_JWT = {
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=1),
}
