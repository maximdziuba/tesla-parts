# Authentication, Authorization, and Customer Features Specification

This document details the implementation of authentication, authorization, user profiles, and promocodes in the Tesla Parts Shop. It serves as a guide for replicating this functionality in other shop instances.

## 1. Overview
The system implements two distinct authentication flows:
- **Admin Authentication:** Uses a robust Access/Refresh token pair stored in HttpOnly cookies, designed for backend administration.
- **Customer Authentication:** Uses a single Access token. The backend sets it as an HttpOnly cookie, but the frontend also receives it to store in `localStorage` for API requests and session tracking.

Additionally, the system features:
- End-to-end encryption for customer PII (Personally Identifiable Information).
- Cart synchronization between guest and authenticated states.
- A flexible Promocode system with global or targeted ("selected customers only") scopes.

---

## 2. Admin Authentication (`routers/auth.py`)

### 2.1. Tokens & Sessions
- **Tokens:** Uses JWTs for Access Tokens (30 min expiry). Refresh Tokens (7 days expiry) are UUIDs.
- **Storage:** Stored in the database under `UserSession` linked to the admin `User`.
- **Delivery:** Returned in the JSON response and simultaneously set as **HttpOnly, Secure, SameSite=strict** cookies (`accessToken`, `refreshToken`). 
- **Domain Sharing:** Cookies dynamically set the `domain` (e.g., `.teslafix.com.ua`) based on the request host to share auth state across subdomains.

### 2.2. Endpoints
- `POST /auth/token`: Validates username/password, generates tokens, saves session, sets cookies.
- `POST /auth/refresh-token`: Validates refresh token from cookie/body, generates a new pair, updates DB.
- `POST /auth/logout`: Deletes the session from DB and clears cookies.
- `POST /auth/reset-password`: Validates old password and hashes/updates the new one.

---

## 3. Customer Authentication & Profile (`routers/customers.py`)

### 3.1. Registration & Email Verification Flow
The platform enforces email verification to ensure that only valid users create accounts and to act as a secure gateway for account recovery and communications.

1. **Register (`POST /customers/register`):**
   - **Request Handling**: Receives the user's email address.
   - **Security**: Computes a deterministic hash (`email_hash`) for quick uniqueness checks, then encrypts the plain email (`encrypt_value`) for secure database storage.
   - **Token Generation**: Generates a 32-byte URL-safe `verification_token` using Python's `secrets` module.
   - **Lifespan**: The token is saved to the database with a strict 24-hour expiration window (`token_expires_at`).
   - **Email Dispatch (`services/email.py`)**: Uses Python's built-in `smtplib`. It reads `SMTP_EMAIL` and `SMTP_PASSWORD` from the environment.
     - **Production**: Constructs an HTML email containing a stylized button linking to `<FRONTEND_URL>/verify?token=<token>`.
     - **Fallback/Development**: If SMTP credentials are missing, the system catches this gracefully, printing the verification link to the server console instead of throwing an error, allowing local development to proceed unhindered.

2. **Verify (`POST /customers/verify`):**
   - **Action**: User provides the `verification_token` (from the URL) alongside a new `password` and `confirm_password`.
   - **Validation**: The system verifies:
     - The token exists in the database.
     - The current time is before the `token_expires_at` timestamp.
     - `password` and `confirm_password` match exactly.
   - **Activation**: The password is hashed using `bcrypt` and saved. The user's `is_verified` flag is flipped to `True`.
   - **Cleanup**: The `verification_token` and `token_expires_at` fields are immediately nullified to prevent token reuse.

### 3.2. Password Reset Flow
- `POST /customers/forgot-password`: Generates a raw token, stores its SHA-256 hash in DB (`reset_token_hash`, 15 min expiry), and emails the raw token.
- `POST /customers/reset-password`: Hashes the provided token, compares it with DB, and updates the password if valid.

### 3.3. Customer Login & Session
- **Login (`POST /customers/login`):**
   - Looks up the user by `email_hash`.
   - Validates the password.
   - Creates a JWT `access_token` (30 min expiry) containing `sub: plain_email` and `role: "customer"`.
   - Sets an HttpOnly cookie (`customerToken`) and returns the token in the JSON body.
- **Logout (`POST /customers/logout`):**
   - Clears the `customerToken` cookie.

### 3.4. Profile Data & Security
- PII (Email, First Name, Last Name, Phone, Default Address) is encrypted at rest using a symmetric encryption service (`services/crypto.py`).
- Before returning profile data (`GET /customers/me`), values are decrypted.
- When updating the profile (`PUT /customers/profile`), values are encrypted before being committed to the database.

