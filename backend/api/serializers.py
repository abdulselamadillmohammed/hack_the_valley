# api/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Profile, DayEntry, Attachment

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "profile_picture"]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    class Meta:
        model = User
        fields = ("username", "password", "email", "first_name", "last_name")

    def create(self, validated_data):
        return User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"],
            email=validated_data.get("email", ""),
            first_name=validated_data.get("first_name", ""),
            last_name=validated_data.get("last_name", ""),
        )

class ProfileSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    class Meta:
        model = Profile
        fields = ["id", "name", "avatar_url", "is_default", "created_at"]

    def get_avatar_url(self, obj):
        return obj.avatar.url if obj.avatar else None

class AttachmentSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()
    class Meta:
        model = Attachment
        fields = ["id", "url", "created_at"]
    def get_url(self, obj):
        return obj.file.url

class DayEntrySerializer(serializers.ModelSerializer):
    attachments = AttachmentSerializer(many=True, read_only=True)
    class Meta:
        model = DayEntry
        fields = ["id", "date", "note", "summary_text", "attachments", "created_at", "updated_at"]

class UpsertDayEntrySerializer(serializers.Serializer):
    date = serializers.DateField(required=False)  # default today if omitted
    note = serializers.CharField(required=False, allow_blank=True)

class GenerateSummarySerializer(serializers.Serializer):
    style = serializers.ChoiceField(choices=["short", "cheerful", "nostalgic"], required=False, default="short")
