from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from .models import CustomUser, Profile, DayEntry, Attachment

@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Extra", {"fields": ("profile_picture", "phone_number", "location", "date_of_birth")}),
    )
    list_display = ("username", "email", "first_name", "last_name", "is_staff")
    search_fields = ("username", "email", "first_name", "last_name")

class ProfileInline(admin.TabularInline):
    model = Profile
    extra = 0
    fields = ("name", "is_default", "created_at")

@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "owner", "name", "is_default", "created_at", "avatar_preview")
    list_filter = ("is_default", "created_at")
    search_fields = ("name", "owner__username")
    readonly_fields = ("created_at",)
    def avatar_preview(self, obj):
        if obj.avatar:
            return format_html('<img src="{}" style="height:40px;border-radius:6px" />', obj.avatar.url)
        return "—"

@admin.register(DayEntry)
class DayEntryAdmin(admin.ModelAdmin):
    list_display = ("id", "profile", "date", "attachments_count", "created_at", "updated_at")
    list_filter = ("date", "created_at")
    search_fields = ("profile__owner__username", "profile__name")
    readonly_fields = ("created_at", "updated_at")
    def attachments_count(self, obj):
        return obj.attachments.count()

@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = ("id", "owner_profile", "day_entry", "created_at", "file_name")
    list_filter = ("created_at",)
    search_fields = ("owner_profile__name",)
    readonly_fields = ("created_at",)
    def file_name(self, obj):
        return obj.file.name
