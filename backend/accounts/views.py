from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import EmailTokenObtainPairSerializer

class EmailTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainPairSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """
    Giriş yapmış kullanıcının profil bilgilerini döndürür
    """
    user = request.user
    roles = list(user.roles.values_list('name', flat=True))
    
    return Response({
        'id': user.id,
        'email': user.email,
        'full_name': user.full_name,
        'phone': user.phone,
        'is_staff': user.is_staff,
        'is_superuser': user.is_superuser,
        'roles': roles,
        'is_authenticated': True
    })