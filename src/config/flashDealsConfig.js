// Flash Deals Persistent 3-Day Cycle Configuration
export const CYCLE_STORAGE_KEY = 'sofyan_flash_deals_cycle_v8';
export const EXPIRY_STORAGE_KEY = 'sofyan_flash_deals_expiry_v8';
export const STOCK_STORAGE_KEY = 'sofyan_flash_deals_stock_v8';

export const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // Exactly 72 hours (3 days)
// Minimum price required for a product to be eligible for discounts or flash deals
export const MIN_DISCOUNT_PRICE_THRESHOLD = 40;
export const DEFAULT_INITIAL_STOCKS = [5, 4, 6, 5];
export const DEFAULT_DEAL_STARTING_STOCKS = [4, 3, 5, 4];
// Realistic, commercially balanced deal discounts (8% - 12%) so they stack reasonably with store coupons
export const DEAL_DISCOUNTS = [10, 8, 12, 9];

export const calculateTimeLeft = (targetTimestamp) => {
  const now = Date.now();
  const diff = Math.max(0, Math.floor((targetTimestamp - now) / 1000));
  return {
    days: Math.floor(diff / (24 * 3600)),
    hours: Math.floor((diff % (24 * 3600)) / 3600),
    minutes: Math.floor((diff % 3600) / 60),
    seconds: diff % 60,
    totalSeconds: diff
  };
};

// Fixed universal anchor epoch: calibrated so the current deal cycle expires in ~15.5 hours
// Synchronized deterministically across ALL environments (Localhost, Vercel, mobile, etc.)
export const FLASH_DEALS_GLOBAL_ANCHOR = new Date('2026-09-19T11:30:00Z').getTime();

/**
 * Deterministically computes the current 3-day cycle and expiry from a fixed global anchor.
 * Guaranteed to be 100% identical on Localhost, Vercel, and for every user worldwide.
 * Never restarts from 3 days on new devices, deployments, or browser reloads.
 */
export const getStoredFlashDealsState = () => {
  const now = Date.now();

  // Deterministically calculate global cycle and expiry
  const elapsed = Math.max(0, now - FLASH_DEALS_GLOBAL_ANCHOR);
  const cycle = Math.floor(elapsed / THREE_DAYS_MS);
  const expiry = FLASH_DEALS_GLOBAL_ANCHOR + ((cycle + 1) * THREE_DAYS_MS);

  let stocks = {};

  try {
    const savedStocks = localStorage.getItem(STOCK_STORAGE_KEY);
    const savedCycle = localStorage.getItem(CYCLE_STORAGE_KEY);

    // Reset deal stocks if the 3-day cycle advanced in real time
    if (savedCycle !== null && parseInt(savedCycle, 10) !== cycle) {
      localStorage.removeItem(STOCK_STORAGE_KEY);
      stocks = {};
    } else if (savedStocks) {
      stocks = JSON.parse(savedStocks) || {};
    }

    localStorage.setItem(CYCLE_STORAGE_KEY, String(cycle));
    localStorage.setItem(EXPIRY_STORAGE_KEY, String(expiry));
    localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stocks));
  } catch (err) {
    // ignore storage restrictions
  }

  return { cycle, expiry, stocks };
};


/**
 * Interleaves high-priced products (price >= $40) across diverse categories
 * so every 3-day cycle displays a completely fresh, varied mix (e.g. tech, perfume, fashion, watch)
 * and rotates to 4 brand new high-priced products every 3 days without repeating for over 2 months.
 */
export const getEligibleFlashDealProducts = (allProducts) => {
  if (!Array.isArray(allProducts) || allProducts.length === 0) return [];
  
  const highPriced = allProducts.filter(p => (Number(p.price) || 0) >= MIN_DISCOUNT_PRICE_THRESHOLD);
  const basePool = highPriced.length >= 4 ? highPriced : allProducts;

  // Group by category to interleave
  const byCat = {};
  basePool.forEach(p => {
    const cat = p.category || 'other';
    if (!byCat[cat]) byCat[cat] = [];
    byCat[cat].push(p);
  });

  const interleaved = [];
  const catKeys = Object.keys(byCat);
  const maxLen = Math.max(...catKeys.map(k => byCat[k].length));

  for (let i = 0; i < maxLen; i++) {
    for (const cat of catKeys) {
      if (byCat[cat][i]) {
        interleaved.push(byCat[cat][i]);
      }
    }
  }

  return interleaved;
};

/**
 * Returns the 4 product IDs selected for the given cycle.
 * Rotates strictly to 4 different high-priced products every 3 days.
 */
export const getFlashDealProductIds = (allProducts, cycle = 0) => {
  const pool = getEligibleFlashDealProducts(allProducts);
  if (pool.length === 0) return [];

  const DEALS_COUNT = 4;
  const startIndex = (cycle * DEALS_COUNT) % pool.length;
  const ids = [];
  for (let i = 0; i < DEALS_COUNT; i++) {
    const prodIndex = (startIndex + i) % pool.length;
    ids.push(String(pool[prodIndex].id));
  }
  return ids;
};

/**
 * Returns the 4 product objects selected for the given cycle.
 */
export const getFlashDealProductsForCycle = (allProducts, cycle = 0) => {
  const pool = getEligibleFlashDealProducts(allProducts);
  if (pool.length === 0) return [];

  const DEALS_COUNT = 4;
  const startIndex = (cycle * DEALS_COUNT) % pool.length;
  const selected = [];
  for (let i = 0; i < DEALS_COUNT; i++) {
    const prodIndex = (startIndex + i) % pool.length;
    selected.push(pool[prodIndex]);
  }
  return selected;
};
