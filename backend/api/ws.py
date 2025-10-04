from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

def send_ws_message(conversation_id: int, message_dict: dict):
    layer = get_channel_layer()
    async_to_sync(layer.group_send)(
        f"conv_{conversation_id}",
        {"type": "chat.message", "payload": message_dict}
    )
