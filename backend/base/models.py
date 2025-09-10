from django.db import models
from datetime import date  # date.today için doğru import
from django.utils import timezone  # timezone.now için



GUNLER = [
    ('Pazartesi', 'Pazartesi'),
    ('Salı', 'Salı'),
    ('Çarşamba', 'Çarşamba'),
    ('Perşembe', 'Perşembe'),
    ('Cuma', 'Cuma'),
    ('Cumartesi', 'Cumartesi'),
    ('Pazar', 'Pazar'),
]


class Image(models.Model):
    image = models.ImageField(upload_to='photos/')
    status = models.IntegerField(default=1)
    date = models.DateField(default=date.today)  # datetime.date.today yerine doğrudan date.today
    kategori = models.ForeignKey('CategoryImage', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.kategori} - Resmin eklendiği tarih {self.date}"
    

class MainPageText(models.Model):
    icerik = models.TextField()
    status = models.IntegerField(default=1)
    date = models.DateField(default=date.today)  # Düzeltildi
    kategori = models.ForeignKey('CategoryText', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.kategori} - Yazının eklendiği tarih {self.date}" 


class CategoryText(models.Model):
    name = models.CharField(default="",max_length=255)    
    status = models.IntegerField(default=1)
    date = models.DateField(default=date.today)  # Düzeltildi

    def __str__(self):
        return f"{self.name}" 
    

class CategoryImage(models.Model):
    name = models.CharField(default="",max_length=255)    
    status = models.IntegerField(default=1)
    date = models.DateField(default=date.today)  # Düzeltildi

    def __str__(self):
        return f"{self.name}" 
    

class City(models.Model):
    name = models.CharField(default="",max_length=255)
    status = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.name}"


class District(models.Model):
    name = models.CharField(default="",max_length=255)
    status = models.IntegerField(default=1)
    city = models.ForeignKey('City', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.name}"


class Address(models.Model):  
    name = models.CharField(default="",max_length=255)
    status = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.name}"


class Phone(models.Model):
    name = models.CharField(default="",max_length=255)
    status = models.IntegerField(default=1)

    def __str__(self):
        return f"{self.name}"
    

class Event(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    date = models.DateTimeField(default=timezone.now)
    background_color = models.CharField(max_length=20, default="#007bff")
    border_color = models.CharField(max_length=20, default="#0056b3")
    created_at = models.DateTimeField(default=timezone.now)  # datetime.timezone.now yerine timezone.now
    active = models.BooleanField(default=False)

    def __str__(self):
        return self.title
    
class CategoryClass(models.Model):
    name = models.CharField(default="",max_length=255)    
    status = models.IntegerField(default=1)
    date = models.DateField(default=date.today)  # Düzeltildi

    def __str__(self):
        return self.name

    

class DersProgrami(models.Model):
    gun = models.CharField(max_length=10, choices=GUNLER, default='Pazartesi')
    Baslangic_saat = models.CharField(max_length=20,default="09:00")
    Bitis_saat = models.CharField(max_length=20,default="09:40")
    ders_kategori = models.ForeignKey('CategoryClass', on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.gun} : {self.Baslangic_saat} - {self.Bitis_saat} - {self.ders_kategori}"


# models.py — minik düzeltme
class StudentResult(models.Model):
    deneme_sinavi = models.ForeignKey("DenemeSinavi", on_delete=models.CASCADE, related_name='sonuclar', null=True, blank=True)
    okul_kodu = models.CharField(max_length=10, default="")
    ogrenci_no = models.CharField(max_length=10, default="")
    ad = models.CharField(max_length=50, default="")
    soyad = models.CharField(max_length=50, default="")
    sinif = models.CharField(max_length=5, default="")
    cinsiyet = models.CharField(max_length=1, default="")          # E / K
    oturum = models.CharField(max_length=2, default="")            # "1" veya "2"
    kitapcik_turu = models.CharField(max_length=1, default="")     # A/B/C...
    turkce = models.CharField(max_length=20, default="")
    inkilap = models.CharField(max_length=10, default="")
    din = models.CharField(max_length=10, default="")
    ingilizce = models.CharField(max_length=10, default="")
    matematik = models.CharField(max_length=20, default="")
    fen = models.CharField(max_length=20, default="")
    full_raw_line = models.TextField(default="")
    net = models.FloatField(default=0)
    created_at = models.DateTimeField(null=True,blank=True)
    deneme_tarihi = models.DateTimeField(null=True,blank=True)

    def __str__(self):
        return f"{self.ogrenci_no} - {self.ad} {self.soyad}"


class StudentAnswer(models.Model):
    CINSIYET_CHOICES = (
        ("Kız", "Kız"),
        ("Erkek", "Erkek"),
    )

    okul_no = models.CharField(max_length=20)
    ogrenci_no = models.CharField(max_length=20)
    ad = models.CharField(max_length=100)
    soyad = models.CharField(max_length=100)
    tc = models.CharField(max_length=20, blank=True, default="")
    sinif = models.CharField(max_length=10)
    cinsiyet = models.CharField(max_length=10, choices=CINSIYET_CHOICES)
    oturum = models.PositiveSmallIntegerField()
    kitapcik = models.CharField(max_length=2)
    cevaplar = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['okul_no']),
            models.Index(fields=['ogrenci_no']),
            models.Index(fields=['sinif']),
            models.Index(fields=['cinsiyet']),
        ]

    def _str_(self):
        return f"{self.okul_no}-{self.ogrenci_no} {self.ad} {self.soyad}"
    

