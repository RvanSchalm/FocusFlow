# FocusFlow Desktop App - Electron Guide

This guide explains how to run and build FocusFlow as a desktop application using Electron.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Development](#development)
4. [Building for Production](#building-for-production)
5. [Data Storage](#data-storage)
6. [Import & Export](#import--export)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later recommended)
- **npm** (comes with Node.js)

To verify your installation:

```bash
node --version  # Should show v18.x.x or later
npm --version   # Should show 9.x.x or later
```

---

## Quick Start

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**

   ```bash
   npm run electron:dev
   ```

   This will:
   - Start the Vite development server
   - Launch the Electron app with hot reload
   - Open DevTools for debugging

---

## Development

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server (browser mode) |
| `npm run electron:dev` | Start Electron app in development mode |
| `npm run build` | Build the web app for production |
| `npm run electron:build` | Build Electron app for current platform |
| `npm run electron:build:mac` | Build for macOS (.dmg, .zip) |
| `npm run electron:build:win` | Build for Windows (.exe installer, portable) |
| `npm run electron:build:linux` | Build for Linux (AppImage, .deb) |

### Development Mode Features

- **Hot Reload**: Changes to React components update instantly
- **DevTools**: Chrome DevTools open automatically for debugging
- **Console Logging**: All console output appears in DevTools

### Project Structure

```
FocusFlow/
├── electron/
│   ├── main.ts          # Electron main process
│   └── preload.ts       # Preload script (IPC bridge)
├── src/
│   ├── services/
│   │   ├── dataService.ts   # Data layer (replaces Dexie)
│   │   └── useData.ts       # React hook for reactive data
│   ├── types/
│   │   └── electron.d.ts    # TypeScript declarations
│   └── components/          # React components
├── dist/                    # Built web app (after build)
├── dist-electron/           # Built Electron files (after build)
└── release/                 # Built installers (after electron:build)
```

---

## Building for Production

### For macOS

```bash
npm run electron:build:mac
```

**Output:** `release/` folder containing:
- `FocusFlow-1.0.0.dmg` - Disk image installer
- `FocusFlow-1.0.0-mac.zip` - Zipped app bundle

**Requirements for distribution:**
- To distribute outside the Mac App Store, you may need to notarize the app
- For personal use, right-click → Open to bypass Gatekeeper

### For Windows

```bash
npm run electron:build:win
```

**Output:** `release/` folder containing:
- `FocusFlow Setup 1.0.0.exe` - NSIS installer
- `FocusFlow 1.0.0.exe` - Portable version (no installation needed)

**Note:** Building Windows apps on macOS requires Wine or cross-compilation tools.

### For Linux

```bash
npm run electron:build:linux
```

**Output:** `release/` folder containing:
- `FocusFlow-1.0.0.AppImage` - Universal Linux package
- `focusflow_1.0.0_amd64.deb` - Debian/Ubuntu package

### Cross-Platform Building

To build for all platforms, you'll need:
- **macOS**: Can build for macOS and Linux natively; needs Wine for Windows
- **Windows**: Can build for Windows natively; limited cross-compilation
- **Linux**: Can build for Linux natively; limited cross-compilation

For CI/CD, consider using GitHub Actions with platform-specific runners.

---

## Data Storage

### Storage Location

FocusFlow stores data in your system's application data folder:

| Platform | Location |
|----------|----------|
| **macOS** | `~/Library/Application Support/focus-flow/` |
| **Windows** | `%APPDATA%\focus-flow\` |
| **Linux** | `~/.config/focus-flow/` |

### File Structure

```
focus-flow/
├── focusflow-data.json      # All boards, columns, tasks, labels
└── focusflow-settings.json  # Window size, preferences
```

### Data Format

Data is stored as human-readable JSON. Example structure:

```json
{
  "boards": [
    { "id": 1, "title": "My Board", "createdAt": "2026-02-09T..." }
  ],
  "columns": [
    { "id": 1, "boardId": 1, "title": "To Do", "order": 0 }
  ],
  "tasks": [
    {
      "id": 1,
      "boardId": 1,
      "columnId": 1,
      "title": "My Task",
      "description": "...",
      "urgency": 5,
      "importance": 8,
      "labelIds": [1],
      "checklist": [],
      "comments": [],
      "attachments": [],
      "order": 0
    }
  ],
  "labels": [
    { "id": 1, "name": "Urgent", "color": "#EF4444" }
  ],
  "version": 1,
  "lastModified": "2026-02-09T..."
}
```

### Backup

To backup your data:
1. Use the **Export** button in the app (recommended)
2. Or manually copy the `focusflow-data.json` file

---

## Import & Export

### Exporting Data

1. Click the **Export** button in the sidebar
2. Choose a location to save the backup file
3. The file includes:
   - All boards, columns, tasks, and labels
   - All attachments (as Base64 encoded data)
   - App settings (window size, preferences)
   - Export timestamp and app version

### Importing Data

1. Click the **Import** button in the sidebar
2. Select a previously exported `.json` file
3. Confirm the import (this will replace all existing data)
4. The app will reload with the imported data

### Legacy Format Support

Imports from the old IndexedDB-based version are automatically converted.

---

## Troubleshooting

### App won't start

1. **Clear the data folder**: Delete the `focus-flow` folder from your app data location
2. **Reinstall dependencies**: `rm -rf node_modules && npm install`
3. **Check logs**: Run from terminal to see error messages

### Build fails

1. **TypeScript errors**: Run `npm run build` first to check for type errors
2. **Missing dependencies**: Run `npm install`
3. **Permission issues**: On macOS, ensure Xcode Command Line Tools are installed

### Data not persisting

1. **Check file permissions**: Ensure the app data folder is writable
2. **Look for errors**: Check the DevTools console for error messages
3. **Verify path**: The data path is logged in the main process console

### White screen on launch

1. **Wait a moment**: First launch may take a few seconds
2. **Check DevTools**: Press `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows/Linux)
3. **Rebuild**: `npm run build && npm run electron:dev`

### Import/Export issues

1. **Invalid JSON**: Ensure the import file is valid JSON
2. **Old format**: Legacy IndexedDB exports with Blob attachments need to be re-exported from the app first
3. **Large files**: Very large exports (>100MB) may take time to process

---

## App Icons

To add custom app icons, place them in the `public/` folder:

- `icon.icns` - macOS icon (use Icon Composer or iconutil)
- `icon.ico` - Windows icon (use imagemagick or online converter)
- `icon.png` - Linux icon (256x256 or larger)

---

## Updating the App

When a new version is available:

1. Download the latest release
2. Replace the existing app
3. Your data will be preserved (stored separately from the app)

---

## Support

For issues or feature requests, please open an issue on the project repository.
