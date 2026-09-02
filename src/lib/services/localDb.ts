import { openDB, type IDBPDatabase } from 'idb';
import type { Presentation } from '../types';

const DB_NAME = 'PresentPdfDB';
const DB_VERSION = 1;
const STORE_NAME = 'presentations';

let dbPromise: Promise<IDBPDatabase> | null = null;

export function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Saves a presentation to local IndexedDB
 */
export async function savePresentationToLocal(presentation: Presentation): Promise<void> {
  const db = await getDb();
  await db.put(STORE_NAME, presentation);
}

/**
 * Retrieves a presentation by ID from local IndexedDB if not expired
 */
export async function getPresentationFromLocal(id: string): Promise<Presentation | undefined> {
  const db = await getDb();
  const item = await db.get(STORE_NAME, id);
  if (!item) return undefined;

  // If expired, purge it immediately and return undefined
  if (item.expiresAt && Date.now() > item.expiresAt) {
    await db.delete(STORE_NAME, id);
    return undefined;
  }

  return item as Presentation;
}

/**
 * Lists all active (non-expired) presentations from local IndexedDB
 */
export async function listLocalPresentations(): Promise<Presentation[]> {
  const db = await getDb();
  const allItems: Presentation[] = await db.getAll(STORE_NAME);
  const now = Date.now();
  const activeItems: Presentation[] = [];

  for (const item of allItems) {
    if (item.expiresAt && now > item.expiresAt) {
      await db.delete(STORE_NAME, item.id);
    } else {
      activeItems.push(item);
    }
  }

  return activeItems.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Deletes a single presentation from local IndexedDB
 */
export async function deleteLocalPresentation(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(STORE_NAME, id);
}

/**
 * Purges all presentations that have exceeded their 24-hour expiration timestamp
 */
export async function purgeExpiredPresentations(): Promise<number> {
  const db = await getDb();
  const allItems: Presentation[] = await db.getAll(STORE_NAME);
  const now = Date.now();
  let purgedCount = 0;

  for (const item of allItems) {
    if (item.expiresAt && now > item.expiresAt) {
      await db.delete(STORE_NAME, item.id);
      purgedCount++;
    }
  }

  return purgedCount;
}
