import "./jarvis-panel-v10-8.js";

(() => {
  "use strict";
  if (customElements.get("jarvis-native-panel-v109")) return;

  const Base = customElements.get("jarvis-native-panel-v108");
  if (!Base) return;

  class JarvisPanelV109 extends Base {
    constructor() {
      super();
      this.favoriteOnly = false;
    }

    render() {
      super.render();
      const root = this.shadowRoot;
      if (!root) return;

      const head = root.querySelector(".head");
      if (!head || root.querySelector("[data-favorite-filter]")) {
        this.applyFavoriteFilter();
        return;
      }

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.favoriteFilter = "";
      button.textContent = this.favoriteOnly ? "⭐ FAVORIS" : "⭐ TOUS";
      button.style.cssText = "height:36px;padding:0 10px;border:1px solid rgba(0,220,255,.28);border-radius:8px;background:#03101b;color:#9fefff;cursor:pointer";
      button.addEventListener("click", () => {
        this.favoriteOnly = !this.favoriteOnly;
        button.textContent = this.favoriteOnly ? "⭐ FAVORIS" : "⭐ TOUS";
        this.applyFavoriteFilter();
      });
      head.insertBefore(button, head.querySelector(".search") || null);
      this.applyFavoriteFilter();
    }

    applyFavoriteFilter() {
      const root = this.shadowRoot;
      if (!root) return;
      root.querySelectorAll(".grid .item").forEach((item) => {
        const star = item.querySelector("[data-fav]");
        const isFavorite = star?.classList.contains("fav");
        item.style.display = this.favoriteOnly && !isFavorite ? "none" : "";
      });
    }
  }

  customElements.define("jarvis-native-panel-v109", JarvisPanelV109);
})();
