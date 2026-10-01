# AntryGravity Auto Script Runner — User Guide

Welcome to **AntryGravity Auto Script Runner**, the mini automation control center inside Adobe Photoshop.

---

## 1. Quick Tour of the Dashboard

When you open the panel, you will see 12 primary automation modules:

1. **Batch Images**: Source file selection (files, folders, drag & drop) and non-blocking queue monitor.
2. **AI Upscale**: 2K, 4K, 6K, 8K, and custom image upscaling with Photoshop Preserve Details 2.0 or external AI models.
3. **Gradient**: Four advanced gradient engines (Smooth, Mesh, Abstract, Glass) with custom or randomized color stops.
4. **Blur**: Gaussian, Motion, Radial, Surface, Lens, and Field Blur with real-time sliders.
5. **Grain**: 8 curated photographic grain presets (Film, Fine, Medium, Heavy, Vintage, Cinematic, Digital, Monochrome).
6. **Actions**: Discover and run Photoshop Actions (.atn) across batches with auto-retry and continue-on-error features.
7. **Background**: Subject cutout and background replacement (transparent, white, custom solid color, or layer mask).
8. **Passport**: Standard global dimensions (US 2x2, UK/EU 35x45mm, India/Canada) and 4x6 / A4 print sheet tiling.
9. **Resize**: Social media presets (Instagram Portrait/Square/Story, YouTube banner/thumbnail, Facebook, Stock, KDP).
10. **Vector**: Bridge to Adobe Illustrator for automated Image Trace and SVG/EPS vector generation.
11. **Icons**: Multi-resolution icon set generation (16px to 1024px) with sequential naming and transparent PNG export.
12. **Effects**: 15 graphic styling workflows (Glass, Frosted, Chrome, Metallic, Glow, Neon, Duotone, Cinematic, etc.).

---

## 2. The Auto Script Generator & Workflow Pipeline

The most powerful feature of AntryGravity is the **Workflow Builder**:

1. Click any module from the Dashboard, adjust the parameters, and click **+ Add to Workflow Builder**.
2. Click the **Workflow** tab at the top.
3. You will see your chained pipeline (e.g. `Upscale 8K` → `Film Grain` → `Smart Resize` → `Save as JPEG`).
4. You can:
   - Toggle individual steps on or off.
   - Remove steps with the **✕** button.
   - Inspect the **Generated Automation Script Preview** in real time.
5. Click **RUN WORKFLOW (Active Document)** to process your open canvas, or **Run Across Batch Queue** to automate an entire folder!

---

## 3. Batch Processing 100+ Images Without Freezing

1. Open the **Batch Images** card or switch to the **Queue** tab.
2. Drag & drop images into the drop zone, or click **Select Files** / **Select Folder**.
3. AntryGravity populates the queue with statuses: `waiting`, `processing`, `completed`, `failed`.
4. Click **Start**. The extension automatically opens each image, executes your active workflow, saves the output, and closes the document safely.
5. Monitor progress, elapsed time, and real-time logs in the **Log** tab!
