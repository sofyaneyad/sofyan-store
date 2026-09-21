// Offline Configuration & Image Fallbacks
export const PRODUCTS_CACHE_KEY = 'sofyan_cached_products_v7';
export const LAST_SYNC_KEY = 'sofyan_products_last_sync';

// Clean SVG placeholder icon for products when offline or when image fails to load
export const FALLBACK_PRODUCT_IMAGE = 
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><rect width='18' height='18' x='3' y='3' rx='3' fill='%23f1f5f9'/><path d='m3 16 5-5c.9-.9 2.3-.9 3.2 0l7 7'/><path d='m14 14 1-1c.9-.9 2.3-.9 3.2 0l3 3'/><circle cx='8.5' cy='8.5' r='1.5' fill='%2394a3b8'/></svg>";

export const isClientOnline = () => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
};
