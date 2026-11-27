import {
  CommercialDocStatus,
  CommercialDocType,
  CommercialDocument,
  CommercialDocumentLine,
  DocumentCompanySettings,
  Employee,
  EmployeePermission,
  EmployeeRole,
  Language,
  Order,
  ReceiptPaymentMethod,
  StoreSettings,
} from '../types';
import { DEFAULT_SITE_CONFIG } from '../config/siteConfig';

export const DOC_TYPE_PREFIX_DEFAULTS: Record<CommercialDocType, string> = {
  bl: 'BL',
  proforma: 'PRO',
  facture: 'FAC',
  receipt: 'REC',
};

export const DOC_PERMISSIONS_ALL: EmployeePermission[] = [
  'view_documents',
  'issue_bl',
  'issue_proforma',
  'issue_facture',
  'issue_receipt',
  'cancel_documents',
  'manage_document_settings',
];

export function getDefaultDocPermissionsForRole(role: EmployeeRole): EmployeePermission[] {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'MANAGER':
      return [...DOC_PERMISSIONS_ALL, 'manage_customers'];
    case 'ACCOUNTANT':
      return [
        'view_documents',
        'issue_proforma',
        'issue_facture',
        'issue_receipt',
        'cancel_documents',
        'manage_document_settings',
        'manage_customers',
      ];
    case 'DELIVERY_MANAGER':
      return ['view_documents', 'issue_bl'];
    case 'SALES_AGENT':
      return ['view_documents', 'issue_proforma', 'issue_bl', 'manage_customers'];
    case 'CASHIER':
      return ['view_documents', 'issue_receipt'];
    case 'PRODUCT_MANAGER':
    default:
      return [];
  }
}

export function getPermissionForDocType(type: CommercialDocType): EmployeePermission {
  switch (type) {
    case 'bl':
      return 'issue_bl';
    case 'proforma':
      return 'issue_proforma';
    case 'facture':
      return 'issue_facture';
    case 'receipt':
      return 'issue_receipt';
  }
}

/**
 * Non-destructively migrates existing employee accounts so they retain their existing
 * permissions while receiving role-appropriate Document permissions if none were assigned yet.
 */
export function migrateEmployeesDocPermissions(employees: Employee[]): {
  employees: Employee[];
  changed: boolean;
} {
  let changed = false;
  const migrated = employees.map((emp) => {
    const perms = Array.isArray(emp.customPermissions) ? emp.customPermissions : [];
    const roleDefaults = getDefaultDocPermissionsForRole(emp.role);
    const hasAnyDocPerm = perms.some((p) => DOC_PERMISSIONS_ALL.includes(p));
    const needsCustomerPerm =
      roleDefaults.includes('manage_customers') && !perms.includes('manage_customers');

    if (hasAnyDocPerm && !needsCustomerPerm) {
      return emp;
    }

    if (roleDefaults.length === 0) {
      return emp;
    }

    changed = true;
    const toAdd = hasAnyDocPerm ? (['manage_customers'] as EmployeePermission[]) : roleDefaults;
    const merged = Array.from(new Set([...perms, ...toAdd]));
    return {
      ...emp,
      customPermissions: merged,
    };
  });
  return { employees: migrated, changed };
}

export function createDefaultDocumentSettings(storeSettings?: Partial<StoreSettings>): DocumentCompanySettings {
  return {
    companyName: storeSettings?.storeName || DEFAULT_SITE_CONFIG.storeName,
    logoDataUrl: '',
    address: storeSettings?.storeAddress || DEFAULT_SITE_CONFIG.address,
    phone: storeSettings?.contactPhone || storeSettings?.whatsappNumber || DEFAULT_SITE_CONFIG.phone,
    email: storeSettings?.contactEmail || DEFAULT_SITE_CONFIG.email,
    rc: storeSettings?.tradeRegisterRC || '16/00-9876543B20',
    nif: storeSettings?.taxNumberNIF || '001916012345678',
    nis: '099816010012345',
    ai: '16102987654',
    bankName: 'BNA / CPA Algérie',
    rib: '001 00605 0300 012345 67',
    defaultTvaRate: 19,
    enableTimbre: false,
    timbreRatePercent: 1,
    timbreMinDZD: 5,
    timbreMaxDZD: 2500,
    customFooterText: 'Merci pour votre confiance — Garantie et SAV certifiés en Algérie.',
    bankDetailsText: 'Règlement par virement bancaire, chèque certifié, CCP/BaridiMob ou espèces.',
    generalTerms:
      'Garantie constructeur applicable selon les conditions générales de vente. Tout matériel doit être vérifié à la réception.',
    prefixes: { ...DOC_TYPE_PREFIX_DEFAULTS },
    counters: {},
  };
}

export function normalizeDocumentSettings(
  raw: Partial<DocumentCompanySettings> | null | undefined,
  storeSettings?: Partial<StoreSettings>
): DocumentCompanySettings {
  const defaults = createDefaultDocumentSettings(storeSettings);
  if (!raw || typeof raw !== 'object') {
    return defaults;
  }
  return {
    ...defaults,
    ...raw,
    prefixes: {
      ...defaults.prefixes,
      ...(raw.prefixes || {}),
    },
    counters: {
      ...(raw.counters || {}),
    },
  };
}

