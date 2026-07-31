# Promocodes Functionality Specification

This document details the complete end-to-end functionality of the Promocode system across all three projects in the repository: `tesla-parts-backend`, `tesla-parts-shop` (customer frontend), and `tesla-parts-admin` (admin dashboard).

---

## 1. Backend (`tesla-parts-backend`)

The backend serves as the source of truth for promocodes, enforcing security, validation, and final price calculation.

### 1.1. Data Models (`models.py`)
- **`PromoCode` Model**: Stores the core attributes:
  - `id`: Primary key.
  - `code`: The string customers type in (always stored uppercase and stripped of whitespace).
  - `discount_type`: String Enum (`"percent"`, `"usd"`, `"uah"`).
  - `discount_value`: Float representing the discount amount.
  - `scope`: String Enum (`"everyone"`, `"selected"`). Determines if it's public or restricted to specific users.
  - `is_active`: Boolean toggle to quickly enable/disable without deleting.
- **`CustomerPromoCodeLink` Model**: A junction table that enables a Many-to-Many relationship between `PromoCode` and `Customer`. Used specifically when `scope == "selected"`.

### 1.2. API Endpoints (`routers/promocodes.py`)
- **Admin Management Endpoints** (Protected by `get_current_admin`):
  - `GET /promocodes/`: Returns a list of all promocodes along with an array of linked `customer_ids`.
  - `POST /promocodes/`: Creates a new promocode. Validates that the code string is unique. If `scope` is `"selected"`, iterates through the provided `customer_ids` and creates records in `CustomerPromoCodeLink`.
  - `PUT /promocodes/{id}`: Updates an existing promocode. Crucially, it wipes existing `CustomerPromoCodeLink` records for that promocode and recreates them based on the new payload to ensure perfect synchronization.
  - `DELETE /promocodes/{id}`: Removes the promocode.
- **Customer Endpoint**:
  - `POST /promocodes/validate`: A public/customer endpoint. Receives a code string, converts it to uppercase, and queries the database. 
  - **Validation Rules**:
    - If code doesn't exist or `is_active == False` -> Returns 404/400.
    - If `scope == "everyone"` -> Returns valid.
    - If `scope == "selected"` -> Requires a valid session (`get_optional_customer`). It checks if the active customer's ID exists in the `promocode.customers` relationship. If yes, returns valid. Otherwise, raises a 400 error.

### 1.3. Order Processing (`routers/orders.py`)
- When a customer submits an order (`POST /orders`), the backend **does not trust the frontend's discounted price**.
- The backend receives the `promocode` string in the payload.
- It re-fetches the `PromoCode` from the database, re-evaluates the `scope` (ensuring the customer still has access), and recalculates the `total_usd` mathematically:
  - `"percent"`: `total_usd = total_usd * (1.0 - discount_value / 100.0)`
  - `"usd"`: `total_usd = total_usd - discount_value`
  - `"uah"`: Converts UAH to USD using the current exchange rate and subtracts it.
- This ensures that manipulated API calls from the client cannot alter the true price.

---

## 2. Customer Frontend (`tesla-parts-shop`)

The customer-facing application handles the UX of applying promocodes and provides immediate visual feedback.

### 2.1. Checkout Integration (`components/Checkout.tsx`)
- **State Management**: The component holds local state for `promoCodeInput`, `promoCodeError`, `promoCodeSuccess`, `discountType`, `discountValue`, and `appliedPromoCode`.
- **Application UX**:
  - The user types a code and clicks "Apply".
  - The app calls `api.validatePromoCode(promoCodeInput)`.
  - **On Success**: The API returns the type and value. The UI sets the local discount state, clears errors, and displays a green success message (e.g., "Промокод X застосовано!").
  - **On Error**: Displays the error message returned by the backend (e.g., "Недійсний промокод" or "Цей промокод тільки для зареєстрованих клієнтів").
- **Dynamic Recalculation**:
  - The UI calculates `totalDisplayAmount` in real-time.
  - It subtracts the calculated discount amount (handling percentage or fixed currency conversions) from the subtotal.
- **Cancellation**: Users can click a "Cancel" button to wipe the `appliedPromoCode` state, which instantly reverts the cart total back to the original price (or restores the customer's permanent backend discount, if they have one).
- **Submission**: When the final "Create Order" button is pressed, the string stored in `appliedPromoCode` is appended to the order payload sent to `api.createOrder`.

---

## 3. Admin Frontend (`tesla-parts-admin`)

The admin application provides a comprehensive UI to manage promocodes and target them at specific cohorts.

### 3.1. Promocode Management (`components/PromoCodeList.tsx`)
- **Dashboard View**: Displays all promocodes in a responsive grid. Shows the code, the discount amount/type, and a badge indicating if it's for "everyone" or "selected" users. Includes a search bar to instantly filter codes locally.
- **Creation/Editing Modal**:
  - Provides a form with validation (e.g., preventing >100% discounts).
  - Handles the `discount_type` selection natively.
- **Targeted Scope UI (Selected Customers)**:
  - When the admin sets the `scope` dropdown to `"selected"`, a dynamic sub-component renders.
  - This sub-component fetches the full list of registered customers.
  - It includes a real-time search input that filters customers by `first_name`, `last_name`, `email`, or `phone`.
  - Admins can manually click checkboxes next to individual customers.
  - **Bulk Selection**: A "Select All Filtered" button allows the admin to quickly assign the promocode to everyone matching the current search query (e.g., searching for all emails ending in "@gmail.com" and bulk assigning).
- **API Interaction**: Maps the UI state directly to the `POST` or `PUT` payloads expected by `ApiService`, passing the array of selected `customer_ids` when applicable.
