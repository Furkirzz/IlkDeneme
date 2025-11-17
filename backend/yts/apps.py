from django.apps import AppConfig


class YtsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'yts'

    def ready(self):
        import yts.signal
