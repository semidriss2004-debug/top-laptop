import React, { useMemo, useRef, useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { CommercialDocType, CustomerClientType, CustomerRecord } from '../../types';
import { buildTelUrl, buildWhatsAppUrl } from '../../utils/contactLinks';
import { exportCustomersToCsv, getClientTypeLabel } from '../../services/customersApi';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  Database,
  Edit,
  FileSpreadsheet,
  FileText,
  Landmark,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Search,
  Store,
  Trash2,
  User,
  X,
} from 'lucide-react';

interface CustomersManagerViewProps {
  onCreateDocForCustomer?: (customer: CustomerRecord, type: CommercialDocType) => void;
}

export const CustomersManagerView: React.FC<CustomersManagerViewProps> = ({
  onCreateDocForCustomer,
}) => {
  const {
    customers,
    customersDbSource,
    wilayas,
    refreshCustomersFromDb,
    createCustomerRecord,
    updateCustomerRecord,
    deleteCustomerRecord,
    hasPermission,
  } = useStore();
  const { language } = useLanguage();

  const [search, setSearch] = useState('');
  const [wilayaFilter, setWilayaFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add / Edit Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRecord | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [clientType, setClientType] = useState<CustomerClientType>('shop');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [wilayaCode, setWilayaCode] = useState<number>(16);
  const [address, setAddress] = useState('');
  const [nif, setNif] = useState('');
  const [rc, setRc] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const showToast = (type: 'ok' | 'err', text: string) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 4000);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshCustomersFromDb().catch(() => {});
    setIsRefreshing(false);
  };

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (typeFilter !== 'all' && c.clientType !== typeFilter) return false;
      if (wilayaFilter !== 'all' && String(c.wilayaCode) !== wilayaFilter) return false;
      if (q) {
        const hay = [
          c.companyName,
          c.contactPerson,
          c.phone,
          c.email,
          c.address,
          c.wilayaNameFr,
          c.wilayaNameAr,
          c.nif,
          c.rc,
          c.notes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [customers, search, wilayaFilter, typeFilter]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setCompanyName('');
    setContactPerson('');
    setClientType('shop');
    setPhone('');
    setEmail('');
    setWilayaCode(16);
    setAddress('');
    setNif('');
    setRc('');
    setNotes('');
    setErrors([]);
    setModalOpen(true);
  };

  const openEditModal = (c: CustomerRecord) => {
    setEditingCustomer(c);
    setCompanyName(c.companyName);
    setContactPerson(c.contactPerson);
    setClientType(c.clientType);
    setPhone(c.phone);
    setEmail(c.email || '');
    setWilayaCode(c.wilayaCode || 16);
    setAddress(c.address || '');
    setNif(c.nif || '');
    setRc(c.rc || '');
    setNotes(c.notes || '');
    setErrors([]);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setErrors([]);

    try {
      const selectedWilaya = wilayas.find((w) => w.code === Number(wilayaCode));
      const payload = {
        companyName: companyName.trim(),
        contactPerson: contactPerson.trim(),
        clientType,
        phone: phone.trim(),
        email: email.trim(),
        wilayaCode: Number(wilayaCode) || 16,
        wilayaNameFr: selectedWilaya?.nameFr || `${wilayaCode}`,
        wilayaNameAr: selectedWilaya?.nameAr || `${wilayaCode}`,
        address: address.trim(),
        nif: nif.trim(),
        rc: rc.trim(),
        notes: notes.trim(),
      };

      const res = editingCustomer
        ? await updateCustomerRecord(editingCustomer.id, payload)
        : await createCustomerRecord(payload);

      if (!res.ok) {
        setErrors(res.errors);
        return;
      }

      setModalOpen(false);
      showToast(
        'ok',
        editingCustomer
          ? language === 'ar'
            ? `تم تحديث بيانات "${res.customer.companyName}" وحفظها في قاعدة البيانات!`
            : `Client "${res.customer.companyName}" mis à jour dans la base de données !`
          : language === 'ar'
          ? `تمت إضافة "${res.customer.companyName}" إلى قاعدة البيانات بنجاح!`
          : `Client "${res.customer.companyName}" enregistré dans la base de données !`
      );
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (c: CustomerRecord) => {
    const confirmMsg =
      language === 'ar'
        ? `هل تريد حذف "${c.companyName}" نهائياً من قاعدة بيانات الزبائن؟`
        : `Supprimer définitivement "${c.companyName}" de la base clients ?`;
    if (!window.confirm(confirmMsg)) return;

    const res = await deleteCustomerRecord(c.id);
    if (!res.ok) {
      showToast('err', res.error);
    } else {
      showToast(
        'ok',
        language === 'ar'
          ? `تم حذف "${c.companyName}" من قاعدة البيانات.`
          : `"${c.companyName}" supprimé de la base.`
      );
    }
  };

  const getTypeBadge = (type: CustomerClientType) => {
    switch (type) {
      case 'shop':
        return {
          icon: Store,
          cls: 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300',
        };
      case 'company':
        return {
          icon: Building2,
          cls: 'bg-blue-950/70 border-blue-500/40 text-blue-300',
        };
      case 'institution':
        return {
          icon: Landmark,
          cls: 'bg-indigo-950/70 border-indigo-500/40 text-indigo-300',
        };
    }
  };

  const dbLabel =
    customersDbSource === 'netlify-blobs'
      ? language === 'ar'
        ? 'متصل بقاعدة البيانات السحابية (Netlify Blobs API)'
        : 'Base Active : Cloud DB (Netlify Blobs API)'
      : customersDbSource === 'server-json-db'
      ? language === 'ar'
        ? 'متصل بقاعدة البيانات على السيرفر (data/customers.json API)'
        : 'Base Active : API Serveur (data/customers.json)'
      : language === 'ar'
      ? 'وضع محلي احتياطي (IndexedDB / LocalStorage)'
      : 'Stockage local (IndexedDB / LocalStorage)';

  const canCreateDocs =
    hasPermission('issue_facture') || hasPermission('issue_proforma') || hasPermission('issue_bl');

  return (
    <div className="space-y-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40">
          <div className="text-[11px] text-slate-400 font-bold uppercase">
            {language === 'ar' ? 'إجمالي الزبائن B2B' : 'Total Clients B2B'}
          </div>
          <div className="text-xl font-black text-cyan-400 font-mono mt-1">{customers.length}</div>
        </div>
        <div className="bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40">
          <div className="text-[11px] text-slate-400 font-bold uppercase">
            {language === 'ar' ? 'المحلات التجارية' : 'Magasins'}
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">
            {customers.filter((c) => c.clientType === 'shop').length}
          </div>
        </div>
        <div className="bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40">
          <div className="text-[11px] text-slate-400 font-bold uppercase">
            {language === 'ar' ? 'الشركات' : 'Entreprises'}
          </div>
          <div className="text-xl font-black text-blue-400 font-mono mt-1">
            {customers.filter((c) => c.clientType === 'company').length}
          </div>
        </div>
        <div className="bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40">
          <div className="text-[11px] text-slate-400 font-bold uppercase">
            {language === 'ar' ? 'المؤسسات والهيئات' : 'Institutions'}
          </div>
          <div className="text-xl font-black text-indigo-400 font-mono mt-1">
            {customers.filter((c) => c.clientType === 'institution').length}
          </div>
        </div>
      </div>

      {/* Top Action Header + Database Indicator */}
      <div className="bg-[#080F1C] p-4 sm:p-5 rounded-2xl border border-blue-900/40 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-cyan-400" />
            <span>
              {language === 'ar'
                ? 'قاعدة بيانات الزبائن (المحلات والشركات)'
                : 'Base de Données Clients (Magasins & Entreprises)'}
            </span>
          </h3>
          <div className="inline-flex items-center gap-2 text-[11px] font-mono text-emerald-300 bg-emerald-950/50 border border-emerald-500/40 px-2.5 py-1 rounded-lg">
            <Database className="w-3.5 h-3.5" />
            <span>{dbLabel}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={handleRefresh}
            className="px-3 py-2 rounded-xl bg-blue-950/60 hover:bg-blue-900/60 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{language === 'ar' ? 'تحديث' : 'Actualiser DB'}</span>
          </button>

          <button
            type="button"
            onClick={() => exportCustomersToCsv(filteredCustomers, language)}
            className="px-3 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'تصدير Excel / CSV' : 'Exporter Excel / CSV'}</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,140,255,0.4)] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ar' ? 'إضافة زبون جديد' : 'Nouveau Client'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {toast && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            toast.type === 'ok'
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
          }`}
        >
          {toast.type === 'ok' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{toast.text}</span>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
        <div className="relative lg:col-span-2">
          <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              language === 'ar'
                ? 'ابحث باسم المحل، المسؤول، الهاتف، السجل التجاري RC أو NIF...'
                : 'Rechercher par société, contact, téléphone, RC, NIF...'
            }
            className="w-full bg-[#050A14] text-white rounded-xl ps-9 pe-3 py-2 border border-blue-900/60 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
        >
          <option value="all">{language === 'ar' ? 'جميع الأنواع' : 'Tous types'}</option>
          <option value="shop">{getClientTypeLabel('shop', language)}</option>
          <option value="company">{getClientTypeLabel('company', language)}</option>
          <option value="institution">{getClientTypeLabel('institution', language)}</option>
        </select>

        <select
          value={wilayaFilter}
          onChange={(e) => setWilayaFilter(e.target.value)}
          className="bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
        >
          <option value="all">{language === 'ar' ? 'جميع الولايات (69)' : 'Toutes Wilayas (69)'}</option>
          {wilayas.map((w) => (
            <option key={w.code} value={String(w.code)}>
              {language === 'ar' ? w.nameAr : w.nameFr}
            </option>
          ))}
        </select>
      </div>

      {/* Customers Table */}
      <div className="bg-[#080F1C] rounded-2xl border border-blue-900/40 overflow-hidden">
        {filteredCustomers.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-xs space-y-2">
            <Building2 className="w-8 h-8 mx-auto text-slate-600" />
            <div>
              {language === 'ar'
                ? 'لا يوجد زبائن مطابقون للبحث.'
                : 'Aucun client B2B ne correspond à votre recherche.'}
            </div>
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'إضافة أول زبون' : 'Ajouter un client'}</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-xs">
              <thead className="bg-[#050A14] text-slate-400 border-b border-blue-900/40 font-mono uppercase text-[10px]">
                <tr>
                  <th className="p-3 text-start">{language === 'ar' ? 'المحل / الشركة' : 'Entreprise / Magasin'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'المسؤول والتواصل' : 'Contact & Tél'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'الولاية والعنوان' : 'Wilaya & Adresse'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'السجل / الجبائي' : 'RC / NIF'}</th>
                  <th className="p-3 text-start">{language === 'ar' ? 'ملاحظات وتاريخ' : 'Notes & Date'}</th>
                  <th className="p-3 text-end">{language === 'ar' ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-900/30">
                {filteredCustomers.map((c) => {
                  const badge = getTypeBadge(c.clientType);
                  const TypeIcon = badge.icon;

                  return (
                    <tr key={c.id} className="hover:bg-blue-950/20 transition-colors">
                      <td className="p-3">
                        <div className="font-bold text-white text-sm">{c.companyName}</div>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold mt-1 ${badge.cls}`}
                        >
                          <TypeIcon className="w-3 h-3" />
                          <span>{getClientTypeLabel(c.clientType, language)}</span>
                        </span>
                      </td>

                      <td className="p-3 space-y-1">
                        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                          <User className="w-3 h-3 text-cyan-400" />
                          <span>{c.contactPerson}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={buildTelUrl(c.phone)}
                            className="font-mono text-cyan-300 hover:underline flex items-center gap-1"
                            dir="ltr"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{c.phone}</span>
                          </a>
                          <a
                            href={buildWhatsAppUrl(c.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-400 hover:text-emerald-300"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                        {c.email && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>{c.email}</span>
                          </div>
                        )}
                      </td>

                      <td className="p-3">
                        <div className="font-bold text-cyan-300">
                          {language === 'ar' ? c.wilayaNameAr : c.wilayaNameFr}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-start gap-1 max-w-[220px]">
                          <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                          <span>{c.address || '-'}</span>
                        </div>
                      </td>

                      <td className="p-3 font-mono text-[11px] text-slate-300 space-y-0.5">
                        <div>RC: {c.rc || '-'}</div>
                        <div>NIF: {c.nif || '-'}</div>
                      </td>

                      <td className="p-3 text-[11px] text-slate-400 space-y-1 max-w-[200px]">
                        <div className="line-clamp-2 text-slate-300">{c.notes || '-'}</div>
                        <div className="font-mono text-[10px] text-slate-500">
                          {new Date(c.createdAt).toLocaleDateString('fr-DZ')}
                        </div>
                      </td>

                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {onCreateDocForCustomer && canCreateDocs && (
                            <button
                              type="button"
                              onClick={() => onCreateDocForCustomer(c, 'facture')}
                              className="px-2 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/40 font-bold flex items-center gap-1 cursor-pointer"
                              title={language === 'ar' ? 'إنشاء فاتورة لهذا الزبون' : 'Créer une Facture'}
                            >
                              <FileText className="w-3 h-3" />
                              <span className="hidden xl:inline">{language === 'ar' ? 'فاتورة' : 'Facture'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openEditModal(c)}
                            className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900 text-cyan-300 hover:text-white cursor-pointer"
                            title={language === 'ar' ? 'تعديل' : 'Modifier'}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(c)}
                            className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white cursor-pointer"
                            title={language === 'ar' ? 'حذف' : 'Supprimer'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {modalOpen && (
        <div
          onClick={() => setModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-black/85 backdrop-blur-sm"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-[#091122] rounded-3xl border border-cyan-500/40 shadow-[0_0_50px_rgba(0,140,255,0.3)] overflow-hidden my-auto max-h-[92dvh] flex flex-col"
          >
            <div className="p-5 border-b border-blue-900/40 bg-[#060C18] flex items-center justify-between">
              <h4 className="text-base font-black text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <span>
                  {editingCustomer
                    ? language === 'ar'
                      ? 'تعديل بيانات الزبون'
                      : 'Modifier Client B2B'
                    : language === 'ar'
                    ? 'إضافة زبون جديد إلى قاعدة البيانات'
                    : 'Ajouter un Client B2B'}
                </span>
              </h4>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg bg-blue-950/60 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              {errors.length > 0 && (
                <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 space-y-1">
                  {errors.map((err, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                      <span>{err}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    {language === 'ar' ? 'اسم المحل أو الشركة *' : 'Nom du Magasin / Entreprise *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: شركة الأطلس للمعلوماتية' : 'ex: SARL InfoTech Alger'}
                    className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2.5 border border-blue-900/60 focus:border-cyan-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    {language === 'ar' ? 'نوع الزبون *' : 'Type de client *'}
                  </label>
                  <select
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value as CustomerClientType)}
                    className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2.5 border border-blue-900/60"
                  >
                    <option value="shop">{getClientTypeLabel('shop', language)}</option>
                    <option value="company">{getClientTypeLabel('company', language)}</option>
                    <option value="institution">{getClientTypeLabel('institution', language)}</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    {language === 'ar' ? 'اسم المسؤول / جهة الاتصال *' : 'Responsable / Contact *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: كريم بن يوسف' : 'ex: Karim Benyoussef'}
                    className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2.5 border border-blue-900/60"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    {language === 'ar' ? 'رقم الهاتف *' : 'Téléphone *'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0555 12 34 56"
                    className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2.5 border border-blue-900/60"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    {language === 'ar' ? 'البريد الإلكتروني (اختياري)' : 'Email (optionnel)'}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@entreprise.dz"
                    className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2.5 border border-blue-900/60"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    {language === 'ar' ? 'الولاية *' : 'Wilaya *'}
                  </label>
                  <select
                    value={wilayaCode}
                    onChange={(e) => setWilayaCode(Number(e.target.value))}
                    className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2.5 border border-blue-900/60"
                  >
                    {wilayas.map((w) => (
                      <option key={w.code} value={w.code}>
                        {language === 'ar' ? w.nameAr : w.nameFr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">
                    {language === 'ar' ? 'العنوان بالتفصيل' : 'Adresse complète'}
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={language === 'ar' ? 'الشارع، الحي، المدينة...' : 'Rue, quartier, commune...'}
                    className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2.5 border border-blue-900/60"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    {language === 'ar' ? 'الرقم الجبائي NIF (اختياري)' : 'NIF (optionnel)'}
                  </label>
                  <input
                    type="text"
                    value={nif}
                    onChange={(e) => setNif(e.target.value)}
                    placeholder="001916012345678"
                    className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2.5 border border-blue-900/60"
                  />
                </div>

                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    {language === 'ar' ? 'السجل التجاري RC (اختياري)' : 'Registre de Commerce RC (optionnel)'}
                  </label>
                  <input
                    type="text"
                    value={rc}
                    onChange={(e) => setRc(e.target.value)}
                    placeholder="16/00-1234567B20"
                    className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2.5 border border-blue-900/60"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-300 font-bold block mb-1">
                    {language === 'ar' ? 'ملاحظات إضافية' : 'Notes supplémentaires'}
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={language === 'ar' ? 'شروط الدفع، مواعيد التواصل، الأجهزة المفضلة...' : 'Remarques, conditions commerciales...'}
                    className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-blue-900/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Annuler'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,140,255,0.4)] cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? language === 'ar'
                        ? 'جاري الحفظ...'
                        : 'Enregistrement...'
                      : language === 'ar'
                      ? 'حفظ في قاعدة البيانات'
                      : 'Enregistrer dans la DB'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
