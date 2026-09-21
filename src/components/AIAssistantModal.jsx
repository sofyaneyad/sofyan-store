import { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Sparkles, 
  Gift, 
  Star, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  ShoppingBag, 
  Tag, 
  ExternalLink, 
  Plus, 
  Maximize2, 
  Minimize2, 
  ChevronDown, 
  MessageSquare,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { formatPrice } from '../config/currencies';
import { COUPONS } from '../config/coupons';
import { generateAIResponse } from '../services/aiAdvisorService';
import { getStoredFlashDealsState, getFlashDealProductIds } from '../config/flashDealsConfig';
import toast from 'react-hot-toast';

export default function AIAssistantModal({ 
  products = [], 
  handleAddToCart, 
  onViewDetails, 
  darkMode,
  user = null,
  cart = [],
  appliedCoupon = null,
  onApplyCoupon,
  onOpenCart
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'mystery' | 'topRated'
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [addedProductIds, setAddedProductIds] = useState([]);

  // Pagination & Load More states (Max 3 products at a time)
  const [topRatedLimit, setTopRatedLimit] = useState(3);
  const [expandedMessageProducts, setExpandedMessageProducts] = useState({});

  // Proactive coupon alert state
  const [pendingAlert, setPendingAlert] = useState(null);
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const alertedTiersRef = useRef(new Set());

  // Mystery Box / Gamified Gift State
  const [isGiftOpened, setIsGiftOpened] = useState(false);
  const [revealedGift, setRevealedGift] = useState(null);
  const [isOpeningGift, setIsOpeningGift] = useState(false);

  // Voice & Speech
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  // Feedback & Copy
  const [feedbacks, setFeedbacks] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Format Time
  const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // Top Rated Products (Full list for the top rated tab)
  const topRatedProducts = useMemo(() => {
    return [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 15);
  }, [products]);

  // Initial Welcome Messages
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: 'مرحباً بك في متجر سفيان إياد! 👋 يسعدني تواجدك، أنا مستشارك الخاص لمساعدتك في اختيار أفضل المنتجات، معرفة تفاصيل الشحن والضمان، وتقديم عروض حصرية تناسبك.',
      timestamp: 'الآن'
    },
    {
      id: 'welcome-2',
      sender: 'bot',
      text: 'كيف تحب أن نبدأ اليوم؟ يمكنك تجربة الاقتراحات السريعة أو فتح صندوق الهدايا اليومي أو سؤالي مباشرة:',
      quickReplies: [
        { label: '⭐ الأكثر تقييماً', query: 'الأكثر تقييماً' },
        { label: '🔥 أقوى العروض', query: 'أقوى العروض' },
        { label: '💰 الأفضل بسعر مناسب', query: 'الأفضل بسعر مناسب' },
        { label: '🔎 ساعدني أختار', query: 'ساعدني أختار' },
        { label: '🚚 الشحن والتوصيل', query: 'الشحن والتوصيل' },
        { label: '💳 الدفع والتقسيط', query: 'الدفع والتقسيط' }
      ],
      timestamp: 'الآن'
    }
  ]);

  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !isMinimized && activeTab === 'chat') {
      scrollToBottom();
    }
  }, [messages, isOpen, isMinimized, isTyping, activeTab]);

  // Auto-populate welcome-2 with top rated products (6 items, will display 3 with load more)
  useEffect(() => {
    if (products && products.length > 0) {
      setMessages(prev => {
        return prev.map(m => {
          if (m.id === 'welcome-2' && (!m.products || m.products.length === 0)) {
            const top6 = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);
            return {
              ...m,
              products: top6
            };
          }
          return m;
        });
      });
    }
  }, [products]);

  // Subtotal & Threshold alerts strictly inside the assistant
  const safeCart = Array.isArray(cart) ? cart : [];
  const rawSubtotal = safeCart.reduce((sum, item) => sum + (Number(item?.price || 0) * Number(item?.quantity || 1)), 0);

  // Exclude flash deal products from percentage coupon unlocks
  const activeDealIds = useMemo(() => {
    try {
      const dealsState = getStoredFlashDealsState();
      return getFlashDealProductIds(products || [], dealsState?.cycle || 0);
    } catch {
      return [];
    }
  }, [products]);

  const isItemDeal = (item) => {
    if (item?.isDealProduct) return true;
    return activeDealIds.includes(String(item?.id));
  };

  const eligibleSubtotal = safeCart
    .filter(item => !isItemDeal(item))
    .reduce((sum, item) => sum + (Number(item?.price || 0) * Number(item?.quantity || 1)), 0);

  useEffect(() => {
    if (eligibleSubtotal >= 200 && !alertedTiersRef.current.has('200')) {
      alertedTiersRef.current.add('200');
      const alertMsg = {
        id: `coupon-alert-200-${Date.now()}`,
        sender: 'bot',
        isSpecialAlert: true,
        tier: 200,
        couponCode: 'SOFYAN20',
        title: 'أعلى نسبة خصم متاحة لك الآن (20%)! 🔥',
        text: `🔥 مذهل! مشترياتك المؤهلة في السلة بلغت ${formatPrice(eligibleSubtotal)}. لقد فتحت الآن أعلى كود خصم في المتجر (SOFYAN20) لخصم 20% كاملة على المنتجات المؤهلة!`,
        timestamp: getCurrentTime()
      };
      setMessages(prev => [...prev, alertMsg]);
      setPendingAlert({
        tier: 200,
        code: 'SOFYAN20',
        text: `🔥 كود SOFYAN20 لخصم 20% أصبح متاحاً لك!`
      });
      setUnreadAlertsCount(prev => prev + 1);
    } else if (eligibleSubtotal >= 100 && eligibleSubtotal < 200 && !alertedTiersRef.current.has('100')) {
      alertedTiersRef.current.add('100');
      const alertMsg = {
        id: `coupon-alert-100-${Date.now()}`,
        sender: 'bot',
        isSpecialAlert: true,
        tier: 100,
        couponCode: 'SOFYAN10',
        title: 'كود خصم 10% أصبح متاحاً لك! 🎉',
        text: `🎉 رائع! مشترياتك المؤهلة في السلة بلغت ${formatPrice(eligibleSubtotal)}. أصبح معك الآن كود خصم 10% (SOFYAN10)! بإمكانك تفعيله فوراً على المنتجات المؤهلة.`,
        timestamp: getCurrentTime()
      };
      setMessages(prev => [...prev, alertMsg]);
      setPendingAlert({
        tier: 100,
        code: 'SOFYAN10',
        text: `🎉 كود خصم 10% (SOFYAN10) أصبح جاهزاً للتفعيل!`
      });
      setUnreadAlertsCount(prev => prev + 1);
    } else if (rawSubtotal >= 50 && rawSubtotal < 100 && !alertedTiersRef.current.has('50')) {
      alertedTiersRef.current.add('50');
      const alertMsg = {
        id: `coupon-alert-50-${Date.now()}`,
        sender: 'bot',
        isSpecialAlert: true,
        tier: 50,
        couponCode: 'FREE',
        title: 'كود الشحن المجاني أصبح متاحاً لك! 🚚',
        text: `🚚 مبروك! إجمالي مشترياتك في السلة بلغت ${formatPrice(50)}. فتحت الآن كود الشحن المجاني (FREE)! بإمكانك تفعيله لتوصيل طلبك مجاناً.`,
        timestamp: getCurrentTime()
      };
      setMessages(prev => [...prev, alertMsg]);
      setPendingAlert({
        tier: 50,
        code: 'FREE',
        text: `🚚 كود الشحن المجاني (FREE) أصبح متاحاً لك!`
      });
      setUnreadAlertsCount(prev => prev + 1);
    }

    if (eligibleSubtotal < 200) alertedTiersRef.current.delete('200');
    if (eligibleSubtotal < 100) alertedTiersRef.current.delete('100');
    if (rawSubtotal < 50) alertedTiersRef.current.delete('50');
  }, [rawSubtotal, eligibleSubtotal]);

  const handleOpenAssistant = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setPendingAlert(null);
    setUnreadAlertsCount(0);
  };

  // Voice Recognition setup
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ar-SA';

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputValue(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      toast.error('خاصية الإدخال الصوتي غير مدعومة في متصفحك الحالي');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // Text-To-Speech (TTS)
  const toggleSpeak = (id, text) => {
    if (!('speechSynthesis' in window)) {
      toast.error('خاصية القراءة الصوتية غير مدعومة في متصفحك');
      return;
    }

    if (speakingMessageId === id) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`~•-]/g, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingMessageId(null);
    utterance.onerror = () => setSpeakingMessageId(null);

    setSpeakingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  // Copy text handler
  const handleCopyMessage = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success('تم نسخ النص بنجاح');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Feedback handler
  const handleFeedback = (id, type) => {
    setFeedbacks(prev => ({
      ...prev,
      [id]: prev[id] === type ? null : type
    }));
    toast.success('شكراً على تقييمك لمساعدنا! ❤️');
  };

  // Send message
  const handleSendMessage = (textToSend = null) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: getCurrentTime()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateAIResponse(query, {
        products,
        user,
        cart: safeCart
      });

      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: response.text,
        quickReplies: response.quickReplies || [],
        products: response.products || [],
        timestamp: getCurrentTime()
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  // Load more handler for chat messages
  const handleLoadMoreForMessage = (msgId) => {
    setExpandedMessageProducts(prev => ({
      ...prev,
      [msgId]: (prev[msgId] || 3) + 3
    }));
  };

  // Add to cart with feedback
  const handleChatAddToCart = (prod) => {
    if (handleAddToCart) {
      handleAddToCart(prod);
      setAddedProductIds(prev => [...prev, prod.id]);
      setTimeout(() => {
        setAddedProductIds(prev => prev.filter(id => id !== prod.id));
      }, 2500);
    }
  };

  // Open Mystery Gift Box
  const handleOpenMysteryGift = () => {
    if (isOpeningGift || isGiftOpened) return;
    setIsOpeningGift(true);

    setTimeout(() => {
      const gifts = [
        {
          code: 'SOFYAN20',
          coupon: COUPONS.SOFYAN20,
          title: 'كود خصم 20% فوري! 🔥',
          desc: 'مبروك! ربحت أعلى نسبة خصم في المتجر على طلبك بقيمة 200$ فأكثر.'
        },
        {
          code: 'SOFYAN10',
          coupon: COUPONS.SOFYAN10,
          title: 'كود خصم 10% فوري! 🎉',
          desc: 'مبروك! ربحت كود خصم 10% على طلبك بقيمة 100$ فأكثر.'
        },
        {
          code: 'FREE',
          coupon: COUPONS.FREE,
          title: 'كود الشحن المجاني! 🚚',
          desc: 'مبروك! ربحت توصيلاً مجانياً بالكامل لطلبك بقيمة 50$ فأكثر.'
        }
      ];

      const chosen = gifts[Math.floor(Math.random() * gifts.length)];
      setRevealedGift(chosen);
      setIsOpeningGift(false);
      setIsGiftOpened(true);
      toast.success(`مبروك! ربحت ${chosen.title}`);
    }, 1200);
  };

  return (
    <>
      {/* 1. Floating Launcher Button (In Bottom Corner) */}
      {!isOpen && (
        <div className="fixed bottom-5 left-4 sm:left-6 z-40" dir="rtl">
          
          {/* Proactive Floating Bubble if user earned a coupon */}
          {pendingAlert && (
            <div 
              onClick={handleOpenAssistant}
              className={`absolute -top-14 right-0 sm:right-auto sm:left-0 px-4 py-2.5 rounded-2xl shadow-xl border text-xs font-bold flex items-center gap-2.5 cursor-pointer transition-all hover:scale-105 select-none whitespace-nowrap animate-bounce z-50 ${
                darkMode
                  ? 'bg-zinc-900 border-zinc-700 text-white shadow-black/80'
                  : 'bg-white border-slate-300 text-slate-900 shadow-slate-300/80'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span>{pendingAlert.text}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPendingAlert(null);
                }}
                className="p-0.5 rounded-full hover:bg-zinc-500/20 text-zinc-400 hover:text-white"
                title="إغلاق"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Main Launcher Pill */}
          <button
            type="button"
            onClick={handleOpenAssistant}
            className={`group relative flex items-center gap-3 px-4 sm:px-5 py-3 rounded-2xl shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-0.5 active:scale-95 border select-none ${
              darkMode
                ? 'bg-[#111318]/95 hover:bg-[#161822] border-zinc-800/90 text-white shadow-black/50'
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-900 shadow-slate-200/80'
            }`}
            title="مستشار التسوق"
          >
            {/* Elegant Gradient Emblem */}
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
              <Sparkles className="w-4 h-4" />
              {unreadAlertsCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm animate-pulse">
                  {unreadAlertsCount}
                </span>
              )}
            </div>

            <div className="flex flex-col text-right">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-tight">مستشارك للتسوق</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </div>
              <span className={`text-[11px] font-medium ${darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
                {pendingAlert ? 'معك كود خصم متاح!' : 'عروض وهدايا حصرية 🎁'}
              </span>
            </div>
          </button>
        </div>
      )}

      {/* 2. Interactive Concierge Window */}
      {isOpen && (
        <div 
          className={`fixed bottom-4 left-3 sm:left-6 z-50 rounded-3xl shadow-2xl border flex flex-col overflow-hidden transition-all duration-300 backdrop-blur-xl ${
            isMinimized 
              ? 'h-14 w-72 sm:w-84' 
              : isExpanded 
                ? 'w-[96vw] max-w-2xl h-[88vh]' 
                : 'w-[94vw] sm:w-[460px] h-[82vh] max-h-[660px]'
          } ${
            darkMode 
              ? 'bg-[#101217] border-zinc-800/90 text-white shadow-black/90' 
              : 'bg-[#fcfdfe] border-slate-200 text-slate-900 shadow-slate-300/60'
          }`}
          dir="rtl"
        >
          {/* Header Bar */}
          {isMinimized ? (
            /* Minimized View: Clean, single-line centered pill */
            <div className={`w-full h-full px-4 flex items-center justify-between select-none ${
              darkMode ? 'bg-[#14161f] text-white' : 'bg-white text-slate-900'
            }`}>
              <div 
                onClick={() => setIsMinimized(false)}
                className="flex items-center gap-2.5 cursor-pointer min-w-0 flex-1 hover:opacity-90 transition-opacity"
                title="اضغط لتكبير المساعد"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs sm:text-sm font-black whitespace-nowrap">مستشارك للتسوق</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-zinc-400 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMinimized(false)}
                  className="p-1.5 rounded-xl hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                  title="استعادة النافذة"
                >
                  <ChevronDown className="w-4 h-4 rotate-180" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (window.speechSynthesis) window.speechSynthesis.cancel();
                    setSpeakingMessageId(null);
                  }}
                  className="p-1.5 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            /* Full Open Header */
            <div className={`px-4 sm:px-5 py-3.5 border-b flex items-center justify-between shrink-0 select-none ${
              darkMode ? 'bg-[#14161f] border-zinc-800/90 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}>
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <h3 className="text-xs sm:text-sm font-black tracking-tight whitespace-nowrap">
                      مستشارك للتسوق
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap shrink-0 ${
                      darkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-200'
                    }`}>
                      VIP
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium mt-0.5 whitespace-nowrap truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 animate-pulse"></span>
                    <span className="truncate">متواجد الآن لمساعدتك واقتراح أفضل العروض</span>
                  </div>
                </div>
              </div>

              {/* Header Controls */}
              <div className="flex items-center gap-1 text-zinc-400 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    darkMode ? 'hover:bg-zinc-800 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title={isExpanded ? "حجم قياسي" : "تكبير النافذة"}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                <button
                  type="button"
                  onClick={() => setIsMinimized(true)}
                  className={`p-2 rounded-xl transition-colors cursor-pointer ${
                    darkMode ? 'hover:bg-zinc-800 hover:text-white' : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                  title="تصغير"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    if (window.speechSynthesis) window.speechSynthesis.cancel();
                    setSpeakingMessageId(null);
                  }}
                  className="p-2 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-colors cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Segmented Navigation Tabs (Human-Designed E-Commerce Standard) */}
          {!isMinimized && (
            <div className="px-4 pt-3 pb-1 shrink-0">
              <div className={`p-1 rounded-2xl border flex items-center gap-1 text-xs font-bold ${
                darkMode ? 'bg-zinc-900/90 border-zinc-800/80' : 'bg-slate-100 border-slate-200/80'
              }`}>
                <button
                  type="button"
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'chat'
                      ? darkMode
                        ? 'bg-white text-zinc-950 shadow-sm font-black'
                        : 'bg-white text-slate-900 shadow-sm font-black'
                      : darkMode
                        ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-semibold'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>المحادثة</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('mystery')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 relative ${
                    activeTab === 'mystery'
                      ? darkMode
                        ? 'bg-white text-zinc-950 shadow-sm font-black'
                        : 'bg-white text-slate-900 shadow-sm font-black'
                      : darkMode
                        ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-semibold'
                  }`}
                >
                  <Gift className="w-3.5 h-3.5 text-amber-500" />
                  <span>صندوق الهدايا</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('topRated')}
                  className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === 'topRated'
                      ? darkMode
                        ? 'bg-white text-zinc-950 shadow-sm font-black'
                        : 'bg-white text-slate-900 shadow-sm font-black'
                      : darkMode
                        ? 'text-zinc-400 hover:text-white hover:bg-zinc-800/50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 font-semibold'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>الأعلى تقييماً</span>
                </button>
              </div>
            </div>
          )}

          {/* Body Content */}
          {!isMinimized && (
            <>
              {/* TAB 1: SMART CHAT */}
              {activeTab === 'chat' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs scrollbar-thin">
                  {messages.map((msg) => {
                    const isUser = msg.sender === 'user';
                    const isSpeakingThis = speakingMessageId === msg.id;

                    return (
                      <div 
                        key={msg.id}
                        className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
                      >
                        {/* Meta */}
                        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-zinc-400">
                          <span>{isUser ? 'أنت' : 'مستشارك للتسوق'}</span>
                          <span>•</span>
                          <span>{msg.timestamp}</span>
                        </div>

                        {/* Bubble */}
                        <div 
                          className={`relative max-w-[90%] rounded-2xl p-4 leading-relaxed text-xs shadow-xs ${
                            isUser
                              ? 'bg-blue-600 text-white font-bold rounded-tl-xs'
                              : darkMode
                                ? 'bg-zinc-900/90 text-zinc-100 border border-zinc-800/80 rounded-tr-xs'
                                : 'bg-white text-slate-800 border border-slate-200 rounded-tr-xs'
                          }`}
                        >
                          <p className="whitespace-pre-line text-[13px] leading-relaxed">{msg.text}</p>

                          {/* Interactive Coupon Alert Card */}
                          {msg.isSpecialAlert && msg.couponCode && (
                            <div className={`mt-3 p-3.5 rounded-2xl border text-right space-y-2.5 ${
                              darkMode ? 'bg-zinc-950/80 border-zinc-800' : 'bg-slate-50 border-slate-200'
                            }`}>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                                  <Tag className="w-3.5 h-3.5" />
                                  {msg.title || 'كود خصم مؤهل'}
                                </span>
                                <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                  {msg.couponCode}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const cp = COUPONS[msg.couponCode];
                                    if (cp && onApplyCoupon) {
                                      onApplyCoupon(cp);
                                      toast.success(`تم تفعيل كود الخصم (${msg.couponCode}) بنجاح!`);
                                    }
                                    if (onOpenCart) onOpenCart();
                                  }}
                                  className="flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-95 shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                                >
                                  <span>تفعيل الكود وفتح السلة</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onOpenCart && onOpenCart()}
                                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border active:scale-95 ${
                                    darkMode ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  عرض السلة
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Quick Reply Chips */}
                          {msg.quickReplies && msg.quickReplies.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                              {msg.quickReplies.map((qr, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleSendMessage(qr.query)}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border active:scale-95 shadow-2xs hover:scale-[1.02] flex items-center gap-1.5 ${
                                    darkMode
                                      ? 'bg-zinc-800/90 hover:bg-zinc-700 border-zinc-700/80 text-zinc-200'
                                      : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                                  }`}
                                >
                                  {qr.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Bot Action Tools (Copy, TTS, Feedback) */}
                        {!isUser && (
                          <div className="flex items-center gap-2 mt-1 px-1 text-[11px] text-zinc-400 opacity-80 hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => toggleSpeak(msg.id, msg.text)}
                              className={`p-1 rounded-md transition-colors cursor-pointer flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-200 ${
                                isSpeakingThis ? 'text-blue-500 font-bold' : ''
                              }`}
                              title={isSpeakingThis ? "إيقاف القراءة" : "استماع صوتياً"}
                            >
                              {isSpeakingThis ? <VolumeX className="w-3.5 h-3.5 text-blue-500 animate-pulse" /> : <Volume2 className="w-3.5 h-3.5" />}
                              <span className="text-[10px]">{isSpeakingThis ? 'جاري القراءة' : 'استماع'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg.id, msg.text)}
                              className="p-1 rounded-md hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1"
                              title="نسخ"
                            >
                              {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              <span className="text-[10px]">{copiedId === msg.id ? 'تم النسخ' : 'نسخ'}</span>
                            </button>

                            <div className="flex items-center gap-1 mr-auto">
                              <button
                                type="button"
                                onClick={() => handleFeedback(msg.id, 'up')}
                                className={`p-1 rounded-md hover:text-emerald-500 transition-colors cursor-pointer ${
                                  feedbacks[msg.id] === 'up' ? 'text-emerald-500 font-bold' : ''
                                }`}
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleFeedback(msg.id, 'down')}
                                className={`p-1 rounded-md hover:text-rose-500 transition-colors cursor-pointer ${
                                  feedbacks[msg.id] === 'down' ? 'text-rose-500 font-bold' : ''
                                }`}
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Product Cards with 3-Product Limit & Load More Button */}
                        {msg.products && msg.products.length > 0 && (() => {
                          const currentLimit = expandedMessageProducts[msg.id] || 3;
                          const visibleProducts = msg.products.slice(0, currentLimit);
                          const hasMore = msg.products.length > currentLimit;
                          const remaining = msg.products.length - currentLimit;

                          return (
                            <div className="w-full mt-3 space-y-2.5">
                              <div className="flex items-center justify-between px-1 text-[11px] font-bold text-zinc-400">
                                <span>المنتجات المقترحة (عرض {visibleProducts.length} من {msg.products.length}):</span>
                                <span className="text-zinc-400">اضغط للمعاينة أو الشراء</span>
                              </div>

                              <div className="space-y-2.5">
                                {visibleProducts.map((prod) => {
                                  const isJustAdded = addedProductIds.includes(prod.id);
                                  return (
                                    <div
                                      key={prod.id}
                                      className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3.5 transition-all duration-200 group ${
                                        darkMode
                                          ? 'bg-[#15171e] hover:bg-[#191c24] border-zinc-800/90 hover:border-zinc-700 shadow-sm'
                                          : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-sm'
                                      }`}
                                    >
                                      <div 
                                        onClick={() => onViewDetails && onViewDetails(prod)}
                                        className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                                      >
                                        <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-xl p-2 flex items-center justify-center shrink-0 border overflow-hidden transition-transform duration-300 group-hover:scale-105 ${
                                          darkMode ? 'bg-[#0b0c10] border-zinc-800/70' : 'bg-slate-50 border-slate-100'
                                        }`}>
                                          <img 
                                            src={prod.image} 
                                            alt={prod.name} 
                                            className="w-full h-full object-contain" 
                                          />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-1.5 mb-1">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block ${
                                              darkMode ? 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                                            }`}>
                                              {prod.category}
                                            </span>
                                          </div>
                                          <h4 className={`font-bold text-xs sm:text-sm truncate transition-colors ${
                                            darkMode ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
                                          }`}>
                                            {prod.name}
                                          </h4>
                                          <div className="flex items-center gap-2.5 mt-1.5">
                                            <span className={`font-black text-xs sm:text-sm font-mono ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                              {formatPrice(prod.price)}
                                            </span>
                                            <span className="flex items-center text-amber-400 text-xs font-bold gap-1 bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/20">
                                              <Star className="w-3.5 h-3.5 fill-amber-400" /> {prod.rating || 4.8}
                                            </span>
                                          </div>
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-1.5 shrink-0">
                                        <button
                                          type="button"
                                          onClick={() => onViewDetails && onViewDetails(prod)}
                                          className={`p-2 sm:p-2.5 rounded-xl border transition-colors cursor-pointer ${
                                            darkMode
                                              ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white'
                                              : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                                          }`}
                                          title="معاينة التفاصيل"
                                        >
                                          <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                        
                                        <button
                                          type="button"
                                          onClick={() => handleChatAddToCart(prod)}
                                          className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm ${
                                            isJustAdded
                                              ? 'bg-emerald-600 text-white'
                                              : darkMode
                                                ? 'bg-white hover:bg-zinc-200 text-zinc-950'
                                                : 'bg-slate-900 hover:bg-black text-white'
                                          }`}
                                          title="إضافة إلى السلة"
                                        >
                                          {isJustAdded ? (
                                            <>
                                              <Check className="w-3.5 h-3.5" />
                                              <span className="text-[11px]">أضيف!</span>
                                            </>
                                          ) : (
                                            <>
                                              <Plus className="w-3.5 h-3.5" />
                                              <span className="text-[11px]">إضافة</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Load More Button */}
                              {hasMore && (
                                <button
                                  type="button"
                                  onClick={() => handleLoadMoreForMessage(msg.id)}
                                  className={`w-full py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                                    darkMode
                                      ? 'bg-zinc-900/90 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 text-zinc-200'
                                      : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                                  }`}
                                >
                                  <span>تحميل المزيد من المنتجات ({remaining} متبقي)</span>
                                  <ChevronDown className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-center gap-2 text-zinc-400 p-2">
                      <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-1 py-1 px-2.5 rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse delay-100"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-pulse delay-200"></span>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400">جاري إعداد أفضل التوصيات لك...</span>
                    </div>
                  )}

                  <div ref={chatEndRef} />
                </div>
              )}

              {/* TAB 2: GAMIFIED MYSTERY GIFT BOX */}
              {activeTab === 'mystery' && (
                <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="max-w-sm space-y-2">
                    <span className="text-[11px] font-bold tracking-wider text-amber-500 uppercase">
                      هدية يومية حصرية لزوارنا
                    </span>
                    <h3 className={`text-base sm:text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      صندوق المفاجآت اليومي
                    </h3>
                    <p className={`text-xs ${darkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
                      اضغط لفتح هديتك الحصرية واكتشاف كود الخصم الفوري المخصص لك اليوم.
                    </p>
                  </div>

                  {/* Mystery Box Interactive Visual */}
                  <div className="py-4">
                    {!isGiftOpened ? (
                      <button
                        type="button"
                        onClick={handleOpenMysteryGift}
                        disabled={isOpeningGift}
                        className={`w-32 h-32 sm:w-36 sm:h-36 rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-300 cursor-pointer shadow-xl ${
                          isOpeningGift 
                            ? 'scale-105 animate-pulse border-amber-400 bg-amber-500/10' 
                            : darkMode 
                              ? 'hover:scale-105 border-zinc-700 bg-zinc-900/90 hover:border-amber-500/50 active:scale-95'
                              : 'hover:scale-105 border-slate-200 bg-white hover:border-amber-500/50 active:scale-95'
                        }`}
                      >
                        <Gift className={`w-14 h-14 text-amber-500 ${isOpeningGift ? 'animate-spin' : 'animate-bounce'}`} />
                        <span className="text-xs font-black mt-2 text-amber-500">
                          {isOpeningGift ? 'جاري الفتح...' : 'اضغط للفتح ✨'}
                        </span>
                      </button>
                    ) : (
                      <div className={`p-5 rounded-3xl border text-center space-y-3 max-w-sm shadow-xl animate-fade-in ${
                        darkMode ? 'bg-zinc-900/90 border-emerald-500/40' : 'bg-emerald-50/50 border-emerald-500/40'
                      }`}>
                        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                            {revealedGift?.title}
                          </h4>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-zinc-300' : 'text-slate-700'}`}>
                            {revealedGift?.desc}
                          </p>
                        </div>
                        <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                          {revealedGift?.code}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (revealedGift?.coupon && onApplyCoupon) {
                              onApplyCoupon(revealedGift.coupon);
                              toast.success(`تم تفعيل الكود (${revealedGift.code}) في السلة بنجاح!`);
                            }
                            if (onOpenCart) onOpenCart();
                          }}
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer active:scale-95 shadow-md flex items-center justify-center gap-2"
                        >
                          <ShoppingBag className="w-4 h-4" />
                          <span>تفعيل الكود وفتح السلة فوراً</span>
                        </button>
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400">
                    💡 يمكنك استشارة المساعد في أي وقت عن منتجات المتجر للحصول على أفضل التوصيات.
                  </p>
                </div>
              )}

              {/* TAB 3: TOP RATED PRODUCTS SHOWCASE */}
              {activeTab === 'topRated' && (
                <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs scrollbar-thin">
                  <div className="flex items-center justify-between px-1 mb-1">
                    <span className="font-black text-xs flex items-center gap-1.5 text-amber-500">
                      <Star className="w-4 h-4 fill-amber-500" />
                      المنتجات الأعلى تقييماً (4.8 - 5.0 نجوم)
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      عرض {Math.min(topRatedLimit, topRatedProducts.length)} من {topRatedProducts.length}
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {topRatedProducts.slice(0, topRatedLimit).map(prod => {
                      const isJustAdded = addedProductIds.includes(prod.id);
                      return (
                        <div
                          key={prod.id}
                          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3.5 transition-all duration-200 group ${
                            darkMode
                              ? 'bg-[#15171e] hover:bg-[#191c24] border-zinc-800/90 hover:border-zinc-700 shadow-sm'
                              : 'bg-white hover:bg-slate-50/80 border-slate-200 hover:border-slate-300 shadow-sm'
                          }`}
                        >
                          <div 
                            onClick={() => onViewDetails && onViewDetails(prod)}
                            className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
                          >
                            <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-xl p-2 flex items-center justify-center shrink-0 border overflow-hidden transition-transform duration-300 group-hover:scale-105 ${
                              darkMode ? 'bg-[#0b0c10] border-zinc-800/70' : 'bg-slate-50 border-slate-100'
                            }`}>
                              <img 
                                src={prod.image} 
                                alt={prod.name} 
                                className="w-full h-full object-contain" 
                              />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border inline-block ${
                                  darkMode ? 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                                }`}>
                                  {prod.category}
                                </span>
                              </div>

                              <h4 className={`font-bold text-xs sm:text-sm truncate transition-colors ${
                                darkMode ? 'text-white group-hover:text-blue-400' : 'text-slate-900 group-hover:text-blue-600'
                              }`}>
                                {prod.name}
                              </h4>

                              <div className="flex items-center gap-2.5 mt-1.5">
                                <span className={`font-black text-xs sm:text-sm font-mono ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {formatPrice(prod.price)}
                                </span>
                                <span className="flex items-center text-amber-400 text-xs font-bold gap-1 bg-amber-400/10 px-1.5 py-0.5 rounded-md border border-amber-400/20">
                                  <Star className="w-3.5 h-3.5 fill-amber-400" /> {prod.rating || 4.8}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => onViewDetails && onViewDetails(prod)}
                              className={`p-2 sm:p-2.5 rounded-xl border transition-colors cursor-pointer ${
                                darkMode
                                  ? 'border-zinc-800 hover:bg-zinc-800 text-zinc-400 hover:text-white'
                                  : 'border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                              }`}
                              title="معاينة التفاصيل"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleChatAddToCart(prod)}
                              className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm ${
                                isJustAdded
                                  ? 'bg-emerald-600 text-white'
                                  : darkMode
                                    ? 'bg-white hover:bg-zinc-200 text-zinc-950'
                                    : 'bg-slate-900 hover:bg-black text-white'
                              }`}
                              title="إضافة إلى السلة"
                            >
                              {isJustAdded ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span className="text-[11px]">أضيف!</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" />
                                  <span className="text-[11px]">إضافة</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Load More Button for Top Rated */}
                  {topRatedProducts.length > topRatedLimit && (
                    <div className="pt-2 pb-1">
                      <button
                        type="button"
                        onClick={() => setTopRatedLimit(prev => prev + 3)}
                        className={`w-full py-3 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-xs ${
                          darkMode
                            ? 'bg-zinc-900/90 hover:bg-zinc-850 border-zinc-800 hover:border-zinc-700 text-zinc-200'
                            : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800'
                        }`}
                      >
                        <span>تحميل المزيد من المنتجات ({topRatedProducts.length - topRatedLimit} متبقي)</span>
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Chat Input Bar */}
              <div className={`p-3 sm:p-4 border-t shrink-0 ${
                darkMode ? 'bg-[#14161f] border-zinc-800/90' : 'bg-white border-slate-100'
              }`}>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="relative flex-1 flex items-center">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={isListening ? "جاري الاستماع لصوتك الآن..." : "اسأل عن المنتجات، الشحن، الخصومات أو الضمان..."}
                      className={`w-full h-11 pr-3.5 pl-10 rounded-2xl text-xs font-semibold outline-none transition-all border ${
                        isListening
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5'
                          : darkMode
                            ? 'bg-[#0a0b0f] border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-600'
                            : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-slate-400'
                      }`}
                    />

                    {/* Microphone Voice Button */}
                    <button
                      type="button"
                      onClick={toggleVoiceInput}
                      className={`absolute left-2.5 p-1.5 rounded-xl transition-colors cursor-pointer ${
                        isListening
                          ? 'bg-rose-500 text-white animate-pulse'
                          : darkMode
                            ? 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                            : 'text-slate-400 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                      title={isListening ? "إيقاف التسجيل" : "تحدث بصوتك (إدخال صوتي)"}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!inputValue.trim()}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all shrink-0 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                      inputValue.trim()
                        ? darkMode
                          ? 'bg-white text-zinc-950 hover:bg-zinc-200 active:scale-95 shadow-sm'
                          : 'bg-slate-900 text-white hover:bg-black active:scale-95 shadow-sm'
                        : darkMode
                          ? 'bg-zinc-800 text-zinc-600'
                          : 'bg-slate-100 text-slate-400'
                    }`}
                    title="إرسال"
                  >
                    <Send className="w-4 h-4 rotate-180" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
