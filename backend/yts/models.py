from django.db import models

# Create your models here.
class Lesson(models.Model):
    date = models.DateField("Ders Tarihi")
    description = models.TextField("Açıklama")
    start_time = models.TimeField("Başlangıç Saati")
    end_time = models.TimeField("Bitiş Saati")
    teacher = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, limit_choices_to={'profile_type': 'teacher'})
    classroom = models.ForeignKey('accounts.Classroom', on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.date} - {self.start_time} - {self.end_time} - {self.teacher} - {self.classroom}"
    

class Attendance(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='attendances')
    student = models.ForeignKey('accounts.CustomUser', on_delete=models.CASCADE, limit_choices_to={'profile_type': 'student'})
    status = models.CharField(max_length=10, choices=[('present', 'Mevcut'), ('absent', 'Devamsız'), ('late', 'Geç Kaldı')])
    notes = models.TextField(blank=True, null=True)
    recorded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('lesson', 'student')

    def __str__(self):
        return f"{self.lesson} - {self.student} - {self.status}"
    
