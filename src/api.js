// src/api.js
const BASE = "https://story-api.dicoding.dev/v1";

export async function register({ name, email, password }) {
  const res = await fetch(`${BASE}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return res.json();
}

export async function login({ email, password }) {
  const res = await fetch(`${BASE}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getStories({ token, page = 1, size = 20, location = 0 }) {
  const res = await fetch(
    `${BASE}/stories?page=${page}&size=${size}&location=${location}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  return res.json();
}

export async function getStoryDetail({ token, id }) {
  const res = await fetch(`${BASE}/stories/${id}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
}

export async function addStory({ token, description, file, lat, lon }) {
  const fd = new FormData();
  fd.append("description", description);
  fd.append("photo", file);
  if (lat) fd.append("lat", lat);
  if (lon) fd.append("lon", lon);

  const res = await fetch(`${BASE}/stories`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  return res.json();
}
