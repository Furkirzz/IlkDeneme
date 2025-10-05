# apps/kocluk/serializers.py
from rest_framework import serializers
from .models import Ders, OgrenciDurumKaydi, DersSonucu


class DersSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ders
        fields = ("id", "ad")


class DersSonucuSerializer(serializers.ModelSerializer):
    ders_adi = serializers.CharField(source="ders.ad", read_only=True)

    class Meta:
        model = DersSonucu
        fields = ("id", "ders", "ders_adi", "konu", "dogru", "yanlis", "bos")


class OgrenciDurumKaydiListeSerializer(serializers.ModelSerializer):
    """Liste/gösterimde hafif sürüm (toplamlar + sayısal özet)."""
    toplam_dogru = serializers.IntegerField(read_only=True)
    toplam_yanlis = serializers.IntegerField(read_only=True)
    toplam_bos = serializers.IntegerField(read_only=True)

    class Meta:
        model = OgrenciDurumKaydi
        fields = (
            "id", "ogrenci", "tarih", "hedef_soru",
            "veli_onayi", "pd_onayi",
            "toplam_dogru", "toplam_yanlis", "toplam_bos",
            "olusturulma", "guncellenme",
        )


class OgrenciDurumKaydiDetaySerializer(serializers.ModelSerializer):
    """Create/Update/Detail için iç içe ders sonuçları."""
    ders_sonuclari = DersSonucuSerializer(many=True)

    class Meta:
        model = OgrenciDurumKaydi
        fields = (
            "id", "ogrenci", "tarih", "hedef_soru", "kitap_okuma",
            "veli_onayi", "pd_onayi",
            "haftanin_sozu", "calisilacak_konular", "oz_degerlendirme",
            "ders_sonuclari", "olusturulma", "guncellenme",
        )
        read_only_fields = ("olusturulma", "guncellenme")

    def validate(self, attrs):
        # Aynı ders iki kez girilmesin
        dersler = [d.get("ders") for d in self.initial_data.get("ders_sonuclari", [])]
        if len(dersler) != len(set(dersler)):
            raise serializers.ValidationError("Aynı ders birden fazla kez girilemez.")
        return attrs

    def create(self, validated_data):
        dersler = validated_data.pop("ders_sonuclari", [])
        kayit = OgrenciDurumKaydi.objects.create(**validated_data)
        bulk = [DersSonucu(kayit=kayit, **d) for d in dersler]
        DersSonucu.objects.bulk_create(bulk)
        return kayit

    def update(self, instance, validated_data):
        dersler = validated_data.pop("ders_sonuclari", None)
        for k, v in validated_data.items():
            setattr(instance, k, v)
        instance.save()

        if dersler is not None:
            instance.ders_sonuclari.all().delete()
            bulk = [DersSonucu(kayit=instance, **d) for d in dersler]
            DersSonucu.objects.bulk_create(bulk)
        return instance
