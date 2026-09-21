import { X } from 'lucide-react';
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
  handleGoogleLogin, 
  handleEmailAuth,
  handleGuestLogin,
  language = 'ar',
  t
}) {
  const isRtl = language === 'ar';
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overscroll-contain" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} onWheel={(e) => e.stopPropagation()}></div>
      <div className="relative border w-full max-w-md rounded-3xl p-8 shadow-2xl z-10 bg-zinc-900 border-zinc-800 text-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-base">
            {isSignUpMode 
              ? (t?.auth?.createNewAccount || 'إنشاء حساب جديد')
              : (t?.auth?.welcomeBack || 'تسجيل الدخول إلى حسابك')
            }
          </h3>
          <button 
            onClick={() => setIsOpen(false)} 
            className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-800 cursor-pointer transition-colors"
            title={isRtl ? 'إغلاق' : 'Close'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {authError && (
          <div className="mb-5 p-3.5 bg-rose-950/40 text-rose-400 text-xs font-bold rounded-2xl border border-rose-900/40">
            {authError}
          </div>
        )}

        <button 
          type="button"
          onClick={handleGoogleLogin}
          className="w-full border py-3.5 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-3 transition-all mb-5 shadow-sm bg-zinc-800/80 hover:bg-zinc-800 text-white border-zinc-700 cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>{t?.auth?.googleAuth || 'المتابعة باستخدام Google'}</span>
        </button>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-zinc-400">
              {t?.auth?.emailLabel || 'البريد الإلكتروني'}
            </label>
            <input 
              type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder={t?.auth?.emailPlaceholder || 'name@example.com'}
              className="w-full px-4 py-3 border rounded-2xl text-xs font-bold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 text-zinc-400">
              {t?.auth?.passwordLabel || 'كلمة المرور'}
            </label>
            <input 
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder={t?.auth?.passwordPlaceholder || '••••••••'}
              className="w-full px-4 py-3 border rounded-2xl text-xs font-bold focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20 bg-zinc-950 border-zinc-800 text-white placeholder-zinc-500"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-2xl text-xs font-black shadow-sm transition-colors cursor-pointer active:scale-95">
            {isSignUpMode 
              ? (t?.auth?.submitSignup || 'إنشاء حساب جديد')
              : (t?.auth?.submitLogin || 'تسجيل الدخول')
            }
          </button>
        </form>

        <div className="mt-5 text-center">
          <button type="button" onClick={() => setIsSignUpMode(!isSignUpMode)} className="text-xs text-blue-400 hover:underline font-bold cursor-pointer">
            {isSignUpMode 
              ? (isRtl ? 'لديك حساب بالفعل؟ تسجيل الدخول' : 'Already have an account? Sign in')
              : (isRtl ? 'ليس لديك حساب؟ إنشاء حساب جديد' : "Don't have an account? Sign up")
            }
          </button>
        </div>

        {handleGuestLogin && (
          <div className="mt-4 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={handleGuestLogin}
              className="w-full py-2.5 px-3 rounded-xl border border-dashed border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white text-xs font-bold transition-all bg-zinc-800/40 hover:bg-zinc-800 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>دخول سريع كحساب تجريبي (Demo Account)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}