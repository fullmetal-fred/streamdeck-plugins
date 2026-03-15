import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * Read plain text from the system clipboard.
 * Uses OS-native tools — no npm dependencies.
 *
 * - macOS:   pbpaste
 * - Windows: PowerShell Get-Clipboard
 */
export async function readClipboard() {
  if (process.platform === "darwin") {
    const { stdout } = await execFileAsync("pbpaste", []);
    return stdout;
  }

  if (process.platform === "win32") {
    const { stdout } = await execFileAsync("powershell.exe", [
      "-NoProfile",
      "-NonInteractive",
      "-Command",
      "Get-Clipboard",
    ]);
    return stdout;
  }

  throw new Error(`Unsupported platform: ${process.platform}`);
}
