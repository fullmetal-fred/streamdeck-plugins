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
 * - Windows: PowerShell + .NET SendKeys
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

  throw new Error("Unsupported platform: " + process.platform);
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
      lines.push("  delay " + (lineDelay / 1000));
    } else if (char === "\t") {
      lines.push("  key code 48"); // Tab
      lines.push("  delay " + (charDelay / 1000));
    } else {
      const escaped = char.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      lines.push('  keystroke "' + escaped + '"');
      lines.push("  delay " + (charDelay / 1000));
    }
  }

  lines.push("end tell");

  const script = lines.join("\n");
  const tmpFile = join(tmpdir(), "cliptype-" + randomUUID() + ".applescript");

  try {
    await writeFile(tmpFile, script, "utf-8");
    await execFileAsync("osascript", [tmpFile], { timeout: 300_000 });
  } finally {
    await unlink(tmpFile).catch(function () {});
  }
}

// ─── Windows ─────────────────────────────────────────────────────────

function buildPsScript(textFilePath, charDelay, lineDelay) {
  // Build the PowerShell script as an array of lines to avoid
  // template literal conflicts with PS backtick escapes and $ variables.
  var ps = [];
  ps.push("Add-Type -AssemblyName System.Windows.Forms");
  ps.push("");
  ps.push("$text = [System.IO.File]::ReadAllText('" + textFilePath.replace(/\\/g, "\\\\") + "')");
  ps.push("$charDelay = " + charDelay);
  ps.push("$lineDelay = " + lineDelay);
  ps.push("");
  ps.push("foreach ($char in $text.ToCharArray()) {");
  ps.push("    switch ($char) {");
  ps.push('        "`n" {');
  ps.push('            [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")');
  ps.push("            Start-Sleep -Milliseconds $lineDelay");
  ps.push("        }");
  ps.push('        "`t" {');
  ps.push('            [System.Windows.Forms.SendKeys]::SendWait("{TAB}")');
  ps.push("            Start-Sleep -Milliseconds $charDelay");
  ps.push("        }");
  ps.push('        "+" { [System.Windows.Forms.SendKeys]::SendWait("{+}"); Start-Sleep -Milliseconds $charDelay }');
  ps.push('        "^" { [System.Windows.Forms.SendKeys]::SendWait("{^}"); Start-Sleep -Milliseconds $charDelay }');
  ps.push('        "%" { [System.Windows.Forms.SendKeys]::SendWait("{%}"); Start-Sleep -Milliseconds $charDelay }');
  ps.push('        "~" { [System.Windows.Forms.SendKeys]::SendWait("{~}"); Start-Sleep -Milliseconds $charDelay }');
  ps.push('        "(" { [System.Windows.Forms.SendKeys]::SendWait("{(}"); Start-Sleep -Milliseconds $charDelay }');
  ps.push('        ")" { [System.Windows.Forms.SendKeys]::SendWait("{)}"); Start-Sleep -Milliseconds $charDelay }');
  ps.push('        "{" { [System.Windows.Forms.SendKeys]::SendWait("{{}"); Start-Sleep -Milliseconds $charDelay }');
  ps.push('        "}" { [System.Windows.Forms.SendKeys]::SendWait("{}}"); Start-Sleep -Milliseconds $charDelay }');
  ps.push("        default {");
  ps.push("            [System.Windows.Forms.SendKeys]::SendWait($char.ToString())");
  ps.push("            Start-Sleep -Milliseconds $charDelay");
  ps.push("        }");
  ps.push("    }");
  ps.push("}");
  return ps.join("\r\n");
}

async function typeTextWindows(text, charDelay, lineDelay) {
  var tmpTextFile = join(tmpdir(), "cliptype-" + randomUUID() + ".txt");
  var tmpPsFile = join(tmpdir(), "cliptype-" + randomUUID() + ".ps1");

  try {
    await writeFile(tmpTextFile, text, "utf-8");
    await writeFile(tmpPsFile, buildPsScript(tmpTextFile, charDelay, lineDelay), "utf-8");
    await execFileAsync(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", tmpPsFile],
      { timeout: 300_000 }
    );
  } finally {
    await unlink(tmpTextFile).catch(function () {});
    await unlink(tmpPsFile).catch(function () {});
  }
}

function sleep(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}
