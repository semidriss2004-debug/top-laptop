import React from 'react';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { useStore } from '../context/StoreContext';
import { 
  Cpu, 
  HardDrive, 
  Layers, 
  Monitor, 
  ShoppingCart, 
  Check, 
  Shield, 
  Eye, 
  MessageCircle,
  Key,
  Briefcase,
  Zap,
  Truck
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onOrderNow?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect, onOrderNow }) => {
  const { t, language } = useLanguage();
  const { addToCart, items } = useCart();
  const { activeTheme } = useTheme();
  const { settings } = useStore();

  const isItemInCart = items.some(item => item.product.id === product.id);

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-DZ') + ' ' + t('dzd');
  };

  const handleQuickWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = (settings.whatsappNumber || '213555123456').replace(/[^0-9]/g, '');
    const message = language === 'ar'
      ? `السلام عليكم، أود طلب أو الاستفسار عن: ${product.name} (SKU: ${product.sku}) بسعر ${formatPrice(product.priceDZD)}`
      : `Bonjour TOP LAPTOP, je souhaite commander ou avoir des détails sur : ${product.name} (SKU: ${product.sku}) - ${formatPrice(product.priceDZD)}`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock > 0) {
      if (!isItemInCart) {
        addToCart(product, 1);
      } else if (onOrderNow) {
        onOrderNow(product);
      }
    }
  };

  const handleQuickOrderNow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.stock > 0) {
      if (!isItemInCart) {
        addToCart(product, 1);
      }
      if (onOrderNow) {
        onOrderNow(product);
      }
    }
  };

  return (
    <div
      onClick={() => onSelect(product)}
      className="group relative flex flex-col rounded-2xl border transition-all duration-300 hover:shadow-2xl cursor-pointer overflow-hidden"
      style={{
        backgroundColor: activeTheme.cardBgColor,
        borderColor: `${activeTheme.borderColor}66`
      }}
    >
      {/* Top Image & Badges Container */}
      <div className="relative aspect-[16/11] bg-black/40 overflow-hidden">
        <img
          src={product.images[0] || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80'}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out"
        />

        {/* Gradient shadow overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Badges in top corners */}
        <div className="absolute top-2.5 start-2.5 flex flex-col gap-1.5 z-10">
          {product.originalPriceDZD && (
            <span className="px-2 py-0.5 rounded-md bg-rose-600 text-[10px] font-black tracking-wide text-white shadow-sm flex items-center gap-1">
              {t('promoBadge')}
            </span>
          )}

          {product.isDigital ? (
            <span className="px-2 py-0.5 rounded-md bg-indigo-600/90 text-indigo-100 border border-indigo-400/40 text-[10px] font-bold shadow-sm flex items-center gap-1">
              <Key className="w-3 h-3" />
              <span>Licence Numérique</span>
            </span>
          ) : product.category === 'laptop_bags_cases' ? (
            <span className="px-2 py-0.5 rounded-md bg-amber-600/90 text-amber-100 border border-amber-400/40 text-[10px] font-bold shadow-sm flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              <span>Bagagerie PC</span>
            </span>
          ) : (
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide shadow-sm ${
                product.condition === 'new'
                  ? 'bg-blue-600/90 text-cyan-200 border border-blue-400/30'
                  : 'bg-amber-600/90 text-amber-100 border border-amber-400/30'
              }`}
            >
              {product.condition === 'new' ? t('condNew') : t('condUsed')}
            </span>
          )}
        </div>

        <div className="absolute top-2.5 end-2.5 z-10">
          <span className="px-2.5 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-md text-xs font-mono font-bold text-cyan-300 border border-blue-500/30">
            {product.brand}
          </span>
        </div>

        {/* Quick View overlay button */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs">
          <button
            onClick={() => onSelect(product)}
            className="px-3.5 py-1.5 rounded-xl font-extrabold text-xs flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all text-black"
            style={{ backgroundColor: activeTheme.accentColor }}
          >
            <Eye className="w-4 h-4" />
            <span>{t('viewDetails')}</span>
          </button>
        </div>
      </div>

      {/* Product Content Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
        {/* Title and Category */}
        <div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
            <span className="uppercase tracking-wider">{product.sku}</span>
            {product.warrantyMonths && (
              <span className="flex items-center gap-1 text-cyan-400">
                <Shield className="w-3 h-3" />
                <span>{product.warrantyMonths} {t('months')}</span>
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </div>

        {/* Specifications Matrix (Hardware vs Digital Software vs Bags) */}
        {product.isDigital && product.digitalDetails ? (
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#050A14] p-2.5 rounded-xl border border-indigo-900/40">
            <div className="flex items-center gap-1.5 text-indigo-300">
              <Zap className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{product.digitalDetails.licenseType}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span>Durée : {product.digitalDetails.duration}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 col-span-2">
              <span>Appareils : {product.digitalDetails.devicesCount} Poste(s)</span>
            </div>
          </div>
        ) : product.category === 'laptop_bags_cases' && product.bagDetails ? (
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#050A14] p-2.5 rounded-xl border border-amber-900/40">
            <div className="text-amber-300 truncate">
              {product.bagDetails.compatibleSizes.join(', ')}
            </div>
            <div className="text-slate-300 truncate">
              {product.bagDetails.material}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#050A14] p-2.5 rounded-xl border border-blue-900/30">
            <div className="flex items-center gap-1.5 text-slate-300 truncate" title={product.processor}>
              <Cpu className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              <span className="truncate font-medium">{product.processor || 'CPU Pro'}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300 truncate" title={product.ram}>
              <Layers className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span className="truncate font-medium">{product.ram || 'RAM'}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300 truncate" title={product.storage}>
              <HardDrive className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
              <span className="truncate font-medium">{product.storage || 'SSD NVMe'}</span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-300 truncate" title={product.gpu}>
              <Monitor className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
              <span className="truncate font-medium">{product.gpu || 'GPU'}</span>
            </div>
          </div>
        )}

        {/* Price & Action Row */}
        <div className="pt-2 border-t border-blue-900/40 flex items-end justify-between gap-3">
          <div>
            {product.originalPriceDZD && (
              <span className="text-xs text-slate-500 line-through block font-mono">
                {product.originalPriceDZD.toLocaleString('fr-DZ')} {t('dzd')}
              </span>
            )}
            <div 
              className="text-base sm:text-lg font-black font-mono tracking-tight leading-none"
              style={{ color: activeTheme.accentColor }}
            >
              {formatPrice(product.priceDZD)}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleQuickWhatsApp}
              title="Commander via WhatsApp"
              className="p-2.5 rounded-xl bg-[#0F223D] hover:bg-[#152E52] border border-green-500/40 text-green-400 hover:text-green-300 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
            </button>

            {product.stock > 0 && (
              <button
                onClick={handleQuickOrderNow}
                title={language === 'ar' ? 'اطلب الآن (تأكيد الطلب)' : 'Commander maintenant'}
                className="p-2.5 sm:px-3 sm:py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1 transition-all shadow-md cursor-pointer"
              >
                <Truck className="w-4 h-4" />
                <span className="hidden sm:inline">{language === 'ar' ? 'اطلب الآن' : 'Commander'}</span>
              </button>
            )}

            <button
              disabled={product.stock <= 0}
              onClick={handleAddToCart}
              title={t('addToCart')}
              className={`p-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                product.stock <= 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : isItemInCart
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'text-white'
              }`}
              style={
                !isItemInCart && product.stock > 0
                  ? { backgroundColor: activeTheme.primaryColor }
                  : undefined
              }
            >
              {isItemInCart ? (
                <Check className="w-4 h-4" />
              ) : (
                <ShoppingCart className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
