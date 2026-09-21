import { useState, useEffect } from 'react';
import { Truck, Flame, Tag, ShieldCheck, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { formatPrice } from '../config/currencies';

export default function TopAnnouncementBar({ darkMode }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const announcements = [
    {
      id: 'shipping',
      icon: Truck,
      color: 'text-zinc-300',
      text: `شحن مجاني لكافة الطلبات بقيمة ${formatPrice(50)} فأكثر`,
      code: 'FREE'
    },
    {
      id: 'discount-10',
      icon: Flame,
      color: 'text-zinc-300',
      text: `خصم 10% عند الشراء بقيمة ${formatPrice(100)} فأكثر`,
      code: 'SOFYAN10'
    },
    {
      id: 'discount-20',
      icon: Tag,
      color: 'text-zinc-300',
      text: `خصم 20% للطلبات بقيمة ${formatPrice(200)} فأكثر`,
      code: 'SOFYAN20'
    },
    {
      id: 'warranty',
      icon: ShieldCheck,
      color: 'text-zinc-300',
      text: 'منتجات أصلية 100% مع إمكانية الإرجاع خلال 14 يوماً',
      code: null
    }
  ];

  // Auto rotate announcements every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isPaused, announcements.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % announcements.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + announcements.length) % announcements.length);
  };

  if (isDismissed) return null;

  const currentItem = announcements[currentIndex];
  const IconComponent = currentItem.icon;

  return (
    <div 
      dir="rtl"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative z-30 transition-colors duration-300 border-b text-xs select-none ${
        darkMode 
          ? 'bg-[#0b0c10] border-zinc-800/80 text-zinc-300' 
          : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2">
        
        {/* Previous Button */}
        <button
          type="button"
          onClick={handlePrev}
          className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
          title="العرض السابق"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Center Content: Rotating text with animated transition */}
        <div className="flex-1 min-w-0 flex items-center justify-center gap-2 sm:gap-3 text-center overflow-hidden">
          <span className={`p-1 rounded-md bg-white/10 shrink-0 ${currentItem.color}`}>
            <IconComponent className="w-3.5 h-3.5" />
          </span>

          <span className="font-bold text-[11px] sm:text-xs truncate max-w-[220px] sm:max-w-md md:max-w-lg">
            {currentItem.text}
          </span>

          {/* Static Coupon Badge (Non-copyable & Non-interactive) */}
          {currentItem.code && (
            <span
              className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg border text-[10px] sm:text-[11px] font-black font-mono bg-white/10 border-white/20 text-white shrink-0 select-none pointer-events-none cursor-default"
            >
              {currentItem.code}
            </span>
          )}
        </div>

        {/* Right Controls: Next & Dismiss */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleNext}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="العرض التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="إغلاق الشريط"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
}
