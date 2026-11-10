export type Language = 'fr' | 'ar';

// ==========================================
// THEMES & VISUAL IDENTITY
// ==========================================
export type ThemeId = 
  | 'cyber-neon'       // Electric Blue & Dark Navy (Signature TOP LAPTOP)
  | 'stealth-titanium' // Slate, Carbon Black & Metallic Silver (Enterprise)
  | 'emerald-matrix'   // Emerald Green, Mint & Pitch Black (Tech Performance)
  | 'hyper-amber'      // Cyberpunk Gold/Amber & Deep Obsidian (Luxury Gaming)
  | 'crimson-rog'      // Intense Crimson Red & Dark Ash (Aggressive e-Sport)
  | 'aurora-cyan';     // Polar Cyan, Deep Indigo & Violet (Futuristic)

export interface ThemeConfig {
  id: ThemeId;
  nameFr: string;
  nameAr: string;
  descriptionFr: string;
  descriptionAr: string;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  cardBgColor: string;
  borderColor: string;
  textColor: string;
  badgeBg: string;
  badgeText: string;
  glowEffect: string;
}

export interface ThemeSettings {
  activeThemeId: ThemeId;
  autoRotateWeekly: boolean;
  rotationOrder: ThemeId[];
  lastRotatedDate?: string;
}

// ==========================================
// CATEGORIES & BRANDS
// ==========================================
export type ProductCategory = 
  | 'laptops' 
  | 'gaming' 
  | 'professional' 
  | 'business' 
  | 'desktops' 
  | 'accessories' 
  | 'components' 
  | 'printers'
  | 'software_digital'
  | 'laptop_bags_cases';

export type ProductBrand = 
  | 'Apple' 
  | 'HP' 
  | 'Lenovo' 
  | 'Dell' 
  | 'ASUS' 
  | 'Acer' 
  | 'MSI'
  | 'Microsoft'
  | 'Kaspersky'
  | 'ESET'
  | 'Adobe'
  | 'Autodesk'
  | 'Targus'
  | 'Samsonite'
  | 'Other';

export type ProductCondition = 'new' | 'used';
export type ProductStatus = 'available' | 'out_of_stock' | 'preorder';

// Digital Product & Software Specifics
export type SoftwareSubcategory = 
  | 'operating_systems'
  | 'office_productivity'
  | 'security_antivirus'
  | 'engineering_design'
  | 'other_digital';

export interface LicenseKey {
  id: string;
  key: string;
  isUsed: boolean;
  orderId?: string;
  assignedToCustomer?: string;
  assignedAt?: string;
}

export interface DigitalProductDetails {
  subcategory: SoftwareSubcategory;
  licenseType: 'Retail' | 'OEM' | 'Volume' | 'Subscription';
  duration: 'Lifetime' | '1 Year' | '2 Years' | '3 Years' | 'Monthly';
  devicesCount: number;
  activationInstructions: {
    fr: string;
    ar: string;
  };
  licenseKeys: LicenseKey[];
  downloadUrl?: string;
  isAutoDelivery: boolean;
}

// Laptop Bags & Cases Specifics
export type BagSubcategory = 
  | 'backpack'
  | 'shoulder_bag'
  | 'sleeve'
  | 'hard_case'
  | 'carrying_bag';

export type CompatibleLaptopSize = '13"' | '14"' | '15.6"' | '16"' | '17.3"';

export interface BagDetails {
  subcategory: BagSubcategory;
  compatibleSizes: CompatibleLaptopSize[];
  material: string;
  color: string;
  isWaterResistant?: boolean;
}

// ==========================================
// PRODUCT ENTITY (WITH FINANCIALS & BARCODES)
// ==========================================
export interface Product {
  id: string;
  sku: string;
  barcode: string;
  name: string;
  brand: ProductBrand;
  category: ProductCategory;
  
  // Pricing & Profit
  purchasePriceDZD: number; // Cost of goods sold (Restricted to authorized roles)
  priceDZD: number;         // Public selling price
  originalPriceDZD?: number;// Discounted from
  profitDZD: number;        // Automatically calculated (price - purchasePrice)
  profitMarginPercent: number; // Automatically calculated
  
  stock: number;
  minStockAlert: number;    // Threshold for low-stock warning (default: 3)
  warrantyMonths?: number;
  condition: ProductCondition;
  status: ProductStatus;
  isFeatured?: boolean;
  
  images: string[];
  description: {
    fr: string;
    ar: string;
  };

  // Hardware Specs (for physical PCs/parts)
  processor?: string;
  ram?: string;
  storage?: string;
  gpu?: string;
  screenSize?: string;

