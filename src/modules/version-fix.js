// JARVIS V8.9.1 — compatibility display fix
// Keeps the startup console label aligned with the active UI version.
const VERSION = "V8.9.1";

function fixVersionLog() {
  const consoleEl = document.getElementById("co");
  if (!consoleEl) return;
  for (const node of consoleEl.querySelectorAll("*")) {
    if (node.children.length === 0 && /JARVIS V8\.9\s*[—-]\s*version test/i.test(node.textContent || "")) {
      node.textContent = node.textContent.replace(/JARVIS V8\.9\b/i, `JARVIS ${VERSION}`);
    }
  }
}

function init() {
  fixVersionLog();
  const root = document.getElementById("jarvisRoot") || document.body;
  new MutationObserver(fixVersionLog).observe(root, { childList: true, subtree: true });
}

if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", init, { once: true });
else init();
