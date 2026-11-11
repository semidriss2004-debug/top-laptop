import React, { useState, useMemo, useRef } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { StoreProvider, useStore } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Filters } from './components/Filters';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderConfirmationModal } from './components/OrderConfirmationModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { Footer } from './components/Footer';
import { Product, Order } from './types';
import { Sparkles, Laptop, Frown, Eye, X, Check } from 'lucide-react';

const StorefrontContent: React.FC = () => {
  const { products, isAdminAuthenticated } = useStore();
  const { t, language } = useLanguage();
  const { activeTheme, previewThemeId, stopPreview, setTheme } = useTheme();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedCondition, setSelectedCondition] = useState('all');
  const [maxPrice, setMaxPrice] = useState(600000);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Modals & Navigation States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAdminViewOpen, setIsAdminViewOpen] = useState(false);

  const catalogRef = useRef<HTMLDivElement>(null);

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedBrand('all');
    setSelectedCondition('all');
    setMaxPrice(600000);
    setInStockOnly(false);
  };

  // Filtered Products (Full-Text Keyword Search including Arabic & French Descriptions + All Specs)
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

    return products.filter(product => {
      // Search across Title, Brand, SKU, Barcode, French & Arabic Descriptions, Hardware, Software & Bag specs
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

      // Category
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

      // Brand
      const matchesBrand = selectedBrand === 'all' || product.brand === selectedBrand;

      // Condition
      const matchesCondition = selectedCondition === 'all' || product.condition === selectedCondition;

      // Price
      const matchesPrice = product.priceDZD <= maxPrice;

      // In stock
      const matchesStock = !inStockOnly || product.stock > 0;

      return matchesSearch && matchesCategory && matchesBrand && matchesCondition && matchesPrice && matchesStock;
    });
  }, [products, searchQuery, selectedCategory, selectedBrand, selectedCondition, maxPrice, inStockOnly]);

  const handleAdminClick = () => {
    if (isAdminAuthenticated) {
      setIsAdminViewOpen(true);
    } else {
      setIsAdminLoginOpen(true);
    }
  };

  // If viewing admin dashboard
  if (isAdminViewOpen && isAdminAuthenticated) {
    return <AdminDashboard onBackToStore={() => setIsAdminViewOpen(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* Theme Live Preview Alert Banner */}
      {previewThemeId && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-black px-4 py-2 font-bold text-xs flex items-center justify-between sticky top-0 z-50 shadow-lg">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 animate-pulse" />
            <span>Mode Prévisualisation du Thème : <strong>{language === 'ar' ? activeTheme.nameAr : activeTheme.nameFr}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setTheme(previewThemeId);
                stopPreview();
              }}
              className="bg-black text-white px-3 py-1 rounded-md text-[11px] hover:bg-slate-900 transition flex items-center gap-1 font-semibold"
            >
              <Check className="w-3 h-3" />
              Activer ce thème
            </button>
            <button
              onClick={stopPreview}
              className="bg-black/20 hover:bg-black/40 text-black p-1 rounded-md transition"
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
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedCondition={selectedCondition}
        setSelectedCondition={setSelectedCondition}
      />

      {/* Futuristic Hero */}
      <Hero onScrollToCatalog={scrollToCatalog} />

      {/* Main Catalog View */}
      <section ref={catalogRef} className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-baseline justify-between gap-4 pb-6 border-b border-blue-900/30">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1">
              <Laptop className="w-3.5 h-3.5" />
              <span>{t('brandName')} ALGERIA</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Catalogue & Disponibilités
            </h2>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Affichage de <span className="font-bold text-cyan-300">{filteredProducts.length}</span> {t('resultsCount')}
          </div>
        </div>

        {/* 2-Column Catalog Layout: Filters Sidebar + Products Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8 items-start">
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
              setMaxPrice={setMaxPrice}
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
                <h3 className="text-lg font-bold text-white">Aucun produit ne correspond à vos critères</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Essayez d'ajuster vos filtres de prix ou de catégorie pour découvrir nos autres ordinateurs disponibles.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-cyan-500 hover:text-black text-white font-bold text-xs transition-all shadow-md"
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
          </CartProvider>
        </StoreProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
