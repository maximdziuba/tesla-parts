import sys
from sqlmodel import Session, select
from database import engine
from models import Customer
from services.crypto import get_email_hash

def delete_customer_by_email(email: str):
    email_hash = get_email_hash(email)
    
    with Session(engine) as session:
        customer = session.exec(select(Customer).where(Customer.email_hash == email_hash)).first()
        if customer:
            session.delete(customer)
            session.commit()
            print(f"Customer with email {email} deleted successfully.")
        else:
            print(f"Customer with email {email} not found.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python delete_customer.py <email>")
        sys.exit(1)
        
    email_to_delete = sys.argv[1]
    delete_customer_by_email(email_to_delete)
