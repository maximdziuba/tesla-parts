import os
import requests
from dotenv import load_dotenv
from models import Order
from sqlmodel import Session
from database import engine
from models import Product

load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

def send_telegram_notification(order: Order):
    if not BOT_TOKEN or not CHAT_ID or "YOUR_" in BOT_TOKEN:
        print("Telegram token not set, skipping notification")
        return

    message = f"<b>Нове замовлення #{order.id} </b>\n"
    message += f"<b>Покупець</b>: {order.customer_first_name} {order.customer_last_name}\n"
    message += f"<b>Телефон</b>: {order.customer_phone}\n"
    message += f"<b>Сума</b>: {order.totalUAH} UAH\n"
    message += f"<b>Доставка</b>: {order.delivery_city}, {order.delivery_branch}\n"
    message += f"<b>Оплата</b>: {order.payment_method}\n"
    message += "<b>Товари</b>:\n"
    
    # Query products for each order item
    with Session(engine) as session:
        for item in order.items:
            product = session.get(Product, item.product_id)
            if product:
                detail_number = product.detail_number or "N/A"
                product_name = product.name
                message += f"- <b>{detail_number}</b> {product_name} <b>{item.quantity} шт.</b> (<b>{item.price_at_purchase} UAH</b>)\n"
            else:
                # Fallback if product not found
                message += f"- Product ID: {item.product_id} <b>{item.quantity} шт.</b> (<b>{item.price_at_purchase} UAH</b>)\n"

    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": CHAT_ID,
        "text": message,
        "parse_mode": "HTML"
    }
    try:
        requests.post(url, json=payload)
    except Exception as e:
        print(f"Failed to send telegram notification: {e}")
