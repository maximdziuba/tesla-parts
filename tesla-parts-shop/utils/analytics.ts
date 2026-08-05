import { OrderData, Product } from '../types';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const SENT_ORDERS_KEY = 'tp-sent-orders';
const CURRENCY = 'UAH';
const VIEW_REPEAT_MS = 1000;

// Price of a single item in UAH, using the same rate the buyer saw on the page.
// Takes Product, so CartItem (which extends it) fits here as well.
const itemPriceUAH = (item: Product, rate: number): number => {
  const priceUSD =
    item.priceUSD && item.priceUSD > 0
      ? item.priceUSD
      : item.priceUAH && item.priceUAH > 0 && rate > 0
        ? item.priceUAH / rate
        : 0;
  return Math.round(priceUSD * rate * 100) / 100;
};

// Guards against a duplicate purchase event if the order is submitted twice.
const alreadySent = (transactionId: string): boolean => {
  try {
    const stored = sessionStorage.getItem(SENT_ORDERS_KEY);
    const sent: string[] = stored ? JSON.parse(stored) : [];
    if (sent.includes(transactionId)) return true;
    sessionStorage.setItem(
      SENT_ORDERS_KEY,
      JSON.stringify([...sent.slice(-19), transactionId])
    );
    return false;
  } catch {
    return false;
  }
};

// One item in GA4 format. item_id must stay equal to g:id in the Merchant
// Center feed, otherwise Google Ads cannot match the product in dynamic ads.
const gaItem = (product: Product, rate: number, quantity: number) => ({
  item_id: product.id,
  item_name: product.name,
  item_category: product.category?.split(',')[0].trim(),
  price: itemPriceUAH(product, rate),
  quantity,
});

const pushEvent = (event: string, ecommerce: Record<string, unknown>): void => {
  window.dataLayer = window.dataLayer || [];
  // Clear the previous ecommerce object, as recommended by Google.
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({ event, ecommerce });
};

// Swallows a view_item repeated within a second: that is an instant re-mount
// of the product page, not a second visit. A later revisit is a real view
// and is reported again, as GA4 expects.
let lastView = { id: '', at: 0 };
const isInstantRepeat = (id: string): boolean => {
  const now = Date.now();
  if (lastView.id === id && now - lastView.at < VIEW_REPEAT_MS) return true;
  lastView = { id, at: now };
  return false;
};

/**
 * Product page view. Feeds the "viewed but did not buy" remarketing audience.
 *
 * There is no error boundary in this app, so a throw inside an effect would
 * blank the whole page — hence the try/catch around everything.
 */
export const trackViewItem = (product: Product, rate: number): void => {
  try {
    if (!product?.id || isInstantRepeat(product.id)) return;
    pushEvent('view_item', {
      currency: CURRENCY,
      value: itemPriceUAH(product, rate),
      items: [gaItem(product, rate, 1)],
    });
  } catch {
    // Analytics must not affect the page.
  }
};

/**
 * Add to cart. Feeds the "added but did not order" remarketing audience.
 *
 * Must be called from the click handler and never from inside a setState
 * updater: React is allowed to run an updater callback more than once.
 * The site always adds one unit per click, hence quantity 1.
 */
export const trackAddToCart = (product: Product, rate: number): void => {
  try {
    if (!product?.id) return;
    pushEvent('add_to_cart', {
      currency: CURRENCY,
      value: itemPriceUAH(product, rate),
      items: [gaItem(product, rate, 1)],
    });
  } catch {
    // Analytics must not affect the cart.
  }
};

/**
 * Pushes a GA4 purchase event to the dataLayer for GTM.
 *
 * Customer name, phone, note and delivery address are intentionally omitted:
 * sending personal data to Google Analytics is against its terms of service.
 *
 * Any failure here is swallowed — analytics must never break checkout.
 */
export const trackPurchase = (
  created: { id?: number | string } | null | undefined,
  order: OrderData,
  rate: number
): void => {
  try {
    const transactionId = created?.id != null ? String(created.id) : '';
    if (!transactionId || alreadySent(transactionId)) return;

    window.dataLayer = window.dataLayer || [];
    // Clear the previous ecommerce object, as recommended by Google.
    window.dataLayer.push({ ecommerce: null });
    window.dataLayer.push({
      event: 'purchase',
      ecommerce: {
        transaction_id: transactionId,
        value: Math.round(order.totalUSD * rate * 100) / 100,
        currency: CURRENCY,
        coupon: order.promocode,
        payment_type: order.paymentMethod,
        items: order.items.map((item, index) => ({
          item_id: item.id,
          item_name: item.name,
          item_category: item.category?.split(',')[0].trim(),
          price: itemPriceUAH(item, rate),
          quantity: item.quantity,
          index,
        })),
      },
    });
  } catch {
    // Analytics must not affect the order flow.
  }
};
