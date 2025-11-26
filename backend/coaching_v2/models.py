from django.db import models
from django.utils import timezone

from accounts.models import StudentProfile, TeacherProfile, Classroom


class CoachingAssignment(models.Model):

    TARGET_TYPES = [
        ("grade", "Seviye (tüm 8. sınıflar gibi)"),
        ("classroom", "Belirli sınıf"),
        ("students", "Belirli öğrenciler"),
        ("all", "Tüm öğrenciler"),
    ]

    created_by = models.ForeignKey(
        TeacherProfile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assignments"
    )


    lesson = models.CharField(max_length=100)

    topic = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Boş bırakılırsa otomatik olarak 'İsteğe bağlı konu' atanır."
    )

    target_question_count = models.PositiveIntegerField()

    target_type = models.CharField(max_length=20, choices=TARGET_TYPES)

    grade_level = models.IntegerField(
        blank=True,
        null=True,
        help_text="Seviye hedeflemesi için (ör: 8)"
    )

    classroom = models.ForeignKey(
        Classroom,
        on_delete=models.SET_NULL,
        blank=True,
        null=True
    )

    students = models.ManyToManyField(
        StudentProfile,
        blank=True
    )

    week_start = models.DateField()
    week_end = models.DateField()

    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Konu boşsa otomatik konu ekle
        if not self.topic or self.topic.strip() == "":
            self.topic = "İsteğe bağlı konu"

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.lesson} - {self.topic} ({self.created_by.user.full_name})"


class StudentAssignmentStatus(models.Model):

    assignment = models.ForeignKey(
        CoachingAssignment,
        on_delete=models.CASCADE,
        related_name="student_statuses"
    )

    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name="coaching_statuses"
    )

    correct_count = models.IntegerField(default=0)
    wrong_count = models.IntegerField(default=0)
    blank_count = models.IntegerField(default=0)

    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def complete(self):
        self.is_completed = True
        self.completed_at = timezone.now()

    def __str__(self):
        return f"{self.student.user.full_name} - {self.assignment.lesson}"
