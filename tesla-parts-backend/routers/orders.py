from typing import List, Optional
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from database import get_session
from models import Order, OrderItem
from schemas import OrderCreate, OrderRead
from services.telegram import send_telegram_notification
from services.pricing import get_exchange_rate
from dependencies import get_current_admin # Import for authentication
from pydantic import BaseModel

router = APIRouter(prefix="/orders", tags=["orders"])

class UpdateTtnRequest(BaseModel):
    ttn: Optional[str] = None

class UpdateStatusRequest(BaseModel):
    status: str

@router.post("/")
def create_order(order_data: OrderCreate, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    rate = get_exchange_rate(session)

    def _item_price_usd(item):
        if item.priceUSD and item.priceUSD > 0:
            return item.priceUSD
        if item.priceUAH and rate:
            return item.priceUAH / rate
        return item.priceUAH or 0

    total_usd = order_data.totalUSD
    if total_usd is None or total_usd <= 0:
        total_usd = sum(_item_price_usd(item) * item.quantity for item in order_data.items)

    order = Order(
        customer_first_name=order_data.customer.firstName,
        customer_last_name=order_data.customer.lastName,
        customer_phone=order_data.customer.phone,
        delivery_city=order_data.delivery.city,
        delivery_branch=order_data.delivery.branch,
        payment_method=order_data.paymentMethod,
        totalUSD=round(total_usd, 2),
        ttn=order_data.ttn # Add TTN here
    )
    session.add(order)
    session.commit()
    session.refresh(order)

    for item in order_data.items:
        price_usd = _item_price_usd(item)
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.id,
            quantity=item.quantity,
            price_at_purchase=round(price_usd, 2)
        )
        session.add(order_item)
    
    session.commit()
    session.refresh(order)
    
    background_tasks.add_task(send_telegram_notification, order)
    
    return {"id": order.id, "status": "created"}

@router.put("/{order_id}/ttn", dependencies=[Depends(get_current_admin)])
def update_order_ttn(order_id: int, ttn_data: UpdateTtnRequest, session: Session = Depends(get_session)):
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.ttn = ttn_data.ttn
    session.add(order)
    session.commit()
    session.refresh(order)
    return {"message": "TTN updated successfully", "order_id": order.id, "ttn": order.ttn}

@router.put("/{order_id}/status", dependencies=[Depends(get_current_admin)])
def update_order_status(order_id: int, status_data: UpdateStatusRequest, session: Session = Depends(get_session)):
    order = session.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status_data.status
    session.add(order)
    session.commit()
    session.refresh(order)
    return {"message": "Status updated successfully", "order_id": order.id, "status": order.status}

@router.get("/", response_model=List[OrderRead], dependencies=[Depends(get_current_admin)]) # Protect get_orders
def get_orders(session: Session = Depends(get_session)):
    orders = session.exec(select(Order).options(selectinload(Order.items))).all()
    rate = get_exchange_rate(session)
    
    orders_with_uah = []
    updated = False
    for order in orders:
        raw_total_usd = order.totalUSD
        total_usd = float(raw_total_usd) if raw_total_usd is not None else 0.0

        if total_usd <= 0:
            legacy_total = 0.0
            for item in order.items:
                price = item.price_at_purchase or 0
                legacy_total += (price / rate if rate else price) * item.quantity
            total_usd = round(legacy_total, 2)

        total_usd = round(total_usd, 2)

        if raw_total_usd != total_usd:
            order.totalUSD = total_usd
            updated = True

        order_read = OrderRead.model_validate(order, from_attributes=True)
        order_read.totalUAH = round(total_usd * rate, 2) if rate else 0.0
        orders_with_uah.append(order_read)

    if updated:
        session.commit()
        
    return orders_with_uah
