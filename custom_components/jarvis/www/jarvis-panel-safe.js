(() => {
  'use strict';
  const NAME = 'jarvis-safe-panel';
  if (customElements.get(NAME)) return;
  class JarvisSafePanel extends HTMLElement {
    set hass(hass) { this._hass = hass; this.render(); }
    connectedCallback() { if (!this.shadowRoot) this.attachShadow({mode:'open'}); this.render(); }
    render() {
      if (!this.shadowRoot) return;
      const count = Object.keys(this._hass?.states || {}).length;
      this.shadowRoot.innerHTML = `<style>:host{display:block;height:100%;overflow:auto;background:#01050c;color:#d9faff;font-family:Arial,sans-serif}.wrap{min-height:100%;display:grid;place-items:center;text-align:center}.logo{font-size:42px;letter-spacing:10px;color:#8fefff;text-shadow:0 0 20px #00eaff}.sub{margin-top:12px;color:#6fa6b8;font-size:12px;letter-spacing:2px}</style><div class="wrap"><div><div class="logo">JARVIS</div><div class="sub">HOME ASSISTANT • ${count} ENTITÉS</div></div></div>`;
    }
  }
  customElements.define(NAME, JarvisSafePanel);
})();
