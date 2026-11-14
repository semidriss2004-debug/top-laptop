import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/StoreContext';
import { ProductBrand } from '../types';
import { Filter, RotateCcw, Check, ChevronDown, ChevronUp } from 'lucide-react';

interface FiltersProps {
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  selectedBrand: string;
  setSelectedBrand: (brand: string) => void;
  selectedCondition: string;
  setSelectedCondition: (cond: string) => void;
  maxPrice: number;
  setMaxPrice: (price: number) => void;
  priceCeiling?: number;
  inStockOnly: boolean;
  setInStockOnly: (val: boolean) => void;
  onReset: () => void;
  resultsCount: number;
}

const DEFAULT_BRANDS: ProductBrand[] = [
  'ASUS', 'Apple', 'Lenovo', 'Dell', 'HP', 'Acer', 'MSI',
  'Microsoft', 'Kaspersky', 'ESET', 'Adobe', 'Autodesk', 'Targus', 'Samsonite'
];

export const Filters: React.FC<FiltersProps> = ({
  selectedCategory,
  setSelectedCategory,
  selectedBrand,
  setSelectedBrand,
  selectedCondition,
  setSelectedCondition,
  maxPrice,
  setMaxPrice,
  priceCeiling = 1000000,
  inStockOnly,
  setInStockOnly,
  onReset,
  resultsCount
}) => {
  const { t, language } = useLanguage();
  const { products } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const categories = [
    { id: 'all', labelFr: 'Tous les produits', labelAr: 'جميع المنتجات' },
    { id: 'gaming', labelFr: 'Gaming & e-Sport', labelAr: 'ألعاب ورياضات إلكترونية' },
    { id: 'professional', labelFr: 'Créateurs & Pro', labelAr: 'صناع المحتوى والمحترفين' },
    { id: 'business', labelFr: 'Bureautique & Entreprise', labelAr: 'إدارة وأعمال مكتبية' },
    { id: 'laptops', labelFr: 'PC Portables Ultra', labelAr: 'أجهزة محمولة خفيفة' },
    { id: 'desktops', labelFr: 'PC de Bureau & Tours', labelAr: 'أجهزة مكتبية' },
    { id: 'software_digital', labelFr: 'Logiciels & Licences', labelAr: 'برامج ورخص رقمية' },
    { id: 'laptop_bags_cases', labelFr: 'Sacs & Housses PC', labelAr: 'حقائب وحوافظ لابتوب' },
    { id: 'accessories', labelFr: 'Accessoires & Périphériques', labelAr: 'ملحقات وإكسسوارات' },
    { id: 'components', labelFr: 'Composants & Pièces', labelAr: 'قطع ومكونات الكمبيوتر' },
    { id: 'printers', labelFr: 'Imprimantes', labelAr: 'طابعات وماسحات' }
  ];

  // Combine default brands with any active brand in catalog
  const availableBrands = React.useMemo(() => {
    const dynamicBrands = Array.from(new Set(products.map(p => p.brand)));
    return Array.from(new Set([...DEFAULT_BRANDS, ...dynamicBrands]));
  }, [products]);

  const getCategoryCount = (catId: string) =>
    catId === 'all' ? products.length : products.filter(p => p.category === catId).length;

  return (
    <aside className="bg-[#091122] rounded-2xl border border-blue-900/40 p-4 sm:p-5 shadow-lg lg:sticky lg:top-32">
      {/* Header (Clickable on Mobile to Toggle Filters) */}
      <div className={`flex items-center justify-between ${mobileOpen ? 'pb-3 border-b border-blue-900/40' : 'lg:pb-3 lg:border-b lg:border-blue-900/40'}`}>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex items-center gap-2 text-white font-bold text-sm lg:cursor-default"
        >
          <Filter className="w-4 h-4 text-cyan-400" />
          <span>{t('filters')}</span>
          <span className="text-xs font-mono font-normal text-cyan-300 bg-blue-950/80 px-2 py-0.5 rounded-full border border-blue-800/40">
            {resultsCount}
          </span>
          <span className="lg:hidden text-cyan-400 ms-1">
            {mobileOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden text-xs font-semibold text-cyan-300 bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-800/50"
          >
            {mobileOpen ? (language === 'ar' ? 'إخفاء' : 'Masquer') : (language === 'ar' ? 'تصفية' : 'Filtrer')}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('clearFilters')}</span>
          </button>
        </div>
      </div>

      {/* Collapsible Content on Mobile, Always Open on Desktop */}
      <div className={`${mobileOpen ? 'block mt-4' : 'hidden'} lg:block lg:mt-5 space-y-5`}>
        {/* Category Facet */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider block font-mono">
            {t('filterByCategory')}
          </label>
          <div className="flex flex-col gap-1">
            {categories.map(cat => {
              const count = getCategoryCount(cat.id);
              if (cat.id !== 'all' && count === 0 && selectedCategory !== cat.id) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-all text-start cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : 'text-slate-300 hover:bg-blue-950/50 hover:text-white'
                  }`}
                >
                  <span className="truncate">{language === 'ar' ? cat.labelAr : cat.labelFr}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                      selectedCategory === cat.id ? 'bg-blue-800 text-cyan-200' : 'bg-[#050A14] text-slate-400'
                    }`}>
                      {count}
                    </span>
                    {selectedCategory === cat.id && <Check className="w-3.5 h-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand Facet */}
        <div className="space-y-2 pt-3 border-t border-blue-900/30">
          <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider block font-mono">
            {t('filterByBrand')}
          </label>
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedBrand('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                selectedBrand === 'all'
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'bg-blue-950/40 text-slate-300 hover:text-white hover:bg-blue-900/40'
              }`}
            >
              {t('allBrands')}
            </button>
            {availableBrands.map(brand => (
              <button
                key={brand}
                onClick={() => setSelectedBrand(selectedBrand === brand ? 'all' : brand)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedBrand === brand
                    ? 'bg-cyan-500 text-black font-extrabold shadow-sm'
                    : 'bg-blue-950/40 text-slate-300 hover:text-white hover:bg-blue-900/40'
                }`}
              >
                {brand}
              </button>
            ))}
          </div>
        </div>

        {/* Condition (Neuf / Occasion) */}
        <div className="space-y-2 pt-3 border-t border-blue-900/30">
          <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider block font-mono">
            {t('filterByCondition')}
          </label>
          <div className="grid grid-cols-3 gap-1 bg-[#050A14] p-1 rounded-xl border border-blue-900/40 text-xs">
            <button
              onClick={() => setSelectedCondition('all')}
              className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedCondition === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'ar' ? 'الكل' : 'Tous'}
            </button>
            <button
              onClick={() => setSelectedCondition('new')}
              className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedCondition === 'new' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('condNew')}
            </button>
            <button
              onClick={() => setSelectedCondition('used')}
              className={`py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                selectedCondition === 'used' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t('condUsed')}
            </button>
          </div>
        </div>

        {/* Price Range Slider */}
        <div className="space-y-2 pt-3 border-t border-blue-900/30">
          <div className="flex items-center justify-between text-xs">
            <label className="font-bold text-cyan-300 uppercase tracking-wider font-mono">
              {t('filterByPrice')}
            </label>
            <span className="font-mono font-bold text-white bg-blue-950/80 px-2 py-0.5 rounded border border-blue-900/40">
              {maxPrice.toLocaleString('fr-DZ')} {t('dzd')}
            </span>
          </div>
          <input
            type="range"
            min="1000"
            max={priceCeiling}
            step="5000"
            value={Math.min(maxPrice, priceCeiling)}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer bg-blue-950 h-2 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>1 000 {t('dzd')}</span>
            <span>{priceCeiling.toLocaleString('fr-DZ')} {t('dzd')}</span>
          </div>
        </div>

        {/* In-Stock Toggle */}
        <div className="pt-3 border-t border-blue-900/30">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => setInStockOnly(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 bg-[#050A14] border-blue-900/60 focus:ring-blue-500 accent-blue-600 cursor-pointer"
            />
            <span>{t('filterInStockOnly')}</span>
          </label>
        </div>
      </div>
    </aside>
  );
};
