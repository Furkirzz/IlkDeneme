# accounts/models.py
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils.translation import gettext_lazy as _


# ---------------------------
# User & Manager
# ---------------------------
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save()
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("profile_type", CustomUser.ProfileType.ADMIN)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractBaseUser, PermissionsMixin):
    class ProfileType(models.TextChoices):
        STUDENT = "student", _("Öğrenci")
        TEACHER = "teacher", _("Öğretmen")
        ADMIN   = "admin",   _("Yönetici")
        PARENT  = "parent",  _("Veli")

    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, null=True)

    is_active = models.BooleanField(default=True)
    is_staff  = models.BooleanField(default=False)

    profile_type = models.CharField(
        max_length=20,
        choices=ProfileType.choices,
        default=ProfileType.STUDENT,
        help_text=_("Bu kullanıcı için temel profil tipi."),
        db_index=True,
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["full_name"]

    objects = CustomUserManager()

    def __str__(self):
        return self.email

    # Kolay profil erişimi (temiz ve tutarlı)
    @property
    def profile(self):
        mapping = {
            self.ProfileType.STUDENT: getattr(self, "student_profile", None),
            self.ProfileType.TEACHER: getattr(self, "teacher_profile", None),
            self.ProfileType.ADMIN:   getattr(self, "admin_profile", None),
            self.ProfileType.PARENT:  getattr(self, "parent_profile", None),
        }
        return mapping.get(self.profile_type)


# ---------------------------
# Ortak/yardımcı modeller
# ---------------------------
class Classroom(models.Model):
    """Sınıf/şube bilgisi (örn: 10-A)."""
    name = models.CharField(max_length=50, unique=True)  # "10-A", "7-B" gibi
    grade_level = models.PositiveSmallIntegerField(blank=True, null=True)  # 1..12 vb.

    def __str__(self):
        return self.name


# ---------------------------
# Base Profile (soyut) - SADECE zaman damgaları
# ---------------------------
class BaseProfile(models.Model):
    """Tüm profiller için ortak alanlar (zaman vb.)."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


# ---------------------------
# Öğrenci Profili
# ---------------------------
class StudentProfile(BaseProfile):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="student_profile"
    )
    school_number = models.CharField(max_length=50, blank=True, null=True, verbose_name=_("Okul Numarası"))
    classroom = models.ForeignKey(
        Classroom, on_delete=models.SET_NULL, blank=True, null=True,
        related_name="students", verbose_name=_("Sınıfı")
    )
    advisor_teacher = models.ForeignKey(
        "TeacherProfile", on_delete=models.SET_NULL, blank=True, null=True,
        related_name="advised_students", verbose_name=_("Sınıf Danışmanı")
    )

    def __str__(self):
        return f"Öğrenci: {self.user.full_name}"


# ---------------------------
# Öğretmen Profili
# ---------------------------
class TeacherProfile(BaseProfile):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="teacher_profile"
    )
    branch = models.CharField(max_length=100, verbose_name=_("Branş"))  # Örn. Matematik, Fizik...
    classrooms = models.ManyToManyField(
        Classroom, blank=True, related_name="teachers", verbose_name=_("Derse Girdiği Sınıflar")
    )
    office_phone = models.CharField(max_length=20, blank=True, null=True, verbose_name=_("Okul Dahili / Ofis Telefonu"))

    def __str__(self):
        return f"Öğretmen: {self.user.full_name} ({self.branch})"


# ---------------------------
# Veli Profili
# ---------------------------
class ParentProfile(BaseProfile):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="parent_profile"
    )
    children = models.ManyToManyField(
        StudentProfile, related_name="parents", blank=True, verbose_name=_("Çocukları / Öğrencileri")
    )
    relation_note = models.CharField(
        max_length=50, blank=True, null=True, verbose_name=_("Yakınlık Notu")
    )  # anne, baba, teyze vb. serbest metin

    def __str__(self):
        return f"Veli: {self.user.full_name}"


# ---------------------------
# Yönetici Profili
# ---------------------------
class AdminProfile(BaseProfile):
    user = models.OneToOneField(
        CustomUser, on_delete=models.CASCADE, related_name="admin_profile"
    )
    title = models.CharField(max_length=100, blank=True, null=True, verbose_name=_("Ünvan"))       # Müdür, Md. Yrd. vb.
    department = models.CharField(max_length=100, blank=True, null=True, verbose_name=_("Birim"))  # Öğrenci İşleri vb.

    def __str__(self):
        return f"Yönetici: {self.user.full_name}"
