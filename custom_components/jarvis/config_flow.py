from __future__ import annotations

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback

from .const import DOMAIN

PROVIDERS = ["ha_conversation", "groq", "openai", "anthropic", "gemini", "ollama"]


class JarvisConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Configure JARVIS without exposing Home Assistant auth tokens."""

    VERSION = 1

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        return JarvisOptionsFlow(config_entry)

    async def async_step_user(self, user_input=None):
        if user_input is not None:
            await self.async_set_unique_id("jarvis-native")
            self._abort_if_unique_id_configured()
            return self.async_create_entry(title="JARVIS", data=user_input)

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {
                    vol.Required("provider", default="ha_conversation"): vol.In(PROVIDERS),
                    vol.Optional("model", default=""): str,
                    vol.Optional("base_url", default=""): str,
                    vol.Optional("api_key", default=""): str,
                    vol.Optional("observer_enabled", default=True): bool,
                    vol.Optional("rich_reasoning", default=True): bool,
                    vol.Optional("visitor_learning", default=False): bool,
                    vol.Optional("package_detection", default=False): bool,
                }
            ),
        )


class JarvisOptionsFlow(config_entries.OptionsFlow):
    """Runtime options for JARVIS intelligence features."""

    def __init__(self, config_entry):
        self.config_entry = config_entry

    async def async_step_init(self, user_input=None):
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        current = self.config_entry.options
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Optional("observer_enabled", default=current.get("observer_enabled", True)): bool,
                    vol.Optional("rich_reasoning", default=current.get("rich_reasoning", True)): bool,
                    vol.Optional("visitor_learning", default=current.get("visitor_learning", False)): bool,
                    vol.Optional("package_detection", default=current.get("package_detection", False)): bool,
                    vol.Optional("dashboard_layout", default=current.get("dashboard_layout", "orbit")): vol.In(
                        ["orbit", "compact", "minimal"]
                    ),
                }
            ),
        )
