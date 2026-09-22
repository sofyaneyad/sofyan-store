import { useState, useEffect, useMemo, useRef } from 'react';
import { Clock, Plus, Star, Check, AlertCircle } from 'lucide-react';
import { formatPrice } from '../config/currencies';
import { FALLBACK_PRODUCT_IMAGE } from '../config/offlineConfig';
import { 
  CYCLE_STORAGE_KEY, 
  EXPIRY_STORAGE_KEY, 
  STOCK_STORAGE_KEY, 
  THREE_DAYS_MS, 
  DEFAULT_INITIAL_STOCKS, 
  DEFAULT_DEAL_STARTING_STOCKS,
  DEAL_DISCOUNTS,
  MIN_DISCOUNT_PRICE_THRESHOLD,
  getStoredFlashDealsState, 
  calculateTimeLeft,
  getFlashDealProductsForCycle 
} from '../config/flashDealsConfig';
import toast from 'react-hot-toast';

const padZero = (n) => String(n).padStart(2, '0');

export default function FlashDealsSection({ 
  products = [], 
  handleAddToCart, 
  onViewDetails, 
  onCycleReset,
  darkMode,
  language = 'ar'
}) {
  const isRtl = language === 'ar';

  // Read persistent deals state synchronously from localStorage
  const [dealsState, setDealsState] = useState(() => getStoredFlashDealsState());
  const { cycle, expiry: expiryTimestamp } = dealsState;

  // Real-time countdown timer initialized to the exact remaining time
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(expiryTimestamp));
  const [justAddedIds, setJustAddedIds] = useState([]);

  const onCycleResetRef = useRef(onCycleReset);
  useEffect(() => {
    onCycleResetRef.current = onCycleReset;
  }, [onCycleReset]);

  // Keep a ref to latest expiry to use inside interval
  const expiryRef = useRef(expiryTimestamp);
  useEffect(() => {
    expiryRef.current = expiryTimestamp;
  }, [expiryTimestamp]);

  // 3-Day Countdown Timer & Automatic Renewal ONLY when 3 days actually finish
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const currentExpiry = expiryRef.current;

      if (now >= currentExpiry) {
        // Deterministically roll over to the next global cycle
        const freshState = getStoredFlashDealsState();
        expiryRef.current = freshState.expiry;

        setDealsState(freshState);
        setTimeLeft(calculateTimeLeft(freshState.expiry));

        if (onCycleResetRef.current) {
          onCycleResetRef.current(freshState.cycle);
        }
      } else {
        setTimeLeft(calculateTimeLeft(currentExpiry));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [dealsState.cycle]);

  // Compute 4 rotated products for current 3-day cycle (strictly high-priced products with diverse categories)
  const flashProducts = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];

    const selected = getFlashDealProductsForCycle(products, cycle);

    return selected.map((prod, index) => {
      const discountPercent = DEAL_DISCOUNTS[index % DEAL_DISCOUNTS.length];
      const originalPrice = prod.price ? Number((prod.price * (1 + discountPercent / 100)).toFixed(2)) : 0;
      const initialStock = DEFAULT_INITIAL_STOCKS[index % DEFAULT_INITIAL_STOCKS.length];
      const defaultStarting = DEFAULT_DEAL_STARTING_STOCKS[index % DEFAULT_DEAL_STARTING_STOCKS.length];
      
      const currentStock = prod.stock !== undefined ? prod.stock : defaultStarting;

      return {
        ...prod,
        originalPrice,
        discountPercent,
        initialStock,
        currentStock,
        isDealProduct: true
      };
    });
  }, [products, cycle]);

  const allSoldOut = flashProducts.length > 0 && flashProducts.every(p => p.currentStock <= 0);

  // Handle Add to Cart from deal
  const onAdd = (e, prod) => {
    e.stopPropagation();

    if (prod.currentStock <= 0) {
      toast.error(isRtl ? 'عذراً، نفدت كمية هذا العرض بالكامل!' : 'Sorry, this deal item is completely sold out!');
      return;
    }

    if (handleAddToCart) {
      handleAddToCart(prod, 1);
    }

    if (!justAddedIds.includes(prod.id)) {
      setJustAddedIds(prev => [...prev, prod.id]);
      setTimeout(() => {
        setJustAddedIds(prev => prev.filter(id => id !== prod.id));
      }, 2000);
    }
  };

  if (flashProducts.length === 0) return null;

  return (
    <section className="mb-8 sm:mb-12" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
        darkMode 
          ? 'bg-zinc-900 border-zinc-800 text-white' 
          : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b ${
          darkMode ? 'border-zinc-800' : 'border-slate-100'
        }`}>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className={`text-lg sm:text-xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                عروض مؤقتة
              </h2>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-600'
              }`}>
                تتجدد كل 3 أيام
              </span>
            </div>
            <p className={`text-xs mt-1.5 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              خصومات خاصة لفترة محدودة على منتجات مختارة حتى نفاد الكمية، وتتجدد العروض تلقائياً كل 3 أيام.
            </p>
          </div>

          {/* Countdown Timer */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400">
              <Clock className="w-3.5 h-3.5" />
              <span>المتبقي للجولة:</span>
            </div>

            <div className="flex items-center gap-1.5 font-mono">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold border ${
                  darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}>
                  {padZero(timeLeft.days)}
                </div>
                <span className="text-[9px] text-zinc-500 mt-1">يوم</span>
              </div>

              <span className="text-zinc-500 text-xs mb-4">:</span>

              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold border ${
                  darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}>
                  {padZero(timeLeft.hours)}
                </div>
                <span className="text-[9px] text-zinc-500 mt-1">ساعة</span>
              </div>

              <span className="text-zinc-500 text-xs mb-4">:</span>

              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold border ${
                  darkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}>
                  {padZero(timeLeft.minutes)}
                </div>
                <span className="text-[9px] text-zinc-500 mt-1">دقيقة</span>
              </div>

              <span className="text-zinc-500 text-xs mb-4">:</span>

              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold border ${
                  darkMode ? 'bg-zinc-950 border-zinc-800 text-blue-400' : 'bg-slate-100 border-slate-200 text-blue-600'
                }`}>
                  {padZero(timeLeft.seconds)}
                </div>
                <span className="text-[9px] text-zinc-500 mt-1">ثانية</span>
              </div>
            </div>
          </div>
        </div>

        {/* All Sold Out Notice Banner if every item reached 0 */}
        {allSoldOut && (
          <div className={`mt-5 p-4 rounded-2xl border flex items-center gap-3 transition-colors ${
            darkMode 
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200' 
              : 'bg-amber-50 border-amber-200 text-amber-950'
          }`}>
            <AlertCircle className={`w-5 h-5 shrink-0 ${darkMode ? 'text-emerald-400' : 'text-amber-600'}`} />
            <div className="text-xs">
              <strong>نفدت كافة كميات عروض هذه الجولة!</strong> لن يتم تجديد هذه المنتجات إلا بعد انتهاء عداد الـ 3 أيام أعلاه، وستنطلق حينها تشكيلة عروض جديدة.
            </div>
          </div>
        )}

        {/* Products Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pt-6">
          {flashProducts.map((prod) => {
            const isJustAdded = justAddedIds.includes(prod.id);
            const isSoldOut = prod.currentStock <= 0;
            const stockPercent = Math.max(0, Math.min(100, (prod.currentStock / prod.initialStock) * 100));

            return (
              <div
                key={prod.id}
                onClick={() => onViewDetails && onViewDetails(prod)}
                className={`group border rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1 relative ${
                  darkMode 
                    ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Discount Tag */}
                <span className={`absolute top-4 left-4 z-10 text-[11px] font-bold px-2 py-0.5 rounded-lg border ${
                  darkMode 
                    ? 'bg-zinc-800/90 border-zinc-700 text-zinc-200' 
                    : 'bg-slate-100 border-slate-200 text-slate-800'
                }`}>
                  خصم {prod.discountPercent}%
                </span>

                <div>
                  {/* Image Container */}
                  <div className={`h-44 rounded-2xl mb-4 p-4 flex items-center justify-center relative overflow-hidden border ${
                    darkMode ? 'bg-zinc-950 border-zinc-800/70' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      loading="lazy"
                      onError={(e) => {
                        if (e.currentTarget.src !== FALLBACK_PRODUCT_IMAGE) {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                        }
                      }}
                      className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ${
                        isSoldOut ? 'opacity-40 grayscale' : ''
                      }`} 
                    />

                    {/* Sold Out Overlay */}
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-20">
                        <span className="bg-stone-900/95 text-stone-100 text-xs font-bold px-3.5 py-1.5 rounded-full border border-stone-700 shadow-md">
                          {isRtl ? 'نفدت الكمية بالكامل' : 'Sold Out'}
                        </span>
                      </div>
                    )}
                    
                    <span className={`absolute bottom-3 right-3 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
                      darkMode ? 'bg-zinc-900/90 border-zinc-700 text-zinc-300' : 'bg-white/95 border-slate-200 text-slate-600'
                    }`}>
                      {prod.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className={`font-bold text-sm mb-2 line-clamp-1 transition-colors ${
                    darkMode ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
                  }`}>
                    {prod.name}
                  </h3>

                  {/* Rating & Stock Counter */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center text-amber-500 text-xs font-semibold gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500" /> {prod.rating || 4.8}
                    </span>
                    <span className={`text-[11px] font-bold ${isSoldOut ? 'text-rose-500' : 'text-zinc-400'}`}>
                      {isSoldOut 
                        ? (isRtl ? 'نفدت الكمية' : 'Sold out') 
                        : (isRtl ? `المتبقي: ${prod.currentStock} قطع` : `${prod.currentStock} left`)}
                    </span>
                  </div>

                  {/* Stock Bar */}
                  <div className={`h-1.5 w-full rounded-full overflow-hidden mb-3 ${
                    darkMode ? 'bg-zinc-800' : 'bg-slate-100'
                  }`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${
                        isSoldOut ? 'bg-zinc-600' : stockPercent <= 30 ? 'bg-rose-500' : 'bg-blue-600'
                      }`} 
                      style={{ width: `${stockPercent}%` }}
                    />
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className={`font-bold text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {formatPrice(prod.price)}
                    </span>
                    <span className="text-xs text-zinc-500 line-through">
                      {formatPrice(prod.originalPrice)}
                    </span>
                  </div>
                </div>

                {/* Button */}
                <div className="mt-2">
                  <button 
                    type="button"
                    disabled={isSoldOut}
                    onClick={(e) => onAdd(e, prod)}
                    className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
                      isSoldOut
                        ? 'bg-stone-200 text-stone-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed'
                        : isJustAdded
                          ? 'bg-emerald-600 text-white cursor-pointer active:scale-95'
                          : darkMode 
                            ? 'bg-white hover:bg-zinc-200 text-zinc-950 cursor-pointer active:scale-95' 
                            : 'bg-slate-900 hover:bg-black text-white cursor-pointer active:scale-95'
                    }`}
                  >
                    {isSoldOut ? (
                      <span>{isRtl ? 'نفدت الكمية' : 'Sold Out'}</span>
                    ) : isJustAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>تمت الإضافة</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>إضافة للسلة</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
