import { ShoppingBag, LogOut, LogIn, Sun, Moon } from 'lucide-react';

export default function Navbar({ 
  darkMode, 
  setDarkMode, 
  user, 
  totalCartItems, 
  setIsCartOpen, 
  setIsAuthModalOpen, 
  handleLogout
}) {
  return (
    <header className="sticky top-2 sm:top-4 z-40 max-w-7xl mx-auto px-3 sm:px-6">
      <nav className={`backdrop-blur-xl border rounded-2xl sm:rounded-3xl px-3.5 sm:px-6 h-16 sm:h-20 flex justify-between items-center shadow-md transition-all duration-300 ${darkMode ? 'bg-zinc-900/90 border-zinc-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900'}`}>
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <span className={`font-black text-xs sm:text-base tracking-tight sm:tracking-wider truncate block ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <span className="hidden sm:inline">SOFYANEYAD STORE</span>
              <span className="sm:hidden">SOFYAN STORE</span>
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">

          {/* Dark / Light Toggle */}
          <button 
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl border transition-all duration-300 cursor-pointer ${
              darkMode 
                ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-amber-400' 
                : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
            }`}
            title="تبديل المظهر"
          >
            {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Cart Button */}
          <button 
            type="button"
            onClick={() => setIsCartOpen(true)}
            className={`relative border p-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center gap-2 transition-all duration-300 cursor-pointer active:scale-95 ${
              darkMode 
                ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-white' 
                : 'bg-slate-900 hover:bg-slate-800 text-white border-slate-900'
            }`}
            title="سلة التسوق"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">السلة</span>
            {totalCartItems > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] min-w-4 sm:min-w-5 h-4 sm:h-5 px-1 rounded-full flex items-center justify-center font-black shadow-sm">
                {totalCartItems}
              </span>
            )}
          </button>

          {/* Auth Button / User Profile */}
          {user ? (
            <div className={`flex items-center gap-1.5 sm:gap-2.5 border rounded-xl sm:rounded-2xl px-2 py-1.5 sm:px-3.5 sm:py-2 ${
              darkMode ? 'bg-zinc-800/80 border-zinc-700' : 'bg-slate-100 border-slate-200'
            }`}>
              <img 
                src={user.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'} 
                alt="Avatar" 
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg sm:rounded-xl object-cover ring-1 ${darkMode ? 'ring-zinc-600' : 'ring-slate-300'}`} 
              />
              <span className="text-xs font-bold max-w-[80px] sm:max-w-[120px] truncate hidden md:inline">
                {user.displayName || user.email}
              </span>
              <button 
                type="button"
                onClick={handleLogout} 
                className="text-slate-400 hover:text-rose-500 transition-colors p-0.5 sm:ml-1 cursor-pointer" 
                title="تسجيل الخروج"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl text-xs font-extrabold shadow-sm transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5 sm:hidden" />
              <span className="hidden sm:inline">تسجيل الدخول</span>
              <span className="sm:hidden">دخول</span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}