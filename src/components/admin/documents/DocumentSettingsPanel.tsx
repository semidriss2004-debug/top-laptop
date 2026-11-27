import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../../context/StoreContext';
import { useLanguage } from '../../../context/LanguageContext';
import { CommercialDocType, DocumentCompanySettings } from '../../../types';
import { getCounterKey } from '../../../utils/commercialDocuments';
import {
  Building2,
  CheckCircle2,
  FileText,
  Hash,
  Percent,
  RotateCcw,
  Save,
  Trash2,
  Upload,
} from 'lucide-react';

export const DocumentSettingsPanel: React.FC = () => {
  const { documentSettings, updateDocumentSettings, resetDocumentCounter, commercialDocuments } = useStore();
  const { language } = useLanguage();

  const [form, setForm] = useState<DocumentCompanySettings>(documentSettings);
  const [savedToast, setSavedToast] = useState(false);
  const [resetYear, setResetYear] = useState<number>(new Date().getFullYear());
  const [resetValues, setResetValues] = useState<Record<CommercialDocType, number>>({
    bl: 0,
    proforma: 0,
    facture: 0,
    receipt: 0,
  });
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(documentSettings);
    const y = resetYear;
    setResetValues({
      bl: Number(documentSettings.counters?.[getCounterKey('bl', y)] || 0),
      proforma: Number(documentSettings.counters?.[getCounterKey('proforma', y)] || 0),
      facture: Number(documentSettings.counters?.[getCounterKey('facture', y)] || 0),
      receipt: Number(documentSettings.counters?.[getCounterKey('receipt', y)] || 0),
    });
  }, [documentSettings, resetYear]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX = 320;
        let w = img.width;
        let h = img.height;
        if (w > MAX || h > MAX) {
          if (w >= h) {
            h = Math.round((h * MAX) / w);
            w = MAX;
          } else {
            w = Math.round((w * MAX) / h);
            h = MAX;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          setForm((prev) => ({ ...prev, logoDataUrl: canvas.toDataURL('image/png') }));
        }
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateDocumentSettings({
      ...form,
      defaultTvaRate: Math.max(0, Math.min(100, Number(form.defaultTvaRate) || 0)),
      timbreRatePercent: Math.max(0, Number(form.timbreRatePercent) || 0),
      timbreMinDZD: Math.max(0, Number(form.timbreMinDZD) || 0),
      timbreMaxDZD: Math.max(0, Number(form.timbreMaxDZD) || 0),
      prefixes: {
        bl: (form.prefixes.bl || 'BL').trim().toUpperCase(),
        proforma: (form.prefixes.proforma || 'PRO').trim().toUpperCase(),
        facture: (form.prefixes.facture || 'FAC').trim().toUpperCase(),
        receipt: (form.prefixes.receipt || 'REC').trim().toUpperCase(),
      },
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  const docTypes: { id: CommercialDocType; labelFr: string; labelAr: string }[] = [
    { id: 'bl', labelFr: 'Bon de livraison (BL)', labelAr: 'وصل تسليم (BL)' },
    { id: 'proforma', labelFr: 'Facture proforma', labelAr: 'فاتورة أولية' },
    { id: 'facture', labelFr: 'Facture', labelAr: 'فاتورة رسمية' },
    { id: 'receipt', labelFr: 'Reçu de paiement', labelAr: 'وصل دفع' },
  ];

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="space-y-6">
        {savedToast && (
          <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>
              {language === 'ar'
                ? 'تم حفظ إعدادات المستندات والضرائب بنجاح!'
                : 'Paramètres Documents, mentions légales et numérotation enregistrés !'}
            </span>
          </div>
        )}

        {/* Section 1: Company Identity & Logo */}
        <div className="bg-[#080F1C] p-5 sm:p-6 rounded-2xl border border-blue-900/40 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-cyan-400" />
            <span>
              {language === 'ar'
                ? 'هوية المؤسسة والشعار على المستندات'
                : 'Identité Entreprise & Logo (En-tête PDF / Impression)'}
            </span>
          </h4>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-[#050A14] rounded-xl border border-blue-900/40">
            <div className="w-20 h-20 rounded-xl bg-[#080F1C] border border-blue-900/60 flex items-center justify-center overflow-hidden flex-shrink-0">
              {form.logoDataUrl ? (
                <img src={form.logoDataUrl} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-[10px] font-mono text-cyan-400 text-center px-1">TOP LAPTOP SVG</span>
              )}
            </div>
            <div className="flex-1 space-y-2 text-xs">
              <p className="text-slate-300 font-semibold">
                {language === 'ar'
                  ? 'شعار الشركة (اختياري — يستخدم الشعار الرسمي لـ TOP LAPTOP افتراضياً)'
                  : 'Logo personnalisé (optionnel — utilise le logo officiel TOP LAPTOP par défaut)'}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-cyan-300 border border-blue-700/50 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'رفع شعار' : 'Importer un logo'}</span>
                </button>
                {form.logoDataUrl && (
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, logoDataUrl: '' }))}
                    className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-700/40 font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'إزالة الشعار' : 'Réinitialiser'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="text-slate-300 font-bold block mb-1">
                {language === 'ar' ? 'اسم الشركة / المؤسسة *' : 'Raison Sociale / Nom Entreprise *'}
              </label>
              <input
                type="text"
                required
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">
                {language === 'ar' ? 'الهاتف' : 'Téléphone'}
              </label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <label className="text-slate-300 font-bold block mb-1">
                {language === 'ar' ? 'العنوان الكامل' : 'Adresse du siège / Showroom'}
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Legal & Banking Identifiers */}
        <div className="bg-[#080F1C] p-5 sm:p-6 rounded-2xl border border-blue-900/40 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>
              {language === 'ar'
                ? 'المعرفات القانونية والبنكية (الجزائر)'
                : 'Identifiants Légaux & Bancaires (RC, NIF, NIS, AI, RIB)'}
            </span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Registre de Commerce (RC)</label>
              <input
                type="text"
                value={form.rc}
                onChange={(e) => setForm({ ...form, rc: e.target.value })}
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">NIF (Identifiant Fiscal)</label>
              <input
                type="text"
                value={form.nif}
                onChange={(e) => setForm({ ...form, nif: e.target.value })}
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">NIS (Identifiant Statistique)</label>
              <input
                type="text"
                value={form.nis}
                onChange={(e) => setForm({ ...form, nis: e.target.value })}
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">Article d'Imposition (AI)</label>
              <input
                type="text"
                value={form.ai}
                onChange={(e) => setForm({ ...form, ai: e.target.value })}
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">Banque / Agence</label>
              <input
                type="text"
                value={form.bankName}
                onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">N° Compte Bancaire / RIB</label>
              <input
                type="text"
                value={form.rib}
                onChange={(e) => setForm({ ...form, rib: e.target.value })}
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
          </div>
        </div>

        {/* Section 3: TVA & Optional Stamp Duty (Droit de timbre) */}
        <div className="bg-[#080F1C] p-5 sm:p-6 rounded-2xl border border-blue-900/40 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Percent className="w-4 h-4 text-cyan-400" />
            <span>
              {language === 'ar'
                ? 'الضرائب القابلة للتعديل (TVA وحق الطابع)'
                : 'Fiscalité Configurable (TVA & Droit de Timbre)'}
            </span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Taux TVA par défaut (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.defaultTvaRate}
                onChange={(e) => setForm({ ...form, defaultTvaRate: Number(e.target.value) })}
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">Ex: 19%, 9% ou 0%</span>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Droit de timbre</label>
              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-[#050A14] border border-blue-900/60 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.enableTimbre}
                  onChange={(e) => setForm({ ...form, enableTimbre: e.target.checked })}
                  className="rounded text-cyan-500"
                />
                <span className="text-slate-200 font-semibold">
                  {form.enableTimbre ? 'Activé par défaut' : 'Désactivé (optionnel)'}
                </span>
              </label>
            </div>

            <div>
              <label className="text-slate-300 font-bold block mb-1">Taux Timbre (%)</label>
              <input
                type="number"
                min={0}
                max={20}
                step={0.1}
                value={form.timbreRatePercent}
                onChange={(e) => setForm({ ...form, timbreRatePercent: Number(e.target.value) })}
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Min (DZD)</label>
                <input
                  type="number"
                  min={0}
                  value={form.timbreMinDZD}
                  onChange={(e) => setForm({ ...form, timbreMinDZD: Number(e.target.value) })}
                  className="w-full bg-[#050A14] text-white font-mono rounded-xl px-2.5 py-2 border border-blue-900/60"
                />
              </div>
              <div>
                <label className="text-slate-300 font-bold block mb-1">Max (DZD)</label>
                <input
                  type="number"
                  min={0}
                  value={form.timbreMaxDZD}
                  onChange={(e) => setForm({ ...form, timbreMaxDZD: Number(e.target.value) })}
                  className="w-full bg-[#050A14] text-white font-mono rounded-xl px-2.5 py-2 border border-blue-900/60"
                />
              </div>
            </div>
          </div>

          {/* Texts: Bank details, Terms, Footer */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 text-xs pt-2 border-t border-blue-900/30">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Coordonnées bancaires (affichage)</label>
              <textarea
                rows={2}
                value={form.bankDetailsText}
                onChange={(e) => setForm({ ...form, bankDetailsText: e.target.value })}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">Conditions générales de vente</label>
              <textarea
                rows={2}
                value={form.generalTerms}
                onChange={(e) => setForm({ ...form, generalTerms: e.target.value })}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">Pied de page personnalisé</label>
              <textarea
                rows={2}
                value={form.customFooterText}
                onChange={(e) => setForm({ ...form, customFooterText: e.target.value })}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Prefixes & Sequential Counter Management */}
        <div className="bg-[#080F1C] p-5 sm:p-6 rounded-2xl border border-blue-900/40 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-cyan-400" />
              <span>
                {language === 'ar'
                  ? 'بادئات الترقيم وإعادة ضبط العداد السنوي'
                  : 'Préfixes & Compteurs Séquentiels par Année'}
              </span>
            </h4>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Année compteur :</span>
              <input
                type="number"
                min={2024}
                max={2099}
                value={resetYear}
                onChange={(e) => setResetYear(Number(e.target.value) || new Date().getFullYear())}
                className="w-20 bg-[#050A14] text-cyan-300 font-mono font-bold rounded-lg px-2 py-1 border border-blue-900/60"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {docTypes.map((dt) => {
              const key = getCounterKey(dt.id, resetYear);
              const existingCount = commercialDocuments.filter(
                (d) => d.type === dt.id && d.year === resetYear
              ).length;
              return (
                <div key={dt.id} className="bg-[#050A14] p-3.5 rounded-xl border border-blue-900/40 space-y-2.5">
                  <div className="font-bold text-white flex items-center justify-between">
                    <span>{language === 'ar' ? dt.labelAr : dt.labelFr}</span>
                    <span className="text-[10px] font-mono text-slate-400">{existingCount} docs</span>
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Préfixe</label>
                    <input
                      type="text"
                      maxLength={8}
                      value={form.prefixes[dt.id]}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          prefixes: { ...form.prefixes, [dt.id]: e.target.value.toUpperCase() },
                        })
                      }
                      className="w-full bg-[#080F1C] text-cyan-300 font-mono font-bold rounded-lg px-2.5 py-1.5 border border-blue-900/60"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-[11px] text-slate-400 block mb-1">Dernier N° ({resetYear})</label>
                      <input
                        type="number"
                        min={0}
                        value={resetValues[dt.id]}
                        onChange={(e) =>
                          setResetValues({
                            ...resetValues,
                            [dt.id]: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full bg-[#080F1C] text-white font-mono rounded-lg px-2.5 py-1.5 border border-blue-900/60"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Définir le compteur ${dt.id.toUpperCase()} (${resetYear}) à ${resetValues[dt.id]} ? Le prochain numéro utilisera le max existant + 1 pour éviter tout doublon.`
                          )
                        ) {
                          resetDocumentCounter(dt.id, resetYear, resetValues[dt.id]);
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/70 text-amber-300 border border-amber-600/40 font-bold flex items-center gap-1 cursor-pointer"
                      title={`Réinitialiser / Ajuster le compteur ${key}`}
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Appliquer</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(0,140,255,0.4)] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>
              {language === 'ar'
                ? 'حفظ جميع إعدادات المستندات'
                : 'Enregistrer les paramètres Documents'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
