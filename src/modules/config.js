// JARVIS V8 — Development configuration
// Non-secret configuration only. Never commit a Home Assistant access token here.

// GitHub Pages cannot infer the Home Assistant server from window.location.origin.
// Configure it at runtime with window.JARVIS_HA_URL or localStorage key "jarvis_ha_url".
function getHAUrl() {
  const runtimeUrl = typeof window.JARVIS_HA_URL === "string"
    ? window.JARVIS_HA_URL.trim()
    : "";

  if (runtimeUrl) return runtimeUrl.replace(/\/$/, "");

  try {
    const storedUrl = localStorage.getItem("jarvis_ha_url")?.trim() || "";
    if (storedUrl) return storedUrl.replace(/\/$/, "");
  } catch {
    // localStorage may be unavailable in private/restricted contexts.
  }

  return "";
}

export const HA_URL = getHAUrl();

export const JARVIS_PIPELINE = "01kwz1dfca1k9td4g348ajzfw";
export const JARVIS_AGENT = "conversation.google_ai_conversation_2";
export const JARVIS_SATELLITE = "assist_satellite.jarvis_iphone";

export const ENERGY_SENSORS = {
  production: "sensor.envoy_122323101280_production_solaire_instantanee",
  consumption: "sensor.envoy_122323101280_consommation_electrique_actuelle",
  import: "sensor.puissance_import_reseau",
  export: "sensor.puissance_export_reseau"
};

export const SENSOR_FAIL_THRESHOLD = 3;

export const JARVIS_MUSIC = [
  { name: "Thunderstruck", file: "music/thunderstruck.mp3" },
  { name: "Shoot to Thrill", file: "music/shoot-to-thrill.mp3" }
];

export const MUSIC_DUCK_FACTOR = 0.18;
