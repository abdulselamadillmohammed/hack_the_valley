# """
# ASGI config for core project.

# It exposes the ASGI callable as a module-level variable named ``application``.

# For more information on this file, see
# https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
# """

# import os

# from django.core.asgi import get_asgi_application

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

# application = get_asgi_application()

import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.conf import settings

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django_app = get_asgi_application()

# Import here to avoid model import at startup before settings
from api.ws_urls import websocket_urlpatterns  # noqa

application = ProtocolTypeRouter({
    "http": django_app,
    "websocket": AuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
})
