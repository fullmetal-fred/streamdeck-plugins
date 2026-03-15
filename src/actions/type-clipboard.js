import streamDeck, {
  action,
  KeyDownEvent,
  SingletonAction,
  WillAppearEvent,
} from "@elgato/streamdeck";

import { readClipboard } from "../util/clipboard.js";
import { typeText } from "../util/keyboard.js";
import { validateLicense } from "../util/license.js";

const TRIAL_MAX_CHARS = 30;

/**
 * Types clipboard contents via simulated keystrokes.
 */
@action({ UUID: "com.fullmetalfred.cliptype.type" })
export class TypeClipboard extends SingletonAction {
  /** @param {WillAppearEvent} ev */
  async onWillAppear(ev) {
    const settings = await this.#getSettings(ev);
    streamDeck.logger.debug("TypeClipboard appeared", settings);
  }

  /** @param {KeyDownEvent} ev */
  async onKeyDown(ev) {
    const settings = await this.#getSettings(ev);

    // Read clipboard
    let text;
    try {
      text = await readClipboard();
    } catch (err) {
      streamDeck.logger.error("Clipboard read failed", err);
      await ev.action.showAlert();
      return;
    }

    if (!text || text.length === 0) {
      streamDeck.logger.warn("Clipboard is empty");
      await ev.action.showAlert();
      return;
    }

    // License check — unlicensed users get a 30-char trial
    const licensed = await validateLicense(settings.licenseKey);
    const maxLen = licensed
      ? parseInt(settings.maxLength, 10) || 10000
      : TRIAL_MAX_CHARS;

    if (text.length > maxLen) {
      text = text.substring(0, maxLen);
    }

    if (!licensed) {
      streamDeck.logger.info(
        `Trial mode: truncated to ${TRIAL_MAX_CHARS} chars`
      );
    }

    // Type it out
    await ev.action.showOk();
    const charDelay = parseInt(settings.charDelayMs, 10) || 20;
    const lineDelay = parseInt(settings.lineDelayMs, 10) || 50;
    const initialDelay = parseInt(settings.initialDelayMs, 10) || 500;

    try {
      await typeText(text, { charDelay, lineDelay, initialDelay });
    } catch (err) {
      streamDeck.logger.error("Keystroke simulation failed", err);
      await ev.action.showAlert();
    }
  }

  async #getSettings(ev) {
    const defaults = {
      charDelayMs: 20,
      lineDelayMs: 50,
      initialDelayMs: 500,
      maxLength: 10000,
      licenseKey: "",
    };
    return { ...defaults, ...(ev.payload?.settings || {}) };
  }
}
