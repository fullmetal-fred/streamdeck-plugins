/**
 * Elgato Stream Deck SDK v2 — connection bootstrap.
 *
 * The Stream Deck application calls connectElgatoStreamDeckSocket()
 * (defined in plugin.js) when it launches the plugin.
 * This file is intentionally minimal; the SDK entry point is the
 * global function that plugin.js defines.
 *
 * See: https://docs.elgato.com/sdk/plugins/getting-started
 */

// The Stream Deck application will inject the call to
// connectElgatoStreamDeckSocket(port, uuid, registerEvent, info)
// after this script and plugin.js are loaded.
