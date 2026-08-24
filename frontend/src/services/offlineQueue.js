// Offline recording queue using IndexedDB
const DB_NAME = 'smart_transcriber_offline';
const STORE_NAME = 'pending_recordings';
const DB_VERSION = 1;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const savePendingRecording = async (file) => {
  const db = await openDB();
  const arrayBuffer = await file.arrayBuffer();
  const record = {
    id: Date.now().toString(),
    fileName: file.name,
    type: file.type,
    data: arrayBuffer,
    savedAt: new Date().toISOString(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(record);
    tx.oncomplete = () => resolve(record.id);
    tx.onerror = () => reject(tx.error);
  });
};

export const getPendingRecordings = async () => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
};

export const removePendingRecording = async (id) => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const pendingRecordingToFile = (record) => {
  const blob = new Blob([record.data], { type: record.type });
  return new File([blob], record.fileName, { type: record.type });
};
