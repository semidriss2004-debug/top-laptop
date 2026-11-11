import React, { useState } from 'react';
import { Product } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { useStore } from '../context/StoreContext';
import { useTheme } from '../context/ThemeContext';
import { 
  X, 
  ShoppingCart, 
  MessageCircle, 
  Cpu, 
  Layers, 
  HardDrive, 
  Monitor, 
  ShieldCheck, 
  Truck, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  Share2,
  Key,
  Briefcase,
  Zap
} from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onOrderNow?: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose, onOrderNow }) => {
  const { t, language } = useLanguage();
  const { addToCart, items } = useCart();
  const { settings } = useStore();
  const { activeTheme } = useTheme();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!product) return null;

  const isItemInCart = items.some(i => i.product.id === product.id);
  const formatPrice = (price: number) => price.toLocaleString('fr-DZ') + ' ' + t('dzd');

  const handleWhatsAppOrder = () => {
    const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const message = language === 'ar'
      ? `مرحباً TOP LAPTOP، أود طلب الجهاز التالي مباشرة:\n• الجهاز: ${product.name} (SKU: ${product.sku})\n• السعر: ${formatPrice(product.priceDZD)}\n• الكمية: ${quantity}`
      : `Bonjour TOP LAPTOP, je souhaite commander directement cet article :\n• Modèle : ${product.name} (SKU: ${product.sku})\n• Prix : ${formatPrice(product.priceDZD)}\n• Quantité : ${quantity}`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAddToCart = () => {
    if (product.stock > 0) {
      addToCart(product, quantity);
    }
  };

  const handleDirectOrder = () => {
    if (product.stock > 0) {
      if (!isItemInCart) {
        addToCart(product, quantity);
      }
      onClose();
      if (onOrderNow) {
        onOrderNow();
      }
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-sm">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-[#091122] rounded-3xl border border-cyan-500/40 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col"
      >
        {/* Top bar with close */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900/40 bg-[#060C18]">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-md bg-blue-600/30 text-cyan-300 border border-blue-500/40 text-xs font-mono font-bold">
              {product.brand}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              SKU: {product.sku}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg bg-blue-950/60 text-slate-400 hover:text-cyan-300 border border-blue-900/40 text-xs flex items-center gap-1 transition-all"
              title="Copier le lien"
            >
              <Share2 className="w-4 h-4" />
              {copiedLink && <span className="text-[10px] text-emerald-400 font-bold">Copié!</span>}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-blue-950/60 text-slate-400 hover:text-white border border-blue-900/40"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Left: Image gallery */}
            <div className="md:col-span-6 space-y-3">
              <div className="relative aspect-[16/11] rounded-2xl overflow-hidden bg-black/60 border border-blue-900/50 shadow-inner group">
                <img
                  src={product.images[selectedImageIndex] || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover object-center"
                />

                {/* Condition badge */}
                <div className="absolute top-3 start-3">
                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold tracking-wide shadow-md ${
                      product.condition === 'new'
                        ? 'bg-blue-600 text-cyan-100 border border-blue-400/40'
                        : 'bg-amber-600 text-amber-100 border border-amber-400/40'
                    }`}
                  >
                    {product.condition === 'new' ? t('condNew') : t('condUsed')}
                  </span>
                </div>

                {/* Navigation arrows if multiple images */}
                {product.images.length > 1 && (
                  <div className="absolute inset-y-0 start-0 end-0 flex items-center justify-between px-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setSelectedImageIndex(prev => (prev === 0 ? product.images.length - 1 : prev - 1))}
                      className="p-2 rounded-full bg-black/70 text-white hover:bg-blue-600 pointer-events-auto transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex(prev => (prev === product.images.length - 1 ? 0 : prev + 1))}
                      className="p-2 rounded-full bg-black/70 text-white hover:bg-blue-600 pointer-events-auto transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Thumbnails row */}
              {product.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                        selectedImageIndex === idx ? 'border-cyan-400 scale-105' : 'border-blue-900/60 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Algerian Delivery & Trust banner */}
              <div className="bg-[#050A14] p-3.5 rounded-xl border border-blue-900/40 space-y-2 text-xs">
                <div className="flex items-center gap-2 text-cyan-300 font-semibold">
                  <Truck className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>Livraison assurée vers les 69 Wilayas d'Algérie</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Paiement en espèces à la livraison (Cash on Delivery)</span>
                </div>
              </div>
            </div>

            {/* Right: Specs & Ordering */}
            <div className="md:col-span-6 flex flex-col justify-between space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white leading-snug">
                  {product.name}
                </h2>

                {/* Price Display */}
                <div className="mt-3 flex items-baseline gap-3">
                  <span 
                    className="text-2xl sm:text-3xl font-black font-mono"
                    style={{ color: activeTheme.accentColor }}
                  >
                    {formatPrice(product.priceDZD)}
                  </span>
                  {product.originalPriceDZD && (
                    <span className="text-sm text-slate-500 line-through font-mono">
                      {product.originalPriceDZD.toLocaleString('fr-DZ')} {t('dzd')}
                    </span>
                  )}
                </div>

                {/* Stock & Warranty Status */}
                <div className="mt-3 flex items-center gap-4 text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>{product.stock > 0 ? `${t('inStock')} (${product.stock})` : t('outOfStock')}</span>
                  </span>

                  {product.warrantyMonths && (
                    <span className="flex items-center gap-1.5 text-cyan-300">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{t('warranty')}: {product.warrantyMonths} {t('months')}</span>
                    </span>
                  )}
                </div>

                {/* Localized Description */}
                <p className="mt-4 text-sm text-slate-300 leading-relaxed bg-[#050A14]/70 p-3.5 rounded-xl border border-blue-900/30">
                  {language === 'ar' ? product.description.ar : product.description.fr}
                </p>
              </div>

              {/* Dynamic Specifications Block (Digital vs Bags vs PCs) */}
              {product.isDigital && product.digitalDetails ? (
                <div className="p-4 bg-[#050A14] rounded-2xl border border-indigo-900/40 space-y-2 text-xs">
                  <span className="font-bold text-indigo-400 uppercase tracking-wider block font-mono">
                    Détails du Produit Numérique
                  </span>
                  <div className="space-y-1 text-slate-300">
                    <div className="flex justify-between border-b border-blue-900/30 py-1">
                      <span className="text-slate-400">Type de Licence :</span>
                      <span className="font-bold text-white">{product.digitalDetails.licenseType}</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-900/30 py-1">
                      <span className="text-slate-400">Validité :</span>
                      <span className="font-bold text-white">{product.digitalDetails.duration}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Nombre d'appareils :</span>
                      <span className="font-bold text-white">{product.digitalDetails.devicesCount} Poste(s)</span>
                    </div>
                  </div>
                </div>
              ) : product.category === 'laptop_bags_cases' && product.bagDetails ? (
                <div className="p-4 bg-[#050A14] rounded-2xl border border-amber-900/40 space-y-2 text-xs">
                  <span className="font-bold text-amber-400 uppercase tracking-wider block font-mono">
                    Caractéristiques Bagagerie
                  </span>
                  <div className="space-y-1 text-slate-300">
                    <div className="flex justify-between border-b border-blue-900/30 py-1">
                      <span className="text-slate-400">Tailles compatibles :</span>
                      <span className="font-bold text-white">{product.bagDetails.compatibleSizes.join(', ')}</span>
                    </div>
                    <div className="flex justify-between border-b border-blue-900/30 py-1">
                      <span className="text-slate-400">Matériau :</span>
                      <span className="font-bold text-white">{product.bagDetails.material}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Couleur :</span>
                      <span className="font-bold text-white">{product.bagDetails.color}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">
                    {t('specSheet')}
                  </h4>
                  <div className="grid grid-cols-1 gap-2 text-xs bg-[#050A14] p-3.5 rounded-xl border border-blue-900/40">
                    <div className="flex items-center justify-between py-1 border-b border-blue-900/30">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Cpu className="w-3.5 h-3.5 text-blue-400" />
                        <span>{t('processor')}</span>
                      </span>
                      <span className="font-bold text-white text-end">{product.processor}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-blue-900/30">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Layers className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{t('ram')}</span>
                      </span>
                      <span className="font-bold text-white text-end">{product.ram}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-blue-900/30">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{t('storage')}</span>
                      </span>
                      <span className="font-bold text-white text-end">{product.storage}</span>
                    </div>

                    <div className="flex items-center justify-between py-1 border-b border-blue-900/30">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Monitor className="w-3.5 h-3.5 text-teal-400" />
                        <span>{t('gpu')}</span>
                      </span>
                      <span className="font-bold text-white text-end">{product.gpu}</span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Monitor className="w-3.5 h-3.5 text-blue-300" />
                        <span>{t('screen')}</span>
                      </span>
                      <span className="font-bold text-white text-end">{product.screenSize}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Quantity & CTA Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-[#050A14] border border-blue-900/50 rounded-xl p-1 text-sm">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-blue-900/40"
                    >
                      -
                    </button>
                    <span className="w-10 text-center font-bold text-white">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                      className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-blue-900/40"
                    >
                      +
                    </button>
                  </div>

                  <button
                    disabled={product.stock <= 0}
                    onClick={handleAddToCart}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                      product.stock <= 0
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : isItemInCart
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'text-white'
                    }`}
                    style={
                      !isItemInCart && product.stock > 0
                        ? { 
                            background: `linear-gradient(135deg, ${activeTheme.primaryColor}, ${activeTheme.accentColor})`,
                            boxShadow: activeTheme.glowEffect
                          }
                        : undefined
                    }
                  >
                    {isItemInCart ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{language === 'ar' ? 'تمت الإضافة للسلة' : 'Article déjà au panier'}</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>{t('addToCart')}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Direct 1-Click Order / Checkout Button */}
                {product.stock > 0 && (
                  <button
                    onClick={handleDirectOrder}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,212,255,0.35)] transition-all cursor-pointer"
                  >
                    <Truck className="w-5 h-5" />
                    <span>
                      {language === 'ar'
                        ? 'اطلب الآن — ملء معلومات التوصيل (69 ولاية)'
                        : 'Commander maintenant — Remplir mes coordonnées'}
                    </span>
                  </button>
                )}

                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full py-3 px-4 rounded-xl bg-[#0B2516] hover:bg-[#0E321E] border border-green-500/50 text-green-300 hover:text-green-200 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  <span>{t('orderWhatsApp')}</span>
                </button>
              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
