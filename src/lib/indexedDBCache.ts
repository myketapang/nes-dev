// IndexedDB caching layer for large CSV data
// Stores parsed data locally for instant subsequent loads

const DB_NAME = 'nes-dashboard-cache';
const DB_VERSION = 1;
const STORE_NAME = 'csv-data';
const METADATA_STORE = 'metadata';

interface CacheMetadata {
  key: string;
  timestamp: number;
  rowCount: number;
  fileHash: string;
}

interface CachedData<T> {
  key: string;
  data: T[];
  timestamp: number;
}

class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Store for large data arrays (chunked)
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'key' });
        }
        
        // Store for metadata
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
        }
      };
    });

    return this.initPromise;
  }

  // Generate a simple hash of the CSV content for cache invalidation
  private hashString(str: string): string {
    let hash = 0;
    const sample = str.slice(0, 10000) + str.slice(-10000); // Sample first and last 10k chars
    for (let i = 0; i < sample.length; i++) {
      const char = sample.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  async getMetadata(key: string): Promise<CacheMetadata | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([METADATA_STORE], 'readonly');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async setMetadata(metadata: CacheMetadata): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([METADATA_STORE], 'readwrite');
      const store = transaction.objectStore(METADATA_STORE);
      const request = store.put(metadata);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(key: string): Promise<T[] | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result as CachedData<T> | undefined;
        resolve(result?.data || null);
      };
      request.onerror = () => resolve(null);
    });
  }

  async set<T>(key: string, data: T[]): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const cachedData: CachedData<T> = {
        key,
        data,
        timestamp: Date.now(),
      };

      const request = store.put(cachedData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async isCacheValid(key: string, csvText: string, maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<boolean> {
    const metadata = await this.getMetadata(key);
    if (!metadata) return false;

    const isExpired = Date.now() - metadata.timestamp > maxAgeMs;
    const hashMatches = metadata.fileHash === this.hashString(csvText);

    return !isExpired && hashMatches;
  }

  async cacheData<T>(key: string, csvText: string, data: T[]): Promise<void> {
    const metadata: CacheMetadata = {
      key,
      timestamp: Date.now(),
      rowCount: data.length,
      fileHash: this.hashString(csvText),
    };

    await Promise.all([
      this.set(key, data),
      this.setMetadata(metadata),
    ]);
  }

  async clear(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME, METADATA_STORE], 'readwrite');
      
      transaction.objectStore(STORE_NAME).clear();
      transaction.objectStore(METADATA_STORE).clear();

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

export const cacheDB = new IndexedDBCache();
