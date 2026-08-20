// JARVIS V8 — Home Assistant API helpers

import { HA_URL } from "./config.js";
import { log, logError, logOK, logWarning } from "./logger.js";

export async function haFetch(path, options = {}, token = "") {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token && token.trim()) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${HA_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  return response;
}

export async function testHomeAssistant(token) {
  if (!token || !token.trim()) {
    logWarning("Token Home Assistant requis.");
    return false;
  }

  try {
    await haFetch("/api/", { method: "GET" }, token);
    logOK("✅ Home Assistant connecté.");
    return true;
  } catch (error) {
    logError(`Home Assistant hors ligne : ${error.message}`);
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
