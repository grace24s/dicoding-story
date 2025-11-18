(function(){const i=document.createElement("link").relList;if(i&&i.supports&&i.supports("modulepreload"))return;for(const t of document.querySelectorAll('link[rel="modulepreload"]'))n(t);new MutationObserver(t=>{for(const o of t)if(o.type==="childList")for(const s of o.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&n(s)}).observe(document,{childList:!0,subtree:!0});function a(t){const o={};return t.integrity&&(o.integrity=t.integrity),t.referrerPolicy&&(o.referrerPolicy=t.referrerPolicy),t.crossOrigin==="use-credentials"?o.credentials="include":t.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(t){if(t.ep)return;t.ep=!0;const o=a(t);fetch(t.href,o)}})();const h="https://story-api.dicoding.dev/v1";async function v({token:e,page:i=1,size:a=20,location:n=0}){return(await fetch(`${h}/stories?page=${i}&size=${a}&location=${n}`,{headers:e?{Authorization:`Bearer ${e}`}:{}})).json()}async function b({token:e,description:i,file:a,lat:n,lon:t}){const o=new FormData;return o.append("description",i),o.append("photo",a),n&&o.append("lat",n),t&&o.append("lon",t),(await fetch(`${h}/stories`,{method:"POST",headers:e?{Authorization:`Bearer ${e}`}:{},body:o})).json()}async function u(){const e=document.createElement("main");e.id="main",e.innerHTML=`
    <header>
      <h1>Dicoding Story</h1>
      <nav>
        <a href="#/add">Tambah Story</a>
        <button id="logoutBtn" class="btn-logout">Logout</button>
      </nav>
    </header>

    <section id="list">
      <h2>Daftar Story</h2>
      <ul aria-live="polite"></ul>
    </section>

    <section id="map" aria-label="Peta cerita"></section>
  `,e.querySelector("#logoutBtn").addEventListener("click",()=>{localStorage.clear(),location.hash="#/login"});const i=localStorage.getItem("token")||"",a=await v({token:i,location:1}),n=e.querySelector("#list ul");if(!a||!a.listStory)return n.innerHTML="<li>Tidak ada story.</li>",e;a.listStory.forEach(o=>{const s=document.createElement("li");s.innerHTML=`
      <img src="${o.photoUrl}" alt="Foto story oleh ${o.name}" />
      <div class="info">
        <strong>${o.name}</strong>
        <p>${o.description.slice(0,80)}...</p>
        <a href="#/detail?id=${o.id}">Lihat</a>
      </div>
    `,n.appendChild(s)}),setTimeout(()=>t(a.listStory),0);function t(o){const s=e.querySelector("#map");if(!s)return;const r=L.map(s,{zoomControl:!0}).setView([0,0],2);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:"&copy; OpenStreetMap contributors"}).addTo(r);const d=[];o.forEach(l=>{if(l.lat&&l.lon){const c=L.marker([l.lat,l.lon]).addTo(r);d.push([l.lat,l.lon]),c.bindPopup(`
          <strong>${l.name}</strong><br>
          ${l.description.slice(0,120)}<br>
          <img src="${l.photoUrl}" style="width:150px; margin-top:6px;">
        `)}}),d.length&&r.fitBounds(d),setTimeout(()=>{r.invalidateSize(!0)},200)}return e}function w(){const e=document.createElement("main");e.id="main",e.innerHTML=`
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
  `;const i=e.querySelector("#loginForm"),a=e.querySelector("#loginMessage");return i.addEventListener("submit",async n=>{n.preventDefault();const t=new FormData(i),o={email:t.get("email"),password:t.get("password")};a.textContent="Loading...",a.style.color="";try{const r=await(await fetch("https://story-api.dicoding.dev/v1/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)})).json();if(r.error){a.textContent=r.message||"Login gagal",a.style.color="var(--danger)";return}localStorage.setItem("token",r.loginResult.token),localStorage.setItem("name",r.loginResult.name||""),a.textContent="Login berhasil!",a.style.color="var(--accent-200)",setTimeout(()=>{location.hash="#/"},700)}catch{a.textContent="Network error!",a.style.color="var(--danger)"}}),e}function S(){const e=document.createElement("main");e.id="main",e.innerHTML=`
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
  `;const i=e.querySelector("#registerForm"),a=e.querySelector("#registerMessage");return i.addEventListener("submit",async n=>{n.preventDefault();const t=new FormData(i),o={name:t.get("name"),email:t.get("email"),password:t.get("password")};a.textContent="Loading...",a.style.color="";try{const r=await(await fetch("https://story-api.dicoding.dev/v1/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(o)})).json();if(r.error){a.textContent=r.message||"Register gagal",a.style.color="var(--danger)";return}a.textContent="Berhasil daftar! Silakan login.",a.style.color="var(--accent-200)",setTimeout(()=>{location.hash="#/login"},700)}catch{a.textContent="Network error!",a.style.color="var(--danger)"}}),e}async function T(){const e=document.createElement("main");e.id="main",e.innerHTML=`
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
  `,setTimeout(()=>{const n=L.map(e.querySelector("#mini-map")).setView([0,0],2);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(n);let t;n.on("click",o=>{const{lat:s,lng:r}=o.latlng;t?t.setLatLng([s,r]):t=L.marker([s,r]).addTo(n),e.querySelector("input[name=lat]").value=s,e.querySelector("input[name=lon]").value=r,e.querySelector("#coordPreview").textContent=`Koordinat: ${s.toFixed(5)}, ${r.toFixed(5)}`}),setTimeout(()=>n.invalidateSize(!0),200)},0);let i=null;const a=e.querySelector("#cameraWrap");return e.querySelector("#useCamera").addEventListener("click",async()=>{const n=e.querySelector("#video");a.hidden?(a.hidden=!1,i=await navigator.mediaDevices.getUserMedia({video:!0}),n.srcObject=i):(i&&i.getTracks().forEach(t=>t.stop()),a.hidden=!0,i=null)}),e.querySelector("#capture").addEventListener("click",()=>{const n=e.querySelector("#video"),t=e.querySelector("#canvas");t.width=n.videoWidth,t.height=n.videoHeight,t.getContext("2d").drawImage(n,0,0),t.toBlob(o=>{const s=new File([o],"capture.jpg",{type:"image/jpeg"}),r=new DataTransfer;r.items.add(s),e.querySelector("#photo").files=r.files}),i&&i.getTracks().forEach(o=>o.stop()),a.hidden=!0,i=null}),e.querySelector("#storyForm").addEventListener("submit",async n=>{n.preventDefault();const t=n.target,o=t.description.value.trim(),s=t.photo.files[0],r=t.lat.value,d=t.lon.value,l=localStorage.getItem("token")||"",c=e.querySelector("#msg");c.textContent="Mengirim...";const p=await b({token:l,description:o,file:s,lat:r||void 0,lon:d||void 0});p.error?c.textContent="Gagal: "+p.message:(c.textContent="Berhasil membuat story!",location.hash="#/")}),e}async function k(){const e=document.createElement("main");e.id="main",e.innerHTML='<p style="text-align:center">Loading story...</p>';const i=window.location.hash||"";let a=null;const n=i.split("/");if(n.length>=3&&n[2]&&(a=n[2].split("?")[0]),a||(a=new URLSearchParams(i.split("?")[1]||"").get("id")),!a)return e.innerHTML='<p style="text-align:center;color:var(--muted)">ID story tidak ditemukan.</p>',e;const t=localStorage.getItem("token")||"";try{const s=await(await fetch(`https://story-api.dicoding.dev/v1/stories/${a}`,{headers:t?{Authorization:`Bearer ${t}`}:{}})).json();if(s.error||!s.story)return e.innerHTML=`<p style="text-align:center;color:var(--danger)">Error: ${s.message||"Tidak dapat memuat story."}</p>`,e;const r=s.story;e.innerHTML=`
      <section class="detail-container">
      <h1>Detail Story</h1>

        <button class="back-btn" aria-label="Kembali">← Back</button>

        <h2 class="title">${r.name}</h2>

        <div class="detail-card card">
          <img src="${r.photoUrl}" alt="Foto story oleh ${r.name}" class="detail-image"/>

          <div class="detail-meta">
            <h3>${r.name}</h3>
            <p class="detail-date">${new Date(r.createdAt).toLocaleString("id-ID")}</p>
            <p class="detail-desc">${r.description||""}</p>
          </div>

          <div id="map" class="detail-map" style="height:300px; margin-top:12px; border-radius:8px; overflow:hidden;"></div>
        </div>
      </section>
    `,e.querySelector(".back-btn").addEventListener("click",()=>{window.history.back()});const l=r.lat,c=r.lon,p=e.querySelector("#map");if(l&&c){const g=L.map(p).setView([l,c],13);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(g),L.marker([l,c]).addTo(g).bindPopup(`<strong>${r.name}</strong>`).openPopup()}else p.innerHTML='<p style="text-align:center;color:var(--muted);padding-top:80px">Tidak ada lokasi</p>'}catch{e.innerHTML='<p style="text-align:center;color:var(--danger)">Gagal memuat detail story.</p>'}return e}const x={"":u,"#/":u,"#/login":w,"#/register":S,"#/add":T,"#/detail":k};function q(e){async function i(){const a=location.hash.split("?")[0],n=x[a]||u;if(document.startViewTransition)document.startViewTransition(async()=>{e.innerHTML="";const t=await n();e.appendChild(t)});else{e.innerHTML="";const t=await n();e.appendChild(t)}}return window.addEventListener("hashchange",i),window.addEventListener("load",i),{render:i}}const y=document.getElementById("app"),f=document.createElement("header");f.innerHTML=`<nav>
<a href="#/">Home</a>
<a href="#/add">Tambah Story</a>
<a href="#/login">Login</a>
</nav>`;y.appendChild(f);const m=document.createElement("div");m.id="root-view";y.appendChild(m);const E=q(m);window.addEventListener("hashchange",()=>{setTimeout(()=>{const e=m.querySelector("main");e&&(e.setAttribute("tabindex","-1"),e.focus())},350)});E.render();
