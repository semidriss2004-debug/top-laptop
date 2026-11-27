import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useStore } from '../../../context/StoreContext';
import { useLanguage } from '../../../context/LanguageContext';
import {
  CommercialDocType,
  CommercialDocument,
  CommercialDocumentLine,
  DeliveryMethod,
  ReceiptPaymentDetails,
  ReceiptPaymentMethod,
} from '../../../types';
import {
  buildDraftFromOrder,
  formatDZD,
  getDocTypeLabel,
  getPaymentMethodLabel,
  normalizeLine,
  numberToFrenchWordsDZD,
  recalculateDocumentTotals,
} from '../../../utils/commercialDocuments';
import {
  AlertCircle,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  Plus,
  Save,
  Send,
  ShoppingBag,
  Trash2,
  Truck,
  User,
  Wallet,
  X,
} from 'lucide-react';

interface DocumentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  docType: CommercialDocType;
  documentToEdit?: CommercialDocument | null;
  initialOrderId?: string;
  initialFactureId?: string;
  initialCustomerId?: string;
  onSaved?: (doc: CommercialDocument) => void;
}

export const DocumentFormModal: React.FC<DocumentFormModalProps> = ({
  isOpen,
  onClose,
  docType,
  documentToEdit,
  initialOrderId,
  initialFactureId,
  initialCustomerId,
  onSaved,
}) => {
  const {
    orders,
    products,
    customers,
    wilayas,
    deliveryCompanies,
    commercialDocuments,
    documentSettings,
    createCommercialDocument,
    updateDraftDocument,
    issueCommercialDocument,
    currentEmployee,
  } = useStore();
  const { language } = useLanguage();

  const todayStr = new Date().toISOString().slice(0, 10);
  const plus15Str = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedFactureId, setSelectedFactureId] = useState<string>('');
  const [date, setDate] = useState<string>(todayStr);
  const [validityDate, setValidityDate] = useState<string>(plus15Str);

  // Customer fields
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custWilayaCode, setCustWilayaCode] = useState<number>(16);
  const [custCommune, setCustCommune] = useState<string>('Alger Centre');
  const [custRc, setCustRc] = useState('');
  const [custNif, setCustNif] = useState('');

  // Lines
  const [lines, setLines] = useState<CommercialDocumentLine[]>([]);
  const [catalogPickId, setCatalogPickId] = useState<string>('');

  // Tax, Delivery & Totals controls
  const [tvaRate, setTvaRate] = useState<number>(documentSettings.defaultTvaRate ?? 19);
  const [applyTimbre, setApplyTimbre] = useState<boolean>(Boolean(documentSettings.enableTimbre));
  const [deliveryFeeDZD, setDeliveryFeeDZD] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');

  // BL specific
  const [blShowPrices, setBlShowPrices] = useState<boolean>(true);
  const [deliveryCompanyId, setDeliveryCompanyId] = useState<string>('yalidine');
  const [deliveryCompanyName, setDeliveryCompanyName] = useState<string>('Yalidine Express');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('home');
  const [trackingNumber, setTrackingNumber] = useState<string>('');

  // Facture specific
  const [paymentTerms, setPaymentTerms] = useState<string>('Paiement comptant à réception');

  // Receipt specific
  const [paymentMethod, setPaymentMethod] = useState<ReceiptPaymentMethod>('cash');
  const [paymentDetails, setPaymentDetails] = useState<ReceiptPaymentDetails>({});
  const [paymentAmountDZD, setPaymentAmountDZD] = useState<number>(0);

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const payableFactures = useMemo(
    () =>
      commercialDocuments.filter(
        (d) => d.type === 'facture' && d.status !== 'cancelled' && d.status !== 'draft'
      ),
    [commercialDocuments]
  );

  // Initialize or reset form when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setErrors([]);
    setIsSubmitting(false);
    submittingRef.current = false;

    if (documentToEdit) {
      setSelectedOrderId(documentToEdit.orderId || '');
      setSelectedFactureId(documentToEdit.linkedFactureId || '');
      setDate(documentToEdit.date || todayStr);
      setValidityDate(documentToEdit.validityDate || plus15Str);
      setCustName(documentToEdit.customer.name || '');
      setCustPhone(documentToEdit.customer.phone || '');
      setCustAddress(documentToEdit.customer.address || '');
      setCustWilayaCode(documentToEdit.customer.wilayaCode || 16);
      setCustCommune(documentToEdit.customer.communeNameFr || '');
      setCustRc(documentToEdit.customer.rc || '');
      setCustNif(documentToEdit.customer.nif || '');
      setLines(documentToEdit.lines.map((l) => ({ ...l })));
      setTvaRate(documentToEdit.tvaRate ?? 0);
      setApplyTimbre(Boolean(documentToEdit.applyTimbre));
      setDeliveryFeeDZD(documentToEdit.deliveryFeeDZD || 0);
      setNotes(documentToEdit.notes || '');
      setBlShowPrices(documentToEdit.blShowPrices !== false);
      setDeliveryCompanyId(documentToEdit.deliveryCompanyId || 'yalidine');
      setDeliveryCompanyName(documentToEdit.deliveryCompanyName || 'Yalidine Express');
      setDeliveryMethod(documentToEdit.deliveryMethod || 'home');
      setTrackingNumber(documentToEdit.trackingNumber || '');
      setPaymentTerms(documentToEdit.paymentTerms || 'Paiement comptant à réception');
      setPaymentMethod(documentToEdit.paymentMethod || 'cash');
      setPaymentDetails(documentToEdit.paymentMethodDetails || {});
      setPaymentAmountDZD(documentToEdit.paymentAmountDZD ?? documentToEdit.totalDZD ?? 0);
      return;
    }

    // Creating from an initial Facture (e.g. Receipt / BL)
    if (initialFactureId) {
      const fac = commercialDocuments.find((d) => d.id === initialFactureId);
      if (fac) {
        setSelectedFactureId(fac.id);
        setSelectedOrderId(fac.orderId || '');
        setDate(todayStr);
        setCustName(fac.customer.name);
        setCustPhone(fac.customer.phone);
        setCustAddress(fac.customer.address);
        setCustWilayaCode(fac.customer.wilayaCode || 16);
        setCustCommune(fac.customer.communeNameFr || '');
        setCustRc(fac.customer.rc || '');
        setCustNif(fac.customer.nif || '');
        setLines(fac.lines.map((l) => ({ ...l })));
        setTvaRate(fac.tvaRate);
        setApplyTimbre(Boolean(fac.applyTimbre));
        setDeliveryFeeDZD(fac.deliveryFeeDZD);
        setPaymentMethod('cash');
        setPaymentDetails({});
        setPaymentAmountDZD(fac.remainingAmountDZD ?? fac.totalDZD);
        return;
      }
    }

    // Creating from an initial Order
    if (initialOrderId) {
      const ord = orders.find((o) => o.id === initialOrderId);
      if (ord) {
        applyOrderToForm(ord);
        return;
      }
    }

    // Creating from an initial B2B Customer
    if (initialCustomerId) {
      const cust = customers.find((c) => c.id === initialCustomerId);
      if (cust) {
        setSelectedOrderId('');
        setSelectedFactureId('');
        setDate(todayStr);
        setValidityDate(plus15Str);
        setCustName(cust.companyName);
        setCustPhone(cust.phone);
        setCustAddress(cust.address || '');
        setCustWilayaCode(cust.wilayaCode || 16);
        setCustCommune('');
        setCustRc(cust.rc || '');
        setCustNif(cust.nif || '');
        setLines(
          docType === 'receipt'
            ? []
            : [
                normalizeLine({
                  productName: '',
                  description: '',
                  quantity: 1,
                  unitPriceDZD: 0,
                  discountDZD: 0,
                }),
              ]
        );
        setTvaRate(docType === 'bl' ? 0 : documentSettings.defaultTvaRate ?? 19);
        setApplyTimbre(docType === 'facture' ? Boolean(documentSettings.enableTimbre) : false);
        setDeliveryFeeDZD(0);
        setNotes(cust.notes || '');
        return;
      }
    }

    // Blank scratch document
    setSelectedOrderId('');
    setSelectedFactureId('');
    setDate(todayStr);
    setValidityDate(plus15Str);
    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setCustWilayaCode(16);
    setCustCommune('Alger Centre');
    setCustRc('');
    setCustNif('');
    setLines(
      docType === 'receipt'
        ? []
        : [
            normalizeLine({
              productName: '',
              description: '',
              quantity: 1,
              unitPriceDZD: 0,
              discountDZD: 0,
            }),
          ]
    );
    setTvaRate(docType === 'bl' ? 0 : documentSettings.defaultTvaRate ?? 19);
    setApplyTimbre(docType === 'facture' ? Boolean(documentSettings.enableTimbre) : false);
    setDeliveryFeeDZD(0);
    setNotes('');
    setBlShowPrices(true);
    setDeliveryCompanyId(deliveryCompanies[0]?.id || 'yalidine');
    setDeliveryCompanyName(deliveryCompanies[0]?.name || 'Yalidine Express');
    setDeliveryMethod('home');
    setTrackingNumber('');
    setPaymentTerms('Paiement comptant à réception');
    setPaymentMethod('cash');
    setPaymentDetails({});
    setPaymentAmountDZD(0);
  }, [isOpen, documentToEdit, initialOrderId, initialFactureId, initialCustomerId, docType]);

  const applyOrderToForm = (ord: typeof orders[number]) => {
    const draft = buildDraftFromOrder(ord, docType, documentSettings, commercialDocuments, currentEmployee);
    setSelectedOrderId(ord.id);
    setSelectedFactureId(draft.linkedFactureId || '');
    setDate(draft.date);
    setValidityDate(draft.validityDate || plus15Str);
    setCustName(draft.customer.name);
    setCustPhone(draft.customer.phone);
    setCustAddress(draft.customer.address);
    setCustWilayaCode(draft.customer.wilayaCode || 16);
    setCustCommune(draft.customer.communeNameFr || '');
    setLines(draft.lines);
    setTvaRate(draft.tvaRate);
    setApplyTimbre(false);
    setDeliveryFeeDZD(draft.deliveryFeeDZD);
    setNotes(draft.notes || '');
    setDeliveryCompanyId(draft.deliveryCompanyId || 'yalidine');
    setDeliveryCompanyName(draft.deliveryCompanyName || 'Yalidine Express');
    setDeliveryMethod(draft.deliveryMethod || 'home');
    setTrackingNumber(draft.trackingNumber || '');
    if (docType === 'receipt') {
      setPaymentAmountDZD(draft.paymentAmountDZD || ord.totalDZD);
    }
  };

  const handlePickFacture = (factureId: string) => {
    setSelectedFactureId(factureId);
    const fac = commercialDocuments.find((d) => d.id === factureId);
    if (!fac) return;
    setSelectedOrderId(fac.orderId || '');
    setCustName(fac.customer.name);
    setCustPhone(fac.customer.phone);
    setCustAddress(fac.customer.address);
    setCustWilayaCode(fac.customer.wilayaCode || 16);
    setCustCommune(fac.customer.communeNameFr || '');
    setCustRc(fac.customer.rc || '');
    setCustNif(fac.customer.nif || '');
    setLines(fac.lines.map((l) => ({ ...l })));
    setTvaRate(fac.tvaRate);
    setDeliveryFeeDZD(fac.deliveryFeeDZD);
    if (docType === 'receipt') {
      setPaymentAmountDZD(fac.remainingAmountDZD ?? fac.totalDZD);
    }
  };

  const totals = useMemo(() => {
    return recalculateDocumentTotals({
      lines,
      tvaRate,
      deliveryFeeDZD,
      applyTimbre,
      settings: documentSettings,
      type: docType,
      paymentAmountDZD: docType === 'receipt' ? paymentAmountDZD : undefined,
    });
  }, [lines, tvaRate, deliveryFeeDZD, applyTimbre, documentSettings, docType, paymentAmountDZD]);

  if (!isOpen) return null;

  const isLocked = Boolean(documentToEdit && documentToEdit.status !== 'draft');
  const selectedWilayaObj = wilayas.find((w) => w.code === Number(custWilayaCode));
  const selectedFactureObj = commercialDocuments.find((d) => d.id === selectedFactureId);

  const handleAddCatalogProduct = () => {
    const prod = products.find((p) => p.id === catalogPickId);
    if (!prod) return;
    const newLine = normalizeLine({
      productId: prod.id,
      sku: prod.sku,
      productName: prod.name,
      description: prod.processor ? `${prod.processor} • ${prod.ram || ''}` : prod.sku,
      quantity: 1,
      unitPriceDZD: prod.priceDZD,
      discountDZD: 0,
    });
    setLines((prev) => [...prev.filter((l) => l.productName.trim() !== '' || l.unitPriceDZD > 0), newLine]);
    setCatalogPickId('');
  };

  const handleAddEmptyLine = () => {
    setLines((prev) => [
      ...prev,
      normalizeLine({ productName: '', description: '', quantity: 1, unitPriceDZD: 0, discountDZD: 0 }),
    ]);
  };

  const handleUpdateLine = (index: number, patch: Partial<CommercialDocumentLine>) => {
    setLines((prev) => prev.map((l, idx) => (idx === index ? normalizeLine({ ...l, ...patch }) : l)));
  };

  const handleRemoveLine = (index: number) => {
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = (issueImmediately: boolean) => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setErrors([]);

    try {
      const payload = {
        type: docType,
        date,
        status: 'draft' as const,
        orderId: selectedOrderId || undefined,
        linkedFactureId: selectedFactureId || undefined,
        linkedFactureNumber: selectedFactureObj?.number,
        customer: {
          name: custName.trim(),
          phone: custPhone.trim(),
          address: custAddress.trim(),
          wilayaCode: selectedWilayaObj?.code || custWilayaCode,
          wilayaNameFr: selectedWilayaObj?.nameFr || '',
          wilayaNameAr: selectedWilayaObj?.nameAr || '',
          communeNameFr: custCommune.trim(),
          rc: custRc.trim() || undefined,
          nif: custNif.trim() || undefined,
        },
        lines: totals.lines,
        subtotalDZD: totals.subtotalDZD,
        discountTotalDZD: totals.discountTotalDZD,
        netHtDZD: totals.netHtDZD,
        tvaRate: totals.tvaRate,
        tvaAmountDZD: totals.tvaAmountDZD,
        applyTimbre,
        timbreRatePercent: documentSettings.timbreRatePercent,
        timbreAmountDZD: totals.timbreAmountDZD,
        deliveryFeeDZD: totals.deliveryFeeDZD,
        totalDZD: totals.totalDZD,
        notes: notes.trim(),
        blShowPrices: docType === 'bl' ? blShowPrices : undefined,
        deliveryCompanyId: docType === 'bl' ? deliveryCompanyId : undefined,
        deliveryCompanyName: docType === 'bl' ? deliveryCompanyName : undefined,
        deliveryMethod: docType === 'bl' ? deliveryMethod : undefined,
        trackingNumber: docType === 'bl' ? trackingNumber.trim() : undefined,
        validityDate: docType === 'proforma' ? validityDate : undefined,
        paymentTerms: docType === 'facture' ? paymentTerms.trim() : undefined,
        paymentMethod: docType === 'receipt' ? paymentMethod : undefined,
        paymentMethodDetails: docType === 'receipt' ? paymentDetails : undefined,
        paymentAmountDZD: docType === 'receipt' ? paymentAmountDZD : undefined,
        createdBy: currentEmployee?.name || 'Administrateur',
        createdByEmployeeId: currentEmployee?.id,
      };

      const res = documentToEdit
        ? updateDraftDocument(documentToEdit.id, payload)
        : createCommercialDocument(payload, issueImmediately);

      if (!res.ok) {
        setErrors(res.errors);
        return;
      }

      if (documentToEdit && issueImmediately) {
        const issued = issueCommercialDocument(res.document.id);
        if (!issued.ok) {
          setErrors(issued.errors);
          return;
        }
        if (onSaved) onSaved(issued.document);
        onClose();
        return;
      }

      if (onSaved) onSaved(res.document);
      onClose();
    } finally {
      submittingRef.current = false;
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
        className="relative w-full max-w-4xl bg-[#091122] rounded-3xl border border-cyan-500/40 shadow-[0_0_50px_rgba(0,140,255,0.28)] overflow-hidden my-auto max-h-[94dvh] flex flex-col"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-blue-900/40 bg-[#060C18] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 text-white">
              <FilePlus2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                {documentToEdit
                  ? `${language === 'ar' ? 'تعديل المسودة' : 'Modifier Brouillon'} — ${documentToEdit.number}`
                  : `${language === 'ar' ? 'إنشاء' : 'Nouveau'} : ${getDocTypeLabel(docType, language)}`}
              </h3>
              <p className="text-xs text-slate-400">
                {language === 'ar'
                  ? 'يمكنك الاستيراد من طلبية موجودة أو الإدخال اليدوي المباشر'
                  : 'Importez depuis une commande existante ou saisissez librement'}
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

        {/* Form Scroll Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs">
          {isLocked && (
            <div className="p-3.5 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 flex items-center gap-2 font-bold">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-amber-400" />
              <span>
                Ce document est déjà émis et verrouillé. Pour corriger, veuillez l'annuler puis dupliquer / réémettre.
              </span>
            </div>
          )}

          {errors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-500/60 text-rose-200 space-y-1">
              {errors.map((err, i) => (
                <div key={i} className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span>{err}</span>
                </div>
              ))}
            </div>
          )}

          {/* Source Selectors: Order &/or Facture */}
          {!documentToEdit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#050A14] p-3.5 rounded-2xl border border-blue-900/50">
              <div>
                <label className="text-cyan-300 font-bold block mb-1 flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>
                    {language === 'ar'
                      ? 'استيراد من طلبية موجودة (اختياري)'
                      : 'Importer depuis une commande (Optionnel)'}
                  </span>
                </label>
                <select
                  value={selectedOrderId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedOrderId(id);
                    const ord = orders.find((o) => o.id === id);
                    if (ord) applyOrderToForm(ord);
                  }}
                  className="w-full bg-[#080F1C] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                >
                  <option value="">-- Saisie manuelle (à partir de zéro) --</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.id} — {o.customerName} ({formatDZD(o.totalDZD)})
                    </option>
                  ))}
                </select>
              </div>

              {!(docType === 'receipt' || docType === 'bl') && customers.length > 0 && (
                <div>
                  <label className="text-indigo-300 font-bold block mb-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" />
                    <span>
                      {language === 'ar'
                        ? 'اختيار زبون B2B من القاعدة (اختياري)'
                        : 'Importer un Client B2B (Optionnel)'}
                    </span>
                  </label>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const c = customers.find((item) => item.id === e.target.value);
                      if (!c) return;
                      setCustName(c.companyName);
                      setCustPhone(c.phone);
                      setCustAddress(c.address || '');
                      setCustWilayaCode(c.wilayaCode || 16);
                      setCustRc(c.rc || '');
                      setCustNif(c.nif || '');
                    }}
                    className="w-full bg-[#080F1C] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                  >
                    <option value="">-- Sélectionner un magasin / entreprise --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.companyName} — {c.contactPerson} ({c.wilayaNameFr})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {(docType === 'receipt' || docType === 'bl') && (
                <div>
                  <label className="text-emerald-300 font-bold block mb-1 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>
                      {docType === 'receipt'
                        ? language === 'ar'
                          ? 'ربط بفاتورة (دفع جزئي أو كلي)'
                          : 'Lier à une Facture (Paiement partiel / total)'
                        : 'Lier à une Facture existante (Optionnel)'}
                    </span>
                  </label>
                  <select
                    value={selectedFactureId}
                    onChange={(e) => handlePickFacture(e.target.value)}
                    className="w-full bg-[#080F1C] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                  >
                    <option value="">-- Aucune facture liée --</option>
                    {payableFactures.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.number} — {f.customer.name} (Reste: {formatDZD(f.remainingAmountDZD ?? f.totalDZD)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Date, Validity / Payment Terms & BL Options */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-slate-300 font-bold block mb-1">
                {language === 'ar' ? 'التاريخ *' : 'Date du document *'}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isLocked}
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>

            {docType === 'proforma' && (
              <div>
                <label className="text-slate-300 font-bold block mb-1">
                  {language === 'ar' ? 'صالح إلى غاية' : 'Date de validité'}
                </label>
                <input
                  type="date"
                  value={validityDate}
                  onChange={(e) => setValidityDate(e.target.value)}
                  disabled={isLocked}
                  className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
                />
              </div>
            )}

            {docType === 'facture' && (
              <div className="sm:col-span-2">
                <label className="text-slate-300 font-bold block mb-1">
                  {language === 'ar' ? 'شروط الدفع' : 'Conditions de paiement'}
                </label>
                <input
                  type="text"
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  disabled={isLocked}
                  placeholder="ex: Paiement comptant, Virement 15 jours..."
                  className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                />
              </div>
            )}

            {docType === 'bl' && (
              <>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Affichage des prix</label>
                  <button
                    type="button"
                    disabled={isLocked}
                    onClick={() => setBlShowPrices((v) => !v)}
                    className={`w-full px-3 py-2 rounded-xl border font-bold flex items-center justify-center gap-2 cursor-pointer ${
                      blShowPrices
                        ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                        : 'bg-slate-900 border-slate-700 text-slate-300'
                    }`}
                  >
                    {blShowPrices ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span>{blShowPrices ? 'Prix visibles sur le BL' : 'Masquer les prix (Quantités seules)'}</span>
                  </button>
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">N° Tracking</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    disabled={isLocked}
                    placeholder="ex: YAL-9821-DZ"
                    className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
                  />
                </div>
              </>
            )}
          </div>

          {/* BL Carrier Section */}
          {docType === 'bl' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#050A14] p-3.5 rounded-2xl border border-blue-900/40">
              <div>
                <label className="text-slate-300 font-bold block mb-1 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Société de livraison</span>
                </label>
                <select
                  value={deliveryCompanyId}
                  disabled={isLocked}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setDeliveryCompanyId(cid);
                    const comp = deliveryCompanies.find((c) => c.id === cid);
                    setDeliveryCompanyName(comp?.name || cid);
                  }}
                  className="w-full bg-[#080F1C] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                >
                  {deliveryCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                  <option value="livraison_propre">Livraison interne / Main propre</option>
                </select>
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">Mode de livraison</label>
                <select
                  value={deliveryMethod}
                  disabled={isLocked}
                  onChange={(e) => setDeliveryMethod(e.target.value as DeliveryMethod)}
                  className="w-full bg-[#080F1C] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                >
                  <option value="home">À Domicile (Home Delivery)</option>
                  <option value="stopdesk">Point Relais (Stop Desk)</option>
                </select>
              </div>
            </div>
          )}

          {/* Customer Details */}
          <div className="bg-[#050A14] p-4 rounded-2xl border border-blue-900/40 space-y-3">
            <h4 className="font-bold text-cyan-300 flex items-center gap-1.5">
              <User className="w-4 h-4" />
              <span>{language === 'ar' ? 'معلومات الزبون' : 'Informations Client'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Nom / Raison Sociale *</label>
                <input
                  type="text"
                  required
                  disabled={isLocked}
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="ex: Sarl Tech Solutions"
                  className="w-full bg-[#080F1C] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                />
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">Téléphone *</label>
                <input
                  type="text"
                  required
                  disabled={isLocked}
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="0555 12 34 56"
                  className="w-full bg-[#080F1C] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
                />
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">Wilaya</label>
                <select
                  value={custWilayaCode}
                  disabled={isLocked}
                  onChange={(e) => {
                    const code = Number(e.target.value);
                    setCustWilayaCode(code);
                    const w = wilayas.find((item) => item.code === code);
                    if (w?.communes?.[0]) setCustCommune(w.communes[0].nameFr);
                  }}
                  className="w-full bg-[#080F1C] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                >
                  {wilayas.map((w) => (
                    <option key={w.code} value={w.code}>
                      {language === 'ar' ? w.nameAr : w.nameFr}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">Commune</label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={custCommune}
                  onChange={(e) => setCustCommune(e.target.value)}
                  className="w-full bg-[#080F1C] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-slate-300 font-bold block mb-1">Adresse</label>
                <input
                  type="text"
                  disabled={isLocked}
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  placeholder="Adresse complète..."
                  className="w-full bg-[#080F1C] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                />
              </div>
              {(docType === 'facture' || docType === 'proforma') && (
                <>
                  <div>
                    <label className="text-slate-400 block mb-1">RC Client (optionnel B2B)</label>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={custRc}
                      onChange={(e) => setCustRc(e.target.value)}
                      className="w-full bg-[#080F1C] text-white font-mono rounded-xl px-3 py-1.5 border border-blue-900/60"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">NIF Client (optionnel B2B)</label>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={custNif}
                      onChange={(e) => setCustNif(e.target.value)}
                      className="w-full bg-[#080F1C] text-white font-mono rounded-xl px-3 py-1.5 border border-blue-900/60"
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RECEIPT PAYMENT SECTION */}
          {docType === 'receipt' && (
            <div className="bg-[#050A14] p-4 rounded-2xl border border-emerald-500/40 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4" />
                  <span>Détails de l'Encaissement (Reçu de paiement)</span>
                </h4>
                {selectedFactureObj && (
                  <span className="text-[11px] font-mono bg-emerald-950/60 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-emerald-200">
                    Facture {selectedFactureObj.number} — Reste dû :{' '}
                    <strong>{formatDZD(selectedFactureObj.remainingAmountDZD ?? selectedFactureObj.totalDZD)}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Montant encaissé (DZD) *</label>
                  <input
                    type="number"
                    min={1}
                    step="any"
                    disabled={isLocked}
                    value={paymentAmountDZD}
                    onChange={(e) => setPaymentAmountDZD(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full bg-[#080F1C] text-emerald-300 font-mono font-black text-sm rounded-xl px-3 py-2 border border-emerald-600/50"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">Mode de paiement *</label>
                  <select
                    value={paymentMethod}
                    disabled={isLocked}
                    onChange={(e) => setPaymentMethod(e.target.value as ReceiptPaymentMethod)}
                    className="w-full bg-[#080F1C] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                  >
                    {(['cash', 'cheque', 'bank_transfer', 'ccp_baridimob', 'other'] as ReceiptPaymentMethod[]).map(
                      (m) => (
                        <option key={m} value={m}>
                          {getPaymentMethodLabel(m, language)}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {paymentMethod === 'cheque' && (
                  <>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">N° de Chèque *</label>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={paymentDetails.chequeNumber || ''}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, chequeNumber: e.target.value })}
                        placeholder="ex: CHQ-998877"
                        className="w-full bg-[#080F1C] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Banque émettrice *</label>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={paymentDetails.bankName || ''}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                        placeholder="ex: BNA / BEA / CPA"
                        className="w-full bg-[#080F1C] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                      />
                    </div>
                  </>
                )}

                {paymentMethod === 'bank_transfer' && (
                  <>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Référence Virement *</label>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={paymentDetails.transferRef || ''}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, transferRef: e.target.value })}
                        placeholder="ex: VIR-2026-441"
                        className="w-full bg-[#080F1C] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Banque *</label>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={paymentDetails.bankName || ''}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, bankName: e.target.value })}
                        placeholder="ex: Société Générale Algérie"
                        className="w-full bg-[#080F1C] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                      />
                    </div>
                  </>
                )}

                {paymentMethod === 'ccp_baridimob' && (
                  <>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">N° CCP / RIP / Clé *</label>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={paymentDetails.ccpAccount || ''}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, ccpAccount: e.target.value })}
                        placeholder="ex: 0022114455 99"
                        className="w-full bg-[#080F1C] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
                      />
                    </div>
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Réf Transaction BaridiMob</label>
                      <input
                        type="text"
                        disabled={isLocked}
                        value={paymentDetails.transferRef || ''}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, transferRef: e.target.value })}
                        placeholder="ex: BM-778899"
                        className="w-full bg-[#080F1C] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
                      />
                    </div>
                  </>
                )}

                {paymentMethod === 'other' && (
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Précisez le moyen *</label>
                    <input
                      type="text"
                      disabled={isLocked}
                      value={paymentDetails.otherLabel || ''}
                      onChange={(e) => setPaymentDetails({ ...paymentDetails, otherLabel: e.target.value })}
                      placeholder="ex: Carte Edahabia TPE"
                      className="w-full bg-[#080F1C] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Lines Section */}
          {docType !== 'receipt' && (
            <div className="bg-[#050A14] p-4 rounded-2xl border border-blue-900/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h4 className="font-bold text-cyan-300">Lignes du document ({lines.length})</h4>

                {!isLocked && (
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={catalogPickId}
                      onChange={(e) => setCatalogPickId(e.target.value)}
                      className="bg-[#080F1C] text-white rounded-xl px-2.5 py-1.5 border border-blue-900/60 max-w-[230px]"
                    >
                      <option value="">+ Ajouter depuis le catalogue...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.priceDZD.toLocaleString('fr-DZ')} DA)
                        </option>
                      ))}
                    </select>
                    {catalogPickId && (
                      <button
                        type="button"
                        onClick={handleAddCatalogProduct}
                        className="px-3 py-1.5 rounded-xl bg-cyan-600 text-white font-bold cursor-pointer"
                      >
                        Ajouter
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddEmptyLine}
                      className="px-3 py-1.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-cyan-300 border border-blue-700/50 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ligne libre</span>
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                {lines.map((line, idx) => (
                  <div
                    key={line.id}
                    className="grid grid-cols-12 gap-2 items-center bg-[#080F1C] p-2.5 rounded-xl border border-blue-900/30"
                  >
                    <div className="col-span-12 sm:col-span-4 space-y-1">
                      <input
                        type="text"
                        disabled={isLocked}
                        value={line.productName}
                        onChange={(e) => handleUpdateLine(idx, { productName: e.target.value })}
                        placeholder="Désignation du produit *"
                        className="w-full bg-[#050A14] text-white font-semibold rounded-lg px-2.5 py-1.5 border border-blue-900/50"
                      />
                      <input
                        type="text"
                        disabled={isLocked}
                        value={line.description || ''}
                        onChange={(e) => handleUpdateLine(idx, { description: e.target.value })}
                        placeholder="Description / N° Série / Specs..."
                        className="w-full bg-[#050A14] text-slate-300 text-[11px] rounded-lg px-2.5 py-1 border border-blue-900/30"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <label className="text-[10px] text-slate-400 block">Qté</label>
                      <input
                        type="number"
                        min={1}
                        disabled={isLocked}
                        value={line.quantity}
                        onChange={(e) => handleUpdateLine(idx, { quantity: Number(e.target.value) })}
                        className="w-full bg-[#050A14] text-white font-mono rounded-lg px-2 py-1.5 border border-blue-900/50"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2">
                      <label className="text-[10px] text-slate-400 block">P.U (DZD)</label>
                      <input
                        type="number"
                        min={0}
                        disabled={isLocked}
                        value={line.unitPriceDZD}
                        onChange={(e) => handleUpdateLine(idx, { unitPriceDZD: Number(e.target.value) })}
                        className="w-full bg-[#050A14] text-white font-mono rounded-lg px-2 py-1.5 border border-blue-900/50"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-2">
                      <label className="text-[10px] text-slate-400 block">Remise (DZD)</label>
                      <input
                        type="number"
                        min={0}
                        disabled={isLocked}
                        value={line.discountDZD}
                        onChange={(e) => handleUpdateLine(idx, { discountDZD: Number(e.target.value) })}
                        className="w-full bg-[#050A14] text-amber-300 font-mono rounded-lg px-2 py-1.5 border border-blue-900/50"
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1.5 pt-3 sm:pt-0">
                      <span className="font-mono font-bold text-cyan-300 text-[11px]">
                        {line.lineTotalDZD.toLocaleString('fr-DZ')}
                      </span>
                      {!isLocked && lines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="p-1.5 rounded-lg bg-rose-950/50 text-rose-400 hover:text-white cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TVA, Delivery, Timbre & Live Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#050A14] p-4 rounded-2xl border border-blue-900/40 space-y-3">
              {docType !== 'receipt' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">TVA (%)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      step={0.5}
                      disabled={isLocked}
                      value={tvaRate}
                      onChange={(e) => setTvaRate(Number(e.target.value))}
                      className="w-full bg-[#080F1C] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Livraison (DZD)</label>
                    <input
                      type="number"
                      min={0}
                      disabled={isLocked}
                      value={deliveryFeeDZD}
                      onChange={(e) => setDeliveryFeeDZD(Number(e.target.value))}
                      className="w-full bg-[#080F1C] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
                    />
                  </div>
                </div>
              )}

              {docType !== 'receipt' && (
                <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#080F1C] border border-blue-900/40 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isLocked}
                    checked={applyTimbre}
                    onChange={(e) => setApplyTimbre(e.target.checked)}
                    className="rounded text-cyan-500"
                  />
                  <span className="text-slate-200">
                    Appliquer Droit de timbre ({documentSettings.timbreRatePercent}%)
                  </span>
                </label>
              )}

              <div>
                <label className="text-slate-300 font-bold block mb-1">Notes / Observations</label>
                <textarea
                  rows={2}
                  disabled={isLocked}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Remarques affichées sur le document..."
                  className="w-full bg-[#080F1C] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                />
              </div>
            </div>

            <div className="bg-[#050A14] p-4 rounded-2xl border border-cyan-500/30 space-y-2 flex flex-col justify-between">
              <div className="space-y-1.5">
                {docType !== 'receipt' && (
                  <>
                    <div className="flex justify-between text-slate-400">
                      <span>Sous-total brut :</span>
                      <span className="font-mono">{formatDZD(totals.subtotalDZD)}</span>
                    </div>
                    {totals.discountTotalDZD > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span>Remises :</span>
                        <span className="font-mono">-{formatDZD(totals.discountTotalDZD)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-300">
                      <span>Total HT :</span>
                      <span className="font-mono">{formatDZD(totals.netHtDZD)}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>TVA ({totals.tvaRate}%) :</span>
                      <span className="font-mono">{formatDZD(totals.tvaAmountDZD)}</span>
                    </div>
                    {totals.timbreAmountDZD > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>Droit de timbre :</span>
                        <span className="font-mono">{formatDZD(totals.timbreAmountDZD)}</span>
                      </div>
                    )}
                    {totals.deliveryFeeDZD > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>Livraison :</span>
                        <span className="font-mono">{formatDZD(totals.deliveryFeeDZD)}</span>
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-blue-900/40 text-sm font-black text-white">
                  <span>TOTAL TTC :</span>
                  <span className="text-xl text-cyan-400 font-mono">{formatDZD(totals.totalDZD)}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-[#080F1C] border border-blue-900/40 text-[11px] text-slate-300">
                <span className="text-slate-400 block">En lettres :</span>
                <strong className="text-white">{numberToFrenchWordsDZD(totals.totalDZD)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-blue-900/40 bg-[#060C18] flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-blue-950/60 text-slate-300 hover:text-white font-bold text-xs cursor-pointer"
          >
            Fermer
          </button>

          {!isLocked && (
            <>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-600 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{documentToEdit ? 'Mettre à jour Brouillon' : 'Enregistrer Brouillon'}</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSave(true)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,140,255,0.4)] cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Validation...</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{documentToEdit ? 'Enregistrer & Émettre' : 'Émettre officiellement'}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
