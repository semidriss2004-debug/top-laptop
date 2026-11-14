// Multi-tier Timestamped Persistent Storage Service:
// 1. Netlify Blobs Cloud Storage (/.netlify/functions/store-data) for online persistence across all devices & visitors
// 2. IndexedDB (unlimited browser storage for large product images without 5MB localStorage QuotaExceededError)
// 3. LocalStorage fast synchronous cache with modification timestamps

const IDB_NAME = 'top_laptop_db_v1';
const IDB_STORE = 'keyval';
const CLOUD_ENDPOINT = '/.netlify/functions/store-data';
const TIMESTAMPS_LS_KEY = 'top_laptop_timestamps_v1';

export type StoreKey =
  | 'products'
  | 'settings'
  | 'wilayas'
  | 'deliveryCompanies'
  | 'employees'
  | 'orders'
  | 'inventoryMovements'
  | 'activityLogs'
  | 'themeSettings';

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
};

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
    // QuotaExceededError when product images are large: free space from heavy backup/log keys
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

export function fetchAllCloudAndLocalState(): Promise<Partial<Record<StoreKey, any>>> {
  if (activeHydrationPromise) {
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

    // 2. Fetch from Netlify Cloud Blobs (/.netlify/functions/store-data)
    try {
      const res = await fetch(`${CLOUD_ENDPOINT}?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          Pragma: 'no-cache',
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

              if (hasCloud && cloudVal !== undefined && cloudVal !== null && cloudTs >= localTs) {
                // Cloud is newer or equal -> adopt Cloud value on this device (Phone or PC)
                result[k] = cloudVal;
                setLocalTimestamp(k, cloudTs);
                idbTimestamps[k] = cloudTs;
                await idbSet(k, cloudVal);
                safeLocalStorageSet(LOCAL_STORAGE_KEY_MAP[k], cloudVal);
              } else if (result[k] !== undefined && (localTs > cloudTs || !hasCloud)) {
                // Local device (e.g. PC) has saved edits newer than Cloud OR Cloud is still empty -> push Local to Cloud
                const pushTs = localTs > 0 ? localTs : Date.now();
                setLocalTimestamp(k, pushTs);
                idbTimestamps[k] = pushTs;
                newerLocalToPush[k] = { updatedAt: pushTs, value: result[k] };
              }
            }

            await idbSet('_timestamps', idbTimestamps);

            if (Object.keys(newerLocalToPush).length > 0) {
              await fetch(CLOUD_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch: newerLocalToPush }),
              }).catch(() => {});
            }
          }
        }
      }
    } catch {
      // Offline or local dev server without Netlify Functions — IndexedDB + LocalStorage work seamlessly
    }

    return result;
  })().finally(() => {
    setTimeout(() => {
      activeHydrationPromise = null;
    }, 1000);
  });

  return activeHydrationPromise;
}

const pendingCloudTimers: Partial<Record<StoreKey, ReturnType<typeof setTimeout>>> = {};

export function persistStoreKey<T>(key: StoreKey, value: T, immediateCloud = false): void {
  const lsKey = LOCAL_STORAGE_KEY_MAP[key];
  const updatedAt = Date.now();

  // 1. Save timestamp & value to LocalStorage (with quota protection)
  setLocalTimestamp(key, updatedAt);
  safeLocalStorageSet(lsKey, value);

  // 2. Save value & timestamp to IndexedDB (unlimited image storage)
  idbSet(key, value);
  idbGet<Partial<Record<StoreKey, number>>>('_timestamps').then((existing) => {
    const nextTs = { ...(existing || {}), [key]: updatedAt };
    idbSet('_timestamps', nextTs);
  });

  // 3. Save to Netlify Cloud Blobs
  const sendToCloud = () => {
    fetch(CLOUD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value, updatedAt }),
    }).catch(() => {});
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

export function persistStoreBatch(batch: Partial<Record<StoreKey, any>>): void {
  const updatedAt = Date.now();
  const envelopeBatch: Record<string, { updatedAt: number; value: any }> = {};

  for (const [k, v] of Object.entries(batch) as [StoreKey, any][]) {
    if (v !== undefined) {
      setLocalTimestamp(k, updatedAt);
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
  }).catch(() => {});
}
