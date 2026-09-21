export const COUPONS = {
  'FREE': { 
    code: 'FREE', 
    percent: 0, 
    isFreeShipping: true, 
    label: 'شحن مجاني',
    minSubtotalUSD: 50,
    description: 'للطلبات بقيمة 50$ فأكثر'
  },
  'SOFYAN10': { 
    code: 'SOFYAN10', 
    percent: 10, 
    label: 'خصم 10%', 
    minSubtotalUSD: 100,
    description: 'للطلبات بقيمة 100$ فأكثر'
  },
  'SOFYAN20': { 
    code: 'SOFYAN20', 
    percent: 20, 
    label: 'خصم 20%', 
    minSubtotalUSD: 200,
    description: 'للطلبات بقيمة 200$ فأكثر'
  }
};

export const USED_COUPONS_STORAGE_KEY = 'sofyan_used_coupons_v1';

export const getUsedCoupons = () => [];

export const markCouponAsUsed = () => {};

export const isCouponUsed = () => false;

export const resetUsedCoupons = () => {
  try {
    localStorage.removeItem(USED_COUPONS_STORAGE_KEY);
  } catch {
    // ignore
  }
};

// Immediately clean up any previous burned coupon keys from localStorage
try {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USED_COUPONS_STORAGE_KEY);
  }
} catch {
  // ignore
}
