import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../../context/StoreContext';
import { useLanguage } from '../../../context/LanguageContext';
import { CommercialDocStatus, CommercialDocType, CommercialDocument, CustomerRecord, ReceiptPaymentMethod } from '../../../types';
import {
  downloadCommercialDocumentPdf,
  exportDocumentsToCsv,
  formatDZD,
  getDocStatusLabel,
  getDocTypeLabel,
  getPaymentMethodLabel,
  getPermissionForDocType,
} from '../../../utils/commercialDocuments';
import { DocumentFormModal } from './DocumentFormModal';
import { CommercialDocumentPrintModal } from './CommercialDocumentPrintModal';
import { DocumentSettingsPanel } from './DocumentSettingsPanel';
import {
  AlertCircle,
  ArrowRight,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  FileText,
  Filter,
  Plus,
  Receipt,
  Search,
  Send,
  Settings,
  Truck,
  Wallet,
} from 'lucide-react';

interface DocumentsManagerViewProps {
  initialOrderForDoc?: { orderId: string; type: CommercialDocType } | null;
  onClearInitialOrder?: () => void;
  initialCustomerForDoc?: { customer: CustomerRecord; type: CommercialDocType } | null;
  onClearInitialCustomer?: () => void;
  controlledSubTab?: CommercialDocType | 'settings';
  onSubTabChange?: (tab: CommercialDocType | 'settings') => void;
}

