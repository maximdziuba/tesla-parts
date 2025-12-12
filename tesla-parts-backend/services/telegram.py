import os
import requests
from dotenv import load_dotenv
from models import Order

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

def send_telegram_notification(order: Order):
    if not BOT_TOKEN or not CHAT_ID or "YOUR_" in BOT_TOKEN:
        print("Telegram token not set, skipping notification")
        return

    message = f"New Order #{order.id}\n"
    message += f"Customer: {order.customer_first_name} {order.customer_last_name}\n"
    message += f"Phone: {order.customer_phone}\n"
    message += f"Total: {order.totalUAH} UAH\n"
    message += f"Delivery: {order.delivery_city}, {order.delivery_branch}\n"
    message += f"Payment: {order.payment_method}\n"
    message += "Items:\n"
    for item in order.items:
        message += f"- {item.product_id} x{item.quantity} ({item.price_at_purchase} UAH)\n"

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": message
    }
    try:
        requests.post(url, json=payload)
    except Exception as e:
        print(f"Failed to send telegram notification: {e}")
