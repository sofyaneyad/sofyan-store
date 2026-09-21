import { useState, useEffect, useMemo, useCallback } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { 
  signInWithPopup, 
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { auth } from './config/firebase';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  RotateCcw, 
  SearchX, 
  ChevronRight, 
  ChevronLeft,
  WifiOff,
  RefreshCw
} from 'lucide-react';

// استيراد المكونات المنفصلة
import Navbar from './components/Navbar';
import FilterBar from './components/FilterBar';
import ProductCard from './components/ProductCard';
import AuthModal from './components/AuthModal';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import ProductDetailModal from './components/ProductDetailModal';
import TopAnnouncementBar from './components/TopAnnouncementBar';
import FlashDealsSection from './components/FlashDealsSection';
import WhatsAppSupportButton from './components/WhatsAppSupportButton';
import arabicDescriptions from './data/arabicDescriptions.json';
import fallbackProducts from './data/fallbackProducts.json';
import { PRODUCTS_CACHE_KEY, LAST_SYNC_KEY } from './config/offlineConfig';
import { 
  STOCK_STORAGE_KEY, 
  DEFAULT_INITIAL_STOCKS, 
  DEAL_DISCOUNTS,
  MIN_DISCOUNT_PRICE_THRESHOLD,
  getStoredFlashDealsState, 
  getFlashDealProductIds 
} from './config/flashDealsConfig';
import { markCouponAsUsed } from './config/coupons';

export const STORE_STOCK_STORAGE_KEY = 'sofyan_store_stocks_v5';

// Clean up old test data to ensure all products return to normal stocks and counter restarts clean
try {
  ['sofyan_store_stocks_v4', 'sofyan_store_stocks_v3', 'sofyan_flash_deals_stock_v5', 'sofyan_flash_deals_expiry_v5', 'sofyan_flash_deals_cycle_v5', 'sofyan_cached_products_v5', 'sofyan_flash_deals_stock_v4', 'sofyan_flash_deals_expiry_v4', 'sofyan_flash_deals_cycle_v4', 'sofyan_cached_products_v4', 'sofyan_cached_products_v3', 'sofyan_cached_products_v2'].forEach(k => {
    localStorage.removeItem(k);
  });
} catch {
  // ignore
}

const PRODUCTS_PER_PAGE = 8;

const translateShipping = (text) => {
  if (!text) return 'شحن سريع ومباشر';
  const map = {
    'Ships in 1-2 business days': 'شحن خلال 1-2 أيام عمل',
    'Ships in 3-5 business days': 'شحن خلال 3-5 أيام عمل',
    'Ships in 1 week': 'شحن خلال أسبوع',
    'Ships in 2 weeks': 'شحن خلال أسبوعين',
    'Ships in 1 month': 'شحن خلال شهر',
    'Ships overnight': 'شحن سريع خلال 24 ساعة'
  };
  return map[text] || text;
};

const translateReturnPolicy = (item, lang = 'ar') => {
  const isEn = lang === 'en';
  const text = typeof item === 'string' ? item : (item?.returnPolicy || '');
  const price = typeof item === 'object' ? (item.price || 0) : 0;
  const category = typeof item === 'object' ? (item.category || '').toLowerCase() : '';

  if (text === 'No return policy') {
    return isEn ? 'Non-returnable' : 'غير قابل للإرجاع';
  }

  // السلع الرخيصة (15$ أو أقل) أو البقالة والمستهلكات اليومية: كبيرها 1 للإرجاع
  if ((price > 0 && price <= 15) || category === 'groceries') {
    return isEn ? '1 day return policy' : 'إرجاع خلال يوم واحد';
  }

  // السلع المتوسطة (60$ أو أقل)
  if ((price > 0 && price <= 60) || text === '7 days return policy') {
    return isEn ? '7 days return policy' : 'إرجاع خلال 7 أيام';
  }

  // السلع الثمينة والأجهزة
  return isEn ? '14 days return policy' : 'إرجاع واستبدال خلال 14 يوماً';
};

