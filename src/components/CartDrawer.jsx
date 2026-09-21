import { useState, useEffect, useMemo, useCallback } from 'react';
import { ShoppingBag, X, Trash2, Tag, Plus, Minus, AlertCircle, Lock, MapPin, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatPrice } from '../config/currencies';
import { COUPONS, getUsedCoupons, markCouponAsUsed, isCouponUsed } from '../config/coupons';
import { FALLBACK_PRODUCT_IMAGE } from '../config/offlineConfig';
import { getStoredFlashDealsState, getFlashDealProductIds } from '../config/flashDealsConfig';
import { getSavedGazaArea, saveGazaArea } from '../config/gazaDeliveryAreas';
import GazaDeliveryModal from './GazaDeliveryModal';
import StripePaymentModal from './StripePaymentModal';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

function CartItemQuantityControl({ item, updateCartQuantity, setCartItemQuantity, darkMode, isRtl, t }) {
  const [localVal, setLocalVal] = useState(String(item.quantity));

  useEffect(() => {
    setLocalVal(String(item.quantity));
  }, [item.quantity]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setLocalVal(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= 100) {
      if (setCartItemQuantity) setCartItemQuantity(item.id, num);
    }
  };

  const handleBlur = () => {
    const num = parseInt(localVal, 10);
    if (isNaN(num) || num < 1) {
      setLocalVal('1');
      if (setCartItemQuantity) setCartItemQuantity(item.id, 1);
    } else if (num > 100) {
      setLocalVal('100');
      if (setCartItemQuantity) setCartItemQuantity(item.id, 100);
    } else {
      setLocalVal(String(num));
      if (setCartItemQuantity) setCartItemQuantity(item.id, num);
    }
  };

  return (
    <div className="flex items-center gap-2 mt-1.5">
      <div className={`flex items-center rounded-xl border ${
        darkMode 
          ? 'bg-zinc-800/60 border-zinc-700/60 text-zinc-300' 
          : 'bg-slate-50 border-slate-200/70 text-slate-700'
      }`}>
        <button
          type="button"
          onClick={() => updateCartQuantity && updateCartQuantity(item.id, -1)}
          disabled={item.quantity <= 1}
          className="px-2 py-1 disabled:opacity-30 hover:text-blue-600 transition-colors cursor-pointer disabled:cursor-not-allowed"
          title={isRtl ? 'تقليل الكمية' : 'Decrease quantity'}
        >
          <Minus className="w-3 h-3" />
        </button>
        
        <input
          type="number"
          min={1}
          max={100}
          value={localVal}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.target.blur();
          }}
          className="w-10 text-center text-xs font-bold font-mono bg-transparent outline-none py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          title={isRtl ? 'اكتب الكمية (الحد الأقصى 100)' : 'Quantity (Max 100)'}
        />

        <button
          type="button"
          onClick={() => updateCartQuantity && updateCartQuantity(item.id, 1)}
          disabled={item.quantity >= 100}
          className="px-2 py-1 hover:text-blue-600 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
          title={isRtl ? 'زيادة الكمية (الحد الأقصى 100)' : 'Increase quantity (Max 100)'}
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      
      {item.quantity >= 100 && (
        <span className="text-[10px] text-amber-500 font-bold">
          {t?.cart?.maxLimit || (isRtl ? 'الحد الأقصى' : 'Max')}
        </span>
      )}
    </div>
  );
}

