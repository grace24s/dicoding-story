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

self.addEventListener("install", (ev) => {
  ev.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (ev) => {
  const req = ev.request;
  const url = new URL(req.url);

  if (req.mode === "navigate") {
    ev.respondWith(
      fetch(req).catch(() =>
        caches
          .match("/index.html")
          .then((res) => res || caches.match(OFFLINE_PAGE))
      )
    );
    return;
  }

  if (
    url.origin === new URL(API_BASE).origin &&
    url.pathname.startsWith("/v1/stories") &&
    req.method === "GET"
  ) {
    ev.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        const networkFetch = fetch(req)
          .then((networkResp) => {
            if (networkResp && networkResp.ok)
              cache.put(req, networkResp.clone());
            return networkResp;
          })
          .catch(() => null);
        return (
          cached ||
          networkFetch ||
          new Response(JSON.stringify({ error: true, message: "Offline" }), {
            headers: { "Content-Type": "application/json" },
          })
        );
      })
    );
    return;
  }

  if (
    req.destination === "image" ||
    url.pathname.includes("/images/stories/")
  ) {
    ev.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(req);
        if (cached) return cached;
        try {
          const resp = await fetch(req);
          if (resp && resp.ok) cache.put(req, resp.clone());
          return resp;
        } catch (err) {
          return caches.match("/icons/icon-192.png");
        }
      })
    );
    return;
  }

  ev.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req).catch(() => caches.match("/index.html"));
    })
  );
});

/* Push Notifications */
self.addEventListener("push", (ev) => {
  let payload = {};
  try {
    payload = ev.data
      ? ev.data.json()
      : { title: "Notification", options: { body: "You have a notification" } };
  } catch (e) {
    payload = {
      title: "Notification",
      options: { body: ev.data ? ev.data.text() : "You have a notification" },
    };
  }

  const { title, options } = payload;
  const actions = (options && options.actions) || [
    { action: "open_app", title: "Buka aplikasi" },
  ];
  const notifOptions = Object.assign({}, options, {
    actions,
    badge: "/icons/icon-192.png",
    icon: "/icons/icon-192.png",
  });

  ev.waitUntil(
    self.registration.showNotification(title || "Dicoding Story", notifOptions)
  );
});

self.addEventListener("notificationclick", (ev) => {
  ev.notification.close();
  const action = ev.action;
  const data = ev.notification && ev.notification.data;
  const storyId = data && data.storyId;
  const targetUrl = storyId ? `/#/detail?id=${storyId}` : "/#/";

  ev.waitUntil(
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
        client.navigate && client.navigate(targetUrl);
      } else {
        clients.openWindow(targetUrl);
      }
    })()
  );
});

/* Background Sync handler (sync-stories-*) - keep as is if supported */
self.addEventListener("sync", (ev) => {
  if (ev.tag && ev.tag.startsWith("sync-stories-")) {
    ev.waitUntil(syncQueuedStories());
  }
});

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
        const resp = await fetch(`${API_BASE}/stories`, {
          method: "POST",
          body: form,
          headers,
        });
        const j = await resp.json();
        if (!j.error) {
          await store.delete(item.id);
        }
      } catch (err) {
        console.error("Sync item failed", err);
      }
    }
    await tx.complete;
    db.close();
  } catch (err) {
    console.error("Sync failed", err);
  }
}

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
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_STATIC)
      .then((cache) => cache.addAll([...STATIC_ASSETS, OFFLINE_URL]))
  );
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE_URL))
  );
});
