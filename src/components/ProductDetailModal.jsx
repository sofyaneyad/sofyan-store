import { useState, useEffect } from 'react';
import { 
  X, 
  Star, 
  ShoppingBag, 
  ShieldCheck, 
  Truck, 
  RotateCcw, 
  Tag, 
  Layers, 
  Plus, 
  Minus,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { formatPrice } from '../config/currencies';
import { FALLBACK_PRODUCT_IMAGE } from '../config/offlineConfig';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

const getReviewCount = (prod) => {
  if (!prod) return 24;
  const idNum = parseInt(prod.id, 10) || 1;
  return ((idNum * 37 + 19) % 170) + 15;
};

const normalizeReturnPolicy = (prod, isRtl) => {
  if (!prod) return isRtl ? 'إرجاع واستبدال خلال 14 يوماً' : '14 days return policy';
  
  const policyStr = typeof prod === 'string' ? prod : (prod.returnPolicy || '');
  const price = typeof prod === 'object' ? (prod.price || 0) : 0;
  const category = typeof prod === 'object' ? (prod.category || '').toLowerCase() : '';

  if (policyStr === 'No return policy' || policyStr === 'غير قابل للإرجاع') {
    return isRtl ? 'غير قابل للإرجاع' : 'Non-returnable';
  }

  // السلع الرخيصة (أقل من أو يساوي 15$) أو البقالة والمستهلكات: إرجاع خلال يوم واحد كحد أقصى
  if ((price > 0 && price <= 15) || category === 'groceries') {
    return isRtl ? 'إرجاع خلال يوم واحد' : '1 day return policy';
  }

  // السلع المتوسطة (أقل من أو يساوي 60$)
  if ((price > 0 && price <= 60) || /7/.test(policyStr)) {
    return isRtl ? 'إرجاع خلال 7 أيام' : '7 days return policy';
  }

  // السلع الثمينة والأجهزة
  return isRtl ? 'إرجاع واستبدال خلال 14 يوماً' : '14 days return policy';
};

export default function ProductDetailModal({ 
  product, 
  onClose, 
  darkMode, 
  onAddToCart,
  language = 'ar',
  t
}) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantityInput, setQuantityInput] = useState('1');
  const isRtl = language === 'ar';

  const MAX_ALLOWED = 100;
  const currentQuantity = Math.max(1, Math.min(MAX_ALLOWED, parseInt(quantityInput, 10) || 1));

  // Lock body/html scroll when product modal is open
  useBodyScrollLock(Boolean(product));

  // Listen to Escape key
  useEffect(() => {
    if (!product) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [product, onClose]);

  if (!product) return null;

  // Prepare images array
  const allImages = Array.isArray(product.images) && product.images.length > 0 
    ? product.images 
    : [product.image];

  const currentImage = allImages[selectedImageIndex] || product.image;

  const handleIncrement = () => {
    if (currentQuantity < MAX_ALLOWED) {
      setQuantityInput(String(currentQuantity + 1));
    }
  };

  const handleDecrement = () => {
    if (currentQuantity > 1) {
      setQuantityInput(String(currentQuantity - 1));
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuantityInput(val);
  };

  const handleInputBlur = () => {
    const num = parseInt(quantityInput, 10);
    if (isNaN(num) || num < 1) {
      setQuantityInput('1');
    } else if (num > MAX_ALLOWED) {
      setQuantityInput(String(MAX_ALLOWED));
    }
  };

  const isSoldOut = product.stock !== undefined && product.stock <= 0;

  const handleAdd = () => {
    if (isSoldOut) return;
    onAddToCart(product, currentQuantity);
    onClose();
  };

  const displayDescription = product.arabicDescription || product.description;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 overflow-y-auto overscroll-contain" dir="rtl">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
        onWheel={(e) => e.stopPropagation()}
      />

      {/* Modal Card */}
      <div 
        className={`relative w-full max-w-2xl lg:max-w-3xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl shadow-2xl border z-10 transition-all duration-300 my-auto ${
          darkMode 
            ? 'bg-zinc-900 border-zinc-800 text-white shadow-black/80' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-400/30'
        }`}
      >
        {/* 1. Modal Top Bar */}
        <div className={`px-4 sm:px-6 py-3 sm:py-4 border-b flex items-center justify-between shrink-0 ${
          darkMode ? 'border-zinc-800/80 bg-zinc-950/50' : 'border-stone-200 bg-stone-50/80'
        }`}>
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full border whitespace-nowrap capitalize ${
              darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-stone-100 border-stone-200 text-stone-700'
            }`}>
              {product.category}
            </span>
            <span className="text-[10px] sm:text-[11px] text-stone-400 font-mono truncate">
              رمز: {product.sku || `PRD-${product.id}`}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer border shrink-0 ${
              darkMode 
                ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-300 hover:text-white' 
                : 'bg-stone-100 hover:bg-stone-200 border-stone-200 text-stone-600 hover:text-stone-900 shadow-2xs'
            }`}
            title="إغلاق النافذة (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Scrollable Body Content */}
        <div className="overflow-y-auto p-4 sm:p-6 lg:p-8 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 items-start">
            
            {/* Left Column: Image Gallery */}
            <div className="flex flex-col gap-3">
              {/* Main Image View */}
              <div className={`w-full aspect-square rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex items-center justify-center border relative overflow-hidden ${
                darkMode ? 'bg-zinc-950 border-zinc-800/80' : 'bg-stone-50 border-stone-200/80'
              }`}>
                <img 
                  src={currentImage} 
                  alt={product.name} 
                  onError={(e) => {
                    if (e.currentTarget.src !== FALLBACK_PRODUCT_IMAGE) {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                    }
                  }}
                  className="w-full h-full object-contain transition-all duration-300 hover:scale-105" 
                />

                {product.discountPercentage > 0 && (
                  <span className="absolute top-3 left-3 text-xs font-black px-2.5 py-1 rounded-xl bg-stone-900 text-stone-50 shadow-sm">
                    خصم {Math.round(product.discountPercentage)}%
                  </span>
                )}
              </div>

              {/* Thumbnails list if multiple images exist */}
              {allImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
                  {allImages.map((imgUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl p-1.5 shrink-0 border-2 transition-all cursor-pointer ${
                        selectedImageIndex === idx
                          ? darkMode ? 'border-white shadow-xs scale-105' : 'border-stone-900 shadow-xs scale-105'
                          : darkMode
                            ? 'border-zinc-800 bg-zinc-950/60 opacity-60 hover:opacity-100'
                            : 'border-stone-200 bg-stone-50 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img 
                        src={imgUrl} 
                        alt={`Thumbnail ${idx + 1}`} 
                        onError={(e) => {
                          if (e.currentTarget.src !== FALLBACK_PRODUCT_IMAGE) {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = FALLBACK_PRODUCT_IMAGE;
                          }
                        }}
                        className="w-full h-full object-contain" 
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Information & Details */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                {/* Brand & Stock Pill */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className={`text-xs font-bold tracking-wide ${darkMode ? 'text-zinc-400' : 'text-stone-500'}`}>
                    {product.brand || 'علامة أصلية'}
                  </span>

                  <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 border ${
                    product.stock > 0
                      ? darkMode
                        ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        : 'bg-stone-100 text-stone-700 border-stone-200'
                      : darkMode
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-stone-100 text-stone-500 border-stone-200'
                  }`}>
                    {product.stock > 0 ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-stone-600 dark:text-zinc-400" />
                        <span>متوفر بالمخزون</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 text-stone-400" />
                        <span>غير متوفر</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Product Name */}
                <h1 className="text-lg sm:text-xl lg:text-2xl font-black leading-snug mb-3">
                  {product.name}
                </h1>

                {/* Rating & Review count */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                    <Star className="w-4 h-4 fill-amber-500" />
                    <span>{product.rating || 4.8}</span>
                  </div>
                  <span className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-stone-500'}`}>
                    ({getReviewCount(product)} تقييماً)
                  </span>
                </div>

                {/* Price Display */}
                <div className={`mb-4 p-4 rounded-2xl border transition-all ${
                  darkMode ? 'bg-zinc-950/70 border-zinc-800' : 'bg-stone-50 border-stone-200'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Main Price & Strikethrough Price */}
                    <div className="flex items-baseline gap-2.5 sm:gap-3 flex-wrap">
                      <span className={`text-2xl sm:text-3xl font-black font-mono tracking-tight ${
                        darkMode ? 'text-white' : 'text-stone-900'
                      }`}>
                        {formatPrice(product.price)}
                      </span>

                      {product.discountPercentage > 0 && (
                        <span className={`text-xs sm:text-sm line-through font-mono ${
                          darkMode ? 'text-zinc-500' : 'text-stone-400'
                        }`}>
                          {formatPrice(product.price * (1 + product.discountPercentage / 100))}
                        </span>
                      )}
                    </div>

                    {/* Savings Badge: Emerald Green in Dark Mode, Warm Amber Gold in Light Mode */}
                    {product.discountPercentage > 0 && (
                      <div className={`self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 border shadow-xs ${
                        darkMode 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25' 
                          : 'bg-amber-50/90 text-amber-900 border-amber-200/80'
                      }`}>
                        <Tag className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-emerald-400' : 'text-amber-600'}`} />
                        <span>وفر {formatPrice(product.price * (product.discountPercentage / 100))}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-black ${
                          darkMode ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-100 text-amber-900'
                        }`}>
                          %{Math.round(product.discountPercentage)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5 mb-5">
                  <h3 className={`text-xs font-bold ${darkMode ? 'text-zinc-300' : 'text-stone-800'}`}>
                    الوصف والمواصفات:
                  </h3>
                  <p className={`text-xs leading-relaxed ${darkMode ? 'text-zinc-400' : 'text-stone-600 font-medium'}`}>
                    {displayDescription}
                  </p>
                </div>
              </div>

              {/* Shipping & Return Trust Row */}
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 pb-3">
                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  darkMode 
                    ? 'bg-zinc-950/60 border-zinc-800 text-zinc-300' 
                    : 'bg-stone-50 border-stone-200 text-stone-700 font-medium'
                }`}>
                  <Truck className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-zinc-400' : 'text-stone-600'}`} />
                  <span className="truncate">{product.shippingInformation || 'شحن سريع ومباشر'}</span>
                </div>
                <div className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                  darkMode 
                    ? 'bg-zinc-950/60 border-zinc-800 text-zinc-300' 
                    : 'bg-stone-50 border-stone-200 text-stone-700 font-medium'
                }`}>
                  <RotateCcw className={`w-3.5 h-3.5 shrink-0 ${darkMode ? 'text-zinc-400' : 'text-stone-600'}`} />
                  <span className="truncate">{normalizeReturnPolicy(product, isRtl)}</span>
                </div>
              </div>

              {/* Quantity Selector & Add Button */}
              <div className="pt-3 sm:pt-4 border-t border-stone-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className={`text-xs font-bold ${darkMode ? 'text-zinc-300' : 'text-stone-700'}`}>
                      الكمية:
                    </span>
                    
                    <div className={`flex items-center rounded-xl border ${
                      darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-stone-100 border-stone-200'
                    }`}>
                      <button
                        type="button"
                        onClick={handleDecrement}
                        disabled={currentQuantity <= 1}
                        className={`p-1.5 sm:p-2 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed ${
                          darkMode ? 'text-zinc-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                        }`}
                        title="تقليل الكمية"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      
                      <input
                        type="number"
                        min={1}
                        max={MAX_ALLOWED}
                        value={quantityInput}
                        onChange={handleInputChange}
                        onBlur={handleInputBlur}
                        className="w-10 sm:w-11 text-center text-xs font-black font-mono bg-transparent outline-none py-1 text-stone-900 dark:text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />

                      <button
                        type="button"
                        onClick={handleIncrement}
                        disabled={currentQuantity >= MAX_ALLOWED}
                        className={`p-1.5 sm:p-2 transition-colors disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed ${
                          darkMode ? 'text-zinc-400 hover:text-white' : 'text-stone-600 hover:text-stone-900'
                        }`}
                        title="زيادة الكمية"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="text-[10px] sm:text-[11px] text-stone-400 font-medium">
                      (الحد: 100)
                    </span>
                  </div>

                  <span className="text-xs text-stone-500 whitespace-nowrap">
                    الإجمالي: <strong className={darkMode ? 'text-white' : 'text-stone-900'}>{formatPrice(product.price * currentQuantity)}</strong>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  disabled={isSoldOut}
                  className={`w-full py-3 sm:py-3.5 px-4 sm:px-6 rounded-2xl text-xs sm:text-sm font-black transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
                    isSoldOut
                      ? 'bg-stone-200 text-stone-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed'
                      : darkMode 
                        ? 'bg-white hover:bg-zinc-200 text-zinc-950 cursor-pointer active:scale-98' 
                        : 'bg-stone-900 hover:bg-black text-stone-50 shadow-md shadow-stone-900/10 cursor-pointer active:scale-98'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isSoldOut ? 'نفدت الكمية من المخزون' : `إضافة للسلة (${formatPrice(product.price * currentQuantity)})`}</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
