import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Product, 
  Order, 
  OrderStatus, 
  StoreSettings, 
  Wilaya, 
  DeliveryCompany, 
  Employee, 
  EmployeeRole, 
  EmployeePermission, 
  ActivityLogEntry, 
  ActivityAction, 
  InventoryMovement, 
  StockMovementType, 
  DatabaseBackup 
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_SETTINGS, INITIAL_EMPLOYEES } from '../data/initialProducts';
import { INITIAL_69_WILAYAS } from '../data/wilayas69';
import { INITIAL_DELIVERY_COMPANIES } from '../data/initialDeliveryCompanies';

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
  updateSettings: (newSettings: Partial<StoreSettings>) => void;
  resetToDemoCatalog: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Products
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_products_v3') || localStorage.getItem('top_laptop_products_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasSoftware = parsed.some((p: Product) => p.category === 'software_digital');
          const hasBags = parsed.some((p: Product) => p.category === 'laptop_bags_cases');
          if (hasSoftware && hasBags) return parsed;
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
        if (Array.isArray(parsed) && parsed.length === 69) return parsed;
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
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DELIVERY_COMPANIES;
  });

  // 4. Employees & RBAC
  const [employees, setEmployees] = useState<Employee[]>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_employees');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_EMPLOYEES;
  });

  // Current session employee
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_current_employee');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // 5. Orders
  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_orders_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    // Realistic initial sample order
    return [
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
  });

  // 6. Inventory Movements
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_inventory_movements');
      if (saved) return JSON.parse(saved);
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
      if (saved) return JSON.parse(saved);
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

  // 9. Store Settings
  const [settings, setSettings] = useState<StoreSettings>(() => {
    try {
      const saved = localStorage.getItem('top_laptop_settings_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SETTINGS;
  });

  // Persist State to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('top_laptop_products_v3', JSON.stringify(products));
    } catch (e) {
      console.warn(e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('top_laptop_wilayas_69', JSON.stringify(wilayas));
    } catch (e) {
      console.warn(e);
    }
  }, [wilayas]);

  useEffect(() => {
    try {
      localStorage.setItem('top_laptop_delivery_companies', JSON.stringify(deliveryCompanies));
    } catch (e) {
      console.warn(e);
    }
  }, [deliveryCompanies]);

  useEffect(() => {
    try {
      localStorage.setItem('top_laptop_employees', JSON.stringify(employees));
    } catch (e) {
      console.warn(e);
    }
  }, [employees]);

  useEffect(() => {
    try {
      localStorage.setItem('top_laptop_orders_v2', JSON.stringify(orders));
    } catch (e) {
      console.warn(e);
    }
  }, [orders]);

  useEffect(() => {
    try {
      localStorage.setItem('top_laptop_inventory_movements', JSON.stringify(inventoryMovements));
    } catch (e) {
      console.warn(e);
    }
  }, [inventoryMovements]);

  useEffect(() => {
    try {
      localStorage.setItem('top_laptop_activity_logs', JSON.stringify(activityLogs));
    } catch (e) {
      console.warn(e);
    }
  }, [activityLogs]);

  useEffect(() => {
    try {
      localStorage.setItem('top_laptop_backups', JSON.stringify(backups));
    } catch (e) {
      console.warn(e);
    }
  }, [backups]);

  useEffect(() => {
    try {
      localStorage.setItem('top_laptop_settings_v2', JSON.stringify(settings));
    } catch (e) {
      console.warn(e);
    }
  }, [settings]);

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
    setActivityLogs(prev => [entry, ...prev.slice(0, 499)]); // Keep last 500 logs
  };

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
      localStorage.setItem('top_laptop_current_employee', JSON.stringify(updated));
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

  // Product CRUD with automatic Profit Calculations
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

    setProducts(prev => [newProduct, ...prev]);

    // Record initial stock movement
    recordStockMovement(
      newProduct.id,
      'in_restock',
      newProduct.stock,
      'Création initiale du produit',
      undefined
    );

    logActivity('PRODUCT_CREATE', `Création du produit ${newProduct.name} (SKU: ${newProduct.sku})`, newProduct.id);
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const newPrice = updated.priceDZD !== undefined ? updated.priceDZD : p.priceDZD;
          const newPurchase = updated.purchasePriceDZD !== undefined ? updated.purchasePriceDZD : p.purchasePriceDZD;
          const profitDZD = newPrice - newPurchase;
          const profitMarginPercent = newPrice > 0 ? Number(((profitDZD / newPrice) * 100).toFixed(2)) : 0;

          // Check if stock changed directly
          if (updated.stock !== undefined && updated.stock !== p.stock) {
            const diff = updated.stock - p.stock;
            recordStockMovement(
              p.id,
              diff > 0 ? 'in_restock' : 'adjustment',
              diff,
              'Ajustement manuel du stock depuis la fiche produit'
            );
          }

          const merged: Product = {
            ...p,
            ...updated,
            profitDZD,
            profitMarginPercent,
            updatedAt: new Date().toISOString()
          };

          logActivity('PRODUCT_UPDATE', `Mise à jour du produit ${p.name}`, id);
          return merged;
        }
        return p;
      })
    );
  };

  const deleteProduct = (id: string) => {
    const prod = products.find(p => p.id === id);
    setProducts(prev => prev.filter(p => p.id !== id));
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

    setInventoryMovements(prev => [movement, ...prev]);
    setProducts(prev =>
      prev.map(p =>
        p.id === productId
          ? {
              ...p,
              stock: newStock,
              status: newStock === 0 ? 'out_of_stock' : 'available',
              updatedAt: new Date().toISOString()
            }
          : p
      )
    );
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

      return {
        ...item,
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

    // Deduct stock for all items
    setProducts(prev =>
      prev.map(p => {
        const orderItem = itemsWithSnapshot.find(i => i.productId === p.id);
        if (orderItem) {
          const updatedStock = Math.max(0, p.stock - orderItem.quantity);
          recordStockMovement(
            p.id,
            'out_sale',
            -orderItem.quantity,
            `Commande ${orderId}`,
            orderId
          );
          return {
            ...p,
            stock: updatedStock,
            status: updatedStock === 0 ? 'out_of_stock' : p.status
          };
        }
        return p;
      })
    );

    setOrders(prev => [newOrder, ...prev]);
    logActivity('ORDER_STATUS_UPDATE', `Nouvelle commande enregistrée ${orderId} (${orderData.customerName})`, orderId);
    return newOrder;
  };

  // Order Status Workflow
  const updateOrderStatus = (orderId: string, status: OrderStatus, note?: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id === orderId) {
          // If status transitioned to 'returned' or 'cancelled', restock items
          if ((status === 'cancelled' || status === 'returned') && o.status !== 'cancelled' && o.status !== 'returned') {
            o.items.forEach(item => {
              recordStockMovement(
                item.productId,
                'return_customer',
                item.quantity,
                `Retour/Annulation de la commande ${orderId}`,
                orderId
              );
              setProducts(currProds =>
                currProds.map(p => (p.id === item.productId ? { ...p, stock: p.stock + item.quantity } : p))
              );
            });
          }

          const updatedHistory = [
            ...o.statusHistory,
            {
              status,
              changedAt: new Date().toISOString(),
              changedBy: currentEmployee?.name || 'Administrateur',
              note
            }
          ];

          logActivity('ORDER_STATUS_UPDATE', `Statut commande ${orderId} changé vers "${status}"`, orderId);
          return {
            ...o,
            status,
            statusHistory: updatedHistory,
            updatedAt: new Date().toISOString()
          };
        }
        return o;
      })
    );
  };

  // Delivery Companies Management
  const addDeliveryCompany = (companyData: Omit<DeliveryCompany, 'id'>) => {
    const newComp: DeliveryCompany = {
      ...companyData,
      id: 'del-' + Date.now().toString(36)
    };
    setDeliveryCompanies(prev => [...prev, newComp]);
    logActivity('DELIVERY_COMPANY_UPDATE', `Ajout de la société de livraison ${newComp.name}`, newComp.id);
  };

  const updateDeliveryCompany = (id: string, updated: Partial<DeliveryCompany>) => {
    setDeliveryCompanies(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updated } : c))
    );
    logActivity('DELIVERY_COMPANY_UPDATE', `Modification de la société de livraison ${id}`, id);
  };

  const deleteDeliveryCompany = (id: string) => {
    setDeliveryCompanies(prev => prev.filter(c => c.id !== id));
    logActivity('DELIVERY_COMPANY_UPDATE', `Suppression de la société de livraison ${id}`, id);
  };

  const updateWilayaDeliveryPrice = (companyId: string, wilayaCode: number, homePrice: number, deskPrice: number, isSupported: boolean) => {
    setDeliveryCompanies(prev =>
      prev.map(c => {
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
      })
    );
  };

  const toggleWilayaActive = (wilayaCode: number) => {
    setWilayas(prev =>
      prev.map(w => (w.code === wilayaCode ? { ...w, isActive: !w.isActive } : w))
    );
  };

  // Employee Management
  const addEmployee = (empData: Omit<Employee, 'id' | 'createdAt'>) => {
    const newEmp: Employee = {
      ...empData,
      id: 'emp-' + Date.now().toString(36),
      createdAt: new Date().toISOString()
    };
    setEmployees(prev => [...prev, newEmp]);
    logActivity('EMPLOYEE_UPDATE', `Création du compte employé ${newEmp.name} (${newEmp.role})`, newEmp.id);
  };

  const updateEmployee = (id: string, updated: Partial<Employee>) => {
    setEmployees(prev =>
      prev.map(e => (e.id === id ? { ...e, ...updated } : e))
    );
    logActivity('EMPLOYEE_UPDATE', `Modification du compte employé ${id}`, id);
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
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
      settings
    };

    const dataJson = JSON.stringify(snapshot);
    const hash = 'BKP-' + Math.abs(dataJson.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)).toString(16);

    const newBackup: DatabaseBackup = {
      id: 'bkp-' + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      dataHash: hash,
      summary: {
        productsCount: products.length,
        ordersCount: orders.length,
        employeesCount: employees.length,
        deliveryCompaniesCount: deliveryCompanies.length
      },
      dataJson
    };

    setBackups(prev => [newBackup, ...prev]);
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
        if (parsed.employees) setEmployees(parsed.employees);
        if (parsed.inventoryMovements) setInventoryMovements(parsed.inventoryMovements);
        if (parsed.settings) setSettings(parsed.settings);

        logActivity('BACKUP_RESTORE', 'Restauration complète de la base de données réussie');
        return true;
      }
    } catch (e) {
      console.error('Backup restore failed', e);
    }
    return false;
  };

  const updateSettings = (newSettings: Partial<StoreSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    logActivity('THEME_CHANGE', 'Mise à jour des paramètres de la boutique');
  };

  const resetToDemoCatalog = () => {
    setProducts(INITIAL_PRODUCTS);
    setWilayas(INITIAL_69_WILAYAS);
    setDeliveryCompanies(INITIAL_DELIVERY_COMPANIES);
    setEmployees(INITIAL_EMPLOYEES);
    logActivity('PRODUCT_UPDATE', 'Réinitialisation complète du catalogue et données de démonstration');
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
        resetToDemoCatalog
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
