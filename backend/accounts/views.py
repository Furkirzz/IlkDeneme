from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import EmailTokenObtainPairSerializer
from rest_framework.views import APIView

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
            "roles": list(u.roles.values_list("name", flat=True)),
            "is_staff": u.is_staff,
            "is_superuser": u.is_superuser,
        })