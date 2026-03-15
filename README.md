# ClipType — Stream Deck Plugin

**Type your clipboard contents via simulated keystrokes.**

Built for sysadmins who need to paste into remote consoles (iLO, iDRAC, KVM, vSphere, IPMI) that don't support clipboard.

## How It Works

1. Copy text to your clipboard (Ctrl+C / Cmd+C)
2. Focus the remote console window
3. Press the ClipType button on your Stream Deck
4. The plugin types your clipboard contents one keystroke at a time

## Installation

### Prerequisites

- Elgato Stream Deck with Stream Deck software v6.0+
- Windows 10+ or macOS 10.15+

### Install the Plugin

1. Download the latest `.streamDeckPlugin` file from Releases
2. Double-click to install

### Install the Helper

The plugin requires a small background helper to simulate keystrokes.

**Windows (PowerShell):**

```powershell
# Run from the plugin directory:
powershell -ExecutionPolicy Bypass -File helpers\cliptype-helper.ps1
```

**macOS:**

```bash
# Grant accessibility permissions first (System Preferences > Security > Privacy > Accessibility)
./helpers/cliptype-helper.sh
```

> **Tip:** Add the helper to your startup items so it runs automatically.

## Configuration

Click the ClipType action in Stream Deck to configure:

| Setting | Default | Description |
|---------|---------|-------------|
| Char Delay | 20ms | Delay between each keystroke |
| Line Delay | 50ms | Extra delay after Enter key |
| Max Length | 10,000 | Safety limit on characters typed |

**Slow console?** Increase the char delay to 50-100ms. Some KVM consoles need 100ms+ to keep up.

## Building from Source

```bash
# Build (copies plugin to dist/)
npm run build

# Package (creates .streamDeckPlugin file)
npm run package
```

## Architecture

```
com.fullmetalfred.cliptype.sdPlugin/
├── manifest.json          # Plugin metadata & action definitions
├── plugin.html            # Plugin entry point (loads JS)
├── plugin.js              # Core logic: clipboard read + keystroke dispatch
├── pi/
│   ├── inspector.html     # Settings UI (char delay, line delay, max length)
│   └── inspector.css      # Stream Deck-style dark theme
├── helpers/
│   ├── cliptype-helper.ps1  # Windows keystroke simulator (PowerShell)
│   └── cliptype-helper.sh   # macOS keystroke simulator (AppleScript)
├── libs/
│   └── connectElgatoStreamDeckSocket.js  # SDK bootstrap
└── imgs/
    ├── action.svg         # Button icon
    ├── plugin.svg         # Plugin icon
    └── category.svg       # Category icon
```

## Why Not Just Ctrl+V?

Remote console technologies like HP iLO, Dell iDRAC, Supermicro IPMI, and VMware vSphere console all use different methods to capture keyboard input. Many of them intercept keystrokes at the hardware level and don't support the OS clipboard. ClipType works around this by simulating individual key presses, which these consoles handle correctly.

## License

Proprietary — All rights reserved.
