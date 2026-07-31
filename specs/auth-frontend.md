# Frontend Authentication & User Features Specification

This document details the frontend implementation of authentication, authorization, profile management, shopping cart synchronization, and promocode management across both the customer-facing application (`tesla-parts-shop`) and the admin application (`tesla-parts-admin`).

## 1. Customer Frontend (`tesla-parts-shop`)

The customer-facing application uses Next.js with React Context for global state management.

### 1.1. Registration & Email Verification
- **Registration Flow (`app/register/page.tsx`)**:
  - The form is extremely streamlined, asking only for the user's email address to lower the barrier to entry.
  - Upon submission, the API sends a verification email with a secure token link.
  - The UI updates to notify the user to check their inbox.
- **Verification Flow (`app/verify/page.tsx`)**:
  - Accessed via the email link containing the `verification_token`.
  - The user sets their `password` and `confirm_password`.
  - Upon success, the account is activated and the user can log in.
- **Password Reset**:
  - Handled via `app/forgot-password` (requests email) and `app/reset-password` (sets new password using the received token).

### 1.2. Login & Global Auth State
- **Login Flow (`app/login/page.tsx`)**:
  - Users authenticate with email and password.
  - On success, the API returns a JWT access token, and the `loginCustomer(token)` method is triggered.
  - **UX Enhancement**: After login, the app checks the user's profile data (`api.getMe()`). If `first_name` or `phone` is missing, the user is automatically redirected to `/profile/setup` to complete their profile before proceeding to the shop.
- **Auth Context (`context/AppContext.tsx`)**:
  - `isCustomerLoggedIn` is managed globally.
  - On app mount, checks `localStorage` for `customerToken`. If present, it asynchronously fetches the cart and user profile.
  - A global event listener (`window.addEventListener("customer-logged-out")`) automatically logs the user out across the application if a 401 error occurs.

### 1.3. Shopping Cart Synchronization
- **Guest State**: Cart items are maintained in React state and persisted to `localStorage` under the key `tesla-parts-cart`.
- **Merge on Login**: When a user logs in, the `loginCustomer` function:
  1. Fetches the authenticated user's cart from the server.
  2. Merges the current guest cart items with the server cart. Quantities for identical items are summed.
  3. Immediately syncs the merged cart back to the server.
- **Active Sync**: While logged in, any modification to the cart triggers a debounced API call (500ms delay) to save the cart state to the backend (`api.saveCart`).

### 1.4. User Profile (`app/profile/page.tsx`)
- **Protected Route**: Navigating here without authentication redirects to `/login`.
- **Tabs Interface**: Uses URL search parameters (`?tab=info`, `?tab=orders`) to switch views.
- **Personal Information**:
  - Pre-fills data fetched from `api.getMe()`.
  - Allows editing of `first_name`, `last_name`, `phone`, and `default_address`.
  - Phone numbers are automatically formatted during input.
- **Order History**: Fetches and displays a list of the customer's past orders via `api.getMyOrders()`.

### 1.5. Promocode Application in Checkout (`components/Checkout.tsx`)
- **Auto-Fill**: For authenticated users, the checkout form automatically pre-fills contact details from their profile.
- **Promocode Interface**:
  - Displays an input field for a promocode string.
  - The "Apply" button triggers `api.validatePromoCode()`.
  - On success, the app stores `discountType` (`percent`, `usd`, `uah`) and `discountValue` locally, displays a success message ("Промокод застосовано!"), and recalculates the `totalDisplayAmount`.
  - A "Cancel" button is provided to remove the promocode and revert to the original price (or apply the user's permanent backend discount, if any).

---

## 2. Admin Frontend (`tesla-parts-admin`)

The admin application uses React (Vite) and handles authentication and store management.

### 2.1. Admin Authentication (`AuthContext.tsx` & `Login.tsx`)
- **Login (`components/Login.tsx`)**:
  - Provides a secure login interface for administrators using `username` and `password`. Includes a toggle to show/hide the password.
  - On success, stores `accessToken` and `refreshToken` in `localStorage`.
- **Auth Context (`AuthContext.tsx`)**:
  - Exposes `login`, `logout`, and `refreshAccessToken` functions.
  - Integrates with the API service via `setUnauthorizedCallback`. If an API call fails with a 401 Unauthorized status, the callback triggers `handleLogoutError()`.
  - `handleLogoutError()` clears tokens and sets `showSessionExpiredModal = true`, rendering a modal to inform the admin that their session has expired.

### 2.2. Promocode Management (`components/PromoCodeList.tsx`)
- **Listing**: Displays all promocodes in a responsive grid, utilizing an active search filter.
- **Creation & Editing**:
  - Admins can create new promocodes or edit existing ones via a modal form.
  - **Form Fields**: 
    - `code`: The string used by customers (automatically converted to uppercase).
    - `discount_type`: Selection between Percent (`percent`), USD (`usd`), or UAH (`uah`).
    - `discount_value`: Numeric value of the discount (prevents percentages over 100%).
    - `scope`: Can be `everyone` or `selected`.
  - **Customer Targeting**:
    - If `scope` is set to `selected`, a customer selection UI appears.
    - Features a real-time search input that filters customers by name, email, or phone.
    - Admins can individually toggle customers or "Select All Filtered" to link the promocode exclusively to the chosen customer IDs.

### 2.3. Customer Management (Permanent Discounts)
- Although promocodes handle temporary/code-based discounts, the admin panel also interfaces with the backend to assign **permanent discounts** to individual customers.
- The UI (likely in `CustomerList.tsx`) provides controls to set a specific `discount_type` and `discount_value` for a user profile, which automatically applies to their checkout without requiring a promocode.
