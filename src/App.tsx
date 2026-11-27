import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { CartProvider, useCart } from './context/CartContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Filters } from './components/Filters';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { ContactModal } from './components/ContactModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Footer } from './components/Footer';
import { Product, Order } from './types';
import { trackPageView } from './utils/metaPixel';
import { 
  Laptop, 
  Frown, 
  Eye, 
  X, 
  Check, 
  Gamepad2, 
  Briefcase, 
  Key, 
  Sparkles, 
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';

type SortOption = 'default' | 'newest' | 'price_asc' | 'price_desc' | 'promo';

const StorefrontContent: React.FC = () => {
  const { products, isAdminAuthenticated, settings } = useStore();
  const { addToCart } = useCart();
  const { t, language } = useLanguage();
  const { activeTheme, previewThemeId, stopPreview, setTheme } = useTheme();

  // Dynamic price ceiling so high-value laptops are never hidden by the slider
  const priceCeiling = useMemo(() => {
    const highest = products.reduce((max, p) => Math.max(max, p.priceDZD || 0), 600000);
    return Math.ceil(highest / 50000) * 50000;
  }, [products]);

  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [maxPrice, setMaxPrice] = useState<number>(priceCeiling);
  const [isPriceManuallyFiltered, setIsPriceManuallyFiltered] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('default');

  useEffect(() => {
    if (!isPriceManuallyFiltered) {
      setMaxPrice(priceCeiling);
    }
  }, [priceCeiling, isPriceManuallyFiltered]);

  // Modals & Navigation States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminViewOpen, setIsAdminViewOpen] = useState(false);

  const isFirstRenderRef = useRef(true);
  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      return;
    }
    trackPageView();
  }, [selectedCategory, selectedCondition, isTrackingOpen, isAdminViewOpen]);

  const catalogRef = useRef<HTMLDivElement>(null);

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedCondition('all');
    setIsPriceManuallyFiltered(false);
    setMaxPrice(priceCeiling);
    setInStockOnly(false);
    setSortBy('default');
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    const normalizeText = (txt: string) =>
      txt
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '');

    const keywords = normalizeText(searchQuery)
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const matched = products.filter(product => {
      let matchesSearch = true;
      if (keywords.length > 0) {
        const searchablePool = normalizeText(
          [
            product.name,
            product.brand,
            product.category,
            product.sku,
            product.barcode,
            product.description?.fr,
            product.description?.ar,
            product.processor,
            product.ram,
            product.storage,
            product.gpu,
            product.screenSize,
            product.digitalDetails?.subcategory,
            product.digitalDetails?.licenseType,
            product.digitalDetails?.duration,
            product.digitalDetails?.activationInstructions?.fr,
            product.digitalDetails?.activationInstructions?.ar,
            product.bagDetails?.subcategory,
            product.bagDetails?.material,
            product.bagDetails?.color,
            product.bagDetails?.compatibleSizes?.join(' ')
          ]
            .filter(Boolean)
            .join(' ')
        );

        matchesSearch = keywords.every(kw => searchablePool.includes(kw));
      }

      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesBrand = selectedBrand === 'all' || product.brand === selectedBrand;
      const matchesCondition = selectedCondition === 'all' || product.condition === selectedCondition;
      const matchesPrice = !isPriceManuallyFiltered || product.priceDZD <= maxPrice;
      const matchesStock = !inStockOnly || product.stock > 0;

      return matchesSearch && matchesCategory && matchesBrand && matchesCondition && matchesPrice && matchesStock;
    });

    const sorted = [...matched];
    if (sortBy === 'price_asc') {
      sorted.sort((a, b) => a.priceDZD - b.priceDZD);
    } else if (sortBy === 'price_desc') {
      sorted.sort((a, b) => b.priceDZD - a.priceDZD);
    } else if (sortBy === 'newest') {
      sorted.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt || 0).getTime() -
          new Date(a.updatedAt || a.createdAt || 0).getTime()
      );
    } else if (sortBy === 'promo') {
      sorted.sort((a, b) => {
        const discA = a.originalPriceDZD ? a.originalPriceDZD - a.priceDZD : 0;
        const discB = b.originalPriceDZD ? b.originalPriceDZD - b.priceDZD : 0;
        return discB - discA;
      });
    }

    return sorted;
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedBrand,
    selectedCondition,
    maxPrice,
    isPriceManuallyFiltered,
    inStockOnly,
    sortBy
  ]);

  const handleAdminClick = () => {
    if (isAdminAuthenticated) {
      setIsAdminViewOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  if (isAdminViewOpen && isAdminAuthenticated) {
    return <AdminDashboard onBackToStore={() => setIsAdminViewOpen(false)} />;
  }

  // Quick Department Cards
  const departmentCards = [
    {
      id: 'gaming',
      titleAr: 'أجهزة الألعاب Gaming',
      titleFr: 'Gaming & e-Sport',
      subAr: 'RTX 4060 / 4070 / 4080',
      subFr: 'RTX 4060 / 4070 / 4080',
      icon: Gamepad2,
      accent: 'from-cyan-500/20 to-blue-600/10 border-cyan-500/40 text-cyan-400',
      count: products.filter(p => p.category === 'gaming').length
    },
    {
      id: 'professional',
      titleAr: 'صناع المحتوى والمحترفين',
      titleFr: 'Créateurs & Pro',
      subAr: 'MacBook Pro • OLED • WS',
      subFr: 'MacBook Pro • OLED • WS',
      icon: Laptop,
      accent: 'from-blue-500/20 to-indigo-600/10 border-blue-500/40 text-blue-400',
      count: products.filter(p => p.category === 'professional').length
    },
    {
      id: 'business',
      titleAr: 'الأعمال والمكاتب',
      titleFr: 'Bureautique & Pro',
      subAr: 'ThinkPad • Latitude • EliteBook',
      subFr: 'ThinkPad • Latitude • EliteBook',
      icon: Briefcase,
      accent: 'from-emerald-500/20 to-teal-600/10 border-emerald-500/40 text-emerald-400',
      count: products.filter(p => p.category === 'business').length
    },
    {
      id: 'software_digital',
      titleAr: 'برامج ورخص أصلية',
      titleFr: 'Logiciels & Licences',
      subAr: 'Windows • Office • Antivirus',
      subFr: 'Windows • Office • Antivirus',
      icon: Key,
      accent: 'from-indigo-500/20 to-purple-600/10 border-indigo-500/40 text-indigo-400',
      count: products.filter(p => p.category === 'software_digital').length
    },
    {
      id: 'laptop_bags_cases',
      titleAr: 'حقائب وإكسسوارات',
      titleFr: 'Sacs & Bagagerie PC',
      subAr: 'حماية احترافية ومقاومة للماء',
      subFr: 'Protection antichoc & étanche',
      icon: Sparkles,
      accent: 'from-amber-500/20 to-orange-600/10 border-amber-500/40 text-amber-400',
      count: products.filter(p => p.category === 'laptop_bags_cases').length
    }
  ];

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedBrand !== 'all' ||
    selectedCondition !== 'all' ||
    isPriceManuallyFiltered ||
    inStockOnly ||
    sortBy !== 'default';

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Theme Live Preview Alert Banner */}
      {previewThemeId && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-black px-4 py-2 font-bold text-xs flex items-center justify-between sticky top-0 z-50 shadow-lg">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 animate-pulse" />
            <span>
              {language === 'ar' ? 'وضع معاينة المظهر:' : 'Mode Prévisualisation du Thème :'}{' '}
              <strong>{language === 'ar' ? activeTheme.nameAr : activeTheme.nameFr}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTheme(previewThemeId);
                stopPreview();
              }}
              className="bg-black text-white px-3 py-1 rounded-md text-[11px] hover:bg-slate-900 transition flex items-center gap-1 font-semibold cursor-pointer"
            >
              <Check className="w-3 h-3" />
              <span>{language === 'ar' ? 'تفعيل هذا المظهر' : 'Activer ce thème'}</span>
            </button>
            <button
              onClick={stopPreview}
              className="bg-black/20 hover:bg-black/40 text-black p-1 rounded-md transition cursor-pointer"
              title="Quitter la prévisualisation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <Header
        onOpenAdmin={handleAdminClick}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedCondition={selectedCondition}
        setSelectedCondition={setSelectedCondition}
        onNavigateToCatalog={scrollToCatalog}
      />

      {/* Dynamic Futuristic Hero */}
      <Hero
        onScrollToCatalog={scrollToCatalog}
        onSelectProduct={(prod) => setSelectedProduct(prod)}
        onOrderProduct={(prod) => {
          addToCart(prod, 1);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Visual Department Bento Grid */}
      <section className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-8 pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {departmentCards.map(dept => {
            const Icon = dept.icon;
            const isSelected = selectedCategory === dept.id;
            return (
              <button
                key={dept.id}
                onClick={() => {
                  setSelectedCategory(isSelected ? 'all' : dept.id);
                  scrollToCatalog();
                }}
                className={`group text-start p-3.5 sm:p-4 rounded-2xl border bg-gradient-to-br transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-cyan-400 bg-blue-950/70 shadow-[0_0_20px_rgba(0,212,255,0.25)] scale-[1.01]'
                    : `bg-[#091122]/90 hover:bg-[#0D1830] border-blue-900/40 hover:border-cyan-500/50`
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${dept.accent} border flex items-center justify-center`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#050A14] text-cyan-300 border border-blue-900/40">
                    {dept.count}
                  </span>
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-extrabold text-white group-hover:text-cyan-300 transition-colors truncate">
                    {language === 'ar' ? dept.titleAr : dept.titleFr}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                    {language === 'ar' ? dept.subAr : dept.subFr}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Main Catalog View */}
      <section ref={catalogRef} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Catalog Header & Sorting Toolbar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-blue-900/30">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1">
              <Laptop className="w-3.5 h-3.5" />
              <span>{settings.storeName || t('brandName')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {language === 'ar' ? 'كتالوج المنتجات المتوفرة' : 'Catalogue & Disponibilités'}
            </h2>
          </div>

          {/* Sort & Results Count Toolbar */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
            <div className="text-xs text-slate-400 font-mono">
              {language === 'ar' ? 'عرض' : 'Affichage de'}{' '}
              <span className="font-bold text-cyan-300">{filteredProducts.length}</span>{' '}
              {t('resultsCount')}
            </div>

            <div className="flex items-center gap-2 bg-[#091122] px-3 py-1.5 rounded-xl border border-blue-900/50 text-xs">
              <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="text-slate-400 hidden sm:inline">
                {language === 'ar' ? 'الترتيب:' : 'Trier par :'}
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="default" className="bg-[#091122]">
                  {language === 'ar' ? 'الافتراضي' : 'Recommandés'}
                </option>
                <option value="newest" className="bg-[#091122]">
                  {language === 'ar' ? 'الأحدث أولاً' : 'Plus récents'}
                </option>
                <option value="price_asc" className="bg-[#091122]">
                  {language === 'ar' ? 'السعر: من الأقل للأعلى' : 'Prix : Croissant'}
                </option>
                <option value="price_desc" className="bg-[#091122]">
                  {language === 'ar' ? 'السعر: من الأعلى للأقل' : 'Prix : Décroissant'}
                </option>
                <option value="promo" className="bg-[#091122]">
                  {language === 'ar' ? 'العروض والتخفيضات' : 'Promotions'}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Pills Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pt-4">
            <span className="text-[11px] text-slate-400 font-semibold">
              {language === 'ar' ? 'الفلاتر النشطة:' : 'Filtres actifs :'}
            </span>
            {searchQuery.trim() && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-2.5 py-1 rounded-full bg-blue-950/80 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>"{searchQuery}"</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="px-2.5 py-1 rounded-full bg-blue-950/80 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>{selectedCategory}</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {selectedBrand !== 'all' && (
              <button
                onClick={() => setSelectedBrand('all')}
                className="px-2.5 py-1 rounded-full bg-blue-950/80 border border-cyan-500/40 text-cyan-300 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>{selectedBrand}</span>
                <X className="w-3 h-3" />
              </button>
            )}
            {selectedCondition !== 'all' && (
              <button
                onClick={() => setSelectedCondition('all')}
                className="px-2.5 py-1 rounded-full bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>{selectedCondition === 'new' ? t('condNew') : t('condUsed')}</span>
                <X className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1 rounded-full bg-rose-950/50 hover:bg-rose-900/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('clearFilters')}</span>
            </button>
          </div>
        )}

        {/* 2-Column Catalog Layout: Filters Sidebar + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mt-6 items-start">
          {/* Filters Sidebar */}
          <div className="lg:col-span-3">
            <Filters
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedBrand={selectedBrand}
              setSelectedBrand={setSelectedBrand}
              selectedCondition={selectedCondition}
              setSelectedCondition={setSelectedCondition}
              maxPrice={maxPrice}
              setMaxPrice={(val) => {
                setIsPriceManuallyFiltered(true);
                setMaxPrice(val);
              }}
              priceCeiling={priceCeiling}
              inStockOnly={inStockOnly}
              setInStockOnly={setInStockOnly}
              onReset={handleResetFilters}
              resultsCount={filteredProducts.length}
            />
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-9">
            {filteredProducts.length === 0 ? (
              <div className="bg-[#091122] rounded-3xl border border-blue-900/40 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-950/60 border border-blue-900/50 flex items-center justify-center mx-auto text-slate-500">
                  <Frown className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {language === 'ar'
                    ? 'لا توجد منتجات مطابقة لمعايير البحث الحالية'
                    : 'Aucun produit ne correspond à vos critères'}
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {language === 'ar'
                    ? 'جرّب إعادة ضبط الفلاتر أو توسيع نطاق السعر والفئة لعرض جميع الأجهزة المتوفرة.'
                    : "Essayez d'ajuster vos filtres de prix ou de catégorie pour découvrir nos autres ordinateurs disponibles."}
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-cyan-500 hover:text-black text-white font-bold text-xs transition-all shadow-md cursor-pointer"
                >
                  {t('clearFilters')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={setSelectedProduct}
                    onOrderNow={() => setIsCheckoutOpen(true)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Cart Drawer */}
      <CartDrawer
        onProceedToCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOrderNow={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal (69 Algerian Wilayas) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(order) => setConfirmedOrder(order)}
      />

      {/* Order Confirmation Screen */}
      <OrderConfirmationModal
        order={confirmedOrder}
        onClose={() => setConfirmedOrder(null)}
      />

      {/* Public Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => setIsTrackingOpen(false)}
      />

      {/* Contact Us Modal */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
      />

      {/* Admin Login Gateway Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdminLoginOpen(false);
          setIsAdminViewOpen(true);
        }}
      />

      {/* Footer */}
      <Footer
        onOpenAdmin={handleAdminClick}
        onOpenTracking={() => setIsTrackingOpen(true)}
        onOpenContact={() => setIsContactOpen(true)}
        onSelectCategory={(cat) => {
          setSelectedCategory(cat);
          scrollToCatalog();
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <StoreProvider>
          <CartProvider>
            <StorefrontContent />
            <Analytics />
          </CartProvider>
        </StoreProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
