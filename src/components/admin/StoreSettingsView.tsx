import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  buildTelUrl,
  buildWhatsAppUrl,
  normalizeExternalUrl,
} from '../../utils/contactLinks';
import { getEffectiveSiteConfig } from '../../config/siteConfig';
import { 
  Save, 
  Phone, 
  Share2, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';

export const StoreSettingsView: React.FC = () => {
  const { settings, updateSettings } = useStore();
  const { language } = useLanguage();

  const initialCfg = getEffectiveSiteConfig(settings);

  const [storeName, setStoreName] = useState(initialCfg.storeName);
  const [flatFee, setFlatFee] = useState(settings.flatDeliveryFeeDZD);
  const [whatsapp, setWhatsapp] = useState(initialCfg.whatsappNumber);
  const [contactPhone, setContactPhone] = useState(initialCfg.phone);
  const [contactEmail, setContactEmail] = useState(initialCfg.email);
  const [storeAddress, setStoreAddress] = useState(initialCfg.address);
  const [rc, setRc] = useState(settings.tradeRegisterRC || '');
  const [nif, setNif] = useState(settings.taxNumberNIF || '');

  // Official Social Media Links
  const [facebook, setFacebook] = useState(initialCfg.facebook);
  const [instagram, setInstagram] = useState(initialCfg.instagram);
  const [tiktok, setTiktok] = useState(initialCfg.tiktok);
  const [youtube, setYoutube] = useState(initialCfg.youtube);
  const [linkedin, setLinkedin] = useState(initialCfg.linkedin);

  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<{ savedLocal: boolean; syncedCloud: boolean } | null>(null);

  // Sync form state from settings ONLY when there are no unsaved edits in the form
  useEffect(() => {
    if (isDirty) return;
    const cfg = getEffectiveSiteConfig(settings);
    setStoreName(cfg.storeName);
    setFlatFee(settings.flatDeliveryFeeDZD);
    setWhatsapp(cfg.whatsappNumber);
    setContactPhone(cfg.phone);
    setContactEmail(cfg.email);
    setStoreAddress(cfg.address);
    setRc(settings.tradeRegisterRC || '');
    setNif(settings.taxNumberNIF || '');
    setFacebook(cfg.facebook);
    setInstagram(cfg.instagram);
    setTiktok(cfg.tiktok);
    setYoutube(cfg.youtube);
    setLinkedin(cfg.linkedin);
  }, [settings, isDirty]);

  const markDirty = () => {
    if (!isDirty) setIsDirty(true);
    if (saveBanner) setSaveBanner(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);

    try {
      const cleanPhone = contactPhone.trim();
      const cleanWhatsapp = whatsapp.trim();
      const nextWhatsapp = cleanWhatsapp || cleanPhone || initialCfg.whatsappNumber;
      const nextContactPhone = cleanPhone || cleanWhatsapp || initialCfg.phone;

      const nextFacebook = facebook.trim() ? normalizeExternalUrl(facebook) || '' : '';
      const nextInstagram = instagram.trim() ? normalizeExternalUrl(instagram) || '' : '';
      const nextTiktok = tiktok.trim() ? normalizeExternalUrl(tiktok) || '' : '';
      const nextYoutube = youtube.trim() ? normalizeExternalUrl(youtube) || '' : '';
      const nextLinkedin = linkedin.trim() ? normalizeExternalUrl(linkedin) || '' : '';

      const result = await updateSettings({
        storeName: storeName.trim() || initialCfg.storeName,
        flatDeliveryFeeDZD: Number(flatFee) || 800,
        whatsappNumber: nextWhatsapp,
        contactPhone: nextContactPhone,
        contactEmail: contactEmail.trim(),
        storeAddress: storeAddress.trim(),
        tradeRegisterRC: rc.trim(),
        taxNumberNIF: nif.trim(),
        socialLinks: {
          facebook: nextFacebook,
          instagram: nextInstagram,
          tiktok: nextTiktok,
          youtube: nextYoutube,
          linkedin: nextLinkedin,
          whatsapp: buildWhatsAppUrl(nextWhatsapp),
        },
      });

      setWhatsapp(nextWhatsapp);
      setContactPhone(nextContactPhone);
      setFacebook(nextFacebook);
      setInstagram(nextInstagram);
      setTiktok(nextTiktok);
      setYoutube(nextYoutube);
      setLinkedin(nextLinkedin);
      setIsDirty(false);
      setSaveBanner(result);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-[#080F1C] p-6 rounded-2xl border border-blue-900/40 space-y-6">
        {saveBanner && (
          <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-200 text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-emerald-300 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                {language === 'ar'
                  ? 'تم حفظ جميع معلومات التواصل والروابط بنجاح وبشكل دائم!'
                  : 'Paramètres de contact et liens sociaux enregistrés de façon permanente !'}
              </span>
            </div>
            <div className="text-[11px] text-emerald-300/90 ps-6">
              {saveBanner.syncedCloud
                ? language === 'ar'
                  ? '✓ محفوظ في المتصفح (siteConfig / LocalStorage) ومتزامن مع السحابة.'
                  : '✓ Enregistré localement (siteConfig) et synchronisé avec le Cloud.'
                : language === 'ar'
                ? '✓ محفوظ في المتصفح (siteConfig / LocalStorage) وسيبقى ثابتاً بعد إعادة تحميل الصفحة.'
                : '✓ Enregistré localement (siteConfig) — persiste après rechargement de la page (F5).'}
            </div>
          </div>
        )}

        {/* Section 1: Store Legal & Identifiers */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>
              {language === 'ar'
                ? 'المعلومات القانونية وهوية المتجر'
                : 'Informations Légales & En-tête des Documents (Bon de Livraison)'}
            </span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">
                {language === 'ar' ? 'اسم المتجر' : 'Raison Sociale / Nom Enseigne'}
              </label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => {
                  setStoreName(e.target.value);
                  markDirty();
                }}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">Registre de Commerce (RC)</label>
              <input
                type="text"
                value={rc}
                onChange={(e) => {
                  setRc(e.target.value);
                  markDirty();
                }}
                placeholder="16/00-9876543B20"
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">Identifiant Fiscal (NIF)</label>
              <input
                type="text"
                value={nif}
                onChange={(e) => {
                  setNif(e.target.value);
                  markDirty();
                }}
                placeholder="001916012345678"
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Contact & Coordinates */}
        <div className="space-y-3 pt-4 border-t border-blue-900/40">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <Phone className="w-4 h-4 text-cyan-400" />
            <span>
              {language === 'ar' ? 'معلومات التواصل (الهاتف، واتساب، العنوان)' : 'Coordonnées & Showroom Alger'}
            </span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">
                {language === 'ar' ? 'رقم أو رابط واتساب التجاري' : 'Numéro WhatsApp Commercial (ou lien)'}
              </label>
              <input
                type="text"
                required
                value={whatsapp}
                onChange={(e) => {
                  setWhatsapp(e.target.value);
                  markDirty();
                }}
                placeholder="0557526420"
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
              <span className="text-[10px] text-emerald-400 font-mono mt-1 block truncate" dir="ltr">
                Lien actif: {buildWhatsAppUrl(whatsapp || contactPhone)}
              </span>
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">
                {language === 'ar' ? 'رقم الهاتف للاتصال' : "Téléphone d'appel"}
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => {
                  setContactPhone(e.target.value);
                  markDirty();
                }}
                placeholder="0557526420"
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
              <span className="text-[10px] text-cyan-400 font-mono mt-1 block truncate" dir="ltr">
                Appel direct: {buildTelUrl(contactPhone || whatsapp)}
              </span>
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email de contact'}
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => {
                  setContactEmail(e.target.value);
                  markDirty();
                }}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-slate-300 font-bold block mb-1">
                {language === 'ar' ? 'عنوان المتجر الكامل' : 'Adresse complète du showroom'}
              </label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => {
                  setStoreAddress(e.target.value);
                  markDirty();
                }}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Official Social Media Links */}
        <div className="space-y-3 pt-4 border-t border-blue-900/40">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span>
                {language === 'ar'
                  ? 'روابط شبكات التواصل الاجتماعي (Facebook, Instagram...)'
                  : 'Réseaux Sociaux Officiels (Icônes Officielles SVG)'}
              </span>
            </h4>
            <span className="text-[10px] text-slate-400">
              {language === 'ar'
                ? 'سيتم إخفاء أي أيقونة رابطها فارغ تلقائياً'
                : 'Les icônes sans URL seront masquées automatiquement'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-300 block mb-1">Facebook URL</label>
              <input
                type="text"
                value={facebook}
                onChange={(e) => {
                  setFacebook(e.target.value);
                  markDirty();
                }}
                placeholder="https://facebook.com/..."
                className="w-full bg-[#050A14] text-white rounded-lg px-3 py-2 border border-blue-900/50"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">Instagram URL</label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => {
                  setInstagram(e.target.value);
                  markDirty();
                }}
                placeholder="https://instagram.com/..."
                className="w-full bg-[#050A14] text-white rounded-lg px-3 py-2 border border-blue-900/50"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">TikTok URL</label>
              <input
                type="text"
                value={tiktok}
                onChange={(e) => {
                  setTiktok(e.target.value);
                  markDirty();
                }}
                placeholder="https://tiktok.com/@..."
                className="w-full bg-[#050A14] text-white rounded-lg px-3 py-2 border border-blue-900/50"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">YouTube URL</label>
              <input
                type="text"
                value={youtube}
                onChange={(e) => {
                  setYoutube(e.target.value);
                  markDirty();
                }}
                placeholder="https://youtube.com/@..."
                className="w-full bg-[#050A14] text-white rounded-lg px-3 py-2 border border-blue-900/50"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">LinkedIn URL</label>
              <input
                type="text"
                value={linkedin}
                onChange={(e) => {
                  setLinkedin(e.target.value);
                  markDirty();
                }}
                placeholder="https://linkedin.com/company/..."
                className="w-full bg-[#050A14] text-white rounded-lg px-3 py-2 border border-blue-900/50"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-blue-900/40 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-amber-400 font-semibold">
            {isDirty
              ? language === 'ar'
                ? '● لديك تعديلات غير محفوظة — اضغط على زر الحفظ لتثبيتها'
                : '● Modifications non enregistrées — cliquez sur Enregistrer'
              : ''}
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(0,140,255,0.4)] cursor-pointer disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            <span>
              {isSaving
                ? language === 'ar'
                  ? 'جاري الحفظ...'
                  : 'Enregistrement...'
                : language === 'ar'
                ? 'حفظ جميع التعديلات'
                : 'Enregistrer tous les paramètres'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
};
