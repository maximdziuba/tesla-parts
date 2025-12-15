from sqlmodel import Session
from models import Settings, Product

DEFAULT_EXCHANGE_RATE = 40.0


def get_exchange_rate(session: Session) -> float:
    setting = session.get(Settings, "exchange_rate")
    if setting and setting.value:
        try:
            value = float(setting.value)
            if value > 0:
                return value
        except (ValueError, TypeError):
            pass
    return DEFAULT_EXCHANGE_RATE


def compute_price_fields(product: Product, rate: float) -> tuple[float, float]:
    price_usd = product.priceUSD or 0.0
    if price_usd <= 0 and product.priceUAH:
        price_usd = product.priceUAH / rate if rate else product.priceUAH
    price_uah = round(price_usd * rate, 2) if rate else product.priceUAH or 0.0
    return price_usd, price_uah
