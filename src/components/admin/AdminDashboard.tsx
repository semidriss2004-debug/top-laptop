import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { Product } from '../../types';
import { AnalyticsView } from './AnalyticsView';
import { OrdersManager } from './OrdersManager';
import { DeliveryCompaniesManager } from './DeliveryCompaniesManager';
import { ThemesManagerView } from './ThemesManagerView';
import { EmployeesManagerView } from './EmployeesManagerView';
import { InventoryBarcodeView } from './InventoryBarcodeView';
import { BackupRecoveryView } from './BackupRecoveryView';
import { StoreSettingsView } from './StoreSettingsView';
import { ProductFormModal } from './ProductFormModal';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  Palette, 
  Users, 
  Boxes, 
  Database, 
  Settings, 
  LogOut, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  ArrowLeft,
  DollarSign 
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToStore }) => {
  const { products, currentEmployee, logoutEmployee, deleteProduct, hasPermission } = useStore();
  const { t, language } = useLanguage();
  
  const [activeTab, setActiveTab] = useState<
    'analytics' | 'products' | 'inventory' | 'orders' | 'delivery' | 'themes' | 'employees' | 'backups' | 'settings'
  >('analytics');

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');

  const formatPrice = (price: number) => price.toLocaleString('fr-DZ') + ' ' + t('dzd');
  const canViewFinancials = hasPermission('view_costs_profits');

  const filteredProducts = products.filter(p => {
    const normalizeText = (txt: string) =>
      txt
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[\u064B-\u065F]/g, '');

    const keywords = normalizeText(productSearch).trim().split(/\s+/).filter(Boolean);
    if (keywords.length === 0) return true;

    const searchablePool = normalizeText(
      [
        p.name,
        p.brand,
        p.category,
        p.sku,
        p.barcode,
        p.description?.fr,
        p.description?.ar,
        p.processor,
        p.ram,
        p.storage,
        p.gpu,
        p.screenSize,
        p.digitalDetails?.subcategory,
        p.digitalDetails?.licenseType,
        p.bagDetails?.material,
        p.bagDetails?.color
      ]
        .filter(Boolean)
        .join(' ')
    );

    return keywords.every(kw => searchablePool.includes(kw));
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setProductModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setProductModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Voulez-vous supprimer ce produit du catalogue ?')) {
      deleteProduct(id);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-[#080F1C] border-b border-blue-900/40 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToStore}
              className="p-2 rounded-xl bg-blue-950/60 text-slate-300 hover:text-white border border-blue-900/40 flex items-center gap-1.5 text-xs font-bold transition-all"
            >
              <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span className="hidden sm:inline">Retour Boutique</span>
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h1 className="text-base sm:text-lg font-black text-white font-mono tracking-tight">
                TOP LAPTOP <span className="text-cyan-400">MANAGEMENT</span>
              </h1>
            </div>
          </div>

          {/* Current Employee Badge & Logout */}
          <div className="flex items-center gap-3">
            {currentEmployee && (
              <div className="hidden sm:flex flex-col text-end">
                <span className="text-xs font-bold text-white">{currentEmployee.name}</span>
                <span className="text-[10px] text-cyan-400 font-mono font-semibold">{currentEmployee.role}</span>
              </div>
            )}

            <button
              onClick={() => {
                logoutEmployee();
                onBackToStore();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-xs font-bold transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('logoutBtn')}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-blue-950/60 pt-1 no-scrollbar">
          {[
            { id: 'analytics', label: 'Analyses & Ventes', icon: LayoutDashboard, perm: 'view_analytics' as const },
            { id: 'products', label: `Catalogue (${products.length})`, icon: Package, perm: 'manage_products' as const },
            { id: 'inventory', label: 'Stocks & Codes-barres', icon: Boxes, perm: 'manage_inventory' as const },
            { id: 'orders', label: 'Commandes & BL', icon: ShoppingCart, perm: 'manage_orders' as const },
            { id: 'delivery', label: 'Livraisons (69 Wilayas)', icon: Truck, perm: 'manage_delivery' as const },
            { id: 'themes', label: 'Thèmes Visuels', icon: Palette, perm: 'manage_settings' as const },
            { id: 'employees', label: 'Employés & Audit', icon: Users, perm: 'manage_employees' as const },
            { id: 'backups', label: 'Sauvegardes BD', icon: Database, perm: 'manage_backups' as const },
            { id: 'settings', label: 'Paramètres', icon: Settings, perm: 'manage_settings' as const }
          ].map(tab => {
            const Icon = tab.icon;
            const isAccessible = hasPermission(tab.perm) || currentEmployee?.role === 'SUPER_ADMIN';
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                disabled={!isAccessible}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-cyan-400 text-cyan-400 bg-blue-950/40'
                    : isAccessible
                    ? 'border-transparent text-slate-400 hover:text-slate-200'
                    : 'border-transparent text-slate-600 opacity-40 cursor-not-allowed'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {/* TAB 1: ADVANCED ANALYTICS (Phase 6 & 7) */}
        {activeTab === 'analytics' && <AnalyticsView />}

        {/* TAB 2: PRODUCTS MANAGER (Phase 6, 7, 8, 9) */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Rechercher par nom, SKU, marque..."
                  className="w-full bg-[#050A14] text-xs sm:text-sm text-white rounded-xl ps-9 pe-3 py-2 border border-blue-900/60 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <button
                onClick={handleOpenAdd}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,140,255,0.4)] cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addProductBtn')}</span>
              </button>
            </div>

            {/* Products Table with SKU, Purchase Price, Selling Price & Margins */}
            <div className="bg-[#080F1C] rounded-2xl border border-blue-900/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-[#050A14] text-slate-400 border-b border-blue-900/40 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-3 text-start">Produit & Réf</th>
                      <th className="p-3 text-start">Catégorie</th>
                      {canViewFinancials && <th className="p-3 text-start">Prix Achat</th>}
                      <th className="p-3 text-start">Prix Vente</th>
                      {canViewFinancials && <th className="p-3 text-start">Marge</th>}
                      <th className="p-3 text-start">Stock</th>
                      <th className="p-3 text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-900/30">
                    {filteredProducts.map(p => (
                      <tr key={p.id} className="hover:bg-blue-950/20 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={p.images[0] || ''}
                              alt=""
                              className="w-10 h-10 rounded-lg object-cover bg-black flex-shrink-0 border border-blue-900/40"
                            />
                            <div>
                              <div className="font-bold text-white">{p.name}</div>
                              <div className="text-[10px] text-cyan-400 font-mono">
                                {p.sku} • {p.brand}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 capitalize text-slate-300">
                          {p.category.replace('_', ' ')}
                        </td>

                        {canViewFinancials && (
                          <td className="p-3 font-mono text-slate-400">
                            {formatPrice(p.purchasePriceDZD || 0)}
                          </td>
                        )}

                        <td className="p-3 font-mono font-bold text-white">
                          {formatPrice(p.priceDZD)}
                        </td>

                        {canViewFinancials && (
                          <td className="p-3 font-mono">
                            <span className="text-emerald-400 font-bold">
                              +{formatPrice(p.profitDZD || (p.priceDZD - (p.purchasePriceDZD || 0)))}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-normal">
                              ({p.profitMarginPercent || 0}%)
                            </span>
                          </td>
                        )}

                        <td className="p-3 font-mono">
                          <span className={`px-2 py-0.5 rounded font-bold ${
                            p.stock > 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                          }`}>
                            {p.stock}
                          </span>
                        </td>

                        <td className="p-3 text-end">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900 text-cyan-300 hover:text-white"
                              title="Modifier"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY & BARCODES (Phase 11 & 12) */}
        {activeTab === 'inventory' && <InventoryBarcodeView />}

        {/* TAB 4: ORDERS & BON DE LIVRAISON (Phase 5 & 13) */}
        {activeTab === 'orders' && <OrdersManager />}

        {/* TAB 5: DELIVERY COMPANIES & 69 WILAYAS (Phase 2 & 4) */}
        {activeTab === 'delivery' && <DeliveryCompaniesManager />}

        {/* TAB 6: THEMES & BRAND IDENTITY (Phase 1 & 2) */}
        {activeTab === 'themes' && <ThemesManagerView />}

        {/* TAB 7: EMPLOYEES & RBAC & AUDIT LOG (Phase 10 & 14) */}
        {activeTab === 'employees' && <EmployeesManagerView />}

        {/* TAB 8: DATABASE BACKUP & RECOVERY (Phase 15) */}
        {activeTab === 'backups' && <BackupRecoveryView />}

        {/* TAB 9: SETTINGS & SOCIAL ICONS (Phase 4) */}
        {activeTab === 'settings' && <StoreSettingsView />}
      </main>

      {/* Product Form Modal (Add / Edit) */}
      <ProductFormModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        productToEdit={editingProduct}
      />
    </div>
  );
};
