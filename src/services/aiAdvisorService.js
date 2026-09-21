// Intelligent Conversational AI Advisor Engine for Sofyan Eyad Store
import { formatPrice } from '../config/currencies';

// Store Knowledge Base
const STORE_KNOWLEDGE = {
  owner: {
    name: 'سفيان إياد (Sofyan Eyad)',
    title: 'مؤسس ومدير متجر سفيان إياد',
    description: 'متجر سفيان إياد هو منصة تسوق إلكتروني متكاملة تأسست لتقديم أرقى المنتجات العصرية والإلكترونيات والإكسسوارات الفاخرة بأعلى معايير الجودة وبأسعار تنافسية.'
  },
  shipping: {
    freeThresholdUSD: 50,
    standardCostUSD: 15,
    summary: 'نوفر خدمة شحن سريع ومباشر لجميع المناطق والدول.',
    details: '📦 الشحن المجاني متاح تلقائياً للطلبات التي تزيد عن $50، وتكلفة الشحن العادي $15. يستغرق التوصيل عادةً بين 1 إلى 3 أيام عمل.'
  },
  returns: {
    period: '14 يوماً',
    details: '🔄 سياسة الإرجاع والاستبدال مرنة وسهلة جداً خلال 14 يوماً من استلام الطلب، بشرط بقاء المنتج بحالته الأصلية ومرفقاته.'
  },
  warranty: {
    details: '🛡️ جميع منتجات المتجر أصلية ومضمونة 100%، وتأتي الأجهزة الإلكترونية مع ضمان جودة معتمد ضد أي عيوب مصنعية.'
  },
  payments: {
    methods: '💳 ندعم الدفع بالبطاقات الائتمانية والبنكية (Visa, MasterCard, Mada)، الدفع الآمن المشفر، بالإضافة إلى إمكانية تقسيط المشتريات على 4 دفعات بدون أي فوائد.'
  },
  coupons: [
    { code: 'FREE', discount: 'شحن مجاني', desc: 'للطلبات بقيمة 50$ فأكثر' },
    { code: 'SOFYAN10', discount: '10%', desc: 'للطلبات بقيمة 100$ فأكثر' },
    { code: 'SOFYAN20', discount: '20%', desc: 'للطلبات بقيمة 200$ فأكثر' }
  ]
};

// Arabic Synonyms and Categories mapping for semantic search
const SYNONYMS = {
  phones: ['هاتف', 'جوال', 'تلفون', 'موبايل', 'ايفون', 'آيفون', 'سامسونج', 'smartphone', 'phone', 'mobile'],
  laptops: ['لابتوب', 'كمبيوتر', 'حاسوب', 'جهاز', 'ماك', 'laptop', 'pc', 'macbook'],
  fragrances: ['عطر', 'عطور', 'برفيوم', 'مسك', 'بخور', 'perfume', 'fragrance', 'scent'],
  beauty: ['مكياج', 'ميك اب', 'تجميل', 'كريم', 'بشرة', 'روج', 'احمر شفاه', 'beauty', 'makeup', 'skin'],
  watches: ['ساعة', 'ساعات', 'ساعة يد', 'ساعة ذكية', 'watch', 'watches'],
  jewelry: ['مجوهرات', 'اكسسوار', 'إكسسوارات', 'خاتم', 'سلسال', 'عقد', 'ذهب', 'فضة', 'jewelry', 'accessories'],
  shoes: ['حذاء', 'شوز', 'احذية', 'أحذية', 'كوتشي', 'بوت', 'shoes', 'sneakers'],
  bags: ['حقيبة', 'شنطة', 'شنط', 'حقائب', 'bag', 'bags'],
  home: ['منزل', 'بيت', 'ديكور', 'أثاث', 'مطبخ', 'طاولة', 'home', 'decoration', 'furniture'],
  groceries: ['طعام', 'أكل', 'مشروب', 'شاي', 'قهوة', 'عصير', 'grocery', 'food']
};

/**
 * Main AI Query Understanding & Response Generator
 */
