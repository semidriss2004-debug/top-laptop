import type { CustomerClientType, CustomerRecord, Language } from '../types';
import { idbGet, idbSet, LOCAL_STORAGE_KEY_MAP, safeLocalStorageSet } from './storage';

export type CustomerDbSource = 'server-json-db' | 'netlify-blobs' | 'local-offline';

const API_BASE = '/api/customers';

export function validateCustomerRecord(input: Partial<CustomerRecord>): string[] {
  const errors: string[] = [];
  if (!input.companyName || !input.companyName.trim()) {
    errors.push('اسم المحل أو الشركة مطلوب / Raison sociale requise.');
  }
  if (!input.contactPerson || !input.contactPerson.trim()) {
    errors.push('اسم المسؤول أو جهة الاتصال مطلوب / Contact requis.');
  }
  if (!input.clientType || !['shop', 'company', 'institution'].includes(input.clientType)) {
    errors.push('يرجى اختيار نوع الزبون / Type de client invalide.');
  }
  if (!input.phone || !input.phone.trim()) {
    errors.push('رقم الهاتف مطلوب / Numéro de téléphone requis.');
  }
  if (input.email && input.email.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
      errors.push('صيغة البريد الإلكتروني غير صالحة / Format email invalide.');
    }
  }
  return errors;
}

function readOfflineCustomers(): CustomerRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_MAP.customers);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return [];
}

async function saveOfflineCustomers(customers: CustomerRecord[]): Promise<void> {
  safeLocalStorageSet(LOCAL_STORAGE_KEY_MAP.customers, customers);
  await idbSet('customers', customers);
}

export async function fetchCustomersFromDatabase(): Promise<{
  customers: CustomerRecord[];
  source: CustomerDbSource;
}> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${API_BASE}?t=${Date.now()}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const payload = await res.json();
        if (payload && payload.ok && Array.isArray(payload.customers)) {
          await saveOfflineCustomers(payload.customers);
          return {
            customers: payload.customers,
            source: (payload.source as CustomerDbSource) || 'server-json-db',
          };
        }
      }
    }
  } catch {
    // Fallback to IndexedDB / LocalStorage when running offline / file:// standalone
  }

  const idbList = await idbGet<CustomerRecord[]>('customers');
  if (Array.isArray(idbList) && idbList.length > 0) {
    safeLocalStorageSet(LOCAL_STORAGE_KEY_MAP.customers, idbList);
    return { customers: idbList, source: 'local-offline' };
  }

  return { customers: readOfflineCustomers(), source: 'local-offline' };
}

export async function createCustomerInDatabase(
  input: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{
  ok: true;
  customer: CustomerRecord;
  customers: CustomerRecord[];
  source: CustomerDbSource;
} | { ok: false; errors: string[] }> {
  const errors = validateCustomerRecord(input);
  if (errors.length > 0) return { ok: false, errors };

  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(input),
    });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        return {
          ok: false,
          errors: Array.isArray(payload.errors) ? payload.errors : [payload.error || 'Database write failed'],
        };
      }
      if (Array.isArray(payload.customers)) {
        await saveOfflineCustomers(payload.customers);
        return {
          ok: true,
          customer: payload.customer,
          customers: payload.customers,
          source: (payload.source as CustomerDbSource) || 'server-json-db',
        };
      }
    }
  } catch {
    // Offline/file:// fallback
  }

  const fallbackRecord: CustomerRecord = {
    ...input,
    id: 'cust-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
    createdAt: new Date().toISOString(),
  };
  const next = [fallbackRecord, ...readOfflineCustomers()];
  await saveOfflineCustomers(next);
  return { ok: true, customer: fallbackRecord, customers: next, source: 'local-offline' };
}

