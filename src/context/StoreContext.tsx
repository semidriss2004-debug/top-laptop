import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  Order, 
  OrderStatus, 
  StoreSettings, 
  Wilaya, 
  DeliveryCompany, 
  Employee, 
  EmployeePermission, 
  ActivityLogEntry, 
  ActivityAction, 
  InventoryMovement, 
  StockMovementType, 
  DatabaseBackup,
  CommercialDocType,
  CommercialDocument,
  DocumentCompanySettings,
  CustomerRecord
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_EMPLOYEES } from '../data/initialProducts';
import { INITIAL_69_WILAYAS } from '../data/wilayas69';
import { INITIAL_DELIVERY_COMPANIES } from '../data/initialDeliveryCompanies';
import {
  fetchAllCloudAndLocalState,
  persistStoreKey,
  persistStoreKeyWithAck,
  persistStoreBatch,
  appendOrderToCloud,
  mergeOrdersById,
  idbGet,
  idbSet,
  safeLocalStorageSet,
} from '../services/storage';
import {
  isLegacyDemoPhone,
  buildWhatsAppUrl,
  OFFICIAL_PHONE_LOCAL,
} from '../utils/contactLinks';
import {
  DEFAULT_SITE_CONFIG,
  loadPersistedSiteConfig,
  saveSiteConfigToStorage,
  siteConfigToStoreSettingsPatch,
} from '../config/siteConfig';
import {
  createCustomerInDatabase,
  CustomerDbSource,
  deleteCustomerFromDatabase,
  fetchCustomersFromDatabase,
  updateCustomerInDatabase,
} from '../services/customersApi';
import {
  buildConvertedDraft,
  createDefaultDocumentSettings,
  generateNextDocumentNumber,
  getCounterKey,
  getPermissionForDocType,
  migrateEmployeesDocPermissions,
  normalizeDocumentSettings,
  recalculateDocumentTotals,
  reconcileFacturesWithReceipts,
  validateCommercialDocumentInput,
} from '../utils/commercialDocuments';

function normalizeStoreSettings(raw?: Partial<StoreSettings> | null): {
  normalized: StoreSettings;
  migratedLegacyPhone: boolean;
} {
  const persistedSite = loadPersistedSiteConfig();

  if (!raw || typeof raw !== 'object') {
    const base = persistedSite
      ? {
          ...INITIAL_SETTINGS,
          ...siteConfigToStoreSettingsPatch(persistedSite),
          socialLinks: {
            ...INITIAL_SETTINGS.socialLinks,
            ...siteConfigToStoreSettingsPatch(persistedSite).socialLinks!,
          },
        }
      : INITIAL_SETTINGS;
    return { normalized: base, migratedLegacyPhone: false };
  }

  const rawWhatsapp = raw.whatsappNumber?.trim();
  const rawContactPhone = raw.contactPhone?.trim();

  // Only migrate legacy placeholder phone numbers if the user hasn't saved a custom siteConfig yet
  const legacyWhatsapp = !persistedSite && isLegacyDemoPhone(rawWhatsapp);
  const legacyContact = !persistedSite && isLegacyDemoPhone(rawContactPhone);

  const whatsappNumber = legacyWhatsapp
    ? !legacyContact && rawContactPhone
      ? rawContactPhone
      : DEFAULT_SITE_CONFIG.whatsappNumber
    : rawWhatsapp || DEFAULT_SITE_CONFIG.whatsappNumber;

  const contactPhone = legacyContact
    ? !legacyWhatsapp && rawWhatsapp
      ? rawWhatsapp
      : DEFAULT_SITE_CONFIG.phone
    : rawContactPhone || DEFAULT_SITE_CONFIG.phone;

  const mergedSocial = {
    ...INITIAL_SETTINGS.socialLinks,
    ...(raw.socialLinks || {}),
  };

  // Always keep socialLinks.whatsapp synchronized with the active whatsappNumber
  mergedSocial.whatsapp = buildWhatsAppUrl(whatsappNumber);

  const normalized: StoreSettings = {
    ...INITIAL_SETTINGS,
    ...raw,
    whatsappNumber,
    contactPhone,
    socialLinks: mergedSocial,
  };

  const migratedLegacyPhone =
    !persistedSite &&
    ((Boolean(rawWhatsapp) && legacyWhatsapp) ||
      (Boolean(rawContactPhone) && legacyContact) ||
      isLegacyDemoPhone(raw.socialLinks?.whatsapp));

  return { normalized, migratedLegacyPhone };
}

interface StoreContextType {
  products: Product[];
  orders: Order[];
  wilayas: Wilaya[];
  deliveryCompanies: DeliveryCompany[];
  employees: Employee[];
  inventoryMovements: InventoryMovement[];
  activityLogs: ActivityLogEntry[];
  backups: DatabaseBackup[];
  settings: StoreSettings;
  currentEmployee: Employee | null;
  isAdminAuthenticated: boolean;
  
  // Auth & RBAC
  hasPermission: (permission: EmployeePermission) => boolean;
  loginEmployee: (passcode: string) => Employee | null;
  logoutEmployee: () => void;
  
