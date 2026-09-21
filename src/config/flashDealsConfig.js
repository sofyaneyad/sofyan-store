// Flash Deals Persistent 3-Day Cycle Configuration
export const CYCLE_STORAGE_KEY = 'sofyan_flash_deals_cycle_v6';
export const EXPIRY_STORAGE_KEY = 'sofyan_flash_deals_expiry_v6';
export const STOCK_STORAGE_KEY = 'sofyan_flash_deals_stock_v6';

export const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // Exactly 72 hours (3 days)
// Minimum price required for a product to be eligible for discounts or flash deals
export const MIN_DISCOUNT_PRICE_THRESHOLD = 40;
export const DEFAULT_INITIAL_STOCKS = [5, 4, 6, 5];
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

/**
 * Reads persistent 3-day cycle and expiry from localStorage.
 * Ensures the 3-day countdown NEVER restarts on page load or refresh.
 * Only increments cycle and resets stocks when the 3 full days have literally passed in real time.
 */
export const getStoredFlashDealsState = () => {
  const now = Date.now();
  let cycle = 0;
  let expiry = 0;
  let stocks = {};

  try {
    const savedCycle = localStorage.getItem(CYCLE_STORAGE_KEY);
    if (savedCycle !== null) {
      const parsedCycle = parseInt(savedCycle, 10);
      if (!isNaN(parsedCycle)) cycle = parsedCycle;
    }

    const savedExpiry = localStorage.getItem(EXPIRY_STORAGE_KEY);
    if (savedExpiry !== null) {
      const parsedExpiry = parseInt(savedExpiry, 10);
      if (!isNaN(parsedExpiry)) expiry = parsedExpiry;
    }

    const savedStocks = localStorage.getItem(STOCK_STORAGE_KEY);
    if (savedStocks) {
      stocks = JSON.parse(savedStocks) || {};
    }
  } catch (err) {
    console.error("Error reading flash deals state from localStorage:", err);
  }

  // 1. First-time initialization: Set expiry to exactly now + 3 days and persist it
  if (!expiry) {
    expiry = now + THREE_DAYS_MS;
    try {
      localStorage.setItem(CYCLE_STORAGE_KEY, String(cycle));
      localStorage.setItem(EXPIRY_STORAGE_KEY, String(expiry));
      localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stocks));
    } catch {
      // ignore
    }
  } else if (now >= expiry) {
    // 2. The 3 full days have ACTUALLY elapsed in real time:
    const cyclesPassed = Math.max(1, Math.floor((now - expiry) / THREE_DAYS_MS) + 1);
    cycle += cyclesPassed;
    // Anchor new expiry cleanly to the previous schedule
    expiry = expiry + (cyclesPassed * THREE_DAYS_MS);
    if (expiry <= now) {
      expiry = now + THREE_DAYS_MS;
    }
    stocks = {}; // Reset deal stocks for the fresh 3-day cycle
    try {
      localStorage.setItem(CYCLE_STORAGE_KEY, String(cycle));
      localStorage.setItem(EXPIRY_STORAGE_KEY, String(expiry));
      localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(stocks));
    } catch {
      // ignore
    }
  }
  // 3. Otherwise (now < expiry): DO NOT TOUCH EXPIRY! The countdown continues exactly as scheduled.

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
