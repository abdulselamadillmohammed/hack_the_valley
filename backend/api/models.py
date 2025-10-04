# api/models.py
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import Q
from django.conf import settings

class CustomUser(AbstractUser):
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    email = models.EmailField(blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)

    class Meta:
        indexes = [
            models.Index(fields=["username"], name="username_index"),
            models.Index(name="username_prefix_idx", fields=["username"], opclasses=["varchar_pattern_ops"]),
        ]
        constraints = [
            models.UniqueConstraint(fields=['email'], condition=~Q(email__exact=''), name='unique_nonblank_email'),
        ]

    def __str__(self): return self.username


# --- Netflix-like Profile under a single account ---
class Profile(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profiles")
    name = models.CharField(max_length=40)
    avatar = models.ImageField(upload_to="profile_avatars/", null=True, blank=True)
    pin = models.CharField(max_length=4, null=True, blank=True)  # optional
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["owner", "name"], name="uniq_profile_name_per_owner"),
        ]
        indexes = [
            models.Index(fields=["owner", "name"]),
        ]

    def __str__(self): return f"{self.owner.username}/{self.name}"


# A day-scoped bucket of photos + note + generated summary
class DayEntry(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name="day_entries")
    date = models.DateField()  # one per day per profile
    note = models.TextField(blank=True)
    summary_text = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["profile", "date"], name="uniq_dayentry_per_profile_date")
        ]
        indexes = [
            models.Index(fields=["profile", "date"]),
        ]

    def __str__(self): return f"{self.profile} {self.date}"


# Reuse Attachment; link it to profile/entry
class Attachment(models.Model):
    file = models.FileField(upload_to="attachments/")
    created_at = models.DateTimeField(auto_now_add=True)
    owner_profile = models.ForeignKey(Profile, null=True, blank=True, on_delete=models.SET_NULL, related_name="attachments")
    day_entry = models.ForeignKey(DayEntry, null=True, blank=True, on_delete=models.CASCADE, related_name="attachments")
