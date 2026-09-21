import { MessageCircle } from 'lucide-react';

export default function WhatsAppSupportButton({ darkMode, language = 'ar' }) {
  const isRtl = language === 'ar';
  const phoneNumber = '972594827189';
  const defaultMessage = isRtl
    ? 'مرحباً، أود الاستفسار عن منتجات متجر سفيان إياد'
    : 'Hello, I would like to inquire about products from SOFYANEYAD STORE';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(defaultMessage)}`;

  return (
    <div className={`fixed bottom-6 ${isRtl ? 'left-6' : 'right-6'} z-40`} dir={isRtl ? 'rtl' : 'ltr'}>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all group"
        title={isRtl ? 'تواصل معنا عبر واتساب (+972594827189)' : 'Chat on WhatsApp (+972594827189)'}
        aria-label={isRtl ? 'تواصل معنا عبر واتساب (+972594827189)' : 'Chat on WhatsApp (+972594827189)'}
      >
        <MessageCircle className="w-6 h-6 fill-white" />
      </a>
    </div>
  );
}
