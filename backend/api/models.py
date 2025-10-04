from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import Q, Sum
from django.conf import settings

class CustomUser(AbstractUser):
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    email = models.EmailField(blank=True, null=True)

    phone_number = models.CharField(max_length=20, blank=True, null=True)
    location = models.CharField(max_length=255, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)

    class Meta:
        indexes = [models.Index(fields=["username"], name="username_index")]
        constraints = [
            # Enforce uniqueness only when email != '' (and not NULL)
            models.UniqueConstraint(
                fields=['email'],
                condition=~Q(email__exact=''),
                name='unique_nonblank_email'
            ),
        ]

    def __str__(self):
        return self.username

class Conversation(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self): return f"Conversation {self.id}"

class ConversationMember(models.Model):
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    class Meta:
        unique_together = [("conversation", "user")]

class Attachment(models.Model):
    file = models.FileField(upload_to="attachments/")
    created_at = models.DateTimeField(auto_now_add=True)

class Message(models.Model):
    KIND_CHOICES = [("text","text"), ("image","image"), ("ai_draft","ai_draft")]
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    kind = models.CharField(max_length=16, choices=KIND_CHOICES, default="text")
    text = models.TextField(blank=True)
    attachment = models.ForeignKey(Attachment, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=["conversation", "created_at"])]
