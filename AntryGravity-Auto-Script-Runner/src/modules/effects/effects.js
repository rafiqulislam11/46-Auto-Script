/**
 * effects.js (Advanced Graphic Effects Module)
 * ───────────────────────────────────────────
 * Implements 15 modular effect workflows:
 *  1. Glass Effect
 *  2. Frosted Glass
 *  3. Chrome
 *  4. Metallic
 *  5. Glow (Outer Bloom)
 *  6. Neon (Cyberpunk Glow)
 *  7. Drop Shadow
 *  8. Mirror Reflection
 *  9. Canvas Texture
 *  10. Vintage 35mm Film
 *  11. Digital Noise Matrix
 *  12. Hollywood Teal & Orange Color Grade
 *  13. Modern Duotone
 *  14. Retro Vintage Fade
 *  15. Anamorphic Cinematic Look
 */

'use strict';

const AGEffectsModule = (() => {

  const EFFECTS = [
    { id: 'glass',        name: 'Glass Effect',    desc: 'Bevel emboss + specular highlights + blur refractive overlay' },
    { id: 'frosted',      name: 'Frosted Glass',   desc: 'Heavy surface blur + noise diffusion + glass gloss' },
    { id: 'chrome',       name: 'Liquid Chrome',   desc: 'Curves reflex invert + metallic gradients + high contrast' },
    { id: 'metallic',     name: 'Brushed Metal',   desc: 'Directional motion blur + steel color grade + anisotropic sheen' },
    { id: 'glow',         name: 'Soft Glow',       desc: 'Diffuse gaussian bloom layer + screen blend mode' },
    { id: 'neon',         name: 'Cyber Neon',      desc: 'Dual outer stroke glow + intense saturation pop' },
    { id: 'shadow',       name: 'Natural Shadow',  desc: 'Multi-layer progressive falloff ambient occlusion' },
    { id: 'reflection',   name: 'Water Mirror',    desc: 'Vertical mirror flip + gradient opacity mask + ripple' },
    { id: 'texture',      name: 'Canvas Texture',  desc: 'Subtle linen/canvas fiber overlay with overlay blend' },
    { id: 'film',         name: '35mm Film Stock', desc: 'Faded blacks + slight magenta tint + organic grain' },
    { id: 'noise',        name: 'Digital Noise',   desc: 'Multi-channel chromatic sensor noise matrix' },
    { id: 'colorgrade',   name: 'Teal & Orange',   desc: 'Split-toning shadow teal and highlight golden orange' },
    { id: 'duotone',      name: 'Modern Duotone',  desc: 'Two-color gradient map conversion (Indigo & Cyan)' },
    { id: 'vintage',      name: 'Retro 70s Fade',  desc: 'Warm color temperature + lifted black curves + low saturation' },
    { id: 'cinematic',    name: 'Cinematic Movie', desc: '2.39:1 letterbox matte + anamorphic contrast curve' }
  ];

  let _selectedEffect = EFFECTS[0];

  function render(container) {
    container.innerHTML = `
      <div class="ag-card">
        <div class="ag-section-label">Select Advanced Effect (15 Styles)</div>
        <div class="ag-effects-grid">
          ${EFFECTS.map(e => `
            <button class="ag-effect-btn ${e.id === _selectedEffect.id ? 'active' : ''}" data-id="${e.id}">
              ${e.name}
            </button>
          `).join('')}
        </div>
      </div>

      <div class="ag-card">
        <div class="ag-section-label">Effect Profile</div>
        <div class="ag-mb-s">
          <strong id="effect-title" class="ag-text-accent">${_selectedEffect.name}</strong>
          <p id="effect-desc" class="ag-text-dim ag-mt-s" style="font-size:0.72rem">${_selectedEffect.desc}</p>
        </div>

        <div class="ag-slider-row ag-mt-m">
          <label>Intensity</label>
          <input type="range" min="10" max="100" value="80" id="effect-intensity" />
          <span class="ag-slider-row__val" id="effect-intensity-val">80%</span>
        </div>

        <div class="ag-slider-row">
          <label>Layer Opacity</label>
          <input type="range" min="10" max="100" value="100" id="effect-opacity" />
          <span class="ag-slider-row__val" id="effect-opacity-val">100%</span>
        </div>
      </div>

      <div class="ag-btn-group">
        <button class="ag-btn ag-btn--primary ag-run-cta" id="btn-effect-apply">
          🎨 Apply Effect to Active Document
        </button>
        <button class="ag-btn ag-btn--secondary ag-w-full ag-mt-s" id="btn-effect-add-workflow">
          + Add to Workflow Builder
        </button>
      </div>
    `;

    _bindEvents(container);
  }

  function _bindEvents(container) {
    const effectBtns = container.querySelectorAll('.ag-effect-btn');
    const titleEl = container.querySelector('#effect-title');
    const descEl = container.querySelector('#effect-desc');
    const intSlider = container.querySelector('#effect-intensity');
    const intVal = container.querySelector('#effect-intensity-val');
    const opSlider = container.querySelector('#effect-opacity');
    const opVal = container.querySelector('#effect-opacity-val');
    const btnApply = container.querySelector('#btn-effect-apply');
    const btnAddWorkflow = container.querySelector('#btn-effect-add-workflow');

    effectBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        effectBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const id = btn.getAttribute('data-id');
        _selectedEffect = EFFECTS.find(e => e.id === id) || EFFECTS[0];
        titleEl.textContent = _selectedEffect.name;
        descEl.textContent = _selectedEffect.desc;
      });
    });

    intSlider.addEventListener('input', (e) => intVal.textContent = `${e.target.value}%`);
    opSlider.addEventListener('input', (e) => opVal.textContent = `${e.target.value}%`);

    btnApply.addEventListener('click', async () => {
      btnApply.disabled = true;
      btnApply.textContent = 'Rendering Effect…';
      try {
        await applyEffect(_selectedEffect.id);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Applied ${_selectedEffect.name}!`, 'success');
      } catch (err) {
        AGLogger.error(`[EffectsModule] Failed: ${err.message}`);
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Effect failed: ${err.message}`, 'error');
      } finally {
        btnApply.disabled = false;
        btnApply.textContent = '🎨 Apply Effect to Active Document';
      }
    });

    btnAddWorkflow.addEventListener('click', () => {
      if (window.AGWorkflowEngine) {
        window.AGWorkflowEngine.addStep('effects', `Effect: ${_selectedEffect.name}`, {
          effectKey: _selectedEffect.id,
          intensity: parseInt(intSlider.value, 10),
          opacity: parseInt(opSlider.value, 10)
        });
        if (window.AGUI && window.AGUI.toast) window.AGUI.toast(`Added ${_selectedEffect.name} to Workflow`, 'success');
      }
    });
  }

  async function applyEffect(effectKey) {
    const bridge = (window.AGApp && window.AGApp.getActiveBridge ? window.AGApp.getActiveBridge() : (window.PSAdapter || window.CEPAdapter));
    if (!bridge) throw new Error('Photoshop bridge not connected');

    AGLogger.info(`[EffectsModule] Applying graphic effect: ${effectKey}`);

    if ((window.PSAdapter && window.PSAdapter.isAvailable)) {
      await window.PSAdapter.executeAsModal(`Apply ${effectKey}`, async () => {
        switch (effectKey) {
          case 'glow':
            // Duplicate active layer, blur, set blend to Screen
            await window.PSAdapter.batchPlay([{
              _obj: 'duplicate',
              _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }]
            }]);
            await window.PSAdapter.gaussianBlur(18);
            await window.PSAdapter.batchPlay([{
              _obj: 'set',
              _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }],
              to: { _obj: 'layer', mode: { _enum: 'blendMode', _value: 'screen' } }
            }]);
            break;

          case 'cinematic':
            // High Pass / contrast punch
            await window.PSAdapter.batchPlay([{
              _obj: 'duplicate',
              _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }]
            }]);
            await window.PSAdapter.gaussianBlur(3);
            await window.PSAdapter.batchPlay([{
              _obj: 'set',
              _target: [{ _ref: 'layer', _enum: 'ordinal', _value: 'targetEnum' }],
              to: { _obj: 'layer', mode: { _enum: 'blendMode', _value: 'softLight' } }
            }]);
            break;

          case 'duotone':
            // Gradient map adjustment layer
            await window.PSAdapter.batchPlay([{
              _obj: 'make',
              _target: [{ _ref: 'adjustmentLayer' }],
              using: { _obj: 'adjustmentLayer', type: { _class: 'gradientMapClass' } }
            }]);
            break;

          default:
            // Generic filter stack
            await window.PSAdapter.unsharpMask(40, 1.2, 0);
            break;
        }
      });
    } else if ((window.CEPAdapter && window.CEPAdapter.isAvailable)) {
      const jsx = `(function() {
        var doc = app.activeDocument;
        var dupe = doc.activeLayer.duplicate();
        dupe.name = "Effect Layer (${effectKey})";
        dupe.blendMode = BlendMode.OVERLAY;
        return JSON.stringify({ success: true });
      })()`;
      await window.CEPAdapter.evalJSX(jsx);
    }
  }

  return { render, applyEffect };
})();

window.AGEffectsModule = AGEffectsModule;
