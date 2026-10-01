# Photoshop Compatibility Matrix (2020 – 2026)

AntryGravity Auto Script Runner provides dedicated runtime pathways across seven generations of Adobe Photoshop.

---

## 1. Compatibility Matrix

| Photoshop Version | Release Year | Host Major Version | Primary Extension Runtime | Automation Engine | Manifest File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Photoshop 2020** | 2020 | `v21.x` | **CEP 10** | ExtendScript (.jsx) | `CSXS/manifest.xml` |
| **Photoshop 2021** | 2020–2021 | `v22.x` | **CEP 10** / Early UXP | ExtendScript / Early batchPlay | `CSXS/manifest.xml` |
| **Photoshop 2022** | 2021–2022 | `v23.x` | **UXP v4.x** | `batchPlay` + `executeAsModal` | `manifest.json` (v5) |
| **Photoshop 2023** | 2022–2023 | `v24.x` | **UXP v5.x** | `batchPlay` + `executeAsModal` | `manifest.json` (v5) |
| **Photoshop 2024** | 2023–2024 | `v25.x` | **UXP v6.x** | `batchPlay` + `executeAsModal` | `manifest.json` (v6) |
| **Photoshop 2025** | 2024–2025 | `v26.x` | **UXP v7.x** | `batchPlay` + `executeAsModal` | `manifest.json` (v6) |
| **Photoshop 2026** | 2025–2026 | `v27.x` | **UXP v8.x** | Modern UXP + Imaging API | `manifest.json` (v6) |

---

## 2. API Differences & Architectural Handling

### 2.1 Modal Execution
- **Photoshop 2022–2026 (UXP)**: All document-mutating operations **must** be wrapped inside `photoshop.core.executeAsModal(async () => { ... }, { commandName: "..." })`. Attempting to modify documents outside modal scope throws a fatal exception.
- **Photoshop 2020–2021 (CEP)**: ExtendScript executes synchronously or through `app.doAction` / `evalScript`. The `CEPAdapter` handles this transparently through async Promise wrappers.

### 2.2 Filesystem Access
- **UXP**: Direct Node.js `fs` is disallowed for sandboxed plugins. Access is provided via `require('uxp').storage.localFileSystem` (`getFileForOpening`, `getFolder`, `createFile`).
- **CEP**: Utilizes ExtendScript `File` and `Folder` objects (`new File(path)`), or Node.js `fs` when `--enable-nodejs` flag is enabled in `CSXS/manifest.xml`.

### 2.3 Resampling Algorithms
- **Photoshop 2022–2026**: Supports `preserveDetailsUpscale` via `batchPlay` descriptor `imageSize`.
- **Photoshop 2020–2021**: Uses `ResampleMethod.BICUBICAUTOMATIC` or `ResampleMethod.PRESERVEDETAILS` in ExtendScript.

### 2.4 Vectorization
- Raster-to-vector conversion is **not native** to Photoshop. Rather than faking raster vectorization, AntryGravity bridges to **Adobe Illustrator** via `IllustratorAdapter` to invoke native `Live Trace Expand` and export SVG/EPS.
