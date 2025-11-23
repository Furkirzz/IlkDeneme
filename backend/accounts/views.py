from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .serializers import EmailTokenObtainPairSerializer, StudentProfileSerializer, UserProfileSerializer
from .models import Classroom, TeacherProfile
from .serializers import ClassroomSerializer, TeacherProfileSerializer
from rest_framework.views import APIView
from rest_framework.decorators import api_view, permission_classes
from drf_spectacular.utils import extend_schema
from rest_framework import status

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
    
class ClassroomListCreateAPIView(APIView):

    def get(self, request):
        qs = Classroom.objects.all().order_by("grade_level", "name")
        ser = ClassroomSerializer(qs, many=True)
        return Response(ser.data)

    def post(self, request):
        ser = ClassroomSerializer(data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data, status=status.HTTP_201_CREATED)
        return Response(ser.errors, status=status.HTTP_400_BAD_REQUEST)

class ClassroomDetailAPIView(APIView):

    def get_obj(self, pk):
        try:
            return Classroom.objects.get(pk=pk)
        except Classroom.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not Found"}, status=404)
        return Response(ClassroomSerializer(obj).data)

    def put(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not Found"}, status=404)

        ser = ClassroomSerializer(obj, data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    def patch(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not Found"}, status=404)

        ser = ClassroomSerializer(obj, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    def delete(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not Found"}, status=404)

        obj.delete()
        return Response(status=204)
    
class TeacherListAPIView(APIView):

    def get(self, request):
        qs = TeacherProfile.objects.select_related("user").prefetch_related("classrooms").all()
        ser = TeacherProfileSerializer(qs, many=True)
        return Response(ser.data)


class TeacherDetailAPIView(APIView):

    def get_obj(self, pk):
        try:
            return TeacherProfile.objects.get(pk=pk)
        except TeacherProfile.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not Found"}, status=404)
        return Response(TeacherProfileSerializer(obj).data)

    def put(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not Found"}, status=404)

        ser = TeacherProfileSerializer(obj, data=request.data)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    def patch(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not Found"}, status=404)

        ser = TeacherProfileSerializer(obj, data=request.data, partial=True)
        if ser.is_valid():
            ser.save()
            return Response(ser.data)
        return Response(ser.errors, status=400)

    def delete(self, request, pk):
        obj = self.get_obj(pk)
        if not obj:
            return Response({"detail": "Not Found"}, status=404)

        obj.delete()
        return Response(status=204)

