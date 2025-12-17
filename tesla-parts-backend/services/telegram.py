import requests
from models import Order, Product, Settings
from sqlmodel import Session
from database import engine
from services.pricing import get_exchange_rate

def _get_setting_value(session: Session, key: str) -> str | None:
    setting = session.get(Settings, key)
    return setting.value if setting else None

def send_telegram_notification(order: Order):
    with Session(engine) as session:
        bot_token = _get_setting_value(session, "telegram_bot_token")
        chat_id = _get_setting_value(session, "telegram_chat_id")
        rate = get_exchange_rate(session)

        if not bot_token or not chat_id or "YOUR_" in bot_token:
            print("Telegram credentials not set, skipping notification")
            return

        created = order.created_at.strftime("%d.%m.%Y %H:%M") if order.created_at else ""
        message = f"<b>Нове замовлення #{order.id}</b>\n"
        if created:
            message += f"<b>Створено</b>: {created}\n"
        total_usd = order.totalUSD or 0
        legacy_mode = total_usd <= 0
        if legacy_mode:
            legacy_total = 0.0
            for item in order.items:
                price = item.price_at_purchase or 0
                legacy_total += (price / rate if rate else price) * item.quantity
            total_usd = round(legacy_total, 2)
        total_uah = round(total_usd * rate, 2)
        message += f"<b>Покупець</b>: {order.customer_first_name} {order.customer_last_name}\n"
        message += f"<b>Телефон</b>: {order.customer_phone}\n"
        message += f"<b>Сума</b>: {total_usd:.2f} USD ({total_uah} UAH)\n"
        message += f"<b>Доставка</b>: {order.delivery_city}, {order.delivery_branch}\n"
        message += f"<b>Оплата</b>: {order.payment_method}\n"
        message += "<b>Товари</b>:\n"

        for item in order.items:
            product = session.get(Product, item.product_id)
            usd_price = item.price_at_purchase or 0
            if legacy_mode:
                usd_price = usd_price / rate if rate else usd_price
            uah_price = round(usd_price * rate, 2)
            if product:
                detail_number = product.detail_number or "N/A"
                product_name = product.name
                message += (
                    f"- <b>{detail_number}</b> {product_name} <b>{item.quantity} шт.</b> "
                    f"(<b>{usd_price:.2f} USD ({uah_price:.2f} UAH)</b>)\n"
                )
            else:
                message += (
                    f"- Product ID: {item.product_id} <b>{item.quantity} шт.</b> "
                    f"(<b>{usd_price:.2f} USD ({uah_price:.2f} UAH)</b>)\n"
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
