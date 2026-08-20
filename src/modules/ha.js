// JARVIS V8.3 — Home Assistant WebSocket helpers

import { getHAUrl } from "./config.js";
import { log, logError, logOK, logWarning } from "./logger.js";

export async function haFetch(path, options = {}, token = "") {
  const baseUrl = getHAUrl();
  if (!baseUrl) throw new Error("URL Home Assistant non configurée");

  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token && token.trim()) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
    if (!response.ok) {
      if (response.status === 401) throw new Error("TOKEN INVALIDE — HTTP 401");
      if (response.status === 403) throw new Error("ACCÈS REFUSÉ — HTTP 403");
      throw new Error(`ERREUR HOME ASSISTANT — HTTP ${response.status}`);
    }
    return response;
  } catch (error) {
    throw new Error(`RÉSEAU/CORS — ${error?.message || "Load failed"}`);
  }
}

function websocketUrl() {
  const url = getHAUrl();
  if (!url) throw new Error("URL Home Assistant non configurée");
  return url.replace(/^http:/, "ws:").replace(/^https:/, "wss:") + "/api/websocket";
}

export function haWsCall(type, data = {}, token = "") {
  if (!token || !token.trim()) return Promise.reject(new Error("TOKEN HOME ASSISTANT REQUIS"));

  return new Promise((resolve, reject) => {
    let ws;
    let id = 1;
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      try { ws?.close(); } catch {}
      fn(value);
    };

    try { ws = new WebSocket(websocketUrl()); }
    catch (error) { reject(new Error(`WEBSOCKET — ${error.message}`)); return; }

    const timer = setTimeout(() => finish(reject, new Error("WEBSOCKET — délai dépassé")), 10000);

    ws.onmessage = event => {
      let message;
      try { message = JSON.parse(event.data); }
      catch { return; }

      if (message.type === "auth_required") {
        ws.send(JSON.stringify({ type: "auth", access_token: token }));
        return;
      }

      if (message.type === "auth_invalid") {
        clearTimeout(timer);
        finish(reject, new Error(`TOKEN INVALIDE — ${message.message || "auth_invalid"}`));
        return;
      }

      if (message.type === "auth_ok") {
        ws.send(JSON.stringify({ id, type, ...data }));
        return;
      }

      if (message.type === "result" && message.id === id) {
        clearTimeout(timer);
        if (message.success) finish(resolve, message.result);
        else finish(reject, new Error(message.error?.message || "Commande Home Assistant refusée"));
      }
    };

    ws.onerror = () => {
      clearTimeout(timer);
      finish(reject, new Error("WEBSOCKET — connexion impossible"));
    };
    ws.onclose = () => {
      clearTimeout(timer);
      if (!settled) finish(reject, new Error("WEBSOCKET — connexion fermée"));
    };
  });
}

export async function testHomeAssistant(token) {
  if (!token || !token.trim()) {
    logWarning("Token Home Assistant requis.");
    return false;
  }
  if (!getHAUrl()) {
    logError("URL Home Assistant non configurée.");
    return false;
  }

  log(`📡 Test HA V8.3 WebSocket → ${getHAUrl()}`);
  try {
    await haWsCall("get_config", {}, token);
    logOK("✅ Home Assistant connecté via WebSocket.");
    return true;
  } catch (error) {
    logError(`Home Assistant : ${error.message}`);
    return false;
  }
}

export async function getEntityState(entityId, token) {
  const states = await haWsCall("get_states", {}, token);
  return states?.find(state => state.entity_id === entityId) || null;
}
