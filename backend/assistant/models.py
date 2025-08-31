from django.db import models

LANGUAGE_CHOICES = [
    ('tr', 'Türkçe'),
    ('en', 'English'),
    # başka diller eklersen buraya ekle
]

class QAEntry(models.Model):
    question = models.CharField("Soru", max_length=255)
    answer = models.TextField("Cevap")
    language = models.CharField("Dil", max_length=10, choices=LANGUAGE_CHOICES)
    active = models.BooleanField("Aktif", default=True)

    def _str_(self):
        return f"[{self.language}] {self.question}"
    
    class Meta:
        verbose_name = "Soru-Cevap"
        verbose_name_plural = "Soru-Cevaplar"