from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken


def rolesUser(user):    
    return list(user.roles.values_list("name", flat=True))

class EmailTokenObtainPairSerializer(TokenObtainPairSerializer):
    # username yerine email ile doğrulama
    username_field = 'email'

    @classmethod
    def get_token(cls, user):
        """
        Burada JWT içine eklemek istediğin claim'leri yaz.
        Bu method refresh token'ı döndürür.
        access token da refresh'ten üretildiği için
        bu claim'ler access'e de yansır.
        """
        token = super().get_token(user)
        # --- Custom claims ---
        token["email"] = user.email
        token["full_name"] = getattr(user, "full_name", "")
        token["is_staff"] = user.is_staff
        token["roles"] = rolesUser(user)       
        return token

    def validate(self, attrs):
        # 1) Standart doğrulama
        email = attrs.get("email")
        password = attrs.get("password")
        if not (email and password):
            raise serializers.ValidationError("Email ve şifre gereklidir.")
        user = authenticate(
            request=self.context.get("request"),
            email=email,
            password=password,
        )
        
        if not user:
            raise serializers.ValidationError("E-posta veya şifre hatalı.")

        # 2) SimpleJWT token üretimi (data["refresh"] ve data["access"] gelir)
        data = super().validate(attrs)

        # 3) Refresh'i aç, access'i kendin kur ve claim ekle
        refresh = RefreshToken(data["refresh"])  # az önce üretilen refresh
        access = refresh.access_token
        access["email"] = user.email
        access["full_name"] = getattr(user, "full_name", "")
        access["is_staff"] = user.is_staff
        access["roles"] = rolesUser(user)
        print(user)
        data["access"] = str(access)  # access'i override et
        data["user"] = {
            "id": user.id,
            "email": user.email,
            "full_name": getattr(user, "full_name", ""),
            "is_staff": user.is_staff,
            "roles": rolesUser(user),
        }
        return data

