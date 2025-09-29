# accounts/admin.py
from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.forms import ReadOnlyPasswordHashField
from django.utils.translation import gettext_lazy as _

from .models import (
    CustomUser,
    Classroom,
    StudentProfile,
    TeacherProfile,
    ParentProfile,
    AdminProfile,
)

# ---------------------------
# Forms (Create / Change)
# ---------------------------
class CustomUserCreationForm(forms.ModelForm):
    password1 = forms.CharField(label=_("Password"), widget=forms.PasswordInput)
    password2 = forms.CharField(label=_("Password confirmation"), widget=forms.PasswordInput)

    class Meta:
        model = CustomUser
        fields = ("email", "full_name", "phone", "profile_type")

    def clean_password2(self):
        p1 = self.cleaned_data.get("password1")
        p2 = self.cleaned_data.get("password2")
        if p1 and p2 and p1 != p2:
            raise forms.ValidationError(_("Passwords don't match"))
        return p2

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password1"])
        if commit:
            user.save()
        return user


class CustomUserChangeForm(forms.ModelForm):
    # Şifreyi salt okunur göster (hash)
    password = ReadOnlyPasswordHashField(label=_("Password"),
                                         help_text=_("Raw passwords are not stored, so there is no way to see this user's password."))

    class Meta:
        model = CustomUser
        fields = ("email", "full_name", "phone", "profile_type", "password",
                  "is_active", "is_staff", "is_superuser", "groups", "user_permissions")


# ---------------------------
# Inlines (profil tiplerine göre)
# ---------------------------
class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    can_delete = False
    extra = 0
    fk_name = "user"
    autocomplete_fields = ["classroom", "advisor_teacher"]


class TeacherProfileInline(admin.StackedInline):
    model = TeacherProfile
    can_delete = False
    extra = 0
    fk_name = "user"
    autocomplete_fields = ["classrooms"]


class ParentProfileInline(admin.StackedInline):
    model = ParentProfile
    can_delete = False
    extra = 0
    fk_name = "user"
    autocomplete_fields = ["children"]


class AdminProfileInline(admin.StackedInline):
    model = AdminProfile
    can_delete = False
    extra = 0
    fk_name = "user"


# ---------------------------
# Custom User Admin
# ---------------------------
@admin.register(CustomUser)
class CustomUserAdmin(BaseUserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = CustomUser

    list_display = ("email", "full_name", "profile_type", "is_active", "is_staff")
    list_filter = ("profile_type", "is_active", "is_staff", "is_superuser")
    search_fields = ("email", "full_name", "phone")
    ordering = ("email",)
    readonly_fields = ()

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        (_("Personal info"), {"fields": ("full_name", "phone")}),
        (_("Profile"), {"fields": ("profile_type",)}),
        (_("Permissions"), {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        (_("Important dates"), {"fields": ("last_login",)}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "full_name", "phone", "profile_type", "password1", "password2"),
        }),
    )

    # Sadece ilgili profile inline'ını göster
    def get_inlines(self, request, obj=None):
        if obj is None:
            # Yeni kullanıcı oluştururken inline göstermiyoruz (önce kaydedilsin)
            return []
        pt = obj.profile_type
        if pt == CustomUser.ProfileType.STUDENT:
            return [StudentProfileInline]
        if pt == CustomUser.ProfileType.TEACHER:
            return [TeacherProfileInline]
        if pt == CustomUser.ProfileType.PARENT:
            return [ParentProfileInline]
        if pt == CustomUser.ProfileType.ADMIN:
            return [AdminProfileInline]
        return []

    # Query optimizasyonu
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related()  # OneToOne'lar inline'da çekilecek; burada temel.

# ---------------------------
# Classroom & Profile Admins
# ---------------------------
@admin.register(Classroom)
class ClassroomAdmin(admin.ModelAdmin):
    list_display = ("name", "grade_level")
    search_fields = ("name",)
    list_filter = ("grade_level",)
    ordering = ("grade_level", "name")


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ("user_email", "user_full_name", "school_number", "classroom")
    search_fields = ("user__email", "user__full_name", "school_number", "classroom__name")
    list_filter = ("classroom",)
    autocomplete_fields = ["user", "classroom", "advisor_teacher"]

    def user_email(self, obj): return obj.user.email
    def user_full_name(self, obj): return obj.user.full_name
    user_email.short_description = "Email"
    user_full_name.short_description = "Ad Soyad"


@admin.register(TeacherProfile)
class TeacherProfileAdmin(admin.ModelAdmin):
    list_display = ("user_email", "user_full_name", "branch")
    search_fields = ("user__email", "user__full_name", "branch", "classrooms__name")
    autocomplete_fields = ["user", "classrooms"]

    def user_email(self, obj): return obj.user.email
    def user_full_name(self, obj): return obj.user.full_name
    user_email.short_description = "Email"
    user_full_name.short_description = "Ad Soyad"


@admin.register(ParentProfile)
class ParentProfileAdmin(admin.ModelAdmin):
    list_display = ("user_email", "user_full_name", "children_count")
    search_fields = ("user__email", "user__full_name", "children__user__full_name", "children__school_number")
    autocomplete_fields = ["user", "children"]

    def user_email(self, obj): return obj.user.email
    def user_full_name(self, obj): return obj.user.full_name
    def children_count(self, obj): return obj.children.count()
    user_email.short_description = "Email"
    user_full_name.short_description = "Ad Soyad"
    children_count.short_description = "Öğrenci Sayısı"


@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display = ("user_email", "user_full_name", "title", "department")
    search_fields = ("user__email", "user__full_name", "title", "department")
    autocomplete_fields = ["user"]

    def user_email(self, obj): return obj.user.email
    def user_full_name(self, obj): return obj.user.full_name
    user_email.short_description = "Email"
    user_full_name.short_description = "Ad Soyad"