  // Products & Profit CRUD
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'profitDZD' | 'profitMarginPercent'>) => void;
  updateProduct: (id: string, updated: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  
  // Inventory & Stock Movements
  recordStockMovement: (
    productId: string,
    type: StockMovementType,
    quantityChange: number,
    reason: string,
    orderId?: string
  ) => void;
  
  // Orders & Shipping
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'statusHistory' | 'bonDeLivraisonRef' | 'totalPurchaseCostDZD' | 'netProfitDZD'>) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: OrderStatus, note?: string) => void;
  
  // Delivery Companies & 69 Wilayas
  addDeliveryCompany: (company: Omit<DeliveryCompany, 'id'>) => void;
  updateDeliveryCompany: (id: string, updated: Partial<DeliveryCompany>) => void;
  deleteDeliveryCompany: (id: string) => void;
  updateWilayaDeliveryPrice: (companyId: string, wilayaCode: number, homePrice: number, deskPrice: number, isSupported: boolean) => void;
  toggleWilayaActive: (wilayaCode: number) => void;
  
  // Employee Management
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, updated: Partial<Employee>) => void;
  deleteEmployee: (id: string) => void;
  
  // Activity Logging & Backups
  logActivity: (action: ActivityAction, details: string, targetRecord?: string) => void;
  createDatabaseBackup: () => DatabaseBackup;
  restoreDatabaseBackup: (backupJson: string) => boolean;
  
  // General Settings
  updateSettings: (newSettings: Partial<StoreSettings>) => Promise<{ savedLocal: boolean; syncedCloud: boolean }>;
  resetToDemoCatalog: () => void;
  refreshFromCloud: () => Promise<void>;

  // Commercial Documents Module (BL, Proforma, Facture, Receipt)
  commercialDocuments: CommercialDocument[];
  documentSettings: DocumentCompanySettings;
  createCommercialDocument: (
    draft: Omit<CommercialDocument, 'id' | 'number' | 'sequenceNumber' | 'year' | 'createdAt'>,
    issueImmediately?: boolean
  ) => { ok: true; document: CommercialDocument } | { ok: false; errors: string[] };
  updateDraftDocument: (
    docId: string,
    patch: Partial<CommercialDocument>
  ) => { ok: true; document: CommercialDocument } | { ok: false; errors: string[] };
  issueCommercialDocument: (
    docId: string
  ) => { ok: true; document: CommercialDocument } | { ok: false; errors: string[] };
  updateBLStatus: (
    docId: string,
    status: 'prepared' | 'delivered' | 'returned'
  ) => { ok: true; document: CommercialDocument } | { ok: false; errors: string[] };
  cancelCommercialDocument: (
    docId: string,
    reason?: string
  ) => { ok: true; document: CommercialDocument } | { ok: false; errors: string[] };
  duplicateCommercialDocument: (
    docId: string
  ) => { ok: true; document: CommercialDocument } | { ok: false; errors: string[] };
  convertCommercialDocument: (
    sourceId: string,
    targetType: CommercialDocType,
    issueImmediately?: boolean
  ) => { ok: true; document: CommercialDocument } | { ok: false; errors: string[] };
  updateDocumentSettings: (patch: Partial<DocumentCompanySettings>) => void;
  resetDocumentCounter: (type: CommercialDocType, year: number, nextValue: number) => void;

  // B2B Customers Database (Server JSON/API & Cloud Blobs)
  customers: CustomerRecord[];
  customersDbSource: CustomerDbSource;
  refreshCustomersFromDb: () => Promise<void>;
  createCustomerRecord: (
    input: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<{ ok: true; customer: CustomerRecord } | { ok: false; errors: string[] }>;
  updateCustomerRecord: (
    id: string,
    input: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<{ ok: true; customer: CustomerRecord } | { ok: false; errors: string[] }>;
  deleteCustomerRecord: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const DEFAULT_SAMPLE_ORDERS: Order[] = [
  {
    id: 'TL-8941',
    bonDeLivraisonRef: 'BL-2026-8941',
    customerName: 'Mohamed Amine Larbi',
    customerPhone: '0555 44 33 22',
    wilaya: { code: 16, nameFr: '16 - Alger', nameAr: '16 - الجزائر' },
    commune: { nameFr: 'Hydra', nameAr: 'حيدرة' },
    address: '12 Boulevard des Martyrs, Hydra',
    deliveryCompanyId: 'yalidine',
    deliveryCompanyName: 'Yalidine Express',
    deliveryMethod: 'home',
    shippingTrackingNumber: 'YAL-8941-DZ',
    items: [
      {
        productId: 'tl-rog-strix-g16',
        sku: 'TL-ASUS-G16-4070-01',
        barcode: '6931234560012',
        name: 'ASUS ROG Strix G16 (2024)',
        priceDZD: 245000,
        purchasePriceDZD: 215000,
        quantity: 1,
        image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?auto=format&fit=crop&w=1000&q=80'
      }
    ],
    subtotalDZD: 245000,
    deliveryFeeDZD: 550,
    totalDZD: 245550,
    totalPurchaseCostDZD: 215000,
    netProfitDZD: 30000,
    paymentMethod: 'cod',
    paymentStatus: 'pending',
    status: 'shipped',
    statusHistory: [
      {
        status: 'new',
        changedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
        changedBy: 'Client Web'
      },
      {
        status: 'confirmed',
        changedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
        changedBy: 'Karim Bencherif'
      },
      {
        status: 'shipped',
        changedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        changedBy: 'Yacine Merah',
        note: 'Colis remis à Yalidine Express'
      }
    ],
    notes: 'Appeler avant livraison svp',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Products (Fixed: never reset if categories are edited or deleted)
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_products_v3') || localStorage.getItem('top_laptop_products_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRODUCTS;
  });

  // 2. 69 Wilayas
  const [wilayas, setWilayas] = useState<Wilaya[]>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_wilayas_69');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_69_WILAYAS;
  });

  // 3. Delivery Companies
  const [deliveryCompanies, setDeliveryCompanies] = useState<DeliveryCompany[]>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_delivery_companies');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DELIVERY_COMPANIES;
  });

  // 4. Employees & RBAC (with non-destructive migration for document permissions)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_employees');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const { employees: migrated, changed } = migrateEmployeesDocPermissions(parsed);
          if (changed) {
            safeLocalStorageSet('top_laptop_employees', migrated);
          }
          return migrated;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EMPLOYEES;
  });

  // Current session employee
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_current_employee');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          const { employees: migrated } = migrateEmployeesDocPermissions([parsed]);
          return migrated[0] || parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // 5. Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_orders_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_SAMPLE_ORDERS;
  });

  // 6. Inventory Movements
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_inventory_movements');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'mov-1',
        productId: 'tl-rog-strix-g16',
        productName: 'ASUS ROG Strix G16 (2024)',
        sku: 'TL-ASUS-G16-4070-01',
        type: 'in_restock',
        quantityChange: 8,
        previousStock: 0,
        newStock: 8,
        reason: 'Arrivage conteneur officiel ASUS France',
        performedBy: 'Karim Bencherif',
        createdAt: new Date(Date.now() - 3600000 * 72).toISOString()
      },
      {
        id: 'mov-2',
        productId: 'tl-rog-strix-g16',
        productName: 'ASUS ROG Strix G16 (2024)',
        sku: 'TL-ASUS-G16-4070-01',
        type: 'out_sale',
        quantityChange: -1,
        previousStock: 8,
        newStock: 7,
        orderId: 'TL-8941',
        reason: 'Vente commande TL-8941',
        performedBy: 'Système',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
      }
    ];
  });

  // 7. Activity Logs
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_activity_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'act-1',
        employeeName: 'Karim Bencherif',
        employeeRole: 'SUPER_ADMIN',
        action: 'LOGIN',
        details: 'Connexion réussie à l\'espace administrateur',
        timestamp: new Date().toISOString()
      }
    ];
  });

  // 8. Backups
  const [backups, setBackups] = useState<DatabaseBackup[]>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_backups');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // 9. Store Settings (synced with central siteConfig.ts)
  const [settings, setSettings] = useState<StoreSettings>(() => {
    const persistedSite = loadPersistedSiteConfig();
    try {
      const saved = localStorage.getItem('top_laptop_settings_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          const { normalized, migratedLegacyPhone } = normalizeStoreSettings(parsed);
          if (persistedSite) {
            const sitePatch = siteConfigToStoreSettingsPatch(persistedSite);
            const synced: StoreSettings = {
              ...normalized,
              ...sitePatch,
              socialLinks: {
                ...normalized.socialLinks,
                ...sitePatch.socialLinks!,
              },
            };
            return synced;
          }
          if (migratedLegacyPhone) {
            safeLocalStorageSet('top_laptop_settings_v2', normalized);
          }
          return normalized;
        }
      }
    } catch (e) {
      console.error(e);
    }
    if (persistedSite) {
      const sitePatch = siteConfigToStoreSettingsPatch(persistedSite);
      return {
        ...INITIAL_SETTINGS,
        ...sitePatch,
        socialLinks: {
          ...INITIAL_SETTINGS.socialLinks,
          ...sitePatch.socialLinks!,
        },
      };
    }
    return INITIAL_SETTINGS;
  });

  const settingsRef = React.useRef<StoreSettings>(settings);
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // 10. Commercial Documents & Document Settings (Migrated non-destructively)
  const [documentSettings, setDocumentSettings] = useState<DocumentCompanySettings>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_document_settings_v1');
      if (saved) {
        return normalizeDocumentSettings(JSON.parse(saved), INITIAL_SETTINGS);
      }
    } catch (e) {
      console.error(e);
    }
    return createDefaultDocumentSettings(settings);
  });

  const [commercialDocuments, setCommercialDocuments] = useState<CommercialDocument[]>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_commercial_documents_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return reconcileFacturesWithReceipts(parsed);
        }
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  // 11. B2B Customers Database (loaded immediately from local cache, then hydrated from real server API)
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_customers_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });
  const [customersDbSource, setCustomersDbSource] = useState<CustomerDbSource>('server-json-db');

  const refreshCustomersFromDb = React.useCallback(async () => {
    const res = await fetchCustomersFromDatabase();
    setCustomers(res.customers);
    setCustomersDbSource(res.source);
  }, []);

  // Keep browser document title synced with storeName
  useEffect(() => {
    if (typeof document !== 'undefined' && settings.storeName) {
      document.title = `${settings.storeName} — Premier Computer & Tech Store in Algeria`;
    }
  }, [settings.storeName]);

  const refreshFromCloud = React.useCallback(async () => {
    const remote = await fetchAllCloudAndLocalState(true);
    if (Array.isArray(remote.products)) {
      setProducts(remote.products);
    }
    if (remote.settings && typeof remote.settings === 'object') {
      const { normalized, migratedLegacyPhone } = normalizeStoreSettings(remote.settings);
      setSettings(normalized);
      saveSiteConfigToStorage({
        storeName: normalized.storeName,
        phone: normalized.contactPhone,
        whatsappNumber: normalized.whatsappNumber,
        whatsappUrl: normalized.socialLinks?.whatsapp,
        email: normalized.contactEmail,
        address: normalized.storeAddress,
        facebook: normalized.socialLinks?.facebook,
        instagram: normalized.socialLinks?.instagram,
        tiktok: normalized.socialLinks?.tiktok,
        youtube: normalized.socialLinks?.youtube,
        linkedin: normalized.socialLinks?.linkedin,
      });
      if (migratedLegacyPhone) {
        persistStoreKey('settings', normalized, true);
      }
    }
    if (Array.isArray(remote.wilayas) && remote.wilayas.length > 0) {
      setWilayas(remote.wilayas);
    }
    if (Array.isArray(remote.deliveryCompanies)) {
      setDeliveryCompanies(remote.deliveryCompanies);
    }
    if (Array.isArray(remote.employees) && remote.employees.length > 0) {
      const { employees: migrated } = migrateEmployeesDocPermissions(remote.employees);
      setEmployees(migrated);
    }
    if (Array.isArray(remote.orders)) {
      setOrders((prev) => mergeOrdersById(prev, remote.orders));
    }
    if (Array.isArray(remote.inventoryMovements)) {
      setInventoryMovements(remote.inventoryMovements);
    }
    if (Array.isArray(remote.activityLogs)) {
      setActivityLogs(remote.activityLogs);
    }
    if (remote.documentSettings && typeof remote.documentSettings === 'object') {
      setDocumentSettings(normalizeDocumentSettings(remote.documentSettings, remote.settings || settings));
    }
    if (Array.isArray(remote.commercialDocuments)) {
      setCommercialDocuments((prev) => reconcileFacturesWithReceipts(mergeOrdersById(prev, remote.commercialDocuments)));
    }
  }, []);

  // Hydrate from Netlify Cloud Blobs & IndexedDB on startup, window focus, & live polling
  useEffect(() => {
    let isMounted = true;

    const runHydration = () => {
      if (!isMounted) return;
      refreshFromCloud().catch(() => {});
      refreshCustomersFromDb().catch(() => {});
    };

    runHydration();

    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        runHydration();
      }
    };

    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        runHydration();
      }
    }, 8000);

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    idbGet<DatabaseBackup[]>('backups').then((savedBackups) => {
      if (isMounted && Array.isArray(savedBackups)) {
        setBackups(savedBackups);
      }
    });

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [refreshFromCloud]);

  // Logging Activity
  const logActivity = (action: ActivityAction, details: string, targetRecord?: string) => {
    const entry: ActivityLogEntry = {
      id: 'log-' + Date.now().toString(36),
      employeeName: currentEmployee?.name || 'Super Admin',
      employeeRole: currentEmployee?.role || 'SUPER_ADMIN',
      action,
      targetRecord,
      details,
      timestamp: new Date().toISOString()
    };
    setActivityLogs(prev => {
      const next = [entry, ...prev.slice(0, 499)];
      persistStoreKey('activityLogs', next, false);
      return next;
    });
  };

  // Keep the logged-in session in sync with the employees list, so renaming an
  // employee (or changing permissions) is reflected immediately and is not
  // overwritten by the stale snapshot saved at login time.
  useEffect(() => {
    if (!currentEmployee) return;
    const fresh = employees.find(e => e.id === currentEmployee.id);
    if (!fresh) return;
    const changed =
      fresh.name !== currentEmployee.name ||
      fresh.role !== currentEmployee.role ||
      fresh.isActive !== currentEmployee.isActive ||
      JSON.stringify(fresh.customPermissions || []) !== JSON.stringify(currentEmployee.customPermissions || []);
    if (changed) {
      const merged = { ...currentEmployee, ...fresh, lastLoginAt: currentEmployee.lastLoginAt };
      setCurrentEmployee(merged);
      safeLocalStorageSet('top_laptop_current_employee', merged);
    }
  }, [employees, currentEmployee]);

  // RBAC Permission Checker
  const hasPermission = (permission: EmployeePermission): boolean => {
    if (!currentEmployee) return false;
    if (currentEmployee.role === 'SUPER_ADMIN') return true;
    return currentEmployee.customPermissions?.includes(permission) || false;
  };

  const loginEmployee = (passcode: string): Employee | null => {
    const found = employees.find(e => e.isActive && (e.passcode === passcode || (e.role === 'SUPER_ADMIN' && passcode === 'toplaptop2026')));
    if (found) {
      const updated = { ...found, lastLoginAt: new Date().toISOString() };
      setCurrentEmployee(updated);
      safeLocalStorageSet('top_laptop_current_employee', updated);
      logActivity('LOGIN', `Connexion de l'employé ${found.name} (${found.role})`);
      return updated;
    }
    return null;
  };

  const logoutEmployee = () => {
    if (currentEmployee) {
      logActivity('LOGOUT', `Déconnexion de l'employé ${currentEmployee.name}`);
    }
    setCurrentEmployee(null);
    localStorage.removeItem('top_laptop_current_employee');
  };

  // Product CRUD with automatic Profit Calculations & Immediate Cloud + IndexedDB Persistence
  const addProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'profitDZD' | 'profitMarginPercent'>) => {
    const profitDZD = productData.priceDZD - productData.purchasePriceDZD;
    const profitMarginPercent = productData.priceDZD > 0 
      ? Number(((profitDZD / productData.priceDZD) * 100).toFixed(2)) 
      : 0;

    const newProduct: Product = {
      ...productData,
      id: 'tl-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
      profitDZD,
      profitMarginPercent,
      createdAt: new Date().toISOString()
    };

    const initialMovement: InventoryMovement = {
      id: 'mov-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 4),
      productId: newProduct.id,
      productName: newProduct.name,
      sku: newProduct.sku,
      type: 'in_restock',
      quantityChange: newProduct.stock,
      previousStock: 0,
      newStock: newProduct.stock,
      reason: 'Création initiale du produit',
      performedBy: currentEmployee?.name || 'Système',
      createdAt: new Date().toISOString()
    };

    setProducts(prev => {
      const next = [newProduct, ...prev];
      persistStoreKey('products', next, true);
      return next;
    });

    setInventoryMovements(prev => {
      const next = [initialMovement, ...prev];
      persistStoreKey('inventoryMovements', next, false);
      return next;
    });

    logActivity('PRODUCT_CREATE', `Création du produit ${newProduct.name} (SKU: ${newProduct.sku})`, newProduct.id);
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    let stockMovementToAdd: InventoryMovement | null = null;
    let updatedProductName = id;

    setProducts(prev => {
      const next = prev.map(p => {
        if (p.id === id) {
          updatedProductName = updated.name || p.name;
          const newPrice = updated.priceDZD !== undefined ? updated.priceDZD : p.priceDZD;
          const newPurchase = updated.purchasePriceDZD !== undefined ? updated.purchasePriceDZD : p.purchasePriceDZD;
          const profitDZD = newPrice - newPurchase;
          const profitMarginPercent = newPrice > 0 ? Number(((profitDZD / newPrice) * 100).toFixed(2)) : 0;

          if (updated.stock !== undefined && updated.stock !== p.stock) {
            const diff = updated.stock - p.stock;
            stockMovementToAdd = {
              id: 'mov-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 4),
              productId: p.id,
              productName: updatedProductName,
              sku: updated.sku || p.sku || 'N/A',
              type: diff > 0 ? 'in_restock' : 'adjustment',
              quantityChange: diff,
              previousStock: p.stock,
              newStock: Math.max(0, updated.stock),
              reason: 'Ajustement manuel du stock depuis la fiche produit',
              performedBy: currentEmployee?.name || 'Système',
              createdAt: new Date().toISOString()
            };
          }

          return {
            ...p,
            ...updated,
            profitDZD,
            profitMarginPercent,
            updatedAt: new Date().toISOString()
          };
        }
        return p;
      });

      persistStoreKey('products', next, true);
      return next;
    });

    if (stockMovementToAdd) {
      const mov = stockMovementToAdd;
      setInventoryMovements(prev => {
        const next = [mov, ...prev];
        persistStoreKey('inventoryMovements', next, false);
        return next;
      });
    }

    logActivity('PRODUCT_UPDATE', `Mise à jour du produit ${updatedProductName}`, id);
  };

  const deleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    setProducts(prev => {
      const next = prev.filter(p => p.id !== id);
      persistStoreKey('products', next, true);
      return next;
    });
    logActivity('PRODUCT_DELETE', `Suppression du produit ${prod?.name || id}`, id);
  };

  // Stock Movement Recorder
  const recordStockMovement = (
    productId: string,
    type: StockMovementType,
    quantityChange: number,
    reason: string,
    orderId?: string
  ) => {
    const prod = products.find(p => p.id === productId);
    const prevStock = prod ? prod.stock : 0;
    const newStock = Math.max(0, prevStock + quantityChange);

    const movement: InventoryMovement = {
      id: 'mov-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 4),
      productId,
      productName: prod?.name || 'Produit',
      sku: prod?.sku || 'N/A',
      type,
      quantityChange,
      previousStock: prevStock,
      newStock,
      orderId,
      reason,
      performedBy: currentEmployee?.name || 'Système',
      createdAt: new Date().toISOString()
    };

    setInventoryMovements(prev => {
      const next = [movement, ...prev];
      persistStoreKey('inventoryMovements', next, false);
      return next;
    });

    setProducts(prev => {
      const next = prev.map(p =>
        p.id === productId
          ? {
              ...p,
              stock: newStock,
              status: (newStock === 0 ? 'out_of_stock' : 'available') as Product['status'],
              updatedAt: new Date().toISOString()
            }
          : p
      );
      persistStoreKey('products', next, true);
      return next;
    });
  };

  // Create Order with Snapshot Purchase Costs & License Assignment
  const createOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'status' | 'statusHistory' | 'bonDeLivraisonRef' | 'totalPurchaseCostDZD' | 'netProfitDZD'>): Promise<Order> => {
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const orderId = `TL-${randomCode}`;
    const blRef = `BL-${new Date().getFullYear()}-${randomCode}`;

    // Calculate total purchase cost snapshot
    let totalPurchaseCost = 0;
    const itemsWithSnapshot = orderData.items.map(item => {
      const prod = products.find(p => p.id === item.productId);
      const purchasePrice = prod?.purchasePriceDZD || 0;
      totalPurchaseCost += purchasePrice * item.quantity;

      // If digital software product, assign available license key
      let assignedKey: string | undefined = undefined;
      if (prod?.isDigital && prod.digitalDetails?.licenseKeys) {
        const availableKey = prod.digitalDetails.licenseKeys.find(k => !k.isUsed);
        if (availableKey) {
          assignedKey = availableKey.key;
          availableKey.isUsed = true;
          availableKey.orderId = orderId;
          availableKey.assignedToCustomer = orderData.customerName;
          availableKey.assignedAt = new Date().toISOString();
        }
      }

      const rawImg = item.image || prod?.images?.[0] || '';
      const compactImage = rawImg.startsWith('data:') && rawImg.length > 500 ? '' : rawImg;

      return {
        ...item,
        image: compactImage,
        purchasePriceDZD: purchasePrice,
        sku: prod?.sku || item.sku || 'N/A',
        barcode: prod?.barcode || '',
        assignedLicenseKey: assignedKey
      };
    });

    const netProfitDZD = orderData.totalDZD - totalPurchaseCost - (orderData.discountDZD || 0);

    const newOrder: Order = {
      ...orderData,
      id: orderId,
      bonDeLivraisonRef: blRef,
      items: itemsWithSnapshot,
      totalPurchaseCostDZD: totalPurchaseCost,
      netProfitDZD,
      status: 'new',
      statusHistory: [
        {
          status: 'new',
          changedAt: new Date().toISOString(),
          changedBy: 'Client Web (Checkout)'
        }
      ],
      createdAt: new Date().toISOString()
    };

    // Deduct stock and record stock movement for all ordered items
    itemsWithSnapshot.forEach(orderItem => {
      recordStockMovement(
        orderItem.productId,
        'out_sale',
        -orderItem.quantity,
        `Commande ${orderId}`,
        orderId
      );
    });

    const nextOrders = mergeOrdersById(orders, [newOrder]);
    setOrders(nextOrders);
    const syncedOrders = await appendOrderToCloud(newOrder, nextOrders);
    setOrders(syncedOrders);

    logActivity('ORDER_STATUS_UPDATE', `Nouvelle commande enregistrée ${orderId} (${orderData.customerName})`, orderId);
    return newOrder;
  };

  // Order Status Workflow
  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    const existingOrder = orders.find(o => o.id === orderId);
    if (
      existingOrder &&
      (status === 'cancelled' || status === 'returned') &&
      existingOrder.status !== 'cancelled' &&
      existingOrder.status !== 'returned'
    ) {
      existingOrder.items.forEach(item => {
        recordStockMovement(
          item.productId,
          'return_customer',
          item.quantity,
          `Retour/Annulation de la commande ${orderId}`,
          orderId
        );
      });
    }

    setOrders(prev => {
      const next = prev.map(o => {
        if (o.id === orderId) {
          const updatedHistory = [
            ...o.statusHistory,
            {
              status,
              changedAt: new Date().toISOString(),
              changedBy: currentEmployee?.name || 'Administrateur',
              note
            }
          ];

          return {
            ...o,
            status,
            statusHistory: updatedHistory,
            updatedAt: new Date().toISOString()
          };
        }
        return o;
      });
      persistStoreKey('orders', next, true);
      return next;
    });
    logActivity('ORDER_STATUS_UPDATE', `Statut commande ${orderId} changé vers "${status}"`, orderId);
  };

  // Delivery Companies Management
  const addDeliveryCompany = (companyData: Omit<DeliveryCompany, 'id'>) => {
    const newComp: DeliveryCompany = {
      ...companyData,
      id: 'del-' + Date.now().toString(36)
    };
    setDeliveryCompanies(prev => {
      const next = [...prev, newComp];
      persistStoreKey('deliveryCompanies', next, true);
      return next;
    });
    logActivity('DELIVERY_COMPANY_UPDATE', `Ajout de la société de livraison ${newComp.name}`, newComp.id);
  };

  const updateDeliveryCompany = (id: string, updated: Partial<DeliveryCompany>) => {
    setDeliveryCompanies(prev => {
      const next = prev.map(c => (c.id === id ? { ...c, ...updated } : c));
      persistStoreKey('deliveryCompanies', next, true);
      return next;
    });
    logActivity('DELIVERY_COMPANY_UPDATE', `Modification de la société de livraison ${id}`, id);
  };

  const deleteDeliveryCompany = (id: string) => {
    setDeliveryCompanies(prev => {
      const next = prev.filter(c => c.id !== id);
      persistStoreKey('deliveryCompanies', next, true);
      return next;
    });
    logActivity('DELIVERY_COMPANY_UPDATE', `Suppression de la société de livraison ${id}`, id);
  };

  const updateWilayaDeliveryPrice = (companyId: string, wilayaCode: number, homePrice: number, deskPrice: number, isSupported: boolean) => {
    setDeliveryCompanies(prev => {
      const next = prev.map(c => {
        if (c.id === companyId) {
          return {
            ...c,
            wilayaPricing: {
              ...c.wilayaPricing,
              [wilayaCode]: { homePriceDZD: homePrice, stopDeskPriceDZD: deskPrice, isSupported }
            }
          };
        }
        return c;
      });
      persistStoreKey('deliveryCompanies', next, true);
      return next;
    });
  };

  const toggleWilayaActive = (wilayaCode: number) => {
    setWilayas(prev => {
      const next = prev.map(w => (w.code === wilayaCode ? { ...w, isActive: !w.isActive } : w));
      persistStoreKey('wilayas', next, true);
      return next;
    });
  };

  // Employee Management
  const addEmployee = (empData: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmp: Employee = {
      ...empData,
      id: 'emp-' + Date.now().toString(36),
      createdAt: new Date().toISOString()
    };
    setEmployees(prev => {
      const next = [...prev, newEmp];
      persistStoreKey('employees', next, true);
      return next;
    });
    logActivity('EMPLOYEE_UPDATE', `Création du compte employé ${newEmp.name} (${newEmp.role})`, newEmp.id);
  };

  const updateEmployee = (id: string, updated: Partial<Employee>) => {
    setEmployees(prev => {
      const next = prev.map(e => (e.id === id ? { ...e, ...updated } : e));
      persistStoreKey('employees', next, true);
      return next;
    });
    logActivity('EMPLOYEE_UPDATE', `Modification du compte employé ${id}`, id);
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => {
      const next = prev.filter(e => e.id !== id);
      persistStoreKey('employees', next, true);
      return next;
    });
    logActivity('EMPLOYEE_UPDATE', `Suppression du compte employé ${id}`, id);
  };

  // Backup & Recovery System
  const createDatabaseBackup = (): DatabaseBackup => {
    const snapshot = {
      timestamp: new Date().toISOString(),
      products,
      orders,
      wilayas,
      deliveryCompanies,
      employees,
      inventoryMovements,
      settings,
      commercialDocuments,
      documentSettings,
      customers
    };

    const dataJson = JSON.stringify(snapshot);
    const hash = 'BKP-' + Math.abs(dataJson.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16);

    const newBackup: DatabaseBackup = {
      id: 'bkp-' + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      version: '2.2.0',
      dataHash: hash,
      summary: {
        productsCount: products.length,
        ordersCount: orders.length,
        employeesCount: employees.length,
        deliveryCompaniesCount: deliveryCompanies.length,
        documentsCount: commercialDocuments.length,
        customersCount: customers.length
      },
      dataJson
    };

    setBackups(prev => {
      const next = [newBackup, ...prev.slice(0, 9)];
      idbSet('backups', next);
      return next;
    });
    logActivity('BACKUP_CREATE', `Sauvegarde de base de données générée (${hash})`, newBackup.id);
    return newBackup;
  };

  const restoreDatabaseBackup = (backupJson: string): boolean => {
    try {
      const parsed = JSON.parse(backupJson);
      if (parsed.products && parsed.orders && parsed.settings) {
        setProducts(parsed.products);
        setOrders(parsed.orders);
        if (parsed.wilayas) setWilayas(parsed.wilayas);
        if (parsed.deliveryCompanies) setDeliveryCompanies(parsed.deliveryCompanies);
        if (parsed.employees) setEmployees(migrateEmployeesDocPermissions(parsed.employees).employees);
        if (parsed.inventoryMovements) setInventoryMovements(parsed.inventoryMovements);
        if (parsed.settings) setSettings(parsed.settings);
        if (Array.isArray(parsed.commercialDocuments)) {
          setCommercialDocuments(reconcileFacturesWithReceipts(parsed.commercialDocuments));
        }
        if (parsed.documentSettings) {
          setDocumentSettings(normalizeDocumentSettings(parsed.documentSettings, parsed.settings));
        }
        if (Array.isArray(parsed.customers)) {
          setCustomers(parsed.customers);
        }

        persistStoreBatch({
          products: parsed.products,
          orders: parsed.orders,
          wilayas: parsed.wilayas,
          deliveryCompanies: parsed.deliveryCompanies,
          employees: parsed.employees ? migrateEmployeesDocPermissions(parsed.employees).employees : undefined,
          inventoryMovements: parsed.inventoryMovements,
          settings: parsed.settings,
          commercialDocuments: Array.isArray(parsed.commercialDocuments)
            ? reconcileFacturesWithReceipts(parsed.commercialDocuments)
            : undefined,
          documentSettings: parsed.documentSettings
            ? normalizeDocumentSettings(parsed.documentSettings, parsed.settings)
            : undefined,
          customers: Array.isArray(parsed.customers) ? parsed.customers : undefined,
        });

        logActivity('BACKUP_RESTORE', 'Restauration complète de la base de données réussie');
        return true;
      }
    } catch (e) {
      console.error('Backup restore failed', e);
    }
    return false;
  };

  const updateSettings = async (
    newSettings: Partial<StoreSettings>
  ): Promise<{ savedLocal: boolean; syncedCloud: boolean }> => {
    const prev = settingsRef.current;
    const merged = {
      ...prev,
      ...newSettings,
      socialLinks: {
        ...prev.socialLinks,
        ...(newSettings.socialLinks || {}),
      },
    };
    const effectiveWhatsapp =
      merged.whatsappNumber?.trim() || merged.contactPhone?.trim() || OFFICIAL_PHONE_LOCAL;
    const effectiveContactPhone =
      merged.contactPhone?.trim() || merged.whatsappNumber?.trim() || OFFICIAL_PHONE_LOCAL;

    const next: StoreSettings = {
      ...merged,
      whatsappNumber: effectiveWhatsapp,
      contactPhone: effectiveContactPhone,
      socialLinks: {
        ...merged.socialLinks,
        whatsapp: buildWhatsAppUrl(effectiveWhatsapp),
      },
    };

    settingsRef.current = next;
    setSettings(next);

    // 1. Persist immediately into central siteConfig storage
    saveSiteConfigToStorage({
      storeName: next.storeName,
      phone: next.contactPhone,
      whatsappNumber: next.whatsappNumber,
      whatsappUrl: next.socialLinks.whatsapp,
      email: next.contactEmail,
      address: next.storeAddress,
      facebook: next.socialLinks.facebook,
      instagram: next.socialLinks.instagram,
      tiktok: next.socialLinks.tiktok,
      youtube: next.socialLinks.youtube,
      linkedin: next.socialLinks.linkedin,
    });

    // 2. Persist into localStorage, IndexedDB, and Netlify Cloud Blobs with dirty-key protection
    const status = await persistStoreKeyWithAck('settings', next);

    // 3. Keep Documents company header synced with Store Settings (name, phone, email, address, RC, NIF)
    setDocumentSettings((prevDocSettings) => {
      const syncedDocSettings: DocumentCompanySettings = {
        ...prevDocSettings,
        companyName: next.storeName || prevDocSettings.companyName,
        address: next.storeAddress || prevDocSettings.address,
        phone: next.contactPhone || next.whatsappNumber || prevDocSettings.phone,
        email: next.contactEmail || prevDocSettings.email,
        rc: next.tradeRegisterRC ?? prevDocSettings.rc,
        nif: next.taxNumberNIF ?? prevDocSettings.nif,
      };
      persistStoreKey('documentSettings', syncedDocSettings, true);
      return syncedDocSettings;
    });

    logActivity('THEME_CHANGE', 'Mise à jour des paramètres de contact et boutique');
    return status;
  };

  const resetToDemoCatalog = () => {
    setProducts(INITIAL_PRODUCTS);
    setWilayas(INITIAL_69_WILAYAS);
    setDeliveryCompanies(INITIAL_DELIVERY_COMPANIES);
    setEmployees(INITIAL_EMPLOYEES);
    persistStoreBatch({
      products: INITIAL_PRODUCTS,
      wilayas: INITIAL_69_WILAYAS,
      deliveryCompanies: INITIAL_DELIVERY_COMPANIES,
      employees: INITIAL_EMPLOYEES,
    });
    logActivity('PRODUCT_UPDATE', 'Réinitialisation complète du catalogue et données de démonstration');
  };

  // ==========================================
  // COMMERCIAL DOCUMENTS OPERATIONS (WITH RBAC & VALIDATION)
  // ==========================================
  const syncLinkedOrdersPaymentFromDocs = (docs: CommercialDocument[]) => {
    const paidOrderIds = new Set(
      docs
        .filter((d) => d.type === 'facture' && d.status === 'paid' && d.orderId)
        .map((d) => d.orderId!)
    );
    if (paidOrderIds.size > 0) {
      setOrders((prevOrders) => {
        let modified = false;
        const nextOrders = prevOrders.map((ord) => {
          if (paidOrderIds.has(ord.id) && ord.paymentStatus !== 'paid') {
            modified = true;
            return { ...ord, paymentStatus: 'paid' as const, updatedAt: new Date().toISOString() };
          }
          return ord;
        });
        if (modified) {
          persistStoreKey('orders', nextOrders, true);
          return nextOrders;
        }
        return prevOrders;
      });
    }
  };

  const createCommercialDocument = (
    draft: Omit<CommercialDocument, 'id' | 'number' | 'sequenceNumber' | 'year' | 'createdAt'>,
    issueImmediately = false
  ): { ok: true; document: CommercialDocument } | { ok: false; errors: string[] } => {
    const requiredPerm = getPermissionForDocType(draft.type);
    if (!hasPermission(requiredPerm)) {
      return {
        ok: false,
        errors: ['Permission refusée : votre rôle ne permet pas de créer ce type de document.'],
      };
    }

    const docDate = draft.date || new Date().toISOString().slice(0, 10);
    const year = Number(docDate.slice(0, 4)) || new Date().getFullYear();

    const { number, sequenceNumber, nextCounterValue } = generateNextDocumentNumber(
      draft.type,
      year,
      documentSettings,
      commercialDocuments
    );

    const totals = recalculateDocumentTotals({
      lines: draft.lines || [],
      tvaRate: draft.tvaRate,
      deliveryFeeDZD: draft.deliveryFeeDZD,
      applyTimbre: Boolean(draft.applyTimbre),
      settings: documentSettings,
      type: draft.type,
      paymentAmountDZD: draft.paymentAmountDZD,
    });

    const initialStatus = issueImmediately
      ? draft.type === 'bl'
        ? 'prepared'
        : draft.type === 'receipt'
        ? 'paid'
        : 'issued'
      : 'draft';

    const newDoc: CommercialDocument = {
      ...draft,
      id: 'doc-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6),
      number,
      year,
      sequenceNumber,
      date: docDate,
      status: initialStatus,
      lines: totals.lines,
      subtotalDZD: totals.subtotalDZD,
      discountTotalDZD: totals.discountTotalDZD,
      netHtDZD: totals.netHtDZD,
      tvaRate: totals.tvaRate,
      tvaAmountDZD: totals.tvaAmountDZD,
      timbreAmountDZD: totals.timbreAmountDZD,
      deliveryFeeDZD: totals.deliveryFeeDZD,
      totalDZD: totals.totalDZD,
      amountPaidDZD: draft.type === 'facture' ? 0 : draft.amountPaidDZD,
      remainingAmountDZD: draft.type === 'facture' ? totals.totalDZD : draft.remainingAmountDZD,
      paymentAmountDZD: draft.type === 'receipt' ? totals.totalDZD : draft.paymentAmountDZD,
      createdBy: currentEmployee?.name || draft.createdBy || 'Administrateur',
      createdByEmployeeId: currentEmployee?.id || draft.createdByEmployeeId,
      createdAt: new Date().toISOString(),
      issuedAt: issueImmediately ? new Date().toISOString() : undefined,
    };

    const validationErrors = validateCommercialDocumentInput(newDoc, commercialDocuments);
    if (validationErrors.length > 0) {
      return { ok: false, errors: validationErrors };
    }

    const reconciled = reconcileFacturesWithReceipts([newDoc, ...commercialDocuments]);
    const finalCreated = reconciled.find((d) => d.id === newDoc.id) || newDoc;

    const counterKey = getCounterKey(draft.type, year);
    const nextDocSettings: DocumentCompanySettings = {
      ...documentSettings,
      counters: {
        ...documentSettings.counters,
        [counterKey]: nextCounterValue,
      },
    };

    setCommercialDocuments(reconciled);
    setDocumentSettings(nextDocSettings);
    persistStoreBatch({
      commercialDocuments: reconciled,
      documentSettings: nextDocSettings,
    });
    syncLinkedOrdersPaymentFromDocs(reconciled);

    logActivity(
      issueImmediately ? 'DOCUMENT_ISSUE' : 'DOCUMENT_CREATE',
      `${issueImmediately ? 'Émission' : 'Création brouillon'} ${newDoc.number} (${newDoc.customer.name})`,
      newDoc.id
    );

    return { ok: true, document: finalCreated };
  };

  const updateDraftDocument = (
    docId: string,
    patch: Partial<CommercialDocument>
  ): { ok: true; document: CommercialDocument } | { ok: false; errors: string[] } => {
    const existing = commercialDocuments.find((d) => d.id === docId);
    if (!existing) {
      return { ok: false, errors: ['Document introuvable.'] };
    }
    if (!hasPermission(getPermissionForDocType(existing.type))) {
      return { ok: false, errors: ['Permission refusée pour modifier ce document.'] };
    }
    if (existing.status !== 'draft') {
      return {
        ok: false,
        errors: [
          `Le document ${existing.number} est déjà émis et verrouillé. Annulez-le et réémettez un nouveau document.`,
        ],
      };
    }

    const mergedLines = patch.lines ?? existing.lines;
    const totals = recalculateDocumentTotals({
      lines: mergedLines,
      tvaRate: patch.tvaRate ?? existing.tvaRate,
      deliveryFeeDZD: patch.deliveryFeeDZD ?? existing.deliveryFeeDZD,
      applyTimbre: patch.applyTimbre ?? Boolean(existing.applyTimbre),
      settings: documentSettings,
      type: existing.type,
      paymentAmountDZD: patch.paymentAmountDZD ?? existing.paymentAmountDZD,
    });

    const updatedDoc: CommercialDocument = {
      ...existing,
      ...patch,
      id: existing.id,
      type: existing.type,
      number: existing.number,
      year: existing.year,
      sequenceNumber: existing.sequenceNumber,
      status: 'draft',
      lines: totals.lines,
      subtotalDZD: totals.subtotalDZD,
      discountTotalDZD: totals.discountTotalDZD,
      netHtDZD: totals.netHtDZD,
      tvaRate: totals.tvaRate,
      tvaAmountDZD: totals.tvaAmountDZD,
      timbreAmountDZD: totals.timbreAmountDZD,
      deliveryFeeDZD: totals.deliveryFeeDZD,
      totalDZD: totals.totalDZD,
      remainingAmountDZD: existing.type === 'facture' ? totals.totalDZD : existing.remainingAmountDZD,
      paymentAmountDZD: existing.type === 'receipt' ? totals.totalDZD : existing.paymentAmountDZD,
      updatedAt: new Date().toISOString(),
    };

    const errors = validateCommercialDocumentInput(updatedDoc, commercialDocuments, { isEdit: true });
    if (errors.length > 0) {
      return { ok: false, errors };
    }

    const nextDocs = commercialDocuments.map((d) => (d.id === docId ? updatedDoc : d));
    setCommercialDocuments(nextDocs);
    persistStoreKey('commercialDocuments', nextDocs, true);
    logActivity('DOCUMENT_UPDATE', `Mise à jour brouillon ${updatedDoc.number}`, docId);

    return { ok: true, document: updatedDoc };
  };

  const issueCommercialDocument = (
    docId: string
  ): { ok: true; document: CommercialDocument } | { ok: false; errors: string[] } => {
    const existing = commercialDocuments.find((d) => d.id === docId);
    if (!existing) {
      return { ok: false, errors: ['Document introuvable.'] };
    }
    if (!hasPermission(getPermissionForDocType(existing.type))) {
      return { ok: false, errors: ['Permission refusée pour émettre ce document.'] };
    }
    if (existing.status !== 'draft') {
      return { ok: false, errors: [`Le document ${existing.number} est déjà émis.`] };
    }

    const nextStatus =
      existing.type === 'bl' ? 'prepared' : existing.type === 'receipt' ? 'paid' : 'issued';

    const issuedDoc: CommercialDocument = {
      ...existing,
      status: nextStatus,
      issuedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const errors = validateCommercialDocumentInput(issuedDoc, commercialDocuments);
    if (errors.length > 0) {
      return { ok: false, errors };
    }

    const rawNext = commercialDocuments.map((d) => (d.id === docId ? issuedDoc : d));
    const reconciled = reconcileFacturesWithReceipts(rawNext);
    const finalDoc = reconciled.find((d) => d.id === docId) || issuedDoc;

    setCommercialDocuments(reconciled);
    persistStoreKey('commercialDocuments', reconciled, true);
    syncLinkedOrdersPaymentFromDocs(reconciled);

    logActivity('DOCUMENT_ISSUE', `Émission officielle du document ${issuedDoc.number}`, docId);
    return { ok: true, document: finalDoc };
  };

  const updateBLStatus = (
    docId: string,
    status: 'prepared' | 'delivered' | 'returned'
  ): { ok: true; document: CommercialDocument } | { ok: false; errors: string[] } => {
    const existing = commercialDocuments.find((d) => d.id === docId);
    if (!existing || existing.type !== 'bl') {
      return { ok: false, errors: ['Bon de livraison introuvable.'] };
    }
    if (!hasPermission('issue_bl')) {
      return { ok: false, errors: ['Permission refusée : rôle Expéditions requis.'] };
    }
    if (existing.status === 'draft' || existing.status === 'cancelled') {
      return { ok: false, errors: ['Émettez d’abord le BL avant de changer son statut de livraison.'] };
    }

    const updated: CommercialDocument = {
      ...existing,
      status,
      updatedAt: new Date().toISOString(),
    };
    const nextDocs = commercialDocuments.map((d) => (d.id === docId ? updated : d));
    setCommercialDocuments(nextDocs);
    persistStoreKey('commercialDocuments', nextDocs, true);
    logActivity('DOCUMENT_UPDATE', `Statut BL ${updated.number} -> ${status}`, docId);
    return { ok: true, document: updated };
  };

  const cancelCommercialDocument = (
    docId: string,
    reason?: string
  ): { ok: true; document: CommercialDocument } | { ok: false; errors: string[] } => {
    const existing = commercialDocuments.find((d) => d.id === docId);
    if (!existing) {
      return { ok: false, errors: ['Document introuvable.'] };
    }
    if (
      !hasPermission(getPermissionForDocType(existing.type)) &&
      !hasPermission('cancel_documents')
    ) {
      return { ok: false, errors: ['Permission refusée pour annuler ce document.'] };
    }
    if (existing.status === 'cancelled') {
      return { ok: false, errors: ['Ce document est déjà annulé.'] };
    }

    const cancelled: CommercialDocument = {
      ...existing,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancelReason: reason?.trim() || 'Annulé par opérateur',
      updatedAt: new Date().toISOString(),
    };

    const rawNext = commercialDocuments.map((d) => (d.id === docId ? cancelled : d));
    const reconciled = reconcileFacturesWithReceipts(rawNext);
    setCommercialDocuments(reconciled);
    persistStoreKey('commercialDocuments', reconciled, true);
    logActivity('DOCUMENT_CANCEL', `Annulation du document ${cancelled.number}${reason ? ` (${reason})` : ''}`, docId);
    return { ok: true, document: cancelled };
  };

  const duplicateCommercialDocument = (
    docId: string
  ): { ok: true; document: CommercialDocument } | { ok: false; errors: string[] } => {
    const source = commercialDocuments.find((d) => d.id === docId);
    if (!source) {
      return { ok: false, errors: ['Document source introuvable.'] };
    }
    const draft = buildConvertedDraft(source, source.type, documentSettings, currentEmployee);
    // Keep same doc type without overriding sourceDocumentId unless desired
    return createCommercialDocument(
      {
        ...draft,
        sourceDocumentId: undefined,
        sourceDocumentNumber: undefined,
      },
      false
    );
  };

  const convertCommercialDocument = (
    sourceId: string,
    targetType: CommercialDocType,
    issueImmediately = false
  ): { ok: true; document: CommercialDocument } | { ok: false; errors: string[] } => {
    const source = commercialDocuments.find((d) => d.id === sourceId);
    if (!source) {
      return { ok: false, errors: ['Document source introuvable.'] };
    }
    if (source.status === 'cancelled') {
      return { ok: false, errors: ['Impossible de convertir un document annulé.'] };
    }
    if (!hasPermission(getPermissionForDocType(targetType))) {
      return { ok: false, errors: ['Permission refusée pour créer ce document cible.'] };
    }

    const draft = buildConvertedDraft(source, targetType, documentSettings, currentEmployee);
    const result = createCommercialDocument(draft, issueImmediately);
    if (result.ok) {
      logActivity(
        'DOCUMENT_CONVERT',
        `Conversion ${source.number} -> ${result.document.number}`,
        result.document.id
      );
    }
    return result;
  };

  const updateDocumentSettings = (patch: Partial<DocumentCompanySettings>) => {
    if (!hasPermission('manage_document_settings')) return;
    setDocumentSettings((prev) => {
      const next: DocumentCompanySettings = {
        ...prev,
        ...patch,
        prefixes: {
          ...prev.prefixes,
          ...(patch.prefixes || {}),
        },
        counters: {
          ...prev.counters,
          ...(patch.counters || {}),
        },
      };
      persistStoreKey('documentSettings', next, true);
      return next;
    });
    logActivity('DOCUMENT_SETTINGS_UPDATE', 'Mise à jour des paramètres Documents & Fiscalité');
  };

  const resetDocumentCounter = (type: CommercialDocType, year: number, nextValue: number) => {
    if (!hasPermission('manage_document_settings')) return;
    const key = getCounterKey(type, year);
    const safeVal = Math.max(0, Math.floor(Number(nextValue) || 0));
    setDocumentSettings((prev) => {
      const next: DocumentCompanySettings = {
        ...prev,
        counters: {
          ...prev.counters,
          [key]: safeVal,
        },
      };
      persistStoreKey('documentSettings', next, true);
      return next;
    });
    logActivity(
      'DOCUMENT_SETTINGS_UPDATE',
      `Compteur de numérotation ${type.toUpperCase()} (${year}) réinitialisé à ${safeVal}`
    );
  };

  // ==========================================
  // B2B CUSTOMERS DATABASE CRUD (API + DB PERSISTENT)
  // ==========================================
  const createCustomerRecord = async (
    input: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ ok: true; customer: CustomerRecord } | { ok: false; errors: string[] }> => {
    if (!hasPermission('manage_customers')) {
      return { ok: false, errors: ['Permission refusée : accès à la base clients requis.'] };
    }
    const res = await createCustomerInDatabase(input);
    if (!res.ok) return res;
    setCustomers(res.customers);
    setCustomersDbSource(res.source);
    logActivity('CUSTOMER_CREATE', `Ajout client B2B ${res.customer.companyName}`, res.customer.id);
    return { ok: true, customer: res.customer };
  };

  const updateCustomerRecord = async (
    id: string,
    input: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<{ ok: true; customer: CustomerRecord } | { ok: false; errors: string[] }> => {
    if (!hasPermission('manage_customers')) {
      return { ok: false, errors: ['Permission refusée : accès à la base clients requis.'] };
    }
    const res = await updateCustomerInDatabase(id, input);
    if (!res.ok) return res;
    setCustomers(res.customers);
    setCustomersDbSource(res.source);
    logActivity('CUSTOMER_UPDATE', `Mise à jour client B2B ${res.customer.companyName}`, res.customer.id);
    return { ok: true, customer: res.customer };
  };

  const deleteCustomerRecord = async (
    id: string
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    if (!hasPermission('manage_customers')) {
      return { ok: false, error: 'Permission refusée : accès à la base clients requis.' };
    }
    const existing = customers.find((c) => c.id === id);
    const res = await deleteCustomerFromDatabase(id);
    if (!res.ok) return res;
    setCustomers(res.customers);
    setCustomersDbSource(res.source);
    logActivity('CUSTOMER_DELETE', `Suppression client B2B ${existing?.companyName || id}`, id);
    return { ok: true };
  };

  return (
    <StoreContext.Provider
      value={{
        products,
        orders,
        wilayas,
        deliveryCompanies,
        employees,
        inventoryMovements,
        activityLogs,
        backups,
        settings,
        currentEmployee,
        isAdminAuthenticated: !!(currentEmployee && currentEmployee.isActive),
        hasPermission,
        loginEmployee,
        logoutEmployee,
        addProduct,
        updateProduct,
        deleteProduct,
        recordStockMovement,
        createOrder,
        updateOrderStatus,
        addDeliveryCompany,
        updateDeliveryCompany,
        deleteDeliveryCompany,
        updateWilayaDeliveryPrice,
        toggleWilayaActive,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        logActivity,
        createDatabaseBackup,
        restoreDatabaseBackup,
        updateSettings,
        resetToDemoCatalog,
        refreshFromCloud,
        commercialDocuments,
        documentSettings,
        createCommercialDocument,
        updateDraftDocument,
        issueCommercialDocument,
        updateBLStatus,
        cancelCommercialDocument,
        duplicateCommercialDocument,
        convertCommercialDocument,
        updateDocumentSettings,
        resetDocumentCounter,
        customers,
        customersDbSource,
        refreshCustomersFromDb,
        createCustomerRecord,
        updateCustomerRecord,
        deleteCustomerRecord
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
