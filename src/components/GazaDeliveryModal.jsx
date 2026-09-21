import { useState, useMemo, useEffect } from 'react';
import { MapPin, X, Search, Check, Truck, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import { GAZA_GOVERNORATES, GAZA_DELIVERY_AREAS } from '../config/gazaDeliveryAreas';
import { formatPrice } from '../config/currencies';
import toast from 'react-hot-toast';

export default function GazaDeliveryModal({
  isOpen,
  onClose,
  selectedArea,
  onSelectArea,
  darkMode,
  isRtl = true,
  isFreeShipping = false,
  rawSubtotal = 0
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGovernorate, setActiveGovernorate] = useState('all');

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Filter areas based on governorate and search query
  const filteredAreas = useMemo(() => {
    return GAZA_DELIVERY_AREAS.filter(area => {
      const matchesGov = activeGovernorate === 'all' || area.governorate === activeGovernorate;
      const q = searchQuery.trim().toLowerCase();
      if (!q) return matchesGov;

      const matchesSearch = 
        area.name.toLowerCase().includes(q) ||
        (area.nameEn && area.nameEn.toLowerCase().includes(q)) ||
        (area.neighborhoods && area.neighborhoods.toLowerCase().includes(q)) ||
        area.governorateName.toLowerCase().includes(q);

      return matchesGov && matchesSearch;
    });
  }, [activeGovernorate, searchQuery]);

  // Area counts per governorate
  const govCounts = useMemo(() => {
    const counts = { all: GAZA_DELIVERY_AREAS.length };
    GAZA_DELIVERY_AREAS.forEach(area => {
      counts[area.governorate] = (counts[area.governorate] || 0) + 1;
    });
    return counts;
  }, []);

  const handleAreaClick = (area) => {
    onSelectArea(area);
    toast.success(`تم تحديد منطقة التوصيل: ${area.name}`, {
      duration: 3000,
      style: {
        background: darkMode ? '#18181b' : '#fff',
        color: darkMode ? '#f4f4f5' : '#0f172a',
        border: darkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
        fontFamily: 'Cairo, sans-serif',
        fontSize: '12px',
        fontWeight: 'bold',
      }
    });
    onClose();
  };

  const handleClearSelection = (e) => {
    e.stopPropagation();
    onSelectArea(null);
    toast('تم إلغاء تحديد منطقة التوصيل', {
      duration: 2500,
      style: {
        background: darkMode ? '#18181b' : '#fff',
        color: darkMode ? '#f4f4f5' : '#0f172a',
        border: darkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
        fontFamily: 'Cairo, sans-serif',
        fontSize: '12px',
        fontWeight: 'bold',
      }
    });
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className={`relative w-full max-w-2xl max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden z-10 transition-all duration-300 ${
        darkMode 
          ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
          : 'bg-white border-slate-200 text-slate-800'
      }`}>

        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center shrink-0 ${
          darkMode ? 'border-zinc-800/80 bg-zinc-950/40' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              darkMode ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black">
                  مناطق قطاع غزة وتكلفة التوصيل
                </h3>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  darkMode ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-slate-200 text-slate-700'
                }`}>
                  {GAZA_DELIVERY_AREAS.length} منطقة
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                اختر منطقتك لمعرفة سعر وسرعة التوصيل بدقة لطلبك
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              darkMode 
                ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' 
                : 'text-slate-400 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Banner / Notice */}
        <div className={`px-6 py-2.5 border-b text-xs flex items-center justify-between gap-3 shrink-0 ${
          isFreeShipping 
            ? (darkMode ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300' : 'bg-emerald-50 border-emerald-100 text-emerald-800')
            : (darkMode ? 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300' : 'bg-blue-50/50 border-blue-100/60 text-slate-700')
        }`}>
          <div className="flex items-center gap-2">
            <Truck className={`w-4 h-4 shrink-0 ${isFreeShipping ? 'text-emerald-500' : 'text-blue-500'}`} />
            {isFreeShipping ? (
              <span className="font-bold">
                طلبك مؤهل للتوصيل المجاني لكافة مناطق قطاع غزة (عرض المشتريات فوق $50)
              </span>
            ) : (
              <span className="font-medium">
                شحن وتوصيل سريع وموثوق • <strong>توصيل مجاني</strong> عند الشراء بقيمة $50 فأكثر
              </span>
            )}
          </div>
          {rawSubtotal > 0 && !isFreeShipping && rawSubtotal < 50 && (
            <span className="text-[10px] font-bold text-blue-500 shrink-0 hidden sm:inline">
              (متبقي {formatPrice(50 - rawSubtotal)} للشحن المجاني)
            </span>
          )}
        </div>

        {/* Search & Filter Controls */}
        <div className={`px-6 py-3.5 border-b space-y-3 shrink-0 ${
          darkMode ? 'border-zinc-800/60 bg-zinc-900' : 'border-slate-100 bg-white'
        }`}>
          {/* Search Input */}
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-zinc-400 absolute right-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن منطقتك أو حيك (مثلاً: الرمال، جباليا، دير البلح، النصيرات، خانيونس)..."
              className={`w-full h-10 pr-9 pl-9 rounded-xl text-xs font-bold transition-all outline-none border ${
                darkMode
                  ? 'bg-zinc-800/70 border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:border-blue-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                title="مسح البحث"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Governorate Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {GAZA_GOVERNORATES.map(gov => {
              const isActive = activeGovernorate === gov.id;
              const count = govCounts[gov.id] || 0;
              return (
                <button
                  key={gov.id}
                  type="button"
                  onClick={() => setActiveGovernorate(gov.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : (darkMode 
                          ? 'bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700/80 border border-zinc-700/60' 
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/80')
                  }`}
                >
                  <span>{gov.nameAr}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                    isActive 
                      ? 'bg-white/20 text-white font-mono' 
                      : (darkMode ? 'bg-zinc-700 text-zinc-400' : 'bg-slate-200 text-slate-600')
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Areas List / Cards Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {filteredAreas.length === 0 ? (
            <div className="text-center py-14 text-zinc-400 space-y-2">
              <AlertCircle className="w-9 h-9 mx-auto stroke-1 text-zinc-500" />
              <p className="text-xs font-bold">لم نجد منطقة مطابقة لبحثك</p>
              <p className="text-[11px] text-zinc-500">جرب كتابة اسم المدينة أو الحي بشكل مختلف</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setActiveGovernorate('all'); }}
                className="text-xs font-bold text-blue-500 hover:underline cursor-pointer mt-2"
              >
                إعادة ضبط البحث
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredAreas.map(area => {
                const isCurrentSelected = selectedArea?.id === area.id;

                return (
                  <div
                    key={area.id}
                    onClick={() => handleAreaClick(area)}
                    className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2.5 relative group ${
                      isCurrentSelected
                        ? (darkMode 
                            ? 'bg-blue-950/30 border-blue-500 ring-1 ring-blue-500/40' 
                            : 'bg-blue-50/70 border-blue-400 ring-1 ring-blue-300')
                        : (darkMode 
                            ? 'bg-zinc-800/40 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-800/70' 
                            : 'bg-white border-slate-200/90 hover:border-blue-300 hover:shadow-sm')
                    }`}
                  >
                    {/* Top Row: Governorate & Badges */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {area.governorateName}
                        </span>

                        {isCurrentSelected ? (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-600 text-white flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" />
                            محدد حالياً
                          </span>
                        ) : area.isPopular ? (
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border shrink-0 ${
                            darkMode 
                              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60' 
                              : 'bg-amber-50 text-amber-900 border-amber-200/80'
                          }`}>
                            شائع
                          </span>
                        ) : null}
                      </div>

                      {/* Area Name */}
                      <h4 className="text-xs font-black leading-snug group-hover:text-blue-500 transition-colors">
                        {area.name}
                      </h4>

                      {/* Neighborhoods snippet */}
                      <p className="text-[10.5px] text-zinc-400 mt-1 leading-relaxed line-clamp-2">
                        {area.neighborhoods}
                      </p>
                    </div>

                    {/* Bottom Row: Price & Time & Select Action */}
                    <div className={`pt-2.5 border-t flex items-center justify-between ${
                      darkMode ? 'border-zinc-800' : 'border-slate-100'
                    }`}>
                      {/* Price Section */}
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm font-black font-mono text-blue-600 dark:text-blue-400">
                          {formatPrice(area.priceUSD)}
                        </span>
                        <span className="text-[11px] font-bold text-zinc-400">
                          ({area.priceNIS} ₪)
                        </span>
                      </div>

                      {/* Delivery Time Pill */}
                      <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-medium">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{area.deliveryTime}</span>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`px-6 py-3.5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 ${
          darkMode ? 'border-zinc-800/80 bg-zinc-950/50' : 'border-slate-100 bg-slate-50/70'
        }`}>
          <div className="flex items-center gap-2 text-[11px] text-zinc-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>تسليم آمن ودقيق حتى باب المنزل أو أقرب نقطة استلام</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {selectedArea && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="px-3 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
              >
                إلغاء التحديد
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                darkMode 
                  ? 'bg-zinc-100 hover:bg-white text-zinc-900' 
                  : 'bg-slate-900 hover:bg-black text-white'
              }`}
            >
              إغلاق
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
