from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Ders(models.Model):
    ad = models.CharField(max_length=100, unique=True, verbose_name="Ders Adı")

    class Meta:
        verbose_name = "Ders"
        verbose_name_plural = "Dersler"
        ordering = ["ad"]

    def __str__(self):
        return self.ad


class Konu(models.Model):
    ders = models.ForeignKey(
        Ders,
        on_delete=models.CASCADE,
        related_name="konular",
        verbose_name="Ders"
    )
    ad = models.CharField(max_length=200, verbose_name="Konu Adı")

    class Meta:
        verbose_name = "Konu"
        verbose_name_plural = "Konular"
        unique_together = ("ders", "ad")
        ordering = ["ders__ad", "ad"]

    def __str__(self):
        return f"{self.ders.ad} - {self.ad}"


class OgrenciDurumKaydi(models.Model):
    ogrenci = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="durum_kayitlari",
        verbose_name="Öğrenci"
    )
    tarih = models.DateField(verbose_name="Tarih")
    hedef_soru = models.PositiveIntegerField(default=0, verbose_name="Hedef Soru")
    kitap_okuma = models.CharField(max_length=255, blank=True, null=True, verbose_name="Kitap Okuma")
    veli_onayi = models.BooleanField(default=False, verbose_name="Veli Onayı")
    pd_onayi = models.BooleanField(default=False, verbose_name="Psk. Dan. Onayı")
    haftanin_sozu = models.TextField(blank=True, null=True, verbose_name="Haftanın Sözü")
    calisilacak_konular = models.TextField(blank=True, null=True, verbose_name="Çalışılacak Konular")
    oz_degerlendirme = models.IntegerField(
        default=0,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        verbose_name="Kendini Değerlendirme (0-10)"
    )
    olusturulma = models.DateTimeField(auto_now_add=True)
    guncellenme = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Öğrenci Durum Kaydı"
        verbose_name_plural = "Öğrenci Durum Kayıtları"
        unique_together = ("ogrenci", "tarih")
        ordering = ("-tarih", "-olusturulma")

    def __str__(self):
        return f"{self.ogrenci} - {self.tarih}"


class DersSonucu(models.Model):
    kayit = models.ForeignKey(
        OgrenciDurumKaydi,
        on_delete=models.CASCADE,
        related_name="ders_sonuclari",
        verbose_name="Durum Kaydı"
    )
    ders = models.ForeignKey(
        Ders,
        on_delete=models.CASCADE,
        verbose_name="Ders"
    )
    konu = models.ForeignKey(
        Konu,
        on_delete=models.CASCADE,
        verbose_name="Konu"
    )
    dogru = models.PositiveIntegerField(default=0, verbose_name="Doğru")
    yanlis = models.PositiveIntegerField(default=0, verbose_name="Yanlış")
    bos = models.PositiveIntegerField(default=0, verbose_name="Boş")

    class Meta:
        verbose_name = "Ders Sonucu"
        verbose_name_plural = "Ders Sonuçları"
        unique_together = ("kayit", "ders", "konu")
        ordering = ["ders__ad", "konu__ad"]

    def __str__(self):
        return f"{self.ders.ad} / {self.konu.ad} — D:{self.dogru} Y:{self.yanlis} B:{self.bos}"

from django.conf import settings
from django.db import models


class DersPlani(models.Model):
    """Rehberlik hocasının atadığı ders–konu–hedef planı"""
    olusturan = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="olusturdugu_planlar",
        verbose_name="Oluşturan (Rehberlik Hocası)"
    )
    ogrenciler = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="ders_planlari",
        blank=True,
        verbose_name="Öğrenciler"
    )
    sinif = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="Sınıf"
    )  
    # İstersen burayı ayrı "Classroom" modeli ile FK yapabilirsin.

    ders = models.ForeignKey("Ders", on_delete=models.CASCADE, verbose_name="Ders")
    konu = models.ForeignKey("Konu", on_delete=models.CASCADE, verbose_name="Konu")

    hedef_soru = models.PositiveIntegerField(default=0, verbose_name="Hedef Soru Sayısı")
    tarih = models.DateField(verbose_name="Tarih")
    aciklama = models.TextField(blank=True, null=True, verbose_name="Açıklama")

    olusturulma = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Ders Planı"
        verbose_name_plural = "Ders Planları"
        ordering = ("-tarih",)

    def __str__(self):
        hedef = f" ({self.hedef_soru} Soru)" if self.hedef_soru else ""
        ogrenci_sayisi = self.ogrenciler.count()
        hedeflenen = f"{ogrenci_sayisi} öğrenci" if ogrenci_sayisi else f"Sınıf {self.sinif}"
        return f"{self.ders.ad} - {self.konu.ad}{hedef} [{hedeflenen}]"

