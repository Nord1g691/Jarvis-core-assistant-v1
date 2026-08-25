# JARVIS Core Assistant — Native HA HUD

This branch is the clean V1 foundation for a native Home Assistant + HACS JARVIS.

## Design

- Original JARVIS V5 visual language: dark HUD, cyan core, rotating rings, central body/core and surrounding telemetry panels.
- Native Home Assistant custom panel: the frontend receives the authenticated `hass` object directly; no Home Assistant long-lived token is embedded in the browser.
- Dynamic panels built from live `hass.states`: energy, home, lights, climate, media and security.
- Safe explicit actions use Home Assistant service calls.
- Conversation uses Home Assistant's native `conversation/process` WebSocket command.
- Settings prepare the AI layer for HA Conversation, Groq, OpenAI, Anthropic, Gemini and Ollama, plus observer mode, rich reasoning, visitor learning and package detection.

## Inspired capabilities

The architecture deliberately takes the useful ideas from the public `sam3gp8/jarvis-aio` project — HACS-native installation, pluggable LLM providers, observer/reasoning modes, vision/camera extensions, local-first data, memory and an Iron Man HUD — while keeping the visual identity and Home Assistant integration of this project original.

## HACS requirements

The repository keeps exactly one integration under `custom_components/jarvis/`. All runtime files belong inside that integration directory, and the integration declares a version in `manifest.json`.

## Current alpha

`10.0.0-alpha.1` is the clean native-panel foundation. It intentionally does not carry over the previous V9 iframe/bridge/token stack.
