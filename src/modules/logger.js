// JARVIS V8 — Console logger

import { $, escapeHTML } from "./dom.js";

export function log(text) {
  const box = $("co");
  if (!box) return;

  const now = new Date().toTimeString().split(" ")[0];
  const line = document.createElement("div");
  line.innerHTML = `<span class="logTime">[${now}]</span> ${text}`;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

export function clearLog() {
  const box = $("co");
  if (!box) return;

  box.innerHTML = `<div><span class="logTime">[SYSTEM]</span> Console nettoyée.</div>`;
}

export function logError(message) {
  log(`<span class="logERR">❌ ${escapeHTML(message)}</span>`);
}

export function logWarning(message) {
  log(`<span class="logWARN">⚠️ ${escapeHTML(message)}</span>`);
}

export function logOK(message) {
  log(`<span class="logOK">${escapeHTML(message)}</span>`);
}
