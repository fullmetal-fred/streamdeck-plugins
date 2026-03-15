import streamDeck from "@elgato/streamdeck";

import { TypeClipboard } from "./actions/type-clipboard.js";

streamDeck.actions.registerAction(
  new TypeClipboard(),
  "com.fullmetalfred.cliptype.type"
);

streamDeck.connect();
