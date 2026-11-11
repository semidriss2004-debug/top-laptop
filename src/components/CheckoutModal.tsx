import React, { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useStore } from '../context/StoreContext';
import { Order, PaymentMethod, DeliveryMethod } from '../types';
import { 
  X, 
  Truck, 
  Phone, 
  User, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  MessageCircle, 
  Banknote, 
  ShieldCheck, 
  AlertCircle,
  Building2,
  Package
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onOrderSuccess
}) => {
  const { items, subtotalDZD, clearCart } = useCart();
  const { t, language } = useLanguage();
  const { wilayas, deliveryCompanies, createOrder } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedWilayaCode, setSelectedWilayaCode] = useState<number>(16); // Default 16 - Alger
  const [selectedCommuneName, setSelectedCommuneName] = useState<string>('Alger Centre');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('yalidine');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const activeWilayas = useMemo(() => {
    const filtered = (wilayas || []).filter(w => w.isActive);
    return filtered.length > 0 ? filtered : (wilayas || []);
  }, [wilayas]);

  const currentWilaya = useMemo(() => {
    return (
      activeWilayas.find(w => w.code === Number(selectedWilayaCode)) ||
      activeWilayas[0] || {
        code: 16,
        nameFr: '16 - Alger',
        nameAr: '16 - الجزائر',
        communes: [{ id: '16-1', nameFr: 'Alger Centre', nameAr: 'الجزائر الوسطى' }],
        isActive: true
      }
    );
  }, [activeWilayas, selectedWilayaCode]);

  // Available communes for current wilaya
  const currentCommunes = currentWilaya?.communes || [];

  // Active delivery companies that support this wilaya
  const availableCompanies = useMemo(() => {
    const supported = (deliveryCompanies || []).filter(comp => {
      if (!comp.isActive) return false;
      const pricing = comp.wilayaPricing?.[selectedWilayaCode];
      return pricing ? pricing.isSupported : true;
    });
    return supported.length > 0 ? supported : (deliveryCompanies || []).filter(c => c.isActive);
  }, [deliveryCompanies, selectedWilayaCode]);

  // Selected company object
  const activeCompany = useMemo(() => {
    return (
      availableCompanies.find(c => c.id === selectedCompanyId) ||
      availableCompanies[0] ||
      (deliveryCompanies || [])[0]
    );
  }, [availableCompanies, selectedCompanyId, deliveryCompanies]);

  // Calculate live delivery fee from chosen company and method
  const deliveryFee = useMemo(() => {
    if (!activeCompany) return 800;
    const pricing = activeCompany.wilayaPricing?.[selectedWilayaCode];
    if (!pricing) return deliveryMethod === 'home' ? 800 : 500;
    return deliveryMethod === 'home' ? pricing.homePriceDZD : pricing.stopDeskPriceDZD;
  }, [activeCompany, selectedWilayaCode, deliveryMethod]);

  // IMPORTANT: Early return MUST be placed after all React Hooks (useState / useMemo)
  if (!isOpen) return null;

  const totalAmount = subtotalDZD + deliveryFee;
  const formatPrice = (price: number) => price.toLocaleString('fr-DZ') + ' ' + t('dzd');

  // Validate Algerian phone number (05, 06, 07, landline 02-04, or +213)
  const validatePhone = (num: string) => {
    const cleaned = num.replace(/[\s\-\.\(\)]+/g, '');
    const algeriaRegex = /^(0|\+213|00213|213)[2-9][0-9]{7,8}$/;
    return algeriaRegex.test(cleaned);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (items.length === 0) {
      setErrorMsg(
        language === 'ar'
          ? 'سلة المشتريات فارغة. يرجى إضافة منتج قبل تأكيد الطلب.'
          : 'Votre panier est vide. Veuillez ajouter un article avant de confirmer.'
      );
      return;
    }

    if (!customerName.trim()) {
      setErrorMsg(
        language === 'ar'
          ? 'يرجى كتابة الاسم واللقب الكامل.'
          : 'Veuillez saisir votre nom et prénom.'
      );
      return;
    }

    if (!validatePhone(customerPhone)) {
      setErrorMsg(
        language === 'ar'
          ? 'يرجى إدخال رقم هاتف جزائري صالح (مثال: 0555123456 أو 0661123456).'
          : 'Veuillez saisir un numéro de téléphone algérien valide (ex: 0555 12 34 56 ou 0770 12 34 56).'
      );
      return;
    }

    if (!address.trim()) {
      setErrorMsg(
        language === 'ar'
          ? 'يرجى إدخال عنوان التوصيل أو مكتب الاستلام بالتفصيل.'
          : 'Veuillez préciser votre adresse de livraison ou bureau Stop Desk.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems = items.map(item => ({
        productId: item.product.id,
        sku: item.product.sku,
        barcode: item.product.barcode,
        name: item.product.name,
        priceDZD: item.product.priceDZD,
        purchasePriceDZD: item.product.purchasePriceDZD || 0,
        quantity: item.quantity,
        image: item.product.images[0] || '',
        isDigital: item.product.isDigital
      }));

      const chosenCommune = currentCommunes.find(c => c.nameFr === selectedCommuneName) || {
        nameFr: selectedCommuneName || 'Centre',
        nameAr: selectedCommuneName || 'المركز'
      };

      const newOrder = await createOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        wilaya: {
          code: currentWilaya.code,
          nameFr: currentWilaya.nameFr,
          nameAr: currentWilaya.nameAr
        },
        commune: {
          nameFr: chosenCommune.nameFr,
          nameAr: chosenCommune.nameAr
        },
        address: address.trim(),
        deliveryCompanyId: activeCompany?.id || 'yalidine',
        deliveryCompanyName: activeCompany?.name || 'Yalidine Express',
        deliveryMethod,
        items: orderItems,
        subtotalDZD,
        deliveryFeeDZD: deliveryFee,
        totalDZD: totalAmount,
        paymentMethod,
        paymentStatus: 'pending',
        notes: notes.trim()
      });

      clearCart();
      setIsSubmitting(false);
      onClose();
      onOrderSuccess(newOrder);
    } catch (err) {
      console.error(err);
      setErrorMsg(
        language === 'ar'
          ? 'حدث خطأ أثناء تأكيد الطلب. يرجى المحاولة مرة أخرى.'
          : 'Erreur lors de la validation de la commande. Veuillez réessayer.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-sm"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#091122] rounded-3xl border border-cyan-500/40 shadow-[0_0_50px_rgba(0,140,255,0.3)] overflow-hidden my-auto max-h-[94dvh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-blue-900/40 bg-[#060C18] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-md">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">{t('checkoutTitle')}</h3>
              <p className="text-xs text-slate-400">
                {language === 'ar'
                  ? 'املأ معلوماتك لتأكيد الطلب — توصيل سريع إلى 69 ولاية جزائرية'
                  : 'Remplissez vos informations — Livraison express vers les 69 Wilayas d\'Algérie'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-blue-950/60 text-slate-400 hover:text-white border border-blue-900/40 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Full Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('fullName')} *</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder={t('fullNamePlaceholder')}
                className="w-full bg-[#050A14] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border border-blue-900/60 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('phone')} *</span>
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder={t('phonePlaceholder')}
                className="w-full bg-[#050A14] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border border-blue-900/60 focus:border-cyan-400 focus:outline-none"
              />
              <span className="text-[10px] text-slate-400 block">{t('phoneHelp')}</span>
            </div>
          </div>

          {/* 69 Wilayas & Communes Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{t('wilaya')} (69 Wilayas) *</span>
              </label>
              <select
                value={selectedWilayaCode}
                onChange={(e) => {
                  const code = Number(e.target.value);
                  setSelectedWilayaCode(code);
                  const w = wilayas.find(item => item.code === code);
                  if (w && w.communes && w.communes.length > 0) {
                    setSelectedCommuneName(w.communes[0].nameFr);
                  } else {
                    setSelectedCommuneName('Centre');
                  }
                }}
                className="w-full bg-[#050A14] text-white text-xs sm:text-sm rounded-xl px-3 py-2.5 border border-blue-900/60 focus:border-cyan-400 focus:outline-none"
              >
                {activeWilayas.map(w => (
                  <option key={w.code} value={w.code} className="bg-[#080F1C] text-white">
                    {language === 'ar' ? w.nameAr : w.nameFr}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span>{language === 'ar' ? 'البلدية *' : 'Commune de livraison *'}</span>
              </label>
              {currentCommunes.length > 0 ? (
                <select
                  value={selectedCommuneName}
                  onChange={(e) => setSelectedCommuneName(e.target.value)}
                  className="w-full bg-[#050A14] text-white text-xs sm:text-sm rounded-xl px-3 py-2.5 border border-blue-900/60 focus:border-cyan-400 focus:outline-none"
                >
                  {currentCommunes.map(c => (
                    <option key={c.id} value={c.nameFr} className="bg-[#080F1C] text-white">
                      {language === 'ar' ? c.nameAr : c.nameFr}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  value={selectedCommuneName}
                  onChange={(e) => setSelectedCommuneName(e.target.value)}
                  placeholder={language === 'ar' ? 'اسم البلدية...' : 'Nom de votre commune...'}
                  className="w-full bg-[#050A14] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border border-blue-900/60 focus:border-cyan-400 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Delivery Company & Method Choice */}
          <div className="bg-[#050A14] p-4 rounded-2xl border border-blue-900/50 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-bold text-cyan-300 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                <span>{language === 'ar' ? 'شركة التوصيل وطريقة الاستلام' : 'Société de Livraison & Mode'}</span>
              </span>
              <span className="text-[10px] text-slate-400">
                {language === 'ar'
                  ? `أسعار التوصيل لولاية ${currentWilaya.nameAr}`
                  : `Tarifs calculés pour ${currentWilaya.nameFr}`}
              </span>
            </div>

            {/* Delivery Companies Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {availableCompanies.map(comp => (
                <button
                  type="button"
                  key={comp.id}
                  onClick={() => {
                    setSelectedCompanyId(comp.id);
                    if (!comp.supportsStopDesk && deliveryMethod === 'stopdesk') {
                      setDeliveryMethod('home');
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    activeCompany?.id === comp.id
                      ? 'bg-blue-600/30 border-cyan-400 text-white shadow-[0_0_12px_rgba(0,140,255,0.3)]'
                      : 'bg-[#080F1C] border-blue-900/40 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="truncate w-full">{comp.name}</span>
                </button>
              ))}
            </div>

            {/* Home Delivery vs Stop Desk toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeliveryMethod('home')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  deliveryMethod === 'home'
                    ? 'bg-blue-950 border-cyan-400 text-cyan-300 shadow-sm'
                    : 'bg-[#080F1C] border-blue-900/40 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{language === 'ar' ? 'توصيل للمنزل (À Domicile)' : 'À Domicile'}</span>
                </div>
                <span className="font-mono">
                  {formatPrice(activeCompany?.wilayaPricing?.[selectedWilayaCode]?.homePriceDZD ?? 800)}
                </span>
              </button>

              <button
                type="button"
                disabled={activeCompany ? !activeCompany.supportsStopDesk : false}
                onClick={() => setDeliveryMethod('stopdesk')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  deliveryMethod === 'stopdesk'
                    ? 'bg-blue-950 border-cyan-400 text-cyan-300 shadow-sm'
                    : 'bg-[#080F1C] border-blue-900/40 text-slate-400'
                } ${activeCompany && !activeCompany.supportsStopDesk ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  <span>{language === 'ar' ? 'مكتب التوصيل (Stop Desk)' : 'Point Relais (Stop Desk)'}</span>
                </div>
                <span className="font-mono">
                  {formatPrice(activeCompany?.wilayaPricing?.[selectedWilayaCode]?.stopDeskPriceDZD ?? 500)}
                </span>
              </button>
            </div>
          </div>

          {/* Detailed Street Address */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {language === 'ar'
                  ? 'العنوان الكامل أو مكتب الاستلام (Stop Desk) *'
                  : 'Adresse exacte ou bureau de retrait *'}
              </span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={
                language === 'ar'
                  ? 'مثال: حي 5 جويلية، عمارة 4 أو مكتب ياليدين وسط المدينة'
                  : 'ex: 15 Rue Didouche Mourad, Étage 2 ou Bureau Stop Desk Yalidine'
              }
              className="w-full bg-[#050A14] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border border-blue-900/60 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Optional Order Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>{t('notes')}</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('notesPlaceholder')}
              className="w-full bg-[#050A14] text-white text-xs sm:text-sm rounded-xl px-3.5 py-2 border border-blue-900/60 focus:border-cyan-400 focus:outline-none"
            />
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-2 border-t border-blue-900/40">
            <label className="text-xs font-bold text-cyan-300 uppercase tracking-wider block font-mono">
              {t('paymentMethod')}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  paymentMethod === 'cod'
                    ? 'bg-blue-950/60 border-cyan-400 shadow-[0_0_15px_rgba(0,140,255,0.3)]'
                    : 'bg-[#050A14] border-blue-900/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Banknote className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-bold text-white">{t('paymentCod')}</span>
                  </div>
                  {paymentMethod === 'cod' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-tight">
                  {t('paymentCodDesc')}
                </p>
              </div>

              <div
                onClick={() => setPaymentMethod('whatsapp')}
                className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  paymentMethod === 'whatsapp'
                    ? 'bg-emerald-950/40 border-emerald-400 shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                    : 'bg-[#050A14] border-blue-900/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    <span className="text-xs font-bold text-white">{t('paymentWhatsApp')}</span>
                  </div>
                  {paymentMethod === 'whatsapp' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-tight">
                  {t('paymentWhatsAppDesc')}
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="bg-[#050A14] p-4 rounded-2xl border border-blue-900/50 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>{t('subtotal')} ({items.length} {t('cartItemsCount')})</span>
              <span className="font-mono">{formatPrice(subtotalDZD)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>
                {language === 'ar'
                  ? `سعر التوصيل (${activeCompany?.name || 'Yalidine'} - ${currentWilaya.nameAr}) :`
                  : `Frais de port (${activeCompany?.name || 'Yalidine'} - ${currentWilaya.nameFr}) :`}
              </span>
              <span className="font-mono text-cyan-300">{formatPrice(deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-blue-900/40">
              <span>{t('total')}</span>
              <span className="text-xl font-black text-cyan-400 font-mono">
                {formatPrice(totalAmount)}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 hover:from-blue-500 hover:to-cyan-400 text-white font-black text-base shadow-[0_0_25px_rgba(0,140,255,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer transform active:scale-98 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>{t('processing')}</span>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>{t('confirmOrderBtn')} ({formatPrice(totalAmount)})</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
