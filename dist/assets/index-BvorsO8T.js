(function(){const o=document.createElement("link").relList;if(o&&o.supports&&o.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))a(t);new MutationObserver(t=>{for(const n of t)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&a(i)}).observe(document,{childList:!0,subtree:!0});function r(t){const n={};return t.integrity&&(n.integrity=t.integrity),t.referrerPolicy&&(n.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?n.credentials="include":t.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function a(t){if(t.ep)return;t.ep=!0;const n=r(t);fetch(t.href,n)}})();const b="https://story-api.dicoding.dev/v1";async function P({token:e,page:o=1,size:r=20,location:a=0}){return(await fetch(`${b}/stories?page=${o}&size=${r}&location=${a}`,{headers:e?{Authorization:`Bearer ${e}`}:{}})).json()}async function C({token:e,description:o,file:r,lat:a,lon:t}){const n=new FormData;return n.append("description",o),n.append("photo",r),a&&n.append("lat",a),t&&n.append("lon",t),(await fetch(`${b}/stories`,{method:"POST",headers:e?{Authorization:`Bearer ${e}`}:{},body:n})).json()}const D="BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";async function A({token:e,subscription:o}){return(await fetch(`${b}/notifications/subscribe`,{method:"POST",headers:Object.assign({"Content-Type":"application/json"},e?{Authorization:`Bearer ${e}`}:{}),body:JSON.stringify(o)})).json()}async function B({token:e,endpoint:o}){return(await fetch(`${b}/notifications/subscribe`,{method:"DELETE",headers:Object.assign({"Content-Type":"application/json"},e?{Authorization:`Bearer ${e}`}:{}),body:JSON.stringify({endpoint:o})})).json()}function I(e){const o="=".repeat((4-e.length%4)%4),r=(e+o).replace(/\-/g,"+").replace(/_/g,"/"),a=atob(r),t=new Uint8Array(a.length);for(let n=0;n<a.length;++n)t[n]=a.charCodeAt(n);return t}async function $(e){return new Promise((o,r)=>{const a=indexedDB.open("dicoding-db",1);a.onupgradeneeded=t=>{const n=t.target.result;n.objectStoreNames.contains("outbox")||n.createObjectStore("outbox",{keyPath:"id",autoIncrement:!0})},a.onsuccess=t=>{const n=t.target.result,g=n.transaction("outbox","readwrite").objectStore("outbox").add(e);g.onsuccess=()=>{n.close(),o(g.result)},g.onerror=()=>{n.close(),r(g.error)}},a.onerror=()=>r(a.error)})}function S(e="dicoding-db",o=1){return new Promise((r,a)=>{const t=indexedDB.open(e,o);t.onupgradeneeded=n=>{const i=n.target.result;i.objectStoreNames.contains("stories")||i.createObjectStore("stories",{keyPath:"id"}).createIndex("by-date","createdAt"),i.objectStoreNames.contains("outbox")||i.createObjectStore("outbox",{keyPath:"id",autoIncrement:!0})},t.onsuccess=()=>r(t.result),t.onerror=()=>a(t.error)})}async function M(e){const o=await S();return new Promise((r,a)=>{const i=o.transaction("stories","readwrite").objectStore("stories").put(e);i.onsuccess=()=>{r(i.result),o.close()},i.onerror=()=>a(i.error)})}async function j(e){const o=await S();return new Promise((r,a)=>{const i=o.transaction("stories","readwrite").objectStore("stories").delete(e);i.onsuccess=()=>{r(),o.close()},i.onerror=()=>a(i.error)})}async function x(){const e=await S();return new Promise((o,r)=>{const n=e.transaction("stories","readonly").objectStore("stories").getAll();n.onsuccess=()=>{o(n.result),e.close()},n.onerror=()=>r(n.error)})}async function w(){const e=document.createElement("main");e.id="main",e.innerHTML=`
    <header>
      
      <nav>
        <a href="#/add">Tambah Story</a>
        <button id="logoutBtn" class="btn-logout">Logout</button>
      </nav>
    </header>

    <section id="list">
      <h2>Daftar Story</h2>
      <ul aria-live="polite"></ul>
    </section>
    
<div class="story-controls">
  <input id="searchInput" placeholder="Cari story..." />
  <select id="sortSelect">
    <option value="newest">Terbaru</option>
    <option value="oldest">Terlama</option>
    <option value="name-asc">Nama A → Z</option>
    <option value="name-desc">Nama Z → A</option>
  </select>
</div>

    <section id="map" aria-label="Peta cerita" style="margin-top:12px"></section>
  `,e.querySelector("#logoutBtn").addEventListener("click",()=>{localStorage.clear(),location.hash="#/login"});const o=localStorage.getItem("token")||"";let r=[],a="api";try{const u=await P({token:o,location:1});if(!u||u.error)throw new Error("API error");r=u.listStory||[],a="api"}catch{const s=await x();s&&s.length?(r=s,a="local"):r=[]}const t=e.querySelector("#list ul"),n=e.querySelector("#searchInput"),i=e.querySelector("#sortSelect");function c(u){if(t.innerHTML="",!u||u.length===0){t.innerHTML="<li>Tidak ada story.</li>";return}u.forEach(s=>{const d=document.createElement("li");d.style.display="flex",d.style.gap="12px",d.style.alignItems="flex-start",d.style.marginBottom="12px";const p=s.createdAt?new Date(s.createdAt).toLocaleString("id-ID"):"—",l=(s.description||"").slice(0,120)+((s.description||"").length>120?"...":"");d.innerHTML=`
        <img src="${s.photoUrl||"/icons/icon-192.png"}" alt="Foto story oleh ${s.name}" style="width:120px; height:80px; object-fit:cover; border-radius:8px; border:2px solid #e4d4ff;" />
        <div style="flex:1">
          <strong style="display:block; margin-bottom:6px;">${s.name}</strong>
          <p style="margin:0 0 6px">${l}</p>
          <small style="color:#6f5c82">Dibuat: ${p}</small>
          <div style="margin-top:8px; display:flex; gap:8px; align-items:center">
            <a href="#/detail?id=${s.id}" class="btn-view">Lihat</a>
            <button class="btn-save-local" data-id="${s.id}">Simpan Lokal</button>
            <button class="btn-delete-local" data-id="${s.id}">Hapus Lokal</button>
            <span class="local-status" data-id="${s.id}" style="margin-left:8px; color:#2a7f2a;"></span>
          </div>
        </div>
      `,t.appendChild(d)})}function g(u){const s=n.value.trim().toLowerCase();let d=u.slice();s&&(d=d.filter(l=>l.name&&l.name.toLowerCase().includes(s)||l.description&&l.description.toLowerCase().includes(s)));const p=i.value;return p==="newest"?d.sort((l,h)=>new Date(h.createdAt||0)-new Date(l.createdAt||0)):p==="oldest"?d.sort((l,h)=>new Date(l.createdAt||0)-new Date(h.createdAt||0)):p==="name-asc"?d.sort((l,h)=>(l.name||"").localeCompare(h.name||"")):p==="name-desc"&&d.sort((l,h)=>(h.name||"").localeCompare(l.name||"")),d}c(g(r));async function y(){const u=await x(),s=new Set((u||[]).map(d=>d.id));e.querySelectorAll(".local-status").forEach(d=>{const p=d.getAttribute("data-id");d.textContent=s.has(p)?" (Tersimpan lokal)":""})}n.addEventListener("input",()=>{c(g(r)),y()}),i.addEventListener("change",()=>{c(g(r)),y()}),e.addEventListener("click",async u=>{const s=u.target;if(s.matches(".btn-save-local")){const d=s.getAttribute("data-id"),p=r.find(l=>l.id===d);if(!p)return alert("Story tidak ditemukan.");try{await M(p),s.disabled=!0,await y()}catch(l){console.error("saveStoryLocal failed",l),alert("Gagal menyimpan lokal.")}}else if(s.matches(".btn-delete-local")){const d=s.getAttribute("data-id");try{await j(d),await y()}catch(p){console.error("deleteStoryLocal failed",p),alert("Gagal menghapus lokal.")}}}),await y(),setTimeout(()=>m(r||[]),0);function m(u){const s=e.querySelector("#map");if(!s)return;s.style.minHeight="300px";const d=L.map(s,{zoomControl:!0}).setView([0,0],2);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"&copy; OpenStreetMap contributors"}).addTo(d);const p=[];u.forEach(l=>{if(l.lat&&l.lon){const h=L.marker([l.lat,l.lon]).addTo(d);p.push([l.lat,l.lon]),h.bindPopup(`
          <strong>${l.name}</strong><br>
          ${l.description?l.description.slice(0,120):""}<br>
          <img src="${l.photoUrl||"/icons/icon-192.png"}" style="width:150px; margin-top:6px;">
        `)}}),p.length&&d.fitBounds(p),setTimeout(()=>d.invalidateSize(!0),200)}return e}function O(){const e=document.createElement("main");e.id="main",e.innerHTML=`
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
  `;const o=e.querySelector("#loginForm"),r=e.querySelector("#loginMessage");return o.addEventListener("submit",async a=>{a.preventDefault();const t=new FormData(o),n={email:t.get("email"),password:t.get("password")};r.textContent="Loading...",r.style.color="";try{const c=await(await fetch("https://story-api.dicoding.dev/v1/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)})).json();if(c.error){r.textContent=c.message||"Login gagal",r.style.color="var(--danger)";return}localStorage.setItem("token",c.loginResult.token),localStorage.setItem("name",c.loginResult.name||""),r.textContent="Login berhasil!",r.style.color="var(--accent-200)",setTimeout(()=>{location.hash="#/"},700)}catch{r.textContent="Network error!",r.style.color="var(--danger)"}}),e}function H(){const e=document.createElement("main");e.id="main",e.innerHTML=`
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
  `;const o=e.querySelector("#registerForm"),r=e.querySelector("#registerMessage");return o.addEventListener("submit",async a=>{a.preventDefault();const t=new FormData(o),n={name:t.get("name"),email:t.get("email"),password:t.get("password")};r.textContent="Loading...",r.style.color="";try{const c=await(await fetch("https://story-api.dicoding.dev/v1/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(n)})).json();if(c.error){r.textContent=c.message||"Register gagal",r.style.color="var(--danger)";return}r.textContent="Berhasil daftar! Silakan login.",r.style.color="var(--accent-200)",setTimeout(()=>{location.hash="#/login"},700)}catch{r.textContent="Network error!",r.style.color="var(--danger)"}}),e}async function F(){const e=document.createElement("main");e.id="main",e.innerHTML=`
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
  `,setTimeout(()=>{const a=L.map(e.querySelector("#mini-map")).setView([0,0],2);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(a);let t;a.on("click",n=>{const{lat:i,lng:c}=n.latlng;t?t.setLatLng([i,c]):t=L.marker([i,c]).addTo(a),e.querySelector("input[name=lat]").value=i,e.querySelector("input[name=lon]").value=c,e.querySelector("#coordPreview").textContent=`Koordinat: ${i.toFixed(5)}, ${c.toFixed(5)}`}),setTimeout(()=>a.invalidateSize(!0),200)},0);let o=null;const r=e.querySelector("#cameraWrap");return e.querySelector("#useCamera").addEventListener("click",async()=>{const a=e.querySelector("#video");if(r.hidden){r.hidden=!1;try{o=await navigator.mediaDevices.getUserMedia({video:!0}),a.srcObject=o}catch(t){alert("Kamera tidak dapat diakses: "+t.message)}}else o&&o.getTracks().forEach(t=>t.stop()),r.hidden=!0,o=null}),e.querySelector("#capture").addEventListener("click",()=>{const a=e.querySelector("#video"),t=e.querySelector("#canvas");t.width=a.videoWidth,t.height=a.videoHeight,t.getContext("2d").drawImage(a,0,0),t.toBlob(n=>{const i=new File([n],"capture.jpg",{type:"image/jpeg"}),c=new DataTransfer;c.items.add(i),e.querySelector("#photo").files=c.files}),o&&o.getTracks().forEach(n=>n.stop()),r.hidden=!0,o=null}),e.querySelector("#storyForm").addEventListener("submit",async a=>{a.preventDefault();const t=a.target,n=t.description.value.trim(),i=t.photo.files[0],c=t.lat.value,g=t.lon.value,y=localStorage.getItem("token")||"",m=e.querySelector("#msg");if(!n||!i){m.textContent="Deskripsi dan foto wajib diisi.",m.style.color="var(--danger)";return}if(!navigator.onLine||!window.fetch){m.textContent="Anda sedang offline — story akan dikirim saat online.",m.style.color="";const u=new FileReader;u.onload=async()=>{const s=u.result,d=new Blob([s],{type:i.type});if(await $({description:n,photoBlob:d,filename:i.name,lat:c||void 0,lon:g||void 0,token:y||void 0}),"serviceWorker"in navigator&&"SyncManager"in window){const p=await navigator.serviceWorker.ready;try{await p.sync.register("sync-stories-"+Date.now()),console.log("Sync registered")}catch(l){console.warn("Sync register failed",l)}}window.addEventListener("online",async()=>{},{once:!0}),setTimeout(()=>location.hash="#/",900)},u.readAsArrayBuffer(i);return}m.textContent="Mengirim...";try{const u=await C({token:y,description:n,file:i,lat:c||void 0,lon:g||void 0});u.error?(m.textContent="Gagal: "+(u.message||"error"),m.style.color="var(--danger)"):(m.textContent="Berhasil membuat story!",setTimeout(()=>location.hash="#/",700))}catch{m.textContent="Network error!",m.style.color="var(--danger)"}}),e}async function N(){const e=document.createElement("main");e.id="main",e.innerHTML='<p style="text-align:center">Loading story...</p>';const o=window.location.hash||"";let r=null;const a=o.split("/");if(a.length>=3&&a[2]&&(r=a[2].split("?")[0]),r||(r=new URLSearchParams(o.split("?")[1]||"").get("id")),!r)return e.innerHTML='<p style="text-align:center;color:var(--muted)">ID story tidak ditemukan.</p>',e;const t=localStorage.getItem("token")||"";try{const i=await(await fetch(`https://story-api.dicoding.dev/v1/stories/${r}`,{headers:t?{Authorization:`Bearer ${t}`}:{}})).json();if(i.error||!i.story)return e.innerHTML=`<p style="text-align:center;color:var(--danger)">Error: ${i.message||"Tidak dapat memuat story."}</p>`,e;const c=i.story;e.innerHTML=`
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
    `,e.querySelector(".back-btn").addEventListener("click",()=>window.history.back());const y=c.lat,m=c.lon,u=e.querySelector("#map");if(y&&m){const s=L.map(u).setView([y,m],13);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(s),L.marker([y,m]).addTo(s).bindPopup(`<strong>${c.name}</strong>`).openPopup()}else u.innerHTML='<p style="text-align:center;color:var(--muted);padding-top:80px">Tidak ada lokasi</p>'}catch{e.innerHTML='<p style="text-align:center;color:var(--danger)">Gagal memuat detail story.</p>'}return e}const z={"":w,"#/":w,"#/login":O,"#/register":H,"#/add":F,"#/detail":N};function W(e){async function o(){const r=location.hash.split("?")[0],a=z[r]||w;if(document.startViewTransition)document.startViewTransition(async()=>{e.innerHTML="";const t=await a();e.appendChild(t)});else{e.innerHTML="";const t=await a();e.appendChild(t)}}return window.addEventListener("hashchange",o),window.addEventListener("load",o),{render:o}}const k=document.getElementById("app"),T=document.createElement("header");T.innerHTML=`
<nav>
  <a href="#/">Home</a>
  <a href="#/add">Tambah Story</a>
  <a href="#/login">Login</a>
</nav>
<div class="header-actions">
  <label id="pushLabel" class="push-toggle">
  <input id="pushToggle" type="checkbox" />
  <span class="toggle-slider">Push Notifications</span>
  
</label>
</div>
`;k.appendChild(T);const v=document.createElement("div");v.id="root-view";k.appendChild(v);const U=W(v);window.addEventListener("hashchange",()=>{setTimeout(()=>{const e=v.querySelector("main");e&&(e.setAttribute("tabindex","-1"),e.focus())},350)});let f=null;async function K(){if("serviceWorker"in navigator)try{const e=await navigator.serviceWorker.register("/sw.js");console.log("Service Worker registered",e),window.addEventListener("beforeinstallprompt",t=>{t.preventDefault(),f=t;const n=document.getElementById("installPrompt");n&&(n.hidden=!1)});const o=document.getElementById("btnInstall"),r=document.getElementById("btnDismissInstall");o&&o.addEventListener("click",async()=>{if(!f)return;f.prompt();const t=await f.userChoice;f=null,document.getElementById("installPrompt").hidden=!0}),r&&r.addEventListener("click",()=>{document.getElementById("installPrompt").hidden=!0});const a=document.getElementById("pushToggle");if(a){const t=await V(e);a.checked=t,a.addEventListener("change",async n=>{n.target.checked?await E(e):await q(e)})}}catch(e){console.error("SW register failed",e)}else console.log("Service Worker not supported")}async function V(e){try{return!!await e.pushManager.getSubscription()}catch{return!1}}async function E(e){try{const o=await e.pushManager.subscribe({userVisibleOnly:!0,applicationServerKey:I(D)}),r=localStorage.getItem("token");return await A({token:r,subscription:{endpoint:o.endpoint,keys:o.toJSON().keys}}),!0}catch(o){return console.error("subscribe failed",o),!1}}async function q(e){try{const o=await e.pushManager.getSubscription(),r=localStorage.getItem("token");return o&&(await B({token:r,endpoint:o.endpoint}),await o.unsubscribe()),!0}catch(o){return console.error("unsubscribe failed",o),!1}}window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),f=e;const o=document.getElementById("installPrompt");o&&(o.hidden=!1)});K();U.render();window.__app={subscribeUser:E,unsubscribeUser:q};