---

## 4. Frontend Integration (`AppContext.tsx`)

### 4.1. Session State
- Maintained in React Context (`AppContext.tsx`).
- `isCustomerLoggedIn`: Boolean derived from the presence of `customerToken` in `localStorage`.
- **Initialization:** On mount, if the token exists, it makes parallel calls to fetch the user's cart and profile.

### 4.2. Cart Synchronization
- **Guest State:** Cart is managed in memory and synced to `localStorage` (`tesla-parts-cart`).
- **Upon Login:** 
  - Guest cart items are merged with the server-stored cart (`Customer.cart_data`).
  - Quantities are summed if the item exists in both.
  - The merged cart is synced back to the backend.
- **While Logged In:** Changes to the cart are debounced (500ms) and synced to the backend automatically via API.

---

## 5. Promocodes & Discounts (`routers/promocodes.py`)

### 5.1. Promocode Mechanics
- **Model:** `PromoCode` (code, discount_type, discount_value, scope, is_active).
- **Discount Types:** `percent`, `usd`, `uah`.
- **Scopes:**
  - `everyone`: Valid for all users (guests and logged-in).
  - `selected`: Only valid for specifically linked customer accounts.

### 5.2. Admin Management
- Admins can create, read, update, and delete promocodes.
- For `selected` scope, admins provide a list of `customer_ids`. The backend creates records in a junction table (`CustomerPromoCodeLink`).

### 5.3. Validation Logic (`POST /promocodes/validate`)
- Users submit a promocode string.
- If `scope == everyone`: Returns valid.
- If `scope == selected`:
  - Requires the `get_optional_customer` dependency to resolve a logged-in user.
  - Validates if the `Customer.id` exists in the `promocode.customers` relation.
  - If valid, returns the discount amount and type for frontend calculation.

### 5.4. Permanent Customer Discounts
- Distinct from Promocodes, individual customers can have permanent discounts applied by an admin.
- `PUT /customers/{customer_id}/discount` allows admins to set `discount_type` and `discount_value` directly on the `Customer` record.

---

## 6. Frontend Views & UI Components

The application implements these features across several dedicated pages and components, utilizing Next.js App Router.

### 6.1. Authentication Pages (`app/login`, `app/register`, `app/verify`)
- **Login (`app/login/page.tsx`):**
  - Displays a form for email and password.
  - On submission, calls `api.loginCustomer` and uses the context's `loginCustomer(token)` method to update global state.
  - Features an important UX flow: After successful login, it fetches `api.getMe()`. If the user is missing a `first_name` or `phone`, they are automatically redirected to `app/profile/setup` to complete their profile. Otherwise, they are redirected to the home page.
- **Registration (`app/register/page.tsx`):**
  - Collects only the user's email address initially to lower the barrier to entry.
  - Submits the email and informs the user to check their inbox for a verification link.
- **Verification (`app/verify/page.tsx`):**
  - Handles the URL containing the `verification_token`.
  - Prompts the user to set their password (`password` and `confirm_password`) to activate the account.

### 6.2. Password Management (`app/forgot-password`, `app/reset-password`)
- Separate flows that mirror the registration flow. Users submit their email, receive a secure token link, and navigate to the reset page to establish a new password.

### 6.3. User Profile (`app/profile/page.tsx`)
- Protected route: If a user navigates here without a session, they are redirected to `/login`.
- **Tabs System:** Uses query parameters (`?tab=info`) to switch between different profile sections (e.g., Personal Info, Order History).
- **Personal Information:** 
  - Populated via `api.getMe()`.
  - Includes a form to update `first_name`, `last_name`, `phone`, and `default_address`. 
  - Handles formatting and saving, with loading states and error handling.
- **Order History:** 
  - Fetches `api.getMyOrders()` to display a list of the user's past purchases.

### 6.4. Checkout & Promocodes (`components/Checkout.tsx`)
- The checkout component integrates heavily with the authentication and discount state.
- **Auto-Fill:** If a user is logged in, their contact and delivery details are pre-filled automatically using data from `api.getMe()`.
- **Promocode Interface:**
  - Includes an input field for the promo code.
  - Users click "Apply" to call `api.validatePromoCode()`.
  - If successful, updates the local `discountType` and `discountValue` state, displays a success message ("Промокод {code} застосовано!"), and recalculates the final `totalDisplayAmount`.
  - Users can click "Cancel" to remove the applied promocode and restore the original (or permanent customer) discount.
- **Guest Checkout:** Allows unauthenticated users to create an order. After a successful guest order, it can prompt the user with an "Offer Modal" to create an account for future convenience.
