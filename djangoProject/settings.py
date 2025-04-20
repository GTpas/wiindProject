"""
Django settings for djangoProject project.
"""

from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'django-insecure-01p^#zjar3%odw@&@m%db!v@6127ckehe^9eos4w3hag1-wtg*'
DEBUG = True
ALLOWED_HOSTS = []

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.sites',  # Requis pour django-allauth
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'WIND',
    # Django AllAuth
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

# Configuration Google OAuth
SOCIALACCOUNT_PROVIDERS = {
    'google': {
        'APP': {
            'client_id': '154290529171-6ahfbu70u3e41k922lr1glmnh3lqjfs8.apps.googleusercontent.com',
            'secret': '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',
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

# Configuration CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
]

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
]

# Configuration des en-têtes CORS
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

# Configuration des méthodes CORS
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Configuration de la session
SESSION_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SECURE = False  # Mettre à True en production
CSRF_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False  # Mettre à True en production
CSRF_COOKIE_HTTPONLY = False
SESSION_COOKIE_HTTPONLY = True

# Configuration AllAuth
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

# URLs de redirection OAuth2
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

# Configuration de l'URL du site
SITE_URL = 'http://localhost:3000'

# Configuration des emails - Gmail actif
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = 'noreplywiind2025@gmail.com'
EMAIL_HOST_PASSWORD = 'wfarkhewnnvugjsg'  # Mot de passe d'application sans espaces
DEFAULT_FROM_EMAIL = 'noreplywiind2025@gmail.com'

# Configuration console (commentée)
# EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Configuration des médias
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
AUTH_USER_MODEL = 'WIND.Utilisateur'

# Configuration dj-rest-auth
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
