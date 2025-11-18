// src/pages/home.js
import { getStories } from "../api.js";
import { getStoriesLocal, saveStoriesLocal } from "../idb.js";

export default async function HomePage() {
  const root = document.createElement("main");
  root.id = "main";

  root.innerHTML = `
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
  `;

  root.querySelector("#logoutBtn").addEventListener("click", () => {
    localStorage.clear();
    location.hash = "#/login";
  });

  const token = localStorage.getItem("token") || "";
  let res = null;
  try {
    res = await getStories({ token, location: 1 });
    if (!res || res.error) throw new Error("API error");
    // store to local idb for offline reading
    try {
      await saveStoriesLocal(res.listStory || []);
    } catch (_) {}
  } catch (err) {
    // fallback to local DB
    const local = await getStoriesLocal();
    if (local && local.length) {
      res = { listStory: local };
    } else {
      res = { listStory: [] };
    }
  }

  const ul = root.querySelector("#list ul");
  if (!res || !res.listStory || !res.listStory.length) {
    ul.innerHTML = "<li>Tidak ada story.</li>";
  } else {
    res.listStory.forEach((st) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <img src="${
          st.photoUrl ||
          (st.photo && URL.createObjectURL(st.photo)) ||
          "/icons/icon-192.png"
        }" alt="Foto story oleh ${st.name}" />
        <div class="info">
          <strong>${st.name}</strong>
          <p>${(st.description || "").slice(0, 80)}${
        st.description && st.description.length > 80 ? "..." : ""
      }</p>
          <a href="#/detail?id=${st.id}">Lihat</a>
        </div>
      `;
      ul.appendChild(li);
    });
  }

  setTimeout(() => initMap(res.listStory || []), 0);

  function initMap(stories) {
    const mapDiv = root.querySelector("#map");
    if (!mapDiv) return;

    const map = L.map(mapDiv, { zoomControl: true }).setView([0, 0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    const coords = [];
    stories.forEach((st) => {
      if (st.lat && st.lon) {
        const marker = L.marker([st.lat, st.lon]).addTo(map);
        coords.push([st.lat, st.lon]);
        marker.bindPopup(`
          <strong>${st.name}</strong><br>
          ${st.description ? st.description.slice(0, 120) : ""}<br>
          <img src="${
            st.photoUrl || "/icons/icon-192.png"
          }" style="width:150px; margin-top:6px;">
        `);
      }
    });

    if (coords.length) map.fitBounds(coords);

    setTimeout(() => map.invalidateSize(true), 200);
  }

  return root;
}
