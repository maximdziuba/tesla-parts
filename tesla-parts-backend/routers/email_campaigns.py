from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlmodel import Session, select
from typing import List
from database import get_session
from dependencies import get_current_admin
from models import EmailList, CustomerEmailListLink, Customer
from schemas import EmailListCreate, EmailListRead, EmailCampaignSendRequest, DirectEmailCampaignRequest, CustomerBasicRead
from services.crypto import decrypt_value
from services.email import send_bulk_emails

router = APIRouter(prefix="/email-campaigns", tags=["email-campaigns"])

@router.get("/lists", response_model=List[EmailListRead])
def get_email_lists(session: Session = Depends(get_session), _: dict = Depends(get_current_admin)):
    lists = session.exec(select(EmailList)).all()
    result = []
    for l in lists:
        customers = []
        for c in l.customers:
            email = decrypt_value(c.encrypted_email)
            if email:
                first_name = decrypt_value(c.encrypted_first_name) if c.encrypted_first_name else None
                last_name = decrypt_value(c.encrypted_last_name) if c.encrypted_last_name else None
                customers.append(CustomerBasicRead(id=c.id, email=email, first_name=first_name, last_name=last_name))
        result.append(EmailListRead(id=l.id, name=l.name, created_at=l.created_at, customers=customers))
    return result

@router.post("/lists", response_model=EmailListRead)
def create_email_list(
    data: EmailListCreate,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_admin)
):
    new_list = EmailList(name=data.name)
    session.add(new_list)
    session.commit()
    session.refresh(new_list)

    if data.customer_ids:
        for cid in data.customer_ids:
            customer = session.get(Customer, cid)
            if customer:
                link = CustomerEmailListLink(customer_id=cid, email_list_id=new_list.id)
                session.add(link)
        session.commit()
        session.refresh(new_list)

    customers = []
    for c in new_list.customers:
        email = decrypt_value(c.encrypted_email)
        if email:
            first_name = decrypt_value(c.encrypted_first_name) if c.encrypted_first_name else None
            last_name = decrypt_value(c.encrypted_last_name) if c.encrypted_last_name else None
            customers.append(CustomerBasicRead(id=c.id, email=email, first_name=first_name, last_name=last_name))
            
    return EmailListRead(id=new_list.id, name=new_list.name, created_at=new_list.created_at, customers=customers)

@router.delete("/lists/{list_id}")
def delete_email_list(
    list_id: int,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_admin)
):
    l = session.get(EmailList, list_id)
    if not l:
        raise HTTPException(status_code=404, detail="List not found")
    
    links = session.exec(select(CustomerEmailListLink).where(CustomerEmailListLink.email_list_id == list_id)).all()
    for link in links:
        session.delete(link)
        
    session.delete(l)
    session.commit()
    return {"message": "List deleted"}

@router.post("/lists/{list_id}/send")
def send_campaign_to_list(
    list_id: int,
    data: EmailCampaignSendRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_admin)
):
    l = session.get(EmailList, list_id)
    if not l:
        raise HTTPException(status_code=404, detail="List not found")
        
    recipients = set()
    for c in l.customers:
        email = decrypt_value(c.encrypted_email)
        if email:
            recipients.add(email)
            
    if not recipients:
        raise HTTPException(status_code=400, detail="List is empty or contains no valid emails")
        
    background_tasks.add_task(send_bulk_emails, list(recipients), data.subject, data.body)
    return {"message": f"Campaign scheduled for {len(recipients)} recipients."}

@router.post("/send-direct")
def send_direct_campaign(
    data: DirectEmailCampaignRequest,
    background_tasks: BackgroundTasks,
    session: Session = Depends(get_session),
    _: dict = Depends(get_current_admin)
):
    recipients = set(data.emails) if data.emails else set()
    
    if data.customer_ids:
        customers = session.exec(select(Customer).where(Customer.id.in_(data.customer_ids))).all()
        for c in customers:
            email = decrypt_value(c.encrypted_email)
            if email:
                recipients.add(email)
                
    if not recipients:
        raise HTTPException(status_code=400, detail="No recipients provided")
        
    background_tasks.add_task(send_bulk_emails, list(recipients), data.subject, data.body)
    return {"message": f"Campaign scheduled for {len(recipients)} recipients."}
