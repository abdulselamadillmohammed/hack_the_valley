from django.shortcuts import render

# Create your views here.

from rest_framework import generics, permissions, status
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone

#token_authentication = ['rest_framework.authentication.TokenAuthentication']
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication  # Import the correct class

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)
