import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const INVENTORY_DOC_ID = 'live_inventory_v1';

/**
 * Subscribes to real-time inventory stock changes from Cloud Firestore.
 * Automatically synchronizes stock across Localhost, Vercel, and all devices.
 */
export const subscribeToInventory = (onUpdate) => {
  try {
    const docRef = doc(db, 'store_inventory', INVENTORY_DOC_ID);
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data && typeof onUpdate === 'function') {
          onUpdate(data);
        }
      }
    }, (error) => {
      // Silently handle cases where Firestore is not yet activated in Firebase console
      console.warn('Real-time inventory listener status:', error.message);
    });
    return unsubscribe;
  } catch (err) {
    console.warn('Inventory subscribe error:', err);
    return () => {};
  }
};

/**
 * Deducts purchased stock in Cloud Firestore upon completed order.
 * Broadcasts the updated stock to all active clients in real time.
 */
export const deductStockInCloud = async (purchasedItems) => {
  if (!Array.isArray(purchasedItems) || purchasedItems.length === 0) return;
  try {
    const docRef = doc(db, 'store_inventory', INVENTORY_DOC_ID);
    const snap = await getDoc(docRef);
    const currentData = snap.exists() ? snap.data() : {};
    
    const updates = { ...currentData };
    purchasedItems.forEach(item => {
      const id = String(item.id);
      const currentQty = typeof updates[id] === 'number' 
        ? updates[id] 
        : (typeof item.stock === 'number' ? item.stock : 25);
      updates[id] = Math.max(0, currentQty - (item.quantity || 1));
    });

    await setDoc(docRef, updates, { merge: true });
  } catch (err) {
    console.warn('Could not sync stock to Firestore (Firestore may need to be enabled in Firebase Console):', err.message);
  }
};

/**
 * Restores stock in Cloud Firestore if item is removed from cart.
 */
export const restoreStockInCloud = async (items) => {
  if (!Array.isArray(items) || items.length === 0) return;
  try {
    const docRef = doc(db, 'store_inventory', INVENTORY_DOC_ID);
    const snap = await getDoc(docRef);
    const currentData = snap.exists() ? snap.data() : {};
    
    const updates = { ...currentData };
    items.forEach(item => {
      const id = String(item.id);
      if (typeof updates[id] === 'number') {
        updates[id] = updates[id] + (item.quantity || 1);
      }
    });

    await setDoc(docRef, updates, { merge: true });
  } catch (err) {
    console.warn('Could not restore stock in Firestore:', err.message);
  }
};
