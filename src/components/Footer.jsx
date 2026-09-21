import { useState } from 'react';
import { ShoppingBag, ShieldCheck, Headphones, Mail, Truck, RotateCcw, HelpCircle, X, MessageCircle } from 'lucide-react';

export default function Footer({ darkMode, language = 'ar', t }) {
  const currentYear = new Date().getFullYear();
  const [activePolicy, setActivePolicy] = useState(null);
  const isRtl = language === 'ar';

  const policyContent = {
    shipping: {
      title: isRtl ? 'سياسة الشحن والتوصيل' : 'Shipping & Delivery Policy',
      icon: Truck,
      details: isRtl ? [
        { subtitle: 'أوقات التجهيز والشحن', text: 'يتم تجهيز كافة الطلبات وتسليمها لشركة الشحن خلال 24 إلى 48 ساعة عمل كحد أقصى.' },
        { subtitle: 'تكلفة الشحن', text: 'شحن وتوصيل مباشر لكافة المحافظات والمناطق بأسعار مناسبة ومعاملة ممتازة.' },
        { subtitle: 'تتبع الشحنة', text: 'سيصلك رقم تتبع فوري عبر البريد الإلكتروني لمتابعة خط سير شحنتك لحظة بلحظة حتى وصولها لباب منزلك.' }
      ] : [
        { subtitle: 'Processing & Dispatch', text: 'All orders are processed and handed over to shipping couriers within 24 to 48 business hours.' },
        { subtitle: 'Shipping Rates', text: 'Direct and fast delivery to all regions with affordable rates and careful packaging.' },
        { subtitle: 'Shipment Tracking', text: 'You will receive an instant tracking link via email to follow your delivery status step by step.' }
      ]
    },
    returns: {
      title: isRtl ? 'سياسة الاسترجاع والاستبدال' : 'Return & Exchange Policy',
      icon: RotateCcw,
      details: isRtl ? [
        { subtitle: 'مهلة الاسترجاع (14 يوماً)', text: 'يحق لجميع عملائنا طلب استرجاع أو استبدال أي منتج خلال 14 يوماً من تاريخ استلام الطلب.' },
        { subtitle: 'حالة المنتج', text: 'يشترط أن يكون المنتج بحالته الأصلية غير مستخدم وفي عبوته وتغليفه الأصلي مع كامل الملحقات.' },
        { subtitle: 'استرداد الأموال', text: 'تتم إعادة الأموال بالكامل بنفس وسيلة الدفع الأصلية خلال 3 إلى 5 أيام عمل بعد فحص المنتج والتأكد من سلامته.' }
      ] : [
        { subtitle: '14-Day Return Window', text: 'All customers are entitled to request returns or exchanges within 14 days of receiving their package.' },
        { subtitle: 'Product Condition', text: 'Items must be returned in their original, unused condition with all tags and original packaging intact.' },
        { subtitle: 'Full Refunds', text: 'Refunds are issued using the original payment method within 3-5 business days upon item inspection.' }
      ]
    },
    faq: {
      title: isRtl ? 'الأسئلة الشائعة (FAQ)' : 'Frequently Asked Questions (FAQ)',
      icon: HelpCircle,
      details: isRtl ? [
        { subtitle: 'س: هل المنتجات أصلية ومضمونة؟', text: 'ج: نعم، جميع منتجات متجر سفيان إياد أصلية 100% ومفحوصة بدقة مع ضمان كامل للجودة.' },
        { subtitle: 'س: كيف يمكنني تتبع طلبي؟', text: 'ج: يمكنك التواصل معنا مباشرة عبر البريد الإلكتروني أو الواتساب لمتابعة التحديثات.' },
        { subtitle: 'س: ما هي وسائل الدفع المدعومة؟', text: 'ج: ندعم الدفع عند الاستلام بالإضافة إلى التحويلات والدفع الإلكتروني الآمن بالكامل.' }
      ] : [
        { subtitle: 'Q: Are all products genuine?', text: 'A: Yes, all products at SOFYANEYAD STORE are 100% authentic with quality warranty.' },
        { subtitle: 'Q: How can I track my order?', text: 'A: You can reach us directly via WhatsApp or email to get instant updates on your delivery.' },
        { subtitle: 'Q: What payment methods do you accept?', text: 'A: We support Cash on Delivery as well as safe and encrypted digital payments.' }
      ]
    },
    terms: {
      title: isRtl ? 'شروط الخدمة والخصوصية' : 'Terms of Service & Privacy',
      icon: ShieldCheck,
      details: isRtl ? [
        { subtitle: 'حماية وأمان البيانات', text: 'نلتزم التزاماً صارماً بأعلى معايير حماية البيانات الشخصية، ولا نقوم بمشاركة أي من بياناتك مع أطراف خارجية.' },
        { subtitle: 'المعاملات المشفرة', text: 'تتم كافة المعاملات عبر بروتوكولات حماية وتشفير قياسية تضمن سرية وأمان معلوماتك المالية.' },
        { subtitle: 'شروط الاستخدام', text: 'باستخدامك للمتجر، فإنك توافق على الالتزام بالقوانين المعمول بها وبشروط الاستخدام العادل للتسوق الآمن.' }
      ] : [
        { subtitle: 'Data Protection & Privacy', text: 'We strictly protect customer personal data and never share your details with unauthorized third parties.' },
        { subtitle: 'Encrypted Transactions', text: 'All transactions are secured with standard encryption to ensure maximum financial security.' },
        { subtitle: 'Fair Use Terms', text: 'By shopping with us, you agree to our fair terms of service and honest buyer conduct.' }
      ]
    }
  };

  return (
    <>
      <footer className={`mt-20 border-t transition-colors duration-300 ${
        darkMode ? 'bg-zinc-950 border-zinc-800/80 text-zinc-400' : 'bg-slate-50 border-slate-200 text-slate-600'
      }`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12 mb-12">
            
            {/* 1. Brand & About */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
                <span className={`font-black text-base tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  SOFYANEYAD STORE
                </span>
              </div>
              <p className="text-xs leading-relaxed max-w-sm">
                {t?.footer?.aboutDesc || (isRtl ? 'متجرك الموثوق لتسوق أحدث الإلكترونيات العصرية، الأجهزة الذكية، ومستلزمات الحياة اليومية بأعلى معايير الجودة والضمان.' : 'Your trusted store for the latest modern electronics, smart devices, and lifestyle gear with top quality assurance.')}
              </p>
              <div className="flex items-center gap-2.5 pt-1">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                  darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  {t?.footer?.guaranteedQuality || '✨ جودة مضمونة'}
                </span>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full border ${
                  darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  {t?.footer?.safeAndSecure || '🛡️ حماية وأمان'}
                </span>
              </div>
            </div>

            {/* 2. Customer Service Links */}
            <div>
              <h3 className={`font-black text-sm mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {t?.footer?.customerService || (isRtl ? 'خدمة العملاء' : 'Customer Service')}
              </h3>
              <ul className="space-y-3 text-xs font-semibold">
                <li>
                  <button 
                    type="button"
                    onClick={() => setActivePolicy('shipping')}
                    className={`flex items-center gap-2 transition-colors cursor-pointer ${isRtl ? 'text-right' : 'text-left'} ${
                      darkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-blue-600'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t?.footer?.shippingPolicy || (isRtl ? 'سياسة الشحن والتوصيل' : 'Shipping & Delivery Policy')}</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActivePolicy('returns')}
                    className={`flex items-center gap-2 transition-colors cursor-pointer ${isRtl ? 'text-right' : 'text-left'} ${
                      darkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-blue-600'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t?.footer?.returnPolicy || (isRtl ? 'سياسة الاسترجاع والاستبدال' : 'Return & Exchange Policy')}</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActivePolicy('faq')}
                    className={`flex items-center gap-2 transition-colors cursor-pointer ${isRtl ? 'text-right' : 'text-left'} ${
                      darkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-blue-600'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t?.footer?.faq || (isRtl ? 'الأسئلة الشائعة (FAQ)' : 'Frequently Asked Questions (FAQ)')}</span>
                  </button>
                </li>
                <li>
                  <button 
                    type="button"
                    onClick={() => setActivePolicy('terms')}
                    className={`flex items-center gap-2 transition-colors cursor-pointer ${isRtl ? 'text-right' : 'text-left'} ${
                      darkMode ? 'text-zinc-400 hover:text-white' : 'text-slate-600 hover:text-blue-600'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>{t?.footer?.terms || (isRtl ? 'شروط الخدمة والخصوصية' : 'Terms of Service & Privacy')}</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* 3. Contact & Support */}
            <div>
              <h3 className={`font-black text-sm mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {t?.footer?.contactUs || (isRtl ? 'تواصل معنا' : 'Contact Us')}
              </h3>
              <ul className="space-y-3.5 text-xs">
                <li>
                  <a 
                    href="https://wa.me/972594827189"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2.5 transition-colors group ${
                      darkMode ? 'text-zinc-300 hover:text-emerald-400' : 'text-slate-700 hover:text-emerald-600'
                    }`}
                    title={isRtl ? 'تواصل معنا عبر واتساب' : 'Chat via WhatsApp'}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      darkMode ? 'bg-zinc-900 border-zinc-800 text-emerald-400' : 'bg-white border-slate-200 text-emerald-600 shadow-sm'
                    }`}>
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-zinc-500 font-bold">{t?.footer?.directWhatsApp || 'واتساب المباشر'}</p>
                      <p className="font-bold underline underline-offset-4 truncate" dir="ltr">+972 59-482-7189</p>
                    </div>
                  </a>
                </li>

                <li>
                  <a 
                    href="mailto:sofyaneyad77@gmail.com"
                    className={`flex items-center gap-2.5 transition-colors group ${
                      darkMode ? 'text-zinc-300 hover:text-blue-400' : 'text-slate-700 hover:text-blue-600'
                    }`}
                    title={isRtl ? 'إرسال بريد إلكتروني' : 'Send Email'}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                      darkMode ? 'bg-zinc-900 border-zinc-800 text-blue-400' : 'bg-white border-slate-200 text-blue-600 shadow-sm'
                    }`}>
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] text-zinc-500 font-bold">{t?.footer?.directEmail || 'البريد الإلكتروني'}</p>
                      <p className="font-bold underline underline-offset-4 truncate" dir="ltr">sofyaneyad77@gmail.com</p>
                    </div>
                  </a>
                </li>

                <li className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    darkMode ? 'bg-zinc-900 border-zinc-800 text-emerald-400' : 'bg-white border-slate-200 text-emerald-600 shadow-sm'
                  }`}>
                    <Headphones className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500 font-bold">{t?.footer?.support247 || 'خدمة العملاء'}</p>
                    <p className={`font-bold ${darkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {t?.footer?.support247Desc || 'دعم فني واستفسارات 24/7'}
                    </p>
                  </div>
                </li>

                <li className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                    darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
                  }`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[11px] text-zinc-500 font-bold">{t?.footer?.securityGuaranteed || 'الأمان والضمان'}</p>
                    <p className={`font-bold ${darkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
                      {t?.footer?.securityGuaranteedDesc || 'تسوق آمن ومحمي 100%'}
                    </p>
                  </div>
                </li>
              </ul>
            </div>

          </div>

          {/* Bottom Copyright Strip */}
          <div className={`pt-8 border-t flex flex-col items-center justify-center text-center text-xs space-y-1 ${
            darkMode ? 'border-zinc-800/80 text-zinc-500' : 'border-slate-200 text-slate-500'
          }`}>
            <p className="font-semibold tracking-wide">
              {t?.footer?.copyright || `© ${currentYear} SOFYANEYAD STORE. All rights reserved.`}
            </p>
          </div>

        </div>
      </footer>

      {/* Customer Service Interactive Modal */}
      {activePolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/65 backdrop-blur-sm transition-opacity" 
            onClick={() => setActivePolicy(null)} 
          />
          
          <div className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl z-10 border transition-all ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`} dir={isRtl ? 'rtl' : 'ltr'}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  darkMode ? 'bg-zinc-800 text-blue-400' : 'bg-slate-100 text-blue-600'
                }`}>
                  {(() => {
                    const IconComponent = policyContent[activePolicy]?.icon;
                    return IconComponent ? <IconComponent className="w-5 h-5" /> : null;
                  })()}
                </div>
                <h3 className="font-black text-base">
                  {policyContent[activePolicy]?.title}
                </h3>
              </div>

              <button 
                type="button"
                onClick={() => setActivePolicy(null)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  darkMode ? 'text-zinc-400 hover:text-white bg-zinc-800' : 'text-slate-500 hover:text-slate-900 bg-slate-100'
                }`}
                title={isRtl ? 'إغلاق' : 'Close'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className={`space-y-4 max-h-[60vh] overflow-y-auto ${isRtl ? 'pr-1' : 'pl-1'}`}>
              {policyContent[activePolicy]?.details.map((item, idx) => (
                <div 
                  key={idx} 
                  className={`p-4 rounded-2xl border ${
                    darkMode ? 'bg-zinc-950/70 border-zinc-800' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <h4 className="font-bold text-xs mb-1.5 text-blue-600 dark:text-blue-400">
                    {item.subtitle}
                  </h4>
                  <p className={`text-xs leading-relaxed ${darkMode ? 'text-zinc-300' : 'text-slate-600'}`}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            {/* Modal Footer */}
            <div className={`mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 flex ${isRtl ? 'justify-end' : 'justify-end'}`}>
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="px-5 py-2.5 rounded-2xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
              >
                {isRtl ? 'إغلاق' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