export default function CartDrawer({ 
  isOpen, 
  setIsOpen, 
  user, 
  cart, 
  products = [], 
  totalCartItems, 
  removeFromCart, 
  updateCartQuantity,
  setCartItemQuantity,
  clearCart, 
  setIsAuthModalOpen, 
  darkMode, 
  onCheckout,
  appliedCoupon: parentAppliedCoupon,
  setAppliedCoupon: parentSetAppliedCoupon,
  language = 'ar',
  t
}) {
  const isRtl = language === 'ar';
  const [localCouponInput, setCouponInput] = useState('');
  const [localAppliedCoupon, setLocalAppliedCoupon] = useState(null);
  const [usedCoupons, setUsedCoupons] = useState(() => getUsedCoupons());
  const [selectedGazaArea, setSelectedGazaArea] = useState(null);
  const [isGazaModalOpen, setIsGazaModalOpen] = useState(false);
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);

  // Lock body and html scroll when cart is open
  useBodyScrollLock(isOpen);

  // Clear any legacy saved delivery area on mount so it never pre-selects automatically
  useEffect(() => {
    saveGazaArea(null);
  }, []);

  // Reset selected area whenever cart is empty
  useEffect(() => {
    if (cart.length === 0 && selectedGazaArea) {
      setSelectedGazaArea(null);
      saveGazaArea(null);
    }
  }, [cart.length, selectedGazaArea]);

  const handleSelectGazaArea = (area) => {
    setSelectedGazaArea(area);
    saveGazaArea(area);
    if (area) {
      setIsGazaModalOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setUsedCoupons(getUsedCoupons());
    }
  }, [isOpen]);

  const appliedCoupon = parentAppliedCoupon !== undefined ? parentAppliedCoupon : localAppliedCoupon;
  const setAppliedCoupon = parentSetAppliedCoupon || setLocalAppliedCoupon;
  const couponInput = localCouponInput;

  const FREE_SHIPPING_THRESHOLD = 50;

  // Identify active flash deal product IDs from persistent state
  const activeDealIds = useMemo(() => {
    try {
      const dealsState = getStoredFlashDealsState();
      return getFlashDealProductIds(products || [], dealsState?.cycle || 0);
    } catch {
      return [];
    }
  }, [products]);

  const isItemDeal = useCallback((item) => {
    if (item?.isDealProduct) return true;
    return activeDealIds.includes(String(item?.id));
  }, [activeDealIds]);

  // Subtotals
  const safeCart = Array.isArray(cart) ? cart : [];
  
  // Total Subtotal (all products combined)
  const rawSubtotal = safeCart.reduce((sum, item) => sum + (Number(item?.price || 0) * Number(item?.quantity || 1)), 0);

  // Eligible Subtotal (strictly regular products - flash deals are excluded from coupon percentage discounts)
  const eligibleSubtotal = safeCart
    .filter(item => !isItemDeal(item))
    .reduce((sum, item) => sum + (Number(item?.price || 0) * Number(item?.quantity || 1)), 0);

  // Subtotal of flash deal products
  const dealSubtotal = safeCart
    .filter(item => isItemDeal(item))
    .reduce((sum, item) => sum + (Number(item?.price || 0) * Number(item?.quantity || 1)), 0);

  const hasDealItems = dealSubtotal > 0;
  const isOnlyDealItems = safeCart.length > 0 && eligibleSubtotal === 0;

  // Invalidate applied coupon if conditions are no longer met
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.percent > 0) {
      if (eligibleSubtotal === 0 || (appliedCoupon.minSubtotalUSD > 0 && eligibleSubtotal < appliedCoupon.minSubtotalUSD)) {
        setAppliedCoupon(null);
      }
    } else if (appliedCoupon && appliedCoupon.minSubtotalUSD > 0 && rawSubtotal < appliedCoupon.minSubtotalUSD) {
      setAppliedCoupon(null);
    }
  }, [rawSubtotal, eligibleSubtotal, appliedCoupon]);

  // Free shipping calculation (covers orders >= $50)
  const isFreeShipping = rawSubtotal >= FREE_SHIPPING_THRESHOLD || appliedCoupon?.isFreeShipping;
  // Shipping cost: only applied when user explicitly selects a Gaza area, otherwise 0
  const shippingCost = (cart.length > 0 && selectedGazaArea && !isFreeShipping) ? selectedGazaArea.priceUSD : 0;

  // Discount calculation
  let discountAmount = 0;
  if (appliedCoupon && appliedCoupon.percent > 0) {
    discountAmount = (rawSubtotal * appliedCoupon.percent) / 100;
  }

  // Final Total
  const finalTotal = Math.max(0, rawSubtotal - discountAmount + shippingCost);

  // Dynamic Available Coupon: 200+ unlocks SOFYAN20, 100+ unlocks SOFYAN10 (no FREE code)
  const availableCoupon = useMemo(() => {
    if (rawSubtotal >= 200) {
      return COUPONS['SOFYAN20'];
    }
    if (rawSubtotal >= 100) {
      return COUPONS['SOFYAN10'];
    }
    return null;
  }, [rawSubtotal]);

  const handleInternalCheckout = () => {
    if (!user) {
      toast.error(
        isRtl 
          ? 'يرجى تسجيل الدخول أو إنشاء حساب أولاً لإتمام عملية الشراء 🔒' 
          : 'Please sign in or create an account first to complete your purchase 🔒',
        {
          duration: 4000,
          style: {
            background: darkMode ? '#18181b' : '#fff',
            color: darkMode ? '#f4f4f5' : '#0f172a',
            border: darkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
            fontFamily: isRtl ? 'Cairo, sans-serif' : 'inherit',
            fontSize: '12px',
            fontWeight: 'bold',
          }
        }
      );
      if (setIsAuthModalOpen) {
        setIsAuthModalOpen(true);
      }
      return;
    }

    if (!selectedGazaArea) {
      toast.error(
        isRtl 
          ? 'يرجى تحديد منطقة التوصيل في قطاع غزة أولاً لإتمام عملية الشراء' 
          : 'Please select your delivery area first to complete your purchase',
        {
          duration: 4000,
          style: {
            background: darkMode ? '#18181b' : '#fff',
            color: darkMode ? '#f4f4f5' : '#0f172a',
            border: darkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
            fontFamily: isRtl ? 'Cairo, sans-serif' : 'inherit',
            fontSize: '12px',
            fontWeight: 'bold',
          }
        }
      );
      setIsGazaModalOpen(true);
      return;
    }

    // Open Stripe Payment Gateway Modal
    setIsStripeModalOpen(true);
  };

  const handlePaymentSuccess = (transactionDetails) => {
    if (appliedCoupon?.code) {
      markCouponAsUsed(appliedCoupon.code);
      setUsedCoupons(getUsedCoupons());
    }
    setCouponInput('');
    setSelectedGazaArea(null);
    saveGazaArea(null);
    setIsStripeModalOpen(false);
    setIsOpen(false);
    if (onCheckout) onCheckout(transactionDetails);
  };

  const handleApplyCoupon = (e) => {
    if (e) e.preventDefault();
    const cleanCode = couponInput.trim().toUpperCase();

    if (!cleanCode) {
      toast.error(isRtl ? 'يرجى إدخال رمز كود الخصم' : 'Please enter a promo code');
      return;
    }

    const coupon = COUPONS[cleanCode];
    if (coupon) {
      if (coupon.minSubtotalUSD > 0 && rawSubtotal < coupon.minSubtotalUSD) {
        const remaining = coupon.minSubtotalUSD - rawSubtotal;
        toast.error(
          isRtl 
            ? `كود ${coupon.code} يتطلب مشتريات بقيمة ${formatPrice(coupon.minSubtotalUSD)} فأكثر (متبقي ${formatPrice(remaining)})`
            : `Code ${coupon.code} requires ${formatPrice(coupon.minSubtotalUSD)} or more (${formatPrice(remaining)} remaining)`,
          {
            duration: 3500,
            style: {
              background: darkMode ? '#18181b' : '#fff',
              color: darkMode ? '#f4f4f5' : '#0f172a',
              border: darkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
              fontFamily: isRtl ? 'Cairo, sans-serif' : 'inherit',
              fontSize: '12px',
              fontWeight: 'bold',
            }
          }
        );
        return;
      }

      setAppliedCoupon(coupon);
      toast.success(
        isRtl ? `تم تطبيق ${coupon.label} بنجاح` : `Promo code ${coupon.code} applied successfully`,
        {
          duration: 3000,
          style: {
            background: darkMode ? '#18181b' : '#fff',
            color: darkMode ? '#f4f4f5' : '#0f172a',
            border: darkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
            fontFamily: isRtl ? 'Cairo, sans-serif' : 'inherit',
            fontSize: '12px',
            fontWeight: 'bold',
          }
        }
      );
    } else {
      toast.error(
        isRtl ? 'رمز كود الخصم غير صالح' : 'Invalid promo code',
        {
          duration: 3000,
          style: {
            background: darkMode ? '#18181b' : '#fff',
            color: darkMode ? '#f4f4f5' : '#0f172a',
            border: darkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
            fontFamily: isRtl ? 'Cairo, sans-serif' : 'inherit',
            fontSize: '12px',
            fontWeight: 'bold',
          }
        }
      );
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, setIsOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 overflow-y-auto overscroll-contain" 
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Backdrop with soft blur */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={() => setIsOpen(false)} 
        onWheel={(e) => e.stopPropagation()}
      />

      {/* Centered Cart Container */}
      <div className={`relative w-full max-w-lg max-h-[88vh] rounded-3xl border shadow-xl flex flex-col overflow-hidden z-10 transition-all duration-300 ${
        darkMode 
          ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
          : 'bg-white border-slate-200/80 text-slate-800'
      }`}>
          
        {/* Header Bar */}
        <div className={`px-6 py-4 border-b flex justify-between items-center shrink-0 ${
          darkMode ? 'border-zinc-800/80' : 'border-slate-100'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'
            }`}>
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black">{t?.cart?.title || 'سلة التسوق'}</h2>
              <p className="text-[11px] text-zinc-400">
                {totalCartItems === 0 
                  ? (isRtl ? 'لا توجد منتجات' : 'No items yet')
                  : `${totalCartItems} ${t?.cart?.itemCount || (isRtl ? 'منتج في سلتك' : 'items in your cart')}`
                }
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={() => setIsOpen(false)} 
            className={`p-2 rounded-xl cursor-pointer transition-colors ${
              darkMode 
                ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' 
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title={isRtl ? 'إغلاق السلة' : 'Close cart'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-2 divide-y divide-slate-100 dark:divide-zinc-800/60">
          {cart.length === 0 ? (
            <div className="text-center py-20 text-zinc-400 space-y-2">
              <ShoppingBag className="w-10 h-10 mx-auto stroke-1 text-zinc-300 dark:text-zinc-600" />
              <p className="text-xs font-bold">{t?.cart?.emptyTitle || 'سلة التسوق فارغة حالياً'}</p>
              <p className="text-[11px] text-zinc-400">{t?.cart?.emptySubtitle || 'أضف بعض المنتجات لتبدأ التسوق'}</p>
            </div>
          ) : (
            cart.map(item => (
              <div 
                key={item.id} 
                className="py-3.5 flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {/* Item Image with soft background */}
                  <div className={`w-14 h-14 rounded-2xl p-1.5 flex items-center justify-center shrink-0 border ${
                    darkMode ? 'bg-zinc-800/50 border-zinc-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <img 
                      src={item.image} 
                      alt={item.name} 
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_PRODUCT_IMAGE) {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                        }
                      }}
                      className="w-full h-full object-contain" 
                    />
                  </div>

                  {/* Title & Price */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="font-bold text-xs truncate leading-snug">
                        {item.name}
                      </h4>
                      {isItemDeal(item) && (
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border shrink-0 ${
                          darkMode 
                            ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60' 
                            : 'bg-amber-50 text-amber-900 border-amber-200/80'
                        }`}>
                          {isRtl ? 'عرض مؤقت' : 'Flash Deal'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-400 font-semibold mt-0.5">
                      {formatPrice(item.price)} {t?.cart?.perPiece || (isRtl ? 'لكل قطعة' : 'per item')}
                    </p>

                    {/* Quantity Pill - Editable Input between + and - */}
                    <CartItemQuantityControl
                      item={item}
                      updateCartQuantity={updateCartQuantity}
                      setCartItemQuantity={setCartItemQuantity}
                      darkMode={darkMode}
                      isRtl={isRtl}
                      t={t}
                    />
                  </div>
                </div>

                {/* Subtotal and Delete */}
                <div className={`flex flex-col ${isRtl ? 'items-end' : 'items-start'} justify-between h-14 shrink-0`}>
                  <button 
                    type="button"
                    onClick={() => {
                      if (cart.length <= 1) {
                        setSelectedGazaArea(null);
                        saveGazaArea(null);
                        setIsOpen(false);
                      }
                      if (removeFromCart) removeFromCart(item.id);
                    }} 
                    className="text-zinc-400 hover:text-rose-500 p-1 cursor-pointer transition-colors" 
                    title={t?.cart?.deleteItem || 'حذف'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <span className={`font-black text-xs font-mono ${darkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                    {formatPrice(Number(item.price) * Number(item.quantity))}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary & Actions */}
        {cart.length > 0 && (
          <div className={`px-6 py-5 border-t space-y-3.5 shrink-0 ${
            darkMode ? 'border-zinc-800/80 bg-zinc-950/40' : 'border-slate-100 bg-slate-50/50'
          }`}>
            
            {/* Coupon Code Section */}
            <div>
              {appliedCoupon ? (
                <div className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                  darkMode 
                    ? 'bg-zinc-800/70 border-zinc-700/80 text-zinc-200' 
                    : 'bg-slate-100/90 border-slate-200 text-slate-800'
                }`}>
                  <div className="flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5 text-zinc-400" />
                    <span className="font-semibold">
                      {t?.cart?.codeActive || 'كود مفعّل:'} <strong className="font-mono">{appliedCoupon.code}</strong> ({isRtl ? appliedCoupon.label : (appliedCoupon.percent ? `${appliedCoupon.percent}% OFF` : 'Free Shipping')})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className={`p-1 rounded-lg transition-colors cursor-pointer ${
                      darkMode 
                        ? 'hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200' 
                        : 'hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                    }`}
                    title={t?.cart?.removeCoupon || 'إلغاء الكود'}
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div>
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      placeholder={t?.cart?.couponInputPlaceholder || 'كود الخصم (مثل SOFYAN10)'}
                      className={`flex-1 h-9 px-3 text-xs rounded-xl border font-bold uppercase transition-colors outline-none ${
                        darkMode 
                          ? 'bg-zinc-800/60 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500' 
                          : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-slate-400 shadow-2xs'
                      }`}
                    />
                    <button
                      type="submit"
                      className={`px-4 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        darkMode 
                          ? 'bg-zinc-100 hover:bg-white text-zinc-900 shadow-xs' 
                          : 'bg-slate-900 hover:bg-black text-white shadow-xs'
                      }`}
                    >
                      {t?.cart?.applyCoupon || (isRtl ? 'تطبيق' : 'Apply')}
                    </button>
                  </form>

                  {/* Coupon Visibility: Hidden under $100, appears at $100+ (10%) and $200+ (20%) */}
                  {rawSubtotal >= 100 ? (
                    <div className="space-y-1.5 mt-2.5 text-[11px]">
                      <div className="flex items-center justify-between gap-1 text-zinc-400">
                        <span className="font-medium">{isRtl ? 'كود متاح:' : 'Available Code:'}</span>
                        {rawSubtotal >= 200 ? (
                          <button
                            type="button"
                            onClick={() => {
                              setCouponInput('SOFYAN20');
                              setAppliedCoupon(COUPONS['SOFYAN20']);
                              toast.success('تم تفعيل كود الخصم 20% (SOFYAN20) بنجاح');
                            }}
                            className={`font-bold underline underline-offset-2 cursor-pointer transition-colors ${
                              darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                            }`}
                          >
                            SOFYAN20 ({isRtl ? 'خصم 20% متاح الآن' : '20% OFF available now'})
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setCouponInput('SOFYAN10');
                              setAppliedCoupon(COUPONS['SOFYAN10']);
                              toast.success('تم تفعيل كود الخصم 10% (SOFYAN10) بنجاح');
                            }}
                            className={`font-bold underline underline-offset-2 cursor-pointer transition-colors ${
                              darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                            }`}
                          >
                            SOFYAN10 ({isRtl ? 'خصم 10% متاح الآن' : '10% OFF available now'})
                          </button>
                        )}
                      </div>

                      {rawSubtotal < 200 && (
                        <p className={`text-[10.5px] font-medium p-2 rounded-xl border leading-relaxed ${
                          darkMode ? 'bg-zinc-800/50 border-zinc-700/60 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          {isRtl 
                            ? `أضف منتجات بقيمة ${formatPrice(200 - rawSubtotal)} لفتح كود خصم 20% (SOFYAN20)` 
                            : `Add ${formatPrice(200 - rawSubtotal)} of items to unlock 20% off (SOFYAN20)`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 text-[11px]">
                      <p className={`text-[10.5px] font-medium p-2 rounded-xl border leading-relaxed ${
                        darkMode ? 'bg-zinc-800/50 border-zinc-700/60 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        {isRtl 
                          ? `أضف منتجات بقيمة ${formatPrice(100 - rawSubtotal)} لفتح كود خصم 10%` 
                          : `Add ${formatPrice(100 - rawSubtotal)} of items to unlock 10% off`}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Gaza Delivery Areas & Pricing Button - only shown when area is NOT yet selected */}
            {!selectedGazaArea && (
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => setIsGazaModalOpen(true)}
                  className={`w-full p-3 rounded-2xl border text-xs font-bold transition-all duration-200 flex items-center justify-between group cursor-pointer active:scale-[0.99] ${
                    darkMode
                      ? 'bg-zinc-800/90 hover:bg-zinc-700/90 border-zinc-700 text-zinc-100 hover:border-zinc-600 shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-900 hover:border-slate-300 shadow-2xs'
                  }`}
                  title="تحديد منطقة التوصيل في قطاع غزة"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      darkMode 
                        ? 'bg-blue-600/20 text-blue-400 group-hover:bg-blue-600/30' 
                        : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'
                    }`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    
                    <div className="text-right min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-extrabold text-xs truncate">
                          تحديد منطقة التوصيل في غزة
                        </span>
                        <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded-md ${
                          darkMode ? 'bg-zinc-700/70 text-zinc-300' : 'bg-white text-slate-600 border border-slate-200'
                        }`}>
                          اختر منطقتك
                        </span>
                      </div>

                      <p className="text-[10px] text-zinc-400 font-normal truncate mt-0.5">
                        اضغط لاختيار منطقتك لحساب سعر التوصيل الدقيق
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <span className={`text-[11px] font-bold hidden sm:inline transition-colors ${
                      darkMode ? 'text-zinc-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-900'
                    }`}>
                      اختيار
                    </span>
                    <ChevronLeft className={`w-4 h-4 transition-transform group-hover:-translate-x-0.5 ${
                      darkMode ? 'text-zinc-400 group-hover:text-white' : 'text-slate-400 group-hover:text-slate-900'
                    }`} />
                  </div>
                </button>
              </div>
            )}

            {/* Price Calculation Breakdown */}
            <div className="space-y-1.5 text-xs pt-1">
              <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400">
                <span>{t?.cart?.subtotal || (isRtl ? 'المجموع الفرعي' : 'Subtotal')}</span>
                <span className="font-semibold font-mono">{formatPrice(rawSubtotal)}</span>
              </div>

              {appliedCoupon && discountAmount > 0 && (
                <div className={`flex justify-between items-center font-semibold ${
                  darkMode ? 'text-emerald-400' : 'text-amber-800'
                }`}>
                  <div className="flex items-center gap-1">
                    <span>{t?.cart?.discount || (isRtl ? 'الخصم' : 'Discount')} ({appliedCoupon.code})</span>
                  </div>
                  <span className="font-mono">-{formatPrice(discountAmount)}</span>
                </div>
              )}

              {/* Shipping & Delivery Row: only shown after user selects their region */}
              {selectedGazaArea && (
                <div className="flex justify-between items-center text-zinc-500 dark:text-zinc-400 animate-fadeIn">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>{t?.cart?.shipping || (isRtl ? 'الشحن والتوصيل' : 'Shipping')}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                      darkMode ? 'bg-zinc-800 text-blue-400 border border-zinc-700' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      ({selectedGazaArea.name.split('-')[1]?.trim() || selectedGazaArea.name})
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsGazaModalOpen(true)}
                      className={`text-[10px] underline underline-offset-2 cursor-pointer font-bold transition-colors ${
                        darkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-400 hover:text-slate-900'
                      }`}
                      title="تغيير منطقة التوصيل"
                    >
                      (تغيير)
                    </button>
                  </div>
                  <span className={`font-semibold ${isFreeShipping ? 'text-blue-600 dark:text-blue-400 font-bold' : 'font-mono'}`}>
                    {isFreeShipping 
                      ? (t?.cart?.free || (isRtl ? 'مجاني' : 'Free')) 
                      : formatPrice(shippingCost)
                    }
                  </span>
                </div>
              )}

              <div className={`flex justify-between items-center pt-2.5 border-t text-sm font-black ${
                darkMode ? 'border-zinc-800 text-white' : 'border-slate-200 text-slate-900'
              }`}>
                <span>{t?.cart?.finalTotal || (isRtl ? 'الإجمالي النهائي' : 'Total')}</span>
                <span className="text-base font-black font-mono">
                  {formatPrice(finalTotal)}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-1 space-y-2">
              <button 
                type="button"
                onClick={handleInternalCheckout} 
                className={`w-full py-3.5 rounded-2xl text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-2 ${
                  darkMode 
                    ? 'bg-white hover:bg-zinc-200 text-zinc-950' 
                    : 'bg-slate-900 hover:bg-black text-white'
                }`}
              >
                {!user ? (
                  <>
                    <Lock className="w-4 h-4 shrink-0" />
                    <span>
                      {isRtl ? 'تسجيل الدخول لإتمام الشراء' : 'Login to Complete Purchase'} ({formatPrice(finalTotal)})
                    </span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>
                      {t?.cart?.checkout || (isRtl ? 'إتمام الشراء الآن' : 'Checkout Now')} ({formatPrice(finalTotal)})
                    </span>
                  </>
                )}
              </button>

              <button 
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (setAppliedCoupon) setAppliedCoupon(null);
                  setCouponInput('');
                  setSelectedGazaArea(null);
                  saveGazaArea(null);
                  if (clearCart) clearCart();
                }} 
                className="w-full py-1 text-xs text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" />
                <span>{t?.cart?.clearCart || (isRtl ? 'تفريغ السلة بالكامل' : 'Clear entire cart')}</span>
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Gaza Delivery Areas & Pricing Modal */}
      <GazaDeliveryModal
        isOpen={isGazaModalOpen}
        onClose={() => setIsGazaModalOpen(false)}
        selectedArea={selectedGazaArea}
        onSelectArea={handleSelectGazaArea}
        darkMode={darkMode}
        isRtl={isRtl}
        isFreeShipping={isFreeShipping}
        rawSubtotal={rawSubtotal}
      />

      {/* Stripe Payment Gateway Modal */}
      <StripePaymentModal
        isOpen={isStripeModalOpen}
        onClose={() => setIsStripeModalOpen(false)}
        finalTotal={finalTotal}
        rawSubtotal={rawSubtotal}
        shippingCost={shippingCost}
        discountAmount={discountAmount}
        appliedCoupon={appliedCoupon}
        selectedArea={selectedGazaArea}
        totalItems={totalCartItems}
        onPaymentSuccess={handlePaymentSuccess}
        darkMode={darkMode}
        isRtl={isRtl}
        user={user}
      />
    </div>
  );
}