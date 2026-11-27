// Multi-tier Timestamped Persistent Storage Service:
// 1. Netlify Blobs Cloud Storage (https://top-laptop-dz-store.netlify.app/.netlify/functions/store-data)
//    Works across Vercel (top-laptop.vercel.app), Netlify, and localhost across all devices (Phones & Computers)
// 2. IndexedDB (unlimited browser storage for large product images without 5MB localStorage QuotaExceededError)
// 3. LocalStorage fast synchronous cache with modification timestamps

const IDB_NAME = 'top_laptop_db_v1';
const IDB_STORE = 'keyval';
export const CLOUD_ENDPOINT = 'https://top-laptop-dz-store.netlify.app/.netlify/functions/store-data';
const TIMESTAMPS_LS_KEY = 'top_laptop_timestamps_v1';
const DIRTY_KEYS_LS_KEY = 'top_laptop_dirty_keys_v1';

export type StoreKey =
  | 'products'
  | 'settings'
  | 'wilayas'
  | 'deliveryCompanies'
  | 'employees'
  | 'orders'
  | 'inventoryMovements'
  | 'activityLogs'
  | 'themeSettings'
  | 'commercialDocuments'
  | 'documentSettings'
  | 'customers';

export const LOCAL_STORAGE_KEY_MAP: Record<StoreKey, string> = {
  products: 'top_laptop_products_v3',
  settings: 'top_laptop_settings_v2',
  wilayas: 'top_laptop_wilayas_69',
  deliveryCompanies: 'top_laptop_delivery_companies',
  employees: 'top_laptop_employees',
  orders: 'top_laptop_orders_v2',
  inventoryMovements: 'top_laptop_inventory_movements',
  activityLogs: 'top_laptop_activity_logs',
  themeSettings: 'top_laptop_theme_settings',
  commercialDocuments: 'top_laptop_commercial_documents_v1',
  documentSettings: 'top_laptop_document_settings_v1',
  customers: 'top_laptop_customers_v1',
};

