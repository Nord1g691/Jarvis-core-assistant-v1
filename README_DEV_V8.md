# JARVIS V8 — Development Architecture

This file documents the development direction for `dev-v8`.

## Source of truth

- `main` remains the stable V8 reference.
- `dev-v8` is the development branch.
- The legacy `dev/jarvis-core-ha` branch is a reference/archive source only.

## Architecture direction

New capabilities should be modular and isolated rather than accumulating in one monolithic file.

Planned capability areas include:

- UI / V8 visual layer
- Voice and audio
- Vision / camera
- Home Assistant integration
- Agents and orchestration
- Configuration and settings
- External services / APIs

## Safety rule

Experimental changes belong on `dev-v8` first. Stable V8 should only receive changes after testing and validation.
