import { Product, Order } from '../types';

export const META_PIXEL_ID = '1173348358983901';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

function safeFbq(...args: any[]): void {
  try {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq(...args);
    }
  } catch {
    // Ignore adblocker or runtime restrictions
  }
}

/**
 * Tracks virtual SPA PageView navigation events
 */
export function trackPageView(): void {
  safeFbq('track', 'PageView');
}

/**
 * Tracks ViewContent when a product detail modal is opened
 */
export function trackViewContent(product: Product): void {
  safeFbq('track', 'ViewContent', {
    content_ids: [product.id],
    content_name: product.name,
    content_category: product.category,
    content_type: 'product',
    value: product.priceDZD,
    currency: 'DZD',
  });
}

/**
 * Tracks AddToCart when a user adds a product to the shopping cart
 */
export function trackAddToCart(product: Product, quantity = 1): void {
  safeFbq('track', 'AddToCart', {
    content_ids: [product.id],
    content_name: product.name,
    content_category: product.category,
    content_type: 'product',
    value: product.priceDZD * quantity,
    currency: 'DZD',
    num_items: quantity,
  });
}

/**
 * Tracks InitiateCheckout when the user opens the checkout form
 */
export function trackInitiateCheckout(totalDZD: number, numItems: number, contentIds: string[]): void {
  safeFbq('track', 'InitiateCheckout', {
    content_ids: contentIds,
    content_type: 'product',
    value: totalDZD,
    currency: 'DZD',
    num_items: numItems,
  });
}

/**
 * Tracks Purchase and Lead when an order is confirmed and submitted
 */
export function trackPurchase(order: Order): void {
  const numItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const contentIds = order.items.map((item) => item.productId);
  const contentName = order.items.map((item) => item.name).join(', ');

  safeFbq('track', 'Purchase', {
    value: order.totalDZD,
    currency: 'DZD',
    content_ids: contentIds,
    content_name: contentName,
    content_type: 'product',
    num_items: numItems,
    order_id: order.id,
  });

  safeFbq('track', 'Lead', {
    value: order.totalDZD,
    currency: 'DZD',
    content_name: contentName,
    content_category: order.wilaya?.nameFr || 'Algeria',
  });
}

/**
 * Tracks Contact when clicking phone (tel:) or WhatsApp links/buttons
 */
export function trackContact(method: 'whatsapp' | 'phone' | 'email', detail?: string): void {
  safeFbq('track', 'Contact', {
    content_name: method,
    content_category: detail || 'Store Contact',
  });
}
