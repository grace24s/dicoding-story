// src/pages/register.js
export default function RegisterPage() {
  const root = document.createElement("main");
  root.id = "main";
  root.innerHTML = `
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
  `;

  const form = root.querySelector("#registerForm");
  const msg = root.querySelector("#registerMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const body = {
      name: fd.get("name"),
      email: fd.get("email"),
      password: fd.get("password"),
    };

    msg.textContent = "Loading...";
    msg.style.color = "";

    try {
      const res = await fetch("https://story-api.dicoding.dev/v1/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.error) {
        msg.textContent = data.message || "Register gagal";
        msg.style.color = "var(--danger)";
        return;
      }

      msg.textContent = "Berhasil daftar! Silakan login.";
      msg.style.color = "var(--accent-200)";

      setTimeout(() => {
        location.hash = "#/login";
      }, 700);
    } catch (err) {
      msg.textContent = "Network error!";
      msg.style.color = "var(--danger)";
    }
  });

  return root;
}