const translateWarranty = (text) => {
  if (!text) return 'ضمان جودة معتمد';
  const map = {
    '1 week warranty': 'ضمان لمدة أسبوع',
    '1 month warranty': 'ضمان لمدة شهر',
    '3 months warranty': 'ضمان لمدة 3 أشهر',
    '6 months warranty': 'ضمان لمدة 6 أشهر',
    '1 year warranty': 'ضمان لمدة سنة',
    '2 year warranty': 'ضمان لمدة سنتين',
    '3 year warranty': 'ضمان لمدة 3 سنوات',
    '5 year warranty': 'ضمان لمدة 5 سنوات',
    'Lifetime warranty': 'ضمان مدى الحياة',
    'No warranty': 'بدون ضمان'
  };
  return map[text] || text;
};

/**
 * Normalizes discount percentages to realistic, reasonable commercial levels.
 * Rules:
 * 1. ONLY products with higher prices (>= $40) receive discounts.
 * 2. Cheaper everyday items (< $40) have NO discounts (0%) to protect margins and avoid trivial markdowns.
 * 3. Eligible high-priced products receive balanced discounts between 4% and 10%.
 * 4. Micro-discounts (< 4%) are ignored (0%).
 */
export const normalizeProductDiscount = (rawDiscount, price = 0) => {
  const numPrice = Number(price) || 0;
  if (numPrice < MIN_DISCOUNT_PRICE_THRESHOLD) return 0;

  const num = Number(rawDiscount) || 0;
  if (num < 4) return 0;
  const scaled = Math.round(num * 0.45);
  return Math.min(10, Math.max(4, scaled));
};

const formatRawProducts = (rawList, savedStoreStocks = {}, savedDealStocks = {}) => {
  if (!Array.isArray(rawList)) return [];

  const dealsState = getStoredFlashDealsState();
  const dealProductIds = getFlashDealProductIds(rawList, dealsState.cycle);

  return rawList.map((item) => {
    const idStr = item.id.toString();
    const originalStock = item.stock || 25;
    
    // Check if this product is one of the 4 active flash deal products
    const dealIdx = dealProductIds.indexOf(idStr);
    const isDealProduct = dealIdx !== -1;

    let currentStock;
    if (isDealProduct) {
      if (savedDealStocks[idStr] !== undefined) {
        currentStock = savedDealStocks[idStr];
      } else if (savedStoreStocks[idStr] !== undefined) {
        currentStock = savedStoreStocks[idStr];
      } else {
        currentStock = DEFAULT_INITIAL_STOCKS[dealIdx % DEFAULT_INITIAL_STOCKS.length];
      }
    } else {
      if (savedStoreStocks[idStr] !== undefined) {
        currentStock = savedStoreStocks[idStr];
      } else {
        currentStock = originalStock;
      }
    }

    const productPrice = typeof item.price === 'number' ? item.price : 10;

    return {
      id: idStr,
      name: item.title || item.name || 'منتج',
      category: item.category || 'عام',
      price: productPrice,
      rating: item.rating || 4.5,
      image: item.thumbnail || item.image || '',
      images: item.images && item.images.length > 0 ? item.images : [item.thumbnail || item.image || ''],
      arabicDescription: arabicDescriptions[idStr] || item.description || '',
      originalDescription: item.description || '',
      description: arabicDescriptions[idStr] || item.description || '',
      brand: item.brand || 'منتج أصلي',
      originalStock: originalStock,
      stock: currentStock,
      isDealProduct,
      discountPercentage: isDealProduct 
        ? DEAL_DISCOUNTS[dealIdx % DEAL_DISCOUNTS.length] 
        : normalizeProductDiscount(item.discountPercentage, productPrice),
      sku: item.sku || `PRD-${item.id}`,
      reviews: item.reviews || [],
      shippingInformationAr: translateShipping(item.shippingInformation, 'ar'),
      shippingInformationEn: translateShipping(item.shippingInformation, 'en'),
      warrantyInformationAr: translateWarranty(item.warrantyInformation, 'ar'),
      warrantyInformationEn: translateWarranty(item.warrantyInformation, 'en'),
      returnPolicyAr: translateReturnPolicy(item, 'ar'),
      returnPolicyEn: translateReturnPolicy(item, 'en'),
      shippingInformation: translateShipping(item.shippingInformation, 'ar'),
      warrantyInformation: translateWarranty(item.warrantyInformation, 'ar'),
      returnPolicy: translateReturnPolicy(item, 'ar')
    };
  });
};

