// JARVIS V8 — Central configuration

export const HA_URL = window.location.origin;
export const HA_TOKEN = "";
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