export function formatDZD(amount: number, showDecimals = false): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const formatted = safe.toLocaleString('fr-DZ', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${formatted} DZD`;
}

// ==========================================
// FRENCH AMOUNT IN WORDS (CONVERTER)
// ==========================================
const UNITS = [
  'zéro',
  'un',
  'deux',
  'trois',
  'quatre',
  'cinq',
  'six',
  'sept',
  'huit',
  'neuf',
  'dix',
  'onze',
  'douze',
  'treize',
  'quatorze',
  'quinze',
  'seize',
  'dix-sept',
  'dix-huit',
  'dix-neuf',
];

const TENS = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

function convertBelowHundred(n: number, pluralQuatreVingt = true): string {
  if (n < 20) return UNITS[n];
  const ten = Math.floor(n / 10);
  const unit = n % 10;

  if (ten === 7 || ten === 9) {
    const sub = 10 + unit;
    if (ten === 7 && unit === 1) return 'soixante et onze';
    return `${TENS[ten]}-${UNITS[sub]}`;
  }

  if (ten === 8) {
    if (unit === 0) return pluralQuatreVingt ? 'quatre-vingts' : 'quatre-vingt';
    return `quatre-vingt-${UNITS[unit]}`;
  }

  if (unit === 0) return TENS[ten];
  if (unit === 1) return `${TENS[ten]} et un`;
  return `${TENS[ten]}-${UNITS[unit]}`;
}

function convertBelowThousand(n: number, pluralEnd = true): string {
  if (n < 100) return convertBelowHundred(n, pluralEnd);
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  let result = hundreds === 1 ? 'cent' : `${UNITS[hundreds]} cent`;
  if (rest === 0) {
    if (hundreds > 1 && pluralEnd) result += 's';
    return result;
  }
  return `${result} ${convertBelowHundred(rest, pluralEnd)}`;
}

function integerToFrenchWords(n: number): string {
  const num = Math.floor(Math.abs(n));
  if (num === 0) return 'zéro';

  const parts: string[] = [];
  const milliards = Math.floor(num / 1_000_000_000);
  const millions = Math.floor((num % 1_000_000_000) / 1_000_000);
  const thousands = Math.floor((num % 1_000_000) / 1_000);
  const remainder = num % 1_000;

  if (milliards > 0) {
    parts.push(`${convertBelowThousand(milliards, false)} ${milliards > 1 ? 'milliards' : 'milliard'}`);
  }
  if (millions > 0) {
    parts.push(`${convertBelowThousand(millions, false)} ${millions > 1 ? 'millions' : 'million'}`);
  }
  if (thousands > 0) {
    if (thousands === 1) {
      parts.push('mille');
    } else {
      parts.push(`${convertBelowThousand(thousands, false)} mille`);
    }
  }
  if (remainder > 0) {
    parts.push(convertBelowThousand(remainder, true));
  }

  return parts.join(' ');
}

export function numberToFrenchWordsDZD(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, amount) : 0;
  const rounded = Math.round(safe * 100) / 100;
  const intPart = Math.floor(rounded);
  const decPart = Math.round((rounded - intPart) * 100);

  const intWords = integerToFrenchWords(intPart);
  const capitalized = intWords.charAt(0).toUpperCase() + intWords.slice(1);
  const currency = intPart <= 1 ? 'Dinar Algérien' : 'Dinars Algériens';

  if (decPart > 0) {
    const decWords = integerToFrenchWords(decPart);
    const centimeUnit = decPart === 1 ? 'centime' : 'centimes';
    return `${capitalized} ${currency} et ${decWords} ${centimeUnit}`;
  }

  return `${capitalized} ${currency}`;
}

// ==========================================
// SEQUENTIAL DOCUMENT NUMBERING (UNIQUE PER TYPE & YEAR)
// ==========================================
export function getCounterKey(type: CommercialDocType, year: number): string {
  return `${type}_${year}`;
}

export function generateNextDocumentNumber(
  type: CommercialDocType,
  year: number,
  settings: DocumentCompanySettings,
  existingDocs: CommercialDocument[]
): { number: string; sequenceNumber: number; nextCounterValue: number } {
  const prefix = (settings.prefixes?.[type] || DOC_TYPE_PREFIX_DEFAULTS[type]).toUpperCase().trim();
  const counterKey = getCounterKey(type, year);
  const storedCounter = Number(settings.counters?.[counterKey] || 0);

  const maxExistingSeq = existingDocs
    .filter((d) => d.type === type && d.year === year)
    .reduce((max, d) => {
      const seq = Number(d.sequenceNumber || 0);
      return seq > max ? seq : max;
    }, 0);

  let nextSeq = Math.max(storedCounter, maxExistingSeq) + 1;
  let candidate = `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`;

  // Guarantee zero duplicates even with custom prefix edits
  const usedNumbers = new Set(existingDocs.map((d) => d.number.toUpperCase()));
  while (usedNumbers.has(candidate.toUpperCase())) {
    nextSeq += 1;
    candidate = `${prefix}-${year}-${String(nextSeq).padStart(4, '0')}`;
  }

  return {
    number: candidate,
    sequenceNumber: nextSeq,
    nextCounterValue: nextSeq,
  };
}

// ==========================================
// TOTALS & TIMBRE CALCULATION
// ==========================================
export function normalizeLine(line: Partial<CommercialDocumentLine>): CommercialDocumentLine {
  const quantity = Math.max(0, Number(line.quantity || 0));
  const unitPriceDZD = Math.max(0, Number(line.unitPriceDZD || 0));
  const gross = quantity * unitPriceDZD;
  const discountDZD = Math.min(gross, Math.max(0, Number(line.discountDZD || 0)));
  const lineTotalDZD = Math.round((gross - discountDZD) * 100) / 100;

  return {
    id: line.id || 'line-' + Math.random().toString(36).substring(2, 9),
    productId: line.productId,
    sku: line.sku || '',
    productName: (line.productName || '').trim(),
    description: (line.description || '').trim(),
    quantity,
    unitPriceDZD,
    discountDZD,
    lineTotalDZD,
  };
}

export function recalculateDocumentTotals(params: {
  lines: CommercialDocumentLine[];
  tvaRate: number;
  deliveryFeeDZD: number;
  applyTimbre: boolean;
  settings: DocumentCompanySettings;
  type: CommercialDocType;
  paymentAmountDZD?: number;
}) {
  const normalizedLines = params.lines.map(normalizeLine);
  const subtotalDZD = normalizedLines.reduce((sum, l) => sum + l.quantity * l.unitPriceDZD, 0);
  const discountTotalDZD = normalizedLines.reduce((sum, l) => sum + l.discountDZD, 0);
  const netHtDZD = Math.max(0, subtotalDZD - discountTotalDZD);

  const safeTvaRate = Math.max(0, Math.min(100, Number(params.tvaRate || 0)));
  const tvaAmountDZD = Math.round(((netHtDZD * safeTvaRate) / 100) * 100) / 100;
  const deliveryFeeDZD = Math.max(0, Number(params.deliveryFeeDZD || 0));

  const baseBeforeTimbre = netHtDZD + tvaAmountDZD + deliveryFeeDZD;

  let timbreAmountDZD = 0;
  if (params.applyTimbre && params.type !== 'receipt' && baseBeforeTimbre > 0) {
    const rate = Math.max(0, Number(params.settings.timbreRatePercent || 0));
    const minT = Math.max(0, Number(params.settings.timbreMinDZD || 0));
    const maxT = Math.max(minT, Number(params.settings.timbreMaxDZD || 2500));
    if (rate > 0) {
      const rawTimbre = Math.ceil((baseBeforeTimbre * rate) / 100);
      timbreAmountDZD = Math.min(maxT, Math.max(minT, rawTimbre));
    }
  }

  let totalDZD = Math.round((baseBeforeTimbre + timbreAmountDZD) * 100) / 100;
  if (params.type === 'receipt' && typeof params.paymentAmountDZD === 'number') {
    totalDZD = Math.max(0, Math.round(params.paymentAmountDZD * 100) / 100);
  }

  return {
    lines: normalizedLines,
    subtotalDZD,
    discountTotalDZD,
    netHtDZD,
    tvaRate: safeTvaRate,
    tvaAmountDZD,
    timbreAmountDZD,
    deliveryFeeDZD,
    totalDZD,
  };
}

// ==========================================
// FACTURE PAYMENT RECONCILIATION
// ==========================================
/**
 * Recalculates `amountPaidDZD`, `remainingAmountDZD`, and `status` (`issued` | `partial` | `paid`)
 * for every Facture based on all active (`issued` or `paid`) Receipts linked to it.
 */
export function reconcileFacturesWithReceipts(docs: CommercialDocument[]): CommercialDocument[] {
  const paidByFactureId = new Map<string, number>();

  for (const doc of docs) {
    if (
      doc.type === 'receipt' &&
      doc.linkedFactureId &&
      (doc.status === 'issued' || doc.status === 'paid')
    ) {
      const paidVal = Number(doc.paymentAmountDZD ?? doc.totalDZD ?? 0);
      if (paidVal > 0) {
        paidByFactureId.set(
          doc.linkedFactureId,
          (paidByFactureId.get(doc.linkedFactureId) || 0) + paidVal
        );
      }
    }
  }

  return docs.map((doc) => {
    if (doc.type !== 'facture' || doc.status === 'cancelled' || doc.status === 'draft') {
      return doc;
    }

    const total = Math.max(0, Number(doc.totalDZD || 0));
    const paid = Math.round((paidByFactureId.get(doc.id) || 0) * 100) / 100;
    const remaining = Math.max(0, Math.round((total - paid) * 100) / 100);

    let nextStatus: CommercialDocStatus = 'issued';
    if (total > 0 && remaining === 0) {
      nextStatus = 'paid';
    } else if (paid > 0) {
      nextStatus = 'partial';
    }

    if (
      doc.amountPaidDZD === paid &&
      doc.remainingAmountDZD === remaining &&
      doc.status === nextStatus
    ) {
      return doc;
    }

    return {
      ...doc,
      amountPaidDZD: paid,
      remainingAmountDZD: remaining,
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    };
  });
}

// ==========================================
// VALIDATION (SHARED CLIENT & DATA INTEGRITY)
// ==========================================
export function validateCommercialDocumentInput(
  doc: Partial<CommercialDocument>,
  existingDocs: CommercialDocument[],
  options?: { isEdit?: boolean }
): string[] {
  const errors: string[] = [];

  if (!doc.type || !['bl', 'proforma', 'facture', 'receipt'].includes(doc.type)) {
    errors.push('Type de document invalide.');
  }

  if (!doc.number || !doc.number.trim()) {
    errors.push('Numéro de document requis.');
  } else {
    const duplicate = existingDocs.find(
      (d) => d.id !== doc.id && d.number.toUpperCase() === doc.number!.trim().toUpperCase()
    );
    if (duplicate) {
      errors.push(`Le numéro ${doc.number} existe déjà (doublon interdit).`);
    }
  }

  if (!doc.date || !/^\d{4}-\d{2}-\d{2}/.test(doc.date)) {
    errors.push('Date du document invalide.');
  }

  if (!doc.customer?.name || !doc.customer.name.trim()) {
    errors.push('Le nom du client est obligatoire.');
  }

  if (!doc.customer?.phone || !doc.customer.phone.trim()) {
    errors.push('Le numéro de téléphone du client est obligatoire.');
  }

  if (doc.type === 'receipt') {
    const payAmt = Number(doc.paymentAmountDZD ?? doc.totalDZD ?? 0);
    if (!Number.isFinite(payAmt) || payAmt <= 0) {
      errors.push('Le montant encaissé du reçu doit être supérieur à 0 DZD.');
    }

    if (!doc.paymentMethod) {
      errors.push('Veuillez sélectionner un mode de paiement.');
    } else if (doc.paymentMethod === 'cheque') {
      if (!doc.paymentMethodDetails?.chequeNumber?.trim()) {
        errors.push('Le numéro de chèque est obligatoire.');
      }
      if (!doc.paymentMethodDetails?.bankName?.trim()) {
        errors.push('Le nom de la banque est obligatoire pour un paiement par chèque.');
      }
    } else if (doc.paymentMethod === 'bank_transfer') {
      if (!doc.paymentMethodDetails?.transferRef?.trim()) {
        errors.push('La référence du virement bancaire est obligatoire.');
      }
      if (!doc.paymentMethodDetails?.bankName?.trim()) {
        errors.push('Le nom de la banque est obligatoire pour un virement.');
      }
    } else if (doc.paymentMethod === 'ccp_baridimob') {
      if (!doc.paymentMethodDetails?.transferRef?.trim() && !doc.paymentMethodDetails?.ccpAccount?.trim()) {
        errors.push('Veuillez indiquer le N° CCP ou la référence BaridiMob.');
      }
    } else if (doc.paymentMethod === 'other') {
      if (!doc.paymentMethodDetails?.otherLabel?.trim()) {
        errors.push('Veuillez préciser le libellé du mode de paiement.');
      }
    }

    if (doc.linkedFactureId && doc.status !== 'cancelled') {
      const facture = existingDocs.find((d) => d.id === doc.linkedFactureId && d.type === 'facture');
      if (facture) {
        if (facture.status === 'cancelled') {
          errors.push('Impossible d’émettre un reçu pour une facture annulée.');
        } else {
          const otherReceiptsSum = existingDocs
            .filter(
              (r) =>
                r.type === 'receipt' &&
                r.id !== doc.id &&
                r.linkedFactureId === facture.id &&
                (r.status === 'issued' || r.status === 'paid')
            )
            .reduce((s, r) => s + Number(r.paymentAmountDZD ?? r.totalDZD ?? 0), 0);
          const remainingAllowed = Math.max(0, Math.round((facture.totalDZD - otherReceiptsSum) * 100) / 100);
          if (doc.status !== 'draft' && payAmt > remainingAllowed + 0.01) {
            errors.push(
              `Le montant (${formatDZD(payAmt)}) dépasse le solde restant de la facture (${formatDZD(remainingAllowed)}).`
            );
          }
        }
      }
    }
  } else {
    const lines = Array.isArray(doc.lines) ? doc.lines : [];
    if (lines.length === 0) {
      errors.push('Le document doit contenir au moins une ligne de produit/service.');
    } else {
      lines.forEach((line, idx) => {
        if (!line.productName || !line.productName.trim()) {
          errors.push(`Ligne ${idx + 1} : le libellé du produit est requis.`);
        }
        if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
          errors.push(`Ligne ${idx + 1} : la quantité doit être supérieure à 0.`);
        }
        if (!Number.isFinite(line.unitPriceDZD) || line.unitPriceDZD < 0) {
          errors.push(`Ligne ${idx + 1} : le prix unitaire ne peut pas être négatif.`);
        }
        if (!Number.isFinite(line.discountDZD) || line.discountDZD < 0) {
          errors.push(`Ligne ${idx + 1} : la remise ne peut pas être négative.`);
        }
      });
    }

    if (doc.type === 'proforma' && doc.validityDate && doc.date && doc.validityDate < doc.date) {
      errors.push('La date de validité doit être postérieure ou égale à la date du devis.');
    }
  }

  if (options?.isEdit && doc.id) {
    const previous = existingDocs.find((d) => d.id === doc.id);
    if (previous && previous.status !== 'draft') {
      errors.push(
        `Le document ${previous.number} est déjà émis/traité et ne peut pas être modifié. Veuillez l'annuler et réémettre un nouveau document.`
      );
    }
  }

  return errors;
}

