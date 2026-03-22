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

export function createIndexedDbRepository(
  options: IndexedDbRepositoryOptions,
): Repository {
  async function withStore<T>(
    mode: IDBTransactionMode,
    callback: (store: IDBObjectStore) => Promise<T> | T,
  ): Promise<T> {
    const database = await openDatabase(options);
    const transaction = database.transaction(options.storeName, mode);
    const store = transaction.objectStore(options.storeName);

    try {
      return await callback(store);
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
        return await withStore("readonly", (store) =>
          new Promise<FeedSnapshot | null>((resolve, reject) => {
            const request = store.get(options.snapshotKey);
            request.onsuccess = () => resolve((request.result as FeedSnapshot | undefined) ?? null);
            request.onerror = () => reject(request.error);
          }),
        );
      } catch {
        return null;
      }
    },

    async save(snapshot) {
      if (typeof indexedDB === "undefined") {
        return;
      }

      try {
        await withStore("readwrite", (store) =>
          new Promise<void>((resolve, reject) => {
            const request = store.put(snapshot, options.snapshotKey);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
          }),
        );
      } catch {
        return;
      }
    },
  };
}
