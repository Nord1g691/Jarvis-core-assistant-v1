from __future__ import annotations

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.core import callback

from .const import DOMAIN


class JarvisConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle the JARVIS configuration flow."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Set up JARVIS."""
        if user_input is not None:
            return self.async_create_entry(title="JARVIS", data={"enabled": True})

        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema(
                {vol.Required("enabled", default=True): bool}
            ),
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        """Return the JARVIS options flow.

        Home Assistant now injects the current ConfigEntry into the
        OptionsFlowHandler through the built-in ``config_entry`` property.
        Do not pass it to the handler constructor.
        """
        return JarvisOptionsFlowHandler()


class JarvisOptionsFlowHandler(config_entries.OptionsFlow):
    """Handle JARVIS options."""

    async def async_step_init(self, user_input=None):
        """Manage JARVIS options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Required(
                        "enabled",
                        default=self.config_entry.options.get("enabled", True),
                    ): bool,
                    vol.Optional(
                        "solar_auto_discovery",
                        default=self.config_entry.options.get(
                            "solar_auto_discovery", True
                        ),
                    ): bool,
                }
            ),
        )
