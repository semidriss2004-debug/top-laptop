import React from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/StoreContext';
import { 
  X, 
  Trash2, 
  ShoppingCart, 
  ArrowRight, 
  Truck, 
  ShieldCheck, 
  Plus, 
  Minus 
} from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const { items, removeFromCart, updateQuantity, isCartOpen, setIsCartOpen, subtotalDZD, totalItemsCount } = useCart();
  const { t, language } = useLanguage();
  const { settings } = useStore();

  if (!isCartOpen) return null;

  const formatPrice = (price: number) => price.toLocaleString('fr-DZ') + ' ' + t('dzd');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm">
      <div 
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0"
      />

      <div 
        onClick={(e) => e.stopPropagation()}
        className={`absolute inset-y-0 ${
          language === 'ar' ? 'left-0' : 'right-0'
        } max-w-full w-full sm:w-[480px] bg-[#080F1C] border-s border-blue-900/50 shadow-2xl flex flex-col z-10`}
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-blue-900/40 bg-[#050A14] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-950 text-cyan-400 border border-blue-800/40">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{t('cart')}</h3>
              <span className="text-xs text-slate-400 font-mono">
                {totalItemsCount} {t('cartItemsCount')}
              </span>
            </div>
          </div>

          <button
            onClick={() => setIsCartOpen(false)}
            className="p-2 rounded-lg bg-blue-950/60 text-slate-400 hover:text-white border border-blue-900/40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Items List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-blue-950/60 border border-blue-900/40 flex items-center justify-center text-slate-500">
                <ShoppingCart className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">{t('cartEmptyTitle')}</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">{t('cartEmptySub')}</p>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
              >
                {t('startShopping')}
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex gap-3 bg-[#0B1528] p-3.5 rounded-2xl border border-blue-900/40 relative group"
              >
                {/* Product thumbnail */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-black/60 border border-blue-900/50 flex-shrink-0">
                  <img
                    src={product.images[0] || 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80'}
                    alt={product.name}
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-white truncate">{product.name}</h4>
                      <button
                        onClick={() => removeFromCart(product.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                        title="Supprimer du panier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[10px] text-cyan-400 font-mono mt-0.5">
                      {product.brand}{product.processor ? ` • ${product.processor}` : product.isDigital ? ' • Licence Numérique' : product.category === 'laptop_bags_cases' ? ' • Bagagerie PC' : ''}
                    </div>
                  </div>

                  {/* Quantity and Price */}
                  <div className="flex items-center justify-between mt-2 pt-1">
                    <div className="text-xs font-mono font-bold text-cyan-300">
                      {formatPrice(product.priceDZD * quantity)}
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center bg-[#050A14] border border-blue-900/60 rounded-lg p-0.5">
                      <button
                        onClick={() => updateQuantity(product.id, quantity - 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-blue-900/50"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-7 text-center text-xs font-mono font-bold text-white">
                        {quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, quantity + 1)}
                        className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white rounded hover:bg-blue-900/50"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer / Checkout summary */}
        {items.length > 0 && (
          <div className="p-5 border-t border-blue-900/40 bg-[#050A14] space-y-4">
            {/* Algerian Delivery note */}
            <div className="flex items-center justify-between text-xs text-slate-400 bg-blue-950/40 p-2.5 rounded-xl border border-blue-900/40">
              <span className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-cyan-400" />
                <span>{t('deliveryFee')}</span>
              </span>
              <span className="font-mono font-bold text-cyan-300">
                {settings.flatDeliveryFeeDZD.toLocaleString('fr-DZ')} {t('dzd')}
              </span>
            </div>

            {/* Subtotal and Total */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>{t('subtotal')}</span>
                <span className="font-mono">{formatPrice(subtotalDZD)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-white pt-1 border-t border-blue-900/30">
                <span>{t('total')}</span>
                <span className="text-cyan-400 font-mono text-lg font-black">
                  {formatPrice(subtotalDZD + settings.flatDeliveryFeeDZD)}
                </span>
              </div>
            </div>

            {/* Checkout CTA */}
            <button
              onClick={() => {
                setIsCartOpen(false);
                onProceedToCheckout();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-[0_0_20px_rgba(0,140,255,0.4)] flex items-center justify-center gap-2 transition-all cursor-pointer transform active:scale-98"
            >
              <span>{t('checkout')}</span>
              <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t('paymentCodDesc')}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
