import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { DeliveryCompany, Wilaya } from '../../types';
import { 
  Truck, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  MapPin, 
  Save, 
  Phone, 
  Globe, 
  AlertCircle 
} from 'lucide-react';

export const DeliveryCompaniesManager: React.FC = () => {
  const { deliveryCompanies, wilayas, addDeliveryCompany, updateDeliveryCompany, deleteDeliveryCompany, updateWilayaDeliveryPrice } = useStore();
  const { t, language } = useLanguage();

  const [isEditingCompany, setIsEditingCompany] = useState<DeliveryCompany | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedCompanyForPricingId, setSelectedCompanyForPricingId] = useState<string | null>(null);
  const selectedCompanyForPricing = deliveryCompanies.find(c => c.id === selectedCompanyForPricingId) || null;

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [priority, setPriority] = useState(1);
  const [supportsHome, setSupportsHome] = useState(true);
  const [supportsDesk, setSupportsDesk] = useState(true);
  const [trackingTemplate, setTrackingTemplate] = useState('');

  const handleOpenCreate = () => {
    setName('');
    setPhone('');
    setWebsite('');
    setPriority(deliveryCompanies.length + 1);
    setSupportsHome(true);
    setSupportsDesk(true);
    setTrackingTemplate('');
    setIsCreating(true);
    setIsEditingCompany(null);
  };

  const handleOpenEdit = (comp: DeliveryCompany) => {
    setIsEditingCompany(comp);
    setName(comp.name);
    setPhone(comp.phone);
    setWebsite(comp.website || '');
    setPriority(comp.priority);
    setSupportsHome(comp.supportsHomeDelivery);
    setSupportsDesk(comp.supportsStopDesk);
    setTrackingTemplate(comp.trackingUrlTemplate || '');
    setIsCreating(false);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) {
      // Generate default pricing map
      const defaultPricing: Record<number, { homePriceDZD: number; stopDeskPriceDZD: number; isSupported: boolean }> = {};
      wilayas.forEach(w => {
        defaultPricing[w.code] = { homePriceDZD: 800, stopDeskPriceDZD: 500, isSupported: true };
      });

      addDeliveryCompany({
        name,
        phone,
        website,
        priority: Number(priority),
        supportsHomeDelivery: supportsHome,
        supportsStopDesk: supportsDesk,
        trackingUrlTemplate: trackingTemplate,
        isActive: true,
        wilayaPricing: defaultPricing
      });
      setIsCreating(false);
    } else if (isEditingCompany) {
      updateDeliveryCompany(isEditingCompany.id, {
        name,
        phone,
        website,
        priority: Number(priority),
        supportsHomeDelivery: supportsHome,
        supportsStopDesk: supportsDesk,
        trackingUrlTemplate: trackingTemplate
      });
      setIsEditingCompany(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Truck className="w-5 h-5 text-cyan-400" />
            <span>Gestion des Sociétés de Livraison (69 Wilayas)</span>
          </h3>
          <p className="text-xs text-slate-400">
            Configurez les prestataires (Yalidine, ZR Express...), tarifs domicile/relais et couverture par wilaya.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,140,255,0.4)] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Transporteur</span>
        </button>
      </div>

      {/* Companies Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deliveryCompanies.map(comp => (
          <div
            key={comp.id}
            className={`bg-[#080F1C] p-5 rounded-2xl border transition-all ${
              comp.isActive ? 'border-blue-900/40 hover:border-cyan-400/60' : 'border-rose-950/50 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-950 flex items-center justify-center text-cyan-400 font-bold border border-blue-800">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">{comp.name}</h4>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400">
                    <span className="font-mono">Priorité #{comp.priority}</span>
                    <span>•</span>
                    <span className={comp.isActive ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                      {comp.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Toggle Active Button */}
              <button
                onClick={() => updateDeliveryCompany(comp.id, { isActive: !comp.isActive })}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                  comp.isActive 
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-600' 
                    : 'bg-rose-950 text-rose-300 border-rose-600'
                }`}
              >
                {comp.isActive ? 'Désactiver' : 'Activer'}
              </button>
            </div>

            <div className="my-4 space-y-1.5 text-xs text-slate-300 pt-2 border-t border-blue-950">
              <div className="flex items-center gap-2 text-slate-400">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>{comp.phone || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Livraison à domicile :</span>
                <span className="font-bold text-white">{comp.supportsHomeDelivery ? 'Oui' : 'Non'}</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Point Relais (Stop Desk) :</span>
                <span className="font-bold text-white">{comp.supportsStopDesk ? 'Oui' : 'Non'}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-blue-900/30">
              <button
                onClick={() => setSelectedCompanyForPricingId(comp.id)}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Tarifs 69 Wilayas</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleOpenEdit(comp)}
                  className="p-1.5 rounded-lg bg-blue-950/60 text-slate-300 hover:text-white"
                  title="Modifier informations"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Supprimer ${comp.name} ?`)) {
                      deleteDeliveryCompany(comp.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-rose-950/40 text-rose-300 hover:text-white"
                  title="Supprimer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add or Edit Company Details */}
      {(isCreating || isEditingCompany) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#091122] rounded-3xl border border-blue-500/40 p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-blue-900/40">
              <h4 className="font-bold text-white text-base">
                {isCreating ? 'Ajouter une Société de Livraison' : 'Modifier la Société'}
              </h4>
              <button
                onClick={() => { setIsCreating(false); setIsEditingCompany(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1">Nom de la société *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: ZR Express"
                  className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Téléphone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0555..."
                    className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Priorité (1 = max)</label>
                  <input
                    type="number"
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Modèle de lien de tracking URL</label>
                <input
                  type="text"
                  value={trackingTemplate}
                  onChange={(e) => setTrackingTemplate(e.target.value)}
                  placeholder="https://yalidine.com/tracking/?id={TRACKING}"
                  className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60 font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={supportsHome}
                    onChange={(e) => setSupportsHome(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Prend en charge la livraison à domicile</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={supportsDesk}
                    onChange={(e) => setSupportsDesk(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span>Prend en charge le retrait Point Relais (Stop Desk)</span>
                </label>
              </div>

              <div className="pt-3 border-t border-blue-900/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setIsEditingCompany(null); }}
                  className="px-4 py-2 rounded-xl bg-blue-950/60 text-slate-400 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-cyan-500 hover:text-black text-white font-bold"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Per-Wilaya Pricing & Coverage Editor (69 Wilayas) */}
      {selectedCompanyForPricing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm">
          <div className="bg-[#091122] rounded-3xl border border-cyan-500/40 p-6 max-w-4xl w-full max-h-[90vh] flex flex-col space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-blue-900/40">
              <div>
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-cyan-400" />
                  <span>Tarification des 69 Wilayas — {selectedCompanyForPricing.name}</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Réglez le prix à domicile, prix Stop Desk et l'état de couverture de chaque wilaya indépendamment.
                </p>
              </div>
              <button
                onClick={() => setSelectedCompanyForPricingId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wilayas Pricing Table */}
            <div className="flex-1 overflow-y-auto space-y-2 pe-1">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#050A14] text-slate-400 font-mono uppercase text-[10px] sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5">Wilaya</th>
                    <th className="p-2.5">Couverture</th>
                    <th className="p-2.5">Prix Domicile (DZD)</th>
                    <th className="p-2.5">Prix Stop Desk (DZD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/30">
                  {wilayas.map(w => {
                    const pricing = selectedCompanyForPricing.wilayaPricing[w.code] || {
                      homePriceDZD: 800,
                      stopDeskPriceDZD: 500,
                      isSupported: true
                    };

                    return (
                      <tr key={w.code} className="hover:bg-blue-950/20">
                        <td className="p-2.5 font-bold text-white">
                          {language === 'ar' ? w.nameAr : w.nameFr}
                        </td>
                        <td className="p-2.5">
                          <button
                            onClick={() =>
                              updateWilayaDeliveryPrice(
                                selectedCompanyForPricing.id,
                                w.code,
                                pricing.homePriceDZD,
                                pricing.stopDeskPriceDZD,
                                !pricing.isSupported
                              )
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              pricing.isSupported
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {pricing.isSupported ? 'Disponible' : 'Non desservie'}
                          </button>
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            value={pricing.homePriceDZD}
                            onChange={(e) =>
                              updateWilayaDeliveryPrice(
                                selectedCompanyForPricing.id,
                                w.code,
                                Number(e.target.value),
                                pricing.stopDeskPriceDZD,
                                pricing.isSupported
                              )
                            }
                            className="w-24 bg-[#050A14] text-white px-2 py-1 rounded border border-blue-900/60 font-mono text-xs"
                          />
                        </td>
                        <td className="p-2.5">
                          <input
                            type="number"
                            value={pricing.stopDeskPriceDZD}
                            onChange={(e) =>
                              updateWilayaDeliveryPrice(
                                selectedCompanyForPricing.id,
                                w.code,
                                pricing.homePriceDZD,
                                Number(e.target.value),
                                pricing.isSupported
                              )
                            }
                            className="w-24 bg-[#050A14] text-white px-2 py-1 rounded border border-blue-900/60 font-mono text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-blue-900/40 flex justify-end">
              <button
                onClick={() => setSelectedCompanyForPricingId(null)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs"
              >
                Fermer & Appliquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