export const DocumentsManagerView: React.FC<DocumentsManagerViewProps> = ({
  initialOrderForDoc,
  onClearInitialOrder,
  initialCustomerForDoc,
  onClearInitialCustomer,
  controlledSubTab,
  onSubTabChange,
}) => {
  const {
    commercialDocuments,
    documentSettings,
    hasPermission,
    issueCommercialDocument,
    updateBLStatus,
    cancelCommercialDocument,
    duplicateCommercialDocument,
    convertCommercialDocument,
  } = useStore();
  const { language } = useLanguage();

  const canBL = hasPermission('issue_bl');
  const canProforma = hasPermission('issue_proforma');
  const canFacture = hasPermission('issue_facture');
  const canReceipt = hasPermission('issue_receipt');
  const canSettings = hasPermission('manage_document_settings');

  const availableTabs = useMemo(() => {
    const list: Array<{ id: CommercialDocType | 'settings'; labelFr: string; labelAr: string; icon: React.ElementType }> = [];
    if (canBL) list.push({ id: 'bl', labelFr: 'Bons de livraison (BL)', labelAr: 'وصولات التسليم (BL)', icon: Truck });
    if (canProforma) list.push({ id: 'proforma', labelFr: 'Factures proforma', labelAr: 'فواتير أولية (Proforma)', icon: FileText });
    if (canFacture) list.push({ id: 'facture', labelFr: 'Factures', labelAr: 'الفواتير الرسمية', icon: Receipt });
    if (canReceipt) list.push({ id: 'receipt', labelFr: 'Reçus de paiement', labelAr: 'وصولات الدفع', icon: Wallet });
    if (canSettings) list.push({ id: 'settings', labelFr: 'Paramètres', labelAr: 'إعدادات المستندات', icon: Settings });
    return list;
  }, [canBL, canProforma, canFacture, canReceipt, canSettings]);

  const [internalSubTab, setInternalSubTab] = useState<CommercialDocType | 'settings'>(() => {
    if (initialOrderForDoc?.type) return initialOrderForDoc.type;
    return availableTabs[0]?.id || 'bl';
  });

  const activeSubTab = controlledSubTab ?? internalSubTab;
  const setActiveSubTab = (tab: CommercialDocType | 'settings') => {
    setInternalSubTab(tab);
    onSubTabChange?.(tab);
  };

  // Ensure active tab stays valid when permissions change
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.some((t) => t.id === activeSubTab)) {
      setInternalSubTab(availableTabs[0].id);
      onSubTabChange?.(availableTabs[0].id);
    }
  }, [availableTabs, activeSubTab]);

  // Open ?doc=DOC-NUMBER deep link if authorized
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const targetNum = params.get('doc');
    if (targetNum && commercialDocuments.length > 0) {
      const matched = commercialDocuments.find(
        (d) => d.number.toUpperCase() === targetNum.toUpperCase()
      );
      if (matched && hasPermission(getPermissionForDocType(matched.type))) {
        setActiveSubTab(matched.type);
        setPreviewDoc(matched);
      }
    }
  }, [commercialDocuments.length]);

  // Search & Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;

  // Modals
  const [formOpen, setFormOpen] = useState(false);
  const [formDocType, setFormDocType] = useState<CommercialDocType>('facture');
  const [editingDoc, setEditingDoc] = useState<CommercialDocument | null>(null);
  const [formInitialOrderId, setFormInitialOrderId] = useState<string | undefined>(undefined);
  const [formInitialFactureId, setFormInitialFactureId] = useState<string | undefined>(undefined);
  const [formInitialCustomerId, setFormInitialCustomerId] = useState<string | undefined>(undefined);

  const [previewDoc, setPreviewDoc] = useState<CommercialDocument | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CommercialDocument | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('');

  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showFeedback = (type: 'ok' | 'err', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  // Trigger creation modal if launched from OrdersManager
  useEffect(() => {
    if (initialOrderForDoc) {
      if (hasPermission(getPermissionForDocType(initialOrderForDoc.type))) {
        setActiveSubTab(initialOrderForDoc.type);
        setFormDocType(initialOrderForDoc.type);
        setEditingDoc(null);
        setFormInitialFactureId(undefined);
        setFormInitialCustomerId(undefined);
        setFormInitialOrderId(initialOrderForDoc.orderId);
        setFormOpen(true);
      } else {
        showFeedback('err', 'Permission refusée pour créer ce document.');
      }
      onClearInitialOrder?.();
    }
  }, [initialOrderForDoc]);

  // Trigger creation modal if launched from CustomersManagerView
  useEffect(() => {
    if (initialCustomerForDoc) {
      if (hasPermission(getPermissionForDocType(initialCustomerForDoc.type))) {
        setActiveSubTab(initialCustomerForDoc.type);
        setFormDocType(initialCustomerForDoc.type);
        setEditingDoc(null);
        setFormInitialOrderId(undefined);
        setFormInitialFactureId(undefined);
        setFormInitialCustomerId(initialCustomerForDoc.customer.id);
        setFormOpen(true);
      } else {
        showFeedback('err', 'Permission refusée pour créer ce document.');
      }
      onClearInitialCustomer?.();
    }
  }, [initialCustomerForDoc]);

  // Reset pagination when tab or filters change
  useEffect(() => {
    setPage(1);
    setStatusFilter('all');
    setPaymentMethodFilter('all');
  }, [activeSubTab]);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, customerFilter, paymentMethodFilter, dateFrom, dateTo]);

  const docsOfCurrentType = useMemo(() => {
    if (activeSubTab === 'settings') return [];
    return commercialDocuments.filter((d) => d.type === activeSubTab);
  }, [commercialDocuments, activeSubTab]);

  const uniqueCustomers = useMemo(() => {
    const names = new Set<string>();
    docsOfCurrentType.forEach((d) => {
      if (d.customer?.name) names.add(d.customer.name);
    });
    return Array.from(names).sort();
  }, [docsOfCurrentType]);

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return docsOfCurrentType.filter((d) => {
      if (q) {
        const hay = [
          d.number,
          d.customer.name,
          d.customer.phone,
          d.orderId,
          d.linkedFactureNumber,
          d.sourceDocumentNumber,
          ...d.lines.map((l) => l.productName),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }

      if (statusFilter !== 'all' && d.status !== statusFilter) return false;
      if (customerFilter !== 'all' && d.customer.name !== customerFilter) return false;
      if (activeSubTab === 'receipt' && paymentMethodFilter !== 'all' && d.paymentMethod !== paymentMethodFilter) {
        return false;
      }
      if (dateFrom && d.date < dateFrom) return false;
      if (dateTo && d.date > dateTo) return false;
      return true;
    });
  }, [docsOfCurrentType, search, statusFilter, customerFilter, paymentMethodFilter, dateFrom, dateTo, activeSubTab]);

  const totalPages = Math.max(1, Math.ceil(filteredDocs.length / pageSize));
  const paginatedDocs = filteredDocs.slice((page - 1) * pageSize, page * pageSize);

  const getStatusClass = (status: CommercialDocStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-slate-800 text-slate-300 border-slate-600';
      case 'issued':
      case 'prepared':
        return 'bg-blue-950 text-cyan-300 border-cyan-500/50';
      case 'partial':
        return 'bg-amber-950 text-amber-300 border-amber-500/50';
      case 'paid':
      case 'delivered':
        return 'bg-emerald-950 text-emerald-300 border-emerald-500/50';
      case 'returned':
        return 'bg-orange-950 text-orange-300 border-orange-500/50';
      case 'cancelled':
        return 'bg-rose-950 text-rose-300 border-rose-500/50';
    }
  };

  const handleCreateNew = (type: CommercialDocType) => {
    setFormDocType(type);
    setEditingDoc(null);
    setFormInitialOrderId(undefined);
    setFormInitialFactureId(undefined);
    setFormInitialCustomerId(undefined);
    setFormOpen(true);
  };

  const handleOpenEdit = (doc: CommercialDocument) => {
    if (doc.status !== 'draft') {
      showFeedback('err', 'Un document émis ne peut pas être modifié. Annulez-le puis réémettez-le.');
      return;
    }
    setFormDocType(doc.type);
    setEditingDoc(doc);
    setFormInitialOrderId(undefined);
    setFormInitialFactureId(undefined);
    setFormInitialCustomerId(undefined);
    setFormOpen(true);
  };

  const handleIssue = (doc: CommercialDocument) => {
    const res = issueCommercialDocument(doc.id);
    if (!res.ok) {
      showFeedback('err', res.errors[0]);
      return;
    }
    showFeedback('ok', `${res.document.number} émis officiellement !`);
  };

  const handleDuplicate = (doc: CommercialDocument) => {
    const res = duplicateCommercialDocument(doc.id);
    if (!res.ok) {
      showFeedback('err', res.errors[0]);
      return;
    }
    showFeedback('ok', `Dupliqué en brouillon : ${res.document.number}`);
  };

  const handleConvert = (doc: CommercialDocument, targetType: CommercialDocType) => {
    if (targetType === 'receipt' && doc.type === 'facture') {
      // Open modal so user/cashier can choose partial or full amount & payment method
      setActiveSubTab('receipt');
      setFormDocType('receipt');
      setEditingDoc(null);
      setFormInitialOrderId(undefined);
      setFormInitialFactureId(doc.id);
      setFormOpen(true);
      return;
    }

    const res = convertCommercialDocument(doc.id, targetType, false);
    if (!res.ok) {
      showFeedback('err', res.errors[0]);
      return;
    }
    setActiveSubTab(targetType);
    showFeedback('ok', `Conversion réussie : ${doc.number} → ${res.document.number} (Brouillon prêt)`);
  };

  const handleConfirmCancel = () => {
    if (!cancelTarget) return;
    const res = cancelCommercialDocument(cancelTarget.id, cancelReason);
    if (!res.ok) {
      showFeedback('err', res.errors[0]);
    } else {
      showFeedback('ok', `${cancelTarget.number} annulé.`);
    }
    setCancelTarget(null);
    setCancelReason('');
  };

  if (availableTabs.length === 0) {
    return (
      <div className="bg-[#080F1C] p-8 rounded-2xl border border-rose-500/40 text-center text-rose-300 text-sm">
        Vous n'avez aucune permission pour accéder au module Documents.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* KPI Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {canBL && (
          <div className="bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40">
            <div className="text-[11px] text-slate-400 font-bold uppercase">Bons de livraison</div>
            <div className="text-xl font-black text-cyan-400 font-mono mt-1">
              {commercialDocuments.filter((d) => d.type === 'bl').length}
            </div>
          </div>
        )}
        {canProforma && (
          <div className="bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40">
            <div className="text-[11px] text-slate-400 font-bold uppercase">Factures proforma</div>
            <div className="text-xl font-black text-indigo-400 font-mono mt-1">
              {commercialDocuments.filter((d) => d.type === 'proforma').length}
            </div>
          </div>
        )}
        {canFacture && (
          <div className="bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40">
            <div className="text-[11px] text-slate-400 font-bold uppercase">Factures (Reste à encaisser)</div>
            <div className="text-base sm:text-lg font-black text-amber-400 font-mono mt-1">
              {formatDZD(
                commercialDocuments
                  .filter((d) => d.type === 'facture' && d.status !== 'cancelled' && d.status !== 'draft')
                  .reduce((sum, f) => sum + Number(f.remainingAmountDZD ?? f.totalDZD), 0)
              )}
            </div>
          </div>
        )}
        {canReceipt && (
          <div className="bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40">
            <div className="text-[11px] text-slate-400 font-bold uppercase">Total Encaissé (Reçus)</div>
            <div className="text-base sm:text-lg font-black text-emerald-400 font-mono mt-1">
              {formatDZD(
                commercialDocuments
                  .filter((d) => d.type === 'receipt' && (d.status === 'issued' || d.status === 'paid'))
                  .reduce((sum, r) => sum + Number(r.paymentAmountDZD ?? r.totalDZD), 0)
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-900/40 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar w-full sm:w-auto">
          {availableTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeSubTab === tab.id;
            const count =
              tab.id === 'settings'
                ? null
                : commercialDocuments.filter((d) => d.type === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                    : 'bg-[#080F1C] text-slate-400 hover:text-white border border-blue-900/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? tab.labelAr : tab.labelFr}</span>
                {count !== null && (
                  <span className="px-1.5 py-0.5 rounded bg-black/30 font-mono text-[10px]">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {activeSubTab !== 'settings' && (
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => exportDocumentsToCsv(filteredDocs, `documents_${activeSubTab}`, language)}
              className="px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              title="Exporter la liste filtrée en CSV / Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV/Excel</span>
            </button>

            <button
              onClick={() => handleCreateNew(activeSubTab)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,140,255,0.4)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>
                {language === 'ar'
                  ? `إنشاء ${getDocTypeLabel(activeSubTab, 'ar')}`
                  : `Nouveau ${getDocTypeLabel(activeSubTab, 'fr')}`}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'ok'
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
          }`}
        >
          {feedback.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeSubTab === 'settings' ? (
        <DocumentSettingsPanel />
      ) : (
        <>
          {/* Search & Filters Bar */}
          <div className="bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="N° document, client, tél, commande, produit..."
                className="w-full bg-[#050A14] text-white rounded-xl ps-9 pe-3 py-2 border border-blue-900/60"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#050A14] text-white rounded-xl px-2.5 py-2 border border-blue-900/60"
              >
                <option value="all">Tous statuts</option>
                <option value="draft">Brouillon</option>
                {activeSubTab === 'bl' ? (
                  <>
                    <option value="prepared">Préparé</option>
                    <option value="delivered">Livré</option>
                    <option value="returned">Retourné</option>
                  </>
                ) : (
                  <>
                    <option value="issued">Émis(e)</option>
                    {activeSubTab === 'facture' && <option value="partial">Partiellement payée</option>}
                    {(activeSubTab === 'facture' || activeSubTab === 'receipt') && (
                      <option value="paid">Payé(e)</option>
                    )}
                  </>
                )}
                <option value="cancelled">Annulé(e)</option>
              </select>
            </div>

            <div>
              <select
                value={customerFilter}
                onChange={(e) => setCustomerFilter(e.target.value)}
                className="w-full bg-[#050A14] text-white rounded-xl px-2.5 py-2 border border-blue-900/60"
              >
                <option value="all">Tous clients ({uniqueCustomers.length})</option>
                {uniqueCustomers.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {activeSubTab === 'receipt' ? (
              <div>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="w-full bg-[#050A14] text-white rounded-xl px-2.5 py-2 border border-blue-900/60"
                >
                  <option value="all">Tous modes paiement</option>
                  {(['cash', 'cheque', 'bank_transfer', 'ccp_baridimob', 'other'] as ReceiptPaymentMethod[]).map(
                    (m) => (
                      <option key={m} value={m}>
                        {getPaymentMethodLabel(m, language)}
                      </option>
                    )
                  )}
                </select>
              </div>
            ) : (
              <div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  title="Date début"
                  className="w-full bg-[#050A14] text-white rounded-xl px-2.5 py-2 border border-blue-900/60"
                />
              </div>
            )}

            <div>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                title="Date fin"
                className="w-full bg-[#050A14] text-white rounded-xl px-2.5 py-2 border border-blue-900/60"
              />
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-[#080F1C] rounded-2xl border border-blue-900/40 overflow-hidden">
            {paginatedDocs.length === 0 ? (
              <div className="p-10 text-center text-slate-400 text-xs space-y-2">
                <FileText className="w-8 h-8 mx-auto text-slate-600" />
                <div>Aucun document trouvé dans cette catégorie.</div>
                <button
                  onClick={() => handleCreateNew(activeSubTab)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Créer le premier document</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-[#050A14] text-slate-400 border-b border-blue-900/40 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-3 text-start">N° / Date</th>
                      <th className="p-3 text-start">Client</th>
                      <th className="p-3 text-start">Liens / Réf</th>
                      <th className="p-3 text-start">Montant</th>
                      <th className="p-3 text-start">Statut</th>
                      <th className="p-3 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-900/30">
                    {paginatedDocs.map((doc) => {
                      const canEdit = doc.status === 'draft';
                      const canCancelDoc =
                        doc.status !== 'cancelled' &&
                        (hasPermission('cancel_documents') || hasPermission(getPermissionForDocType(doc.type)));

                      return (
                        <tr key={doc.id} className="hover:bg-blue-950/20 transition-colors">
                          <td className="p-3">
                            <div className="font-mono font-black text-cyan-300">{doc.number}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{doc.date}</div>
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-white">{doc.customer.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{doc.customer.phone}</div>
                          </td>

                          <td className="p-3 space-y-1 text-[11px]">
                            {doc.orderId && (
                              <span className="inline-block px-2 py-0.5 rounded bg-blue-950 text-cyan-300 border border-blue-800 font-mono me-1">
                                Cmd {doc.orderId}
                              </span>
                            )}
                            {doc.sourceDocumentNumber && (
                              <span className="inline-block px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-mono me-1">
                                De {doc.sourceDocumentNumber}
                              </span>
                            )}
                            {doc.linkedFactureNumber && (
                              <span className="inline-block px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                                Fac {doc.linkedFactureNumber}
                              </span>
                            )}
                            {doc.type === 'receipt' && (
                              <div className="text-slate-300">
                                {getPaymentMethodLabel(doc.paymentMethod, language)}
                              </div>
                            )}
                          </td>

                          <td className="p-3 font-mono">
                            <div className="font-black text-white">
                              {doc.type === 'bl' && doc.blShowPrices === false
                                ? 'Sans prix'
                                : formatDZD(doc.totalDZD)}
                            </div>
                            {doc.type === 'facture' && doc.status !== 'draft' && doc.status !== 'cancelled' && (
                              <div className="text-[10px]">
                                <span className="text-emerald-400">Payé: {formatDZD(doc.amountPaidDZD || 0)}</span>
                                <span className="text-amber-400 block">
                                  Reste: {formatDZD(doc.remainingAmountDZD ?? doc.totalDZD)}
                                </span>
                              </div>
                            )}
                          </td>

                          <td className="p-3">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getStatusClass(
                                doc.status
                              )}`}
                            >
                              {getDocStatusLabel(doc.status, language)}
                            </span>

                            {/* Quick BL workflow selector */}
                            {doc.type === 'bl' &&
                              doc.status !== 'draft' &&
                              doc.status !== 'cancelled' &&
                              canBL && (
                                <select
                                  value={doc.status}
                                  onChange={(e) =>
                                    updateBLStatus(
                                      doc.id,
                                      e.target.value as 'prepared' | 'delivered' | 'returned'
                                    )
                                  }
                                  className="block mt-1 bg-[#050A14] text-[10px] text-cyan-300 rounded px-1.5 py-0.5 border border-blue-900/60"
                                >
                                  <option value="prepared">Préparé</option>
                                  <option value="delivered">Livré</option>
                                  <option value="returned">Retourné</option>
                                </select>
                              )}
                          </td>

                          <td className="p-3">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              {/* View / Print */}
                              <button
                                onClick={() => setPreviewDoc(doc)}
                                className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900 text-cyan-300 hover:text-white cursor-pointer"
                                title="Voir / Imprimer A4"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Quick Direct PDF */}
                              <button
                                onClick={() => downloadCommercialDocumentPdf(doc, documentSettings, language)}
                                className="p-1.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900 text-indigo-300 hover:text-white cursor-pointer"
                                title="Télécharger PDF"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Draft */}
                              {canEdit && (
                                <button
                                  onClick={() => handleOpenEdit(doc)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
                                  title="Modifier le brouillon"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Issue Draft */}
                              {canEdit && (
                                <button
                                  onClick={() => handleIssue(doc)}
                                  className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold flex items-center gap-1 cursor-pointer"
                                  title="Émettre officiellement (verrouiller)"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Émettre</span>
                                </button>
                              )}

                              {/* Duplicate */}
                              <button
                                onClick={() => handleDuplicate(doc)}
                                className="p-1.5 rounded-lg bg-blue-950/50 hover:bg-blue-900 text-slate-300 hover:text-white cursor-pointer"
                                title="Dupliquer / Réémettre"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>

                              {/* 1-Click Conversions */}
                              {doc.type === 'proforma' && doc.status !== 'cancelled' && canFacture && (
                                <button
                                  onClick={() => handleConvert(doc, 'facture')}
                                  className="px-2 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/40 font-bold flex items-center gap-1 cursor-pointer"
                                  title="Convertir cette Proforma en Facture"
                                >
                                  <ArrowRight className="w-3 h-3" />
                                  <span>Facture</span>
                                </button>
                              )}

                              {doc.type === 'facture' && doc.status !== 'cancelled' && canBL && (
                                <button
                                  onClick={() => handleConvert(doc, 'bl')}
                                  className="px-2 py-1 rounded-lg bg-blue-950/70 hover:bg-blue-900 text-cyan-300 border border-blue-600/40 font-bold flex items-center gap-1 cursor-pointer"
                                  title="Générer un Bon de Livraison lié à cette Facture"
                                >
                                  <Truck className="w-3 h-3" />
                                  <span>BL</span>
                                </button>
                              )}

                              {doc.type === 'facture' &&
                                doc.status !== 'cancelled' &&
                                doc.status !== 'draft' &&
                                (doc.remainingAmountDZD ?? doc.totalDZD) > 0 &&
                                canReceipt && (
                                  <button
                                    onClick={() => handleConvert(doc, 'receipt')}
                                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1 cursor-pointer"
                                    title="Émettre un Reçu de paiement (partiel ou total)"
                                  >
                                    <Wallet className="w-3 h-3" />
                                    <span>Encaisser</span>
                                  </button>
                                )}

                              {/* Cancel */}
                              {canCancelDoc && (
                                <button
                                  onClick={() => {
                                    setCancelTarget(doc);
                                    setCancelReason('');
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white cursor-pointer"
                                  title="Annuler le document"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Footer */}
            {filteredDocs.length > pageSize && (
              <div className="p-3 bg-[#050A14] border-t border-blue-900/40 flex items-center justify-between text-xs text-slate-400">
                <span>
                  Page {page} / {totalPages} ({filteredDocs.length} documents)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg bg-[#080F1C] border border-blue-900/50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg bg-[#080F1C] border border-blue-900/50 disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Document Creation / Edit Modal */}
      <DocumentFormModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        docType={formDocType}
        documentToEdit={editingDoc}
        initialOrderId={formInitialOrderId}
        initialFactureId={formInitialFactureId}
        initialCustomerId={formInitialCustomerId}
        onSaved={(saved) => {
          showFeedback(
            'ok',
            saved.status === 'draft'
              ? `Brouillon ${saved.number} enregistré.`
              : `Document ${saved.number} émis avec succès !`
          );
          if (saved.status !== 'draft') {
            setPreviewDoc(saved);
          }
        }}
      />

      {/* A4 Print / PDF / WhatsApp Preview Modal */}
      <CommercialDocumentPrintModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />

      {/* Cancel Document Reason Modal */}
      {cancelTarget && (
        <div
          onClick={() => setCancelTarget(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#091122] rounded-2xl border border-rose-500/50 p-5 max-w-md w-full space-y-4 text-xs"
          >
            <h4 className="text-sm font-black text-white flex items-center gap-2">
              <Ban className="w-4 h-4 text-rose-400" />
              <span>Annuler le document {cancelTarget.number} ?</span>
            </h4>
            <p className="text-slate-300">
              Les documents émis restent archivés avec le statut Annulé pour la traçabilité fiscale. Vous pourrez ensuite le dupliquer/réémettre.
            </p>
            <div>
              <label className="text-slate-300 font-bold block mb-1">Motif d'annulation (optionnel)</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="ex: Erreur de quantité / Modification demandée par le client"
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
              >
                Retour
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Confirmer l'annulation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
