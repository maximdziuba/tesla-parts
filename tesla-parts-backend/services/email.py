import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv

load_dotenv()

SMTP_EMAIL = os.getenv("SMTP_EMAIL")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", 587))
FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

def send_verification_email(to_email: str, token: str):
    verification_link = f"{FRONTEND_URL}/verify?token={token}"
    
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"--- EMAIL DISPATCH FALLBACK ---")
        print(f"To: {to_email}")
        print(f"Subject: Verify your account")
        print(f"Link: {verification_link}")
        print(f"-------------------------------")
        return
        
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Підтвердження електронної пошти"
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email
    
    html = f"""
    <html>
      <body>
        <h2>Вітаємо в Tesla Parts Shop!</h2>
        <p>Будь ласка, натисніть кнопку нижче, щоб підтвердити свою електронну пошту та встановити пароль:</p>
        <a href="{verification_link}" style="display:inline-block;padding:10px 20px;background-color:#E31937;color:#ffffff;text-decoration:none;border-radius:5px;">Підтвердити пошту</a>
      </body>
    </html>
    """
    
    part = MIMEText(html, "html")
    msg.attach(part)
    
    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        server.quit()
    except Exception as e:
        print(f"Failed to send email: {e}")
        # Fallback to console print if SMTP fails
        print(f"--- EMAIL DISPATCH FALLBACK ---")
        print(f"Link: {verification_link}")
        print(f"-------------------------------")

def send_reset_password_email(to_email: str, token: str):
    reset_link = f"{FRONTEND_URL}/reset-password?token={token}"
    
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"--- EMAIL DISPATCH FALLBACK ---")
        print(f"To: {to_email}")
        print(f"Subject: Reset your password")
        print(f"Link: {reset_link}")
        print(f"-------------------------------")
        return
        
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Скидання пароля"
    msg["From"] = SMTP_EMAIL
    msg["To"] = to_email
    
    html = f"""
    <html>
      <body>
        <h2>Запит на скидання пароля</h2>
        <p>Будь ласка, натисніть кнопку нижче, щоб скинути свій пароль:</p>
        <a href="{reset_link}" style="display:inline-block;padding:10px 20px;background-color:#E31937;color:#ffffff;text-decoration:none;border-radius:5px;">Скинути пароль</a>
        <p>Якщо ви не робили цей запит, будь ласка, проігноруйте цей лист.</p>
      </body>
    </html>
    """
    
    part = MIMEText(html, "html")
    msg.attach(part)
    
    try:
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        server.starttls()
        server.login(SMTP_EMAIL, SMTP_PASSWORD)
        server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        server.quit()
    except Exception as e:
        print(f"Failed to send email: {e}")
        print(f"--- EMAIL DISPATCH FALLBACK ---")
        print(f"Link: {reset_link}")
        print(f"-------------------------------")
