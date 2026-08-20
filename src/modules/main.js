// JARVIS V8 — application entry point
import { $ } from "./dom.js";

export function initJarvis() {
  const root = $("jarvisRoot");
  if (!root) return;

  root.innerHTML = `
    <section class="coreZone">
      <div class="core" id="core">
        <div class="sweep"></div>
        <div class="bars" id="bars"></div>
        <div class="ring r1"></div><div class="ring r2"></div>
        <div class="ring r3"></div><div class="ring r4"></div><div class="ring r5"></div>
        <div class="orbit"></div><div class="orbit orbit2"></div>
        <div class="center"><div class="centerGlow"></div><div class="centerCore"></div></div>
        <div class="coreLabel"><div class="coreState" id="coreState">INITIALISATION</div><div class="coreHint" id="coreHint">APPUYER POUR PARLER</div></div>
      </div>
    </section>
  `;
}

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", initJarvis, { once: true });
} else {
  initJarvis();
}
