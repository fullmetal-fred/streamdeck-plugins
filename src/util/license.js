import streamDeck from "@elgato/streamdeck";

// Cache validated keys for the session (avoids hitting Stripe on every press)
const validatedKeys = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Validate a license key against your Stripe backend.
 *
 * Flow:
 *   1. User buys on your site → Stripe creates a customer + subscription
 *   2. Your site generates a license key and emails it
 *   3. User pastes key into the Property Inspector
 *   4. On each button press, we validate against your backend
 *
 * For v1, this calls a simple validation endpoint you host.
 * Swap the URL below for your actual endpoint.
 *
 * @param {string} key - License key from settings
 * @returns {Promise<boolean>}
 */
export async function validateLicense(key) {
  if (!key || key.trim().length === 0) {
    return false;
  }

  const trimmed = key.trim();

  // Check cache
  const cached = validatedKeys.get(trimmed);
  if (cached && Date.now() - cached.time < CACHE_TTL_MS) {
    return cached.valid;
  }

  try {
    // TODO: Replace with your actual validation endpoint.
    //
    // Minimal backend example (Node.js + Stripe):
    //
    //   app.post("/api/validate", async (req, res) => {
    //     const sub = await stripe.subscriptions.retrieve(req.body.key);
    //     res.json({ valid: sub.status === "active" });
    //   });
    //
    // For a one-time purchase, check the PaymentIntent or use Stripe
    // License Keys (via a lookup table).
    const resp = await fetch(
      "https://your-domain.com/api/cliptype/validate",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: trimmed }),
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!resp.ok) {
      // Network/server error — be generous, assume valid
      streamDeck.logger.warn(`License check failed: HTTP ${resp.status}`);
      validatedKeys.set(trimmed, { valid: true, time: Date.now() });
      return true;
    }

    const data = await resp.json();
    const valid = data.valid === true;

    validatedKeys.set(trimmed, { valid, time: Date.now() });
    return valid;
  } catch (err) {
    // Network error — be generous for offline users
    streamDeck.logger.warn("License validation error (assuming valid):", err);
    validatedKeys.set(trimmed, { valid: true, time: Date.now() });
    return true;
  }
}
