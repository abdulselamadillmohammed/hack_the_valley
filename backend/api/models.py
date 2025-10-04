from django.db import models
from django.contrib.auth.models import AbstractUser
from django.db.models import Q, Sum

# Create your models here.


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

