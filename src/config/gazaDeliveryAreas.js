/**
 * Gaza Strip Delivery Areas & Pricing Configuration
 * Realistically organized according to actual local Gazan delivery routes and courier zones.
 */

export const GAZA_GOVERNORATES = [
  { id: 'all', nameAr: 'جميع المناطق', nameEn: 'All Areas' },
  { id: 'gaza', nameAr: 'مدينة غزة', nameEn: 'Gaza City' },
  { id: 'north', nameAr: 'شمال غزة', nameEn: 'North Gaza' },
  { id: 'middle', nameAr: 'المنطقة الوسطى', nameEn: 'Middle Area' },
  { id: 'khanyounis', nameAr: 'خانيونس', nameEn: 'Khan Yunis' },
  { id: 'rafah', nameAr: 'رفح', nameEn: 'Rafah' },
];

export const GAZA_DELIVERY_AREAS = [
  // 1. مدينة غزة (Gaza City)
  {
    id: 'gaza-rimal-mina',
    governorate: 'gaza',
    governorateName: 'مدينة غزة',
    name: 'الرمال ومحيط الجامعات والميناء',
    nameEn: 'Al-Rimal, Universities & Port',
    neighborhoods: 'الرمال الشمالي، الرمال الجنوبي، شارع عمر المختار، شارع الجلاء، مجمع أنصار، شارع الرشيد الساحلي',
    priceUSD: 3,
    priceNIS: 10,
    deliveryTime: 'خلال 24 - 48 ساعة',
    isPopular: true
  },
  {
    id: 'gaza-tal-hawa-sabra',
    governorate: 'gaza',
    governorateName: 'مدينة غزة',
    name: 'تل الهوا وحي الصبرة وجنوب غزة',
    nameEn: 'Tal Al-Hawa, Sabra & South Gaza',
    neighborhoods: 'حي تل الهوا، حي الصبرة، محيط مستشفى القدس، دوار الدحدوح، شارع الصناعة، برشلونة، دوار الـ 17',
    priceUSD: 3,
    priceNIS: 10,
    deliveryTime: 'خلال 24 - 48 ساعة',
    isPopular: true
  },
  {
    id: 'gaza-sheikh-radwan-shati',
    governorate: 'gaza',
    governorateName: 'مدينة غزة',
    name: 'الشيخ رضوان ومخيم الشاطئ والكرامة',
    nameEn: 'Sheikh Radwan, Beach Camp & Karama',
    neighborhoods: 'الشيخ رضوان، مخيم الشاطئ، الكرامة، منطقة الصفطاوي، شارع النفق، بئر النعجة',
    priceUSD: 3,
    priceNIS: 10,
    deliveryTime: 'خلال 24 - 48 ساعة',
    isPopular: true
  },
  {
    id: 'gaza-shujaiya-zeitoun',
    governorate: 'gaza',
    governorateName: 'مدينة غزة',
    name: 'الشجاعية والزيتون والتفاح والدرج',
    nameEn: 'Shuja\'iyya, Zeitoun, Tuffah & Daraj',
    neighborhoods: 'حي الشجاعية، حي الزيتون، البلد القديمة (الدرج)، التفاح، شارع صلاح الدين، سوق فراس',
    priceUSD: 3,
    priceNIS: 10,
    deliveryTime: 'خلال 24 - 48 ساعة'
  },

  // 2. محافظة شمال غزة (North Gaza)
  {
    id: 'north-jabalia',
    governorate: 'north',
    governorateName: 'شمال غزة',
    name: 'مخيم وجباليا البلد والنزلة',
    nameEn: 'Jabalia Camp, City & Nazla',
    neighborhoods: 'مخيم جباليا، جباليا البلد، جباليا النزلة، تل الزعتر، الفالوجا، منطقة العلمي، محيط الهوجا',
    priceUSD: 4,
    priceNIS: 15,
    deliveryTime: 'خلال 24 - 48 ساعة',
    isPopular: true
  },
  {
    id: 'north-beit-lahia',
    governorate: 'north',
    governorateName: 'شمال غزة',
    name: 'بيت لاهيا ومشروع بيت لاهيا',
    nameEn: 'Beit Lahia & Housing Project',
    neighborhoods: 'مشروع بيت لاهيا، السلاطين، الشيماء، العطاطرة، محيط دوار زايد، فدعوس',
    priceUSD: 4,
    priceNIS: 15,
    deliveryTime: 'خلال 24 - 48 ساعة'
  },
  {
    id: 'north-beit-hanoun',
    governorate: 'north',
    governorateName: 'شمال غزة',
    name: 'بيت حانون وعزبة بيت حانون',
    nameEn: 'Beit Hanoun',
    neighborhoods: 'بيت حانون المركز، شارع خليل الوزير، عزبة بيت حانون، شارع السكة',
    priceUSD: 4,
    priceNIS: 15,
    deliveryTime: 'خلال 24 - 48 ساعة'
  },

  // 3. محافظة المنطقة الوسطى (Middle Area)
  {
    id: 'middle-nuseirat',
    governorate: 'middle',
    governorateName: 'المنطقة الوسطى',
    name: 'مخيم النصيرات',
    nameEn: 'Nuseirat Camp',
    neighborhoods: 'النصيرات مخيم 1، مخيم 2، شارع أبو عريبان، أرض المفتي، مخيم 5، محيط السوق الجديد',
    priceUSD: 4,
    priceNIS: 15,
    deliveryTime: 'خلال 24 - 48 ساعة',
    isPopular: true
  },
  {
    id: 'middle-deir-balah',
    governorate: 'middle',
    governorateName: 'المنطقة الوسطى',
    name: 'دير البلح والبلد والمخيم',
    nameEn: 'Deir al-Balah City & Camp',
    neighborhoods: 'دير البلح البلد، مخيم دير البلح، شارع النخيل، حكر الجامع، البركة، مستشفى شهداء الأقصى',
    priceUSD: 4,
    priceNIS: 15,
    deliveryTime: 'خلال 24 - 48 ساعة',
    isPopular: true
  },
  {
    id: 'middle-bureij-maghazi',
    governorate: 'middle',
    governorateName: 'المنطقة الوسطى',
    name: 'مخيم البريج ومخيم المغازي',
    nameEn: 'Bureij & Maghazi Camps',
    neighborhoods: 'مخيم البريج (البلوكات من 1 إلى 9)، مخيم المغازي، المدخل الرئيسي، محيط البلدية',
    priceUSD: 4,
    priceNIS: 15,
    deliveryTime: 'خلال 24 - 48 ساعة'
  },
  {
    id: 'middle-zawayda',
    governorate: 'middle',
    governorateName: 'المنطقة الوسطى',
    name: 'بلدة الزوايدة وخط البحر',
    nameEn: 'Al-Zawayda',
    neighborhoods: 'بلدة الزوايدة، شارع صلاح الدين، غرب الزوايدة، خط البحر، محيط ترخيص الوسطى',
    priceUSD: 4,
    priceNIS: 15,
    deliveryTime: 'خلال 24 - 48 ساعة'
  },

  // 4. محافظة خانيونس (Khan Yunis)
  {
    id: 'khanyounis-city',
    governorate: 'khanyounis',
    governorateName: 'محافظة خانيونس',
    name: 'خانيونس - المركز والبلد وحي الأمل',
    nameEn: 'Khan Yunis - Center & Al-Amal',
    neighborhoods: 'خانيونس البلد، شارع جلال، شارع البحر، حي الأمل، مخيم خانيونس، الحاووز، مستشفى ناصر',
    priceUSD: 5,
    priceNIS: 18,
    deliveryTime: 'خلال 24 - 48 ساعة',
    isPopular: true
  },
  {
    id: 'khanyounis-mawasi',
    governorate: 'khanyounis',
    governorateName: 'محافظة خانيونس',
    name: 'خانيونس - المواصي والساحل',
    nameEn: 'Khan Yunis - Al Mawasi',
    neighborhoods: 'مواصي خانيونس، طريق البحر، منطقة المينا، محيط مستشفى الهلال الأحمر، محيط التحلية',
    priceUSD: 5,
    priceNIS: 18,
    deliveryTime: 'خلال 24 - 48 ساعة',
    isPopular: true
  },
  {
    id: 'khanyounis-east',
    governorate: 'khanyounis',
    governorateName: 'محافظة خانيونس',
    name: 'القرى الشرقية (بني سهيلا والقرارة وعبسان)',
    nameEn: 'Eastern Villages (Bani Suheila, Qarara & Abasan)',
    neighborhoods: 'بني سهيلا، القرارة، عبسان الكبيرة، عبسان الصغيرة، خزاعة، شارع المطاحن',
    priceUSD: 5,
    priceNIS: 18,
    deliveryTime: 'خلال 24 - 48 ساعة'
  },

  // 5. محافظة رفح (Rafah)
  {
    id: 'rafah-city',
    governorate: 'rafah',
    governorateName: 'محافظة رفح',
    name: 'رفح - المركز والبلد والمخيمات',
    nameEn: 'Rafah - Center & Camps',
    neighborhoods: 'رفح البلد، مخيم الشابورة، مخيم يبنا، الكراج الشرقي، ميدان النجمة، حي الجنينة',
    priceUSD: 5,
    priceNIS: 20,
    deliveryTime: 'خلال 24 - 48 ساعة',
    isPopular: true
  },
  {
    id: 'rafah-tal-sultan',
    governorate: 'rafah',
    governorateName: 'محافظة رفح',
    name: 'رفح - تل السلطان والمواصي',
    nameEn: 'Rafah - Tal Al Sultan & Mawasi',
    neighborhoods: 'حي تل السلطان، مواصي رفح، الساحل الغربي، الحي السعودي، الدائري الغربي',
    priceUSD: 5,
    priceNIS: 20,
    deliveryTime: 'خلال 24 - 48 ساعة',
    isPopular: true
  }
];

const LOCAL_STORAGE_KEY = 'sofyan_selected_gaza_area';

/**
 * Retrieve saved Gaza area from localStorage
 */
export function getSavedGazaArea() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    // Validate if it still exists in current areas list
    const area = GAZA_DELIVERY_AREAS.find(a => a.id === parsed?.id);
    return area || parsed;
  } catch {
    return null;
  }
}

/**
 * Persist chosen Gaza area to localStorage
 */
export function saveGazaArea(area) {
  try {
    if (area) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(area));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  } catch {
    // Storage quota or private browsing mode handling
  }
}
