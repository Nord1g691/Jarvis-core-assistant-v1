// JARVIS V8 — Conversation engine

import { JARVIS_AGENT } from "./config.js";
import { haFetch } from "./ha.js";
import { log, logError, logOK } from "./logger.js";
import { setCoreState } from "./core-state.js";

export async function sendToAssist(text, {
  token,
  connected,
  testHA,
  onSpeech,
  onNoSpeech
} = {}) {
  if (!text) return null;

  setCoreState("processing");

  try {
    let ready = connected;
    if (!ready && testHA) ready = await testHA();
    if (!ready) return null;

    log("⚡ Transmission à JARVIS...");

    const response = await haFetch(
      "/api/conversation/process",
      {
        method: "POST",
        body: JSON.stringify({
          text,
          language: "fr",
          agent_id: JARVIS_AGENT
        })
      },
      token
    );

    const data = await response.json();
    const speech = data?.response?.speech?.plain?.speech;

    if (speech) {
      logOK(`🤖 JARVIS : "${speech}"`);
      setCoreState("responding");
      await onSpeech?.(speech);
      return speech;
    }

    await onNoSpeech?.();
    return null;
  } catch (error) {
    setCoreState("idle");
    logError(`Erreur Assist : ${error.message}`);
    return null;
  }
}
