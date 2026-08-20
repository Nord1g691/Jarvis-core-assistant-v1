# JARVIS V9

V9 introduces a dynamic Home Assistant dashboard instead of hard-coded device lists.

## Categories

- 💡 Lumière
- 🌡️ Climatisation / Chauffage
- 🔐 Accès
- 🏊 Piscine
- 🚗 Voiture
- ⚡ Énergie
- 🎵 Média
- 📷 Caméra
- 🪟 Volets
- 🏠 Intérieur / Extérieur
- 📰 News / Actualité
- ⚽ Sport

## Dynamic entities

JARVIS queries Home Assistant for its current entity state list. Users choose which discovered entities appear in each category. Selection is stored locally in the browser.

Cards show the live state plus common attributes when available: temperature, target temperature, battery, brightness, cover position, media title/artist, volume, power and units.

## Dashboard navigation

The V9 dashboard keeps only:

- 🗂️ Catégories
- ⚙️ Réglages
- ↻ Mise à jour

The update button is fixed at the bottom-right of the dashboard. Legacy account/refresh buttons are hidden from the dashboard.

## Settings

Connection/account, JARVIS voice behaviour, system settings and general settings remain under Réglages.

## Compatibility

No installation-specific Home Assistant entity IDs are required by V9. Entities are discovered at runtime from the connected Home Assistant instance.
