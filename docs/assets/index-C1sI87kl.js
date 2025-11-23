(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))a(t);new MutationObserver(t=>{for(const r of t)if(r.type==="childList")for(const i of r.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&a(i)}).observe(document,{childList:!0,subtree:!0});function o(t){const r={};return t.integrity&&(r.integrity=t.integrity),t.referrerPolicy&&(r.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?r.credentials="include":t.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function a(t){if(t.ep)return;t.ep=!0;const r=o(t);fetch(t.href,r)}})();const b="https://story-api.dicoding.dev/v1";async function P({token:e,page:n=1,size:o=20,location:a=0}){return(await fetch(`${b}/stories?page=${n}&size=${o}&location=${a}`,{headers:e?{Authorization:`Bearer ${e}`}:{}})).json()}async function C({token:e,description:n,file:o,lat:a,lon:t}){const r=new FormData;return r.append("description",n),r.append("photo",o),a&&r.append("lat",a),t&&r.append("lon",t),(await fetch(`${b}/stories`,{method:"POST",headers:e?{Authorization:`Bearer ${e}`}:{},body:r})).json()}const B="BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";async function D({token:e,subscription:n}){return(await fetch(`${b}/notifications/subscribe`,{method:"POST",headers:Object.assign({"Content-Type":"application/json"},e?{Authorization:`Bearer ${e}`}:{}),body:JSON.stringify(n)})).json()}async function A({token:e,endpoint:n}){return(await fetch(`${b}/notifications/subscribe`,{method:"DELETE",headers:Object.assign({"Content-Type":"application/json"},e?{Authorization:`Bearer ${e}`}:{}),body:JSON.stringify({endpoint:n})})).json()}function I(e){const n="=".repeat((4-e.length%4)%4),o=(e+n).replace(/\-/g,"+").replace(/_/g,"/"),a=atob(o),t=new Uint8Array(a.length);for(let r=0;r<a.length;++r)t[r]=a.charCodeAt(r);return t}async function $(e){return new Promise((n,o)=>{const a=indexedDB.open("dicoding-db",1);a.onupgradeneeded=t=>{const r=t.target.result;r.objectStoreNames.contains("outbox")||r.createObjectStore("outbox",{keyPath:"id",autoIncrement:!0})},a.onsuccess=t=>{const r=t.target.result,g=r.transaction("outbox","readwrite").objectStore("outbox").add(e);g.onsuccess=()=>{r.close(),n(g.result)},g.onerror=()=>{r.close(),o(g.error)}},a.onerror=()=>o(a.error)})}function S(e="dicoding-db",n=1){return new Promise((o,a)=>{const t=indexedDB.open(e,n);t.onupgradeneeded=r=>{const i=r.target.result;i.objectStoreNames.contains("stories")||i.createObjectStore("stories",{keyPath:"id"}).createIndex("by-date","createdAt"),i.objectStoreNames.contains("outbox")||i.createObjectStore("outbox",{keyPath:"id",autoIncrement:!0})},t.onsuccess=()=>o(t.result),t.onerror=()=>a(t.error)})}async function M(e){const n=await S();return new Promise((o,a)=>{const i=n.transaction("stories","readwrite").objectStore("stories").put(e);i.onsuccess=()=>{o(i.result),n.close()},i.onerror=()=>a(i.error)})}async function j(e){const n=await S();return new Promise((o,a)=>{const i=n.transaction("stories","readwrite").objectStore("stories").delete(e);i.onsuccess=()=>{o(),n.close()},i.onerror=()=>a(i.error)})}async function T(){const e=await S();return new Promise((n,o)=>{const r=e.transaction("stories","readonly").objectStore("stories").getAll();r.onsuccess=()=>{n(r.result),e.close()},r.onerror=()=>o(r.error)})}async function v(){const e=document.createElement("main");e.id="main",e.innerHTML=`
    <section id="list">
      <h2>Daftar Story</h2>

      <div class="story-controls">
        <input id="searchInput" placeholder="Cari story..." />
        <select id="sortSelect">
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="name-asc">Nama A → Z</option>
          <option value="name-desc">Nama Z → A</option>
        </select>
      </div>

      <ul aria-live="polite"></ul>
    </section>

    <section id="map" aria-label="Peta cerita" style="margin-top:12px"></section>
  `;const n=localStorage.getItem("token")||"";let o=[],a="api";try{const u=await P({token:n,location:1});if(!u||u.error)throw new Error("API error");o=u.listStory||[],a="api"}catch{const s=await T();s&&s.length?(o=s,a="local"):o=[]}const t=e.querySelector("#list ul"),r=e.querySelector("#searchInput"),i=e.querySelector("#sortSelect");function c(u){if(t.innerHTML="",!u||u.length===0){t.innerHTML="<li>Tidak ada story.</li>";return}u.forEach(s=>{const l=document.createElement("li");l.style.display="flex",l.style.gap="12px",l.style.alignItems="flex-start",l.style.marginBottom="12px";const p=s.createdAt?new Date(s.createdAt).toLocaleString("id-ID"):"—",d=(s.description||"").slice(0,120)+((s.description||"").length>120?"...":"");l.innerHTML=`
        <img src="${s.photoUrl||"/icons/icon-192.png"}"
             alt="Foto story oleh ${s.name}"
             style="width:120px;height:80px;object-fit:cover;border-radius:8px;border:2px solid #e4d4ff;" />

        <div style="flex:1">
          <strong style="display:block;margin-bottom:6px;">${s.name}</strong>
          <p style="margin:0 0 6px">${d}</p>
          <small style="color:#6f5c82">Dibuat: ${p}</small>
          <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
            <a href="#/detail?id=${s.id}" class="btn-view">Lihat</a>
            <button class="btn-save-local" data-id="${s.id}">Simpan Lokal</button>
            <button class="btn-delete-local" data-id="${s.id}">Hapus Lokal</button>
            <span class="local-status" data-id="${s.id}" style="margin-left:8px;color:#2a7f2a;"></span>
          </div>
        </div>
      `,t.appendChild(l)})}function g(u){const s=r.value.trim().toLowerCase();let l=u.slice();s&&(l=l.filter(d=>d.name&&d.name.toLowerCase().includes(s)||d.description&&d.description.toLowerCase().includes(s)));const p=i.value;return p==="newest"?l.sort((d,h)=>new Date(h.createdAt||0)-new Date(d.createdAt||0)):p==="oldest"?l.sort((d,h)=>new Date(d.createdAt||0)-new Date(h.createdAt||0)):p==="name-asc"?l.sort((d,h)=>(d.name||"").localeCompare(h.name||"")):p==="name-desc"&&l.sort((d,h)=>(h.name||"").localeCompare(d.name||"")),l}c(g(o));async function y(){const u=await T(),s=new Set((u||[]).map(l=>l.id));e.querySelectorAll(".local-status").forEach(l=>{const p=l.getAttribute("data-id");l.textContent=s.has(p)?" (Tersimpan lokal)":""})}r.addEventListener("input",()=>{c(g(o)),y()}),i.addEventListener("change",()=>{c(g(o)),y()}),e.addEventListener("click",async u=>{const s=u.target;if(s.matches(".btn-save-local")){const l=s.getAttribute("data-id"),p=o.find(d=>d.id===l);if(!p)return alert("Story tidak ditemukan.");try{await M(p),s.disabled=!0,await y()}catch{alert("Gagal menyimpan lokal.")}}else if(s.matches(".btn-delete-local")){const l=s.getAttribute("data-id");try{await j(l),await y()}catch{alert("Gagal menghapus lokal.")}}}),await y(),setTimeout(()=>m(o||[]),0);function m(u){const s=e.querySelector("#map");if(!s)return;s.style.minHeight="300px";const l=L.map(s).setView([0,0],2);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"&copy; OpenStreetMap contributors"}).addTo(l);const p=[];u.forEach(d=>{if(d.lat&&d.lon){const h=L.marker([d.lat,d.lon]).addTo(l);p.push([d.lat,d.lon]),h.bindPopup(`
          <strong>${d.name}</strong><br>
          ${d.description?d.description.slice(0,120):""}<br>
          <img src="${d.photoUrl||"/icons/icon-192.png"}" style="width:150px;margin-top:6px;">
        `)}}),p.length&&l.fitBounds(p),setTimeout(()=>l.invalidateSize(!0),200)}return e}function O(){const e=document.createElement("main");e.id="main",e.innerHTML=`
    <section class="auth-container card">
      <h1>Login</h1>
 
      <form id="loginForm" class="auth-form" aria-label="Form login">

        <label for="email">Email</label>
        <input type="email" name="email" id="email" required />
        
        <label for="password">Password</label>
        <input type="password" name="password" id="password" required minlength="8" />
 
        <button type="submit" class="btn">Login</button>
      </form>
 
      <p class="muted">Belum punya akun? <a href="#/register">Daftar</a></p>
 
      <p id="loginMessage" class="message" role="status" aria-live="polite"></p>
    </section>
  `;const n=e.querySelector("#loginForm"),o=e.querySelector("#loginMessage");return n.addEventListener("submit",async a=>{a.preventDefault();const t=new FormData(n),r={email:t.get("email"),password:t.get("password")};o.textContent="Loading...",o.style.color="";try{const c=await(await fetch("https://story-api.dicoding.dev/v1/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)})).json();if(c.error){o.textContent=c.message||"Login gagal",o.style.color="var(--danger)";return}localStorage.setItem("token",c.loginResult.token),localStorage.setItem("name",c.loginResult.name||""),o.textContent="Login berhasil!",o.style.color="var(--accent-200)",setTimeout(()=>{location.hash="#/"},700)}catch{o.textContent="Network error!",o.style.color="var(--danger)"}}),e}function H(){const e=document.createElement("main");e.id="main",e.innerHTML=`
    <section class="auth-container card">
      <h1>Register</h1>
 
      <form id="registerForm" class="auth-form" aria-label="Form register">

        <label for="name">Nama</label>
        <input type="text" name="name" id="name" required />
        
        <label for="email">Email</label>
        <input type="email" name="email" id="email" required />
        
        <label for="password">Password</label>
        <input type="password" name="password" id="password" required minlength="8" />
 
        <button type="submit" class="btn">Daftar</button>
      </form>
 
      <p class="muted">Sudah punya akun? <a href="#/login">Login</a></p>
 
      <p id="registerMessage" class="message" role="status" aria-live="polite"></p>
    </section>
  `;const n=e.querySelector("#registerForm"),o=e.querySelector("#registerMessage");return n.addEventListener("submit",async a=>{a.preventDefault();const t=new FormData(n),r={name:t.get("name"),email:t.get("email"),password:t.get("password")};o.textContent="Loading...",o.style.color="";try{const c=await(await fetch("https://story-api.dicoding.dev/v1/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(r)})).json();if(c.error){o.textContent=c.message||"Register gagal",o.style.color="var(--danger)";return}o.textContent="Berhasil daftar! Silakan login.",o.style.color="var(--accent-200)",setTimeout(()=>{location.hash="#/login"},700)}catch{o.textContent="Network error!",o.style.color="var(--danger)"}}),e}async function F(){const e=document.createElement("main");e.id="main",e.innerHTML=`
    <h1>Tambah Story</h1>
    <form id="storyForm" aria-label="Form tambah story">
      
      <label for="description">Deskripsi</label>
      <textarea id="description" name="description" required aria-label="Deskripsi cerita"></textarea>

      <label for="photo">Foto (maks 1MB)</label>
      <input id="photo" type="file" name="photo" accept="image/*" required />

      <fieldset>
        <legend>Pilih lokasi (klik peta)</legend>
        <div id="mini-map" style="height:250px"></div>

        <input type="hidden" name="lat" />
        <input type="hidden" name="lon" />

        <p id="coordPreview" aria-live="polite">Koordinat: belum dipilih</p>
      </fieldset>

      <button type="button" id="useCamera">Ambil foto dengan Kamera</button>

      <div id="cameraWrap" hidden>
        <video id="video" autoplay playsinline width="320"></video>
        <button type="button" id="capture">Capture</button>
        <canvas id="canvas" hidden></canvas>
      </div>

      <button type="submit">Kirim</button>
    </form>

    <div id="msg" role="status" aria-live="polite"></div>
  `,setTimeout(()=>{const a=L.map(e.querySelector("#mini-map")).setView([0,0],2);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(a);let t;a.on("click",r=>{const{lat:i,lng:c}=r.latlng;t?t.setLatLng([i,c]):t=L.marker([i,c]).addTo(a),e.querySelector("input[name=lat]").value=i,e.querySelector("input[name=lon]").value=c,e.querySelector("#coordPreview").textContent=`Koordinat: ${i.toFixed(5)}, ${c.toFixed(5)}`}),setTimeout(()=>a.invalidateSize(!0),200)},0);let n=null;const o=e.querySelector("#cameraWrap");return e.querySelector("#useCamera").addEventListener("click",async()=>{const a=e.querySelector("#video");if(o.hidden){o.hidden=!1;try{n=await navigator.mediaDevices.getUserMedia({video:!0}),a.srcObject=n}catch(t){alert("Kamera tidak dapat diakses: "+t.message)}}else n&&n.getTracks().forEach(t=>t.stop()),o.hidden=!0,n=null}),e.querySelector("#capture").addEventListener("click",()=>{const a=e.querySelector("#video"),t=e.querySelector("#canvas");t.width=a.videoWidth,t.height=a.videoHeight,t.getContext("2d").drawImage(a,0,0),t.toBlob(r=>{const i=new File([r],"capture.jpg",{type:"image/jpeg"}),c=new DataTransfer;c.items.add(i),e.querySelector("#photo").files=c.files}),n&&n.getTracks().forEach(r=>r.stop()),o.hidden=!0,n=null}),e.querySelector("#storyForm").addEventListener("submit",async a=>{a.preventDefault();const t=a.target,r=t.description.value.trim(),i=t.photo.files[0],c=t.lat.value,g=t.lon.value,y=localStorage.getItem("token")||"",m=e.querySelector("#msg");if(!r||!i){m.textContent="Deskripsi dan foto wajib diisi.",m.style.color="var(--danger)";return}if(!navigator.onLine||!window.fetch){m.textContent="Anda sedang offline — story akan dikirim saat online.",m.style.color="";const u=new FileReader;u.onload=async()=>{const s=u.result,l=new Blob([s],{type:i.type});if(await $({description:r,photoBlob:l,filename:i.name,lat:c||void 0,lon:g||void 0,token:y||void 0}),"serviceWorker"in navigator&&"SyncManager"in window){const p=await navigator.serviceWorker.ready;try{await p.sync.register("sync-stories-"+Date.now()),console.log("Sync registered")}catch(d){console.warn("Sync register failed",d)}}window.addEventListener("online",async()=>{},{once:!0}),setTimeout(()=>location.hash="#/",900)},u.readAsArrayBuffer(i);return}m.textContent="Mengirim...";try{const u=await C({token:y,description:r,file:i,lat:c||void 0,lon:g||void 0});u.error?(m.textContent="Gagal: "+(u.message||"error"),m.style.color="var(--danger)"):(m.textContent="Berhasil membuat story!",setTimeout(()=>location.hash="#/",700))}catch{m.textContent="Network error!",m.style.color="var(--danger)"}}),e}async function N(){const e=document.createElement("main");e.id="main",e.innerHTML='<p style="text-align:center">Loading story...</p>';const n=window.location.hash||"";let o=null;const a=n.split("/");if(a.length>=3&&a[2]&&(o=a[2].split("?")[0]),o||(o=new URLSearchParams(n.split("?")[1]||"").get("id")),!o)return e.innerHTML='<p style="text-align:center;color:var(--muted)">ID story tidak ditemukan.</p>',e;const t=localStorage.getItem("token")||"";try{const i=await(await fetch(`https://story-api.dicoding.dev/v1/stories/${o}`,{headers:t?{Authorization:`Bearer ${t}`}:{}})).json();if(i.error||!i.story)return e.innerHTML=`<p style="text-align:center;color:var(--danger)">Error: ${i.message||"Tidak dapat memuat story."}</p>`,e;const c=i.story;e.innerHTML=`
      <section class="detail-container">
      <h1>Detail Story</h1>

        <button class="back-btn" aria-label="Kembali">← Back</button>

        <h2 class="title">${c.name}</h2>

        <div class="detail-card card">
          <img src="${c.photoUrl}" alt="Foto story oleh ${c.name}" class="detail-image"/>

          <div class="detail-meta">
            <h3>${c.name}</h3>
            <p class="detail-date">${new Date(c.createdAt).toLocaleString("id-ID")}</p>
            <p class="detail-desc">${c.description||""}</p>
          </div>

          <div id="map" class="detail-map" style="height:300px; margin-top:12px; border-radius:8px; overflow:hidden;"></div>
        </div>
      </section>
    `,e.querySelector(".back-btn").addEventListener("click",()=>window.history.back());const y=c.lat,m=c.lon,u=e.querySelector("#map");if(y&&m){const s=L.map(u).setView([y,m],13);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(s),L.marker([y,m]).addTo(s).bindPopup(`<strong>${c.name}</strong>`).openPopup()}else u.innerHTML='<p style="text-align:center;color:var(--muted);padding-top:80px">Tidak ada lokasi</p>'}catch{e.innerHTML='<p style="text-align:center;color:var(--danger)">Gagal memuat detail story.</p>'}return e}const z={"":v,"#/":v,"#/login":O,"#/register":H,"#/add":F,"#/detail":N};function W(e){async function n(){const o=location.hash.split("?")[0],a=z[o]||v;if(document.startViewTransition)document.startViewTransition(async()=>{e.innerHTML="";const t=await a();e.appendChild(t)});else{e.innerHTML="";const t=await a();e.appendChild(t)}}return window.addEventListener("hashchange",n),window.addEventListener("load",n),{render:n}}const E=document.getElementById("app"),q=document.createElement("header");q.innerHTML=`
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
`;E.appendChild(q);const w=document.createElement("div");w.id="root-view";E.appendChild(w);const U=W(w);window.addEventListener("hashchange",()=>{setTimeout(()=>{const e=w.querySelector("main");e&&(e.setAttribute("tabindex","-1"),e.focus())},350)});let f=null;async function K(){if("serviceWorker"in navigator)try{const e=await navigator.serviceWorker.register("/sw.js");console.log("Service Worker registered",e),window.addEventListener("beforeinstallprompt",t=>{t.preventDefault(),f=t;const r=document.getElementById("installPrompt");r&&(r.hidden=!1)});const n=document.getElementById("btnInstall"),o=document.getElementById("btnDismissInstall");n&&n.addEventListener("click",async()=>{if(!f)return;f.prompt();const t=await f.userChoice;f=null,document.getElementById("installPrompt").hidden=!0}),o&&o.addEventListener("click",()=>{document.getElementById("installPrompt").hidden=!0});const a=document.getElementById("pushToggle");if(a){const t=await V(e);a.checked=t,a.addEventListener("change",async r=>{r.target.checked?await k(e):await x(e)})}}catch(e){console.error("SW register failed",e)}else console.log("Service Worker not supported")}async function V(e){try{return!!await e.pushManager.getSubscription()}catch{return!1}}async function k(e){try{if(await Notification.requestPermission()!=="granted")return alert("Izin notifikasi ditolak."),document.getElementById("pushToggle").checked=!1,!1;const o=await e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:I(B)}),a=localStorage.getItem("token");return await D({token:a,subscription:{endpoint:o.endpoint,keys:o.toJSON().keys}}),!0}catch(n){return console.error("subscribe failed",n),document.getElementById("pushToggle").checked=!1,!1}}async function x(e){try{const n=await e.pushManager.getSubscription(),o=localStorage.getItem("token");return n&&(await A({token:o,endpoint:n.endpoint}),await n.unsubscribe()),!0}catch(n){return console.error("unsubscribe failed",n),!1}}document.addEventListener("click",e=>{e.target.id==="logoutBtn"&&(localStorage.clear(),location.hash="#/login")});pushToggle.addEventListener("change",async e=>{e.target.checked?await k(reg)||(e.target.checked=!1):await x(reg)});K();U.render();window.__app={subscribeUser:k,unsubscribeUser:x};
