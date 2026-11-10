import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { Product, StockMovementType } from '../../types';
import { 
  Boxes, 
  Barcode, 
  AlertTriangle, 
  Plus, 
  Minus, 
  RotateCcw, 
  Search, 
  Printer, 
  History, 
  Check, 
  X 
} from 'lucide-react';

export const InventoryBarcodeView: React.FC = () => {
  const { products, inventoryMovements, recordStockMovement, updateProduct } = useStore();
  const { t } = useLanguage();

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low_stock' | 'out_of_stock'>('all');
  const [selectedProductForLabels, setSelectedProductForLabels] = useState<Product | null>(null);

  // Quick Restock Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState(5);
  const [adjustType, setAdjustType] = useState<StockMovementType>('in_restock');
  const [adjustReason, setAdjustReason] = useState('');

  const filteredProducts = products.filter(p => {
    const normalizeText = (txt: string) =>
      txt
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '');

    const keywords = normalizeText(search).trim().split(/\s+/).filter(Boolean);
    const searchablePool = normalizeText(
      [
        p.name,
        p.brand,
        p.sku,
        p.barcode,
        p.description?.fr,
        p.description?.ar,
        p.processor,
        p.gpu
      ]
        .filter(Boolean)
        .join(' ')
    );

    const matchesSearch = keywords.length === 0 || keywords.every(kw => searchablePool.includes(kw));

    if (!matchesSearch) return false;

    if (filterMode === 'low_stock') {
      return p.stock > 0 && p.stock <= (p.minStockAlert || 3);
    }
    if (filterMode === 'out_of_stock') {
      return p.stock <= 0;
    }
    return true;
  });

  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= (p.minStockAlert || 3)).length;
  const outOfStockCount = products.filter(p => p.stock <= 0).length;

  const handleApplyStockAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;

    const change = adjustType === 'out_sale' || adjustType === 'damaged' ? -Math.abs(adjustQty) : Math.abs(adjustQty);
    const newStock = Math.max(0, adjustingProduct.stock + change);

    recordStockMovement(
      adjustingProduct.id,
      adjustType,
      change,
      adjustReason || `Mouvement manuel (${adjustType})`
    );

    setAdjustingProduct(null);
  };

  // Simple SVG Barcode Generator (Code128 / Code39 style)
  const renderSvgBarcode = (code: string) => {
    return (
      <div className="flex flex-col items-center p-3 bg-white text-black rounded-lg">
        <div className="flex items-center justify-center gap-[2px] h-12 w-48 overflow-hidden">
          {code.split('').map((char, i) => {
            const width = (char.charCodeAt(0) % 3) + 1;
            return (
              <span
                key={i}
                className="bg-black h-full inline-block"
                style={{ width: `${width * 2}px`, marginRight: '1px' }}
              />
            );
          })}
        </div>
        <span className="font-mono text-xs font-bold tracking-widest mt-1">{code}</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Inventory KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setFilterMode('all')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterMode === 'all' ? 'bg-blue-950/60 border-cyan-400' : 'bg-[#080F1C] border-blue-900/40'
          }`}
        >
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Total Références</span>
            <Boxes className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono mt-1">
            {products.length}
          </div>
          <div className="text-[11px] text-cyan-300">Catalogue complet</div>
        </div>

        <div 
          onClick={() => setFilterMode('low_stock')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterMode === 'low_stock' ? 'bg-amber-950/60 border-amber-400' : 'bg-[#080F1C] border-blue-900/40'
          }`}
        >
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Alertes Stock Faible</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono mt-1">
            {lowStockCount}
          </div>
          <div className="text-[11px] text-amber-300">Seuil critique atteint</div>
        </div>

        <div 
          onClick={() => setFilterMode('out_of_stock')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filterMode === 'out_of_stock' ? 'bg-rose-950/60 border-rose-400' : 'bg-[#080F1C] border-blue-900/40'
          }`}
        >
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Ruptures de Stock</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono mt-1">
            {outOfStockCount}
          </div>
          <div className="text-[11px] text-rose-300">Nécessite réapprovisionnement</div>
        </div>
      </div>

      {/* Search & Action Bar */}
      <div className="bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par SKU, Code-barres ou Désignation..."
            className="w-full bg-[#050A14] text-xs sm:text-sm text-white rounded-xl ps-9 pe-3 py-2 border border-blue-900/60 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Affichage de <span className="text-cyan-300 font-bold">{filteredProducts.length}</span> articles
        </div>
      </div>

      {/* Inventory & Barcode Table */}
      <div className="bg-[#080F1C] rounded-2xl border border-blue-900/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#050A14] text-slate-400 font-mono uppercase text-[10px] border-b border-blue-900/40">
              <tr>
                <th className="p-3">Produit</th>
                <th className="p-3">SKU & Code-barres</th>
                <th className="p-3 text-center">En Stock</th>
                <th className="p-3 text-center">Seuil Alerte</th>
                <th className="p-3 text-center">Statut</th>
                <th className="p-3 text-end">Opérations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-900/30">
              {filteredProducts.map(p => {
                const isLow = p.stock > 0 && p.stock <= (p.minStockAlert || 3);
                const isOut = p.stock <= 0;

                return (
                  <tr key={p.id} className="hover:bg-blue-950/20">
                    <td className="p-3">
                      <div className="font-bold text-white text-xs">{p.name}</div>
                      <div className="text-[10px] text-cyan-400 font-mono">{p.brand} • {p.category}</div>
                    </td>

                    <td className="p-3 font-mono">
                      <div className="font-bold text-cyan-300 text-xs">{p.sku}</div>
                      <div className="text-[10px] text-slate-400">{p.barcode || 'Sans code-barres'}</div>
                    </td>

                    <td className="p-3 text-center font-mono font-black text-sm">
                      <span className={`px-2.5 py-1 rounded-lg ${
                        isOut ? 'bg-rose-950 text-rose-300 border border-rose-600' :
                        isLow ? 'bg-amber-950 text-amber-300 border border-amber-500' :
                        'bg-emerald-950 text-emerald-300 border border-emerald-600'
                      }`}>
                        {p.stock}
                      </span>
                    </td>

                    <td className="p-3 text-center font-mono text-slate-400">
                      {p.minStockAlert || 3}
                    </td>

                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isOut ? 'bg-rose-950 text-rose-300' :
                        isLow ? 'bg-amber-950 text-amber-300' :
                        'bg-blue-950 text-blue-300'
                      }`}>
                        {isOut ? 'Rupture' : isLow ? 'Stock Faible' : 'Optimal'}
                      </span>
                    </td>

                    <td className="p-3 text-end">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setAdjustingProduct(p);
                            setAdjustQty(5);
                            setAdjustType('in_restock');
                            setAdjustReason('Réapprovisionnement fournisseur');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-blue-950/80 hover:bg-blue-900 text-cyan-300 hover:text-white font-bold text-[11px] flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Mouvement</span>
                        </button>

                        <button
                          onClick={() => setSelectedProductForLabels(p)}
                          className="p-1.5 rounded-lg bg-blue-950/60 text-slate-300 hover:text-white"
                          title="Imprimer Code-barres"
                        >
                          <Barcode className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stock Movement Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#091122] rounded-3xl border border-blue-500/40 p-6 max-w-md w-full space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-blue-900/40">
              <h4 className="font-bold text-white text-base">
                Mouvement de Stock — {adjustingProduct.name}
              </h4>
              <button
                onClick={() => setAdjustingProduct(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyStockAdjustment} className="space-y-3 text-xs">
              <div className="bg-[#050A14] p-3 rounded-xl border border-blue-900/40 flex justify-between">
                <span className="text-slate-400">Stock actuel :</span>
                <span className="font-bold font-mono text-cyan-300">{adjustingProduct.stock} unités</span>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Type d'opération *</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as StockMovementType)}
                  className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                >
                  <option value="in_restock">Réapprovisionnement Entrant (+)</option>
                  <option value="out_sale">Déduction Manuelle / Vente (-)</option>
                  <option value="return_customer">Retour Client (+)</option>
                  <option value="adjustment">Correction d'Inventaire (+/-)</option>
                  <option value="damaged">Matériel Endommagé (-)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Quantité *</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(Number(e.target.value))}
                  className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60 font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1">Motif / Justification</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="ex: Arrivage cargaison Alger"
                  className="w-full bg-[#050A14] text-white rounded-xl px-3 py-2 border border-blue-900/60"
                />
              </div>

              <div className="pt-3 border-t border-blue-900/40 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-blue-950/60 text-slate-400 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-cyan-500 hover:text-black text-white font-bold"
                >
                  Valider le Mouvement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Barcode Print Label Modal */}
      {selectedProductForLabels && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm print:bg-white print:p-0">
          <div className="bg-[#091122] rounded-3xl border border-blue-500/40 p-6 max-w-md w-full space-y-4 print:bg-white print:border-none print:shadow-none print:text-black">
            <div className="flex justify-between items-center pb-2 border-b border-blue-900/40 print:hidden">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Barcode className="w-5 h-5 text-cyan-400" />
                <span>Étiquette Code-barres</span>
              </h4>
              <button
                onClick={() => setSelectedProductForLabels(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Label Visual */}
            <div className="p-6 bg-white rounded-2xl text-black border border-slate-300 space-y-2 text-center">
              <div className="font-black text-xs tracking-tight uppercase">TOP LAPTOP ALGERIE</div>
              <div className="font-bold text-sm text-slate-900 truncate">{selectedProductForLabels.name}</div>
              <div className="font-mono text-xs text-slate-600 font-semibold">{selectedProductForLabels.sku}</div>
              
              {renderSvgBarcode(selectedProductForLabels.barcode || selectedProductForLabels.sku)}

              <div className="font-mono font-black text-base text-blue-700 pt-1">
                {selectedProductForLabels.priceDZD.toLocaleString('fr-DZ')} DZD
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 print:hidden">
              <button
                onClick={() => setSelectedProductForLabels(null)}
                className="px-4 py-2 rounded-xl bg-blue-950/60 text-slate-400 font-bold text-xs"
              >
                Fermer
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-cyan-500 hover:text-black text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimer l'étiquette</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
