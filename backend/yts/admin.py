from django.contrib import admin

# Register your models here.
from .models import Lesson, Attendance

admin.site.register(Lesson)
admin.site.register(Attendance)