from typing import List, Optional
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlmodel import Session, select
from sqlalchemy.orm import selectinload
from database import get_session
from models import Order, OrderItem
from schemas import OrderCreate, OrderRead
from services.telegram import send_telegram_notification
from dependencies import get_current_admin # Import for authentication
from pydantic import BaseModel

router = APIRouter(prefix="/orders", tags=["orders"])

class UpdateTtnRequest(BaseModel):
    ttn: Optional[str] = None

@router.post("/")
def create_order(order_data: OrderCreate, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    order = Order(
        customer_first_name=order_data.customer.firstName,
        customer_last_name=order_data.customer.lastName,
        customer_phone=order_data.customer.phone,
        delivery_city=order_data.delivery.city,
        delivery_branch=order_data.delivery.branch,
        payment_method=order_data.paymentMethod,
        totalUAH=order_data.totalUAH,
        ttn=order_data.ttn # Add TTN here
    )
    session.add(order)
    session.commit()
    session.refresh(order)

    for item in order_data.items:
        order_item = OrderItem(
            order_id=order.id,
            product_id=item.id,
            quantity=item.quantity,
            price_at_purchase=item.priceUAH
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

@router.get("/", response_model=List[OrderRead], dependencies=[Depends(get_current_admin)]) # Protect get_orders
def get_orders(session: Session = Depends(get_session)):
    orders = session.exec(select(Order).options(selectinload(Order.items))).all()
    return orders