// ==========================================
// ORDER / CONVERSION BUILDERS
// ==========================================
export function buildDraftFromOrder(
  order: Order,
  type: CommercialDocType,
  settings: DocumentCompanySettings,
  existingDocs: CommercialDocument[],
  employee?: Employee | null
): Omit<CommercialDocument, 'id' | 'number' | 'sequenceNumber' | 'year' | 'createdAt'> {
  const today = new Date().toISOString().slice(0, 10);
  const validity = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

  const lines: CommercialDocumentLine[] = order.items.map((item, idx) =>
    normalizeLine({
      id: `ord-line-${idx}-${Date.now()}`,
      productId: item.productId,
      sku: item.sku,
      productName: item.name,
      description: item.sku ? `Réf SKU: ${item.sku}` : '',
      quantity: item.quantity,
      unitPriceDZD: item.priceDZD,
      discountDZD: 0,
    })
  );

  // If the order items sum already includes everything, start TVA at 0% for exact order parity unless tax mode desired, or use configured default
  // Actually use 0% when importing B2C storefront order if total matches, or defaultTvaRate when desired — let's use settings.defaultTvaRate?
  // Wait: Storefront prices in Algeria are TTC (All taxes included). If we add 19% on top of an Order's price, the total would differ from order.totalDZD unless toggled!
  // Let's default TVA to settings.defaultTvaRate ONLY for scratch Facture/Proforma, or 0% if order-based? Wait: user specifically said:
  // "TVA (configurable, can be 0%), delivery fee, total, notes."
  // Let's keep tvaRate = 0 when auto-filling from an existing storefront Order (since storefront prices are already net à payer matching order.totalDZD) with the TVA selector right there to switch to 19% / 9% if needed, OR use settings.defaultTvaRate for new scratch documents! Let's make that super intuitive.
  const tvaRate = 0;

  const totals = recalculateDocumentTotals({
    lines,
    tvaRate,
    deliveryFeeDZD: order.deliveryFeeDZD || 0,
    applyTimbre: false,
    settings,
    type,
    paymentAmountDZD: type === 'receipt' ? order.totalDZD : undefined,
  });

  // Auto-detect if there's already an issued Facture for this order
  const existingFacture = existingDocs.find(
    (d) => d.type === 'facture' && d.orderId === order.id && d.status !== 'cancelled'
  );

  return {
    type,
    date: today,
    status: 'draft',
    orderId: order.id,
    linkedFactureId: type === 'bl' || type === 'receipt' ? existingFacture?.id : undefined,
    linkedFactureNumber: type === 'bl' || type === 'receipt' ? existingFacture?.number : undefined,
    customer: {
      name: order.customerName,
      phone: order.customerPhone,
      address: order.address,
      wilayaCode: order.wilaya.code,
      wilayaNameFr: order.wilaya.nameFr,
      wilayaNameAr: order.wilaya.nameAr,
      communeNameFr: order.commune?.nameFr,
      communeNameAr: order.commune?.nameAr,
    },
    lines: totals.lines,
    subtotalDZD: totals.subtotalDZD,
    discountTotalDZD: totals.discountTotalDZD,
    netHtDZD: totals.netHtDZD,
    tvaRate: totals.tvaRate,
    tvaAmountDZD: totals.tvaAmountDZD,
    applyTimbre: false,
    timbreRatePercent: settings.timbreRatePercent,
    timbreAmountDZD: totals.timbreAmountDZD,
    deliveryFeeDZD: totals.deliveryFeeDZD,
    totalDZD: totals.totalDZD,
    notes: order.notes || '',
    blShowPrices: type === 'bl' ? true : undefined,
    deliveryCompanyId: type === 'bl' ? order.deliveryCompanyId : undefined,
    deliveryCompanyName: type === 'bl' ? order.deliveryCompanyName : undefined,
    deliveryMethod: type === 'bl' ? order.deliveryMethod : undefined,
    trackingNumber: type === 'bl' ? order.shippingTrackingNumber : undefined,
    validityDate: type === 'proforma' ? validity : undefined,
    paymentTerms: type === 'facture' ? 'Paiement comptant à la livraison / réception' : undefined,
    amountPaidDZD: type === 'facture' ? 0 : undefined,
    remainingAmountDZD: type === 'facture' ? totals.totalDZD : undefined,
    paymentMethod: type === 'receipt' ? 'cash' : undefined,
    paymentMethodDetails: type === 'receipt' ? {} : undefined,
    paymentAmountDZD: type === 'receipt' ? totals.totalDZD : undefined,
    createdBy: employee?.name || 'Administrateur',
    createdByEmployeeId: employee?.id,
  };
}

