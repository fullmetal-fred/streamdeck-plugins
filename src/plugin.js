import streamDeck, { LogLevel } from "@elgato/streamdeck";

import { TypeClipboard } from "./actions/type-clipboard.js";

streamDeck.logger.setLevel(LogLevel.DEBUG);

streamDeck.actions.registerAction(
  new TypeClipboard(),
  "com.fullmetalfred.cliptype.type"
);

streamDeck.connect();
