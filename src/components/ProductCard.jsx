import { Plus, Star } from 'lucide-react';
import { formatPrice } from '../config/currencies';
import { FALLBACK_PRODUCT_IMAGE } from '../config/offlineConfig';

export default function ProductCard({ 
  product, 
  darkMode, 
  lastElementRef, 
  handleAddToCart, 
  onViewDetails,
  language = 'ar',
  t
}) {
  const isRtl = language === 'ar';
  const displayCategory = t?.categoriesMap?.[product.category] || product.category;
  const isSoldOut = product.stock !== undefined && product.stock <= 0;

  return (
    <div 
      ref={lastElementRef}
      onClick={() => onViewDetails && onViewDetails(product)}
      className={`group border rounded-3xl p-5 flex flex-col justify-between transition-all duration-300 cursor-pointer hover:shadow-lg hover:-translate-y-1 ${
        darkMode 
          ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700' 
          : 'bg-white border-slate-200 hover:border-slate-300'
      }`}
    >
      <div>
        <div className={`h-44 rounded-2xl mb-4 p-4 flex items-center justify-center relative overflow-hidden border ${
          darkMode ? 'bg-zinc-950 border-zinc-800/70' : 'bg-slate-50 border-slate-100'
        }`}>
          <img 
            src={product.image} 
            alt={product.name} 
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

          {isSoldOut && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
              <span className="bg-stone-900/95 text-stone-100 text-[11px] font-bold px-3 py-1 rounded-full border border-stone-700 shadow-md">
                {isRtl ? 'نفدت الكمية' : 'Sold Out'}
              </span>
            </div>
          )}
          
          {/* Category Tag */}
          <span className={`absolute top-3 ${isRtl ? 'right-3' : 'left-3'} text-[11px] font-bold px-3 py-1 rounded-full border ${
            darkMode ? 'bg-zinc-900/90 border-zinc-700 text-zinc-300' : 'bg-white/95 border-slate-200 text-slate-700'
          }`}>
            {displayCategory}
          </span>
        </div>

        <h3 className={`font-bold text-sm mb-2 line-clamp-1 transition-colors ${
          darkMode ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
        }`}>
          {product.name}
        </h3>

        <div className="flex items-center justify-between mb-2">
          <span className={`font-black text-base ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {formatPrice(product.price)}
          </span>
          <span className="flex items-center text-amber-500 text-xs font-bold gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-500" /> {product.rating || 4.8}
          </span>
        </div>
      </div>
      
      <div className="mt-4">
        <button 
          type="button"
          disabled={isSoldOut}
          onClick={(e) => {
            e.stopPropagation();
            if (!isSoldOut) handleAddToCart(product);
          }}
          className={`w-full py-3 px-4 rounded-2xl text-xs font-black transition-all duration-200 flex items-center justify-center gap-2 shadow-sm ${
            isSoldOut
              ? 'bg-stone-200 text-stone-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed'
              : darkMode ? 'bg-white hover:bg-zinc-200 text-zinc-950 cursor-pointer active:scale-95' : 'bg-slate-900 hover:bg-black text-white cursor-pointer active:scale-95'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>{isSoldOut ? (isRtl ? 'نفدت الكمية' : 'Sold Out') : (t?.products?.addToCart || (isRtl ? 'إضافة للسلة' : 'Add to Cart'))}</span>
        </button>
      </div>
    </div>
  );
}