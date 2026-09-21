import { Search, Filter, ArrowUpDown, ChevronDown, X, Sparkles } from 'lucide-react';

export default function FilterBar({ 
  searchTerm, 
  setSearchTerm, 
  selectedCategory, 
  setSelectedCategory, 
  categories, 
  categoryCounts = {}, 
  sortBy = 'default', 
  setSortBy, 
  darkMode,
  language = 'ar',
  t
}) {
  const isRtl = language === 'ar';

  const formatCategoryName = (cat) => {
    if (cat === 'All') {
      return isRtl ? '🌟 جميع المنتجات' : '🌟 All Products';
    }
    if (t?.categoriesMap?.[cat]) {
      return t.categoriesMap[cat];
    }
    return cat.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className={`border rounded-3xl p-6 mb-10 shadow-sm flex flex-col gap-5 transition-colors duration-300 ${darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'}`}>
      
      {/* Top Row: Search + Category Select + Sort By */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
        
        {/* 1. Search Input */}
        <div className="relative flex items-center lg:col-span-6">
          <span className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none text-slate-400`}>
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text"
            placeholder={t?.filter?.searchPlaceholder || 'ابحث عن أي منتج...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full h-12 ${isRtl ? 'pr-11 pl-10' : 'pl-11 pr-10'} border rounded-2xl text-xs font-bold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all ${
              darkMode 
                ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' 
                : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
            }`}
          />
          {searchTerm && (
            <button 
              type="button"
              onClick={() => setSearchTerm('')}
              className={`absolute inset-y-0 ${isRtl ? 'left-0 pl-3.5' : 'right-0 pr-3.5'} flex items-center text-slate-400 transition-colors cursor-pointer ${darkMode ? 'hover:text-white' : 'hover:text-slate-900'}`}
              title={isRtl ? 'مسح البحث' : 'Clear search'}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 2. Category Dropdown */}
        <div className="relative flex items-center sm:col-span-1 lg:col-span-3">
          <span className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none text-slate-400`}>
            <Filter className="w-4 h-4" />
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`w-full h-12 ${isRtl ? 'pr-11 pl-10' : 'pl-11 pr-10'} border rounded-2xl text-xs font-bold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all cursor-pointer appearance-none ${
              darkMode 
                ? 'bg-zinc-950 border-zinc-800 text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            {categories.map(cat => (
              <option key={cat} value={cat} className={darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
                {cat === 'All' 
                  ? (isRtl ? '🌟 جميع الأقسام' : '🌟 All Categories')
                  : `${formatCategoryName(cat)} (${categoryCounts[cat] || 0})`
                }
              </option>
            ))}
          </select>
          <span className={`absolute inset-y-0 ${isRtl ? 'left-0 pl-4' : 'right-0 pr-4'} flex items-center pointer-events-none text-slate-400`}>
            <ChevronDown className="w-4 h-4" />
          </span>
        </div>

        {/* 3. Sort By Dropdown */}
        <div className="relative flex items-center sm:col-span-1 lg:col-span-3">
          <span className={`absolute inset-y-0 ${isRtl ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none text-slate-400`}>
            <ArrowUpDown className="w-4 h-4" />
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={`w-full h-12 ${isRtl ? 'pr-11 pl-10' : 'pl-11 pr-10'} border rounded-2xl text-xs font-bold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-all cursor-pointer appearance-none ${
              darkMode 
                ? 'bg-zinc-950 border-zinc-800 text-white' 
                : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          >
            <option value="default" className={darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
              {isRtl ? 'الأحدث والمميز (افتراضي)' : 'Featured (Default)'}
            </option>
            <option value="price-asc" className={darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
              {isRtl ? '💵 السعر: من الأقل للأعلى' : '💵 Price: Low to High'}
            </option>
            <option value="price-desc" className={darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
              {isRtl ? '💎 السعر: من الأعلى للأقل' : '💎 Price: High to Low'}
            </option>
            <option value="rating-desc" className={darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
              {isRtl ? '⭐ الأكثر تقييماً' : '⭐ Highest Rated'}
            </option>
            <option value="name-asc" className={darkMode ? 'bg-zinc-900 text-white' : 'bg-white text-slate-900'}>
              {isRtl ? '🔤 الاسم: أبجدياً (أ - ي)' : '🔤 Name: A to Z'}
            </option>
          </select>
          <span className={`absolute inset-y-0 ${isRtl ? 'left-0 pl-4' : 'right-0 pr-4'} flex items-center pointer-events-none text-slate-400`}>
            <ChevronDown className="w-4 h-4" />
          </span>
        </div>

      </div>

      {/* Subtle Divider */}
      <div className={`h-px w-full ${darkMode ? 'bg-zinc-800' : 'bg-slate-100'}`} />

      {/* Quick Category Pills with Badges */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-black flex items-center gap-1.5 ${darkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            {isRtl ? 'التصنيفات السريعة' : 'Quick Categories'}
          </span>
          <span className={`text-[11px] font-bold ${darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
            {isRtl ? 'اسحب أفقياً لرؤية المزيد ←' : 'Scroll to explore more →'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 pt-0.5 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            const count = categoryCounts[cat] ?? 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center gap-2 cursor-pointer border ${
                  isActive
                    ? darkMode
                      ? 'bg-white text-zinc-950 border-white shadow-sm'
                      : 'bg-slate-900 text-white border-slate-900 shadow-sm'
                    : darkMode
                      ? 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700 hover:text-white'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                <span>{formatCategoryName(cat)}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  isActive
                    ? darkMode
                      ? 'bg-zinc-200 text-zinc-950'
                      : 'bg-slate-800 text-white'
                    : darkMode
                      ? 'bg-zinc-800 text-zinc-400'
                      : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}