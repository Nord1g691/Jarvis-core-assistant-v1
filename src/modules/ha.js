// JARVIS V8.2 — Home Assistant API helpers

import { getHAUrl } from "./config.js";
import { log, logError, logOK, logWarning } from "./logger.js";

export async function haFetch(path, options = {}, token = "") {
  const baseUrl = getHAUrl();
  if (!baseUrl) throw new Error("URL Home Assistant non configurée");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token && token.trim()) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers
    });
  } catch (error) {
    throw new Error(`RÉSEAU/CORS — ${error?.message || "Load failed"}`);
  }

  if (!response.ok) {
    if (response.status === 401) throw new Error("TOKEN INVALIDE — HTTP 401");
    if (response.status === 403) throw new Error("ACCÈS REFUSÉ — HTTP 403");
    throw new Error(`ERREUR HOME ASSISTANT — HTTP ${response.status}`);
  }

  return response;
}

export async function testHomeAssistant(token) {
  if (!token || !token.trim()) {
    logWarning("Token Home Assistant requis.");
    return false;
  }

  const url = getHAUrl();
  if (!url) {
    logError("URL Home Assistant non configurée.");
    return false;
  }

  log(`📡 Test HA V8.2 → ${url}`);

  try {
    await haFetch("/api/", { method: "GET" }, token);
    logOK("✅ Home Assistant connecté.");
    return true;
  } catch (error) {
    logError(`Home Assistant : ${error.message}`);
    return false;
  }
}

export async function getEntityState(entityId, token) {
  const response = await haFetch(
    `/api/states/${encodeURIComponent(entityId)}`,
    { method: "GET" },
    token
  );
  return response.json();
}
