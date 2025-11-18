// src/pages/addStory.js
import { addStory } from "../api.js";

export default async function AddStoryPage() {
  const root = document.createElement("main");
  root.id = "main";

  root.innerHTML = `
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
  `;

  // -----------------------------
  // INIT MINI MAP (with delay)
  // -----------------------------
  setTimeout(() => {
    const map = L.map(root.querySelector("#mini-map")).setView([0, 0], 2);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
      map
    );

    let marker;
    map.on("click", (e) => {
      const { lat, lng } = e.latlng;
      if (!marker) marker = L.marker([lat, lng]).addTo(map);
      else marker.setLatLng([lat, lng]);

      root.querySelector("input[name=lat]").value = lat;
      root.querySelector("input[name=lon]").value = lng;

      root.querySelector(
        "#coordPreview"
      ).textContent = `Koordinat: ${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    });

    setTimeout(() => map.invalidateSize(true), 200);
  }, 0);

  // -----------------------------
  // Camera
  // -----------------------------
  let stream = null;
  const cameraWrap = root.querySelector("#cameraWrap");

  root.querySelector("#useCamera").addEventListener("click", async () => {
    const video = root.querySelector("#video");

    if (cameraWrap.hidden) {
      cameraWrap.hidden = false;
      stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
    } else {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      cameraWrap.hidden = true;
      stream = null;
    }
  });

  root.querySelector("#capture").addEventListener("click", () => {
    const video = root.querySelector("#video");
    const canvas = root.querySelector("#canvas");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      const dt = new DataTransfer();
      dt.items.add(file);
      root.querySelector("#photo").files = dt.files;
    });

    if (stream) stream.getTracks().forEach((t) => t.stop());
    cameraWrap.hidden = true;
    stream = null;
  });

  // -----------------------------
  // Submit
  // -----------------------------
  root.querySelector("#storyForm").addEventListener("submit", async (ev) => {
    ev.preventDefault();

    const form = ev.target;
    const description = form.description.value.trim();
    const file = form.photo.files[0];
    const lat = form.lat.value;
    const lon = form.lon.value;
    const token = localStorage.getItem("token") || "";

    const msg = root.querySelector("#msg");
    msg.textContent = "Mengirim...";

    const res = await addStory({
      token,
      description,
      file,
      lat: lat || undefined,
      lon: lon || undefined,
    });

    if (!res.error) {
      msg.textContent = "Berhasil membuat story!";
      location.hash = "#/";
    } else {
      msg.textContent = "Gagal: " + res.message;
    }
  });

  return root;
}
