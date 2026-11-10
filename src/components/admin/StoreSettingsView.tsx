import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { 
  Save, 
  Phone, 
  Mail, 
  MapPin, 
  Share2, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';

export const StoreSettingsView: React.FC = () => {
  const { settings, updateSettings, resetToDemoCatalog } = useStore();
  const { t } = useLanguage();

  const [storeName, setStoreName] = useState(settings.storeName || 'TOP LAPTOP ALGERIE');
  const [flatFee, setFlatFee] = useState(settings.flatDeliveryFeeDZD);
  const [whatsapp, setWhatsapp] = useState(settings.whatsappNumber);
  const [contactPhone, setContactPhone] = useState(settings.contactPhone);
  const [contactEmail, setContactEmail] = useState(settings.contactEmail);
  const [storeAddress, setStoreAddress] = useState(settings.storeAddress);
  const [rc, setRc] = useState(settings.tradeRegisterRC || '');
  const [nif, setNif] = useState(settings.taxNumberNIF || '');

  // Official Social Media Links (Phase 4)
  const [facebook, setFacebook] = useState(settings.socialLinks.facebook || '');
  const [instagram, setInstagram] = useState(settings.socialLinks.instagram || '');
  const [tiktok, setTiktok] = useState(settings.socialLinks.tiktok || '');
  const [youtube, setYoutube] = useState(settings.socialLinks.youtube || '');
  const [linkedin, setLinkedin] = useState(settings.socialLinks.linkedin || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings({
      storeName: storeName.trim(),
      flatDeliveryFeeDZD: Number(flatFee),
      whatsappNumber: whatsapp.trim(),
      contactPhone: contactPhone.trim(),
      contactEmail: contactEmail.trim(),
      storeAddress: storeAddress.trim(),
      tradeRegisterRC: rc.trim(),
      taxNumberNIF: nif.trim(),
      socialLinks: {
        facebook: facebook.trim(),
        instagram: instagram.trim(),
        tiktok: tiktok.trim(),
        youtube: youtube.trim(),
        linkedin: linkedin.trim(),
        whatsapp: whatsapp.trim()
      }
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-[#080F1C] p-6 rounded-2xl border border-blue-900/40 space-y-6">
        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Paramètres de la boutique enregistrés avec succès !</span>
          </div>
        )}

        {/* Section 1: Store Legal & Identifiers */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <span>Informations Légales & En-tête des Documents (Bon de Livraison)</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Raison Sociale / Nom Enseigne</label>
              <input
                type="text"
                required
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">Registre de Commerce (RC)</label>
              <input
                type="text"
                value={rc}
                onChange={(e) => setRc(e.target.value)}
                placeholder="16/00-9876543B20"
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">Identifiant Fiscal (NIF)</label>
              <input
                type="text"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
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
            <span>Coordonnées & Showroom Alger</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-bold block mb-1">Numéro WhatsApp Commercial</label>
              <input
                type="text"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="+213555123456"
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">Téléphone d'appel</label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full bg-[#050A14] text-white font-mono rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div>
              <label className="text-slate-300 font-bold block mb-1">Email de contact</label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
            <div className="sm:col-span-3">
              <label className="text-slate-300 font-bold block mb-1">Adresse complète du showroom</label>
              <input
                type="text"
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Official Social Media Links (Phase 4) */}
        <div className="space-y-3 pt-4 border-t border-blue-900/40">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span>Réseaux Sociaux Officiels (Icônes Officielles SVG)</span>
            </h4>
            <span className="text-[10px] text-slate-400">
              Les icônes sans URL seront masquées automatiquement
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-300 block mb-1">Facebook URL</label>
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full bg-[#050A14] text-white rounded-lg px-3 py-2 border border-blue-900/50"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">Instagram URL</label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
                className="w-full bg-[#050A14] text-white rounded-lg px-3 py-2 border border-blue-900/50"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">TikTok URL</label>
              <input
                type="url"
                value={tiktok}
                onChange={(e) => setTiktok(e.target.value)}
                placeholder="https://tiktok.com/@..."
                className="w-full bg-[#050A14] text-white rounded-lg px-3 py-2 border border-blue-900/50"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">YouTube URL</label>
              <input
                type="url"
                value={youtube}
                onChange={(e) => setYoutube(e.target.value)}
                placeholder="https://youtube.com/@..."
                className="w-full bg-[#050A14] text-white rounded-lg px-3 py-2 border border-blue-900/50"
              />
            </div>
            <div>
              <label className="text-slate-300 block mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/company/..."
                className="w-full bg-[#050A14] text-white rounded-lg px-3 py-2 border border-blue-900/50"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-blue-900/40 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_20px_rgba(0,140,255,0.4)] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer tous les paramètres</span>
          </button>
        </div>
      </form>
    </div>
  );
};