export function buildConvertedDraft(
  source: CommercialDocument,
  targetType: CommercialDocType,
  settings: DocumentCompanySettings,
  employee?: Employee | null
): Omit<CommercialDocument, 'id' | 'number' | 'sequenceNumber' | 'year' | 'createdAt'> {
  const today = new Date().toISOString().slice(0, 10);
  const validity = new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10);

  const linesCopy = source.lines.map((l) => ({
    ...l,
    id: 'line-' + Math.random().toString(36).substring(2, 9),
  }));

  const remainingToPay =
    source.type === 'facture'
      ? Math.max(0, Number(source.remainingAmountDZD ?? source.totalDZD))
      : source.totalDZD;

  const isFromFacture = source.type === 'facture';
  const totals = recalculateDocumentTotals({
    lines: linesCopy,
    tvaRate: source.tvaRate,
    deliveryFeeDZD: source.deliveryFeeDZD,
    applyTimbre: Boolean(source.applyTimbre),
    settings,
    type: targetType,
    paymentAmountDZD: targetType === 'receipt' ? remainingToPay : undefined,
  });

  return {
    type: targetType,
    date: today,
    status: 'draft',
    orderId: source.orderId,
    sourceDocumentId: source.id,
    sourceDocumentNumber: source.number,
    linkedFactureId:
      isFromFacture && (targetType === 'bl' || targetType === 'receipt')
        ? source.id
        : source.linkedFactureId,
    linkedFactureNumber:
      isFromFacture && (targetType === 'bl' || targetType === 'receipt')
        ? source.number
        : source.linkedFactureNumber,
    customer: { ...source.customer },
    lines: totals.lines,
    subtotalDZD: totals.subtotalDZD,
    discountTotalDZD: totals.discountTotalDZD,
    netHtDZD: totals.netHtDZD,
    tvaRate: totals.tvaRate,
    tvaAmountDZD: totals.tvaAmountDZD,
    applyTimbre: Boolean(source.applyTimbre),
    timbreRatePercent: source.timbreRatePercent ?? settings.timbreRatePercent,
    timbreAmountDZD: totals.timbreAmountDZD,
    deliveryFeeDZD: totals.deliveryFeeDZD,
    totalDZD: totals.totalDZD,
    notes: source.notes || '',
    blShowPrices: targetType === 'bl' ? true : undefined,
    deliveryCompanyId: targetType === 'bl' ? source.deliveryCompanyId : undefined,
    deliveryCompanyName: targetType === 'bl' ? source.deliveryCompanyName : undefined,
    deliveryMethod: targetType === 'bl' ? source.deliveryMethod || 'home' : undefined,
    trackingNumber: targetType === 'bl' ? source.trackingNumber : undefined,
    validityDate: targetType === 'proforma' ? validity : undefined,
    paymentTerms:
      targetType === 'facture'
        ? source.paymentTerms || 'Paiement à la réception de la facture'
        : undefined,
    amountPaidDZD: targetType === 'facture' ? 0 : undefined,
    remainingAmountDZD: targetType === 'facture' ? totals.totalDZD : undefined,
    paymentMethod: targetType === 'receipt' ? 'cash' : undefined,
    paymentMethodDetails: targetType === 'receipt' ? {} : undefined,
    paymentAmountDZD: targetType === 'receipt' ? remainingToPay : undefined,
    createdBy: employee?.name || 'Administrateur',
    createdByEmployeeId: employee?.id,
  };
}

// ==========================================
// LABELS (FR / AR)
// ==========================================
export function getDocTypeLabel(type: CommercialDocType, lang: Language): string {
  const map: Record<CommercialDocType, { fr: string; ar: string }> = {
    bl: { fr: 'Bon de livraison', ar: 'وصل تسليم (BL)' },
    proforma: { fr: 'Facture proforma', ar: 'فاتورة أولية (Proforma)' },
    facture: { fr: 'Facture', ar: 'فاتورة رسمية' },
    receipt: { fr: 'Reçu de paiement', ar: 'وصل دفع' },
  };
  return lang === 'ar' ? map[type].ar : map[type].fr;
}

export function getDocStatusLabel(status: CommercialDocStatus, lang: Language): string {
  const map: Record<CommercialDocStatus, { fr: string; ar: string }> = {
    draft: { fr: 'Brouillon', ar: 'مسودة' },
    issued: { fr: 'Émis(e)', ar: 'صادر' },
    partial: { fr: 'Partiellement payée', ar: 'مدفوعة جزئياً' },
    paid: { fr: 'Payé(e)', ar: 'مدفوعة' },
    cancelled: { fr: 'Annulé(e)', ar: 'ملغى' },
    prepared: { fr: 'Préparé', ar: 'مُجهّز' },
    delivered: { fr: 'Livré', ar: 'مُسلّم' },
    returned: { fr: 'Retourné', ar: 'مُسترجع' },
  };
  return lang === 'ar' ? map[status].ar : map[status].fr;
}

export function getPaymentMethodLabel(method: ReceiptPaymentMethod | undefined, lang: Language): string {
  if (!method) return '-';
  const map: Record<ReceiptPaymentMethod, { fr: string; ar: string }> = {
    cash: { fr: 'Espèces (Cash)', ar: 'نقداً (Espèces)' },
    cheque: { fr: 'Chèque bancaire', ar: 'شيك بنكي' },
    bank_transfer: { fr: 'Virement bancaire', ar: 'تحويل بنكي' },
    ccp_baridimob: { fr: 'CCP / BaridiMob', ar: 'بريدي موب / CCP' },
    other: { fr: 'Autre moyen', ar: 'طريقة أخرى' },
  };
  return lang === 'ar' ? map[method].ar : map[method].fr;
}