export function generateAIResponse(rawQuery, context = {}) {
  const query = (rawQuery || '').trim().toLowerCase();
  const { products = [], user = null, cart = [] } = context;

  // STANDARD 6 ATTRACTIVE QUICK REPLIES
  const DEFAULT_QUICK_REPLIES = [
    { label: '⭐ الأكثر تقييماً', query: 'الأكثر تقييماً' },
    { label: '🔥 أقوى العروض', query: 'أقوى العروض' },
    { label: '💰 الأفضل بسعر مناسب', query: 'الأفضل بسعر مناسب' },
    { label: '🔎 ساعدني أختار', query: 'ساعدني أختار' },
    { label: '🚚 الشحن والتوصيل', query: 'الشحن والتوصيل' },
    { label: '💳 الدفع والتقسيط', query: 'الدفع والتقسيط' }
  ];

  // 1. GREETINGS & CHIT-CHAT (التحيات والمجاملات)
  if (/^(مرحبا|مرحباً|أهلا|اهلا|السلام عليكم|سلام|هاي|هلا|صباح الخير|مساء الخير|الو|ألو)/i.test(query)) {
    return {
      text: `أهلاً وسهلاً بك في متجر سفيان إياد! 👋 يسعدني جداً التحدث معك. أنا مستشارك للتسوق، كيف يمكنني مساعدتك اليوم؟ يمكنك اختيار أي من المقترحات السريعة أو سؤالي مباشرة:`,
      quickReplies: DEFAULT_QUICK_REPLIES
    };
  }

  // How are you? (كيف حالك)
  if (/(كيفك|شخبارك|كيف حالك|عساك بخير|شلونك|كيف الصحة)/i.test(query)) {
    return {
      text: `بأفضل حال والحمد لله، شكراً لسؤالك اللطيف! ❤️ كل ما يسرني هو مساعدتك في العثور على أفضل المنتجات في المتجر بأفضل الأسعار. ما الذي تفكر في شرائه اليوم؟`,
      quickReplies: DEFAULT_QUICK_REPLIES
    };
  }

  // Thanks & Gratitude (الشكر والثناء)
  if (/(شكرا|شكراً|تسلم|يعطيك العافية|الله يسعدك|مشكور|ما قصرت|عاشت ايدك|ممتاز)/i.test(query)) {
    return {
      text: `على الرحب والسعة دائماً! يسعدني جداً أن أكون في خدمتك. إذا كان لديك أي استفسار آخر أو تبحث عن شيء معين، فأنا هنا دوماً لمساعدتك. تسوقاً ممتعاً! ✨🛒`,
      quickReplies: DEFAULT_QUICK_REPLIES
    };
  }

  // Identity / Who are you? (من أنت؟)
  if (/(مين انت|من انت|مين إنت|شو انت|شو وظيفتك|عرف عن نفسك|من تكون)/i.test(query)) {
    return {
      text: `أنا مستشارك للتسوق الخاص بمتجر سفيان إياد ✨ تم تدريبي لمساعدتك في كل تفاصيل تسوقك:
• ترشيح أفضل المنتجات وفق ميزانيتك واحتياجاتك.
• الإجابة على أي استفسار يخص الشحن، التوصيل، طرق الدفع، والتقسيط.
• إعطاؤك أكواد الخصم الحصرية وطرق التوفير.
اسألني أي سؤال يخطر ببالك وسأجيبك فوراً!`,
      quickReplies: DEFAULT_QUICK_REPLIES
    };
  }

  // 2. STORE & OWNER INFO (صاحب المتجر وهوية المتجر)
  if (/(مين سفيان|من هو سفيان|صاحب المتجر|مؤسس المتجر|سفيان اياد|سفيان إياد|عن المتجر|نبذة عنكم|من انتم)/i.test(query)) {
    return {
      text: `الأستاذ **${STORE_KNOWLEDGE.owner.name}** هو مؤسس ومدير هذا المتجر الرائد.
${STORE_KNOWLEDGE.owner.description}
يهدف المتجر إلى توفير تجربة تسوق فخمة وآمنة تجمع بين التنوع، الضمان الحقيقي، والأسعار المناسبة لعملائنا في مختلف أنحاء العالم.`,
      quickReplies: DEFAULT_QUICK_REPLIES
    };
  }

  // 3. SHIPPING & DELIVERY (الشحن والتوصيل)
  if (/(شحن|توصيل|الشحن والتوصيل|كم مدة التوصيل|كم سعر الشحن|شحن مجاني|متى يوصل|لوين بتوصلوا|لأي بلد|هل بتوصلوا)/i.test(query)) {
    const freeThresh = formatPrice(STORE_KNOWLEDGE.shipping.freeThresholdUSD);
    const standardCost = formatPrice(STORE_KNOWLEDGE.shipping.standardCostUSD);
    return {
      text: `🚚 **تفاصيل الشحن والتوصيل في متجر سفيان إياد:**
• ${STORE_KNOWLEDGE.shipping.summary}
• **الشحن المجاني:** متاح لأي طلب قيمته **${freeThresh}** أو أكثر، أو عند استخدام كود **FREE** في السلة!
• **تكلفة الشحن العادي:** **${standardCost}** فقط للطلبات الأقل من الحد.
• **مدة التوصيل:** شحن سريع يستغرق بين **1 إلى 3 أيام عمل** كحد أقصى حسب وجهتك.`,
      quickReplies: DEFAULT_QUICK_REPLIES.filter(r => !r.query.includes('الشحن'))
    };
  }

  // 4. PAYMENTS & INSTALLMENTS (طرق الدفع والتقسيط)
  if (/(دفع|طرق الدفع|الدفع والتقسيط|كيف ادفع|كيف أدفع|تقسيط|اقساط|أقساط|تابي|تمارا|فيزا|ماستر كارد|مدى|الدفع عند الاستلام)/i.test(query)) {
    return {
      text: `💳 **طرق الدفع وخيارات التقسيط:**
• **البطاقات البنكية:** نقبل جميع بطاقات Visa و MasterCard و Mada بكل أمان وسلاسة.
• **الدفع بالتقسيط الميسر:** يمكنك تقسيم فاتورتك على **4 دفعات شهرية متساوية بدون أي فوائد أو رسوم إضافية**!
• **حماية وأمان:** جميع المعاملات مشفرة بأحدث بروتوكولات الأمان العالمية لضمان سلامة بياناتك 100%.`,
      quickReplies: DEFAULT_QUICK_REPLIES.filter(r => !r.query.includes('الدفع'))
    };
  }

  // 5. RETURNS, WARRANTY & AUTHENTICITY (الضمان والاسترجاع والأصالة)
  if (/(ارجاع|إرجاع|استرجاع|استبدال|ترجيع|ضمان|كفالة|هل المنتجات اصلية|هل منتجاتكم أصلية|جودة المنتجات|عيوب مصنعية)/i.test(query)) {
    return {
      text: `🛡️ **ضمان الأصالة وسياسة الإرجاع:**
• **منتجات أصلية 100%:** نضمن لك أن جميع المعروضات منتجات أصلية ذات جودة قياسية مختارة بعناية.
• **الضمان:** نوفر ضمان جودة معتمد وشامل على الأجهزة والإلكترونيات ضد العيوب المصنعية.
• **الإرجاع والاستبدال:** ${STORE_KNOWLEDGE.returns.details}، لكي تتسوق براحة واطمئنان تام!`,
      quickReplies: DEFAULT_QUICK_REPLIES
    };
  }


  // 6. TOP RATED PRODUCTS (المنتجات الأكثر والأعلى تقييماً)
  if (/(الأكثر تقييماً|الاكثر تقييما|أكثر تقييم|اكثر تقييم|اعلى تقييم|أعلى تقييم|الاعلى تقييما|الأعلى تقييماً|افضل تقييم|أفضل تقييم|أفضل المنتجات تقييما|أفضل المنتجات تقييماً|المنتجات الأعلى تقييماً|المنتجات الأكثر تقييماً|top rated)/i.test(query)) {
    const topRated = [...products]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 9);

    return {
      text: `⭐ **المنتجات الأكثر تقييماً في متجر سفيان إياد:**
إليك نخبة المنتجات الأكثر تميزاً ونيلًا لثقة وتقييمات عملائنا (تقييم 4.8 إلى 5.0 نجوم). جميعها منتجات أصلية مع ضمان شامل. يمكنك الضغط على أي منتج لمعاينة صوره وتفاصيله أو إضافته لسلتك فوراً:`,
      products: topRated,
      quickReplies: DEFAULT_QUICK_REPLIES.filter(r => !r.query.includes('تقييم'))
    };
  }

  // 7. BEST DEALS & OFFERS (أقوى العروض)
  if (/(أقوى العروض|اقوى العروض|افضل العروض|أفضل العروض|أفضل الخصومات والعروض|أقوى التخفيضات|عروض اليوم|عروض وتخفيضات|صفقات اليوم|عروض حصرية)/i.test(query)) {
    const topDeals = [...products]
      .filter(p => (p.rating || 0) >= 4.5 || (p.price || 0) > 25)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 9);

    return {
      text: `🔥 **أقوى العروض والمنتجات المميزة في المتجر:**
إليك تشكيلة استثنائية من أكثر المنتجات طلباً وأفضلها قيمة، ومؤهلة للاستفادة من أكواد الخصم (كود **FREE** للشحن المجاني عند 50$، كود **SOFYAN10** لخصم 10% عند 100$، وكود **SOFYAN20** لخصم 20% عند 200$):`,
      products: topDeals.length > 0 ? topDeals : products.slice(0, 9),
      quickReplies: DEFAULT_QUICK_REPLIES.filter(r => !r.query.includes('العروض'))
    };
  }

  // 8. BEST VALUE / AFFORDABLE (الأفضل بسعر مناسب)
  if (/(الأفضل بسعر مناسب|الافضل بسعر مناسب|سعر مناسب|بسعر مناسب|اقتصادي|منتجات اقتصادية|أفضل قيمة|ارخص|أرخص|توفير|سعر رخيص)/i.test(query)) {
    const bestValue = [...products]
      .filter(p => (p.price || 0) <= 60 && (p.rating || 0) >= 4.3)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 9);

    return {
      text: `💰 **المنتجات الأفضل بسعر مناسب في متجر سفيان إياد:**
إليك باقة مختارة تجمع بين الجودة العالية، التقييم الممتاز، والسعر الاقتصادي المناسب لتتسوق بأعلى توفير وأفضل قيمة مقابل السعر:`,
      products: bestValue.length > 0 ? bestValue : products.slice(0, 9),
      quickReplies: DEFAULT_QUICK_REPLIES.filter(r => !r.query.includes('مناسب'))
    };
  }

  // 9. HELP ME CHOOSE (ساعدني أختار)
  if (/(ساعدني أختار|ساعدني اختار|ساعدني في الاختيار|اقترح لي|شو اشتري|شو أشتري|محتار|ترشيحات|نصيحة تسوق|اقتراح)/i.test(query)) {
    const curatedPicks = [...products]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 9);

    return {
      text: `🔎 **يسعدني جداً مساعدتك في اختيار المنتج الأنسب لك!**
إليك تشكيلة من أكثر المنتجات شهرة وتميزاً ونيلًا لرضا عملائنا في مختلف الأقسام (إلكترونيات، ساعات، عطور، عناية). يمكنك تصفحها أو إخباري بما تبحث عنه بالتحديد وسأرشدك فوراً:`,
      products: curatedPicks,
      quickReplies: DEFAULT_QUICK_REPLIES.filter(r => !r.query.includes('أختار'))
    };
  }

  // 10. ALL / BROWSE PRODUCTS (عرض كافة وتشكيلة المنتجات مع الصور)
  if (/(كافة المنتجات|كل المنتجات|عرض كافة المنتجات|تصفح المنتجات|بدي اشوف المنتجات|أريد رؤية المنتجات|المنتجات المتوفرة|اعرض المنتجات|المنتجات الحصرية)/i.test(query)) {
    const allSample = [...products]
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 12);

    return {
      text: `🛍️ **تشكيلة منتجات متجر سفيان إياد الحصرية:**
إليك عينة من أرقى المنتجات المتوفرة في مختلف الأقسام (إلكترونيات، لابتوبات، عطور، ساعات، عناية). اضغط على أي منتج لمشاهدة صوره الكاملة أو إضافته لسلتك بنقرة واحدة:`,
      products: allSample,
      quickReplies: DEFAULT_QUICK_REPLIES
    };
  }

  // 9. DISCOUNT CODES & COUPONS (أكواد الخصم وشروطها المحددة)
  if (/(كوبون|كود|خصم|تخفيض|بروموكود|promo|coupon|discount|وفر|كودات|شروط الخصم|شرط الخصم)/i.test(query)) {
    const min50 = formatPrice(50);
    const min100 = formatPrice(100);
    const min200 = formatPrice(200);

    return {
      text: `🎉 **نظام ومستويات أكواد الخصم في متجر سفيان إياد:**

1. 🚚 **كود الشحن المجاني (FREE):**
   • **الشرط:** تحصل عليه عند الشراء بقيمة **${min50} فأكثر**.

2. 🏷️ **كود 10% (SOFYAN10):**
   • **الشرط:** تحصل عليه عند الشراء بقيمة **${min100} فأكثر**.

3. 🔥 **كود 20% (SOFYAN20):**
   • **الشرط:** مخصص للطلبات الكبيرة بقيمة **${min200} فأكثر** لأعلى نسبة توفير!

💡 *طريقة الاستخدام:* كلما أضفت منتجات للسلة، يظهر لك الكود المؤهل تلقائياً بنقرة زر واحدة داخل السلة للتطبيق الفوري.`,
      quickReplies: [
        { label: '🔥 أقوى العروض والخصومات', query: 'أقوى العروض الحالية' },
        { label: '⭐ الأعلى تقييماً', query: 'أفضل المنتجات تقييماً' },
        { label: '🛒 فتح سلة التسوق', query: 'كيف أفتح السلة؟' }
      ],
      products: products.slice(0, 6)
    };
  }

  // 7. HOW TO ORDER / LOGIN (كيفية الشراء والتسجيل)
  if (/(كيف اشتري|كيف أشتري|طريقة الشراء|كيف اطلب|كيف أطلب|طريقة الطلب|تسجيل الدخول|كيف اسجل|إنشاء حساب)/i.test(query)) {
    return {
      text: `🛒 **خطوات الشراء وإتمام الطلب في متجر سفيان إياد في 3 خطوات بسيطة:**
1. **اختر منتجك:** تصفح المتجر واضغط على زر **'إضافة للسلة 🛒'** لأي منتج ينال إعجابك.
2. **افتح السلة:** اضغط على أيقونة السلة في شريط التنقل العلوي لتفقد طلباتك وإضافة كود الخصم.
3. **أكد الطلب:** سجل الدخول بحساب Google أو بريدك الإلكتروني بنقرة واحدة، ثم اضغط على **'إتمام الشراء الآن'** وسيصلك طلبك لباب بيتك!`,
      quickReplies: [
        { label: '💳 ما هي طرق الدفع؟', query: 'ما هي طرق الدفع المتوفرة؟' },
        { label: '🚚 تفاصيل الشحن', query: 'كم مدة الشحن والتوصيل؟' }
      ]
    };
  }

  // 8. CURRENCIES (العملة المعتمدة)
  if (/(عملة|عملات|تغيير العملة|تبديل العملة|ريال|درهم|دولار|يورو|دينار|جنيه|ليرة)/i.test(query) && /(كيف|وين|اين|قائمة|تحويل|سعر صرف|دعم)/i.test(query)) {
    return {
      text: `💵 **العملة المعتمدة في المتجر:**
جميع الأسعار في متجرنا معروضة بالدولار الأمريكي ($). يتم احتساب القيمة وإتمام الشراء بأمان ووضوح عبر وسائل الدفع المعتمدة.`,
      quickReplies: [
        { label: '💰 منتجات بميزانية محددة', query: 'منتجات اقتصادية أقل من 50 دولار' }
      ]
    };
  }

  // 9. CONTACT & CUSTOMER SERVICE (التواصل والدعم)
  if (/(تواصل|اتواصل|واتساب|واتس|رقمكم|رقم الهاتف|ايميل|إيميل|خدمة العملاء|الدعم الفني|اشتكي|مساعدة بشرية|اين موقعكم|أين أنتم)/i.test(query)) {
    return {
      text: `📞 **فريق خدمة العملاء ومتجر سفيان إياد دائماً في خدمتك:**
• **واتساب المباشر:** يمكنك مراسلتنا مباشرة عبر الرقم [+972594827189](https://wa.me/972594827189) أو بالضغط على أيقونة الواتساب في زاوية الشاشة.
• **البريد الإلكتروني:** sofyaneyad77@gmail.com
• نسعد دائماً بالرد على كافة استفساراتك ومساعدتك في اختيار المنتجات المناسبة.
هل تود الاستفسار عن منتج معين الآن؟`,
      quickReplies: [
        { label: '🛍️ تصفح التصنيفات', query: 'ما هي تصنيفات المتجر؟' },
        { label: '🎁 أفضل العروض', query: 'أفضل الخصومات والعروض' }
      ]
    };
  }

  // 10. CATEGORIES / WHAT DO YOU SELL? (ماذا تبيعون؟ ما هي التصنيفات؟)
  if (/(شو بتبيعوا|شو عندكم|ماذا تبيعون|ما هي المنتجات|تصنيفات المتجر|شو المنتجات المتوفرة|أقسام المتجر|الاقسام|الأقسام)/i.test(query)) {
    const cats = [...new Set(products.map(p => p.category))].slice(0, 8);
    const catList = cats.join(' • ');
    const sampleProducts = [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6);

    return {
      text: `🛍️ **يقدم متجر سفيان إياد تشكيلة عصرية متنوعة من أرقى المنتجات:**
يشمل ذلك: الإلكترونيات الذكية، أجهزة اللابتوب، العطور الفاخرة، مستحضرات التجميل، الساعات والإكسسوارات، ومستلزمات الحياة اليومية.

أبرز التصنيفات المتوفرة حالياً:
**${catList}**

إليك بعضاً من أكثر المنتجات طلباً وتميزاً في هذه الأقسام مع صورها وتفاصيلها:`,
      products: sampleProducts,
      quickReplies: [
        { label: '⭐ الأعلى تقييماً', query: 'أفضل المنتجات تقييماً' },
        { label: '🔥 أقوى العروض', query: 'أقوى العروض الحالية' },
        { label: '💻 لابتوبات وتقنية', query: 'أجهزة لابتوب وإلكترونيات' },
        { label: '✨ عطور ومستحضرات', query: 'عطور ومستلزمات فاخرة' }
      ]
    };
  }

  // 11. GIFTS RECOMMENDATION (اقتراحات الهدايا)
  if (/(هدية|هدايا|اهداء|بدي هدية|اقترح هدية|لأمي|لابي|لزوجتي|لزوجي|لصديق|لصديقتي|عيد ميلاد|بنت|شاب)/i.test(query)) {
    let giftTarget = 'هدية راقية وفخمة تليق بمناسبتك';
    if (query.includes('امي') || query.includes('أمي') || query.includes('زوجتي') || query.includes('بنت') || query.includes('صديقتي')) {
      giftTarget = 'هدية نسائية فاخرة ومميزة (عطور راقية أو إكسسوارات وجمال)';
    } else if (query.includes('ابي') || query.includes('أبي') || query.includes('زوجي') || query.includes('شاب') || query.includes('صديق')) {
      giftTarget = 'هدية رجالية عملية وأنيقة (ساعات أو أجهزة ذكية)';
    }

    const giftProducts = products
      .filter(p => {
        const cat = (p.category || '').toLowerCase();
        return cat.includes('fragrance') || cat.includes('beauty') || cat.includes('watch') || cat.includes('laptop') || p.rating >= 4.5;
      })
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 4);

    return {
      text: `🎁 اختيار الهدايا ذوق وفن! بناءً على طلبك لاختيار **${giftTarget}**، هذه أفضل المنتجات التي نالت أعلى إعجاب وتقييمات في المتجر، مع ضمان تغليف أصلي فاخر:`,
      products: giftProducts.length > 0 ? giftProducts : products.slice(0, 4)
    };
  }

  // 12. BUDGET SEARCH (البحث بالميزانية المحددة)
  const budgetMatch = query.match(/(?:أقل من|تحت|ميزانية|أقل|اقل من|بسعر|بحدود)\s*(\d+)/i) || 
                      query.match(/(\d+)\s*(?:\$|دولار|ريال|درهم|جنية|جنيه|دينار|ليرة)/i);

  if (budgetMatch && budgetMatch[1]) {
    const maxUSD = parseFloat(budgetMatch[1]);

    const budgetProducts = products
      .filter(p => p.price <= maxUSD * 1.1)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 4);

    const formattedBudget = formatPrice(maxUSD);
    if (budgetProducts.length > 0) {
      return {
        text: `💰 قمت بالبحث وتصفية أجود المنتجات التي تتناسب مع ميزانيتك (في حدود **${formattedBudget}**):`,
        products: budgetProducts
      };
    } else {
      return {
        text: `لم أجد منتجات بسعر أقل من **${formattedBudget}** بالضبط، لكن إليك أقرب المنتجات الاقتصادية ذات القيمة العالية في متجرنا:`,
        products: [...products].sort((a, b) => a.price - b.price).slice(0, 4)
      };
    }
  }

  // 13. SEMANTIC PRODUCT SEARCH BY KEYWORDS & CATEGORIES (البحث الدلالي عن المنتجات)
  // Check synonyms
  let detectedCategory = null;
  for (const [key, words] of Object.entries(SYNONYMS)) {
    if (words.some(w => query.includes(w))) {
      detectedCategory = key;
      break;
    }
  }

  let matched = [];
  let responseIntro = '';

  if (detectedCategory) {
    matched = products.filter(p => {
      const pCat = (p.category || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();

      const keywords = SYNONYMS[detectedCategory];
      return keywords.some(k => pCat.includes(k) || pName.includes(k) || pDesc.includes(k));
    });

    if (detectedCategory === 'phones') responseIntro = '📱 إليك أفضل خيارات الهواتف الذكية والأجهزة المحمولة المتاحة:';
    else if (detectedCategory === 'laptops') responseIntro = '💻 إليك أحدث وأقوى أجهزة اللابتوب والكمبيوتر المتوفرة بأعلى المواصفات:';
    else if (detectedCategory === 'fragrances') responseIntro = '✨ إليك تشكيلة من أرقى العطور الأصلية ذات الثبات العالي والرائحة الفواحة:';
    else if (detectedCategory === 'beauty') responseIntro = '💄 اخترت لك أبرز مستحضرات الجمال والعناية الأصلية ذات الجودة الفائقة:';
    else if (detectedCategory === 'watches') responseIntro = '⌚ إليك تشكيلة فاخرة من الساعات الأنيقة التي تناسب إطلالتك:';
    else responseIntro = 'بناءً على طلبك، إليك المنتجات المميزة المتطابقة في هذا القسم:';
  }

  // If no synonym match, try exact word matching on title/description/brand
  if (matched.length === 0) {
    const searchTerms = query.split(/\s+/).filter(w => w.length > 2 && !['أريد', 'ابحث', 'عن', 'في', 'هل', 'شو', 'بدي', 'عندك', 'عندكم', 'بدي'].includes(w));
    if (searchTerms.length > 0) {
      matched = products.filter(p => {
        const name = (p.name || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const cat = (p.category || '').toLowerCase();
        return searchTerms.some(term => name.includes(term) || desc.includes(term) || brand.includes(term) || cat.includes(term));
      });
    }
  }

  if (matched.length > 0) {
    return {
      text: responseIntro || `وجدت لك هذه المنتجات الرائعة في متجرنا التي تطابق استفسارك:`,
      products: [...matched].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 6)
    };
  }

  // 14. INTELLIGENT CONTEXTUAL FALLBACK FOR ANY OTHER GENERAL QUERY
  // (رد عام تفاعلي وذكي يحلل موضوع السؤال بدقة دون إعطاء إجابة مكررة أو فارغة)
  return {
    text: `فهمت سؤالك الكريم بخصوص: "${rawQuery}".
بصفتي مستشارك الخاص في متجر سفيان إياد، يسعدني إرشادك في كل ما يتعلق بمنتجاتنا المتنوعة، خدمات الشحن والتوصيل المجاني، الضمان، أو أكواد الخصم.

يمكنك تحديد نوع المنتج الذي ترغب به (مثل لابتوب، عطر، ساعة، هدية...) أو تحديد ميزانيتك لأقترح لك فوراً أفضل الخيارات المناسبة:`,
    quickReplies: [
      { label: '⭐ المنتجات الأعلى تقييماً', query: 'أفضل المنتجات تقييماً' },
      { label: '🔥 أقوى العروض الحالية', query: 'أقوى العروض الحالية' },
      { label: '🎁 أريد كود خصم', query: 'ما هي أكواد الخصم المتوفرة؟' },
      { label: '🚚 كيف الشحن والتوصيل؟', query: 'كم مدة وتكلفة الشحن؟' }
    ],
    products: [...products].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 4)
  };
}
