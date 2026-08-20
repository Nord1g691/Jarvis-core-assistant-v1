// JARVIS V8 — Development configuration
// Non-secret configuration only. Never commit a Home Assistant access token here.

export const HA_URL = window.location.origin;

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
