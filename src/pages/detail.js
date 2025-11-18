// src/pages/detail.js
export default async function DetailPage() {
  const root = document.createElement("main");
  root.id = "main";
  root.innerHTML = `<p style="text-align:center">Loading story...</p>`;

  // ambil id baik dari format /detail/ID atau /detail?id=ID
  const hash = window.location.hash || "";
  let id = null;

  // format #/detail/ID
  const parts = hash.split("/");
  if (parts.length >= 3 && parts[2]) {
    id = parts[2].split("?")[0];
  }

  // jika masih null, coba query param ?id=
  if (!id) {
    const q = new URLSearchParams(hash.split("?")[1] || "");
    id = q.get("id");
  }

  if (!id) {
    root.innerHTML = `<p style="text-align:center;color:var(--muted)">ID story tidak ditemukan.</p>`;
    return root;
  }

  const token = localStorage.getItem("token") || "";

  try {
    const res = await fetch(`https://story-api.dicoding.dev/v1/stories/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await res.json();

    if (data.error || !data.story) {
      root.innerHTML = `<p style="text-align:center;color:var(--danger)">Error: ${
        data.message || "Tidak dapat memuat story."
      }</p>`;
      return root;
    }

    const story = data.story;

    root.innerHTML = `
      <section class="detail-container">
      <h1>Detail Story</h1>

        <button class="back-btn" aria-label="Kembali">← Back</button>

        <h2 class="title">${story.name}</h2>

        <div class="detail-card card">
          <img src="${story.photoUrl}" alt="Foto story oleh ${
      story.name
    }" class="detail-image"/>

          <div class="detail-meta">
            <h3>${story.name}</h3>
            <p class="detail-date">${new Date(story.createdAt).toLocaleString(
              "id-ID"
            )}</p>
            <p class="detail-desc">${story.description || ""}</p>
          </div>

          <div id="map" class="detail-map" style="height:300px; margin-top:12px; border-radius:8px; overflow:hidden;"></div>
        </div>
      </section>
    `;

    // back button handler
    const backBtn = root.querySelector(".back-btn");
    backBtn.addEventListener("click", () => {
      window.history.back();
    });

    // map
    const lat = story.lat;
    const lon = story.lon;
    const mapDiv = root.querySelector("#map");

    if (lat && lon) {
      const map = L.map(mapDiv).setView([lat, lon], 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
        map
      );
      L.marker([lat, lon])
        .addTo(map)
        .bindPopup(`<strong>${story.name}</strong>`)
        .openPopup();
    } else {
      mapDiv.innerHTML = `<p style="text-align:center;color:var(--muted);padding-top:80px">Tidak ada lokasi</p>`;
    }
  } catch (err) {
    root.innerHTML = `<p style="text-align:center;color:var(--danger)">Gagal memuat detail story.</p>`;
  }

  return root;
}
