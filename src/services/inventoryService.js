import { ref, onValue, update } from 'firebase/database';
import { rtdb } from '../config/firebase';

const INVENTORY_REF_PATH = 'store_live_inventory';

/**
 * Subscribes to real-time inventory stock changes from Firebase Realtime Database.
 * Synchronizes stock across Localhost, Vercel, and all devices in real time via WebSockets.
 */
export const subscribeToInventory = (onUpdate) => {
  try {
    const stockRef = ref(rtdb, INVENTORY_REF_PATH);
    const unsubscribe = onValue(
      stockRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data && typeof onUpdate === 'function') {
          onUpdate(data);
        }
      },
      (error) => {
        console.warn('Real-time inventory listener error:', error.message);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.warn('Inventory subscribe error:', err);
    return () => {};
  }
};

/**
 * Atomically updates a single product's exact stock in Firebase Realtime Database.
 * Instantly broadcasts to Localhost, Vercel, and all connected browsers.
 */
export const syncStockToCloud = async (productId, exactStock) => {
  if (productId === undefined || productId === null) return;
  try {
    const safeStock = Math.max(0, Number(exactStock) || 0);
    const stockRef = ref(rtdb, INVENTORY_REF_PATH);
    await update(stockRef, {
      [String(productId)]: safeStock
    });
  } catch (err) {
    console.warn('Failed to sync stock to Realtime Database:', err.message);
  }
};

/**
 * Atomically updates multiple products' exact stocks in Firebase Realtime Database in a single operation.
 */
export const syncMultipleStocksToCloud = async (stocksMap) => {
  if (!stocksMap || typeof stocksMap !== 'object') return;
  try {
    const updates = {};
    Object.entries(stocksMap).forEach(([id, stock]) => {
      updates[String(id)] = Math.max(0, Number(stock) || 0);
    });
    if (Object.keys(updates).length === 0) return;
    const stockRef = ref(rtdb, INVENTORY_REF_PATH);
    await update(stockRef, updates);
  } catch (err) {
    console.warn('Failed to sync multiple stocks to Realtime Database:', err.message);
  }
};

// Legacy compatibility wrappers
export const deductStockInCloud = async (items) => {
  if (!Array.isArray(items) || items.length === 0) return;
  const updates = {};
  items.forEach(it => {
    if (typeof it.nextStock === 'number') {
      updates[String(it.id)] = it.nextStock;
    }
  });
  if (Object.keys(updates).length > 0) {
    await syncMultipleStocksToCloud(updates);
  }
};

export const restoreStockInCloud = async (items) => {
  if (!Array.isArray(items) || items.length === 0) return;
  const updates = {};
  items.forEach(it => {
    if (typeof it.restoredStock === 'number') {
      updates[String(it.id)] = it.restoredStock;
    }
  });
  if (Object.keys(updates).length > 0) {
    await syncMultipleStocksToCloud(updates);
  }
};
