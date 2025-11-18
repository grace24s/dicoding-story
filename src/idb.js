// src/idb.js
export function openDB(name = "dicoding-db", version = 1) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);
    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      if (!db.objectStoreNames.contains("stories")) {
        const s = db.createObjectStore("stories", {
          keyPath: "id",
          autoIncrement: true,
        });
        s.createIndex("by-date", "createdAt");
      }
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function addOutbox(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("outbox", "readwrite");
    const store = tx.objectStore("outbox");
    const req = store.add(item);
    req.onsuccess = () => {
      resolve(req.result);
      db.close();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getOutboxAll() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("outbox", "readonly");
    const store = tx.objectStore("outbox");
    const req = store.getAll();
    req.onsuccess = () => {
      resolve(req.result);
      db.close();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteOutbox(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("outbox", "readwrite");
    const store = tx.objectStore("outbox");
    const req = store.delete(id);
    req.onsuccess = () => {
      resolve();
      db.close();
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveStoriesLocal(stories = []) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("stories", "readwrite");
    const store = tx.objectStore("stories");
    store.clear();
    stories.forEach((s) => store.put(s));
    tx.oncomplete = () => {
      resolve();
      db.close();
    };
    tx.onerror = () => reject(tx.error);
  });
}

export async function getStoriesLocal() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("stories", "readonly");
    const store = tx.objectStore("stories");
    const req = store.getAll();
    req.onsuccess = () => {
      resolve(req.result);
      db.close();
    };
    req.onerror = () => reject(req.error);
  });
}
