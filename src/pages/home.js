// src/pages/home.js
import { getStories } from "../api.js";
import { getStoriesLocal, saveStoryLocal, deleteStoryLocal } from "../idb.js";

export default async function HomePage() {
  const root = document.createElement("main");
  root.id = "main";

  root.innerHTML = `
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
  `;

  // ---- LOGOUT DIPINDAHKAN KE GLOBAL HEADER ----
  // Tidak ada logout di Home lagi

  const token = localStorage.getItem("token") || "";
  let apiStories = [];
  let usedSource = "api";

  // Try fetch API
  try {
    const res = await getStories({ token, location: 1 });
    if (!res || res.error) throw new Error("API error");
    apiStories = res.listStory || [];
    usedSource = "api";
  } catch (err) {
    const local = await getStoriesLocal();
    if (local && local.length) {
      apiStories = local;
      usedSource = "local";
    } else {
      apiStories = [];
    }
  }

  const ul = root.querySelector("#list ul");
  const searchInput = root.querySelector("#searchInput");
  const sortSelect = root.querySelector("#sortSelect");

  function renderList(stories) {
    ul.innerHTML = "";
    if (!stories || stories.length === 0) {
      ul.innerHTML = "<li>Tidak ada story.</li>";
      return;
    }

    stories.forEach((st) => {
      const li = document.createElement("li");
      li.style.display = "flex";
      li.style.gap = "12px";
      li.style.alignItems = "flex-start";
      li.style.marginBottom = "12px";

      const createdText = st.createdAt
        ? new Date(st.createdAt).toLocaleString("id-ID")
        : "—";
      const descShort =
        (st.description || "").slice(0, 120) +
        ((st.description || "").length > 120 ? "..." : "");

      li.innerHTML = `
        <img src="${st.photoUrl || "/icons/icon-192.png"}"
             alt="Foto story oleh ${st.name}"
             style="width:120px;height:80px;object-fit:cover;border-radius:8px;border:2px solid #e4d4ff;" />

        <div style="flex:1">
          <strong style="display:block;margin-bottom:6px;">${st.name}</strong>
          <p style="margin:0 0 6px">${descShort}</p>
          <small style="color:#6f5c82">Dibuat: ${createdText}</small>
          <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
            <a href="#/detail?id=${st.id}" class="btn-view">Lihat</a>
            <button class="btn-save-local" data-id="${
              st.id
            }">Simpan Lokal</button>
            <button class="btn-delete-local" data-id="${
              st.id
            }">Hapus Lokal</button>
            <span class="local-status" data-id="${
              st.id
            }" style="margin-left:8px;color:#2a7f2a;"></span>
          </div>
        </div>
      `;
      ul.appendChild(li);
    });
  }

  // Filtering/sorting helpers
  function applySearchAndSort(list) {
    const q = searchInput.value.trim().toLowerCase();
    let filtered = list.slice();

    if (q) {
      filtered = filtered.filter(
        (s) =>
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.description && s.description.toLowerCase().includes(q))
      );
    }

    const sort = sortSelect.value;
    if (sort === "newest") {
      filtered.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    } else if (sort === "oldest") {
      filtered.sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
      );
    } else if (sort === "name-asc") {
      filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else if (sort === "name-desc") {
      filtered.sort((a, b) => (b.name || "").localeCompare(a.name || ""));
    }

    return filtered;
  }

  renderList(applySearchAndSort(apiStories));

  async function refreshLocalStatus() {
    const local = await getStoriesLocal();
    const set = new Set((local || []).map((s) => s.id));
    root.querySelectorAll(".local-status").forEach((el) => {
      const id = el.getAttribute("data-id");
      el.textContent = set.has(id) ? " (Tersimpan lokal)" : "";
    });
  }

  searchInput.addEventListener("input", () => {
    renderList(applySearchAndSort(apiStories));
    refreshLocalStatus();
  });

  sortSelect.addEventListener("change", () => {
    renderList(applySearchAndSort(apiStories));
    refreshLocalStatus();
  });

  root.addEventListener("click", async (ev) => {
    const t = ev.target;
    if (t.matches(".btn-save-local")) {
      const id = t.getAttribute("data-id");
      const story = apiStories.find((s) => s.id === id);
      if (!story) return alert("Story tidak ditemukan.");
      try {
        await saveStoryLocal(story);
        t.disabled = true;
        await refreshLocalStatus();
      } catch (err) {
        alert("Gagal menyimpan lokal.");
      }
    } else if (t.matches(".btn-delete-local")) {
      const id = t.getAttribute("data-id");
      try {
        await deleteStoryLocal(id);
        await refreshLocalStatus();
      } catch (err) {
        alert("Gagal menghapus lokal.");
      }
    }
  });

  await refreshLocalStatus();

  // Map init
  setTimeout(() => initMap(apiStories || []), 0);

  function initMap(stories) {
    const mapDiv = root.querySelector("#map");
    if (!mapDiv) return;

    mapDiv.style.minHeight = "300px";

    const map = L.map(mapDiv).setView([0, 0], 2);
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
          }" style="width:150px;margin-top:6px;">
        `);
      }
    });

    if (coords.length) map.fitBounds(coords);

    setTimeout(() => map.invalidateSize(true), 200);
  }

  return root;
}
