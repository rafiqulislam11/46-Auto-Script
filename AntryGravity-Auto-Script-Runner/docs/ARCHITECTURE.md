# AntryGravity Auto Script Runner — System Architecture

## 1. High-Level Architectural Overview

The **AntryGravity Auto Script Runner** is engineered as a unified automation control center inside Adobe Photoshop. It employs a **hybrid runtime bridge** architecture that decouples user interface and business logic from host-specific Photoshop API changes across generations (Photoshop 2020 through Photoshop 2026).

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE LAYER                            │
│  Dark-Mode Photoshop Panel (HTML5 / Vanilla CSS Design System)         │
│  Dashboard Cards • Workflow Pipeline • Queue Engine • Script Library   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    CORE AUTOMATION CONTROLLERS                         │
│  AGWorkflowEngine  •  AGQueue  •  AGActionRunner  •  AGExportManager   │
│  AGPresetManager   •  AGScriptRunner  •  AGLogger                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                 VERSION DETECTOR & COMPATIBILITY LAYER                 │
│  VersionDetector: Sniffs host runtime, capabilities & version string   │
│  Feature Matrix: Gates neural filters, field blur, modal execution     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
              ┌─────────────────────┴─────────────────────┐
              │                                           │
┌─────────────▼──────────────┐             ┌──────────────▼─────────────┐
│    UXP ADAPTER (v23-27)    │             │    CEP ADAPTER (v21-22)    │
│  • Photoshop 2022–2026     │             │  • Photoshop 2020–2021     │
│  • executeAsModal()        │             │  • CSInterface evalScript  │
│  • batchPlay Descriptors   │             │  • ExtendScript (.jsx)     │
│  • uxp.storage Filesystem  │             │  • File / Folder / doAction│
└─────────────┬──────────────┘             └──────────────┬─────────────┘
              │                                           │
┌─────────────▼───────────────────────────────────────────▼─────────────┐
│                      EXTERNAL ADAPTER BRIDGES                          │
│  • IllustratorAdapter: Live Trace vectorization bridge (SVG/EPS/AI)    │
│  • UpscaleManager: Native Preserve Details 2.0 ↔ Local Real-ESRGAN     │
│  • BackgroundRemovalManager: Native Sensei ↔ External RMBG Server      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Version Detector (`src/js/version-detector.js`)
- Executed on boot before any host calls.
- Inspects `require('photoshop').app.version` for UXP and `CSInterface.getHostEnvironment().appVersion` for CEP.
- Maps major version numbers (`21` -> 2020, `22` -> 2021, `23` -> 2022, `24` -> 2023, `25` -> 2024, `26` -> 2025, `27` -> 2026).
- Defines a capability matrix so unavailable features display friendly warning notices (`unavailableHTML`) rather than crashing.

### 2.2 Host Adapters (`src/adapters/`)
- **`PSAdapter` (`src/adapters/photoshop/ps-adapter.js`)**: Wraps modern UXP APIs. All document modifications execute safely inside `core.executeAsModal()` with descriptive modal labels and `action.batchPlay()`.
- **`CEPAdapter` (`src/adapters/legacy/cep-adapter.js`)**: Implements the exact same function signatures as `PSAdapter` using ExtendScript (`evalScript`) for older Photoshop versions.
- **`IllustratorAdapter` (`src/adapters/illustrator/ai-adapter.js`)**: Bridges raster images to Adobe Illustrator's native Live Trace engine, generating automated ExtendScript scripts or triggering direct vectorization.

### 2.3 Provider Pattern for AI (`src/adapters/ai/`)
- **`BaseAIProvider`**: Base abstraction class requiring `checkAvailability()`, `configure()`, and `process()`.
- **`UpscaleManager` & `BackgroundRemovalManager`**: Multi-provider registries allowing dynamic switching between native Photoshop Sensei algorithms and local or cloud AI models (Real-ESRGAN, RMBG, Rembg).

### 2.4 Queue Engine (`src/js/queue.js`)
- Non-blocking async queue for batch processing 10 to 1,000+ files.
- Operates via sequential macrotask scheduling (`setTimeout(_step, 10)`), allowing Photoshop UI and OS message pumps to remain responsive.
- Integrated cooldown delay between documents (default 250ms) to trigger memory cleanup and avoid locking GPU memory.

### 2.5 Security Model (`src/js/script-runner.js`)
- Whitelist tracking for trusted built-in scripts.
- Sandboxed confirmation modal for imported user scripts displaying script source, type, and warning dialog.
- No arbitrary silent remote code execution.
