// src/pages/login.js
export default function LoginPage() {
  const root = document.createElement("main");
  root.id = "main";
  root.innerHTML = `
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
  `;

  const form = root.querySelector("#loginForm");
  const msg = root.querySelector("#loginMessage");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    const body = { email: fd.get("email"), password: fd.get("password") };

    msg.textContent = "Loading...";
    msg.style.color = "";

    try {
      const res = await fetch("https://story-api.dicoding.dev/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.error) {
        msg.textContent = data.message || "Login gagal";
        msg.style.color = "var(--danger)";
        return;
      }

      localStorage.setItem("token", data.loginResult.token);
      localStorage.setItem("name", data.loginResult.name || "");

      msg.textContent = "Login berhasil!";
      msg.style.color = "var(--accent-200)";

      setTimeout(() => {
        location.hash = "#/";
      }, 700);
    } catch (err) {
      msg.textContent = "Network error!";
      msg.style.color = "var(--danger)";
    }
  });

  return root;
}
