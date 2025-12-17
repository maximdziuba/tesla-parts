import requests
from models import Order, Product, Settings
from sqlmodel import Session
from database import engine

def _get_setting_value(session: Session, key: str) -> str | None:
    setting = session.get(Settings, key)
    return setting.value if setting else None

def send_telegram_notification(order: Order):
    with Session(engine) as session:
        bot_token = _get_setting_value(session, "telegram_bot_token")
        chat_id = _get_setting_value(session, "telegram_chat_id")

        if not bot_token or not chat_id or "YOUR_" in bot_token:
            print("Telegram credentials not set, skipping notification")
            return

        created = order.created_at.strftime("%d.%m.%Y %H:%M") if order.created_at else ""
        message = f"<b>Нове замовлення #{order.id}</b>\n"
        if created:
            message += f"<b>Створено</b>: {created}\n"
        message += f"<b>Покупець</b>: {order.customer_first_name} {order.customer_last_name}\n"
        message += f"<b>Телефон</b>: {order.customer_phone}\n"
        message += f"<b>Сума</b>: {order.totalUAH} UAH\n"
        message += f"<b>Доставка</b>: {order.delivery_city}, {order.delivery_branch}\n"
        message += f"<b>Оплата</b>: {order.payment_method}\n"
        message += "<b>Товари</b>:\n"

        for item in order.items:
            product = session.get(Product, item.product_id)
            if product:
                detail_number = product.detail_number or "N/A"
                product_name = product.name
                message += (
                    f"- <b>{detail_number}</b> {product_name} <b>{item.quantity} шт.</b> "
                    f"(<b>{item.price_at_purchase} UAH</b>)\n"
                )
            else:
                message += (
                    f"- Product ID: {item.product_id} <b>{item.quantity} шт.</b> "
                    f"(<b>{item.price_at_purchase} UAH</b>)\n"
                )

    url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": message,
        "parse_mode": "HTML"
    }
    try:
        requests.post(url, json=payload)
    except Exception as e:
        print(f"Failed to send telegram notification: {e}")
