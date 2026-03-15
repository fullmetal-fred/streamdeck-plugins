import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const execFileAsync = promisify(execFile);

/**
 * Type text via OS-native keystroke simulation.
 * No native npm deps — shells out to platform tools.
 *
 * - macOS:   osascript (AppleScript System Events)
 * - Windows: PowerShell + .NET SendKeys / InputSimulator
 *
 * @param {string} text
 * @param {{ charDelay: number, lineDelay: number, initialDelay: number }} opts
 */
export async function typeText(text, { charDelay, lineDelay, initialDelay }) {
  // Initial delay so user can focus the target window
  await sleep(initialDelay);

  if (process.platform === "darwin") {
    return typeTextMac(text, charDelay, lineDelay);
  }

  if (process.platform === "win32") {
    return typeTextWindows(text, charDelay, lineDelay);
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}

// ─── macOS ───────────────────────────────────────────────────────────

async function typeTextMac(text, charDelay, lineDelay) {
  // Build a single AppleScript that types the entire text with delays.
  // Batching into one osascript call is much faster than one per char.
  const lines = [];
  lines.push('tell application "System Events"');

  for (const char of text) {
    if (char === "\n") {
      lines.push("  key code 36"); // Return
      lines.push(`  delay ${lineDelay / 1000}`);
    } else if (char === "\t") {
      lines.push("  key code 48"); // Tab
      lines.push(`  delay ${charDelay / 1000}`);
    } else {
      const escaped = char.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      lines.push(`  keystroke "${escaped}"`);
      lines.push(`  delay ${charDelay / 1000}`);
    }
  }

  lines.push("end tell");

  const script = lines.join("\n");
  const tmpFile = join(tmpdir(), `cliptype-${randomUUID()}.applescript`);

  try {
    await writeFile(tmpFile, script, "utf-8");
    await execFileAsync("osascript", [tmpFile], { timeout: 300_000 });
  } finally {
    await unlink(tmpFile).catch(() => {});
  }
}

// ─── Windows ─────────────────────────────────────────────────────────

async function typeTextWindows(text, charDelay, lineDelay) {
  // Use PowerShell + .NET System.Windows.Forms.SendKeys.
  // We write the text to a temp file and read it in PS to avoid
  // shell escaping nightmares.
  const tmpTextFile = join(tmpdir(), `cliptype-${randomUUID()}.txt`);
  const tmpPsFile = join(tmpdir(), `cliptype-${randomUUID()}.ps1`);

  // SendKeys special characters that need escaping: + ^ % ~ { } ( )
  // We handle this in the PS script itself to avoid double-escaping.
  const psScript = `
Add-Type -AssemblyName System.Windows.Forms

$text = [System.IO.File]::ReadAllText('${tmpTextFile.replace(/\\/g, "\\\\")}')
$charDelay = ${charDelay}
$lineDelay = ${lineDelay}

foreach ($char in $text.ToCharArray()) {
    switch ($char) {
        "`n" {
            [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
            Start-Sleep -Milliseconds $lineDelay
        }
        "`t" {
            [System.Windows.Forms.SendKeys]::SendWait("{TAB}")
            Start-Sleep -Milliseconds $charDelay
        }
        "+" { [System.Windows.Forms.SendKeys]::SendWait("{+}"); Start-Sleep -Milliseconds $charDelay }
        "^" { [System.Windows.Forms.SendKeys]::SendWait("{^}"); Start-Sleep -Milliseconds $charDelay }
        "%" { [System.Windows.Forms.SendKeys]::SendWait("{%}"); Start-Sleep -Milliseconds $charDelay }
        "~" { [System.Windows.Forms.SendKeys]::SendWait("{~}"); Start-Sleep -Milliseconds $charDelay }
        "(" { [System.Windows.Forms.SendKeys]::SendWait("{(}"); Start-Sleep -Milliseconds $charDelay }
        ")" { [System.Windows.Forms.SendKeys]::SendWait("{)}"); Start-Sleep -Milliseconds $charDelay }
        "{" { [System.Windows.Forms.SendKeys]::SendWait("{{}"); Start-Sleep -Milliseconds $charDelay }
        "}" { [System.Windows.Forms.SendKeys]::SendWait("{}}"); Start-Sleep -Milliseconds $charDelay }
        default {
            [System.Windows.Forms.SendKeys]::SendWait($char.ToString())
            Start-Sleep -Milliseconds $charDelay
        }
    }
}
`;

  try {
    await writeFile(tmpTextFile, text, "utf-8");
    await writeFile(tmpPsFile, psScript, "utf-8");
    await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", tmpPsFile],
      { timeout: 300_000 }
    );
  } finally {
    await unlink(tmpTextFile).catch(() => {});
    await unlink(tmpPsFile).catch(() => {});
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