class DenemeSinavi(models.Model):
    adi = models.CharField(max_length=100, help_text="Deneme sınavının adı")
    aciklama = models.TextField(blank=True, null=True, help_text="İsteğe bağlı açıklama")
    tarih = models.DateTimeField(help_text="Deneme sınavı tarihi", auto_now_add=True)
    oturum_sayisi = models.PositiveSmallIntegerField(default=2, help_text="Deneme sınavının oturum sayısı")
    kitapcik_turleri = models.CharField(max_length=50, blank=True, default="A/B", help_text="Kitapçık türleri (örn: A/B/C)")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.adi} - {self.tarih.strftime('%d.%m.%Y')}"


class AnswerKey(models.Model):
    """Deneme bazında cevap anahtarlarını saklar"""
    deneme_sinavi = models.ForeignKey(DenemeSinavi, on_delete=models.CASCADE, related_name='cevap_anahtarlari', null=True, blank=True)
    kitapcik_turu = models.CharField(max_length=1, choices=[('A', 'A'), ('B', 'B')], default='A')
    
    # 1. Oturum (50 karakter)
    turkce = models.CharField(max_length=20, help_text="Türkçe cevapları (20 karakter)", default="")
    inkilap = models.CharField(max_length=10, help_text="İnkılap/Tarih cevapları (10 karakter)", default="")
    din = models.CharField(max_length=10, help_text="Din cevapları (10 karakter)", default="")
    ingilizce = models.CharField(max_length=10, help_text="İngilizce cevapları (10 karakter)", default="")
    
    # 2. Oturum (40 karakter)
    matematik = models.CharField(max_length=20, help_text="Matematik cevapları (20 karakter)", default="")
    fen = models.CharField(max_length=20, help_text="Fen cevapları (20 karakter)", default="")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['deneme_sinavi', 'kitapcik_turu']  # Her deneme için her kitapçık türü için sadece bir cevap anahtarı
        
    def __str__(self):
        return f"{self.deneme_sinavi.adi} - Cevap Anahtarı {self.kitapcik_turu}"
        
    def get_full_answer_key(self):
        """90 karakterlik tam cevap anahtarını döndürür"""
        return self.turkce + self.inkilap + self.din + self.ingilizce + self.matematik + self.fen