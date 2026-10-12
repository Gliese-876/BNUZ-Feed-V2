import type { FeedSnapshot, Repository } from "@bnuz-feed/contracts";

export interface IndexedDbRepositoryOptions {
  dbName: string;
  storeName: string;
  snapshotKey: string;
}

function openDatabase(options: IndexedDbRepositoryOptions): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(options.dbName, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(options.storeName)) {
        database.createObjectStore(options.storeName);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function createIndexedDbRepository(options: IndexedDbRepositoryOptions): Repository {
  async function withStore<T>(
    mode: IDBTransactionMode,
    makeRequest: (store: IDBObjectStore) => IDBRequest<T>,
  ): Promise<T> {
    const database = await openDatabase(options);
    try {
      return await new Promise<T>((resolve, reject) => {
        const transaction = database.transaction(options.storeName, mode);
        const request = makeRequest(transaction.objectStore(options.storeName));
        // Request success precedes commit; a later transaction abort must not report success.
        transaction.oncomplete = () => resolve(request.result);
        transaction.onabort = () => reject(transaction.error ?? new Error("Cache transaction aborted."));
        transaction.onerror = () => reject(transaction.error ?? request.error);
      });
    } finally {
      database.close();
    }
  }

  return {
    async load() {
      if (typeof indexedDB === "undefined") {
        return null;
      }
      try {
        return (await withStore<FeedSnapshot | undefined>("readonly", (store) =>
          store.get(options.snapshotKey),
        )) ?? null;
      } catch {
        return null;
      }
    },

    async save(snapshot) {
      if (typeof indexedDB === "undefined") {
        return;
      }
      try {
        await withStore("readwrite", (store) => store.put(snapshot, options.snapshotKey));
      } catch {
        // Cache storage is best effort (for example, private mode or an exhausted quota).
      }
    },
  };
}
