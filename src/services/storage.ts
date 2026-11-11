// Multi-tier Persistent Storage Service:
// 1. Netlify Blobs Cloud Storage (/.netlify/functions/store-data) for online persistence across all devices & visitors
// 2. IndexedDB (unlimited browser storage for large product images without 5MB localStorage QuotaExceededError)
// 3. LocalStorage fast synchronous cache

const IDB_NAME = 'top_laptop_db_v1';
const IDB_STORE = 'keyval';
const CLOUD_ENDPOINT = '/.netlify/functions/store-data';

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

export async function fetchAllCloudAndLocalState(): Promise<Partial<Record<StoreKey, any>>> {
  const result: Partial<Record<StoreKey, any>> = {};
  const keys = Object.keys(LOCAL_STORAGE_KEY_MAP) as StoreKey[];

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
    const res = await fetch(CLOUD_ENDPOINT, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const payload = await res.json();
        if (payload && payload.ok && payload.data && typeof payload.data === 'object') {
          const cloudData = payload.data as Partial<Record<StoreKey, any>>;
          const missingOnCloud: Partial<Record<StoreKey, any>> = {};

          for (const k of keys) {
            if (cloudData[k] !== undefined && cloudData[k] !== null) {
              result[k] = cloudData[k];
              // Sync Cloud -> IndexedDB & LocalStorage
              await idbSet(k, cloudData[k]);
              safeLocalStorageSet(LOCAL_STORAGE_KEY_MAP[k], cloudData[k]);
            } else if (result[k] !== undefined) {
              // Cloud doesn't have this key yet, seed from local
              missingOnCloud[k] = result[k];
            }
          }

          if (Object.keys(missingOnCloud).length > 0) {
            fetch(CLOUD_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ batch: missingOnCloud }),
            }).catch(() => {});
          }
        }
      }
    }
  } catch {
    // Offline or local dev server without Netlify Functions — IndexedDB + LocalStorage work seamlessly
  }

  return result;
}

const pendingCloudTimers: Partial<Record<StoreKey, ReturnType<typeof setTimeout>>> = {};

export function persistStoreKey<T>(key: StoreKey, value: T, immediateCloud = false): void {
  const lsKey = LOCAL_STORAGE_KEY_MAP[key];

  // 1. Save to LocalStorage (with quota protection)
  safeLocalStorageSet(lsKey, value);

  // 2. Save to IndexedDB (unlimited image storage)
  idbSet(key, value);

  // 3. Save to Netlify Cloud Blobs
  const sendToCloud = () => {
    fetch(CLOUD_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
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
  for (const [k, v] of Object.entries(batch) as [StoreKey, any][]) {
    if (v !== undefined) {
      safeLocalStorageSet(LOCAL_STORAGE_KEY_MAP[k], v);
      idbSet(k, v);
    }
  }
  fetch(CLOUD_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ batch }),
  }).catch(() => {});
}
