import { X, Loader2, AlertCircle, Mail, Key } from 'lucide-react';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

export default function AuthModal({ 
  isOpen, 
  setIsOpen, 
  isSignUpMode, 
  setIsSignUpMode, 
  email, 
  setEmail, 
  password, 
  setPassword, 
  authError,
  setAuthError,
  isAuthLoading = false,
  handleGoogleLogin, 
  handleEmailAuth, 
  darkMode = true,
  language = 'ar',
  t
}) {
  const isRtl = language === 'ar';

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  const handleToggleMode = () => {
    if (setAuthError) setAuthError('');
    setPassword('');
    setIsSignUpMode(!isSignUpMode);
  };

  const handleClose = () => {
    if (!isAuthLoading) {
      if (setAuthError) setAuthError('');
      setPassword('');
      setIsOpen(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center p-4 overscroll-contain" 
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={handleClose} 
        onWheel={(e) => e.stopPropagation()}
      />

      {/* Modal Card */}
      <div className={`relative border w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl z-10 transition-all ${
        darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-black text-base sm:text-lg">
              {isSignUpMode 
                ? (t?.auth?.createNewAccount || 'إنشاء حساب جديد')
                : (t?.auth?.welcomeBack || 'تسجيل الدخول إلى حسابك')
              }
            </h3>
            <p className={`text-xs mt-1 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              {isSignUpMode
                ? 'انضم إلينا واستمتع بتجربة تسوق فريدة'
                : 'أهلاً بعودتك! سجل الدخول لمتابعة مشترياتك'
              }
            </p>
          </div>

          <button 
            type="button"
            onClick={handleClose} 
            disabled={isAuthLoading}
            className={`p-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
              darkMode 
                ? 'text-zinc-400 hover:text-white bg-zinc-800/80 hover:bg-zinc-800' 
                : 'text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200'
            }`}
            title={isRtl ? 'إغلاق' : 'Close'}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert Message */}
        {authError && (
          <div className={`mb-5 p-3.5 text-xs font-bold rounded-2xl border flex items-start gap-2.5 transition-all ${
            darkMode 
              ? 'bg-rose-950/40 text-rose-300 border-rose-900/60' 
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1 leading-relaxed">
              <span>{authError}</span>
              {authError.includes('إنشاء حساب جديد') && !isSignUpMode && (
                <button
                  type="button"
                  onClick={handleToggleMode}
                  className="block mt-1.5 text-blue-500 hover:underline font-extrabold cursor-pointer"
                >
                  التبديل إلى إنشاء حساب جديد الآن ←
                </button>
              )}
            </div>
          </div>
        )}

        {/* Google Sign In Button */}
        <button 
          type="button"
          disabled={isAuthLoading}
          onClick={handleGoogleLogin}
          className={`w-full border py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-3 transition-all mb-5 shadow-sm cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            darkMode 
              ? 'bg-zinc-800/90 hover:bg-zinc-800 text-white border-zinc-700/80' 
              : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
          }`}
        >
          {isAuthLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          )}
          <span>{t?.auth?.googleAuth || 'المتابعة باستخدام Google'}</span>
        </button>

        {/* Separator */}
        <div className="relative flex items-center justify-center mb-5">
          <div className={`w-full border-t ${darkMode ? 'border-zinc-800' : 'border-slate-200'}`} />
          <span className={`absolute px-3 text-[11px] font-bold ${
            darkMode ? 'bg-zinc-900 text-zinc-500' : 'bg-white text-slate-400'
          }`}>
            أو عبر البريد الإلكتروني
          </span>
        </div>

        {/* Email/Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {/* Email Field */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-zinc-200' : 'text-slate-700'}`}>
              {t?.auth?.emailLabel || 'البريد الإلكتروني'}
            </label>
            <div className="relative">
              <input 
                type="email" 
                required 
                disabled={isAuthLoading}
                value={email} 
                onChange={(e) => {
                  if (authError && setAuthError) setAuthError('');
                  setEmail(e.target.value);
                }}
                placeholder="name@example.com"
                className={`w-full pr-11 pl-4 py-3 border rounded-2xl text-xs font-bold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors disabled:opacity-50 text-right ${
                  darkMode 
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <Mail className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className={`block text-xs font-bold mb-1.5 ${darkMode ? 'text-zinc-200' : 'text-slate-700'}`}>
              {t?.auth?.passwordLabel || 'كلمة المرور'}
            </label>
            <div className="relative">
              <input 
                type="password" 
                required 
                disabled={isAuthLoading}
                value={password} 
                onChange={(e) => {
                  if (authError && setAuthError) setAuthError('');
                  setPassword(e.target.value);
                }}
                placeholder="••••••••"
                className={`w-full pr-11 pl-4 py-3 border rounded-2xl text-xs font-bold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 transition-colors disabled:opacity-50 text-right tracking-widest ${
                  darkMode 
                    ? 'bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <Key className="w-4 h-4" />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isAuthLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl text-xs font-black shadow-sm transition-all cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isAuthLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>جاري التحقق...</span>
              </>
            ) : (
              <span>
                {isSignUpMode 
                  ? (t?.auth?.submitSignup || 'إنشاء حساب جديد')
                  : (t?.auth?.submitLogin || 'تسجيل الدخول')
                }
              </span>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-5 text-center">
          <button 
            type="button" 
            disabled={isAuthLoading}
            onClick={handleToggleMode} 
            className="text-xs text-blue-500 hover:underline font-bold cursor-pointer transition-colors"
          >
            {isSignUpMode 
              ? (isRtl ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'Already have an account? Sign in')
              : (isRtl ? 'ليس لديك حساب؟ إنشاء حساب جديد' : "Don't have an account? Sign up")
            }
          </button>
        </div>

      </div>
    </div>
  );
}