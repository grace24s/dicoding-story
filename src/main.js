// src/main.js
import router from "./router.js";
const app = document.getElementById("app");

const header = document.createElement("header");
header.innerHTML = `<nav>
<a href="#/">Home</a>
<a href="#/add">Tambah Story</a>
<a href="#/login">Login</a>
</nav>`;
app.appendChild(header);

const root = document.createElement("div");
root.id = "root-view";
app.appendChild(root);

const r = router(root);
window.addEventListener("hashchange", () => {
  setTimeout(() => {
    const main = root.querySelector("main");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus();
    }
  }, 350);
});
r.render();
