// JARVIS V8 — Assist Satellite iPhone

import { JARVIS_SATELLITE, HA_URL } from "./config.js";
import { log, logError, logOK } from "./logger.js";
import { setCoreState } from "./core-state.js";

function getWebSocketURL() {
  return HA_URL.replace(/^https:/, "wss:").replace(/^http:/, "ws:") + "/api/websocket";
}

export function activateJarvisSatellite(token, { onStateChange } = {}) {
  return new Promise((resolve, reject) => {
    if (!token?.trim()) {
      logError("Token Home Assistant requis pour le satellite.");
      reject(new Error("Token Home Assistant requis"));
      return;
    }

    log("🎙️ Activation du satellite JARVIS iPhone...");
    const socket = new WebSocket(getWebSocketURL());

    socket.onopen = () => log("🔌 Connexion au satellite...");

    socket.onmessage = (event) => {
      let msg;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === "auth_required") {
        socket.send(JSON.stringify({ type: "auth", access_token: token }));
        return;
      }

      if (msg.type === "auth_ok") {
        socket.send(JSON.stringify({
          id: Date.now(),
          type: "call_service",
          domain: "assist_satellite",
          service: "start_conversation",
          target: { entity_id: JARVIS_SATELLITE },
          service_data: { start_message: "", preannounce: true }
        }));
        return;
      }

      if (msg.type === "result") {
        if (msg.success) {
          logOK("🎙️ JARVIS iPhone activé.");
          setCoreState("listening");
          onStateChange?.("listening");
          resolve(true);
        } else {
          logError("Activation du satellite refusée.");
          reject(new Error("Activation refusée"));
        }
        socket.close();
      }
    };

    socket.onerror = () => {
      logError("WebSocket Home Assistant indisponible.");
      reject(new Error("WebSocket indisponible"));
    };
  });
}
