import React from 'react';
import { Order } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/StoreContext';
import { 
  CheckCircle2, 
  MessageCircle, 
  MapPin, 
  Phone, 
  User, 
  ShoppingBag, 
  ArrowRight,
  Printer,
  Key
} from 'lucide-react';

interface OrderConfirmationModalProps {
  order: Order | null;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({ order, onClose }) => {
  const { t, language } = useLanguage();
  const { settings } = useStore();

  if (!order) return null;

  const formatPrice = (price: number) => price.toLocaleString('fr-DZ') + ' ' + t('dzd');

  const handleSendWhatsAppSlip = () => {
    const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, '');
    const itemsList = order.items
      .map(i => `• ${i.name} (x${i.quantity}) - ${formatPrice(i.priceDZD * i.quantity)}`)
      .join('\n');

    const message = language === 'ar'
      ? `*طلب جديد من TOP LAPTOP الجزائر*\n` +
        `--------------------------------\n` +
        `*رقم الطلب:* ${order.id}\n` +
        `*الاسم:* ${order.customerName}\n` +
        `*الهاتف:* ${order.customerPhone}\n` +
        `*الولاية:* ${order.wilaya.nameAr} - ${order.commune?.nameAr || ''}\n` +
        `*العنوان:* ${order.address}\n\n` +
        `*الأجهزة المطلوبة:*\n${itemsList}\n\n` +
        `*المجموع الفرعي:* ${formatPrice(order.subtotalDZD)}\n` +
        `*مصاريف الشحن (69 ولاية):* ${formatPrice(order.deliveryFeeDZD)}\n` +
        `*المجموع الكلي:* ${formatPrice(order.totalDZD)}\n` +
        `*طريقة الدفع:* ${order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' : 'واتساب مباشر'}`
      : `*NOUVELLE COMMANDE - TOP LAPTOP ALGERIE*\n` +
        `--------------------------------\n` +
        `*Référence :* ${order.id}\n` +
        `*Client :* ${order.customerName}\n` +
        `*Téléphone :* ${order.customerPhone}\n` +
        `*Wilaya :* ${order.wilaya.nameFr} - ${order.commune?.nameFr || ''}\n` +
        `*Adresse :* ${order.address}\n\n` +
        `*Articles commandés :*\n${itemsList}\n\n` +
        `*Sous-total :* ${formatPrice(order.subtotalDZD)}\n` +
        `*Livraison (69 Wilayas) :* ${formatPrice(order.deliveryFeeDZD)}\n` +
        `*Total à régler :* ${formatPrice(order.totalDZD)}\n` +
        `*Paiement :* ${order.paymentMethod === 'cod' ? 'Cash à la livraison (COD)' : 'Confirmation WhatsApp'}`;

    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-[#091122] rounded-3xl border border-emerald-500/40 shadow-[0_0_60px_rgba(16,185,129,0.25)] overflow-hidden my-auto max-h-[92vh] flex flex-col p-6 sm:p-8"
      >
        {/* Top Success Badge */}
        <div className="text-center space-y-3 pb-6 border-b border-blue-900/40">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <h2 className="text-2xl font-black text-white">{t('orderConfirmedTitle')}</h2>
          
          <div className="inline-block bg-[#050A14] px-4 py-1.5 rounded-full border border-cyan-400/50">
            <span className="text-xs text-slate-400 me-2">{t('orderCode')}:</span>
            <span className="text-base font-black font-mono text-cyan-400 tracking-wider">
              {order.id}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
            {t('orderSuccessDesc')}
          </p>
        </div>

        {/* Order Slip Summary */}
        <div className="py-5 overflow-y-auto space-y-4">
          <div className="bg-[#050A14] p-4 rounded-2xl border border-blue-900/40 space-y-2 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-blue-900/30">
              <span className="flex items-center gap-1.5 text-slate-400">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Client</span>
              </span>
              <span className="font-bold text-white">{order.customerName}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-blue-900/30">
              <span className="flex items-center gap-1.5 text-slate-400">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Téléphone</span>
              </span>
              <span className="font-bold font-mono text-white">{order.customerPhone}</span>
            </div>

            <div className="flex items-center justify-between pb-2 border-b border-blue-900/30">
              <span className="flex items-center gap-1.5 text-slate-400">
                <MapPin className="w-3.5 h-3.5 text-blue-400" />
                <span>Destination</span>
              </span>
              <span className="font-bold text-white text-end">
                {language === 'ar' ? order.wilaya.nameAr : order.wilaya.nameFr} — {order.commune?.nameFr} ({order.address})
              </span>
            </div>

            <div className="pt-2">
              <div className="font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-cyan-400" />
                <span>Articles ({order.items.length})</span>
              </div>
              <div className="space-y-1.5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-slate-300">
                      <span className="truncate max-w-[260px]">
                        {item.name} <span className="text-cyan-400 font-mono">x{item.quantity}</span>
                      </span>
                      <span className="font-mono">{formatPrice(item.priceDZD * item.quantity)}</span>
                    </div>
                    {item.assignedLicenseKey && (
                      <div className="bg-indigo-950/50 border border-indigo-500/40 rounded-lg p-2 text-[11px] font-mono text-indigo-200 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                        <span>Clé de licence : <strong>{item.assignedLicenseKey}</strong></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-2 border-t border-blue-900/40 text-sm font-bold text-white">
              <span>{t('total')}</span>
              <span className="text-cyan-400 font-mono text-base font-black">
                {formatPrice(order.totalDZD)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-3 border-t border-blue-900/40">
          <button
            onClick={handleSendWhatsAppSlip}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-sm shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 cursor-pointer transition-all transform active:scale-98"
          >
            <MessageCircle className="w-5 h-5" />
            <span>{t('sendToWhatsAppBtn')}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 rounded-xl bg-blue-950/60 hover:bg-blue-900/50 text-slate-300 hover:text-white border border-blue-900/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer le reçu</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl bg-[#050A14] hover:bg-blue-950/80 text-cyan-300 hover:text-white border border-blue-900/50 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <span>{t('continueShopping')}</span>
              <ArrowRight className={`w-3.5 h-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
