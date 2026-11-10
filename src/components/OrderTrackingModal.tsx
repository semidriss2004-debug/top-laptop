import React, { useState } from 'react';
import { useStore } from '../context/StoreContext';
import { useLanguage } from '../context/LanguageContext';
import { Order, OrderStatus } from '../types';
import { 
  X, 
  Search, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Phone, 
  AlertCircle,
  ExternalLink 
} from 'lucide-react';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose
}) => {
  const { orders } = useStore();
  const { t, language } = useLanguage();

  const [searchCode, setSearchCode] = useState('');
  const [phoneSearch, setPhoneSearch] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    const codeClean = searchCode.trim().toUpperCase();
    const phoneClean = phoneSearch.replace(/\s+/g, '');

    const match = orders.find(o => {
      const matchCode = o.id.toUpperCase() === codeClean;
      const matchPhone = !phoneClean || o.customerPhone.replace(/\s+/g, '').includes(phoneClean);
      return matchCode && matchPhone;
    });

    setFoundOrder(match || null);
  };

  const steps: { status: OrderStatus; labelFr: string; labelAr: string }[] = [
    { status: 'new', labelFr: 'Reçue', labelAr: 'تم الاستلام' },
    { status: 'confirmed', labelFr: 'Confirmée', labelAr: 'مؤكدة' },
    { status: 'preparing', labelFr: 'En préparation', labelAr: 'قيد التجهيز' },
    { status: 'shipped', labelFr: 'Expédiée', labelAr: 'تم الشحن' },
    { status: 'out_for_delivery', labelFr: 'En livraison', labelAr: 'قيد التوصيل' },
    { status: 'delivered', labelFr: 'Livrée', labelAr: 'تم التسليم' }
  ];

  const getStepIndex = (status: OrderStatus) => {
    switch (status) {
      case 'new': return 0;
      case 'confirmed': return 1;
      case 'preparing':
      case 'ready_shipping': return 2;
      case 'shipped': return 3;
      case 'out_for_delivery': return 4;
      case 'delivered': return 5;
      default: return -1;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-sm">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#091122] rounded-3xl border border-cyan-500/40 shadow-[0_0_50px_rgba(0,140,255,0.3)] overflow-hidden my-auto max-h-[92vh] flex flex-col p-6 sm:p-8"
      >
        <button
          onClick={onClose}
          className="absolute top-5 end-5 p-2 rounded-lg bg-blue-950/60 text-slate-400 hover:text-white border border-blue-900/40"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-md">
            <Truck className="w-6 h-6 animate-pulse" />
          </div>
          <h3 className="text-xl font-black text-white">
            {language === 'ar' ? 'تتبع شحنة طلبك' : 'Suivi de Commande en Direct'}
          </h3>
          <p className="text-xs text-slate-400">
            {language === 'ar' 
              ? 'أدخل رقم طلبك (مثال: TL-8941) ورقم الهاتف لمعرفة مسار الشحنة' 
              : 'Saisissez votre référence de commande (ex: TL-8941) pour suivre votre colis vers votre Wilaya.'}
          </p>
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearch} className="space-y-3 bg-[#050A14] p-4 rounded-2xl border border-blue-900/40">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              required
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="Code commande (ex: TL-8941)"
              className="bg-[#080F1C] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border border-blue-900/60 focus:border-cyan-400 focus:outline-none font-mono"
            />
            <input
              type="tel"
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              placeholder="N° de téléphone (optionnel)"
              className="bg-[#080F1C] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border border-blue-900/60 focus:border-cyan-400 focus:outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,140,255,0.4)] cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>{language === 'ar' ? 'تتبع الطلبية الآن' : 'Rechercher la commande'}</span>
          </button>
        </form>

        {/* Search Results */}
        {hasSearched && !foundOrder && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>
              {language === 'ar' 
                ? 'لم يتم العثور على أي طلبية بهذا الرقم. يرجى التأكد من الرمز المدخل.' 
                : 'Aucune commande trouvée avec cette référence. Vérifiez votre code (ex: TL-XXXX).'}
            </span>
          </div>
        )}

        {foundOrder && (
          <div className="mt-6 space-y-6 overflow-y-auto">
            {/* Status Summary */}
            <div className="bg-[#050A14] p-4 rounded-2xl border border-blue-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Statut actuel :</span>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-600/30 text-cyan-300 border border-cyan-400/50">
                  {foundOrder.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Transporteur :</span>
                <span className="font-bold text-white">{foundOrder.deliveryCompanyName || 'Yalidine Express'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Destination :</span>
                <span className="font-bold text-cyan-300">
                  {foundOrder.wilaya.nameFr} ({foundOrder.commune.nameFr})
                </span>
              </div>
            </div>

            {/* Stepper Progress */}
            <div className="relative pt-2">
              <div className="grid grid-cols-6 gap-1 text-center">
                {steps.map((st, idx) => {
                  const currentIdx = getStepIndex(foundOrder.status);
                  const isDone = currentIdx >= idx;
                  const isCurrent = currentIdx === idx;

                  return (
                    <div key={idx} className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isDone 
                          ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(0,212,255,0.6)]' 
                          : 'bg-blue-950 text-slate-500 border border-blue-900'
                      } ${isCurrent ? 'ring-2 ring-white scale-110' : ''}`}>
                        {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                      </div>
                      <span className={`text-[10px] mt-1.5 font-medium leading-tight ${
                        isDone ? 'text-white' : 'text-slate-500'
                      }`}>
                        {language === 'ar' ? st.labelAr : st.labelFr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Notes */}
            <div className="space-y-2 text-xs">
              <h4 className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                Historique des étapes
              </h4>
              <div className="space-y-1.5">
                {foundOrder.statusHistory?.map((h, i) => (
                  <div key={i} className="flex items-start gap-2 bg-[#050A14] p-2.5 rounded-xl border border-blue-900/30">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold text-white capitalize">{h.status}</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(h.changedAt).toLocaleString('fr-DZ')}
                        </span>
                      </div>
                      {h.note && <div className="text-slate-400 text-[11px] mt-0.5">{h.note}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
