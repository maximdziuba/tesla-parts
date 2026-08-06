# Tesla Parts Shop

An e-commerce storefront and management platform for Tesla spare parts (Model 3, Model S, Model X, Model Y).

---

## 🛠 Tech Stack

* **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router.
* **Backend:** FastAPI, SQLModel, SQLite (dev) / PostgreSQL (prod), JWT Auth, Pydantic.
* **Analytics & Marketing:** Google Tag Manager (GTM), GA4 Ecommerce Tracking, Google Ads Dynamic Remarketing.
* **Infrastructure & Deployment:** Docker, Nginx Gateway, Render / Vercel.

---

## 📁 Project Structure

```
.
├── tesla-parts-shop/      # Public React storefront (React + Vite)
├── tesla-parts-admin/     # Administration dashboard (React + Vite)
├── tesla-parts-backend/   # REST API server (FastAPI + SQLModel)
├── nginx-gateway/         # Nginx reverse proxy configuration
└── docker-compose.yml     # Local orchestration setup
```

---

## 🚀 How to Run Locally

### 1. Fast Start with Docker Compose (Recommended)

```bash
docker-compose up --build
```
* **Storefront (Shop):** `http://localhost:3000`
* **Admin Dashboard:** `http://localhost:3001`
* **Backend API:** `http://localhost:8000` (Swagger Docs: `http://localhost:8000/docs`)

---

### 2. Manual Component Setup

#### A. Backend (FastAPI):
```bash
cd tesla-parts-backend
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

#### B. Frontend Shop (Storefront):
```bash
cd tesla-parts-shop
npm install
npm run dev
```

#### C. Frontend Admin (Dashboard):
```bash
cd tesla-parts-admin
npm install
npm run dev
```

---

## 🚨 CRITICAL: Architectural & Analytics Safeguards

To prevent breaking Google Ads remarketing, GA4 tracking, or order pricing during refactoring, **always adhere to the following rules**:

### 1. GTM Script Position (`tesla-parts-shop/index.html`)
* The GTM snippet (`GTM-W2HKHCLB`) **must remain a classic synchronous `<script>` ABOVE the `importmap` block**.
* *Rationale:* Placing it below `importmap` or using `type="module"` will cause the import map to load out of sequence, breaking React module loading and causing a blank screen on all traffic.

### 2. Cart Event Tracking (`App.tsx` -> `addToCart`)
* `trackAddToCart` **must be called BEFORE `setCart`** and **NEVER inside the `setCart((prev) => ...)` updater callback**.
* *Rationale:* React 18+ may execute updater callbacks multiple times per state update, resulting in duplicate `add_to_cart` events. Uncaught errors inside state updaters also crash the React component tree.

### 3. Exchange Rate Calculation in `addToCart` (`App.tsx`)
* Reference exchange rate using `uahPerUsd` (or fallback `DEFAULT_EXCHANGE_RATE_UAH_PER_USD`), **NEVER reference `effectiveRate` inside `addToCart`**.
* *Rationale:* `effectiveRate` is scoped inside a `useMemo` block in `Checkout.tsx`. Referring to it inside `App.tsx` turns it into an undeclared global variable, breaking cart functionality silently. Always run `npx tsc --noEmit` to verify type safety.

### 4. `view_item` Effect Dependencies (`ProductPage.tsx`)
* The `useEffect` for `trackViewItem` **must depend ONLY on `[product.id]`**: `useEffect(() => { trackViewItem(product, effectiveRate); }, [product.id]);`.
* *Rationale:* Adding `effectiveRate` to dependencies triggers a second `view_item` event when exchange rates load asynchronously from the backend, inflating view analytics.

### 5. Google Merchant Center Matching (`utils/analytics.ts`)
* `item_id` in `gaItem` **MUST match `product.id`** (which corresponds to `g:id` in the Google Merchant Center product feed).
* *Rationale:* Mismatched IDs prevent Google Ads from pairing tracked products with dynamic remarketing ad campaigns.

### 6. Fault Isolation & Privacy (`utils/analytics.ts`)
* All analytics functions must be wrapped in `try { ... } catch { }`. Analytics failures must **never** break cart addition, checkout, or page rendering.
* **NEVER send Personally Identifiable Information (PII)** (name, phone, address, comments) to Google Analytics or GTM.

### 7. Backend Promo Code Discount Handling (`routers/orders.py`)
* The backend validates promo codes, but **MUST NOT apply the discount percentage/amount a second time** if `totalUSD` is already provided by the frontend (`totalUSD > 0`).

---

## 🧪 Verification & Pre-Push Checklist

Before pushing changes to the repository, run the following verification checks:

```bash
# 1. Type check storefront:
cd tesla-parts-shop && npx tsc --noEmit

# 2. Build storefront bundle:
npm run build

# 3. Execute backend tests:
cd ../tesla-parts-backend && .venv/bin/pytest
```