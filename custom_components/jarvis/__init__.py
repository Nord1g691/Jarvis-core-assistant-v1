from __future__ import annotations

from pathlib import Path
from homeassistant.components import frontend
from homeassistant.components.http import StaticPathConfig
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType
from .const import DOMAIN, PANEL_ICON, PANEL_TITLE, PANEL_URL, STATIC_URL

PANEL_VERSION = "10.4.3"

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    hass.data.setdefault(DOMAIN, {})
    static_path = Path(__file__).parent / "www"
    await hass.http.async_register_static_paths([
        StaticPathConfig(STATIC_URL, str(static_path), cache_headers=False)
    ])
    frontend.async_remove_panel(hass, PANEL_URL)
    frontend.async_register_built_in_panel(
        hass,
        "custom",
        sidebar_title=PANEL_TITLE,
        sidebar_icon=PANEL_ICON,
        frontend_url_path=PANEL_URL,
        require_admin=False,
        config={
            "_panel_custom": {
                "name": "jarvis-native-panel-v108",
                "embed_iframe": False,
                "module_url": f"{STATIC_URL}/jarvis-panel-v10-8.js?v={PANEL_VERSION}",
            }
        },
    )
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.setdefault(DOMAIN, {})[entry.entry_id] = dict(entry.data)
    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    hass.data.get(DOMAIN, {}).pop(entry.entry_id, None)
    return True
