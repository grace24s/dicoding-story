/* public/sw.js */

const CACHE_NAME = "dicoding-story-shell-v1";
const RUNTIME_CACHE = "dicoding-runtime-v1";
const API_BASE = "https://story-api.dicoding.dev/v1";
const OFFLINE_PAGE = "/offline.html";

const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/src/styles.css",
  "/src/main.js",
  "/src/router.js",
  "/src/api.js",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

/* ================================
   INSTALL
================================ */
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

/* ================================
   ACTIVATE
================================ */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      );
      await self.clients.claim();
    })()
  );
});

/* ================================
   FETCH HANDLER
================================ */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // SPA - navigasi HTML
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches
          .match("/index.html")
          .then((res) => res || caches.match(OFFLINE_PAGE))
      )
    );
    return;
  }

  // Caching API Stories (GET /v1/stories)
  if (
    url.origin === new URL(API_BASE).origin &&
    url.pathname.startsWith("/v1/stories") &&
    req.method === "GET"
  ) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const network = fetch(req)
          .then((response) => {
            if (response && response.ok) cache.put(req, response.clone());
            return response;
          })
          .catch(() => null);

        return (
          cached ||
          network ||
          new Response(JSON.stringify({ error: true, message: "Offline" }), {
            headers: { "Content-Type": "application/json" },
          })
        );
      })
    );
    return;
  }

  // Caching image
  if (req.destination === "image") {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;

        try {
          const response = await fetch(req);
          if (response.ok) cache.put(req, response.clone());
          return response;
        } catch (err) {
          return caches.match("/icons/icon-192.png");
        }
      })
    );
    return;
  }

  // Default network-first
  event.respondWith(
    fetch(req).catch(() =>
      caches.match(req).catch(() => caches.match(OFFLINE_PAGE))
    )
  );
});

/* ================================
   PUSH NOTIFICATION
================================ */
self.addEventListener("push", (event) => {
  console.log("SW: Push received");

  // permission harus granted
  if (Notification.permission !== "granted") {
    console.warn("SW: Notification permission not granted");
    return;
  }

  let payload = {};
  try {
    payload = event.data
      ? event.data.json()
      : {
          title: "Notification",
          options: { body: "Anda mendapat notifikasi" },
        };
  } catch (e) {
    payload = {
      title: "Notification",
      options: {
        body: event.data ? event.data.text() : "Anda mendapat notifikasi",
      },
    };
  }

  const { title, options } = payload;

  const notifOptions = {
    ...options,
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    actions: options.actions || [
      { action: "open_app", title: "Buka aplikasi" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(title || "Dicoding Story", notifOptions)
  );
});

/* ================================
   PUSH CLICK HANDLER
================================ */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const storyId = event.notification?.data?.storyId;
  const target = storyId ? `/#/detail?id=${storyId}` : "/#/";

  event.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        includeUncontrolled: true,
        type: "window",
      });

      let client =
        allClients.find((c) => c.visibilityState === "visible") ||
        allClients[0];

      if (client) {
        client.focus();
        client.navigate?.(target);
      } else {
        clients.openWindow(target);
      }
    })()
  );
});

/* ================================
   BACKGROUND SYNC (Remain Unchanged)
================================ */
self.addEventListener("sync", (event) => {
  if (event.tag.startsWith("sync-stories-")) {
    event.waitUntil(syncQueuedStories());
  }
});

/* Queue Sync Helper */
async function syncQueuedStories() {
  try {
    const db = await openQueuedDB();
    const tx = db.transaction("outbox", "readwrite");
    const store = tx.objectStore("outbox");
    const items = await store.getAll();

    for (const item of items) {
      try {
        const form = new FormData();
        form.append("description", item.description);
        if (item.photoBlob)
          form.append("photo", item.photoBlob, item.filename || "offline.jpg");
        if (item.lat) form.append("lat", item.lat);
        if (item.lon) form.append("lon", item.lon);

        const headers = item.token
          ? { Authorization: `Bearer ${item.token}` }
          : {};

        const response = await fetch(`${API_BASE}/stories`, {
          method: "POST",
          body: form,
          headers,
        });

        const json = await response.json();
        if (!json.error) {
          await store.delete(item.id);
        }
      } catch (err) {
        console.error("Sync failed for item", err);
      }
    }

    await tx.complete;
    db.close();
  } catch (err) {
    console.error("Sync failed", err);
  }
}

/* IndexedDB Helper */
function openQueuedDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("dicoding-queued-db", 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("outbox")) {
        db.createObjectStore("outbox", { keyPath: "id", autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = (e) => reject(e.target.error);
  });
}
