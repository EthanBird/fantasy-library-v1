import { openDB, type IDBPDatabase } from 'idb';
import type { BookContent, BookStub, Bookmark, ReadHistory } from '@/types';

const DB_NAME = 'fantasy-library-3d';
const DB_VERSION = 1;

const STORES = {
  stubs: 'bookStubs',
  contents: 'bookContents',
  bookmarks: 'bookmarks',
  history: 'readHistory',
  meta: 'meta',
} as const;

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORES.stubs)) {
          const s = db.createObjectStore(STORES.stubs, { keyPath: 'id' });
          s.createIndex('theme', 'theme');
          s.createIndex('hallId', 'location.hallId');
          s.createIndex('shelfId', 'location.shelfId');
          s.createIndex('category', 'category');
        }
        if (!db.objectStoreNames.contains(STORES.contents)) {
          const c = db.createObjectStore(STORES.contents, { keyPath: 'bookId' });
          c.createIndex('status', 'status');
          c.createIndex('lastReadAt', 'lastReadAt');
        }
        if (!db.objectStoreNames.contains(STORES.bookmarks)) {
          const b = db.createObjectStore(STORES.bookmarks, { keyPath: 'id' });
          b.createIndex('bookId', 'bookId');
          b.createIndex('createdAt', 'createdAt');
        }
        if (!db.objectStoreNames.contains(STORES.history)) {
          const h = db.createObjectStore(STORES.history, { keyPath: 'bookId' });
          h.createIndex('lastReadAt', 'lastReadAt');
        }
        if (!db.objectStoreNames.contains(STORES.meta)) {
          db.createObjectStore(STORES.meta, { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// ============================================================================
// Stubs
// ============================================================================
export async function getAllStubs(): Promise<BookStub[]> {
  const db = await getDB();
  return db.getAll(STORES.stubs);
}
export async function putStub(s: BookStub): Promise<void> {
  const db = await getDB();
  await db.put(STORES.stubs, s);
}
export async function putStubs(stubs: BookStub[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORES.stubs, 'readwrite');
  await Promise.all(stubs.map((s) => tx.store.put(s)));
  await tx.done;
}
export async function deleteStub(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.stubs, id);
}

// ============================================================================
// Contents
// ============================================================================
export async function getAllContents(): Promise<BookContent[]> {
  const db = await getDB();
  return db.getAll(STORES.contents);
}
export async function putContent(c: BookContent): Promise<void> {
  const db = await getDB();
  await db.put(STORES.contents, c);
}
export async function getContent(bookId: string): Promise<BookContent | undefined> {
  const db = await getDB();
  return db.get(STORES.contents, bookId);
}

// ============================================================================
// Bookmarks
// ============================================================================
export async function getAllBookmarks(): Promise<Bookmark[]> {
  const db = await getDB();
  return db.getAll(STORES.bookmarks);
}
export async function putBookmark(b: Bookmark): Promise<void> {
  const db = await getDB();
  await db.put(STORES.bookmarks, b);
}
export async function deleteBookmark(id: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORES.bookmarks, id);
}

// ============================================================================
// History
// ============================================================================
export async function getAllHistory(): Promise<ReadHistory[]> {
  const db = await getDB();
  return db.getAll(STORES.history);
}
export async function putHistory(h: ReadHistory): Promise<void> {
  const db = await getDB();
  await db.put(STORES.history, h);
}

// ============================================================================
// Meta
// ============================================================================
export async function getMeta<T = unknown>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const rec = (await db.get(STORES.meta, key)) as { key: string; value: T } | undefined;
  return rec?.value;
}
export async function setMeta<T = unknown>(key: string, value: T): Promise<void> {
  const db = await getDB();
  await db.put(STORES.meta, { key, value });
}

// ============================================================================
// 整体操作
// ============================================================================
export async function replaceAll(data: {
  stubs: BookStub[];
  contents: BookContent[];
  bookmarks: Bookmark[];
  history: ReadHistory[];
}): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([STORES.stubs, STORES.contents, STORES.bookmarks, STORES.history], 'readwrite');
  await Promise.all([
    tx.objectStore(STORES.stubs).clear(),
    tx.objectStore(STORES.contents).clear(),
    tx.objectStore(STORES.bookmarks).clear(),
    tx.objectStore(STORES.history).clear(),
  ]);
  await Promise.all([
    ...data.stubs.map((s) => tx.objectStore(STORES.stubs).put(s)),
    ...data.contents.map((c) => tx.objectStore(STORES.contents).put(c)),
    ...data.bookmarks.map((b) => tx.objectStore(STORES.bookmarks).put(b)),
    ...data.history.map((h) => tx.objectStore(STORES.history).put(h)),
  ]);
  await tx.done;
}

export async function clearAll(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction([STORES.stubs, STORES.contents, STORES.bookmarks, STORES.history], 'readwrite');
  await Promise.all([
    tx.objectStore(STORES.stubs).clear(),
    tx.objectStore(STORES.contents).clear(),
    tx.objectStore(STORES.bookmarks).clear(),
    tx.objectStore(STORES.history).clear(),
  ]);
  await tx.done;
}

export async function estimateUsage(): Promise<{ usage: number; quota: number } | null> {
  if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null;
  const e = await navigator.storage.estimate();
  return { usage: e.usage ?? 0, quota: e.quota ?? 0 };
}
