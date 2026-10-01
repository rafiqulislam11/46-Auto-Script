# Installation & Setup Guide

This guide details how to install and load the **AntryGravity Auto Script Runner** extension in Photoshop 2020 through Photoshop 2026.

---

## 1. Quick Installation (Photoshop 2022 – 2026 via .ccx)

1. Navigate to the project `build/` directory:
   ```text
   build/AntryGravity-Auto-Script-Runner.ccx
   ```
2. Double-click the `.ccx` package file.
3. The Adobe Creative Cloud desktop app will open and prompt:
   > "Install AntryGravity Auto Script Runner plugin?"
4. Click **Install**.
5. Launch or restart Photoshop.
6. Open the panel via **Plugins > AntryGravity Auto Script Runner**.

---

## 2. Developer Loading via Adobe UXP Developer Tool (UDT)

For live code debugging and immediate development:

1. Download and launch **Adobe UXP Developer Tool** (from Creative Cloud app).
2. Click **Add Plugin** in UDT.
3. Select `manifest.json` located in the root of `AntryGravity-Auto-Script-Runner`.
4. In UDT, locate "AntryGravity Auto Script Runner", click the **•••** (Actions) menu, and select **Load**.
5. Choose your target Photoshop version (e.g. Photoshop 2024, 2025, or 2026).
6. The panel will dock automatically into Photoshop.
7. Click **Debug** in UDT to launch the full Chrome DevTools inspection window.

---

## 3. Legacy Installation (Photoshop 2020 – 2021 via CEP)

For older versions of Photoshop that operate via CEP:

### Step 1: Enable Debug Mode
- **Windows**:
  Open Command Prompt as Administrator and run:
  ```cmd
  reg add "HKEY_CURRENT_USER\Software\Adobe\CSXS.10" /v PlayerDebugMode /t REG_SZ /d 1 /f
  ```
- **macOS**:
  Open Terminal and run:
  ```bash
  defaults write com.adobe.CSXS.10 PlayerDebugMode 1
  ```

### Step 2: Copy Extension Folder
Copy the entire `AntryGravity-Auto-Script-Runner` folder into your CEP extensions directory:
- **Windows**:
  `C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\AntryGravity-Auto-Script-Runner`
  or
  `%APPDATA%\Adobe\CEP\extensions\AntryGravity-Auto-Script-Runner`
- **macOS**:
  `/Library/Application Support/Adobe/CEP/extensions/AntryGravity-Auto-Script-Runner`

### Step 3: Launch in Photoshop
1. Launch Photoshop 2020 or 2021.
2. Navigate to **Window > Extensions (legacy) > AntryGravity Auto Script Runner**.
