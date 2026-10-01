# AntryGravity Auto Script Runner

> **Professional Photoshop Automation Panel, Batch Image Processor & Auto Script Runner**  
> *Engineered for Adobe Photoshop 2020, 2021, 2022, 2023, 2024, 2025, and 2026.*

[![Photoshop Version](https://img.shields.io/badge/Photoshop-2020--2026-blue.svg)](https://www.adobe.com/products/photoshop.html)
[![UXP Support](https://img.shields.io/badge/UXP-Manifest%20v6-purple.svg)](https://developer.adobe.com/photoshop/uxp/)
[![CEP Legacy Support](https://img.shields.io/badge/CEP-10.0%20Fallback-orange.svg)](https://github.com/Adobe-CEP)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 1. Overview

**AntryGravity Auto Script Runner** is a dockable Photoshop extension that acts as a **mini automation control center inside Photoshop**. It enables artists, photographers, graphic designers, and production studios to batch process hundreds of images, chain multi-step filter pipelines, trigger recorded actions, generate production scripts on the fly, and export assets automatically.

```text
Photoshop Active Canvas
   ↓
AntryGravity Auto Script Runner Panel
   ↓
Select Images / Batch Folder (JPG, PNG, TIFF, PSD, WebP)
   ↓
Select Modules / Presets (Upscale, Gradient, Grain, Blur, Actions, Resize, etc.)
   ↓
Auto Script Generator (Generates UXP executeAsModal / ExtendScript pipeline)
   ↓
Non-Blocking Batch Queue Engine (Start, Pause, Resume, Stop, Skip, Retry)
   ↓
Automated Export Manager (Naming patterns, sequential numbering, subfolders)
   ↓
Detailed Activity & Automation Log
```

---

## 2. Core Capabilities & Modules

| Module | Description | Key Features |
| :--- | :--- | :--- |
| **Batch Images** | High-volume batch queue | Files, folders, drag & drop; queue stats (`done`, `remain`, `failed`) |
| **AI Upscale** | Resolution enlargement | 2K, 4K, 6K, 8K, custom; Preserve Details 2.0 & External AI adapter |
| **Gradient** | 4 Gradient engines | Smooth, Mesh, Abstract, Glass; custom/random color stops, noise |
| **Blur** | 6 Blur algorithms | Gaussian, Motion, Radial, Surface, Lens, and Field Blur |
| **Grain** | Film texture engine | 8 Curated presets: Film, Fine, Medium, Heavy, Vintage, Cinematic, etc. |
| **Actions** | Photoshop Action runner | Query active action sets, run on document, or run on batches with retry |
| **Background** | Subject isolation | Sensei Select Subject, transparent PNG, solid white, custom color backdrops |
| **Passport** | Identity photo generator | US 2x2, UK/EU 35x45mm, India/Canada; 4x6 / A4 print sheet tiling |
| **Resize** | Smart dimension presets | Instagram Portrait/Square/Story, YouTube banner/thumb, Stock, KDP |
| **Vector** | Illustrator vectorizer bridge | Native Image Trace workflow; SVG, EPS, AI export via ExtendScript bridge |
| **Icons** | Icon pack generator | Multi-resolution export (16px to 1024px), grid padding, sequential naming |
| **Effects** | 15 Graphic styles | Glass, Frosted, Chrome, Metallic, Glow, Neon, Duotone, Cinematic, etc. |
| **Export** | Output manager | JPG, PNG, TIFF, PSD; prefix/suffix, sequential numbering, subfolders |
| **Presets** | Workflow presets | Save, Load, Duplicate, Delete, Import, and Export JSON presets |
| **Script Library**| Script runner & sandbox | Built-in, imported, favorites, recent; security verification modal |

---

## 3. Photoshop Compatibility Strategy (2020 – 2026)

AntryGravity does not falsely assume APIs are identical across Photoshop versions. It implements a **Version Detector & Dual Host Bridge**:

- **Photoshop 2022 – 2026 (UXP Mode)**:  
  Uses `manifest.json` (Manifest v6). Calls are wrapped in `photoshop.core.executeAsModal()` with `photoshop.action.batchPlay()` and modern `uxp.storage.localFileSystem`.
- **Photoshop 2020 – 2021 (CEP Legacy Mode)**:  
  Uses `CSXS/manifest.xml` (CEP 10). Executes ExtendScript `.jsx` automation via `CSInterface.evalScript()` without freezing older versions.

---

## 4. CLI & Build System

The extension contains an automated build and packaging toolchain:

```bash
# 1. Validate manifests, JSON schemas, presets, and check JS syntax
npm run lint

# 2. Build production assets into build/antrygravity-auto-script-runner/
npm run build

# 3. Package into .ccx (UXP) and .zxp (CEP) installers in build/
npm run package

# 4. Start file watcher for real-time development
npm run dev

# 5. Run system diagnostics (Photoshop detection, CEP debug mode, UDT port)
npm run debug
```

---

## 5. Installation Instructions

### Option A: Modern Photoshop (2022–2026 via .ccx)
1. Run `npm run package` (or find the pre-built package in `build/AntryGravity-Auto-Script-Runner.ccx`).
2. Double-click `AntryGravity-Auto-Script-Runner.ccx`.
3. Follow the Creative Cloud prompt to install.
4. In Photoshop, find the panel under **Plugins > AntryGravity Auto Script Runner**.

### Option B: Development via Adobe UXP Developer Tool (UDT)
1. Launch **Adobe UXP Developer Tool**.
2. Click **Add Plugin** -> Select `manifest.json`.
3. Select **Actions > Load** and pick your target Photoshop version.
4. Select **Actions > Debug** to open Chrome DevTools for live debugging.

### Option C: Legacy Photoshop (2020–2021 via CEP)
1. Enable CEP Debug Mode:
   - Windows: `reg add HKCU\Software\Adobe\CSXS.10 /v PlayerDebugMode /t REG_SZ /d 1 /f`
   - macOS: `defaults write com.adobe.CSXS.10 PlayerDebugMode 1`
2. Copy the extension folder to your Adobe CEP extensions folder:
   - Windows: `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\AntryGravity-Auto-Script-Runner`
   - macOS: `/Library/Application Support/Adobe/CEP/extensions/AntryGravity-Auto-Script-Runner`
3. In Photoshop, open **Window > Extensions (legacy) > AntryGravity Auto Script Runner**.

---

## 6. Project Architecture

```text
AntryGravity-Auto-Script-Runner/
├── manifest.json              # UXP Manifest v6 (Photoshop 2022–2026)
├── CSXS/
│   └── manifest.xml           # CEP Extension Manifest (Photoshop 2020–2021)
├── package.json               # Scripts & metadata
├── README.md                  # Master documentation
│
├── src/
│   ├── index.html             # Panel structure & entry
│   ├── styles/
│   │   ├── main.css           # Design tokens, typography, dark theme
│   │   └── components.css     # Dashboard cards, sliders, toggles
│   ├── js/
│   │   ├── app.js             # Bootstrap & lifecycle
│   │   ├── ui.js              # View routing, navigation, modals, toasts
│   │   ├── queue.js           # Non-blocking batch processing queue
│   │   ├── version-detector.js# Runtime version detection & feature matrix
│   │   ├── script-runner.js   # Script library manager & security checks
│   │   ├── action-runner.js   # Photoshop Action (.atn) runner
│   │   ├── workflow-engine.js # Multi-step workflow pipeline builder
│   │   ├── export-manager.js  # Format conversions & renaming rules
│   │   ├── preset-manager.js  # Workflow presets manager
│   │   └── logger.js          # Central activity log panel
│   ├── modules/
│   │   ├── batch/             # Batch files/folder picker & queue monitor
│   │   ├── upscale/           # 2K/4K/6K/8K AI upscaling module
│   │   ├── gradient/          # 4 Gradient engines (Smooth, Mesh, Abstract, Glass)
│   │   ├── blur/              # 6 Blur filters with parameters
│   │   ├── grain/             # 8 Film grain presets
│   │   ├── actions/           # Photoshop action discovery & runner
│   │   ├── background/        # AI subject cutout & solid backdrops
│   │   ├── passport/          # Passport sizes & 4x6 print tiling
│   │   ├── resize/            # Social media & print dimensions
│   │   ├── vector/            # Illustrator Image Trace bridge
│   │   ├── icons/             # Multi-size icon pack generator
│   │   └── effects/           # 15 Graphic styles (Glass, Chrome, Neon, etc.)
│   ├── adapters/
│   │   ├── photoshop/         # Modern UXP adapter (executeAsModal, batchPlay)
│   │   ├── legacy/            # CEP adapter (CSInterface, ExtendScript)
│   │   ├── illustrator/       # Illustrator vectorization adapter
│   │   └── ai/                # Replaceable AI Provider abstraction (Real-ESRGAN, RMBG)
│   └── assets/                # Icons (icon-23, icon-26, icon-48, icon-128)
│
├── scripts/
│   ├── photoshop/             # ExtendScript (.jsx) scripts for legacy PS
│   └── illustrator/           # ExtendScript (.jsx) scripts for Illustrator
│
├── presets/                   # Production workflow JSON presets
├── tools/                     # Build, package, watch, debug, lint scripts
└── docs/                      # Technical guides & manuals
```

---

## 7. License

MIT License. Developed for professional Adobe Photoshop automation workflows.
