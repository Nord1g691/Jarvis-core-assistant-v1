import "./jarvis-panel-v10-7.js";

(() => {
  "use strict";
  if (customElements.get("jarvis-native-panel-v108")) return;

  const Base = customElements.get("jarvis-native-panel-v107");
  if (!Base) return;

  class JarvisPanelV108 extends Base {
    energy() {
      const prod = this.pick(["current power production", "production solaire", "solar production", "solar", "pv", "production"]);
      const load = this.pick(["current power consumption", "consommation maison", "consommation", "consumption", "load"]);
      const exp = this.pick(["current power export", "grid export", "export réseau", "export", "injection"]);
      const imp = this.pick(["current power import", "grid import", "import réseau", "import", "achat"]);
      const net = this.pick(["current power net", "net", "grid power", "puissance réseau"]);

      const P = this.num(prod);
      const L = this.num(load);
      const E = this.num(exp);
      const I = this.num(imp);
      const N = this.num(net);

      let surplus = null;
      if (E != null) {
        surplus = E;
      } else if (P != null && L != null) {
        surplus = P - L;
      } else if (N != null) {
        surplus = -N;
      }

      return { P, L, E, I, N, surplus };
    }
  }

  customElements.define("jarvis-native-panel-v108", JarvisPanelV108);
})();
