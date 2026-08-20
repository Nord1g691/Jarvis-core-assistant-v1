// JARVIS V8 — Console logger

const box = () => document.getElementById("co");

export function log(text) {
  const target = box();
  if (!target) return;
  const line = document.createElement("div");
  const time = new Date().toTimeString().split(" ")[0];
  line.innerHTML = `<span class="logTime">[${time}]</span> ${escapeHTML(text)}`;
  target.appendChild(line);
  target.scrollTop = target.scrollHeight;
}

export function logOK(text) { log(`<span class="logOK">${text}</span>`); }
export function logWarn(text) { log(`<span class="logWARN">${text}</span>`); }
export function logError(text) { log(`<span class="logERR">${text}</span>`); }

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
