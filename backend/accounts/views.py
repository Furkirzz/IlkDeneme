from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import EmailTokenObtainPairSerializer, StudentProfileSerializer, UserProfileSerializer
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from drf_spectacular.utils import extend_schema


class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

class LoginView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        u = request.user
        return Response({
            "id": u.id,
            "email": u.email,
            "full_name": u.full_name,
            "is_staff": u.is_staff,
            "is_superuser": u.is_superuser,
        })


# ============================================================
# CURRENT USER PROFILE VIEW
# ============================================================

# Frontend'in çağırdığı URL'e (örn: /api/student/profile/) cevap verecek
class CurrentUserProfileAPIView(APIView):
    # Sadece giriş yapmış (token/session sahibi) kullanıcıların erişimine izin verir
    permission_classes = [IsAuthenticated] 

    @extend_schema(
        description="Giriş yapmış (Authenticated) kullanıcının temel rolünü, sınıfını veya öğretmen kimliğini içeren profilini döndürür.",
        responses=UserProfileSerializer,
    )
    def get(self, request, *args, **kwargs):
        # request.user, mevcut giriş yapmış kullanıcı (CustomUser instance)
        user = request.user 

        # Serializer ile veriyi JSON'a çevir
        # Hyperlinked alanlar için context'i göndermek önemlidir
        serializer = UserProfileSerializer(user, context={'request': request})
        
        # JSON yanıtını döndür
        return Response(serializer.data)
    