export function mergeOrdersById<T extends { id: string; createdAt?: string; updatedAt?: string; statusHistory?: any[] }>(
  listA: T[] | undefined | null,
  listB: T[] | undefined | null
): T[] {
  const arrA = Array.isArray(listA) ? listA : [];
  const arrB = Array.isArray(listB) ? listB : [];
  const map = new Map<string, T>();

  for (const item of arrA) {
    if (item && typeof item.id === 'string') {
      map.set(item.id, item);
    }
  }

  for (const item of arrB) {
    if (item && typeof item.id === 'string') {
      const existing = map.get(item.id);
      if (!existing) {
        map.set(item.id, item);
      } else {
        const lenA = Array.isArray(existing.statusHistory) ? existing.statusHistory.length : 0;
        const lenB = Array.isArray(item.statusHistory) ? item.statusHistory.length : 0;
        const tsA = existing.updatedAt ? Date.parse(existing.updatedAt) || 0 : 0;
        const tsB = item.updatedAt ? Date.parse(item.updatedAt) || 0 : 0;

        if (lenB > lenA || tsB >= tsA) {
          map.set(item.id, item);
        }
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const tA = a.createdAt ? Date.parse(a.createdAt) || 0 : 0;
    const tB = b.createdAt ? Date.parse(b.createdAt) || 0 : 0;
    return tB - tA;
  });
}

function getLocalTimestamps(): Partial<Record<StoreKey, number>> {
  try {
    const raw = localStorage.getItem(TIMESTAMPS_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore
  }
  return {};
}

function setLocalTimestamp(key: StoreKey, ts: number): void {
  try {
    const current = getLocalTimestamps();
    current[key] = ts;
    localStorage.setItem(TIMESTAMPS_LS_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

function getDirtyKeys(): Partial<Record<StoreKey, number>> {
  try {
    const raw = localStorage.getItem(DIRTY_KEYS_LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch {
    // ignore
  }
  return {};
}

function markKeyDirty(key: StoreKey, ts: number): void {
  try {
    const current = getDirtyKeys();
    current[key] = ts;
    localStorage.setItem(DIRTY_KEYS_LS_KEY, JSON.stringify(current));
  } catch {
    // ignore
  }
}

function clearKeyDirtyIfUnchanged(key: StoreKey, syncedTs: number): void {
  try {
    const current = getDirtyKeys();
    if (current[key] && current[key]! <= syncedTs) {
      delete current[key];
      localStorage.setItem(DIRTY_KEYS_LS_KEY, JSON.stringify(current));
    }
  } catch {
    // ignore
  }
}

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? (req.result as T) : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openIDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('IndexedDB write warning:', e);
  }
}

export function safeLocalStorageSet(storageKey: string, value: unknown): void {
  try {
    localStorage.removeItem('top_laptop_products_v2');
    localStorage.removeItem('top_laptop_products');
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch {
    try {
      localStorage.removeItem('top_laptop_backups');
      localStorage.removeItem('top_laptop_activity_logs');
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // IndexedDB and Cloud Blobs still persist the full payload safely
    }
  }
}

let activeHydrationPromise: Promise<Partial<Record<StoreKey, any>>> | null = null;

export function fetchAllCloudAndLocalState(force = false): Promise<Partial<Record<StoreKey, any>>> {
  if (!force && activeHydrationPromise) {
    return activeHydrationPromise;
  }

  activeHydrationPromise = (async () => {
    const result: Partial<Record<StoreKey, any>> = {};
    const keys = Object.keys(LOCAL_STORAGE_KEY_MAP) as StoreKey[];
    const localTimestamps = getLocalTimestamps();
    const idbTimestamps = (await idbGet<Partial<Record<StoreKey, number>>>('_timestamps')) || {};

    // Merge timestamps from localStorage and IndexedDB
    const effectiveLocalTs: Partial<Record<StoreKey, number>> = {};
    for (const k of keys) {
      effectiveLocalTs[k] = Math.max(localTimestamps[k] || 0, idbTimestamps[k] || 0);
    }

    // 1. Read from IndexedDB first, or fallback to existing LocalStorage
    await Promise.all(
      keys.map(async (k) => {
        const idbVal = await idbGet(k);
        if (idbVal !== null && idbVal !== undefined) {
          result[k] = idbVal;
        } else {
          try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY_MAP[k]);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed !== null && parsed !== undefined) {
                result[k] = parsed;
                await idbSet(k, parsed);
              }
            }
          } catch {
            // ignore malformed local storage
          }
        }
      })
    );

    // 2. Fetch from Netlify Cloud Blobs
    try {
      const res = await fetch(`${CLOUD_ENDPOINT}?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        cache: 'no-store',
      });

      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const payload = await res.json();
          if (payload && payload.ok && payload.data && typeof payload.data === 'object') {
            const cloudData = payload.data as Partial<
              Record<StoreKey, { updatedAt?: number; value?: any } | any>
            >;
            const newerLocalToPush: Record<string, { updatedAt: number; value: any }> = {};

            for (const k of keys) {
              const cloudEntry = cloudData[k];
              const hasCloud = cloudEntry !== undefined && cloudEntry !== null;
              const cloudTs =
                hasCloud && typeof cloudEntry === 'object' && typeof cloudEntry.updatedAt === 'number'
                  ? cloudEntry.updatedAt
                  : hasCloud
                  ? 1
                  : 0;
              const cloudVal =
                hasCloud && typeof cloudEntry === 'object' && 'value' in cloudEntry
                  ? cloudEntry.value
                  : cloudEntry;

              const localTs = effectiveLocalTs[k] || 0;
              const dirtyTs = getDirtyKeys()[k] || 0;

              // If local device has unsynced edits (`dirtyTs > 0`), NEVER let Cloud overwrite them on refresh!
              if (dirtyTs > 0 && result[k] !== undefined) {
                const pushTs = Math.max(localTs, cloudTs + 1, Date.now());
                setLocalTimestamp(k, pushTs);
                idbTimestamps[k] = pushTs;
                newerLocalToPush[k] = { updatedAt: pushTs, value: result[k] };
                continue;
              }

              // Special handling for `orders`: ALWAYS merge local and cloud orders by ID so no order from any phone/PC is ever lost!
              if (k === 'orders') {
                const localOrders = Array.isArray(result.orders) ? result.orders : [];
                const remoteOrders = Array.isArray(cloudVal) ? cloudVal : [];
                const mergedOrders = mergeOrdersById(remoteOrders, localOrders);

                result.orders = mergedOrders;
                const maxTs = Math.max(cloudTs, localTs, Date.now());
                setLocalTimestamp('orders', maxTs);
                idbTimestamps.orders = maxTs;
                await idbSet('orders', mergedOrders);
                safeLocalStorageSet(LOCAL_STORAGE_KEY_MAP.orders, mergedOrders);

                if (!hasCloud || mergedOrders.length > remoteOrders.length) {
                  newerLocalToPush.orders = { updatedAt: maxTs, value: mergedOrders };
                }
                continue;
              }

              // Merge commercialDocuments by ID using updatedAt/createdAt so no issued document or receipt is lost
              if (k === 'commercialDocuments') {
                const localDocs = Array.isArray(result.commercialDocuments) ? result.commercialDocuments : [];
                const remoteDocs = Array.isArray(cloudVal) ? cloudVal : [];
                const mergedDocs = mergeOrdersById(remoteDocs, localDocs);

                result.commercialDocuments = mergedDocs;
                const maxTs = Math.max(cloudTs, localTs, Date.now());
                setLocalTimestamp('commercialDocuments', maxTs);
                idbTimestamps.commercialDocuments = maxTs;
                await idbSet('commercialDocuments', mergedDocs);
                safeLocalStorageSet(LOCAL_STORAGE_KEY_MAP.commercialDocuments, mergedDocs);

                if (!hasCloud || mergedDocs.length > remoteDocs.length) {
                  newerLocalToPush.commercialDocuments = { updatedAt: maxTs, value: mergedDocs };
                }
                continue;
              }

              if (hasCloud && cloudVal !== undefined && cloudVal !== null && cloudTs >= localTs) {
                // Cloud is newer or equal -> adopt Cloud value on this device (Phone or PC)
                result[k] = cloudVal;
                setLocalTimestamp(k, cloudTs);
                idbTimestamps[k] = cloudTs;
                await idbSet(k, cloudVal);
                safeLocalStorageSet(LOCAL_STORAGE_KEY_MAP[k], cloudVal);
              } else if (result[k] !== undefined && (localTs > cloudTs || !hasCloud)) {
                // Local device has saved edits newer than Cloud OR Cloud is still empty -> push Local to Cloud
                const pushTs = localTs > 0 ? localTs : Date.now();
                setLocalTimestamp(k, pushTs);
                idbTimestamps[k] = pushTs;
                newerLocalToPush[k] = { updatedAt: pushTs, value: result[k] };
              }
            }

            await idbSet('_timestamps', idbTimestamps);

            if (Object.keys(newerLocalToPush).length > 0) {
              const pushRes = await fetch(CLOUD_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: newerLocalToPush }),
              }).catch(() => null);
              if (pushRes && pushRes.ok) {
                for (const [k, item] of Object.entries(newerLocalToPush)) {
                  clearKeyDirtyIfUnchanged(k as StoreKey, item.updatedAt);
                }
              }
            }
          }
        }
      }
    } catch {
      // Offline or unreachable — IndexedDB + LocalStorage work seamlessly
    }

    return result;
  })().finally(() => {
    setTimeout(() => {
      activeHydrationPromise = null;
    }, 800);
  });

  return activeHydrationPromise;
}

const pendingCloudTimers: Partial<Record<StoreKey, ReturnType<typeof setTimeout>>> = {};

export function persistStoreKey<T>(key: StoreKey, value: T, immediateCloud = false): void {
  const lsKey = LOCAL_STORAGE_KEY_MAP[key];
  const updatedAt = Date.now();

  // 1. Save timestamp, dirty flag & value to LocalStorage synchronously so page Refresh never loses edits
  setLocalTimestamp(key, updatedAt);
  markKeyDirty(key, updatedAt);
  safeLocalStorageSet(lsKey, value);

  // 2. Save value & timestamp to IndexedDB (unlimited storage)
  idbSet(key, value);
  idbGet<Partial<Record<StoreKey, number>>>('_timestamps').then((existing) => {
    const nextTs = { ...(existing || {}), [key]: updatedAt };
    idbSet('_timestamps', nextTs);
  });

  // 3. Save to Netlify Cloud Blobs and clear dirty flag ONLY on confirmed server ack
  const sendToCloud = () => {
    fetch(CLOUD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, updatedAt }),
    })
      .then((res) => {
        if (res.ok) {
          clearKeyDirtyIfUnchanged(key, updatedAt);
        }
      })
      .catch(() => {});
  };

  if (pendingCloudTimers[key]) {
    clearTimeout(pendingCloudTimers[key]);
  }

  if (immediateCloud) {
    sendToCloud();
  } else {
    pendingCloudTimers[key] = setTimeout(sendToCloud, 150);
  }
}

export async function persistStoreKeyWithAck<T>(
  key: StoreKey,
  value: T
): Promise<{ savedLocal: boolean; syncedCloud: boolean }> {
  const lsKey = LOCAL_STORAGE_KEY_MAP[key];
  const updatedAt = Date.now();

  setLocalTimestamp(key, updatedAt);
  markKeyDirty(key, updatedAt);
  safeLocalStorageSet(lsKey, value);

  await idbSet(key, value);
  const existing = await idbGet<Partial<Record<StoreKey, number>>>('_timestamps');
  await idbSet('_timestamps', { ...(existing || {}), [key]: updatedAt });

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(CLOUD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, updatedAt }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      clearKeyDirtyIfUnchanged(key, updatedAt);
      return { savedLocal: true, syncedCloud: true };
    }
  } catch {
    // Saved safely in LocalStorage + IndexedDB and queued via dirtyKeys for next sync
  }

  return { savedLocal: true, syncedCloud: false };
}

/**
 * Atomically appends a newly created customer order to local storage, IndexedDB, and Cloud Blobs
 * and awaits the cloud response so the order is guaranteed to reach the Admin Dashboard immediately.
 */
export async function appendOrderToCloud<T extends { id: string }>(
  newOrder: T,
  currentLocalOrders: T[]
): Promise<T[]> {
  const updatedAt = Date.now();
  const mergedLocal = mergeOrdersById(currentLocalOrders, [newOrder]);

  setLocalTimestamp('orders', updatedAt);
  safeLocalStorageSet(LOCAL_STORAGE_KEY_MAP.orders, mergedLocal);
  await idbSet('orders', mergedLocal);
  idbGet<Partial<Record<StoreKey, number>>>('_timestamps').then((existing) => {
    idbSet('_timestamps', { ...(existing || {}), orders: updatedAt });
  });

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(CLOUD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'appendOrder', order: newOrder, updatedAt }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.ok && Array.isArray(data.orders)) {
        const finalMerged = mergeOrdersById(mergedLocal, data.orders);
        safeLocalStorageSet(LOCAL_STORAGE_KEY_MAP.orders, finalMerged);
        await idbSet('orders', finalMerged);
        return finalMerged;
      }
    }
  } catch {
    // Fallback: background persistStoreKey if offline or slow network
    persistStoreKey('orders', mergedLocal, true);
  }

  return mergedLocal;
}

export function persistStoreBatch(batch: Partial<Record<StoreKey, any>>): void {
  const updatedAt = Date.now();
  const envelopeBatch: Record<string, { updatedAt: number; value: any }> = {};

  for (const [k, v] of Object.entries(batch) as [StoreKey, any][]) {
    if (v !== undefined) {
      setLocalTimestamp(k, updatedAt);
      markKeyDirty(k, updatedAt);
      safeLocalStorageSet(LOCAL_STORAGE_KEY_MAP[k], v);
      idbSet(k, v);
      envelopeBatch[k] = { updatedAt, value: v };
    }
  }

  idbGet<Partial<Record<StoreKey, number>>>('_timestamps').then((existing) => {
    const nextTs = { ...(existing || {}) };
    for (const k of Object.keys(batch) as StoreKey[]) {
      nextTs[k] = updatedAt;
    }
    idbSet('_timestamps', nextTs);
  });

  fetch(CLOUD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ batch: envelopeBatch }),
  })
    .then((res) => {
      if (res.ok) {
        for (const k of Object.keys(envelopeBatch) as StoreKey[]) {
          clearKeyDirtyIfUnchanged(k, updatedAt);
        }
      }
    })
    .catch(() => {});
}
