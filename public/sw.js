/* sw.js */
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
  // add others if needed
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
      // remove old caches
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

/* Fetch strategy:
  - For navigation/app shell: cache-first (serve cached index.html)
  - For API GET /stories: stale-while-revalidate (cache then network)
  - For images: cache then network (LRU could be added)
*/
self.addEventListener("fetch", (ev) => {
  const req = ev.request;
  const url = new URL(req.url);

  // Handle navigation -> app shell
  if (req.mode === "navigate") {
    ev.respondWith(
      fetch(req).catch(() =>
        caches.match("/").then((res) => res || caches.match(OFFLINE_PAGE))
      )
    );
    return;
  }

  // API stories (GET)
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

  // Images (photoUrl)
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

  // default: try cache then network
  ev.respondWith(
    caches.match(req).then((cached) => {
      return cached || fetch(req).catch(() => caches.match(OFFLINE_PAGE));
    })
  );
});

/* PUSH Notifications */
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
  // ensure actions exist
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

/* Notification click actions */
self.addEventListener("notificationclick", (ev) => {
  ev.notification.close();
  const action = ev.action;

  // If payload attached via data
  const targetUrl =
    (ev.notification && ev.notification.data && ev.notification.data.url) ||
    "/#/";

  ev.waitUntil(
    (async () => {
      const allClients = await clients.matchAll({
        includeUncontrolled: true,
        type: "window",
      });
      let appClient = allClients.find((c) => c.visibilityState === "visible");
      if (
        action === "open_detail" &&
        ev.notification.data &&
        ev.notification.data.storyId
      ) {
        const url = `/#/detail/${ev.notification.data.storyId}`;
        if (appClient) {
          appClient.focus();
          appClient.navigate(url);
        } else {
          clients.openWindow(url);
        }
        return;
      }
      if (appClient) {
        appClient.focus();
        appClient.navigate(targetUrl);
      } else {
        clients.openWindow(targetUrl);
      }
    })()
  );
});

/* Background Sync: try to send queued stories */
self.addEventListener("sync", (ev) => {
  if (ev.tag && ev.tag.startsWith("sync-stories-")) {
    ev.waitUntil(syncQueuedStories());
  }
});

async function syncQueuedStories() {
  // open idb (simple approach using IndexedDB)
  try {
    const db = await openQueuedDB();
    const tx = db.transaction("outbox", "readwrite");
    const store = tx.objectStore("outbox");
    const items = await store.getAll();
    for (const item of items) {
      try {
        // item has fields: description, file (as blob stored via put), lat, lon, token
        const form = new FormData();
        form.append("description", item.description);
        if (item.photoBlob) {
          const blob = item.photoBlob;
          form.append("photo", blob, item.filename || "offline.jpg");
        }
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
          // success -> remove from outbox
          await store.delete(item.id);
        }
      } catch (err) {
        // keep item for next sync
        console.error("Sync item failed", err);
      }
    }
    await tx.complete;
    db.close();
  } catch (err) {
    console.error("Sync failed", err);
  }
}

/* simple IDB open used only by SW for outbox retrieval */
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
