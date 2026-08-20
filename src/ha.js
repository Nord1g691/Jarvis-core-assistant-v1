// JARVIS V8 — Home Assistant HTTP helpers

import { HA_URL } from "./config.js";

export async function haFetch(path, options = {}, token = "") {
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token?.trim()) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${HA_URL}${path}`, { ...options, headers });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response;
}

export async function testHA(token = "") {
  return haFetch("/api/", { method: "GET" }, token);
}

export async function getState(entityId, token = "") {
  const response = await haFetch(`/api/states/${encodeURIComponent(entityId)}`, { method: "GET" }, token);
  return response.json();
}
