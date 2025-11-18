//router.js
import HomePage from "./pages/home.js";
import LoginPage from "./pages/login.js";
import RegisterPage from "./pages/register.js";
import AddStoryPage from "./pages/addStory.js";
import DetailPage from "./pages/detail.js";

const routes = {
  "": HomePage,
  "#/": HomePage,
  "#/login": LoginPage,
  "#/register": RegisterPage,
  "#/add": AddStoryPage,
  "#/detail": DetailPage, // detail expects id as query param
};

export default function router(root) {
  async function render() {
    const hash = location.hash.split("?")[0];
    const View = routes[hash] || HomePage;

    if (document.startViewTransition) {
      document.startViewTransition(async () => {
        root.innerHTML = "";
        const content = await View();
        root.appendChild(content);
      });
    } else {
      // fallback jika browser tidak support
      root.innerHTML = "";
      const content = await View();
      root.appendChild(content);
    }
  }

  window.addEventListener("hashchange", render);
  window.addEventListener("load", render);
  return { render };
}
