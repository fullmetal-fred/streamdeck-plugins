# ClipType — Stream Deck Plugin

**Type your clipboard contents via simulated keystrokes.**

Built for sysadmins who need to paste into remote consoles (iLO, iDRAC, KVM, vSphere, IPMI) that don't support clipboard.

## How It Works

1. Copy text to your clipboard (Ctrl+C / Cmd+C)
2. Focus the remote console window
3. Press the ClipType button on your Stream Deck
4. The plugin types your clipboard contents one keystroke at a time

## Installation

1. Download the `.streamDeckPlugin` file from Releases
2. Double-click to install — that's it

No helper processes, no background services. The plugin runs natively inside Stream Deck via the Node.js SDK.

**macOS users:** You'll be prompted to grant Accessibility permissions (System Events needs it for keystroke simulation).

## Configuration

Click the ClipType action in Stream Deck to configure:

| Setting | Default | Description |
|---------|---------|-------------|
| Keystroke Delay | 20ms | Delay between each keystroke |
| Line Delay | 50ms | Extra delay after Enter key |
| Start Delay | 500ms | Pause before typing starts (time to focus target window) |
| Max Characters | 10,000 | Safety limit on characters typed |

**Slow console?** Increase keystroke delay to 50–100ms. Some KVM consoles need 100ms+ to keep up.

## Licensing

ClipType works in trial mode (30 characters) without a license key. Purchase a key to unlock unlimited characters.

Enter your license key in the Property Inspector settings panel.

## Building from Source

```bash
pnpm install
make build    # Builds icons + assembles .sdPlugin directory
make package  # Creates .streamDeckPlugin installer
```

## Architecture

```
src/
├── plugin.js                    # Entry point — registers actions with SDK
├── actions/
│   └── type-clipboard.js        # Main action: clipboard read → keystroke dispatch
└── util/
    ├── clipboard.js             # OS-native clipboard read (pbpaste / PowerShell)
    ├── keyboard.js              # OS-native keystroke sim (osascript / SendKeys)
    └── license.js               # Stripe license key validation

pi/
└── inspector.html               # Property Inspector (timing + license settings)

assets/icons/                    # Source SVGs
scripts/
├── build.js                     # Assemble .sdPlugin dir from source
├── icons.js                     # SVG → PNG conversion (sharp)
└── package.js                   # Create .streamDeckPlugin ZIP
```

**No helper process.** The plugin runs as a Node.js process inside Stream Deck (SDK v2 with `Nodejs` runtime). It reads the clipboard via `pbpaste`/`Get-Clipboard` and types via `osascript`/`SendKeys` — all through `child_process`, zero native npm dependencies.

## Why Not Just Ctrl+V?

Remote console technologies like HP iLO, Dell iDRAC, Supermicro IPMI, and VMware vSphere console intercept keystrokes at the hardware level and don't support the OS clipboard. ClipType types individual key presses, which these consoles handle correctly.

## License

Proprietary — All rights reserved.
