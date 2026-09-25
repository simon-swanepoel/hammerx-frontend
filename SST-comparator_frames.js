// ===================================================
// SST-COMPARATOR FRAME & MATERIAL THEME PRESETS ENGINE
// File: SST-comparator_frames.js
// ===================================================

const DEFAULT_FRAME_KEY = 'WOOD';

const FRAME_PRESETS = {
    'WOOD': {
        name: 'Oiled Wood',
        cssClass: 'wood-frame',
        hasNeonToggle: false,
        vars: {
            '--console-frame-bg': "url('wood.png')",
            '--console-frame-border': "url('wood.png')",
            '--btn-frame-bg': "url('wood.png')",
            '--btn-text-color': '#000000',
            '--btn-border-color': 'rgba(0, 0, 0, 0.65)',
            '--btn-text-shadow': '-1px -1px 1px rgba(0, 0, 0, 0.8), 1px 1px 1px rgba(255, 255, 255, 0.4)',
            '--btn-box-shadow': 'inset -1px -1px 2px rgba(0, 0, 0, 0.6), inset 1px 1px 2px rgba(255, 255, 255, 0.5), 0px 4px 8px rgba(0, 0, 0, 0.5)'
        }
    },
    'GLASS': {
        name: 'Studio Glass',
        cssClass: 'glass-frame',
        hasNeonToggle: true, // Enables ambient nite-lit
        vars: {
            '--console-frame-bg': 'none',
            '--console-frame-border': 'none',
            '--btn-frame-bg': 'linear-gradient(180deg, #181a24 0%, #0d0e14 60%, #050608 100%)',
            '--btn-text-color': '#00f0ff',
            '--btn-border-color': '#00f0ff',
            '--btn-text-shadow': '0 0 6px #00f0ff, 0 0 14px rgba(0, 240, 255, 0.6)',
            '--btn-box-shadow': 'inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -1px 3px rgba(0, 0, 0, 0.9), 0 0 10px rgba(0, 240, 255, 0.5), 0 4px 10px rgba(0, 0, 0, 0.8)'
        }
    },
    'CONCRETE': {
        name: 'Cast Concrete',
        cssClass: 'concrete-frame',
        hasNeonToggle: false,
        vars: {
            '--console-frame-bg': 'none',
            '--console-frame-border': 'none',
            '--btn-frame-bg': 'linear-gradient(180deg, #32363e 0%, #202227 60%, #17181c 100%)',
            '--btn-text-color': '#e2e4e9',
            '--btn-border-color': '#3d4149',
            '--btn-text-shadow': '0 1px 2px rgba(0, 0, 0, 0.9)',
            '--btn-box-shadow': 'inset 0 1px 1px rgba(255, 255, 255, 0.2), inset 0 -2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6)'
        }
    },
    'GRAPHITE': {
        name: 'Matte Graphite',
        cssClass: 'graphite-frame',
        hasNeonToggle: false,
        vars: {
            '--console-frame-bg': 'none',
            '--console-frame-border': 'none',
            '--btn-frame-bg': 'linear-gradient(180deg, #1d1f26 0%, #121317 60%, #0a0b0d 100%)',
            '--btn-text-color': '#00ff66',
            '--btn-border-color': 'rgba(0, 255, 102, 0.5)',
            '--btn-text-shadow': '0 0 5px rgba(0, 255, 102, 0.5)',
            '--btn-box-shadow': 'inset 0 1px 1px rgba(255, 255, 255, 0.15), inset 0 -1px 3px rgba(0, 0, 0, 0.9), 0 4px 10px rgba(0, 0, 0, 0.7)'
        }
    },
    'GUNMETAL': {
        name: 'Bead-Blasted Alloy',
        cssClass: 'gunmetal-frame',
        hasNeonToggle: false,
        vars: {
            '--console-frame-bg': 'none',
            '--console-frame-border': 'none',
            '--btn-frame-bg': 'linear-gradient(180deg, #30343e 0%, #1f2127 60%, #151619 100%)',
            '--btn-text-color': '#ffd700',
            '--btn-border-color': 'rgba(255, 215, 0, 0.5)',
            '--btn-text-shadow': '0 1px 2px rgba(0, 0, 0, 0.9), 0 0 6px rgba(255, 215, 0, 0.4)',
            '--btn-box-shadow': 'inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6)'
        }
    }
};

let activeFrameKey = localStorage.getItem('sst_active_frame') || DEFAULT_FRAME_KEY;

/**
 * Apply the selected frame preset to the workstation console and CSS root
 */
function applyConsoleFrame(frameKey) {
    const root = document.documentElement;

    // Safety fallback: if preset was deleted or invalid, fallback to Wood
    if (!FRAME_PRESETS[frameKey]) {
        console.warn(`[Frame Engine] Preset "${frameKey}" does not exist. Reverting to "${DEFAULT_FRAME_KEY}".`);
        frameKey = DEFAULT_FRAME_KEY;
    }

    activeFrameKey = frameKey;
    localStorage.setItem('sst_active_frame', frameKey);

    const preset = FRAME_PRESETS[frameKey];
    const consoleEl = document.getElementById('main-workstation-console');

    // 1. Inject root CSS variables for buttons and borders
    if (preset.vars) {
        for (const [vKey, vVal] of Object.entries(preset.vars)) {
            root.style.setProperty(vKey, vVal);
        }
    }

    // 2. Update Console Element classes
    if (consoleEl) {
        Object.values(FRAME_PRESETS).forEach(p => consoleEl.classList.remove(p.cssClass));
        consoleEl.classList.remove('neon-glow-on');

        consoleEl.classList.add(preset.cssClass);

        const isNeonOn = localStorage.getItem('sst_glass_neon') === 'true';
        if (preset.hasNeonToggle && isNeonOn) {
            consoleEl.classList.add('neon-glow-on');
        }
    }

    // 3. Sync Active State in Settings UI
    document.querySelectorAll('.theme-preset-card[data-frame]').forEach(card => {
        card.classList.toggle('active-theme', card.getAttribute('data-frame') === frameKey);
    });

    // 4. Toggle Neon Checkbox row visibility
    const neonRow = document.getElementById('glass-neon-toggle-row');
    if (neonRow) {
        neonRow.style.display = preset.hasNeonToggle ? 'block' : 'none';
    }
}

/**
 * Render dynamic material selection cards in the Settings panel
 */
function renderFrameSelectionUI() {
    const container = document.getElementById('material-presets-container');
    if (!container) return;

    container.innerHTML = '';

    Object.entries(FRAME_PRESETS).forEach(([key, config]) => {
        const card = document.createElement('div');
        card.className = `theme-preset-card card-border-${config.cssClass}`;
        card.setAttribute('data-frame', key);
        card.innerHTML = `<span>${config.name.toUpperCase()}</span>`;

        card.addEventListener('click', () => {
            applyConsoleFrame(key);
        });

        container.appendChild(card);
    });

    // Neon checkbox change listener
    const chkNeon = document.getElementById('chk-glass-neon');
    if (chkNeon) {
        chkNeon.checked = localStorage.getItem('sst_glass_neon') === 'true';
        chkNeon.onchange = (e) => {
            localStorage.setItem('sst_glass_neon', e.target.checked);
            applyConsoleFrame(activeFrameKey);
        };
    }
}

// Auto-boot frame presets on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    renderFrameSelectionUI();
    applyConsoleFrame(activeFrameKey);
});