const getInitialProducts = () => {
  let savedStoreStocks = {};
  let savedDealStocks = {};
  try {
    const storeSaved = localStorage.getItem(STORE_STOCK_STORAGE_KEY);
    if (storeSaved) savedStoreStocks = JSON.parse(storeSaved);
    const dealSaved = localStorage.getItem(STOCK_STORAGE_KEY);
    if (dealSaved) savedDealStocks = JSON.parse(dealSaved);
  } catch {
    // ignore
  }

  // 1. Check localStorage first
  try {
    const cached = localStorage.getItem(PRODUCTS_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const dealsState = getStoredFlashDealsState();
        const dealProductIds = getFlashDealProductIds(parsed, dealsState.cycle);
        return parsed.map((p) => {
          const dealIdx = dealProductIds.indexOf(p.id);
          if (dealIdx !== -1) {
            const currentStock = savedDealStocks[p.id] !== undefined 
              ? savedDealStocks[p.id] 
              : (p.stock !== undefined ? p.stock : DEFAULT_INITIAL_STOCKS[dealIdx % DEFAULT_INITIAL_STOCKS.length]);
            return { 
              ...p, 
              stock: currentStock, 
              isDealProduct: true,
              discountPercentage: DEAL_DISCOUNTS[dealIdx % DEAL_DISCOUNTS.length]
            };
          }
          return { 
            ...p, 
            isDealProduct: false,
            discountPercentage: normalizeProductDiscount(p.discountPercentage, p.price)
          };
        });
      }
    }
  } catch (e) {
    console.error("Error reading cached products from localStorage", e);
  }

  // 2. Fallback to bundled fallbackProducts.json
  try {
    if (Array.isArray(fallbackProducts) && fallbackProducts.length > 0) {
      const formatted = formatRawProducts(fallbackProducts, savedStoreStocks, savedDealStocks);
      try {
        localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(formatted));
      } catch {
        // ignore
      }
      return formatted;
    }
  } catch (e) {
    console.error("Error reading fallback products", e);
  }

  return [];
};

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState(getInitialProducts);
  const [loading, setLoading] = useState(() => products.length === 0);
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' ? !navigator.onLine : false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    try {
      localStorage.removeItem('sofyan_store_lang');
    } catch {
      // ignore
    }
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
  }, []);

  // Dark / Light Mode State
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('sofyan_store_theme');
    return savedTheme ? JSON.parse(savedTheme) : true;
  });

  useEffect(() => {
    localStorage.setItem('sofyan_store_theme', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Cart State with localStorage
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('sofyan_store_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error loading cart from localStorage", error);
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    try {
      localStorage.setItem('sofyan_store_cart', JSON.stringify(cart));
    } catch (error) {
      console.error("Error saving cart to localStorage", error);
    }
  }, [cart]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const fetchProducts = useCallback(async (isManualRefresh = false) => {
    // If offline according to navigator, update state and notify if manual
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setIsOffline(true);
      if (isManualRefresh) {
        toast('أنت غير متصل بالإنترنت حالياً. المتجر يعمل بكفاءة بالبيانات المخزنة محلياً', {
          icon: '📡',
          style: {
            background: darkMode ? '#18181b' : '#fff',
            color: darkMode ? '#fff' : '#0f172a',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '12px',
            fontWeight: 'bold',
          }
        });
      }
      return;
    }

    try {
      setIsSyncing(true);
      if (products.length === 0) {
        setLoading(true);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const response = await fetch('https://dummyjson.com/products?limit=0', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data || !Array.isArray(data.products)) {
        throw new Error('Invalid products payload received from API');
      }

      let savedStoreStocks = {};
      let savedDealStocks = {};
      try {
        const storeSaved = localStorage.getItem(STORE_STOCK_STORAGE_KEY);
        if (storeSaved) savedStoreStocks = JSON.parse(storeSaved);
        const dealSaved = localStorage.getItem(STOCK_STORAGE_KEY);
        if (dealSaved) savedDealStocks = JSON.parse(dealSaved);
      } catch {
        // ignore
      }

      const formattedProducts = formatRawProducts(data.products, savedStoreStocks, savedDealStocks);

      setProducts(formattedProducts);
      setIsOffline(false);

      try {
        localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(formattedProducts));
        localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
      } catch (storageErr) {
        console.warn('LocalStorage error while caching products:', storageErr);
      }

      if (isManualRefresh) {
        toast.success('تم تحديث قائمة المنتجات بنجاح من الخادم! ✨', {
          style: {
            background: darkMode ? '#18181b' : '#fff',
            color: darkMode ? '#fff' : '#0f172a',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '12px',
            fontWeight: 'bold',
          }
        });
      }
    } catch (error) {
      console.warn("Using offline / cached products: ", error);
      setIsOffline(true);
      if (isManualRefresh) {
        toast('تعذر جلب المنتجات من الخادم، يتم الاستمرار في عرض المنتجات المخزنة', {
          icon: '📡',
          style: {
            background: darkMode ? '#18181b' : '#fff',
            color: darkMode ? '#fff' : '#0f172a',
            fontFamily: 'Cairo, sans-serif',
            fontSize: '12px',
            fontWeight: 'bold',
          }
        });
      }
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [darkMode, products.length]);

  useEffect(() => {
    // Initial fetch on mount
    fetchProducts(false);

    const handleOnline = () => {
      setIsOffline(false);
      toast.success('تمت استعادة الاتصال بالإنترنت! جاري مزامنة المنتجات 🌐', {
        style: {
          background: darkMode ? '#18181b' : '#fff',
          color: darkMode ? '#fff' : '#0f172a',
          fontFamily: 'Cairo, sans-serif',
          fontSize: '12px',
          fontWeight: 'bold',
        }
      });
      fetchProducts(false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast('انقطع الاتصال بالإنترنت - المتجر يعمل في وضع عدم الاتصال وتصفح المنتجات متاح بالكامل', {
        icon: '📡',
        duration: 4000,
        style: {
          background: darkMode ? '#18181b' : '#fff',
          color: darkMode ? '#fff' : '#0f172a',
          border: darkMode ? '1px solid #3f3f46' : '1px solid #e2e8f0',
          fontFamily: 'Cairo, sans-serif',
          fontSize: '12px',
          fontWeight: 'bold',
        }
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [darkMode, fetchProducts]);

  // Reset to page 1 whenever filter or search or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setAuthError('');
      await signInWithPopup(auth, provider);
      setIsAuthModalOpen(false);
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isSignUpMode) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setIsAuthModalOpen(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      setAuthError(error.message);
    }
  };

  const handleGuestLogin = () => {
    setUser({ displayName: 'سفيان إياد', email: 'sofyan@store.ps', uid: 'demo-user-123' });
    setIsAuthModalOpen(false);
    toast.success('تم تسجيل الدخول التجريبي بنجاح', {
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCart([]);
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  const MAX_PRODUCT_LIMIT = 100;

  const handleAddToCart = (product, quantity = 1) => {
    const safeQty = Math.max(1, Math.min(MAX_PRODUCT_LIMIT, Number(quantity) || 1));

    // Check if product is out of stock
    if (product.stock !== undefined && product.stock <= 0) {
      toast.error('عذراً، هذا المنتج نفد من المخزون بالكامل!', {
        style: {
          background: darkMode ? '#18181b' : '#fff',
          color: darkMode ? '#fff' : '#0f172a',
          border: darkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
          fontFamily: 'Cairo, sans-serif',
          fontSize: '12px',
          fontWeight: 'bold',
        }
      });
      return;
    }

    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.id === product.id);
      if (existingItem) {
        const newQty = Math.min(MAX_PRODUCT_LIMIT, existingItem.quantity + safeQty);
        return prevCart.map(item => 
          item.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prevCart, { ...product, quantity: safeQty }];
    });

    // Decrement product stock in state and persist
    setProducts(prevProducts => {
      let nextStockCalculated = 0;
      const updated = prevProducts.map(p => {
        if (p.id === product.id) {
          const current = p.stock !== undefined ? p.stock : 25;
          nextStockCalculated = Math.max(0, current - safeQty);
          return { ...p, stock: nextStockCalculated };
        }
        return p;
      });
      try {
        const storeSaved = JSON.parse(localStorage.getItem(STORE_STOCK_STORAGE_KEY) || '{}');
        storeSaved[product.id] = nextStockCalculated;
        localStorage.setItem(STORE_STOCK_STORAGE_KEY, JSON.stringify(storeSaved));

        const dealSaved = JSON.parse(localStorage.getItem(STOCK_STORAGE_KEY) || '{}');
        dealSaved[product.id] = nextStockCalculated;
        localStorage.setItem(STOCK_STORAGE_KEY, JSON.stringify(dealSaved));

        localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updated));
      } catch {
        // ignore storage error
      }
      return updated;
    });

    toast.success(`تمت إضافة ${safeQty > 1 ? `${safeQty} قطع من ` : ''}${product.name} إلى السلة`, {
      style: {
        background: darkMode ? '#18181b' : '#fff',
        color: darkMode ? '#fff' : '#0f172a',
        border: darkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
        fontFamily: 'Cairo, sans-serif',
        fontSize: '12px',
        fontWeight: 'bold',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#fff',
      },
    });
  };

  const updateCartQuantity = (productId, delta) => {
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === productId) {
          const newQty = Math.max(1, Math.min(MAX_PRODUCT_LIMIT, item.quantity + delta));
          return { ...item, quantity: newQty };
        }
        return item;
      });
    });
  };

  const setCartItemQuantity = (productId, exactQty) => {
    const safeQty = Math.max(1, Math.min(MAX_PRODUCT_LIMIT, Number(exactQty) || 1));
    setCart(prevCart => {
      return prevCart.map(item => {
        if (item.id === productId) {
          return { ...item, quantity: safeQty };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => {
      const nextCart = prev.filter(item => item.id !== productId);
      if (nextCart.length === 0) {
        setIsCartOpen(false);
      }
      return nextCart;
    });
  };

  const clearCart = () => {
    if (cart.length === 0) return;
    setAppliedCoupon(null);
    setCart([]);
    setIsCartOpen(false);
    toast.success('تم تفريغ سلة التسوق بالكامل', {
      style: {
        background: darkMode ? '#121217' : '#fff',
        color: darkMode ? '#fff' : '#0f172a',
        border: darkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e2e8f0',
        fontFamily: 'Cairo, sans-serif',
        fontSize: '12px',
        fontWeight: 'bold',
      },
      iconTheme: {
        primary: '#ef4444',
        secondary: '#fff',
      },
    });
  };

  const handleCheckout = (transactionDetails) => {
    if (!user) {
      toast.error('يرجى تسجيل الدخول أولاً لإتمام عملية الشراء 🔒', {
        style: {
          background: darkMode ? '#18181b' : '#fff',
          color: darkMode ? '#f4f4f5' : '#0f172a',
          border: darkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
          fontFamily: 'Cairo, sans-serif',
          fontSize: '12px',
          fontWeight: 'bold',
        }
      });
      setIsAuthModalOpen(true);
      return;
    }

    // If a coupon was applied, mark it as consumed/used so it cannot be used again
    if (appliedCoupon?.code) {
      markCouponAsUsed(appliedCoupon.code);
    }

    const txMsg = transactionDetails?.transactionId 
      ? `تم تأكيد الدفع والطلب بنجاح عبر Stripe (${transactionDetails.transactionId.slice(0, 11)}...)`
      : 'تم إتمام الطلب بنجاح! شكراً لتسوقك معنا.';

    toast.success(txMsg, {
      duration: 5000,
      style: {
        background: darkMode ? '#18181b' : '#fff',
        color: darkMode ? '#f4f4f5' : '#0f172a',
        border: darkMode ? '1px solid #27272a' : '1px solid #e2e8f0',
        fontFamily: 'Cairo, sans-serif',
        fontSize: '12px',
        fontWeight: 'bold',
      },
      iconTheme: {
        primary: '#10b981',
        secondary: '#fff',
      },
    });

    setAppliedCoupon(null);
    setCart([]); 
    setIsCartOpen(false); 
  };

  const categories = useMemo(() => {
    const cats = products.map(p => p.category);
    return ['All', ...new Set(cats)];
  }, [products]);

  const categoryCounts = useMemo(() => {
    const counts = { All: products.length };
    products.forEach(p => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'price-asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating-desc') {
      result = [...result].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'name-asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [products, searchTerm, selectedCategory, sortBy]);

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE) || 1;

  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * PRODUCTS_PER_PAGE;
    return filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    const el = document.getElementById('products-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const totalCartItems = useMemo(() => {
    return cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }, [cart]);

  return (
    <div className={`min-h-screen antialiased transition-colors duration-300 relative font-cairo ${darkMode ? 'bg-[#09090b] text-white selection:bg-blue-600 selection:text-white' : 'bg-[#f8fafc] text-slate-900 selection:bg-blue-600 selection:text-white'}`} dir="rtl">
      
      <Toaster position="top-center" />

      {/* Top Announcement Bar */}
      <TopAnnouncementBar darkMode={darkMode} />

      {/* Offline Status Alert Banner */}
      {isOffline && (
        <div className={`w-full py-2.5 px-4 text-xs font-bold border-b transition-all ${
          darkMode 
            ? 'bg-emerald-950/60 border-emerald-800/70 text-emerald-200' 
            : 'bg-amber-50 border-amber-200 text-amber-950'
        }`}>
          <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative shrink-0">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  darkMode ? 'bg-emerald-400' : 'bg-amber-400'
                }`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  darkMode ? 'bg-emerald-500' : 'bg-amber-500'
                }`}></span>
              </span>
              <WifiOff className={`w-4 h-4 shrink-0 ${darkMode ? 'text-emerald-400' : 'text-amber-600'}`} />
              <span className="leading-tight">
                <strong>وضع عدم الاتصال (Offline Mode):</strong> النت مفصول حالياً — تم تحميل كافة المنتجات من الذاكرة المحلية ويمكنك التسوق والإضافة للسلة كالمعتاد!
              </span>
            </div>
            <button
              type="button"
              disabled={isSyncing}
              onClick={() => fetchProducts(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer border shrink-0 active:scale-95 ${
                darkMode 
                  ? 'bg-emerald-900/60 hover:bg-emerald-800/80 border-emerald-700 text-emerald-100' 
                  : 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-950'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'جاري فحص الاتصال...' : 'إعادة فحص النت'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Navbar */}
      <Navbar 
        darkMode={darkMode} 
        setDarkMode={setDarkMode} 
        user={user} 
        totalCartItems={totalCartItems} 
        setIsCartOpen={setIsCartOpen} 
        setIsAuthModalOpen={setIsAuthModalOpen} 
        handleLogout={handleLogout} 
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
        
        {/* Store Hero Banner */}
        <div className={`relative rounded-3xl p-6 sm:p-10 md:p-12 mb-8 sm:mb-12 border overflow-hidden shadow-sm transition-all ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
        }`}>
          <div className="relative z-10 max-w-3xl">
            <h1 className={`text-2xl sm:text-4xl font-extrabold tracking-tight mb-3 sm:mb-4 leading-tight sm:leading-snug ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>
              متجرك لجميع مستلزماتك اليومية
            </h1>

            <p className={`text-xs sm:text-base font-normal mb-8 leading-relaxed max-w-2xl ${
              darkMode ? 'text-zinc-400' : 'text-slate-600'
            }`}>
              إلكترونيات، مستلزمات العناية، وإكسسوارات متنوعة بأفضل الأسعار مع شحن سريع وضمان استرجاع.
            </p>

            {/* Trust Features Strip */}
            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t ${
              darkMode ? 'border-zinc-800 text-zinc-300' : 'border-slate-100 text-slate-700'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'}`}>
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">توصيل سريع</h4>
                  <p className={`text-[10px] ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>خلال 1-3 أيام</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'}`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">منتجات أصلية</h4>
                  <p className={`text-[10px] ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>ضمان الجودة</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'}`}>
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">دفع آمن</h4>
                  <p className={`text-[10px] ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>معاملات محمية</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-700'}`}>
                  <RotateCcw className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold leading-tight">إرجاع سهل</h4>
                  <p className={`text-[10px] ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>خلال 14 يوماً</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Flash Deals Section (with Countdown Timer) */}
        <FlashDealsSection 
          products={products}
          handleAddToCart={handleAddToCart}
          onViewDetails={(prod) => setSelectedProduct(prod)}
          onCycleReset={(newCycle) => {
            try {
              localStorage.removeItem(STOCK_STORAGE_KEY);
            } catch {
              // ignore
            }
            setProducts(prev => {
              const newDealIds = getFlashDealProductIds(prev, newCycle);
              const updated = prev.map(p => {
                const dealIdx = newDealIds.indexOf(p.id);
                if (dealIdx !== -1) {
                  const newStock = DEFAULT_INITIAL_STOCKS[dealIdx % DEFAULT_INITIAL_STOCKS.length];
                  return { 
                    ...p, 
                    stock: newStock, 
                    isDealProduct: true,
                    discountPercentage: DEAL_DISCOUNTS[dealIdx % DEAL_DISCOUNTS.length]
                  };
                } else {
                  return { 
                    ...p, 
                    stock: p.originalStock || 25, 
                    isDealProduct: false,
                    discountPercentage: normalizeProductDiscount(p.discountPercentage, p.price)
                  };
                }
              });
              try {
                localStorage.setItem(PRODUCTS_CACHE_KEY, JSON.stringify(updated));
              } catch {
                // ignore
              }
              return updated;
            });
            toast.success('انتهت فترة الـ 3 أيام! انطلقت تشكيلة عروض جديدة وتجدد المخزون.', {
              style: {
                background: darkMode ? '#18181b' : '#fff',
                color: darkMode ? '#fff' : '#0f172a',
                fontFamily: 'Cairo, sans-serif',
              }
            });
          }}
          darkMode={darkMode}
        />

        {/* Filter Bar */}
        <FilterBar 
          searchTerm={searchTerm} 
          setSearchTerm={setSearchTerm} 
          selectedCategory={selectedCategory} 
          setSelectedCategory={setSelectedCategory} 
          categories={categories} 
          categoryCounts={categoryCounts}
          sortBy={sortBy}
          setSortBy={setSortBy}
          darkMode={darkMode} 
        />

        {/* Products Section Header / Result Counter */}
        <div id="products-section" className="flex items-center justify-between mb-6 px-1 scroll-mt-24">
          <div className="flex items-center gap-2">
            <h2 className={`text-base sm:text-lg font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              قائمة المنتجات
            </h2>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              darkMode ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}>
              {filteredProducts.length} منتج
            </span>
          </div>

          {(searchTerm || selectedCategory !== 'All' || sortBy !== 'default') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSortBy('default');
              }}
              className={`text-xs font-bold hover:underline cursor-pointer flex items-center gap-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>إعادة تعيين الكل</span>
            </button>
          )}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className={`border rounded-3xl p-5 h-84 flex flex-col justify-between animate-pulse ${
                darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <div className={`h-44 rounded-2xl mb-4 ${darkMode ? 'bg-zinc-950' : 'bg-slate-100'}`}></div>
                  <div className={`h-4 rounded-lg w-3/4 mb-3 ${darkMode ? 'bg-zinc-800' : 'bg-slate-200'}`}></div>
                  <div className="flex justify-between items-center mb-4">
                    <div className={`h-5 w-16 rounded-lg ${darkMode ? 'bg-zinc-800' : 'bg-slate-200'}`}></div>
                    <div className={`h-4 w-12 rounded-lg ${darkMode ? 'bg-zinc-800' : 'bg-slate-200'}`}></div>
                  </div>
                </div>
                <div className={`h-11 rounded-2xl ${darkMode ? 'bg-zinc-800' : 'bg-slate-200'}`}></div>
              </div>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={`text-center py-20 px-6 border rounded-3xl flex flex-col items-center justify-center ${
            darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-300' : 'bg-white border-slate-200 text-slate-700'
          }`}>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
              darkMode ? 'bg-zinc-800 text-zinc-400' : 'bg-slate-100 text-slate-500'
            }`}>
              <SearchX className="w-7 h-7" />
            </div>
            <h3 className="text-base font-black mb-1">لم نتمكن من العثور على أي منتجات</h3>
            <p className={`text-xs max-w-sm mb-6 ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              جرب البحث بكلمات مختلفة أو قم بإعادة ضبط خيارات الفلترة والتصنيفات.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('All');
                setSortBy('default');
              }}
              className="px-5 py-2.5 rounded-2xl text-xs font-black bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors cursor-pointer"
            >
              إعادة تعيين الفلاتر
            </button>
          </div>
        ) : (
          <>
            {/* Products Grid - Strictly 8 items per page */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => (
                <ProductCard 
                  key={product.id}
                  product={product}
                  darkMode={darkMode}
                  handleAddToCart={handleAddToCart}
                  onViewDetails={(prod) => setSelectedProduct(prod)}
                />
              ))}
            </div>

            {/* Pagination Controls (شريط السابق والتالي) */}
            {totalPages > 1 && (
              <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 mt-10 pt-6 border-t ${
                darkMode ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-600'
              }`}>
                {/* Page Counter Info */}
                <div className="text-xs font-bold">
                  عرض <span className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{(currentPage - 1) * PRODUCTS_PER_PAGE + 1}</span> - <span className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)}</span> من أصل <span className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{filteredProducts.length}</span> منتج (صفحة {currentPage} من {totalPages})
                </div>

                {/* Buttons (السابق / أرقام الصفحات / التالي) */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Previous Button (In RTL, ChevronRight points to previous) */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                      currentPage === 1
                        ? 'opacity-35 cursor-not-allowed border-transparent text-zinc-500'
                        : darkMode
                          ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800 cursor-pointer active:scale-95'
                          : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm cursor-pointer active:scale-95'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const maxButtons = 5;
                      let start = Math.max(1, currentPage - 2);
                      let end = Math.min(totalPages, start + maxButtons - 1);
                      if (end - start < maxButtons - 1) {
                        start = Math.max(1, end - maxButtons + 1);
                      }
                      const pages = [];
                      for (let i = start; i <= end; i++) {
                        pages.push(i);
                      }

                      return (
                        <>
                          {start > 1 && (
                            <>
                              <button
                                type="button"
                                onClick={() => handlePageChange(1)}
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer border ${
                                  darkMode
                                    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                1
                              </button>
                              {start > 2 && <span className="px-1 text-xs text-zinc-500">...</span>}
                            </>
                          )}

                          {pages.map((p) => {
                            const isCurrent = p === currentPage;
                            return (
                              <button
                                key={p}
                                type="button"
                                onClick={() => handlePageChange(p)}
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer border ${
                                  isCurrent
                                    ? darkMode
                                      ? 'bg-white text-zinc-950 border-white shadow-sm font-black'
                                      : 'bg-slate-900 text-white border-slate-900 shadow-sm font-black'
                                    : darkMode
                                      ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                {p}
                              </button>
                            );
                          })}

                          {end < totalPages && (
                            <>
                              {end < totalPages - 1 && <span className="px-1 text-xs text-zinc-500">...</span>}
                              <button
                                type="button"
                                onClick={() => handlePageChange(totalPages)}
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center cursor-pointer border ${
                                  darkMode
                                    ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                                    : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                                }`}
                              >
                                {totalPages}
                              </button>
                            </>
                          )}
                        </>
                      );
                    })()}
                  </div>

                  {/* Next Button (In RTL, ChevronLeft points to next) */}
                  <button
                    type="button"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className={`px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs font-bold flex items-center gap-1.5 transition-all border ${
                      currentPage >= totalPages
                        ? 'opacity-35 cursor-not-allowed border-transparent text-zinc-500'
                        : darkMode
                          ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800 cursor-pointer active:scale-95'
                          : 'bg-white hover:bg-slate-50 text-slate-900 border-slate-200 shadow-sm cursor-pointer active:scale-95'
                    }`}
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Copyright Footer */}
      <Footer darkMode={darkMode} />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen} 
        setIsOpen={setIsAuthModalOpen} 
        isSignUpMode={isSignUpMode} 
        setIsSignUpMode={setIsSignUpMode} 
        email={email} 
        setEmail={setEmail} 
        password={password} 
        setPassword={setPassword} 
        authError={authError} 
        handleGoogleLogin={handleGoogleLogin} 
        handleEmailAuth={handleEmailAuth} 
        handleGuestLogin={handleGuestLogin}
      />

      {/* Cart Drawer */}
      <CartDrawer 
        isOpen={isCartOpen} 
        setIsOpen={setIsCartOpen} 
        user={user} 
        cart={cart} 
        products={products}
        totalCartItems={totalCartItems} 
        removeFromCart={removeFromCart} 
        updateCartQuantity={updateCartQuantity}
        setCartItemQuantity={setCartItemQuantity}
        clearCart={clearCart}
        setIsAuthModalOpen={setIsAuthModalOpen} 
        darkMode={darkMode}
        onCheckout={handleCheckout}
        appliedCoupon={appliedCoupon}
        setAppliedCoupon={setAppliedCoupon}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct ? (products.find(p => p.id === selectedProduct.id) || selectedProduct) : null}
        isOpen={Boolean(selectedProduct)}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
        darkMode={darkMode}
      />

      {/* Direct Human WhatsApp Support Button */}
      <WhatsAppSupportButton darkMode={darkMode} />

    </div>
  );
}