export async function updateCustomerInDatabase(
  id: string,
  input: Omit<CustomerRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<{
  ok: true;
  customer: CustomerRecord;
  customers: CustomerRecord[];
  source: CustomerDbSource;
} | { ok: false; errors: string[] }> {
  const errors = validateCustomerRecord(input);
  if (errors.length > 0) return { ok: false, errors };

  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(input),
    });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        return {
          ok: false,
          errors: Array.isArray(payload.errors) ? payload.errors : [payload.error || 'Database update failed'],
        };
      }
      if (Array.isArray(payload.customers)) {
        await saveOfflineCustomers(payload.customers);
        return {
          ok: true,
          customer: payload.customer,
          customers: payload.customers,
          source: (payload.source as CustomerDbSource) || 'server-json-db',
        };
      }
    }
  } catch {
    // Offline fallback
  }

  const existing = readOfflineCustomers();
  const idx = existing.findIndex((c) => c.id === id);
  if (idx === -1) return { ok: false, errors: ['Customer not found'] };
  const updated: CustomerRecord = {
    ...existing[idx],
    ...input,
    updatedAt: new Date().toISOString(),
  };
  const next = [...existing];
  next[idx] = updated;
  await saveOfflineCustomers(next);
  return { ok: true, customer: updated, customers: next, source: 'local-offline' };
}

export async function deleteCustomerFromDatabase(id: string): Promise<{
  ok: true;
  customers: CustomerRecord[];
  source: CustomerDbSource;
} | { ok: false; error: string }> {
  try {
    const res = await fetch(`${API_BASE}/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Accept: 'application/json' },
    });
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const payload = await res.json();
      if (!res.ok || !payload.ok) {
        return { ok: false, error: payload.error || 'Delete failed' };
      }
      if (Array.isArray(payload.customers)) {
        await saveOfflineCustomers(payload.customers);
        return {
          ok: true,
          customers: payload.customers,
          source: (payload.source as CustomerDbSource) || 'server-json-db',
        };
      }
    }
  } catch {
    // Offline fallback
  }

  const next = readOfflineCustomers().filter((c) => c.id !== id);
  await saveOfflineCustomers(next);
  return { ok: true, customers: next, source: 'local-offline' };
}

export function getClientTypeLabel(type: CustomerClientType, lang: Language): string {
  const map: Record<CustomerClientType, { ar: string; fr: string }> = {
    shop: { ar: 'محل تجاري', fr: 'Magasin / Revendeur' },
    company: { ar: 'شركة', fr: 'Entreprise (SARL/SPA/EURL)' },
    institution: { ar: 'مؤسسة / إدارة', fr: 'Institution / Organisme' },
  };
  return lang === 'ar' ? map[type].ar : map[type].fr;
}

function sanitizeCsvCell(value: unknown): string {
  const str = String(value ?? '').replace(/\r?\n/g, ' ');
  const safe = /^[=+\-@]/.test(str) ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function exportCustomersToCsv(customers: CustomerRecord[], lang: Language): void {
  const headers =
    lang === 'ar'
      ? [
          'المعرف',
          'اسم المحل أو الشركة',
          'اسم المسؤول',
          'النوع',
          'رقم الهاتف',
          'البريد الإلكتروني',
          'الولاية',
          'العنوان',
          'الرقم الجبائي NIF',
          'السجل التجاري RC',
          'ملاحظات',
          'تاريخ الإضافة',
        ]
      : [
          'ID',
          'Entreprise / Magasin',
          'Personne de contact',
          'Type client',
          'Téléphone',
          'Email',
          'Wilaya',
          'Adresse',
          'NIF',
          'RC',
          'Notes',
          'Date ajout',
        ];

  const rows = customers.map((c) => [
    c.id,
    c.companyName,
    c.contactPerson,
    getClientTypeLabel(c.clientType, lang),
    c.phone,
    c.email || '',
    lang === 'ar' ? c.wilayaNameAr : c.wilayaNameFr,
    c.address,
    c.nif || '',
    c.rc || '',
    c.notes || '',
    new Date(c.createdAt).toLocaleDateString('fr-DZ'),
  ]);

  const csvContent =
    '\uFEFF' +
    [headers.map(sanitizeCsvCell).join(';'), ...rows.map((r) => r.map(sanitizeCsvCell).join(';'))].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `TOP_LAPTOP_CLIENTS_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
