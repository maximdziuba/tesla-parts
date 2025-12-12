from fastapi import APIRouter, Depends, BackgroundTasks
from sqlmodel import Session
from database import get_session
from models import Order, OrderItem
from schemas import OrderCreate
from services.telegram import send_telegram_notification

router = APIRouter(prefix="/orders", tags=["orders"])

@router.post("/")
def create_order(order_data: OrderCreate, background_tasks: BackgroundTasks, session: Session = Depends(get_session)):
    order = Order(
        customer_first_name=order_data.customer.firstName,
        customer_last_name=order_data.customer.lastName,
        customer_phone=order_data.customer.phone,
        delivery_city=order_data.delivery.city,
        delivery_branch=order_data.delivery.branch,
        payment_method=order_data.paymentMethod,
        totalUAH=order_data.totalUAH
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
