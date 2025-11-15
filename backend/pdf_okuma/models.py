from django.db import models


class ExamSet(models.Model):
    """Her deneme sınavını temsil eder."""
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, null=True)
    date = models.DateTimeField(auto_now_add=True)
    session_count = models.PositiveSmallIntegerField(default=2)
    booklet_types = models.CharField(max_length=50, default="A/B")
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.date.strftime('%d.%m.%Y')})"


class ExamResult(models.Model):
    """PDF'den okunmuş her öğrencinin net/dogru/yanlış bilgileri"""
    exam_set = models.ForeignKey(ExamSet, on_delete=models.CASCADE, related_name="results")

    # İSTENEN ŞEMA: school_code, gender, session, booklet_type KALDIRILDI
    student_no = models.CharField(max_length=10, blank=True, default="")
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    classroom = models.CharField(max_length=5, blank=True, default="")

    # 6 ders
    turkish_correct = models.FloatField(default=0)
    turkish_wrong = models.FloatField(default=0)
    turkish_net = models.FloatField(default=0)

    history_correct = models.FloatField(default=0)
    history_wrong = models.FloatField(default=0)
    history_net = models.FloatField(default=0)

    religion_correct = models.FloatField(default=0)
    religion_wrong = models.FloatField(default=0)
    religion_net = models.FloatField(default=0)

    english_correct = models.FloatField(default=0)
    english_wrong = models.FloatField(default=0)
    english_net = models.FloatField(default=0)

    math_correct = models.FloatField(default=0)
    math_wrong = models.FloatField(default=0)
    math_net = models.FloatField(default=0)

    science_correct = models.FloatField(default=0)
    science_wrong = models.FloatField(default=0)
    science_net = models.FloatField(default=0)

    # toplamlar
    total_correct = models.FloatField(default=0)
    total_wrong = models.FloatField(default=0)
    total_net = models.FloatField(default=0)
    score = models.FloatField(default=0)

    raw_line = models.TextField(blank=True, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    def calculate_totals(self):
        self.total_correct = (
            self.turkish_correct + self.history_correct + self.religion_correct +
            self.english_correct + self.math_correct + self.science_correct
        )
        self.total_wrong = (
            self.turkish_wrong + self.history_wrong + self.religion_wrong +
            self.english_wrong + self.math_wrong + self.science_wrong
        )
        self.total_net = (
            self.turkish_net + self.history_net + self.religion_net +
            self.english_net + self.math_net + self.science_net
        )

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.exam_set.name}"


class ExamKey(models.Model):
    """Cevap anahtarları (BURADA değişiklik YOK)"""
    exam_set = models.ForeignKey(ExamSet, on_delete=models.CASCADE, related_name="keys")
    booklet_type = models.CharField(max_length=1, default="A")

    turkish = models.CharField(max_length=20, default="")
    history = models.CharField(max_length=10, default="")
    religion = models.CharField(max_length=10, default="")
    english = models.CharField(max_length=10, default="")
    math = models.CharField(max_length=20, default="")
    science = models.CharField(max_length=20, default="")

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["exam_set", "booklet_type"]

    def __str__(self):
        return f"{self.exam_set.name} - Kitapçık {self.booklet_type}"

    def get_full_key(self):
        return self.turkish + self.history + self.religion + self.english + self.math + self.science