// ==========================================
// CSV / EXCEL EXPORT (SANITIZED)
// ==========================================
function sanitizeCsvCell(value: unknown): string {
  const str = String(value ?? '');
  const trimmed = str.replace(/\r?\n/g, ' ');
  const safe = /^[=+\-@]/.test(trimmed) ? `'${trimmed}` : trimmed;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function exportDocumentsToCsv(
  docs: CommercialDocument[],
  filenamePrefix: string,
  lang: Language
): void {
  const headers = [
    'Numéro',
    'Type',
    'Date',
    'Statut',
    'Client',
    'Téléphone',
    'Wilaya',
    'Commande liée',
    'Document source / Facture',
    'Sous-total HT (DZD)',
    'Remise (DZD)',
    'TVA (%)',
    'TVA (DZD)',
    'Timbre (DZD)',
    'Livraison (DZD)',
    'Total TTC (DZD)',
    'Payé (DZD)',
    'Reste à payer (DZD)',
    'Mode paiement',
    'Créé par',
  ];

  const rows = docs.map((d) => [
    d.number,
    getDocTypeLabel(d.type, lang),
    d.date,
    getDocStatusLabel(d.status, lang),
    d.customer.name,
    d.customer.phone,
    d.customer.wilayaNameFr || '',
    d.orderId || '',
    d.linkedFactureNumber || d.sourceDocumentNumber || '',
    d.netHtDZD,
    d.discountTotalDZD,
    d.tvaRate,
    d.tvaAmountDZD,
    d.timbreAmountDZD,
    d.deliveryFeeDZD,
    d.totalDZD,
    d.type === 'facture' ? d.amountPaidDZD ?? 0 : d.type === 'receipt' ? d.paymentAmountDZD ?? d.totalDZD : '',
    d.type === 'facture' ? d.remainingAmountDZD ?? d.totalDZD : '',
    d.type === 'receipt' ? getPaymentMethodLabel(d.paymentMethod, lang) : '',
    d.createdBy,
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.map(sanitizeCsvCell).join(';'), ...rows.map((r) => r.map(sanitizeCsvCell).join(';'))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ==========================================
// SHAREABLE LINK & WHATSAPP MESSAGE BUILDER
// ==========================================
export function buildWhatsAppDocumentMessage(
  doc: CommercialDocument,
  company: DocumentCompanySettings,
  lang: Language
): string {
  const title = getDocTypeLabel(doc.type, lang).toUpperCase();
  const linesText = doc.lines
    .map((l) => {
      if (doc.type === 'bl' && doc.blShowPrices === false) {
        return `• ${l.productName} x${l.quantity}`;
      }
      return `• ${l.productName} x${l.quantity} = ${formatDZD(l.lineTotalDZD)}`;
    })
    .join('\n');

  if (lang === 'ar') {
    return [
      `*${company.companyName}*`,
      `*${title} رقم : ${doc.number}*`,
      `التاريخ : ${doc.date}`,
      `الحالة : ${getDocStatusLabel(doc.status, 'ar')}`,
      `الزبون : ${doc.customer.name} (${doc.customer.phone})`,
      doc.customer.wilayaNameAr ? `الوجهة : ${doc.customer.wilayaNameAr} - ${doc.customer.address}` : '',
      doc.type === 'proforma' ? `صالح إلى غاية : ${doc.validityDate || '-'} (وثيقة غير ضريبية)` : '',
      linesText ? `\n*التفاصيل :*\n${linesText}` : '',
      doc.type === 'bl' && doc.blShowPrices === false ? '' : `\n*المبلغ الإجمالي :* ${formatDZD(doc.totalDZD)}`,
      doc.type === 'facture'
        ? `المدفوع : ${formatDZD(doc.amountPaidDZD || 0)} | المتبقي : ${formatDZD(doc.remainingAmountDZD ?? doc.totalDZD)}`
        : '',
      doc.type === 'receipt'
        ? `طريقة الدفع : ${getPaymentMethodLabel(doc.paymentMethod, 'ar')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  }

  return [
    `*${company.companyName}*`,
    `*${title} N° ${doc.number}*`,
    `Date : ${doc.date}`,
    `Statut : ${getDocStatusLabel(doc.status, 'fr')}`,
    `Client : ${doc.customer.name} (${doc.customer.phone})`,
    doc.customer.wilayaNameFr ? `Adresse : ${doc.customer.address} (${doc.customer.wilayaNameFr})` : '',
    doc.type === 'proforma' ? `Validité : ${doc.validityDate || '-'} (Ce document n'est pas une facture fiscale)` : '',
    linesText ? `\n*Détails :*\n${linesText}` : '',
    doc.type === 'bl' && doc.blShowPrices === false
      ? ''
      : `\n*Montant Total :* ${formatDZD(doc.totalDZD)}\n(${numberToFrenchWordsDZD(doc.totalDZD)})`,
    doc.type === 'facture'
      ? `Payé : ${formatDZD(doc.amountPaidDZD || 0)} | Reste à payer : ${formatDZD(doc.remainingAmountDZD ?? doc.totalDZD)}`
      : '',
    doc.type === 'receipt' ? `Mode de paiement : ${getPaymentMethodLabel(doc.paymentMethod, 'fr')}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildDocumentShareLink(doc: CommercialDocument): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('doc', doc.number);
  return url.toString();
}

// ==========================================
// REAL A4 CLIENT-SIDE PDF DOWNLOAD GENERATOR
// (Works cleanly with Tailwind v4 + Arabic RTL + Custom/SVG Logos)
// ==========================================
function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];
  const lines: string[] = [];
  let current = words[0];
  for (let i = 1; i < words.length; i++) {
    const next = `${current} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
      lines.push(current);
      current = words[i];
    }
  }
  lines.push(current);
  return lines;
}

async function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function getDefaultLogoSvgDataUrl(): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
    <polygon points="50,5 90,26 90,74 50,95 10,74 10,26" stroke="#008CFF" stroke-width="3" fill="#080F1C"/>
    <rect x="26" y="27" width="48" height="32" rx="4" stroke="#00D4FF" stroke-width="3" fill="#050505"/>
    <path d="M33 43L45 35L55 45L67 37" stroke="#00D4FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M19 63L23 69H77L81 63H19Z" fill="#008CFF"/>
    <rect x="42" y="65" width="16" height="2" rx="1" fill="#FFFFFF"/>
    <path d="M48 18L62 18L52 27L48 18Z" fill="#00D4FF"/>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

function buildMultiPagePdfFromJpegs(
  pages: Array<{ jpegBytes: Uint8Array; widthPx: number; heightPx: number }>
): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  let offset = 0;
  const offsets: number[] = [0]; // 1-based object numbers

  const pushStr = (s: string) => {
    const b = encoder.encode(s);
    chunks.push(b);
    offset += b.length;
  };
  const pushBytes = (b: Uint8Array) => {
    chunks.push(b);
    offset += b.length;
  };

  pushStr('%PDF-1.4\n');

  // Object numbering:
  // 1 = Catalog
  // 2 = Pages
  // For each page i (0..N-1):
  //   pageObj = 3 + i*3
  //   contentObj = 4 + i*3
  //   imageObj = 5 + i*3
  const pageCount = pages.length;
  const pageIds = pages.map((_, i) => 3 + i * 3);

  // Obj 1: Catalog
  offsets[1] = offset;
  pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // Obj 2: Pages
  offsets[2] = offset;
  pushStr(`2 0 obj\n<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>\nendobj\n`);

  const ptWidth = 595.28;
  const ptHeight = 841.89;

  pages.forEach((p, i) => {
    const pageId = 3 + i * 3;
    const contentId = 4 + i * 3;
    const imageId = 5 + i * 3;

    offsets[pageId] = offset;
    pushStr(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${ptWidth} ${ptHeight}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>\nendobj\n`
    );

    const contentStream = `q ${ptWidth} 0 0 ${ptHeight} 0 0 cm /Im0 Do Q\n`;
    offsets[contentId] = offset;
    pushStr(
      `${contentId} 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
    );

    offsets[imageId] = offset;
    pushStr(
      `${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${p.widthPx} /Height ${p.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpegBytes.length} >>\nstream\n`
    );
    pushBytes(p.jpegBytes);
    pushStr('\nendstream\nendobj\n');
  });

  const xrefOffset = offset;
  const totalObjs = 2 + pageCount * 3;
  pushStr(`xref\n0 ${totalObjs + 1}\n0000000000 65535 f \n`);
  for (let i = 1; i <= totalObjs; i++) {
    pushStr(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  }
  pushStr(`trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);

  return new Blob(chunks as unknown as BlobPart[], { type: 'application/pdf' });
}

export async function downloadCommercialDocumentPdf(
  doc: CommercialDocument,
  company: DocumentCompanySettings,
  lang: Language,
  accentHex = '#0284c7'
): Promise<void> {
  const W = 1240;
  const H = 1754;
  const M = 64;
  const isRtl = lang === 'ar';
  const showPrices = doc.type !== 'bl' || doc.blShowPrices !== false;

  const fontFamily = isRtl
    ? '"IBM Plex Sans Arabic", "Segoe UI", Tahoma, Arial, sans-serif'
    : '"Plus Jakarta Sans", "Segoe UI", Arial, sans-serif';

  const pages: Array<{ jpegBytes: Uint8Array; widthPx: number; heightPx: number }> = [];

  const createCanvasPage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    return { canvas, ctx };
  };

  const logoImg = await loadImageElement(company.logoDataUrl || getDefaultLogoSvgDataUrl());

  let { canvas, ctx } = createCanvasPage();
  let y = 58;

  const startNewPage = () => {
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    pages.push({
      jpegBytes: base64ToUint8Array(dataUrl.split(',')[1]),
      widthPx: W,
      heightPx: H,
    });
    const next = createCanvasPage();
    canvas = next.canvas;
    ctx = next.ctx;
    y = 64;
  };

  // Top accent bar
  ctx.fillStyle = accentHex;
  ctx.fillRect(0, 0, W, 14);

  // Header Logo & Company Info
  const logoX = isRtl ? W - M - 88 : M;
  if (logoImg) {
    ctx.drawImage(logoImg, logoX, y, 88, 88);
  }

  const companyTextX = isRtl ? W - M - 106 : M + 106;
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.fillStyle = '#0f172a';
  ctx.font = `800 28px ${fontFamily}`;
  ctx.fillText(company.companyName || 'TOP LAPTOP ALGERIE', companyTextX, y + 26);

  ctx.fillStyle = '#475569';
  ctx.font = `500 17px ${fontFamily}`;
  ctx.fillText(company.address || '', companyTextX, y + 52);
  ctx.fillText(`Tél: ${company.phone || ''}  |  Email: ${company.email || ''}`, companyTextX, y + 76);

  if (doc.type === 'facture' || doc.type === 'proforma') {
    ctx.fillStyle = '#64748b';
    ctx.font = `500 15px ${fontFamily}`;
    ctx.fillText(
      `RC: ${company.rc || '-'} | NIF: ${company.nif || '-'} | NIS: ${company.nis || '-'} | AI: ${company.ai || '-'}`,
      companyTextX,
      y + 100
    );
  }

  // Document Badge & Number (opposite side)
  const badgeX = isRtl ? M : W - M;
  ctx.textAlign = isRtl ? 'left' : 'right';
  const docTitle = getDocTypeLabel(doc.type, lang).toUpperCase();
  ctx.font = `800 26px ${fontFamily}`;
  ctx.fillStyle = accentHex;
  ctx.fillText(docTitle, badgeX, y + 28);

  ctx.fillStyle = '#0f172a';
  ctx.font = `800 24px monospace`;
  ctx.fillText(doc.number, badgeX, y + 60);

  ctx.fillStyle = '#475569';
  ctx.font = `600 17px ${fontFamily}`;
  ctx.fillText(
    `${isRtl ? 'التاريخ:' : 'Date :'} ${doc.date}  |  ${getDocStatusLabel(doc.status, lang)}`,
    badgeX,
    y + 88
  );

  if (doc.type === 'proforma' && doc.validityDate) {
    ctx.fillText(`${isRtl ? 'صالح إلى:' : 'Validité :'} ${doc.validityDate}`, badgeX, y + 112);
  }
  if (doc.orderId) {
    ctx.fillText(`${isRtl ? 'الطلب:' : 'Commande :'} ${doc.orderId}`, badgeX, y + 136);
  }

  y += 160;
  ctx.strokeStyle = accentHex;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(M, y);
  ctx.lineTo(W - M, y);
  ctx.stroke();

  y += 26;

  // Proforma Legal Warning Banner
  if (doc.type === 'proforma') {
    ctx.fillStyle = '#fef3c7';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.fillRect(M, y, W - M * 2, 42);
    ctx.strokeRect(M, y, W - M * 2, 42);
    ctx.fillStyle = '#92400e';
    ctx.font = `700 17px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.fillText(
      isRtl
        ? 'تنبيه : هذه فاتورة أولية (Proforma) ولا تعتبر فاتورة ضريبية.'
        : "MENTION LÉGALE : Document Proforma — Ce document n'est pas une facture fiscale.",
      W / 2,
      y + 27
    );
    y += 58;
  }

  // Customer & Meta Boxes
  const boxGap = 24;
  const boxW = (W - M * 2 - boxGap) / 2;
  const boxH = 148;
  const leftBoxX = M;
  const rightBoxX = M + boxW + boxGap;

  const clientBoxX = isRtl ? rightBoxX : leftBoxX;
  const metaBoxX = isRtl ? leftBoxX : rightBoxX;

  ctx.fillStyle = '#f8fafc';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.fillRect(clientBoxX, y, boxW, boxH);
  ctx.strokeRect(clientBoxX, y, boxW, boxH);

  ctx.fillRect(metaBoxX, y, boxW, boxH);
  ctx.strokeRect(metaBoxX, y, boxW, boxH);

  // Fill Client Box
  ctx.textAlign = isRtl ? 'right' : 'left';
  const cPadX = isRtl ? clientBoxX + boxW - 18 : clientBoxX + 18;
  ctx.fillStyle = accentHex;
  ctx.font = `700 15px ${fontFamily}`;
  ctx.fillText(isRtl ? 'معلومات الزبون (CLIENT)' : 'CLIENT / DESTINATAIRE', cPadX, y + 26);

  ctx.fillStyle = '#0f172a';
  ctx.font = `800 20px ${fontFamily}`;
  ctx.fillText(doc.customer.name || '-', cPadX, y + 54);

  ctx.fillStyle = '#334155';
  ctx.font = `500 16px ${fontFamily}`;
  ctx.fillText(`${isRtl ? 'الهاتف:' : 'Tél :'} ${doc.customer.phone || '-'}`, cPadX, y + 80);
  const wilayaText = isRtl
    ? doc.customer.wilayaNameAr || doc.customer.wilayaNameFr || ''
    : doc.customer.wilayaNameFr || '';
  const addrStr = [doc.customer.address, doc.customer.communeNameFr, wilayaText].filter(Boolean).join(', ');
  const addrLines = wrapCanvasText(ctx, addrStr || '-', boxW - 36).slice(0, 2);
  addrLines.forEach((line, idx) => {
    ctx.fillText(line, cPadX, y + 104 + idx * 20);
  });
  if (doc.customer.nif || doc.customer.rc) {
    ctx.fillStyle = '#64748b';
    ctx.font = `500 14px ${fontFamily}`;
    ctx.fillText(`RC: ${doc.customer.rc || '-'} | NIF: ${doc.customer.nif || '-'}`, cPadX, y + 140);
  }

  // Fill Meta Box
  const mPadX = isRtl ? metaBoxX + boxW - 18 : metaBoxX + 18;
  ctx.fillStyle = accentHex;
  ctx.font = `700 15px ${fontFamily}`;
  ctx.fillText(
    doc.type === 'bl'
      ? isRtl
        ? 'تفاصيل الشحن والتسليم'
        : 'EXPÉDITION & LIVRAISON'
      : doc.type === 'receipt'
      ? isRtl
        ? 'تفاصيل الدفع المستلم'
        : 'DÉTAILS DU PAIEMENT'
      : isRtl
      ? 'معلومات المستند والبنك'
      : 'CONDITIONS & RÉFÉRENCES',
    mPadX,
    y + 26
  );

  ctx.fillStyle = '#1e293b';
  ctx.font = `600 16px ${fontFamily}`;
  if (doc.type === 'bl') {
    ctx.fillText(
      `${isRtl ? 'شركة التوصيل:' : 'Transporteur :'} ${doc.deliveryCompanyName || '-'}`,
      mPadX,
      y + 56
    );
    ctx.fillText(
      `${isRtl ? 'نوع التوصيل:' : 'Mode :'} ${doc.deliveryMethod === 'stopdesk' ? 'Stop Desk' : 'À Domicile'}`,
      mPadX,
      y + 82
    );
    ctx.fillText(
      `${isRtl ? 'رقم التتبع:' : 'Tracking :'} ${doc.trackingNumber || '-'}`,
      mPadX,
      y + 108
    );
    if (doc.linkedFactureNumber) {
      ctx.fillText(`Facture liée : ${doc.linkedFactureNumber}`, mPadX, y + 134);
    }
  } else if (doc.type === 'receipt') {
    ctx.fillText(
      `${isRtl ? 'طريقة الدفع:' : 'Mode :'} ${getPaymentMethodLabel(doc.paymentMethod, lang)}`,
      mPadX,
      y + 56
    );
    if (doc.paymentMethodDetails?.bankName) {
      ctx.fillText(`${isRtl ? 'البنك:' : 'Banque :'} ${doc.paymentMethodDetails.bankName}`, mPadX, y + 82);
    }
    if (doc.paymentMethodDetails?.chequeNumber) {
      ctx.fillText(`N° Chèque : ${doc.paymentMethodDetails.chequeNumber}`, mPadX, y + 108);
    } else if (doc.paymentMethodDetails?.transferRef) {
      ctx.fillText(`Réf Virement : ${doc.paymentMethodDetails.transferRef}`, mPadX, y + 108);
    } else if (doc.paymentMethodDetails?.ccpAccount) {
      ctx.fillText(`CCP/BaridiMob : ${doc.paymentMethodDetails.ccpAccount}`, mPadX, y + 108);
    }
    if (doc.linkedFactureNumber) {
      ctx.fillText(`${isRtl ? 'الفاتورة المرتبطة:' : 'Facture :'} ${doc.linkedFactureNumber}`, mPadX, y + 134);
    }
  } else {
    ctx.fillText(
      `${isRtl ? 'شروط الدفع:' : 'Règlement :'} ${doc.paymentTerms || 'À réception'}`,
      mPadX,
      y + 56
    );
    ctx.fillText(`${isRtl ? 'البنك:' : 'Banque :'} ${company.bankName || '-'}`, mPadX, y + 82);
    ctx.fillText(`RIB : ${company.rib || '-'}`, mPadX, y + 108);
    if (doc.sourceDocumentNumber || doc.orderId) {
      ctx.fillText(
        `${isRtl ? 'المصدر:' : 'Réf Source :'} ${doc.sourceDocumentNumber || doc.orderId}`,
        mPadX,
        y + 134
      );
    }
  }

  y += boxH + 28;

  // Table Header
  if (doc.lines.length > 0 && doc.type !== 'receipt') {
    const drawTableHeader = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(M, y, W - M * 2, 42);
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 15px ${fontFamily}`;

      if (showPrices) {
        if (isRtl) {
          ctx.textAlign = 'right';
          ctx.fillText('المنتج والوصف', W - M - 14, y + 27);
          ctx.textAlign = 'center';
          ctx.fillText('الكمية', M + 430, y + 27);
          ctx.textAlign = 'left';
          ctx.fillText('سعر الوحدة', M + 255, y + 27);
          ctx.fillText('التخفيض', M + 150, y + 27);
          ctx.fillText('المجموع', M + 14, y + 27);
        } else {
          ctx.textAlign = 'left';
          ctx.fillText('Désignation / Description', M + 14, y + 27);
          ctx.textAlign = 'center';
          ctx.fillText('Qté', W - M - 410, y + 27);
          ctx.textAlign = 'right';
          ctx.fillText('P.U (DZD)', W - M - 260, y + 27);
          ctx.fillText('Remise', W - M - 140, y + 27);
          ctx.fillText('Total HT', W - M - 14, y + 27);
        }
      } else {
        if (isRtl) {
          ctx.textAlign = 'right';
          ctx.fillText('المنتج والوصف', W - M - 14, y + 27);
          ctx.textAlign = 'left';
          ctx.fillText('الكمية المسلمة', M + 20, y + 27);
        } else {
          ctx.textAlign = 'left';
          ctx.fillText('Désignation / Description', M + 14, y + 27);
          ctx.textAlign = 'right';
          ctx.fillText('Quantité livrée', W - M - 20, y + 27);
        }
      }
      y += 42;
    };

    drawTableHeader();

    for (let idx = 0; idx < doc.lines.length; idx++) {
      const l = doc.lines[idx];
      const rowH = l.description ? 58 : 42;
      if (y + rowH > H - 300) {
        startNewPage();
        drawTableHeader();
      }

      ctx.fillStyle = idx % 2 === 1 ? '#f8fafc' : '#ffffff';
      ctx.fillRect(M, y, W - M * 2, rowH);
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(M, y + rowH);
      ctx.lineTo(W - M, y + rowH);
      ctx.stroke();

      ctx.fillStyle = '#0f172a';
      ctx.font = `700 16px ${fontFamily}`;

      if (showPrices) {
        if (isRtl) {
          ctx.textAlign = 'right';
          ctx.fillText(l.productName.slice(0, 48), W - M - 14, y + 24);
          if (l.description) {
            ctx.fillStyle = '#64748b';
            ctx.font = `400 13px ${fontFamily}`;
            ctx.fillText(l.description.slice(0, 56), W - M - 14, y + 45);
          }
          ctx.fillStyle = '#0f172a';
          ctx.font = `700 16px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(String(l.quantity), M + 430, y + 26);
          ctx.textAlign = 'left';
          ctx.fillText(l.unitPriceDZD.toLocaleString('fr-DZ'), M + 255, y + 26);
          ctx.fillText(l.discountDZD > 0 ? `-${l.discountDZD.toLocaleString('fr-DZ')}` : '-', M + 150, y + 26);
          ctx.fillText(l.lineTotalDZD.toLocaleString('fr-DZ'), M + 14, y + 26);
        } else {
          ctx.textAlign = 'left';
          ctx.fillText(l.productName.slice(0, 48), M + 14, y + 24);
          if (l.description) {
            ctx.fillStyle = '#64748b';
            ctx.font = `400 13px ${fontFamily}`;
            ctx.fillText(l.description.slice(0, 56), M + 14, y + 45);
          }
          ctx.fillStyle = '#0f172a';
          ctx.font = `700 16px monospace`;
          ctx.textAlign = 'center';
          ctx.fillText(String(l.quantity), W - M - 410, y + 26);
          ctx.textAlign = 'right';
          ctx.fillText(l.unitPriceDZD.toLocaleString('fr-DZ'), W - M - 260, y + 26);
          ctx.fillText(l.discountDZD > 0 ? `-${l.discountDZD.toLocaleString('fr-DZ')}` : '-', W - M - 140, y + 26);
          ctx.fillText(l.lineTotalDZD.toLocaleString('fr-DZ'), W - M - 14, y + 26);
        }
      } else {
        if (isRtl) {
          ctx.textAlign = 'right';
          ctx.fillText(l.productName.slice(0, 62), W - M - 14, y + 24);
          ctx.textAlign = 'left';
          ctx.font = `800 18px monospace`;
          ctx.fillText(`${l.quantity}`, M + 20, y + 26);
        } else {
          ctx.textAlign = 'left';
          ctx.fillText(l.productName.slice(0, 62), M + 14, y + 24);
          ctx.textAlign = 'right';
          ctx.font = `800 18px monospace`;
          ctx.fillText(`${l.quantity}`, W - M - 20, y + 26);
        }
      }

      y += rowH;
    }
  } else if (doc.type === 'receipt') {
    // Receipt Amount Banner
    ctx.fillStyle = '#ecfdf5';
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.fillRect(M, y, W - M * 2, 110);
    ctx.strokeRect(M, y, W - M * 2, 110);

    ctx.textAlign = 'center';
    ctx.fillStyle = '#065f46';
    ctx.font = `700 18px ${fontFamily}`;
    ctx.fillText(
      isRtl ? 'المبلغ المقبوض (Montant Encaissé)' : 'MONTANT REÇU / ENCAISSÉ',
      W / 2,
      y + 36
    );

    ctx.fillStyle = '#047857';
    ctx.font = `900 36px monospace`;
    ctx.fillText(formatDZD(doc.paymentAmountDZD ?? doc.totalDZD), W / 2, y + 84);
    y += 130;
  }

  y += 28;
  if (y > H - 360) {
    startNewPage();
  }

  // Totals Block (if prices shown)
  if (showPrices) {
    const totalsW = 430;
    const totalsX = isRtl ? M : W - M - totalsW;

    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;

    const rows: Array<{ label: string; value: string; bold?: boolean; color?: string }> = [];
    if (doc.type !== 'receipt') {
      rows.push({
        label: isRtl ? 'المجموع الفرعي (HT):' : 'Sous-total HT :',
        value: formatDZD(doc.netHtDZD),
      });
      if (doc.discountTotalDZD > 0) {
        rows.push({
          label: isRtl ? 'إجمالي التخفيض:' : 'Remise totale :',
          value: `-${formatDZD(doc.discountTotalDZD)}`,
          color: '#dc2626',
        });
      }
      rows.push({
        label: `${isRtl ? 'الضريبة TVA' : 'TVA'} (${doc.tvaRate}%) :`,
        value: formatDZD(doc.tvaAmountDZD),
      });
      if (doc.timbreAmountDZD > 0) {
        rows.push({
          label: isRtl ? 'حق الطابع:' : 'Droit de timbre :',
          value: formatDZD(doc.timbreAmountDZD),
        });
      }
      if (doc.deliveryFeeDZD > 0) {
        rows.push({
          label: isRtl ? 'مصاريف التوصيل:' : 'Frais de livraison :',
          value: formatDZD(doc.deliveryFeeDZD),
        });
      }
    }
    rows.push({
      label: isRtl ? 'المبلغ الإجمالي (TTC):' : 'TOTAL TTC :',
      value: formatDZD(doc.totalDZD),
      bold: true,
      color: accentHex,
    });
    if (doc.type === 'facture') {
      rows.push({
        label: isRtl ? 'المبلغ المدفوع:' : 'Montant payé :',
        value: formatDZD(doc.amountPaidDZD || 0),
        color: '#059669',
      });
      rows.push({
        label: isRtl ? 'الباقي للدفع:' : 'Reste à payer :',
        value: formatDZD(doc.remainingAmountDZD ?? doc.totalDZD),
        bold: true,
        color: '#b45309',
      });
    }

    const totBoxH = rows.length * 32 + 24;
    ctx.fillRect(totalsX, y, totalsW, totBoxH);
    ctx.strokeRect(totalsX, y, totalsW, totBoxH);

    rows.forEach((r, idx) => {
      const ry = y + 32 + idx * 32;
      ctx.font = `${r.bold ? '800' : '600'} ${r.bold ? 19 : 16}px ${fontFamily}`;
      ctx.fillStyle = r.color || '#334155';
      if (isRtl) {
        ctx.textAlign = 'right';
        ctx.fillText(r.label, totalsX + totalsW - 18, ry);
        ctx.textAlign = 'left';
        ctx.fillText(r.value, totalsX + 18, ry);
      } else {
        ctx.textAlign = 'left';
        ctx.fillText(r.label, totalsX + 18, ry);
        ctx.textAlign = 'right';
        ctx.fillText(r.value, totalsX + totalsW - 18, ry);
      }
    });

    // Amount in Words on opposite side
    const wordsX = isRtl ? W - M : M;
    const wordsMaxW = W - M * 2 - totalsW - 30;
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillStyle = '#475569';
    ctx.font = `700 15px ${fontFamily}`;
    ctx.fillText(
      isRtl
        ? 'المبلغ الإجمالي بالحروف (بالفرنسية) :'
        : 'Arrêté le présent document à la somme de :',
      wordsX,
      y + 26
    );
    ctx.fillStyle = '#0f172a';
    ctx.font = `800 17px ${fontFamily}`;
    const wordsLines = wrapCanvasText(ctx, numberToFrenchWordsDZD(doc.totalDZD), wordsMaxW);
    wordsLines.forEach((line, i) => {
      ctx.fillText(line, wordsX, y + 54 + i * 24);
    });

    if (doc.notes) {
      ctx.fillStyle = '#64748b';
      ctx.font = `500 14px ${fontFamily}`;
      const notesLines = wrapCanvasText(ctx, `${isRtl ? 'ملاحظات:' : 'Notes :'} ${doc.notes}`, wordsMaxW).slice(0, 3);
      notesLines.forEach((line, i) => {
        ctx.fillText(line, wordsX, y + 114 + i * 20);
      });
    }

    y += Math.max(totBoxH, 165) + 28;
  }

  // Signature & Cachet Area
  const sigGap = 36;
  const sigW = (W - M * 2 - sigGap) / 2;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(M, y, sigW, 130);
  ctx.strokeRect(M + sigW + sigGap, y, sigW, 130);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#334155';
  ctx.font = `700 16px ${fontFamily}`;
  ctx.fillText(
    doc.type === 'bl'
      ? isRtl
        ? 'ختم وإمضاء المرسل / الناقل'
        : 'Cachet & Signature Expéditeur'
      : isRtl
      ? 'الختم والإمضاء (المؤسسة)'
      : 'Cachet & Signature Entreprise',
    M + sigW / 2,
    y + 30
  );
  ctx.fillText(
    doc.type === 'bl'
      ? isRtl
        ? 'إمضاء المستلم (استلام مطابق)'
        : 'Signature du Récepteur (Reçu conforme)'
      : isRtl
      ? 'إمضاء الزبون'
      : 'Signature / Accord Client',
    M + sigW + sigGap + sigW / 2,
    y + 30
  );

  // Footer
  ctx.fillStyle = '#64748b';
  ctx.font = `500 13px ${fontFamily}`;
  ctx.textAlign = 'center';
  if (company.generalTerms) {
    ctx.fillText(company.generalTerms.slice(0, 110), W / 2, H - 56);
  }
  ctx.fillText(company.customFooterText || `${company.companyName} — ${company.phone}`, W / 2, H - 32);

  // Push final page
  const finalDataUrl = canvas.toDataURL('image/jpeg', 0.92);
  pages.push({
    jpegBytes: base64ToUint8Array(finalDataUrl.split(',')[1]),
    widthPx: W,
    heightPx: H,
  });

  const pdfBlob = buildMultiPagePdfFromJpegs(pages);
  const blobUrl = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = blobUrl;
  a.download = `${doc.number}.pdf`;
  a.click();
  URL.revokeObjectURL(blobUrl);
}
