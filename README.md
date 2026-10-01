# 46-Auto-Script

# AntryGravity Auto Script Runner

> **Professional Photoshop Automation Panel, Batch Image Processor & Auto Script Runner**  
> *Engineered for Adobe Photoshop 2020, 2021, 2022, 2023, 2024, 2025, and 2026.*

[![Live Web Studio](https://img.shields.io/badge/Live%20Web%20Studio-Launch%20Online-6366f1.svg?style=for-the-badge&logo=googlechrome)](https://rafiqulislam11.github.io/46-Auto-Script/)
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

## 3. Quick Start & Installation

### Option A: Modern Photoshop (2022–2026 via .ccx)
1. Double-click `AntryGravity-Auto-Script-Runner/build/AntryGravity-Auto-Script-Runner.ccx`.
2. Follow the Adobe Creative Cloud prompt to install.
3. In Photoshop, find the panel under **Plugins > AntryGravity Auto Script Runner**.

### Option B: One-Click CEP Installer (Photoshop 2020–2021)
1. Run `AntryGravity-Auto-Script-Runner/install-to-photoshop.bat` as Administrator.
2. In Photoshop, open **Window > Extensions (legacy) > AntryGravity Auto Script Runner**.

### Option C: Browser Preview Mode
1. Run `AntryGravity-Auto-Script-Runner/start-browser-preview.bat` or `npm start`.
2. Access `http://localhost:3000/src/index.html` in your web browser.

---

## 4. License

MIT License. Designed and engineered for professional Photoshop automation.
