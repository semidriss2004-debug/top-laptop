import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/StoreContext';
import { Product } from '../types';
import { buildWhatsAppUrl } from '../utils/contactLinks';
import { getEffectiveSiteConfig } from '../config/siteConfig';
import { trackContact } from '../utils/metaPixel';
import { 
  Cpu, 
  Truck, 
  ShieldCheck, 
  Headphones, 
  Flame, 
  MessageCircle, 
  ArrowRight,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  ShoppingBag
} from 'lucide-react';

interface HeroProps {
  onScrollToCatalog: () => void;
  onSelectProduct?: (product: Product) => void;
  onOrderProduct?: (product: Product) => void;
}

export const Hero: React.FC<HeroProps> = ({
  onScrollToCatalog,
  onSelectProduct,
  onOrderProduct,
}) => {
  const { t, language } = useLanguage();
  const { settings, products } = useStore();

  // Pick featured products dynamically from live catalog (prioritize in-stock promo/hardware items)
  const featuredProducts = React.useMemo(() => {
    const available = products.filter((p) => p.stock > 0);
    const pool = available.length > 0 ? available : products;
    const promos = pool.filter((p) => p.originalPriceDZD && p.originalPriceDZD > p.priceDZD);
    return promos.length > 0 ? [...promos, ...pool.filter((p) => !promos.includes(p))].slice(0, 5) : pool.slice(0, 5);
  }, [products]);

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (activeIndex >= featuredProducts.length) {
      setActiveIndex(0);
    }
  }, [featuredProducts.length, activeIndex]);

  useEffect(() => {
    if (featuredProducts.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featuredProducts.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [featuredProducts.length]);

  const featured = featuredProducts[activeIndex] || products[0];

  const handleWhatsAppClick = () => {
    const siteConfig = getEffectiveSiteConfig(settings);
    trackContact('whatsapp', 'Hero WhatsApp Button');
    const message = language === 'ar'
      ? `السلام عليكم، أرغب في الاستفسار عن الأجهزة المتوفرة في ${siteConfig.storeName}.`
      : `Bonjour ${siteConfig.storeName}, je souhaite me renseigner sur les ordinateurs portables disponibles.`;
    window.open(buildWhatsAppUrl(siteConfig.whatsappNumber, message), '_blank');
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#080F1C] via-[#060B14] to-[#050505] pt-6 pb-12 sm:pt-10 sm:pb-16 border-b border-blue-900/30">
      {/* Background cyber grid & glow effects */}
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -top-10 end-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          
          {/* Main Hero Copy */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-start">
            {/* Top Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-950/80 border border-blue-500/30 shadow-[0_0_15px_rgba(0,140,255,0.2)]">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span className="text-xs font-black tracking-widest text-cyan-300 uppercase">
                {settings.storeName || t('brandName')} • {t('slogan')}
              </span>
            </div>

            {/* Bold Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
              <span className="block">{t('heroHeadline')}</span>
              <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-blue-500 glow-text-cyan">
                {language === 'ar' ? 'أقوى أجهزة الكمبيوتر في الجزائر' : 'Performance Sans Compromis'}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-slate-300 text-sm sm:text-lg max-w-2xl leading-relaxed mx-auto lg:mx-0">
              {t('heroSubheadline')}
            </p>

            {/* Call to Actions */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4 pt-1">
              <button
                onClick={onScrollToCatalog}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-sm sm:text-base shadow-[0_0_25px_rgba(0,140,255,0.5)] hover:shadow-[0_0_35px_rgba(0,212,255,0.6)] transition-all flex items-center gap-2 transform active:scale-95 cursor-pointer"
              >
                <span>{t('catalogBtn')}</span>
                <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={handleWhatsAppClick}
                className="px-6 py-3.5 rounded-xl bg-[#0F223D] hover:bg-[#142C4F] border border-green-500/40 hover:border-green-400 text-green-400 hover:text-green-300 font-bold text-sm sm:text-base shadow-[0_0_15px_rgba(34,197,94,0.15)] transition-all flex items-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-5 h-5 text-green-400" />
                <span>{t('orderWhatsApp')}</span>
              </button>
            </div>

            {/* Mini Trust Badges */}
            <div className="pt-4 grid grid-cols-3 gap-3 border-t border-blue-900/30">
              <div className="text-center lg:text-start">
                <div className="flex items-center justify-center lg:justify-start gap-1.5 text-cyan-400 font-black text-sm sm:text-lg">
                  <Truck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>{language === 'ar' ? '69 ولاية' : '69 Wilayas'}</span>
                </div>
                <div className="text-slate-400 text-[11px] sm:text-xs mt-0.5">{t('statWilayasDesc')}</div>
              </div>

              <div className="text-center lg:text-start">
                <div className="flex items-center justify-center lg:justify-start gap-1.5 text-cyan-400 font-black text-sm sm:text-lg">
                  <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>{language === 'ar' ? 'أصلي ومضمون 100%' : '100% Certifié'}</span>
                </div>
                <div className="text-slate-400 text-[11px] sm:text-xs mt-0.5">{t('statOriginalDesc')}</div>
              </div>

              <div className="text-center lg:text-start">
                <div className="flex items-center justify-center lg:justify-start gap-1.5 text-cyan-400 font-black text-sm sm:text-lg">
                  <Headphones className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                  <span>{language === 'ar' ? 'دعم 7/7 أيام' : 'SAV 7j/7'}</span>
                </div>
                <div className="text-slate-400 text-[11px] sm:text-xs mt-0.5">{t('statSupportDesc')}</div>
              </div>
            </div>
          </div>

          {/* Dynamic Featured Product Card from Live Store Catalog */}
          {featured && (
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md bg-gradient-to-b from-[#0F1E38] via-[#0A1426] to-[#070D18] rounded-3xl p-5 border border-blue-500/40 shadow-[0_0_40px_rgba(0,140,255,0.25)]">
                {/* Header inside card */}
                <div className="flex items-center justify-between pb-3 border-b border-blue-900/50">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                    <span className="text-[11px] font-mono text-cyan-400 font-semibold ps-1.5">
                      {featured.brand} • {featured.sku}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                    <Flame className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'عرض مميز' : 'EN VEDETTE'}</span>
                  </div>
                </div>

                {/* Live Product Image Showcase */}
                <div
                  onClick={() => onSelectProduct && onSelectProduct(featured)}
                  className="relative my-4 aspect-[16/10] rounded-2xl overflow-hidden bg-black/60 border border-blue-900/40 group cursor-pointer"
                >
                  <img
                    src={featured.images?.[0] || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80'}
                    alt={featured.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-3 start-3 end-3 flex items-end justify-between gap-2 text-white">
                    <div className="min-w-0">
                      <span className="text-[11px] font-mono text-cyan-300 font-semibold block truncate">
                        {featured.processor || featured.brand} {featured.gpu ? `• ${featured.gpu}` : ''}
                      </span>
                      <span className="text-sm sm:text-base font-extrabold block truncate">
                        {featured.name}
                      </span>
                    </div>
                    <div className="text-end flex-shrink-0">
                      {featured.originalPriceDZD && (
                        <span className="text-[11px] text-slate-400 line-through block font-mono">
                          {featured.originalPriceDZD.toLocaleString('fr-DZ')} {t('dzd')}
                        </span>
                      )}
                      <span className="text-base sm:text-lg font-black text-cyan-400 font-mono">
                        {featured.priceDZD.toLocaleString('fr-DZ')} {t('dzd')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Dynamic Telemetry Specs Row */}
                <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                  <div className="bg-[#050A14] p-2.5 rounded-xl border border-blue-900/30 flex items-center gap-2 min-w-0">
                    <Cpu className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400">{language === 'ar' ? 'المعالج' : 'Processeur'}</div>
                      <div className="font-bold text-white truncate">{featured.processor || featured.brand}</div>
                    </div>
                  </div>

                  <div className="bg-[#050A14] p-2.5 rounded-xl border border-blue-900/30 flex items-center gap-2 min-w-0">
                    <Layers className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[10px] text-slate-400">{language === 'ar' ? 'الذاكرة والتخزين' : 'RAM & Stockage'}</div>
                      <div className="font-bold text-white truncate">
                        {[featured.ram, featured.storage].filter(Boolean).join(' • ') || (language === 'ar' ? 'أداء فائق' : 'Haute Performance')}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action & Carousel Navigation Footer */}
                <div className="mt-4 pt-3 border-t border-blue-900/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {featuredProducts.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveIndex((prev) => (prev - 1 + featuredProducts.length) % featuredProducts.length)
                          }
                          className="p-1.5 rounded-lg bg-[#050A14] hover:bg-blue-950 text-slate-300 hover:text-cyan-400 border border-blue-900/40 cursor-pointer"
                          title={language === 'ar' ? 'السابق' : 'Précédent'}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[11px] font-mono text-slate-400 px-1">
                          {activeIndex + 1}/{featuredProducts.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveIndex((prev) => (prev + 1) % featuredProducts.length)}
                          className="p-1.5 rounded-lg bg-[#050A14] hover:bg-blue-950 text-slate-300 hover:text-cyan-400 border border-blue-900/40 cursor-pointer"
                          title={language === 'ar' ? 'التالي' : 'Suivant'}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectProduct && onSelectProduct(featured)}
                      className="px-3 py-1.5 rounded-xl bg-blue-950/70 hover:bg-blue-900 text-cyan-300 border border-blue-800/50 text-xs font-bold cursor-pointer transition-all"
                    >
                      {t('viewDetails')}
                    </button>
                    {onOrderProduct && featured.stock > 0 && (
                      <button
                        type="button"
                        onClick={() => onOrderProduct(featured)}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1 shadow-md cursor-pointer transition-all"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>{language === 'ar' ? 'اطلب الآن' : 'Commander'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
};
