// src/api.js
const BASE = "https://story-api.dicoding.dev/v1";

/* existing functions (register, login, getStories, getStoryDetail, addStory) */
export async function register({ name, email, password }) {
  const res = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

export async function login({ email, password }) {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getStories({ token, page = 1, size = 20, location = 0 }) {
  const res = await fetch(
    `${BASE}/stories?page=${page}&size=${size}&location=${location}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  return res.json();
}

export async function getStoryDetail({ token, id }) {
  const res = await fetch(`${BASE}/stories/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
}

export async function addStory({ token, description, file, lat, lon }) {
  const fd = new FormData();
  fd.append("description", description);
  fd.append("photo", file);
  if (lat) fd.append("lat", lat);
  if (lon) fd.append("lon", lon);

  const res = await fetch(`${BASE}/stories`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  return res.json();
}

/* Push subscribe/unsubscribe */
export const VAPID_PUBLIC =
  "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";

export async function subscribeServer({ token, subscription }) {
  // call POST /notifications/subscribe per API spec
  const res = await fetch(`${BASE}/notifications/subscribe`, {
    method: "POST",
    headers: Object.assign(
      { "Content-Type": "application/json" },
      token ? { Authorization: `Bearer ${token}` } : {}
    ),
    body: JSON.stringify(subscription),
  });
  return res.json();
}

export async function unsubscribeServer({ token, endpoint }) {
  const res = await fetch(`${BASE}/notifications/subscribe`, {
    method: "DELETE",
    headers: Object.assign(
      { "Content-Type": "application/json" },
      token ? { Authorization: `Bearer ${token}` } : {}
    ),
    body: JSON.stringify({ endpoint }),
  });
  return res.json();
}

/* helper: convert base64 vapid to Uint8Array for subscription */
export function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i)
    outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

/* helper to add outbox: will be used by addStory when offline */
export async function enqueueOutbox(item) {
  // store to indexeddb outbox (simple)
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("dicoding-db", 1);
    req.onupgradeneeded = (ev) => {
      const db = ev.target.result;
      if (!db.objectStoreNames.contains("outbox"))
        db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = (ev) => {
      const db = ev.target.result;
      const tx = db.transaction("outbox", "readwrite");
      const store = tx.objectStore("outbox");
      // item expected to include photoBlob if exists and token (optional)
      const r = store.add(item);
      r.onsuccess = () => {
        db.close();
        resolve(r.result);
      };
      r.onerror = () => {
        db.close();
        reject(r.error);
      };
    };
    req.onerror = () => reject(req.error);
  });
}
