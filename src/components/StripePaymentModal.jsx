import { useState, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  CreditCard, 
  CheckCircle2, 
  Loader2, 
  Smartphone
} from 'lucide-react';
import { formatPrice } from '../config/currencies';
import { 
  STRIPE_TEST_CARDS, 
  detectCardBrand, 
  formatCardNumber, 
  formatExpiryDate, 
  validateExpiryDate, 
  generateTransactionId 
} from '../config/stripeConfig';
import toast from 'react-hot-toast';
import useBodyScrollLock from '../hooks/useBodyScrollLock';

export default function StripePaymentModal({
  isOpen,
  onClose,
  finalTotal = 0,
  rawSubtotal = 0,
  shippingCost = 0,
  discountAmount = 0,
  appliedCoupon = null,
  selectedArea = null,
  totalItems = 0,
  onPaymentSuccess,
  darkMode = true,
  isRtl = true,
  user = null
}) {
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card' | 'wallet'
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  // Lock body/html scroll when modal is open
  useBodyScrollLock(isOpen);
  const [cardHolder, setCardHolder] = useState(user?.displayName || user?.name || '');
  
  // Processing & Success states
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [transactionDetails, setTransactionDetails] = useState(null);

  // Approximate NIS rate: 1 USD ~ 3.65 NIS
  const totalNIS = (finalTotal * 3.65).toFixed(2);

  // Close on Escape
  useEffect(() => {
    if (!isOpen || isProcessing) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isProcessing, onClose]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setIsSuccess(false);
      setTransactionDetails(null);
      setCardNumber('');
      setExpiry('');
      setCvc('');
      setCardHolder(user?.displayName || user?.name || '');
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const cardBrand = detectCardBrand(cardNumber);

  // 1-Click fill for official Stripe Test Card
  const handleFillTestCard = () => {
    const test = STRIPE_TEST_CARDS.success;
    setCardNumber(test.number);
    setExpiry(test.exp);
    setCvc(test.cvc);
    setCardHolder(user?.displayName || user?.name || test.name);
    toast.success('تمت تعبئة بيانات بطاقة Stripe التجريبية', {
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

  const handleSubmit = (e) => {
    e.preventDefault();

    if (paymentMethod === 'card') {
      const cleanNum = cardNumber.replace(/\s+/g, '');
      if (cleanNum.length < 15) {
        toast.error('يرجى إدخال رقم بطاقة صحيح مكون من 16 رقماً');
        return;
      }
      if (!validateExpiryDate(expiry)) {
        toast.error('تاريخ انتهاء البطاقة غير صالح');
        return;
      }
      if (cvc.length < 3) {
        toast.error('رمز الأمان CVC غير صالح');
        return;
      }
      if (!cardHolder.trim()) {
        toast.error('يرجى إدخال اسم حامل البطاقة');
        return;
      }
    }

    setIsProcessing(true);

    // Realistic Stripe processing simulation (1.8 seconds)
    setTimeout(() => {
      const txId = generateTransactionId();
      const details = {
        transactionId: txId,
        amountUSD: finalTotal,
        amountNIS: totalNIS,
        date: new Date().toLocaleString(isRtl ? 'ar-EG' : 'en-US'),
        cardLast4: cardNumber.replace(/\s+/g, '').slice(-4) || '4242',
        cardBrand: cardBrand === 'generic' ? 'Visa' : cardBrand.toUpperCase(),
        areaName: selectedArea?.name || 'قطاع غزة'
      };

      setTransactionDetails(details);
      setIsProcessing(false);
      setIsSuccess(true);

      if (onPaymentSuccess) {
        onPaymentSuccess(details);
      }
    }, 1800);
  };

  const handleWalletPay = (walletName = 'Google Pay') => {
    setIsProcessing(true);

    setTimeout(() => {
      const txId = generateTransactionId();
      const details = {
        transactionId: txId,
        amountUSD: finalTotal,
        amountNIS: totalNIS,
        date: new Date().toLocaleString(isRtl ? 'ar-EG' : 'en-US'),
        cardLast4: '8890',
        cardBrand: walletName,
        areaName: selectedArea?.name || 'قطاع غزة'
      };

      setTransactionDetails(details);
      setIsProcessing(false);
      setIsSuccess(true);

      if (onPaymentSuccess) {
        onPaymentSuccess(details);
      }
    }, 1500);
  };

  return (
    <div 
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 overflow-y-auto overscroll-contain"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity" 
        onClick={() => { if (!isProcessing) onClose(); }} 
        onWheel={(e) => e.stopPropagation()}
      />

      {/* Modal Container */}
      <div className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden z-10 transition-all duration-300 flex flex-col max-h-[92vh] ${
        darkMode 
          ? 'bg-zinc-900 border-zinc-800 text-zinc-100' 
          : 'bg-white border-slate-200 text-slate-900'
      }`}>

        {/* Modal Header */}
        <div className={`px-6 py-4 border-b flex justify-between items-center shrink-0 ${
          darkMode ? 'border-zinc-800 bg-zinc-950/60' : 'border-slate-100 bg-slate-50'
        }`}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black">
                بوابة الدفع الآمنة
              </h3>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                darkMode ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-slate-200 text-slate-700 border-slate-300'
              }`}>
                Stripe
              </span>
            </div>
            <p className={`text-[11px] mt-0.5 ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              معاملة مشفرة بتقنية 256-bit SSL لحماية بياناتك
            </p>
          </div>

          {!isProcessing && (
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
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Success View */}
        {isSuccess ? (
          <div className="p-6 sm:p-8 text-center space-y-5 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400">
                تم الدفع بنجاح!
              </h4>
              <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                تم استلام دفعتك وتأكيد طلبك وجاري تحضيره للتوصيل
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className={`p-4 rounded-2xl border text-xs text-right space-y-2.5 ${
              darkMode ? 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}>
              <div className={`flex justify-between items-center pb-2 border-b ${
                darkMode ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-500'
              }`}>
                <span>رقم العملية المرجعي:</span>
                <span className="font-mono font-bold select-all">
                  {transactionDetails?.transactionId}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className={darkMode ? 'text-zinc-400' : 'text-slate-500'}>المبلغ المدفوع:</span>
                <span className="font-bold text-sm font-mono text-emerald-500">
                  {formatPrice(transactionDetails?.amountUSD)} ({transactionDetails?.amountNIS} ₪)
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className={darkMode ? 'text-zinc-400' : 'text-slate-500'}>طريقة الدفع:</span>
                <span className="font-semibold">
                  {transactionDetails?.cardBrand} •••• {transactionDetails?.cardLast4}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className={darkMode ? 'text-zinc-400' : 'text-slate-500'}>منطقة التوصيل:</span>
                <span className="font-bold">
                  {transactionDetails?.areaName}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`w-full py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer shadow-md ${
                darkMode 
                  ? 'bg-white hover:bg-zinc-200 text-zinc-950' 
                  : 'bg-slate-900 hover:bg-black text-white'
              }`}
            >
              متابعة التسوق
            </button>
          </div>
        ) : isProcessing ? (
          /* Processing Loading View */
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-600/10 text-blue-500 flex items-center justify-center mx-auto border border-blue-500/20 animate-pulse">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black">
                جاري معالجة الدفع عبر خوادم Stripe الآمنة...
              </h4>
              <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                يرجى الانتظار وعدم إغلاق النافذة أثناء تأكيد العملية
              </p>
            </div>
          </div>
        ) : (
          /* Payment Form View */
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">

            {/* Order Price Snapshot */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              darkMode ? 'bg-zinc-950/60 border-zinc-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div>
                <span className={`text-[11px] block font-medium ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                  إجمالي الفاتورة المطلوب دفعها:
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-lg font-black font-mono text-blue-600 dark:text-blue-400">
                    {formatPrice(finalTotal)}
                  </span>
                  <span className={`text-xs font-bold font-mono ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                    ({totalNIS} ₪)
                  </span>
                </div>
              </div>

              {selectedArea && (
                <div className="text-left">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-lg border block ${
                    darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-white border-slate-200 text-slate-700'
                  }`}>
                    {selectedArea.name.split('-')[1]?.trim() || selectedArea.name}
                  </span>
                  <span className={`text-[10px] mt-1 block font-medium ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                    {shippingCost === 0 ? 'توصيل مجاني' : `شحن: ${formatPrice(shippingCost)}`}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Method Selector Tabs */}
            <div className={`grid grid-cols-2 gap-1.5 p-1 rounded-2xl border ${
              darkMode ? 'bg-zinc-950 border-zinc-800' : 'bg-slate-100 border-slate-200'
            }`}>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  paymentMethod === 'card'
                    ? (darkMode 
                        ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700' 
                        : 'bg-white text-slate-900 shadow-xs border border-slate-200')
                    : (darkMode 
                        ? 'text-zinc-400 hover:text-zinc-200' 
                        : 'text-slate-500 hover:text-slate-800')
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>بطاقة ائتمانية / بنكية</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('wallet')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  paymentMethod === 'wallet'
                    ? (darkMode 
                        ? 'bg-zinc-800 text-white shadow-xs border border-zinc-700' 
                        : 'bg-white text-slate-900 shadow-xs border border-slate-200')
                    : (darkMode 
                        ? 'text-zinc-400 hover:text-zinc-200' 
                        : 'text-slate-500 hover:text-slate-800')
                }`}
              >
                <Smartphone className="w-4 h-4" />
                <span>Apple / Google Pay</span>
              </button>
            </div>

            {paymentMethod === 'wallet' ? (
              /* Wallet Quick Pay: Tailored for Dark and Light Modes */
              <div className="py-2 space-y-3.5">
                <div className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                  darkMode ? 'bg-zinc-950/60 border-zinc-800 text-zinc-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <p className={`font-bold mb-1 flex items-center gap-1.5 ${darkMode ? 'text-zinc-200' : 'text-slate-800'}`}>
                    <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>الدفع السريع والمباشر (Express Checkout):</span>
                  </p>
                  <span>يتم سحب المبلغ بأمان عبر المحافظ الرقمية المعتمدة بربط آمن ومباشر مع Stripe دون الحاجة لإدخال بيانات البطاقة يدوياً.</span>
                </div>

                {/* Apple Pay Button (الدفع الفوري) - Authentic Official HIG Design */}
                <button
                  type="button"
                  onClick={() => handleWalletPay('Apple Pay')}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] shadow-sm ${
                    darkMode
                      ? 'bg-white hover:bg-neutral-100 text-black border border-white shadow-md'
                      : 'bg-black hover:bg-neutral-900 text-white border border-black shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-1.5 shrink-0">
                    <svg className="w-4.5 h-4.5 fill-current shrink-0 -mt-0.5" viewBox="0 0 24 24" aria-label="Apple">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.38c.62-.75 1.04-1.8 1.01-2.88 0-.08-.01-.15-.02-.21-.97.04-2.12.65-2.8 1.45-.58.68-1.1 1.76-.96 2.81.04.02.08.03.13.03.95 0 2.02-.45 2.64-1.2z" />
                    </svg>
                    <span className="font-bold text-sm tracking-tight">Pay</span>
                  </div>
                  <span className={darkMode ? 'text-zinc-400' : 'text-neutral-500'}>•</span>
                  <span>الدفع الفوري ({formatPrice(finalTotal)})</span>
                </button>

                {/* GPay Button (الدفع السريع) - Authentic Google Design */}
                <button
                  type="button"
                  onClick={() => handleWalletPay('Google Pay')}
                  className={`w-full py-3.5 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.99] shadow-sm ${
                    darkMode
                      ? 'bg-black hover:bg-neutral-900 text-white border border-zinc-700 shadow-zinc-950/40'
                      : 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 hover:border-slate-400 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-1.5 shrink-0">
                    <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" aria-label="Google">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span className={`font-bold text-sm tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>Pay</span>
                  </div>
                  <span className={darkMode ? 'text-zinc-600' : 'text-slate-300'}>•</span>
                  <span>الدفع السريع ({formatPrice(finalTotal)})</span>
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`text-xs font-bold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                      darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>أو ادفع بإدخال بيانات البطاقة يدوياً (Visa / MasterCard)</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Credit Card Form */
              <div className="space-y-3.5">
                
                {/* Interactive Credit Card Graphic Preview */}
                <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden shadow-lg ${
                  darkMode 
                    ? 'bg-gradient-to-br from-zinc-850 via-zinc-900 to-black border-zinc-700/80 text-white shadow-black/30' 
                    : 'bg-gradient-to-br from-slate-900 via-[#1e1b4b] to-slate-900 border-slate-700/90 text-white shadow-indigo-950/15'
                }`}>
                  {/* Soft ambient light glow */}
                  <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex justify-between items-start mb-4">
                    {/* Card Chip & Contactless */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-6 rounded-md bg-gradient-to-r from-amber-400 to-amber-200 shadow-xs border border-amber-300/60 flex items-center justify-center">
                        <div className="w-5 h-3 border border-amber-600/40 rounded-xs grid grid-cols-2" />
                      </div>
                      <svg className="w-4 h-4 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M8.5 16.5a5 5 0 0 1 0-9" />
                        <path d="M12 19a8.5 8.5 0 0 0 0-14" />
                      </svg>
                    </div>

                    {/* Brand Logo */}
                    <div className="h-6 flex items-center">
                      {cardBrand === 'visa' && (
                        <span className="font-black italic text-lg tracking-wider text-blue-400">VISA</span>
                      )}
                      {cardBrand === 'mastercard' && (
                        <div className="flex -space-x-2">
                          <div className="w-5 h-5 rounded-full bg-rose-500/90" />
                          <div className="w-5 h-5 rounded-full bg-amber-400/90" />
                        </div>
                      )}
                      {cardBrand === 'generic' && (
                        <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">STRIPE SECURE</span>
                      )}
                    </div>
                  </div>

                  {/* Card Number live preview */}
                  <div className="font-mono text-sm sm:text-base font-bold tracking-widest text-zinc-100 my-2 dir-ltr text-left">
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  {/* Bottom Card Info: Cardholder & Expiry */}
                  <div className="flex justify-between items-end text-[10px] text-zinc-300 pt-1">
                    <div className="truncate max-w-[65%]">
                      <span className="text-[9px] text-zinc-400 block uppercase">حامل البطاقة</span>
                      <span className="font-bold truncate block">{cardHolder || 'اسم العميل'}</span>
                    </div>
                    <div className="text-left font-mono">
                      <span className="text-[9px] text-zinc-400 block uppercase">الانتهاء</span>
                      <span className="font-bold">{expiry || 'MM/YY'}</span>
                    </div>
                  </div>
                </div>

                {/* 1-Click Test Card Button - Human-Crafted Neutral Styling */}
                <div className="flex justify-between items-center pt-1">
                  <span className={`text-xs font-bold ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                    بيانات البطاقة البنكية:
                  </span>
                  <button
                    type="button"
                    onClick={handleFillTestCard}
                    className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 active:scale-98 shadow-2xs ${
                      darkMode 
                        ? 'bg-zinc-800/90 hover:bg-zinc-750 text-zinc-200 hover:text-white border-zinc-700/80 hover:border-zinc-600' 
                        : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-900 border-slate-300/80 hover:border-slate-400'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5 opacity-70" />
                    <span>تعبئة بطاقة Stripe التجريبية</span>
                    <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${
                      darkMode 
                        ? 'bg-zinc-900 text-zinc-300 border-zinc-700' 
                        : 'bg-white text-slate-800 border-slate-300 shadow-2xs'
                    }`}>
                      4242
                    </span>
                  </button>
                </div>

                {/* Card Number Input with Live Brand detection */}
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold block ${darkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
                    رقم البطاقة (Card Number)
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      className={`w-full h-11 px-3.5 pr-11 rounded-xl text-xs font-mono font-bold tracking-wider transition-all outline-none border ${
                        darkMode 
                          ? 'bg-zinc-800/80 border-zinc-700 text-white placeholder-zinc-500 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900/15 shadow-2xs'
                      }`}
                    />
                    <div className="absolute right-3 pointer-events-none flex items-center gap-1">
                      {cardBrand === 'visa' && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                          darkMode ? 'text-blue-400 bg-blue-500/20 border-blue-500/30' : 'text-blue-700 bg-blue-50 border-blue-200'
                        }`}>VISA</span>
                      )}
                      {cardBrand === 'mastercard' && (
                        <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border ${
                          darkMode ? 'text-amber-400 bg-amber-500/20 border-amber-500/30' : 'text-amber-800 bg-amber-50 border-amber-200'
                        }`}>MC</span>
                      )}
                      {cardBrand === 'generic' && (
                        <CreditCard className="w-4 h-4 text-zinc-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expiry & CVC Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold block ${darkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
                      تاريخ الانتهاء (MM/YY)
                    </label>
                    <input
                      type="text"
                      required
                      value={expiry}
                      onChange={(e) => setExpiry(formatExpiryDate(e.target.value))}
                      placeholder="12/28"
                      maxLength={5}
                      className={`w-full h-11 px-3.5 rounded-xl text-xs font-mono font-bold transition-all outline-none border ${
                        darkMode 
                          ? 'bg-zinc-800/80 border-zinc-700 text-white placeholder-zinc-500 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20' 
                          : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900/15 shadow-2xs'
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className={`text-[11px] font-bold block ${darkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
                      رمز الأمان (CVC)
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="password"
                        required
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D+/g, '').slice(0, 4))}
                        placeholder="123"
                        maxLength={4}
                        className={`w-full h-11 px-3.5 pr-9 rounded-xl text-xs font-mono font-bold transition-all outline-none border ${
                          darkMode 
                            ? 'bg-zinc-800/80 border-zinc-700 text-white placeholder-zinc-500 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20' 
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900/15 shadow-2xs'
                        }`}
                      />
                      <Lock className="w-3.5 h-3.5 text-zinc-400 absolute right-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Cardholder Name */}
                <div className="space-y-1">
                  <label className={`text-[11px] font-bold block ${darkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
                    اسم حامل البطاقة (Cardholder Name)
                  </label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="الاسم كما هو مطبوع على البطاقة"
                    className={`w-full h-11 px-3.5 rounded-xl text-xs font-bold transition-all outline-none border ${
                      darkMode 
                        ? 'bg-zinc-800/80 border-zinc-700 text-white placeholder-zinc-500 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400/20' 
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-slate-900 focus:ring-1 focus:ring-slate-900/15 shadow-2xs'
                    }`}
                  />
                </div>

                {/* Security Footnote */}
                <div className={`pt-2 flex items-center justify-between text-[10.5px] ${
                  darkMode ? 'text-zinc-400' : 'text-slate-500'
                }`}>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>تشفير 256-bit SSL بنكي آمن</span>
                  </div>
                  <span className="font-bold">Powered by Stripe</span>
                </div>

                {/* Submit Pay Button - Human-Crafted High Contrast Store Aesthetic */}
                <button
                  type="submit"
                  className={`w-full py-3.5 rounded-2xl font-black text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] mt-2 ${
                    darkMode
                      ? 'bg-white hover:bg-neutral-100 text-zinc-950 border border-white shadow-black/20'
                      : 'bg-slate-900 hover:bg-black text-white border border-slate-900 shadow-slate-900/10'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>
                    دفع {formatPrice(finalTotal)} بأمان عبر Stripe
                  </span>
                </button>

              </div>
            )}

          </form>
        )}

      </div>
    </div>
  );
}
