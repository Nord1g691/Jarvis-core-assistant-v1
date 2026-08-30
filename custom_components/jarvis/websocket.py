"""JARVIS Home Assistant WebSocket API.

Native Home Assistant data path inspired by the JARVIS AIO architecture:
frontend panel -> HA WebSocket -> hass.states.
"""
from __future__ import annotations

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback


@websocket_api.websocket_command({"type": "jarvis/get_panel_data"})
@callback
def ws_get_panel_data(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Return the live HA state used by the JARVIS panel."""
    states = {
        state.entity_id: state.as_dict()
        for state in hass.states.async_all()
    }
    connection.send_result(
        msg["id"],
        {
            "entity_count": len(states),
            "states": states,
        },
    )


def async_register(hass: HomeAssistant) -> None:
    """Register JARVIS WebSocket commands."""
    websocket_api.async_register_command(hass, ws_get_panel_data)
