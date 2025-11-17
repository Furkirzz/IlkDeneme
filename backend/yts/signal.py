from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from datetime import timedelta, date
from .models import (
    CourseProgram,
    CourseProgramInstance,
    AttendanceSession,
    AttendanceRecord,
    StudentProfile,
)

# Gün mapping
weekday_map = {
    "monday": 0,
    "tuesday": 1,
    "wednesday": 2,
    "thursday": 3,
    "friday": 4,
    "saturday": 5,
    "sunday": 6,
}


# =============================================================
# 1) GÜNCELLEME ÖNCESİ ESKİ DEĞERLERİ AL
# =============================================================
@receiver(pre_save, sender=CourseProgram)
def store_old_values(sender, instance, **kwargs):
    if not instance.pk:
        return

    old = CourseProgram.objects.get(pk=instance.pk)

    instance._old_day_of_week = old.day_of_week
    instance._old_start_time = old.start_time
    instance._old_end_time = old.end_time


# =============================================================
# 2) COURSEPROGRAM CREATE + UPDATE
# =============================================================
@receiver(post_save, sender=CourseProgram)
def smart_update_instances(sender, instance, created, **kwargs):
    term = instance.term
    if not term:
        return

    today = date.today()

    new_day = instance.day_of_week
    old_day = getattr(instance, "_old_day_of_week", None)

    new_weekday = weekday_map[new_day]
    old_weekday = weekday_map.get(old_day, None)

    # Saat değişimi kontrolü
    old_start = getattr(instance, "_old_start_time", None)
    old_end = getattr(instance, "_old_end_time", None)
    time_changed = (old_start != instance.start_time or old_end != instance.end_time)

    # ---------------------------------------------------------
    # CASE 1: YENİ OLUŞTURMA
    # ---------------------------------------------------------
    if created:
        current_date = term.start_date
        while current_date <= term.end_date:

            if current_date.weekday() == new_weekday:
                CourseProgramInstance.objects.get_or_create(
                    template=instance,
                    date=current_date,
                    defaults={
                        "is_cancelled": False,
                        "is_rescheduled": False
                    }
                )

            current_date += timedelta(days=1)
        return  # ← sadece CREATE için return !!!

    # ---------------------------------------------------------
    # CASE 2: GÜN DEĞİŞTİ
    # ---------------------------------------------------------
    if old_day and old_day != new_day:

        # 2A — Future eski günleri iptal + rescheduled
        future_old_instances = CourseProgramInstance.objects.filter(
            template=instance,
            date__gte=today
        )

        for inst in future_old_instances:
            if inst.date.weekday() == old_weekday:
                inst.is_cancelled = True
                inst.is_rescheduled = True
                inst.save()

        # 2B — Yeni günün future instance'larını oluştur
        current_date = today
        while current_date <= term.end_date:

            if current_date.weekday() == new_weekday:
                CourseProgramInstance.objects.get_or_create(
                    template=instance,
                    date=current_date,
                    defaults={
                        "is_cancelled": False,
                        "is_rescheduled": False
                    }
                )

            current_date += timedelta(days=1)

        return

    # ---------------------------------------------------------
    # CASE 3: SAAT DEĞİŞTİ
    # ---------------------------------------------------------
    if time_changed:

        future_instances = CourseProgramInstance.objects.filter(
            template=instance,
            date__gte=today
        )

        for inst in future_instances:
            inst.is_rescheduled = True
            inst.is_cancelled = False
            inst.save()


# =============================================================
# 3) ATTENDANCE SESSION & RECORDS
# =============================================================
@receiver(post_save, sender=CourseProgramInstance)
def create_or_update_attendance_session(sender, instance, created, **kwargs):

    # Session oluştur veya var olanı al
    session, made = AttendanceSession.objects.get_or_create(
        instance=instance,
        defaults={
            "date": instance.date,
            "teacher": instance.template.teacher,
        }
    )

    # Tarih değişmişse güncelle
    if not made and session.date != instance.date:
        session.date = instance.date
        session.save()

    # Students
    classroom = instance.template.classroom
    students = StudentProfile.objects.filter(classroom=classroom)

    # AttendanceRecord oluştur
    for student in students:
        AttendanceRecord.objects.get_or_create(
            attendance_session=session,
            student=student
        )
