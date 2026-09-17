const DATABASE_NAME = 'feathers-books-files';
const STORE_NAME = 'pdfs';
const DATABASE_VERSION = 1;

function openPdfDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Unable to open local PDF storage.'));
  });
}

export async function storePdfFile(file: Blob): Promise<string> {
  const key = `pdf-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const database = await openPdfDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(file, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Unable to save the PDF.'));
  });
  database.close();
  return `indexeddb://${key}`;
}

export async function readPdfFile(uri: string): Promise<Blob | null> {
  const key = uri.slice('indexeddb://'.length);
  const database = await openPdfDatabase();
  const file = await new Promise<Blob | null>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve((request.result as Blob | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error('Unable to read the saved PDF.'));
  });
  database.close();
  return file;
}