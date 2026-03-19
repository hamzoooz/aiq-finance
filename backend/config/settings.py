import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = os.getenv('DJANGO_SECRET_KEY', 'django-insecure-change-me')
DEBUG = os.getenv('DJANGO_DEBUG', 'False').lower() == 'true'

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv(
        'DJANGO_ALLOWED_HOSTS',
        'finance.aiq.qa,localhost,127.0.0.1',
    ).split(',')
    if host.strip()
]

CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv(
        'DJANGO_CSRF_TRUSTED_ORIGINS',
        'https://finance.aiq.qa',
    ).split(',')
    if origin.strip()
]

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'finance_api',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

FINANCE_WEBHOOK_URLS = [
    url.strip()
    for url in os.getenv(
        'FINANCE_WEBHOOK_URLS',
        'https://auto.aiq.qa/webhook/aiq-finance,https://auto.aiq.qa/webhook-test/aiq-finance',
    ).split(',')
    if url.strip()
]

FINANCE_WEBHOOK_RESOLVE_MAP: dict[str, str] = {}
for item in os.getenv('FINANCE_WEBHOOK_RESOLVE_MAP', 'auto.aiq.qa=51.178.82.182').split(','):
    part = item.strip()
    if not part or '=' not in part:
        continue
    host, ip = part.split('=', 1)
    host = host.strip()
    ip = ip.strip()
    if host and ip:
        FINANCE_WEBHOOK_RESOLVE_MAP[host] = ip
