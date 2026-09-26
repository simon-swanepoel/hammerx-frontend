// ==========================================================================
// SST-COMPARATOR BEZEL MATERIAL & HARDWARE TEXTURE ENGINE
// Master Script: SST-comparator_frames.js (Complete Extended Edition)
// ==========================================

(function (window, document) {
    'use strict';

    // ----------------------------------------------------------------------
    // 1. EXTENDED MATERIAL PRESET REGISTRY
    // ----------------------------------------------------------------------
    const MATERIAL_PRESETS = [
        {
            id: 'WOOD',
            label: 'WOOD BORDER',
            cardClass: 'card-border-wood-frame',
            consoleClass: 'wood-frame',
            properties: {
                '--console-frame-bg': "url('wood.wp2')",
                '--console-frame-border': "url('wood.wp2')",
                '--btn-frame-bg': "url('wood.wp2')",
                '--btn-text-color': '#000000',
                '--btn-text-shadow': '-1px -1px 1px rgba(0,0,0,0.8), 1px 1px 1px rgba(255,255,255,0.4)',
                '--btn-box-shadow': 'inset -1px -1px 2px rgba(0,0,0,0.6), inset 1px 1px 2px rgba(255,255,255,0.5), 0px 4px 8px rgba(0,0,0,0.5)',
                '--btn-border-color': 'rgba(0,0,0,0.65)'
            },
            rules: `
                .workstation-console.wood-frame {
                    background-image: url('wood.wp2') !important;
                    background-repeat: repeat !important;
                    border: 14px solid transparent !important;
                    border-image: url('wood.wp2') 30 stretch !important;
                    box-shadow: inset 0 2px 5px rgba(0,0,0,0.8), inset 0 -2px 5px rgba(0,0,0,0.8), 0 12px 35px rgba(0,0,0,0.85) !important;
                }
            `
        },
        {
            id: 'TITANIUM',
            label: 'TITANIUM BORDER',
            cardClass: 'card-border-titanium-frame',
            consoleClass: 'titanium-frame',
            properties: {
                '--console-frame-bg': 'linear-gradient(135deg, #2c2d30 0%, #e2e4e9 25%, #8a8d97 50%, #b29c6d 75%, #111317 100%)',
                '--console-frame-border': 'linear-gradient(135deg, #3a3b40 0%, #ffffff 30%, #70737a 70%, #151618 100%)',
                '--btn-frame-bg': 'linear-gradient(180deg, #484c56 0%, #2f323a 100%)',
                '--btn-text-color': '#ffffff',
                '--btn-text-shadow': '0 1px 2px rgba(0,0,0,0.8)',
                '--btn-box-shadow': 'inset 0 1px 0 rgba(255,255,255,0.3), 0 3px 6px rgba(0,0,0,0.6)',
                '--btn-border-color': 'rgba(255,255,255,0.25)'
            },
            rules: `
                .workstation-console.titanium-frame {
                    background-image: none !important;
                    background: linear-gradient(135deg, #2c2d30 0%, #e2e4e9 25%, #8a8d97 50%, #b29c6d 75%, #111317 100%) !important;
                    border: 14px solid #3a3b40 !important;
                    border-image: linear-gradient(135deg, #4a4d55 0%, #f0f2f5 35%, #595c64 70%, #1a1b1e 100%) 30 stretch !important;
                    box-shadow: inset 0 2px 3px rgba(255,255,255,0.4), inset 0 -2px 5px rgba(0,0,0,0.9), 0 15px 40px rgba(0,0,0,0.9) !important;
                }
            `
        },
        {
            id: 'BLACK_GLASS',
            label: 'NITE-LIT (BLACK GLASS)',
            cardClass: 'card-border-glass-frame',
            consoleClass: 'blackglass-frame',
            properties: {
                '--console-frame-bg': 'none',
                '--console-frame-border': 'none',
                '--btn-frame-bg': 'radial-gradient(circle at 50% 10%, #1e2029 0%, #0c0d12 70%)',
                '--btn-text-color': '#00f0ff',
                '--btn-text-shadow': '0 0 6px rgba(0,240,255,0.6)',
                '--btn-box-shadow': 'inset 0 0 8px rgba(0,240,255,0.2), 0 4px 10px rgba(0,0,0,0.8)',
                '--btn-border-color': 'rgba(0,240,255,0.4)'
            },
            rules: `
                .workstation-console.blackglass-frame {
                    background-image: none !important;
                    background: rgba(10, 11, 15, 0.95) !important;
                    border: 14px solid rgba(0, 240, 255, 0.15) !important;
                    box-shadow: inset 0 0 20px rgba(0,240,255,0.1), 0 12px 35px rgba(0,0,0,0.95), 0 0 15px rgba(0,240,255,0.12) !important;
                }
            `
        },
        {
            id: 'CONCRETE',
            label: 'ARCHITECTURAL CONCRETE',
            cardClass: 'card-border-concrete-frame',
            consoleClass: 'concrete-frame',
            properties: {
                '--console-frame-bg': 'none',
                '--console-frame-border': 'none',
                '--btn-frame-bg': 'linear-gradient(180deg, #3a3e47 0%, #24272c 100%)',
                '--btn-text-color': '#e2e4e9',
                '--btn-text-shadow': '0 1px 2px rgba(0,0,0,0.9)',
                '--btn-box-shadow': 'inset 0 1px 1px rgba(255,255,255,0.15), inset 0 -2px 4px rgba(0,0,0,0.7), 0 3px 6px rgba(0,0,0,0.6)',
                '--btn-border-color': 'rgba(58,62,71,0.8)'
            },
            rules: `
                .workstation-console.concrete-frame {
                    background-image: none !important;
                    background: linear-gradient(180deg, #2d3036 0%, #1e2024 50%, #16171a 100%) !important;
                    border: 14px solid #222429 !important;
                    border-image: linear-gradient(180deg, #3a3e47 0%, #131417 100%) 30 stretch !important;
                    box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.16), inset 0 -3px 8px rgba(0, 0, 0, 0.85), 0 16px 45px rgba(0, 0, 0, 0.96) !important;
                }
            `
        },
        {
            id: 'GRAPHITE',
            label: 'BRUSHED GRAPHITE',
            cardClass: 'card-border-graphite-frame',
            consoleClass: 'graphite-frame',
            properties: {
                '--console-frame-bg': 'none',
                '--console-frame-border': 'none',
                '--btn-frame-bg': 'linear-gradient(180deg, #22262d 0%, #111317 100%)',
                '--btn-text-color': '#00ff66',
                '--btn-text-shadow': '0 0 4px rgba(0,255,102,0.4)',
                '--btn-box-shadow': 'inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 3px rgba(0,0,0,0.9), 0 3px 6px rgba(0,0,0,0.7)',
                '--btn-border-color': 'rgba(41,45,54,0.9)'
            },
            rules: `
                .workstation-console.graphite-frame {
                    background-image: none !important;
                    background: linear-gradient(180deg, #17191e 0%, #0c0d10 100%) !important;
                    border: 14px solid #131519 !important;
                    border-image: linear-gradient(180deg, #292d36 0%, #08090b 100%) 30 stretch !important;
                    box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 -1px 3px rgba(0, 0, 0, 0.9), 0 14px 40px rgba(0, 0, 0, 0.98) !important;
                }
            `
        },
        {
            id: 'GUNMETAL',
            label: 'INDUSTRIAL GUNMETAL',
            cardClass: 'card-border-gunmetal-frame',
            consoleClass: 'gunmetal-frame',
            properties: {
                '--console-frame-bg': 'none',
                '--console-frame-border': 'none',
                '--btn-frame-bg': 'linear-gradient(180deg, #343741 0%, #1b1c21 100%)',
                '--btn-text-color': '#ffd700',
                '--btn-text-shadow': '0 1px 2px rgba(0,0,0,0.8)',
                '--btn-box-shadow': 'inset 0 1px 2px rgba(255,255,255,0.25), inset 0 -2px 5px rgba(0,0,0,0.85), 0 3px 6px rgba(0,0,0,0.65)',
                '--btn-border-color': 'rgba(66,70,82,0.85)'
            },
            rules: `
                .workstation-console.gunmetal-frame {
                    background-image: none !important;
                    background: linear-gradient(180deg, #292c34 0%, #1b1c21 55%, #131417 100%) !important;
                    border: 14px solid #212328 !important;
                    border-image: linear-gradient(180deg, #424652 0%, #1f2126 40%, #141518 100%) 30 stretch !important;
                    box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.3), inset 0 -2px 6px rgba(0, 0, 0, 0.85), 0 14px 35px rgba(0, 0, 0, 0.9) !important;
                }
            `
        }
    ];

    // ----------------------------------------------------------------------
    // 2. DYNAMIC STYLE INJECTION ENGINE
    // ----------------------------------------------------------------------
    function injectDynamicFrameStyles() {
        const styleId = 'sst-dynamic-frames-style';
        let styleTag = document.getElementById(styleId);

        if (!styleTag) {
            styleTag = document.createElement('style');
            styleTag.id = styleId;
            document.head.appendChild(styleTag);
        }

        let compiledCss = `
            /* Core Bezels Reset & Fallback */
            .workstation-console {
                transition: border-color 0.25s ease, box-shadow 0.25s ease;
            }
            .card-border-wood-frame { background: #3b281a; color: #ffecd2; }
            .card-border-titanium-frame { background: #3a3b40; color: #ffffff; }
            .card-border-glass-frame { background: #0c0d12; color: #00f0ff; border: 1px solid rgba(0,240,255,0.3); }
            .card-border-concrete-frame { background: #2d3036; color: #e2e4e9; }
            .card-border-graphite-frame { background: #101215; color: #00ff66; }
            .card-border-gunmetal-frame { background: #212328; color: #ffd700; }
        `;

        MATERIAL_PRESETS.forEach(preset => {
            if (preset.rules) {
                compiledCss += '\n' + preset.rules;
            }
        });

        styleTag.textContent = compiledCss;
    }

    // ----------------------------------------------------------------------
    // 3. HARDWARE BUTTON INTERACTION LISTENERS
    // ----------------------------------------------------------------------
    function attachHardwareButtonTactileEffects() {
        const selector = '.viewport-button-corner, .viewport-button-center, .action-button-large';
        const buttons = document.querySelectorAll(selector);

        buttons.forEach(btn => {
            if (btn.dataset.tactileBound === 'true') return;
            btn.dataset.tactileBound = 'true';

            btn.addEventListener('mousedown', () => {
                btn.style.transform = 'translateY(2px)';
                btn.style.filter = 'brightness(0.9)';
            });

            btn.addEventListener('mouseup', () => {
                btn.style.transform = '';
                btn.style.filter = '';
            });

            btn.addEventListener('mouseleave', () => {
                btn.style.transform = '';
                btn.style.filter = '';
            });
        });
    }

    // ----------------------------------------------------------------------
    // 4. CORE MATERIAL APPLICATION LOGIC
    // ----------------------------------------------------------------------
    function applyMaterialPreset(preset) {
        if (!preset) return;

        const root = document.documentElement;

        // Apply all declared CSS custom properties
        if (preset.properties) {
            for (const [propName, propVal] of Object.entries(preset.properties)) {
                root.style.setProperty(propName, propVal);
            }
        }

        // Cycle console wrapper classes
        const consoleEl = document.getElementById('main-workstation-console');
        if (consoleEl) {
            MATERIAL_PRESETS.forEach(p => {
                if (p.consoleClass) consoleEl.classList.remove(p.consoleClass);
            });
            consoleEl.classList.remove('blackglass-frame', 'glass-frame');
            if (preset.consoleClass) {
                consoleEl.classList.add(preset.consoleClass);
            }
        }

        // Synchronize settings preset cards
        document.querySelectorAll('.theme-preset-card[data-frame]').forEach(card => {
            card.classList.toggle('active-theme', card.getAttribute('data-frame') === preset.id);
        });

        // Sync globally shared state variables
        if (typeof window.activeFrameBorder !== 'undefined') {
            window.activeFrameBorder = preset.id;
        }
        window.currentBezelFrame = preset.id;

        if (typeof window.isSettingsModified !== 'undefined') {
            window.isSettingsModified = true;
        }

        // Re-affirm tactile button styles
        attachHardwareButtonTactileEffects();
    }

    // ----------------------------------------------------------------------
    // 5. DOM PRESET BUILDER & HOOKS
    // ----------------------------------------------------------------------
    function initMaterialPresets() {
        let container = document.getElementById('material-presets-container')
                     || document.getElementById('border-presets-container')
                     || document.querySelector('#viewport-appearance-control .theme-preset-grid:nth-of-type(2)')
                     || document.querySelector('#viewport-appearance-control .theme-preset-grid');

        if (!container) return;

        container.innerHTML = '';

        const activeId = (window.activeFrameBorder || window.currentBezelFrame || 'WOOD').toUpperCase();

        MATERIAL_PRESETS.forEach(preset => {
            const card = document.createElement('div');
            card.className = `theme-preset-card ${preset.cardClass || ''}`;
            card.setAttribute('data-frame', preset.id);
            card.style.cursor = 'pointer';
            card.innerHTML = `<span>${preset.label}</span>`;

            if (activeId === preset.id) {
                card.classList.add('active-theme');
            }

            card.addEventListener('click', (e) => {
                e.stopPropagation();
                applyMaterialPreset(preset);
            });

            container.appendChild(card);
        });

        attachHardwareButtonTactileEffects();
    }

    // ----------------------------------------------------------------------
    // 6. GLOBAL EXPOSURES & RUNTIME LIFECYCLE
    // ----------------------------------------------------------------------
    window.MATERIAL_PRESETS = MATERIAL_PRESETS;
    window.applyMaterialPreset = applyMaterialPreset;
    window.initMaterialPresets = initMaterialPresets;

    function boot() {
        injectDynamicFrameStyles();
        initMaterialPresets();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }

})(window, document);
