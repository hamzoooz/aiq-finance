from django.apps import AppConfig


class FinanceApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'finance_api'

    def ready(self) -> None:
        from . import signals  # noqa: F401
