// src/main.js
import router from "./router.js";
import {
  VAPID_PUBLIC,
  urlBase64ToUint8Array,
  subscribeServer,
  unsubscribeServer,
} from "./api.js";

const app = document.getElementById("app");

/* HEADER with subscribe toggle */
const header = document.createElement("header");
header.innerHTML = `
<nav>
  <a href="#/">Home</a>
  <a href="#/add">Tambah Story</a>
  <a href="#/login">Login</a>
  <button id="logoutBtn" class="btn-logout" style="margin-left:12px">Logout</button>
</nav>

<div class="header-actions">
  <label id="pushLabel" class="push-toggle">
    <input id="pushToggle" type="checkbox" />
    <span class="toggle-slider"></span>
    <span>Push Notifications</span>
  </label>
</div>
`;
app.appendChild(header);

const root = document.createElement("div");
root.id = "root-view";
app.appendChild(root);

const r = router(root);

/* focus management on hash change */
window.addEventListener("hashchange", () => {
  setTimeout(() => {
    const main = root.querySelector("main");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus();
    }
  }, 350);
});

/* Service Worker registration & Push subscription state */
let deferredInstallPrompt = null;

async function initServiceWorkerAndPush() {
  if ("serviceWorker" in navigator) {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      console.log("Service Worker registered", reg);

      // Track install prompt
      window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        const box = document.getElementById("installPrompt");
        if (box) box.hidden = false;
      });

      // update UI for install button
      const btnInstall = document.getElementById("btnInstall");
      const btnDismissInstall = document.getElementById("btnDismissInstall");
      if (btnInstall) {
        btnInstall.addEventListener("click", async () => {
          if (!deferredInstallPrompt) return;
          deferredInstallPrompt.prompt();
          const choice = await deferredInstallPrompt.userChoice;
          deferredInstallPrompt = null;
          document.getElementById("installPrompt").hidden = true;
        });
      }
      if (btnDismissInstall) {
        btnDismissInstall.addEventListener("click", () => {
          document.getElementById("installPrompt").hidden = true;
        });
      }

      // Setup push toggle initial state
      const pushToggle = document.getElementById("pushToggle");
      if (pushToggle) {
        const isSub = await isSubscribed(reg);
        pushToggle.checked = isSub;
        pushToggle.addEventListener("change", async (ev) => {
          if (ev.target.checked) {
            await subscribeUser(reg);
          } else {
            await unsubscribeUser(reg);
          }
        });
      }
    } catch (err) {
      console.error("SW register failed", err);
    }
  } else {
    console.log("Service Worker not supported");
  }
}

async function isSubscribed(reg) {
  try {
    const sub = await reg.pushManager.getSubscription();
    return !!sub;
  } catch (e) {
    return false;
  }
}

async function subscribeUser(reg) {
  try {
    // Wajib minta izin notifikasi dulu
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      alert("Izin notifikasi ditolak.");
      document.getElementById("pushToggle").checked = false;
      return false;
    }

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    });

    const token = localStorage.getItem("token");

    // Format WAJIB : endpoint + keys lengkap
    await subscribeServer({
      token,
      subscription: {
        endpoint: sub.endpoint,
        keys: sub.toJSON().keys,
      },
    });

    return true;
  } catch (err) {
    console.error("subscribe failed", err);
    document.getElementById("pushToggle").checked = false;
    return false;
  }
}

async function unsubscribeUser(reg) {
  try {
    const sub = await reg.pushManager.getSubscription();
    const token = localStorage.getItem("token");

    if (sub) {
      await unsubscribeServer({
        token,
        endpoint: sub.endpoint,
      });

      await sub.unsubscribe();
    }

    return true;
  } catch (err) {
    console.error("unsubscribe failed", err);
    return false;
  }
}

document.addEventListener("click", (ev) => {
  if (ev.target.id === "logoutBtn") {
    localStorage.clear();
    location.hash = "#/login";
  }
});

// saat SW ter-registrasi, beforeinstallprompt event di-handle oleh window listener (main.js)
pushToggle.addEventListener("change", async (ev) => {
  if (ev.target.checked) {
    const ok = await subscribeUser(reg);
    if (!ok) ev.target.checked = false;
  } else {
    await unsubscribeUser(reg);
  }
});

/* init */
initServiceWorkerAndPush();
r.render();

/* expose for debugging */
window.__app = { subscribeUser, unsubscribeUser };
