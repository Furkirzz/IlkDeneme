from django.contrib import admin

from .models import CustomUser, Role

# Register your models here.
admin.site.register(Role)
admin.site.register(CustomUser)