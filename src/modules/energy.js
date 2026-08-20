// JARVIS V8 — Envoy / energy panel

import { ENERGY_SENSORS, SENSOR_FAIL_THRESHOLD } from "./config.js";
import { $, escapeHTML } from "./dom.js";
import { getEntityState } from "./ha.js";
import { log } from "./logger.js";

const sensorFailCount = Object.fromEntries(
  Object.keys(ENERGY_SENSORS).map((key) => [key, 0])
);

async function fetchSensorState(entityId, token) {
  try {
    return await getEntityState(entityId, token);
  } catch (error) {
    return null;
  }
}

export async function updateEnergyPanel({ connected, token }) {
  if (!connected) {
    const status = $("energyStatus");
    if (status) status.innerText = "--";
    return;
  }

  const entries = Object.entries(ENERGY_SENSORS);
  const results = await Promise.all(
    entries.map(([key, id]) => fetchSensorState(id, token))
  );

  let anyOk = false;

  entries.forEach(([key], index) => {
    const data = results[index];
    const valueEl = $(`energy_${key}`);
    const unitEl = $(`energy_${key}_unit`);
    if (!valueEl) return;

    const statEl = valueEl.closest(".energyStat");

    if (
      data &&
      data.state !== undefined &&
      data.state !== "unavailable" &&
      data.state !== "unknown"
    ) {
      const num = parseFloat(data.state);
      valueEl.innerText = Number.isNaN(num)
        ? data.state
        : num.toFixed(1).replace(".", ",");

      if (unitEl) {
        unitEl.innerText = data.attributes?.unit_of_measurement || "W";
      }

      anyOk = true;
      sensorFailCount[key] = 0;
      statEl?.classList.remove("error");
    } else {
      sensorFailCount[key] += 1;
      valueEl.innerText = "--";

      if (sensorFailCount[key] >= SENSOR_FAIL_THRESHOLD && statEl) {
        statEl.classList.add("error");
        log(
          `<span class="logERR">❌ Capteur ${escapeHTML(key)} indisponible.</span>`
        );
      }
    }
  });

  const prod = results[entries.findIndex(([key]) => key === "production")];
  const cons = results[entries.findIndex(([key]) => key === "consumption")];
  const prodVal = prod && !Number.isNaN(parseFloat(prod.state)) ? parseFloat(prod.state) : null;
  const consVal = cons && !Number.isNaN(parseFloat(cons.state)) ? parseFloat(cons.state) : null;

  const autoEl = $("energy_autoconso");
  if (autoEl) {
    autoEl.innerText = prodVal !== null && consVal !== null && consVal > 0
      ? Math.min(100, (prodVal / consVal) * 100).toFixed(0)
      : "--";
  }

  const status = $("energyStatus");
  if (status) status.innerText = anyOk ? "LIVE" : "N/A";
}
