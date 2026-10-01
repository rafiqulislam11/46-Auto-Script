# AI Engine Integration & Extensibility Architecture

AntryGravity Auto Script Runner is built with a pluggable **AI Provider Pattern** (`src/adapters/ai/`). This prevents vendor lock-in and allows seamless integration with both native Photoshop neural engines and external AI servers (local ONNX/TensorRT runtimes or cloud APIs).

---

## 1. Provider Pattern

All AI engines implement the `BaseAIProvider` class:

```javascript
class CustomAIUpscaler extends BaseAIProvider {
  constructor(apiKey, endpoint) {
    super('custom-ai-upscaler', 'Custom Real-ESRGAN Cluster', { endpoint, apiKey });
  }

  async checkAvailability() {
    // Health check ping
    const res = await fetch(`${this.options.endpoint}/health`);
    return res.ok;
  }

  async process(input) {
    // input contains base64 image data, scale (2x, 4x, 8x), and denoise parameters
    const response = await fetch(`${this.options.endpoint}/upscale`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    const data = await response.json();
    return { success: true, outputBase64: data.output };
  }
}

// Register with the global manager
window.UpscaleManager.registerProvider(new CustomAIUpscaler('KEY', 'http://127.0.0.1:7860'));
```

---

## 2. Supported Local AI Backends

### 2.1 Upscale Engine (Real-ESRGAN / SwinIR)
- **Local Endpoint**: `http://127.0.0.1:7860/api/upscale`
- **Supported Models**:
  - `realesrgan-x4plus` (Photographic fidelity)
  - `realesrgan-x4plus-anime` (Digital illustration / 2D)
  - `realesr-general-x4v3` (General high-speed)
- **Native Fallback**: Photoshop `preserveDetailsUpscale` with post-sharpening unsharp mask.

### 2.2 Background Removal (RMBG 1.4 / BiRefNet / Rembg)
- **Local Endpoint**: `http://127.0.0.1:5000/api/remove-bg`
- **Supported Outputs**:
  - Transparent Alpha Cutout (`.png`)
  - Solid White Background (`#FFFFFF`)
  - Custom Color Backdrop (`#HEX`)
  - Non-destructive Layer Mask
- **Native Fallback**: Photoshop Sensei `autoCutout` (`Select > Subject`) with edge feathering and layer mask creation.
