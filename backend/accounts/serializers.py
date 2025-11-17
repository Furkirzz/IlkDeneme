from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken


# def rolesUser(user):    
#     return list(user.roles.values_list("name", flat=True))

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
        #token["roles"] = rolesUser(user)       
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
        #access["roles"] = rolesUser(user)
        print(user)
        data["access"] = str(access)  # access'i override et
        data["user"] = {
            "id": user.id,
            "email": user.email,
            "full_name": getattr(user, "full_name", ""),
            "is_staff": user.is_staff,
            #"roles": rolesUser(user),
        }
        return data


# accounts/serializers.py
from rest_framework import serializers
from .models import (
    CustomUser, Classroom,
    StudentProfile, TeacherProfile, ParentProfile, AdminProfile
)


# ---------------------------
# Classroom
# ---------------------------
class ClassroomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Classroom
        fields = ["id", "name", "grade_level"]


# ---------------------------
# User (temel)
# ---------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = [
            "id", "email", "full_name", "phone",
            "is_active", "is_staff", "profile_type"
        ]
        read_only_fields = ["is_active", "is_staff"]


# ---------------------------
# Öğrenci Profili
# ---------------------------
class StudentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), source="user", write_only=True, required=False
    )

    classroom = serializers.PrimaryKeyRelatedField(
        queryset=Classroom.objects.all(), allow_null=True, required=False
    )
    classroom_detail = ClassroomSerializer(source="classroom", read_only=True)

    advisor_teacher = serializers.PrimaryKeyRelatedField(
        queryset=TeacherProfile.objects.all(), allow_null=True, required=False
    )

    class Meta:
        model = StudentProfile
        fields = [
            "id", "user", "user_id",
            "school_number", "classroom", "classroom_detail",
            "advisor_teacher", "created_at", "updated_at"
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, attrs):
        user = attrs.get("user") or getattr(self.instance, "user", None)
        if user and user.profile_type != CustomUser.ProfileType.STUDENT:
            raise serializers.ValidationError("Bu profil yalnızca 'student' tipindeki kullanıcıya bağlanabilir.")
        return attrs


# ---------------------------
# Öğretmen Profili
# ---------------------------
class TeacherProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), source="user", write_only=True, required=False
    )

    classrooms = serializers.PrimaryKeyRelatedField(
        queryset=Classroom.objects.all(), many=True, required=False
    )
    classrooms_detail = ClassroomSerializer(source="classrooms", many=True, read_only=True)

    class Meta:
        model = TeacherProfile
        fields = [
            "id", "user", "user_id",
            "branch", "classrooms", "classrooms_detail",
            "office_phone", "created_at", "updated_at"
        ]
    def validate(self, attrs):
        user = attrs.get("user") or getattr(self.instance, "user", None)
        if user and user.profile_type != CustomUser.ProfileType.TEACHER:
            raise serializers.ValidationError("Bu profil yalnızca 'teacher' tipindeki kullanıcıya bağlanabilir.")
        return attrs


# ---------------------------
# Veli Profili
# ---------------------------
class ParentProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), source="user", write_only=True, required=False
    )

    children = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.objects.all(), many=True, required=False
    )

    class Meta:
        model = ParentProfile
        fields = [
            "id", "user", "user_id",
            "children", "relation_note",
            "created_at", "updated_at"
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, attrs):
        user = attrs.get("user") or getattr(self.instance, "user", None)
        if user and user.profile_type != CustomUser.ProfileType.PARENT:
            raise serializers.ValidationError("Bu profil yalnızca 'parent' tipindeki kullanıcıya bağlanabilir.")
        return attrs


# ---------------------------
# Yönetici Profili
# ---------------------------
class AdminProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=CustomUser.objects.all(), source="user", write_only=True, required=False
    )

    class Meta:
        model = AdminProfile
        fields = [
            "id", "user", "user_id",
            "title", "department",
            "created_at", "updated_at"
        ]
        read_only_fields = ["created_at", "updated_at"]

    def validate(self, attrs):
        user = attrs.get("user") or getattr(self.instance, "user", None)
        if user and user.profile_type != CustomUser.ProfileType.ADMIN:
            raise serializers.ValidationError("Bu profil yalnızca 'admin' tipindeki kullanıcıya bağlanabilir.")
        return attrs


# ---------------------------
# Kullanıcı + aktif profil tek payload
# ---------------------------
class UserWithProfileSerializer(serializers.ModelSerializer):
    active_profile = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = ["id", "email", "full_name", "phone", "profile_type", "active_profile"]

    def get_active_profile(self, obj: CustomUser):
        if obj.profile_type == CustomUser.ProfileType.STUDENT and hasattr(obj, "student_profile"):
            return StudentProfileSerializer(obj.student_profile).data
        if obj.profile_type == CustomUser.ProfileType.TEACHER and hasattr(obj, "teacher_profile"):
            return TeacherProfileSerializer(obj.teacher_profile).data
        if obj.profile_type == CustomUser.ProfileType.PARENT and hasattr(obj, "parent_profile"):
            return ParentProfileSerializer(obj.parent_profile).data
        if obj.profile_type == CustomUser.ProfileType.ADMIN and hasattr(obj, "admin_profile"):
            return AdminProfileSerializer(obj.admin_profile).data
        return None
    

# Ana kullanıcı profilini oluşturan serializer
class UserProfileSerializer(serializers.ModelSerializer):
    
    # CustomUser modelindeki profile property'sini kullanarak doğru profili dinamik olarak serialize eder
    profile = serializers.SerializerMethodField()
    
    # DersProgramım.jsx'in beklediği "is_teacher" alanını ekleriz
    is_teacher = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = (
            'id', 
            'email', 
            'full_name', 
            'profile_type', 
            'is_teacher', 
            'profile'    
        )
        read_only_fields = fields

    def get_is_teacher(self, obj: CustomUser):
        """Kullanıcının öğretmen olup olmadığını döndürür."""
        return obj.profile_type == CustomUser.ProfileType.TEACHER

    def get_profile(self, obj: CustomUser):
        """Kullanıcı tipine göre ilgili profil detaylarını döndürür."""
        if obj.profile_type == CustomUser.ProfileType.STUDENT:
            student_profile = getattr(obj, 'student_profile', None)
            if student_profile:
                return StudentProfileSerializer(student_profile).data

        elif obj.profile_type == CustomUser.ProfileType.TEACHER:
            teacher_profile = getattr(obj, 'teacher_profile', None)
            if teacher_profile:
                # Öğretmenin kendi ID'si 'profile.id' olarak geri dönecek.
                return TeacherProfileSerializer(teacher_profile).data
        
        return None
