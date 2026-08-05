import { CartItem, OrderData } from '../types';

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

const SENT_ORDERS_KEY = 'tp-sent-orders';
const CURRENCY = 'UAH';

// Price of a single item in UAH, using the same rate the buyer saw on the page.
const itemPriceUAH = (item: CartItem, rate: number): number => {
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
