import React, { useState } from 'react';
import { CommercialDocument, Language } from '../../../types';
import { useStore } from '../../../context/StoreContext';
import { useTheme } from '../../../context/ThemeContext';
import { useLanguage } from '../../../context/LanguageContext';
import { buildWhatsAppUrl } from '../../../utils/contactLinks';
import {
  buildDocumentShareLink,
  buildWhatsAppDocumentMessage,
  downloadCommercialDocumentPdf,
  formatDZD,
  getDocStatusLabel,
  getDocTypeLabel,
  getPaymentMethodLabel,
  numberToFrenchWordsDZD,
} from '../../../utils/commercialDocuments';
import {
  Check,
  Copy,
  Download,
  FileText,
  Languages,
  MessageCircle,
  Printer,
  Truck,
  User,
  Wallet,
  X,
} from 'lucide-react';

interface CommercialDocumentPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: CommercialDocument | null;
}

export const CommercialDocumentPrintModal: React.FC<CommercialDocumentPrintModalProps> = ({
  isOpen,
  onClose,
  document: doc,
}) => {
  const { documentSettings, settings } = useStore();
  const { activeTheme } = useTheme();
  const { language } = useLanguage();

  const [docLang, setDocLang] = useState<Language>(language);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!isOpen || !doc) return null;

  const isRtl = docLang === 'ar';
  const showPrices = doc.type !== 'bl' || doc.blShowPrices !== false;
  const accent = activeTheme.primaryColor || '#0284c7';

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await downloadCommercialDocumentPdf(doc, documentSettings, docLang, accent);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleSendWhatsApp = () => {
    const rawMsg = buildWhatsAppDocumentMessage(doc, documentSettings, docLang);
    const phone = doc.customer.phone || settings.whatsappNumber;
    const baseWa = buildWhatsAppUrl(phone);
    window.open(`${baseWa}?text=${encodeURIComponent(rawMsg)}`, '_blank');
  };

  const handleCopyLink = async () => {
    const link = buildDocumentShareLink(doc);
    const summary = `${link}\n\n${buildWhatsAppDocumentMessage(doc, documentSettings, docLang)}`;
    try {
      await navigator.clipboard.writeText(summary);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  return (
    <div
      onClick={onClose}
      className="printable-modal-root fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md print:static print:inset-auto print:p-0 print:bg-white print:overflow-visible"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="printable-slip-card commercial-doc-flow relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl sm:rounded-3xl border border-slate-300 shadow-2xl overflow-hidden my-auto max-h-[93dvh] flex flex-col print:max-h-none print:m-0 print:border-none print:shadow-none print:rounded-none print:overflow-visible"
      >
        {/* Top Action Toolbar (Hidden during print) */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
            <span className="font-bold text-xs sm:text-sm truncate">
              {getDocTypeLabel(doc.type, docLang).toUpperCase()} — {doc.number}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 ms-auto">
            <button
              type="button"
              onClick={() => setDocLang((l) => (l === 'fr' ? 'ar' : 'fr'))}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs flex items-center gap-1 cursor-pointer"
              title="Changer la langue du document"
            >
              <Languages className="w-3.5 h-3.5" />
              <span>{docLang === 'fr' ? 'العربية (RTL)' : 'Français (LTR)'}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimer A4</span>
            </button>

            <button
              type="button"
              disabled={isDownloadingPdf}
              onClick={handleDownloadPdf}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloadingPdf ? 'PDF...' : 'Télécharger PDF'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
              title="Envoyer par WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
              title="Copier le lien & résumé"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Copié!' : 'Copier lien'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable A4 Sheet */}
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          className="p-5 sm:p-10 overflow-y-auto space-y-5 text-xs sm:text-sm print:p-4 print:overflow-visible relative"
        >
          {doc.status === 'cancelled' && (
            <div className="p-3 rounded-xl bg-rose-100 border-2 border-rose-500 text-rose-800 font-black text-center uppercase tracking-widest">
              {isRtl
                ? `وثيقة ملغاة — ${doc.cancelReason || 'تم الإلغاء'}`
                : `DOCUMENT ANNULÉ — ${doc.cancelReason || 'Annulé'}`}
            </div>
          )}

          {/* Header */}
          <div
            className="flex flex-col sm:flex-row print:flex-row items-start justify-between gap-4 pb-5 border-b-2"
            style={{ borderColor: accent }}
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-3">
                {documentSettings.logoDataUrl ? (
                  <img
                    src={documentSettings.logoDataUrl}
                    alt={documentSettings.companyName}
                    className="w-14 h-14 object-contain"
                  />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className="w-14 h-14 flex-shrink-0">
                    <defs>
                      <linearGradient id="commDocLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00D4FF" />
                        <stop offset="100%" stopColor="#008CFF" />
                      </linearGradient>
                    </defs>
                    <polygon points="50,5 90,26 90,74 50,95 10,74 10,26" stroke="#008CFF" strokeWidth="2.5" fill="#080F1C" />
                    <rect x="26" y="27" width="48" height="32" rx="4" stroke="url(#commDocLogoGrad)" strokeWidth="3" fill="#050505" />
                    <path d="M33 43L45 35L55 45L67 37" stroke="#00D4FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M19 63L23 69H77L81 63H19Z" fill="url(#commDocLogoGrad)" />
                    <rect x="42" y="65" width="16" height="2" rx="1" fill="#FFFFFF" />
                    <path d="M48 18L62 18L52 27L48 18Z" fill="#00D4FF" />
                  </svg>
                )}

                <div>
                  <h1 className="text-xl font-black tracking-tight" style={{ color: accent }}>
                    {documentSettings.companyName}
                  </h1>
                  <p className="text-[11px] text-slate-600">{documentSettings.address}</p>
                </div>
              </div>

              <div className="text-[11px] text-slate-600 space-y-0.5">
                <div>
                  {isRtl ? 'الهاتف:' : 'Tél:'} <span dir="ltr" className="font-mono">{documentSettings.phone}</span> | Email: {documentSettings.email}
                </div>
                {(doc.type === 'facture' || doc.type === 'proforma') && (
                  <div className="text-[10px] font-mono text-slate-500">
                    RC: {documentSettings.rc} | NIF: {documentSettings.nif} | NIS: {documentSettings.nis} | AI: {documentSettings.ai}
                  </div>
                )}
              </div>
            </div>

            <div className={`${isRtl ? 'sm:text-left print:text-left' : 'sm:text-right print:text-right'} space-y-1`}>
              <span
                className="inline-block px-3 py-1 rounded-md text-xs font-black uppercase text-white tracking-wider"
                style={{ backgroundColor: accent }}
              >
                {getDocTypeLabel(doc.type, docLang)}
              </span>
              <div className="text-base font-black font-mono text-slate-900">{doc.number}</div>
              <div className="text-xs text-slate-600">
                {isRtl ? 'التاريخ:' : 'Date :'} <span className="font-mono font-bold">{doc.date}</span>
              </div>
              <div className="text-xs text-slate-600">
                {isRtl ? 'الحالة:' : 'Statut :'}{' '}
                <span className="font-bold text-slate-900">{getDocStatusLabel(doc.status, docLang)}</span>
              </div>
              {doc.type === 'proforma' && doc.validityDate && (
                <div className="text-xs text-amber-700 font-semibold">
                  {isRtl ? 'صالح إلى غاية:' : 'Valable jusqu’au :'} <span className="font-mono">{doc.validityDate}</span>
                </div>
              )}
              {doc.orderId && (
                <div className="text-[11px] text-slate-500 font-mono">
                  {isRtl ? 'مرجع الطلب:' : 'Commande :'} {doc.orderId}
                </div>
              )}
            </div>
          </div>

          {/* Proforma Mandatory Mention */}
          {doc.type === 'proforma' && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-bold text-center">
              {isRtl
                ? 'ملاحظة قانونية: هذه الوثيقة فاتورة أولية (Proforma) ولا تعتبر فاتورة ضريبية.'
                : "Mention : Facture Proforma — Ce document n'est pas une facture fiscale."}
            </div>
          )}

          {/* Customer & Metadata Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
              <div className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" style={{ color: accent }} />
                <span>{isRtl ? 'الزبون / المستلم' : 'Client / Destinataire'}</span>
              </div>
              <div className="font-bold text-sm text-slate-900">{doc.customer.name}</div>
              <div className="text-xs font-mono text-slate-700" dir="ltr">
                {doc.customer.phone}
              </div>
              <div className="text-xs text-slate-700">
                {[doc.customer.address, doc.customer.communeNameFr, isRtl ? doc.customer.wilayaNameAr : doc.customer.wilayaNameFr]
                  .filter(Boolean)
                  .join(', ')}
              </div>
              {(doc.customer.rc || doc.customer.nif) && (
                <div className="text-[10px] font-mono text-slate-500 pt-1">
                  {doc.customer.rc ? `RC: ${doc.customer.rc}` : ''} {doc.customer.nif ? `| NIF: ${doc.customer.nif}` : ''}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              {doc.type === 'bl' && (
                <>
                  <div className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" style={{ color: accent }} />
                    <span>{isRtl ? 'معلومات الشحن' : 'Expédition & Transport'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isRtl ? 'الناقل:' : 'Transporteur :'}</span>
                    <span className="font-bold text-slate-900">{doc.deliveryCompanyName || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isRtl ? 'الخدمة:' : 'Mode :'}</span>
                    <span className="font-semibold">
                      {doc.deliveryMethod === 'stopdesk'
                        ? isRtl ? 'مكتب التوصيل (Stop Desk)' : 'Point Relais (Stop Desk)'
                        : isRtl ? 'توصيل للمنزل' : 'À Domicile'}
                    </span>
                  </div>
                  {doc.trackingNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isRtl ? 'رقم التتبع:' : 'Tracking :'}</span>
                      <span className="font-mono font-bold text-emerald-700">{doc.trackingNumber}</span>
                    </div>
                  )}
                  {doc.linkedFactureNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isRtl ? 'فاتورة مرتبطة:' : 'Facture liée :'}</span>
                      <span className="font-mono font-bold">{doc.linkedFactureNumber}</span>
                    </div>
                  )}
                </>
              )}

              {doc.type === 'receipt' && (
                <>
                  <div className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isRtl ? 'تفاصيل الدفع' : 'Détails du Paiement'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isRtl ? 'طريقة الدفع:' : 'Mode :'}</span>
                    <span className="font-bold text-slate-900">{getPaymentMethodLabel(doc.paymentMethod, docLang)}</span>
                  </div>
                  {doc.paymentMethodDetails?.bankName && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isRtl ? 'البنك:' : 'Banque :'}</span>
                      <span className="font-semibold">{doc.paymentMethodDetails.bankName}</span>
                    </div>
                  )}
                  {doc.paymentMethodDetails?.chequeNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">N° Chèque :</span>
                      <span className="font-mono font-bold">{doc.paymentMethodDetails.chequeNumber}</span>
                    </div>
                  )}
                  {doc.paymentMethodDetails?.transferRef && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Réf. Transaction :</span>
                      <span className="font-mono font-bold">{doc.paymentMethodDetails.transferRef}</span>
                    </div>
                  )}
                  {doc.paymentMethodDetails?.ccpAccount && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Compte CCP :</span>
                      <span className="font-mono font-bold">{doc.paymentMethodDetails.ccpAccount}</span>
                    </div>
                  )}
                  {doc.paymentMethodDetails?.otherLabel && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Précision :</span>
                      <span className="font-semibold">{doc.paymentMethodDetails.otherLabel}</span>
                    </div>
                  )}
                  {doc.linkedFactureNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isRtl ? 'للفاتورة رقم:' : 'Imputé sur Facture :'}</span>
                      <span className="font-mono font-bold text-blue-700">{doc.linkedFactureNumber}</span>
                    </div>
                  )}
                </>
              )}

              {(doc.type === 'facture' || doc.type === 'proforma') && (
                <>
                  <div className="text-[11px] font-bold uppercase text-slate-500">
                    {isRtl ? 'معلومات الفوترة والبنك' : 'Conditions & Domiciliation'}
                  </div>
                  {doc.paymentTerms && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isRtl ? 'شروط الدفع:' : 'Règlement :'}</span>
                      <span className="font-semibold text-slate-900">{doc.paymentTerms}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isRtl ? 'البنك:' : 'Banque :'}</span>
                    <span className="font-semibold">{documentSettings.bankName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">RIB :</span>
                    <span className="font-mono text-[11px] font-bold" dir="ltr">{documentSettings.rib}</span>
                  </div>
                  {doc.sourceDocumentNumber && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">{isRtl ? 'محولة من:' : 'Issu de :'}</span>
                      <span className="font-mono font-bold text-blue-700">{doc.sourceDocumentNumber}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Lines Table (BL/Proforma/Facture) OR Big Amount Banner (Receipt) */}
          {doc.type === 'receipt' ? (
            <div className="p-6 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-center space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                {isRtl ? 'المبلغ المستلم رسمياً (وصل دفع)' : 'Montant Reçu / Encaissé'}
              </div>
              <div className="text-3xl font-black font-mono text-emerald-700">
                {formatDZD(doc.paymentAmountDZD ?? doc.totalDZD)}
              </div>
              <div className="text-xs font-semibold text-emerald-900">
                {numberToFrenchWordsDZD(doc.paymentAmountDZD ?? doc.totalDZD)}
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-white text-[11px] font-mono uppercase">
                    <th className={`p-2.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {isRtl ? 'المنتج والوصف' : 'Désignation / Description'}
                    </th>
                    <th className="p-2.5 text-center">{isRtl ? 'الكمية' : 'Qté'}</th>
                    {showPrices && (
                      <>
                        <th className={`p-2.5 ${isRtl ? 'text-left' : 'text-right'}`}>
                          {isRtl ? 'سعر الوحدة' : 'P.U (DZD)'}
                        </th>
                        <th className={`p-2.5 ${isRtl ? 'text-left' : 'text-right'}`}>
                          {isRtl ? 'التخفيض' : 'Remise'}
                        </th>
                        <th className={`p-2.5 ${isRtl ? 'text-left' : 'text-right'}`}>
                          {isRtl ? 'المجموع' : 'Total HT'}
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {doc.lines.map((line) => (
                    <tr key={line.id}>
                      <td className="p-2.5">
                        <div className="font-bold text-slate-900">{line.productName}</div>
                        {line.description && (
                          <div className="text-[11px] text-slate-500">{line.description}</div>
                        )}
                      </td>
                      <td className="p-2.5 text-center font-mono font-bold">{line.quantity}</td>
                      {showPrices && (
                        <>
                          <td className={`p-2.5 font-mono ${isRtl ? 'text-left' : 'text-right'}`}>
                            {line.unitPriceDZD.toLocaleString('fr-DZ')}
                          </td>
                          <td className={`p-2.5 font-mono text-rose-600 ${isRtl ? 'text-left' : 'text-right'}`}>
                            {line.discountDZD > 0 ? `-${line.discountDZD.toLocaleString('fr-DZ')}` : '-'}
                          </td>
                          <td className={`p-2.5 font-mono font-bold text-slate-900 ${isRtl ? 'text-left' : 'text-right'}`}>
                            {line.lineTotalDZD.toLocaleString('fr-DZ')} DZD
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals & Amount in Words */}
          {showPrices && (
            <div className="flex flex-col sm:flex-row print:flex-row justify-between items-start gap-4 pt-2">
              <div className="space-y-2 max-w-md text-xs">
                {doc.type !== 'receipt' && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-slate-500 block text-[11px]">
                      {isRtl
                        ? 'المبلغ الإجمالي بالحروف (بالفرنسية) :'
                        : 'Arrêté le présent document à la somme de :'}
                    </span>
                    <strong className="text-slate-900 text-xs">{numberToFrenchWordsDZD(doc.totalDZD)}</strong>
                  </div>
                )}

                {doc.notes && (
                  <div className="text-slate-600 italic">
                    <strong>{isRtl ? 'ملاحظات:' : 'Notes :'}</strong> {doc.notes}
                  </div>
                )}

                {documentSettings.bankDetailsText && doc.type === 'facture' && (
                  <div className="text-[11px] text-slate-500">{documentSettings.bankDetailsText}</div>
                )}
              </div>

              {doc.type !== 'receipt' && (
                <div className="w-full sm:w-80 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>{isRtl ? 'المجموع الصافي HT :' : 'Sous-total HT :'}</span>
                    <span className="font-mono">{formatDZD(doc.netHtDZD)}</span>
                  </div>
                  {doc.discountTotalDZD > 0 && (
                    <div className="flex justify-between text-rose-600 font-semibold">
                      <span>{isRtl ? 'إجمالي التخفيضات :' : 'Total Remises :'}</span>
                      <span className="font-mono">-{formatDZD(doc.discountTotalDZD)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-600">
                    <span>TVA ({doc.tvaRate}%) :</span>
                    <span className="font-mono">{formatDZD(doc.tvaAmountDZD)}</span>
                  </div>
                  {doc.timbreAmountDZD > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>{isRtl ? 'حق الطابع :' : 'Droit de timbre :'}</span>
                      <span className="font-mono">{formatDZD(doc.timbreAmountDZD)}</span>
                    </div>
                  )}
                  {doc.deliveryFeeDZD > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>{isRtl ? 'مصاريف التوصيل :' : 'Frais de livraison :'}</span>
                      <span className="font-mono">{formatDZD(doc.deliveryFeeDZD)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
                    <span>{isRtl ? 'المجموع الإجمالي TTC :' : 'TOTAL TTC :'}</span>
                    <span className="font-mono text-base" style={{ color: accent }}>
                      {formatDZD(doc.totalDZD)}
                    </span>
                  </div>

                  {doc.type === 'facture' && (
                    <div className="pt-2 border-t border-slate-200 space-y-1">
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>{isRtl ? 'المبلغ المدفوع :' : 'Montant payé :'}</span>
                        <span className="font-mono">{formatDZD(doc.amountPaidDZD || 0)}</span>
                      </div>
                      <div className="flex justify-between text-amber-700 font-black">
                        <span>{isRtl ? 'المبلغ المتبقي :' : 'Reste à payer :'}</span>
                        <span className="font-mono">{formatDZD(doc.remainingAmountDZD ?? doc.totalDZD)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Signatures Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
            <div className="border border-slate-300 rounded-xl p-4 h-28 flex flex-col justify-between">
              <span className="font-bold text-xs text-slate-700">
                {doc.type === 'bl'
                  ? isRtl ? 'ختم وإمضاء المرسل / الناقل' : 'Cachet & Signature Expéditeur / Transporteur'
                  : isRtl ? 'الختم والإمضاء (المؤسسة)' : 'Cachet & Signature Entreprise'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isRtl ? `حرر بواسطة: ${doc.createdBy}` : `Établi par : ${doc.createdBy}`}
              </span>
            </div>

            <div className="border border-slate-300 rounded-xl p-4 h-28 flex flex-col justify-between">
              <span className="font-bold text-xs text-slate-700">
                {doc.type === 'bl'
                  ? isRtl ? 'إمضاء المستلم (استلام مطابق للمواصفات)' : 'Signature du Récepteur (Reçu conforme)'
                  : isRtl ? 'إمضاء وموافقة الزبون' : 'Signature / Accord Client'}
              </span>
              <span className="text-[10px] text-slate-400">
                {isRtl ? 'الاسم، التاريخ والإمضاء :' : 'Nom, Date & Signature : ________________'}
              </span>
            </div>
          </div>

          {/* General Terms & Custom Footer */}
          <div className="pt-3 border-t border-slate-200 text-center space-y-1 text-[10px] text-slate-500">
            {documentSettings.generalTerms && <div>{documentSettings.generalTerms}</div>}
            <div className="font-semibold text-slate-600">{documentSettings.customFooterText}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
