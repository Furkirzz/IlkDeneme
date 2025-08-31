
from rest_framework import serializers
from .models import CategoryClass, CategoryImage, CategoryText, DersProgrami, District, Image, MainPageText,City, Phone,Address,Event, StudentAnswer, StudentResult

class CategoryImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryImage
        fields = ['id', 'name']

class CategoryTextSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryText
        fields = ['id', 'name']

class ImageSerializer(serializers.ModelSerializer):
    kategori = CategoryImageSerializer(read_only=True)  # Burada doğrudan sınıfı kullanıyoruz

    class Meta:
        model = Image
        fields = '__all__'

class MainPageTextSerializer(serializers.ModelSerializer):
    kategori = CategoryTextSerializer(read_only=True)

    class Meta:
        model = MainPageText
        fields = '__all__'

class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'name']

class DistrictSerializer(serializers.ModelSerializer):
    city = CitySerializer(read_only=True)

    class Meta:
        model = District
        fields = ['id', 'name', 'city']

class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = ['id', 'name']

class PhoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Phone
        fields = ['id', 'name']

class EventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = '__all__'

class CategoryClassSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoryClass
        fields = ['id', 'name']

class DersProgramiSerializer(serializers.ModelSerializer):
    ders_kategori = CategoryClassSerializer(read_only=True)  # Nested serializer

    class Meta:
        model = DersProgrami
        fields = '__all__'

class StudentResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentResult
        fields = '__all__'

class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAnswer
        fields = '__all__'


