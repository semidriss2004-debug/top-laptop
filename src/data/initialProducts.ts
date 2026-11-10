import { Product } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  // ====================================================
  // GAMING LAPTOPS
  // ====================================================
  {
    id: 'tl-rog-strix-g16',
    sku: 'TL-ASUS-G16-4070-01',
    barcode: '6931234560012',
    name: 'ASUS ROG Strix G16 (2024)',
    brand: 'ASUS',
    category: 'gaming',
    purchasePriceDZD: 215000,
    priceDZD: 245000,
    originalPriceDZD: 265000,
    profitDZD: 30000,
    profitMarginPercent: 12.24,
    images: [
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1000&q=80'
    ],
    description: {
      fr: 'Machine de combat ultime dotée du processeur Intel Core i9 de 14e génération et du GPU RTX 4070. Écran ROG Nebula 240Hz 2.5K.',
      ar: 'جهاز الألعاب الخارق بمعالج Intel Core i9 من الجيل 14 وبطاقة رسومات RTX 4070. شاشة ROG Nebula بتردد 240Hz ودقة 2.5K.'
    },
    processor: 'Intel Core i9-14900HX',
    ram: '32 GB DDR5 5600MHz',
    storage: '1 TB NVMe PCIe 4.0 SSD',
    gpu: 'NVIDIA GeForce RTX 4070 8GB GDDR6 (140W)',
    screenSize: '16.0" QHD+ 240Hz IPS 100% DCI-P3',
    condition: 'new',
    stock: 7,
    minStockAlert: 2,
    status: 'available',
    isFeatured: true,
    warrantyMonths: 12,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tl-macbook-pro-16-m3',
    sku: 'TL-APPL-MBP16-M3M-02',
    barcode: '6931234560029',
    name: 'Apple MacBook Pro 16" (M3 Max)',
    brand: 'Apple',
    category: 'professional',
    purchasePriceDZD: 425000,
    priceDZD: 485000,
    originalPriceDZD: 510000,
    profitDZD: 60000,
    profitMarginPercent: 12.37,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=1000&q=80'
    ],
    description: {
      fr: 'Le summum de la puissance mobile pour les créateurs de contenu, le montage 8K et le développement d\'IA.',
      ar: 'قمة القوة لرواد الإبداع وصناع المحتوى ومطوري الذكاء الاصطناعي مع شريحة M3 Max.'
    },
    processor: 'Apple M3 Max (14-Core CPU)',
    ram: '36 GB Unified Memory',
    storage: '1 TB High-Speed SSD',
    gpu: '30-Core Integrated Apple GPU',
    screenSize: '16.2" Liquid Retina XDR (120Hz ProMotion)',
    condition: 'new',
    stock: 4,
    minStockAlert: 2,
    status: 'available',
    isFeatured: true,
    warrantyMonths: 12,
    createdAt: new Date().toISOString()
  },
  {
    id: 'tl-thinkpad-x1-carbon-gen11',
    sku: 'TL-LEN-X1C11-I7-03',
    barcode: '6931234560036',
    name: 'Lenovo ThinkPad X1 Carbon Gen 11',
    brand: 'Lenovo',
    category: 'business',
    purchasePriceDZD: 165000,
    priceDZD: 189000,
    profitDZD: 24000,
    profitMarginPercent: 12.70,
    images: [
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?auto=format&fit=crop&w=1000&q=80'
    ],
    description: {
      fr: 'La référence mondiale des ultraportables professionnels en fibre de carbone ultraléger (1.12 kg).',
      ar: 'المعيار العالمي لأجهزة الأعمال المحمولة فائقة الخفة من ألياف الكربون (1.12 كغ).'
    },
    processor: 'Intel Core i7-1365U vPro',
    ram: '16 GB LPDDR5 6400MHz',
    storage: '512 GB NVMe Opal2 SSD',
    gpu: 'Intel Iris Xe Graphics',
    screenSize: '14.0" WUXGA (1920x1200) IPS Low Power',
    condition: 'new',
    stock: 9,
    minStockAlert: 3,
    status: 'available',
    isFeatured: true,
    warrantyMonths: 12,
    createdAt: new Date().toISOString()
  },

  // ====================================================
  // SOFTWARE & DIGITAL PRODUCTS (PHASE 8)
  // ====================================================
  {
    id: 'tl-win11-pro-oem',
    sku: 'TL-DIG-WIN11-PRO-01',
    barcode: '6931234561019',
    name: 'Licence Windows 11 Professionnel (Clé Originale)',
    brand: 'Microsoft',
    category: 'software_digital',
    purchasePriceDZD: 2500,
    priceDZD: 4900,
    originalPriceDZD: 6500,
    profitDZD: 2400,
    profitMarginPercent: 48.98,
    stock: 45,
    minStockAlert: 10,
    condition: 'new',
    status: 'available',
    isFeatured: true,
    warrantyMonths: 24,
    isDigital: true,
    images: [
      'https://images.unsplash.com/photo-1633419461186-7d40a38105ec?auto=format&fit=crop&w=1000&q=80'
    ],
    description: {
      fr: 'Licence authentique numérique Windows 11 Pro 64-bit avec activation à vie. Livraison instantanée par Email et WhatsApp.',
      ar: 'ترخيص رقمي أصلي معتمد لنظام Windows 11 Pro مدى الحياة مع تسليم فوري عبر الواتساب والإيميل.'
    },
    digitalDetails: {
      subcategory: 'operating_systems',
      licenseType: 'Retail',
      duration: 'Lifetime',
      devicesCount: 1,
      activationInstructions: {
        fr: 'Rendez-vous dans Paramètres > Système > Activation > Modifier la clé de produit et collez votre clé.',
        ar: 'انتقل إلى الإعدادات > النظام > التنشيط > تغيير مفتاح المنتج والصق الرمز المستلم.'
      },
      isAutoDelivery: true,
      licenseKeys: [
        { id: 'k1', key: 'W269N-WFGWX-YVC9B-4J6C9-T83GX', isUsed: false },
        { id: 'k2', key: 'MH37W-N47XK-V7XM9-C7227-GCQG9', isUsed: false },
        { id: 'k3', key: 'VK7JG-NPHTM-C97JM-9MPGT-3V66T', isUsed: false }
      ]
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'tl-office-2024-pro-plus',
    sku: 'TL-DIG-OFFICE24-PP-02',
    barcode: '6931234561026',
    name: 'Microsoft Office 2024 Professionnel Plus (À Vie)',
    brand: 'Microsoft',
    category: 'software_digital',
    purchasePriceDZD: 3500,
    priceDZD: 6900,
    originalPriceDZD: 9500,
    profitDZD: 3400,
    profitMarginPercent: 49.28,
    stock: 30,
    minStockAlert: 5,
    condition: 'new',
    status: 'available',
    isFeatured: true,
    warrantyMonths: 36,
    isDigital: true,
    images: [
      'https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1000&q=80'
    ],
    description: {
      fr: 'Suite bureautique complète (Word, Excel, PowerPoint, Outlook, Access). Clé authentique liée à votre compte Microsoft.',
      ar: 'الحزمة المكتبية الكاملة أوفيس 2024 برو بلس مدى الحياة مرتبطة بحساب مايكروسوفت الخاص بك.'
    },
    digitalDetails: {
      subcategory: 'office_productivity',
      licenseType: 'Retail',
      duration: 'Lifetime',
      devicesCount: 1,
      activationInstructions: {
        fr: 'Téléchargez l\'installeur officiel depuis setup.office.com et entrez votre clé d\'activation.',
        ar: 'قم بتحميل برنامج التثبيت الرسمي من setup.office.com وأدخل المفتاح للتنشيط الفوري.'
      },
      isAutoDelivery: true,
      licenseKeys: [
        { id: 'k4', key: 'NMMKJ-6RK4F-KMJVX-8D9MJ-6MWKP', isUsed: false },
        { id: 'k5', key: 'T7P6W-N4F9T-B8Q82-8P3VT-X26KJ', isUsed: false }
      ]
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'tl-kaspersky-total-sec',
    sku: 'TL-DIG-KASP-TOTAL-03',
    barcode: '6931234561033',
    name: 'Kaspersky Total Security 2026 (3 Postes - 1 An)',
    brand: 'Kaspersky',
    category: 'software_digital',
    purchasePriceDZD: 2800,
    priceDZD: 4500,
    profitDZD: 1700,
    profitMarginPercent: 37.78,
    stock: 20,
    minStockAlert: 5,
    condition: 'new',
    status: 'available',
    isFeatured: false,
    warrantyMonths: 12,
    isDigital: true,
    images: [
      'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1000&q=80'
    ],
    description: {
      fr: 'Protection antivirus premium contre les ransomwares, phishing et logiciels espions pour 3 PC ou smartphones.',
      ar: 'حماية متقدمة وشاملة ضد الفيروسات وبرامج الفدية والتجسس لـ 3 أجهزة كمبيوتر أو هواتف لمدة عام.'
    },
    digitalDetails: {
      subcategory: 'security_antivirus',
      licenseType: 'Retail',
      duration: '1 Year',
      devicesCount: 3,
      activationInstructions: {
        fr: 'Téléchargez Kaspersky depuis my.kaspersky.com et activez le code à 20 chiffres.',
        ar: 'حمّل التطبيق من my.kaspersky.com وأدخل الكود المكون من 20 رمزاً.'
      },
      isAutoDelivery: true,
      licenseKeys: [
        { id: 'k6', key: 'KASP-9921-8842-7711-6655', isUsed: false }
      ]
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'tl-autocad-2025-commercial',
    sku: 'TL-DIG-AUTOCAD25-04',
    barcode: '6931234561040',
    name: 'Autodesk AutoCAD 2025 (Licence Commerciale 1 An)',
    brand: 'Autodesk',
    category: 'software_digital',
    purchasePriceDZD: 28000,
    priceDZD: 38000,
    profitDZD: 10000,
    profitMarginPercent: 26.32,
    stock: 12,
    minStockAlert: 3,
    condition: 'new',
    status: 'available',
    isFeatured: true,
    warrantyMonths: 12,
    isDigital: true,
    images: [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1000&q=80'
    ],
    description: {
      fr: 'Logiciel de CAO 2D et 3D de référence mondiale pour architectes et ingénieurs. Licence officielle nominative.',
      ar: 'البرنامج الهندسي العالمي للتصميم ثنائي وثلاثي الأبعاد للمهندسين والمعماريين بترخيص رسمي موثق.'
    },
    digitalDetails: {
      subcategory: 'engineering_design',
      licenseType: 'Subscription',
      duration: '1 Year',
      devicesCount: 2,
      activationInstructions: {
        fr: 'Invitation directe envoyée sur votre compte Autodesk officiel sous 2 heures.',
        ar: 'إرسال دعوة التفعيل الرسمية لحسابك على أوتوديسك في غضون ساعتين.'
      },
      isAutoDelivery: false,
      licenseKeys: []
    },
    createdAt: new Date().toISOString()
  },

  // ====================================================
  // LAPTOP BAGS & CASES (PHASE 9)
  // ====================================================
  {
    id: 'tl-rog-ranger-backpack',
    sku: 'TL-BAG-ROG-BP2701-01',
    barcode: '6931234562016',
    name: 'Sac à Dos Gaming ASUS ROG Ranger BP2701 (17.3")',
    brand: 'ASUS',
    category: 'laptop_bags_cases',
    purchasePriceDZD: 11000,
    priceDZD: 16500,
    originalPriceDZD: 19000,
    profitDZD: 5500,
    profitMarginPercent: 33.33,
    stock: 15,
    minStockAlert: 3,
    condition: 'new',
    status: 'available',
    isFeatured: true,
    warrantyMonths: 12,
    images: [
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1000&q=80'
    ],
    description: {
      fr: 'Sac à dos étanche 22L haute résistance en polyester hydrofuge. Compartiments rembourrés pour PC 17 pouces et casque gaming.',
      ar: 'حقيبة ظهر مصفحة ومقاومة للماء بسعة 22 لتر مخصصة لأجهزة الألعاب حتى 17.3 بوصة مع جيوب للسماعات والشاحن.'
    },
    bagDetails: {
      subcategory: 'backpack',
      compatibleSizes: ['15.6"', '16"', '17.3"'],
      material: 'Polyester hydrofuge 900D & Cuir PU',
      color: 'Noir Cyberpunk ROG',
      isWaterResistant: true
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'tl-lenovo-legion-armored',
    sku: 'TL-BAG-LEGION-ARM-02',
    barcode: '6931234562023',
    name: 'Sac à Dos Blindé Lenovo Legion Armored Backpack II',
    brand: 'Lenovo',
    category: 'laptop_bags_cases',
    purchasePriceDZD: 8500,
    priceDZD: 12900,
    profitDZD: 4400,
    profitMarginPercent: 34.11,
    stock: 18,
    minStockAlert: 4,
    condition: 'new',
    status: 'available',
    isFeatured: false,
    warrantyMonths: 12,
    images: [
      'https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?auto=format&fit=crop&w=1000&q=80'
    ],
    description: {
      fr: 'Bouclier avant rigide en EVA pour une protection maximale contre les chocs. Matelassage respirant au dos.',
      ar: 'واجهة أمامية مدرعة بتقنية EVA لحماية الجهاز من الصدمات والضغط مع وسائد هوائية مريحة للظهر.'
    },
    bagDetails: {
      subcategory: 'backpack',
      compatibleSizes: ['15.6"', '16"', '17.3"'],
      material: 'Coque EVA rigide & Tissu imperméable',
      color: 'Gris Sidéral Legion',
      isWaterResistant: true
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'tl-targus-citylite-pro',
    sku: 'TL-BAG-TARGUS-CLP-03',
    barcode: '6931234562030',
    name: 'Sacoche Business Targus CityLite Pro (15.6")',
    brand: 'Targus',
    category: 'laptop_bags_cases',
    purchasePriceDZD: 5200,
    priceDZD: 7900,
    profitDZD: 2700,
    profitMarginPercent: 34.18,
    stock: 25,
    minStockAlert: 5,
    condition: 'new',
    status: 'available',
    isFeatured: false,
    warrantyMonths: 24,
    images: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80'
    ],
    description: {
      fr: 'Sacoche élégante et légère idéale pour les cadres et étudiants. Bandoulière ergonomique et poignées confort.',
      ar: 'حقيبة يد كتف أنيقة وعملية للمدراء والطلبة الجامعيين لحمل الحاسوب والوثائق بأمان تام.'
    },
    bagDetails: {
      subcategory: 'shoulder_bag',
      compatibleSizes: ['14"', '15.6"'],
      material: 'Nylon haute densité 600D',
      color: 'Gris Anthracite',
      isWaterResistant: true
    },
    createdAt: new Date().toISOString()
  },
  {
    id: 'tl-sleeve-neoprene-14',
    sku: 'TL-BAG-SLEEVE-14-04',
    barcode: '6931234562047',
    name: 'Housse de Protection Antichoc en Néoprène 14"',
    brand: 'Other',
    category: 'laptop_bags_cases',
    purchasePriceDZD: 1600,
    priceDZD: 2800,
    profitDZD: 1200,
    profitMarginPercent: 42.86,
    stock: 40,
    minStockAlert: 8,
    condition: 'new',
    status: 'available',
    isFeatured: false,
    warrantyMonths: 6,
    images: [
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1000&q=80'
    ],
    description: {
      fr: 'Housse fine avec doublure douce en velours pour protéger des rayures et chutes légères.',
      ar: 'غلاف حماية ناعم مبطن بالمخمل لحماية الحاسوب المحمول من الخدوش والصدمات الخفيفة.'
    },
    bagDetails: {
      subcategory: 'sleeve',
      compatibleSizes: ['13"', '14"'],
      material: 'Néoprène haute densité & Velours',
      color: 'Noir Profond',
      isWaterResistant: true
    },
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_SETTINGS = {
  storeName: 'TOP LAPTOP ALGERIE',
  flatDeliveryFeeDZD: 800,
  whatsappNumber: '+213555123456',
  contactPhone: '0555 12 34 56 / 0770 98 76 54',
  contactEmail: 'contact@toplaptop-dz.com',
  storeAddress: '15 Rue Didouche Mourad, Alger Centre, Alger, Algérie',
  taxNumberNIF: '001916012345678',
  tradeRegisterRC: '16/00-9876543B20',
  socialLinks: {
    facebook: 'https://facebook.com/toplaptop.dz',
    instagram: 'https://instagram.com/toplaptop.dz',
    tiktok: 'https://tiktok.com/@toplaptop.dz',
    youtube: 'https://youtube.com/@toplaptopdz',
    linkedin: 'https://linkedin.com/company/top-laptop-dz',
    whatsapp: 'https://wa.me/213555123456'
  },
  themeSettings: {
    activeThemeId: 'cyber-neon' as const,
    autoRotateWeekly: true,
    rotationOrder: [
      'cyber-neon' as const,
      'crimson-rog' as const,
      'emerald-matrix' as const,
      'stealth-titanium' as const,
      'hyper-amber' as const,
      'aurora-cyan' as const
    ],
    lastRotatedDate: new Date().toISOString()
  },
  autoBackupEnabled: true,
  backupFrequencyDays: 7,
  lastBackupDate: new Date().toISOString()
};

export const INITIAL_EMPLOYEES = [
  {
    id: 'emp-admin',
    name: 'Karim Bencherif (Directeur)',
    email: 'admin@toplaptop.dz',
    role: 'SUPER_ADMIN' as const,
    isActive: true,
    passcode: 'toplaptop2026',
    customPermissions: [
      'manage_products' as const,
      'view_costs_profits' as const,
      'manage_orders' as const,
      'manage_delivery' as const,
      'manage_employees' as const,
      'view_analytics' as const,
      'manage_inventory' as const,
      'manage_backups' as const,
      'manage_settings' as const
    ],
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString()
  },
  {
    id: 'emp-accountant',
    name: 'Amine Kaci (Comptable)',
    email: 'finance@toplaptop.dz',
    role: 'ACCOUNTANT' as const,
    isActive: true,
    passcode: 'finance2026',
    customPermissions: [
      'view_costs_profits' as const,
      'view_analytics' as const,
      'manage_orders' as const
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'emp-delivery',
    name: 'Yacine Merah (Responsable Expéditions)',
    email: 'delivery@toplaptop.dz',
    role: 'DELIVERY_MANAGER' as const,
    isActive: true,
    passcode: 'delivery2026',
    customPermissions: [
      'manage_delivery' as const,
      'manage_orders' as const
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 'emp-sales',
    name: 'Sara Bouzid (Agent Commercial)',
    email: 'sales@toplaptop.dz',
    role: 'SALES_AGENT' as const,
    isActive: true,
    passcode: 'sales2026',
    customPermissions: [
      'manage_orders' as const
    ],
    createdAt: new Date().toISOString()
  }
];
