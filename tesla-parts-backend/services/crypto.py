import os
import hashlib
from cryptography.fernet import Fernet

# The key should be a base64-encoded 32-byte key. 
# We default to a generated one for tests/dev if not set.
ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY", b"vY2dC58T3_v32Z_lT-n_2P1k9o-U-hWb5U3Z4_X3Oq0=")
fernet = Fernet(ENCRYPTION_KEY)

def encrypt_value(value: str) -> str:
    if value is None:
        return None
    return fernet.encrypt(value.encode()).decode()

def decrypt_value(encrypted_value: str) -> str:
    if encrypted_value is None:
        return None
    try:
        return fernet.decrypt(encrypted_value.encode()).decode()
    except Exception:
        # In case it fails to decrypt, fallback
        return ""

def get_email_hash(email: str) -> str:
    if not email:
        return ""
    # Normalize email to lower case before hashing
    normalized_email = email.lower().strip()
    return hashlib.sha256(normalized_email.encode()).hexdigest()
