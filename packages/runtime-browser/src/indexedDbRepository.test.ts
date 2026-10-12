import { afterEach, describe, expect, it, vi } from "vitest";

import type { FeedSnapshot } from "@bnuz-feed/contracts";

import { createIndexedDbRepository } from "./indexedDbRepository";

afterEach(() => vi.unstubAllGlobals());

function fakeDatabase() {
  const request = { result: undefined, error: null };
  const transaction = {
    error: null as Error | null,
    objectStore: () => ({ put: () => request, get: () => request }),
    oncomplete: () => {}, onabort: () => {}, onerror: () => {},
  };
  const database = { transaction: () => transaction, close: vi.fn() };
  const openRequest = { result: database, onsuccess: () => {} };
  vi.stubGlobal("indexedDB", { open: () => {
    queueMicrotask(() => openRequest.onsuccess());
    return openRequest;
  } });
  return { transaction, database };
}

describe("createIndexedDbRepository", () => {
  it("waits for transaction commit before reporting a saved snapshot", async () => {
    const { transaction, database } = fakeDatabase();
    const repository = createIndexedDbRepository({ dbName: "test", storeName: "snapshots", snapshotKey: "latest" });
    let saved = false;
    const result = repository.save({ items: [] } as unknown as FeedSnapshot).then(() => { saved = true; });
    await Promise.resolve();
    await Promise.resolve();
    expect(saved).toBe(false);
    expect(database.close).not.toHaveBeenCalled();
    transaction.oncomplete();
    await result;
    expect(saved).toBe(true);
    expect(database.close).toHaveBeenCalledOnce();
  });

  it("returns no cache and closes the database after an aborted read", async () => {
    const { transaction, database } = fakeDatabase();
    const repository = createIndexedDbRepository({ dbName: "test", storeName: "snapshots", snapshotKey: "latest" });
    const result = repository.load();
    await Promise.resolve();
    await Promise.resolve();
    transaction.error = new Error("transaction aborted");
    transaction.onabort();
    expect(await result).toBeNull();
    expect(database.close).toHaveBeenCalledOnce();
  });
});