  // Type-specific extensions
  isDigital?: boolean;
  digitalDetails?: DigitalProductDetails;
  bagDetails?: BagDetails;

  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// 69 ALGERIAN WILAYAS & COMMUNES
// ==========================================
export interface Commune {
  id: string;
  nameFr: string;
  nameAr: string;
  postalCode?: string;
}

export interface Wilaya {
  code: number;
  nameFr: string;
  nameAr: string;
  communes: Commune[];
  isActive: boolean;
}

// ==========================================
// DELIVERY COMPANIES & SHIPPING
// ==========================================
export type DeliveryMethod = 'home' | 'stopdesk';

export interface WilayaDeliveryPrice {
  wilayaCode: number;
  homePriceDZD: number;
  stopDeskPriceDZD: number;
  isSupported: boolean;
}

export interface DeliveryCompany {
  id: string;
  name: string;
  logoUrl?: string;
  phone: string;
  website?: string;
  isActive: boolean;
  priority: number; // 1 = highest
  trackingUrlTemplate?: string; // e.g. "https://yalidine.com/app/tracking/?tracking={TRACKING}"
  supportsHomeDelivery: boolean;
  supportsStopDesk: boolean;
  wilayaPricing: Record<number, { homePriceDZD: number; stopDeskPriceDZD: number; isSupported: boolean }>;
}

// ==========================================
// CART & ORDER ENTITIES
// ==========================================
export interface CartItem {
  product: Product;
  quantity: number;
}

export type PaymentMethod = 'cod' | 'whatsapp';

export type OrderStatus = 
  | 'new'              // Commande reçue / طلب جديد
  | 'confirmed'        // Confirmée / مؤكدة
  | 'preparing'        // En préparation / قيد التجهيز
  | 'ready_shipping'   // Prête pour expédition / جاهزة للشحن
  | 'shipped'          // Expédiée / تم الشحن
  | 'out_for_delivery' // En cours de livraison / قيد التوصيل
  | 'delivered'        // Livrée / تم التسليم
  | 'cancelled'        // Annulée / ملغاة
  | 'returned';        // Retournée / مسترجعة

export interface OrderItem {
  productId: string;
  sku: string;
  barcode?: string;
  name: string;
  priceDZD: number;
  purchasePriceDZD: number; // Historical purchase cost snapshot
  quantity: number;
  image: string;
  isDigital?: boolean;
  assignedLicenseKey?: string;
}

export interface Order {
  id: string; // Reference TL-XXXX
  bonDeLivraisonRef?: string; // BL-2026-XXXX
  customerName: string;
  customerPhone: string;
  wilaya: {
    code: number;
    nameFr: string;
    nameAr: string;
  };
  commune: {
    nameFr: string;
    nameAr: string;
  };
  address: string;
  
  // Shipping details
  deliveryCompanyId: string;
  deliveryCompanyName: string;
  deliveryMethod: DeliveryMethod;
  shippingTrackingNumber?: string;
  
  items: OrderItem[];
  subtotalDZD: number;
  deliveryFeeDZD: number;
  discountDZD?: number;
  totalDZD: number;
  totalPurchaseCostDZD: number; // Sum of purchase prices (for net profit)
  netProfitDZD: number;         // Total selling - Total purchase - discounts
  
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  status: OrderStatus;
  statusHistory: Array<{
    status: OrderStatus;
    changedAt: string;
    changedBy: string; // Employee name or system
    note?: string;
  }>;
  
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==========================================
// INVENTORY MANAGEMENT & MOVEMENTS
// ==========================================
export type StockMovementType = 'in_restock' | 'out_sale' | 'return_customer' | 'adjustment' | 'damaged';

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type: StockMovementType;
  quantityChange: number; // positive or negative
  previousStock: number;
  newStock: number;
  orderId?: string;
  reason: string;
  performedBy: string;
  createdAt: string;
}

// ==========================================
// EMPLOYEE MANAGEMENT & RBAC
// ==========================================
export type EmployeeRole = 
  | 'SUPER_ADMIN'      // Full system access
  | 'MANAGER'          // Store operations, orders, customers
  | 'PRODUCT_MANAGER'  // Products, categories, software, inventory
  | 'SALES_AGENT'      // Orders and customer contact
  | 'ACCOUNTANT'       // Financial reports, costs, profits
  | 'DELIVERY_MANAGER';// Delivery companies, shipping

export type EmployeePermission = 
  | 'manage_products'
  | 'view_costs_profits'
  | 'manage_orders'
  | 'manage_delivery'
  | 'manage_employees'
  | 'view_analytics'
  | 'manage_inventory'
  | 'manage_backups'
  | 'manage_settings';

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: EmployeeRole;
  isActive: boolean;
  passcode: string;
  customPermissions: EmployeePermission[];
  createdAt: string;
  lastLoginAt?: string;
}

// ==========================================
// EMPLOYEE ACTIVITY LOG
// ==========================================
export type ActivityAction = 
  | 'LOGIN' 
  | 'LOGOUT' 
  | 'PRODUCT_CREATE' 
  | 'PRODUCT_UPDATE' 
  | 'PRODUCT_DELETE' 
  | 'PRICE_CHANGE' 
  | 'STOCK_CHANGE' 
  | 'ORDER_STATUS_UPDATE' 
  | 'DELIVERY_COMPANY_UPDATE' 
  | 'EMPLOYEE_UPDATE' 
  | 'THEME_CHANGE' 
  | 'BACKUP_CREATE' 
  | 'BACKUP_RESTORE' 
  | 'FINANCIAL_EXPORT';

export interface ActivityLogEntry {
  id: string;
  employeeName: string;
  employeeRole: EmployeeRole;
  action: ActivityAction;
  targetRecord?: string;
  details: string;
  timestamp: string;
}

// ==========================================
// STORE SETTINGS & BACKUPS
// ==========================================
export interface StoreSettings {
  storeName: string;
  flatDeliveryFeeDZD: number;
  whatsappNumber: string;
  contactPhone: string;
  contactEmail: string;
  storeAddress: string;
  taxNumberNIF?: string;
  tradeRegisterRC?: string;
  socialLinks: {
    facebook: string;
    instagram: string;
    tiktok: string;
    youtube: string;
    linkedin: string;
    whatsapp: string;
  };
  themeSettings: ThemeSettings;
  autoBackupEnabled: boolean;
  backupFrequencyDays: number;
  lastBackupDate?: string;
}

export interface DatabaseBackup {
  id: string;
  timestamp: string;
  version: string;
  dataHash: string;
  summary: {
    productsCount: number;
    ordersCount: number;
    employeesCount: number;
    deliveryCompaniesCount: number;
  };
  dataJson: string; // Serialized complete snapshot
}
