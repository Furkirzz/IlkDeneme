from django.contrib import admin
from .models import Ders, DersPlani, Konu, OgrenciDurumKaydi, DersSonucu


class KonuInline(admin.TabularInline):
    """Ders ekranında konuları inline olarak göster."""
    model = Konu
    extra = 1


@admin.register(Ders)
class DersAdmin(admin.ModelAdmin):
    list_display = ("ad",)
    search_fields = ("ad",)
    inlines = [KonuInline]


@admin.register(Konu)
class KonuAdmin(admin.ModelAdmin):
    list_display = ("ad", "ders")
    list_filter = ("ders",)
    search_fields = ("ad",)


class DersSonucuInline(admin.TabularInline):
    """Öğrenci durum kaydı ekranında ders sonuçlarını inline göster."""
    model = DersSonucu
    extra = 3  # varsayılan 3 boş satır
    autocomplete_fields = ("ders", "konu")  # admin'de kolay seçim


@admin.register(OgrenciDurumKaydi)
class OgrenciDurumKaydiAdmin(admin.ModelAdmin):
    list_display = (
        "ogrenci", "tarih", "hedef_soru", "veli_onayi", "pd_onayi",
        "get_toplam_dogru", "get_toplam_yanlis", "get_toplam_bos"
    )
    list_filter = ("tarih", "veli_onayi", "pd_onayi")
    search_fields = ("ogrenci__username", "ogrenci__first_name", "ogrenci__last_name")
    date_hierarchy = "tarih"
    inlines = [DersSonucuInline]

    def get_toplam_dogru(self, obj):
        return sum(obj.ders_sonuclari.values_list("dogru", flat=True))
    get_toplam_dogru.short_description = "Toplam Doğru"

    def get_toplam_yanlis(self, obj):
        return sum(obj.ders_sonuclari.values_list("yanlis", flat=True))
    get_toplam_yanlis.short_description = "Toplam Yanlış"

    def get_toplam_bos(self, obj):
        return sum(obj.ders_sonuclari.values_list("bos", flat=True))
    get_toplam_bos.short_description = "Toplam Boş"


@admin.register(DersSonucu)
class DersSonucuAdmin(admin.ModelAdmin):
    list_display = ("kayit", "ders", "konu", "dogru", "yanlis", "bos")
    list_filter = ("ders", "konu")
    search_fields = ("ders__ad", "konu__ad")

@admin.register(DersPlani)
class DersPlaniAdmin(admin.ModelAdmin):
    list_display = ("ders", "konu", "hedef_soru", "tarih", "get_ogrenci_sayisi", "sinif", "olusturan")
    list_filter = ("ders", "tarih", "sinif")
    search_fields = ("ogrenciler__username", "ogrenciler__first_name", "ogrenciler__last_name", "sinif")
    filter_horizontal = ("ogrenciler",)  # admin’de çoklu seçim için

    def get_ogrenci_sayisi(self, obj):
        return obj.ogrenciler.count()
    get_ogrenci_sayisi.short_description = "Öğrenci Sayısı"