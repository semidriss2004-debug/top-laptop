import React from 'react';
import { Order } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { useStore } from '../../context/StoreContext';
import { useTheme } from '../../context/ThemeContext';
import { Logo } from '../Logo';
import { 
  X, 
  Printer, 
  Download, 
  Truck, 
  FileText, 
  Phone, 
  MapPin, 
  User, 
  Calendar, 
  ShieldCheck 
} from 'lucide-react';

interface BonDeLivraisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const BonDeLivraisonModal: React.FC<BonDeLivraisonModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  const { t, language } = useLanguage();
  const { settings } = useStore();
  const { activeTheme } = useTheme();

  if (!isOpen || !order) return null;

  const formatPrice = (price: number) => price.toLocaleString('fr-DZ') + ' ' + t('dzd');

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const printArea = document.getElementById('bon-de-livraison-print');
    if (!printArea) return;
    const blob = new Blob([
      `<!DOCTYPE html><html><head><title>Bon_De_Livraison_${order.id}</title><style>
        body { font-family: sans-serif; background: #fff; color: #000; padding: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background: #f4f4f4; }
      </style></head><body>${printArea.innerHTML}</body></html>`
    ], { type: 'text/html' });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Bon_De_Livraison_${order.id}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="printable-modal-root fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-md print:static print:inset-auto print:p-0 print:bg-white print:overflow-visible">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="printable-slip-card relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl sm:rounded-3xl border border-slate-300 shadow-2xl overflow-hidden my-auto max-h-[92dvh] flex flex-col print:max-h-none print:m-0 print:border-none print:shadow-none print:rounded-none print:overflow-visible"
      >
        {/* Top Action Toolbar (Hidden during print) */}
        <div className="p-3 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
            <span className="font-bold text-xs sm:text-sm truncate">
              BON DE LIVRAISON — {order.bonDeLivraisonRef || order.id}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 ms-auto">
            <button
              onClick={handlePrint}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Imprimer A4</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden xs:inline sm:inline">Télécharger</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet (A4 Dimensions) */}
        <div id="bon-de-livraison-print" className="p-4 sm:p-10 overflow-y-auto space-y-5 sm:space-y-6 text-xs sm:text-sm print:p-6">
          {/* Header Row: Store Logo & Information */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4 pb-6 border-b-2" style={{ borderColor: activeTheme.primaryColor }}>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none" className="w-12 h-12 object-contain">
                  <defs>
                    <linearGradient id="blCyanLogo" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00D4FF" />
                      <stop offset="100%" stopColor="#008CFF" />
                    </linearGradient>
                  </defs>
                  <polygon points="50,5 90,26 90,74 50,95 10,74 10,26" stroke="#008CFF" strokeWidth="2.5" fill="#080F1C" strokeOpacity="0.8" />
                  <polygon points="50,12 83,30 83,70 50,88 17,70 17,30" stroke="#00D4FF" strokeWidth="1" strokeDasharray="3,3" fill="none" opacity="0.4" />
                  <rect x="26" y="27" width="48" height="32" rx="4" stroke="url(#blCyanLogo)" strokeWidth="3" fill="#050505" />
                  <path d="M33 43L45 35L55 45L67 37" stroke="#00D4FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 63L23 69H77L81 63H19Z" fill="url(#blCyanLogo)" />
                  <rect x="42" y="65" width="16" height="2" rx="1" fill="#FFFFFF" opacity="0.9" />
                  <path d="M48 18L62 18L52 27L48 18Z" fill="#00D4FF" />
                </svg>
                <div>
                  <h1 className="text-xl font-black tracking-tight" style={{ color: activeTheme.primaryColor }}>
                    TOP LAPTOP ALGERIE
                  </h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    Showroom Informatique & Vente Matériel High-Tech
                  </p>
                </div>
              </div>
              <div className="text-[11px] text-slate-600 space-y-0.5 pt-1">
                <div>📍 {settings.storeAddress}</div>
                <div>📞 Tél: {settings.contactPhone} | WhatsApp: {settings.whatsappNumber}</div>
                <div>✉️ Email: {settings.contactEmail}</div>
                <div className="text-[10px] font-mono text-slate-500">
                  RC: {settings.tradeRegisterRC || '16/00-9876543B20'} | NIF: {settings.taxNumberNIF || '001916012345678'}
                </div>
              </div>
            </div>

            {/* Document Title & Reference Box */}
            <div className="sm:text-end space-y-1">
              <span className="inline-block px-3 py-1 rounded-md text-xs font-black uppercase text-white tracking-widest" style={{ backgroundColor: activeTheme.primaryColor }}>
                BON DE LIVRAISON
              </span>
              <div className="text-sm font-black font-mono text-slate-900">
                N° : {order.bonDeLivraisonRef || `BL-${order.id}`}
              </div>
              <div className="text-xs text-slate-600">
                Commande réf : <span className="font-mono font-bold">{order.id}</span>
              </div>
              <div className="text-xs text-slate-600 flex items-center sm:justify-end gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>Date d'émission : {new Date(order.createdAt).toLocaleDateString('fr-DZ')}</span>
              </div>
            </div>
          </div>

          {/* Client & Delivery Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Customer Information */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Informations Destinataire (Client)</span>
              </h3>
              <div className="font-bold text-sm text-slate-900">{order.customerName}</div>
              <div className="text-xs font-mono text-slate-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" />
                <span>{order.customerPhone}</span>
              </div>
              <div className="text-xs text-slate-700 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                <span>
                  {order.address}, {order.commune.nameFr} — <strong className="text-slate-900">{order.wilaya.nameFr}</strong>
                </span>
              </div>
            </div>

            {/* Delivery Service Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-blue-600" />
                <span>Opérateur & Mode de Livraison</span>
              </h3>
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">Transporteur :</span>
                <span className="font-bold font-mono text-blue-700">{order.deliveryCompanyName || 'Yalidine Express'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Type de service :</span>
                <span className="font-semibold text-slate-900">
                  {order.deliveryMethod === 'home' ? 'À Domicile (Home Delivery)' : 'Point Relais (Stop Desk)'}
                </span>
              </div>
              {order.shippingTrackingNumber && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">N° Suivi / Tracking :</span>
                  <span className="font-mono font-bold text-emerald-700">{order.shippingTrackingNumber}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600">Statut de la livraison :</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-800">
                  {order.status}
                </span>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-y border-slate-300 text-slate-700 text-xs font-mono uppercase">
                  <th className="p-2.5">Réf / SKU</th>
                  <th className="p-2.5">Désignation du Matériel</th>
                  <th className="p-2.5 text-center">Qté</th>
                  <th className="p-2.5 text-right">Prix Unitaire</th>
                  <th className="p-2.5 text-right">Total (DZD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-2.5 font-mono text-[11px] text-slate-500">{item.sku || 'N/A'}</td>
                    <td className="p-2.5 font-semibold text-slate-900">
                      <div>{item.name}</div>
                      {item.assignedLicenseKey && (
                        <div className="text-[10px] font-mono text-emerald-600">
                          Clé de licence : {item.assignedLicenseKey}
                        </div>
                      )}
                    </td>
                    <td className="p-2.5 text-center font-bold font-mono">{item.quantity}</td>
                    <td className="p-2.5 text-right font-mono text-slate-700">{formatPrice(item.priceDZD)}</td>
                    <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                      {formatPrice(item.priceDZD * item.quantity)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="text-xs text-slate-500 max-w-sm">
              <div>Mode de règlement : <strong className="text-slate-800">{order.paymentMethod === 'cod' ? 'Espèces à la livraison (COD)' : 'WhatsApp / Virement'}</strong></div>
              <div>Statut du paiement : <strong className="text-slate-800 uppercase">{order.paymentStatus}</strong></div>
              {order.notes && <div className="mt-1 text-slate-700 italic">Notes : {order.notes}</div>}
            </div>

            <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Sous-total HT :</span>
                <span className="font-mono">{formatPrice(order.subtotalDZD)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Frais de port ({order.wilaya.nameFr}) :</span>
                <span className="font-mono">{formatPrice(order.deliveryFeeDZD)}</span>
              </div>
              {order.discountDZD && order.discountDZD > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Remise accordée :</span>
                  <span className="font-mono">-{formatPrice(order.discountDZD)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
                <span>TOTAL À PAYER :</span>
                <span className="font-mono text-base" style={{ color: activeTheme.primaryColor }}>
                  {formatPrice(order.totalDZD)}
                </span>
              </div>
            </div>
          </div>

          {/* Acknowledgment & Signature Blocks */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <p className="text-[11px] text-slate-500 leading-tight">
              <strong>Attestation de réception :</strong> Le client soussigné reconnaît avoir réceptionné les articles listés ci-dessus en parfait état de fonctionnement, neufs et conformes à la commande passée auprès de TOP LAPTOP Algérie.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 sm:gap-8 pt-2">
              <div className="border border-slate-300 rounded-xl p-4 h-28 flex flex-col justify-between">
                <span className="font-bold text-xs text-slate-700">Signature & Cachet Transporteur :</span>
                <span className="text-[10px] text-slate-400">Date : ___ / ___ / 2026</span>
              </div>

              <div className="border border-slate-300 rounded-xl p-4 h-28 flex flex-col justify-between">
                <span className="font-bold text-xs text-slate-700">Signature du Client (Reçu conforme) :</span>
                <span className="text-[10px] text-slate-400">Nom & Prénom : __________________</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
