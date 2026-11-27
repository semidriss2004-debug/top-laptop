import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useLanguage } from '../../context/LanguageContext';
import { CommercialDocType, CustomerRecord, Product } from '../../types';
import { persistStoreBatch } from '../../services/storage';
import { AnalyticsView } from './AnalyticsView';
import { OrdersManager } from './OrdersManager';
import { CustomersManagerView } from './CustomersManagerView';
import { DocumentsManagerView } from './documents/DocumentsManagerView';
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
  FileText,
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
  CloudCheck,
  RefreshCw,
  Languages,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Receipt,
  Wallet,
  Building2
} from 'lucide-react';

interface AdminDashboardProps {
  onBackToStore: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBackToStore }) => {
  const {
    products,
    orders,
    wilayas,
    deliveryCompanies,
    employees,
    inventoryMovements,
    settings,
    currentEmployee,
    logoutEmployee,
    deleteProduct,
    commercialDocuments,
    documentSettings,
    customers,
    hasPermission,
    refreshFromCloud,
  } = useStore();
  const { t, language, toggleLanguage } = useLanguage();
  
  type AdminTabId =
    | 'products'
    | 'orders'
    | 'customers'
    | 'documents'
    | 'analytics'
    | 'inventory'
    | 'delivery'
    | 'themes'
    | 'employees'
    | 'backups'
    | 'settings';

  const canAccessDocuments =
    currentEmployee?.role === 'SUPER_ADMIN' ||
    hasPermission('view_documents') ||
    hasPermission('issue_bl') ||
    hasPermission('issue_proforma') ||
    hasPermission('issue_facture') ||
    hasPermission('issue_receipt');

  const [activeTab, setActiveTab] = useState<AdminTabId>(() => {
    if (currentEmployee?.role === 'SUPER_ADMIN' || hasPermission('manage_products')) return 'products';
    if (hasPermission('manage_orders')) return 'orders';
    if (canAccessDocuments) return 'documents';
    if (hasPermission('view_analytics')) return 'analytics';
    if (hasPermission('manage_delivery')) return 'delivery';
    return 'products';
  });

  const [pendingOrderForDoc, setPendingOrderForDoc] = useState<{
    orderId: string;
    type: CommercialDocType;
  } | null>(null);

  const [pendingCustomerForDoc, setPendingCustomerForDoc] = useState<{
    customer: CustomerRecord;
    type: CommercialDocType;
  } | null>(null);

  const [docSubTab, setDocSubTab] = useState<CommercialDocType | 'settings'>(() => {
    if (currentEmployee?.role === 'SUPER_ADMIN' || hasPermission('issue_bl')) return 'bl';
    if (hasPermission('issue_proforma')) return 'proforma';
    if (hasPermission('issue_facture')) return 'facture';
    if (hasPermission('issue_receipt')) return 'receipt';
    return 'settings';
  });

  const [documentsMenuOpen, setDocumentsMenuOpen] = useState<boolean>(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  React.useEffect(() => {
    refreshFromCloud().catch(() => {});
  }, [activeTab, refreshFromCloud]);

  const newOrdersCount = orders.filter(o => o.status === 'new').length;

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const formatPrice = (price: number) => price.toLocaleString('fr-DZ') + ' ' + t('dzd');
  const canViewFinancials = hasPermission('view_costs_profits');

  const handleManualCloudSync = async () => {
    setIsSyncing(true);
    persistStoreBatch({
      products,
      orders,
      wilayas,
      deliveryCompanies,
      employees,
      inventoryMovements,
      settings,
      commercialDocuments,
      documentSettings,
    });
    await refreshFromCloud().catch(() => {});
    setIsSyncing(false);
    setSyncSuccess(true);
    setTimeout(() => setSyncSuccess(false), 2500);
  };

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
    const msg =
      language === 'ar'
        ? 'هل تريد حذف هذا المنتج نهائياً من الكتالوج؟'
        : 'Voulez-vous supprimer ce produit du catalogue ?';
    if (window.confirm(msg)) {
      deleteProduct(id);
    }
  };

  const docSubItems = [
    {
      id: 'bl' as const,
      label: language === 'ar' ? 'وصل تسليم (BL)' : 'Bon de livraison',
      icon: Truck,
      allowed: currentEmployee?.role === 'SUPER_ADMIN' || hasPermission('issue_bl'),
      count: commercialDocuments.filter((d) => d.type === 'bl').length,
    },
    {
      id: 'proforma' as const,
      label: language === 'ar' ? 'فاتورة أولية (Proforma)' : 'Facture proforma',
      icon: FileText,
      allowed: currentEmployee?.role === 'SUPER_ADMIN' || hasPermission('issue_proforma'),
      count: commercialDocuments.filter((d) => d.type === 'proforma').length,
    },
    {
      id: 'facture' as const,
      label: language === 'ar' ? 'الفاتورة الرسمية' : 'Facture',
      icon: Receipt,
      allowed: currentEmployee?.role === 'SUPER_ADMIN' || hasPermission('issue_facture'),
      count: commercialDocuments.filter((d) => d.type === 'facture').length,
    },
    {
      id: 'receipt' as const,
      label: language === 'ar' ? 'وصل الدفع' : 'Reçu de paiement',
      icon: Wallet,
      allowed: currentEmployee?.role === 'SUPER_ADMIN' || hasPermission('issue_receipt'),
      count: commercialDocuments.filter((d) => d.type === 'receipt').length,
    },
    {
      id: 'settings' as const,
      label: language === 'ar' ? 'إعدادات المستندات' : 'Paramètres Docs',
      icon: Settings,
      allowed: currentEmployee?.role === 'SUPER_ADMIN' || hasPermission('manage_document_settings'),
      count: null,
    },
  ].filter((sub) => sub.allowed);

  const sidebarItems = [
    {
      id: 'products' as const,
      label: language === 'ar' ? `المنتجات (${products.length})` : `Catalogue (${products.length})`,
      icon: Package,
      perm: 'manage_products' as const
    },
    {
      id: 'orders' as const,
      label:
        language === 'ar'
          ? `الطلبيات (${orders.length})${newOrdersCount > 0 ? ` • ${newOrdersCount} جديد` : ''}`
          : `Commandes (${orders.length})${newOrdersCount > 0 ? ` • ${newOrdersCount} nouv.` : ''}`,
      icon: ShoppingCart,
      perm: 'manage_orders' as const
    },
    {
      id: 'customers' as const,
      label:
        language === 'ar'
          ? `قاعدة بيانات الزبائن (${customers.length})`
          : `Clients B2B (${customers.length})`,
      icon: Building2,
      perm: 'manage_customers' as const
    },
    {
      id: 'documents' as const,
      label:
        language === 'ar'
          ? `المستندات (${commercialDocuments.length})`
          : `Documents (${commercialDocuments.length})`,
      icon: FileText,
      perm: 'view_documents' as const
    },
    {
      id: 'analytics' as const,
      label: language === 'ar' ? 'الإحصائيات والأرباح' : 'Analyses & Ventes',
      icon: LayoutDashboard,
      perm: 'view_analytics' as const
    },
    {
      id: 'inventory' as const,
      label: language === 'ar' ? 'المخزون والباركود' : 'Stocks & Codes-barres',
      icon: Boxes,
      perm: 'manage_inventory' as const
    },
    {
      id: 'delivery' as const,
      label: language === 'ar' ? 'التوصيل (69 ولاية)' : 'Livraisons (69 Wilayas)',
      icon: Truck,
      perm: 'manage_delivery' as const
    },
    {
      id: 'settings' as const,
      label: language === 'ar' ? 'إعدادات المتجر' : 'Paramètres',
      icon: Settings,
      perm: 'manage_settings' as const
    },
    {
      id: 'themes' as const,
      label: language === 'ar' ? 'المظهر والألوان' : 'Thèmes Visuels',
      icon: Palette,
      perm: 'manage_settings' as const
    },
    {
      id: 'employees' as const,
      label: language === 'ar' ? 'الموظفون والسجل' : 'Employés & Audit',
      icon: Users,
      perm: 'manage_employees' as const
    },
    {
      id: 'backups' as const,
      label: language === 'ar' ? 'النسخ الاحتياطي' : 'Sauvegardes BD',
      icon: Database,
      perm: 'manage_backups' as const
    }
  ];

  const renderSidebarNav = () => (
    <nav className="p-3 space-y-1">
      {sidebarItems.map((tab) => {
        const Icon = tab.icon;
        const isAccessible =
          tab.id === 'documents'
            ? canAccessDocuments
            : hasPermission(tab.perm) || currentEmployee?.role === 'SUPER_ADMIN';
        const isActive = activeTab === tab.id;
        const isDocuments = tab.id === 'documents';

        return (
          <div key={tab.id} className="space-y-1">
            <button
              type="button"
              disabled={!isAccessible}
              onClick={() => {
                if (isDocuments) {
                  if (activeTab === 'documents') {
                    setDocumentsMenuOpen((o) => !o);
                  } else {
                    setActiveTab('documents');
                    setDocumentsMenuOpen(true);
                  }
                } else {
                  setActiveTab(tab.id);
                  setMobileSidebarOpen(false);
                }
              }}
              className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,212,255,0.15)]'
                  : isAccessible
                  ? 'text-slate-400 hover:text-white hover:bg-blue-950/50 border border-transparent'
                  : 'text-slate-600 opacity-40 cursor-not-allowed border border-transparent'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">{tab.label}</span>
              </span>
              {isDocuments && isAccessible && (
                documentsMenuOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-cyan-400" />
                ) : (
                  <ChevronRight className={`w-3.5 h-3.5 flex-shrink-0 ${language === 'ar' ? 'rotate-180' : ''}`} />
                )
              )}
            </button>

            {/* Sub-menu for Documents */}
            {isDocuments && isAccessible && documentsMenuOpen && docSubItems.length > 0 && (
              <div className="ms-3 ps-2.5 border-s border-blue-900/50 space-y-0.5 py-0.5">
                {docSubItems.map((sub) => {
                  const SubIcon = sub.icon;
                  const subActive = activeTab === 'documents' && docSubTab === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => {
                        setActiveTab('documents');
                        setDocSubTab(sub.id);
                        setMobileSidebarOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                        subActive
                          ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-blue-950/40 border border-transparent'
                      }`}
                    >
                      <span className="flex items-center gap-2 min-w-0">
                        <SubIcon className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{sub.label}</span>
                      </span>
                      {sub.count !== null && (
                        <span className="text-[10px] font-mono px-1.5 rounded bg-[#050A14] text-slate-400">
                          {sub.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-[#050505] text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="bg-[#080F1C] border-b border-blue-900/40 sticky top-0 z-30 shadow-lg">
        <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Sidebar Toggle */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen((v) => !v)}
              className="lg:hidden p-2 rounded-xl bg-blue-950/60 text-cyan-300 hover:text-white border border-blue-900/40 cursor-pointer"
              aria-label="Menu Admin"
            >
              {mobileSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <button
              onClick={onBackToStore}
              className="p-2 rounded-xl bg-blue-950/60 text-slate-300 hover:text-white border border-blue-900/40 flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer"
            >
              <ArrowLeft className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span className="hidden sm:inline">
                {language === 'ar' ? 'العودة للمتجر' : 'Retour Boutique'}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
              <h1 className="text-sm sm:text-lg font-black text-white font-mono tracking-tight">
                TOP LAPTOP <span className="text-cyan-400">ADMIN</span>
              </h1>
            </div>
          </div>

          {/* Cloud Sync Button, Language Switcher, Employee Badge & Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleManualCloudSync}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                syncSuccess
                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300'
                  : 'bg-cyan-950/50 hover:bg-cyan-900/60 border-cyan-500/40 text-cyan-300'
              }`}
              title={language === 'ar' ? 'حفظ ومزامنة مع السحابة الآن' : 'Synchroniser avec le Cloud'}
            >
              {isSyncing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CloudCheck className="w-3.5 h-3.5" />
              )}
              <span className="hidden md:inline">
                {syncSuccess
                  ? language === 'ar'
                    ? 'تم الحفظ في السحابة ✓'
                    : 'Synchronisé ✓'
                  : language === 'ar'
                  ? 'حفظ ومزامنة السحابة'
                  : 'Sync Cloud'}
              </span>
            </button>

            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1.5 rounded-xl bg-[#0F1B33] border border-blue-800/40 text-xs font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
            >
              <Languages className="w-3.5 h-3.5 text-cyan-400" />
              <span>{language === 'fr' ? 'العربية' : 'FR'}</span>
            </button>

            {currentEmployee && (
              <div className="hidden lg:flex flex-col text-end">
                <span className="text-xs font-bold text-white">{currentEmployee.name}</span>
                <span className="text-[10px] text-cyan-400 font-mono font-semibold">{currentEmployee.role}</span>
              </div>
            )}

            <button
              onClick={() => {
                logoutEmployee();
                onBackToStore();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 hover:bg-rose-900/60 text-xs font-bold transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('logoutBtn')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard Shell: Responsive Left/Right Sidebar + Main Content */}
      <div className="flex-1 flex relative">
        {/* Desktop Persistent Sidebar */}
        <aside className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 bg-[#080F1C] border-e border-blue-900/40 sticky top-[57px] h-[calc(100vh-57px)] overflow-y-auto">
          <div className="px-4 pt-4 pb-2 text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
            {language === 'ar' ? 'القائمة الإدارية' : 'Navigation Admin'}
          </div>
          {renderSidebarNav()}
        </aside>

        {/* Mobile Drawer Sidebar */}
        {mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className="lg:hidden fixed inset-0 z-40 bg-black/75 backdrop-blur-xs flex"
          >
            <aside
              onClick={(e) => e.stopPropagation()}
              className="w-72 max-w-[82vw] h-full bg-[#080F1C] border-e border-blue-900/50 overflow-y-auto shadow-2xl"
            >
              <div className="p-4 border-b border-blue-900/40 flex items-center justify-between">
                <span className="font-mono font-black text-sm text-white">
                  TOP LAPTOP <span className="text-cyan-400">MENU</span>
                </span>
                <button
                  type="button"
                  onClick={() => setMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg bg-blue-950/60 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {renderSidebarNav()}
            </aside>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {activeTab === 'analytics' && <AnalyticsView />}

        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#080F1C] p-4 rounded-2xl border border-blue-900/40">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder={
                    language === 'ar'
                      ? 'ابحث بالاسم، الرمز SKU، العلامة...'
                      : 'Rechercher par nom, SKU, marque...'
                  }
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

            {/* Products Table */}
            <div className="bg-[#080F1C] rounded-2xl border border-blue-900/40 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs">
                  <thead className="bg-[#050A14] text-slate-400 border-b border-blue-900/40 font-mono uppercase text-[10px]">
                    <tr>
                      <th className="p-3 text-start">{language === 'ar' ? 'المنتج والمرجع' : 'Produit & Réf'}</th>
                      <th className="p-3 text-start">{language === 'ar' ? 'الفئة' : 'Catégorie'}</th>
                      {canViewFinancials && (
                        <th className="p-3 text-start">{language === 'ar' ? 'سعر الشراء' : 'Prix Achat'}</th>
                      )}
                      <th className="p-3 text-start">{language === 'ar' ? 'سعر البيع' : 'Prix Vente'}</th>
                      {canViewFinancials && (
                        <th className="p-3 text-start">{language === 'ar' ? 'الربح الصافي' : 'Marge'}</th>
                      )}
                      <th className="p-3 text-start">{language === 'ar' ? 'المخزون' : 'Stock'}</th>
                      <th className="p-3 text-end">{language === 'ar' ? 'تعديل / حذف' : 'Actions'}</th>
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
                              className="w-11 h-11 rounded-lg object-cover bg-black flex-shrink-0 border border-blue-900/40"
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
                              className="px-2.5 py-1.5 rounded-lg bg-blue-950/60 hover:bg-blue-900 text-cyan-300 hover:text-white flex items-center gap-1 cursor-pointer"
                              title={language === 'ar' ? 'تعديل' : 'Modifier'}
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{language === 'ar' ? 'تعديل' : 'Modifier'}</span>
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white cursor-pointer"
                              title={language === 'ar' ? 'حذف' : 'Supprimer'}
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

        {activeTab === 'inventory' && <InventoryBarcodeView />}
        {activeTab === 'orders' && (
          <OrdersManager
            onCreateCommercialDoc={(orderId, type) => {
              setPendingCustomerForDoc(null);
              setPendingOrderForDoc({ orderId, type });
              setDocSubTab(type);
              setDocumentsMenuOpen(true);
              setActiveTab('documents');
            }}
          />
        )}
        {activeTab === 'customers' && (
          <CustomersManagerView
            onCreateDocForCustomer={(customer, type) => {
              setPendingOrderForDoc(null);
              setPendingCustomerForDoc({ customer, type });
              setDocSubTab(type);
              setDocumentsMenuOpen(true);
              setActiveTab('documents');
            }}
          />
        )}
        {activeTab === 'documents' && (
          <DocumentsManagerView
            initialOrderForDoc={pendingOrderForDoc}
            onClearInitialOrder={() => setPendingOrderForDoc(null)}
            initialCustomerForDoc={pendingCustomerForDoc}
            onClearInitialCustomer={() => setPendingCustomerForDoc(null)}
            controlledSubTab={docSubTab}
            onSubTabChange={setDocSubTab}
          />
        )}
        {activeTab === 'delivery' && <DeliveryCompaniesManager />}
        {activeTab === 'themes' && <ThemesManagerView />}
        {activeTab === 'employees' && <EmployeesManagerView />}
        {activeTab === 'backups' && <BackupRecoveryView />}
        {activeTab === 'settings' && <StoreSettingsView />}
        </main>
      </div>

      {/* Product Form Modal (Add / Edit) */}
      <ProductFormModal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        productToEdit={editingProduct}
      />
    </div>
  );
};
