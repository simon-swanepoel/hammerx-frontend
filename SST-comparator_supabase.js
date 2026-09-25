// ==========================================
// SST-COMPARATOR UI & SHUTTER ENGINE
// File: SST-comparator_supabase.js
// ==========================================

// Global Viewport Scaler
function autofitViewportText() {
    const activePane = document.querySelector('.study-tab-pane.active');
    if (!activePane) return;

    const containerWidth = activePane.clientWidth;
    if (containerWidth > 1200) {
        activePane.style.fontSize = '0.9rem';
    } else if (containerWidth > 800) {
        activePane.style.fontSize = '0.8rem';
    } else {
        activePane.style.fontSize = '0.72rem';
    }
}

// Appearance & Theme Presets
function applyViewportAppearance() {
    if (typeof BOARD_THEMES === 'undefined' || !BOARD_THEMES[currentThemeKey]) return;
    const theme = BOARD_THEMES[currentThemeKey];

    const root = document.documentElement;
    root.style.setProperty('--board-bg', theme['--board-bg']);
    root.style.setProperty('--board-ink', theme['--board-ink']);
    root.style.setProperty('--header-text', theme['--header-text']);
    root.style.setProperty('--number-color', theme['number-color'] || theme['--number-color']);
    root.style.setProperty('--divider-color', theme['--divider-color']);
    root.style.setProperty('--grid-line-color', activeRuledLineColor);
    root.style.setProperty('--margin-line-color', activeMarginColor);

    const consoleEl = document.getElementById('main-workstation-console');
    const btnWood = document.getElementById('btn-border-wood');
    const btnTitanium = document.getElementById('btn-border-titanium');
    const btnBlackGlass = document.getElementById('btn-border-blackglass');

    if (consoleEl) {
        consoleEl.classList.remove('titanium-frame', 'blackglass-frame');
    }

    [btnWood, btnTitanium, btnBlackGlass].forEach(btn => {
        if (btn) btn.classList.remove('active-theme');
    });

    if (activeFrameBorder === 'BLACK_GLASS') {
        root.style.setProperty('--console-frame-bg', 'none');
        if (consoleEl) consoleEl.classList.add('blackglass-frame');
        if (btnBlackGlass) btnBlackGlass.classList.add('active-theme');
    } else if (activeFrameBorder === 'TITANIUM') {
        root.style.setProperty('--console-frame-bg', 'linear-gradient(135deg, #2c2d30 0%, #e2e4e9 25%, #8a8d97 50%, #b29c6d 75%, #111317 100%)');
        if (consoleEl) consoleEl.classList.add('titanium-frame');
        if (btnTitanium) btnTitanium.classList.add('active-theme');
    } else {
        root.style.setProperty('--console-frame-bg', "url('wood.png')");
        if (btnWood) btnWood.classList.add('active-theme');
    }

    document.querySelectorAll('.theme-preset-card[data-theme]').forEach(card => {
        card.classList.toggle('active-theme', card.getAttribute('data-theme') === currentThemeKey);
    });
}

function updateTextOptionButtonStates() {
    const rootStyle = getComputedStyle(document.documentElement);
    const weightVal = rootStyle.getPropertyValue(`--font-weight-${activeTextTarget}`).trim();
    const styleVal = rootStyle.getPropertyValue(`--font-style-${activeTextTarget}`).trim();
    const familyVal = rootStyle.getPropertyValue(`--font-family-${activeTextTarget}`).trim();

    const btnBold = document.getElementById('btn-text-bold');
    const btnItalic = document.getElementById('btn-text-italic');
    const selectFont = document.getElementById('select-token-font');

    if (btnBold) btnBold.classList.toggle('active-format', weightVal === 'bold' || weightVal === '700' || weightVal === '900');
    if (btnItalic) btnItalic.classList.toggle('active-format', styleVal === 'italic');
    if (selectFont) selectFont.value = familyVal || "'Fira Code', monospace";
}

// Global Dialog Modal Engine
function showGlobalModal({ title, body, buttons, isActionModal = false }) {
    const modal = document.getElementById('sst-global-modal');
    const titleEl = document.getElementById('global-modal-title');
    const bodyEl = document.getElementById('global-modal-body');
    const actionsEl = document.getElementById('global-modal-actions');

    if (!modal || !titleEl || !bodyEl || !actionsEl) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = body;
    actionsEl.innerHTML = '';

    if (isActionModal && buttons.length === 3) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = `modal-btn ${buttons[0].className || ''}`;
        deleteBtn.textContent = buttons[0].text;
        deleteBtn.onclick = () => { modal.style.display = 'none'; buttons[0].onClick(); };
        actionsEl.appendChild(deleteBtn);

        const rightGroup = document.createElement('div');
        rightGroup.className = 'modal-actions-right';

        for (let i = 1; i < buttons.length; i++) {
            const btn = document.createElement('button');
            btn.className = `modal-btn ${buttons[i].className || ''}`;
            btn.textContent = buttons[i].text;
            const bClick = buttons[i].onClick;
            btn.onclick = () => { modal.style.display = 'none'; if (bClick) bClick(); };
            rightGroup.appendChild(btn);
        }
        actionsEl.appendChild(rightGroup);
    } else {
        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.className = `modal-btn ${b.className || ''}`;
            btn.textContent = b.text;
            btn.onclick = () => {
                modal.style.display = 'none';
                if (b.onClick) b.onClick();
            };
            actionsEl.appendChild(btn);
        });
    }

    modal.style.display = 'flex';
}

// DOM Setup & UI Bindings
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. SYSTEM LANGUAGE SELECTOR ---
    const savedLang = localStorage.getItem('sst_selected_language') || 'en';
    const langSelect = document.getElementById('system-language-select');
    if (langSelect) {
        langSelect.value = savedLang;
        langSelect.addEventListener('change', (e) => {
            if (typeof applyLanguage === 'function') applyLanguage(e.target.value);
        });
    }
    if (typeof applyLanguage === 'function') applyLanguage(savedLang);

    // Initial Appearance Setup
    applyViewportAppearance();
    window.addEventListener('resize', autofitViewportText);

    // Unsaved Changes Prompt
    window.addEventListener('beforeunload', (e) => {
        if (typeof hasUnsavedChanges !== 'undefined' && hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes in your study project. Save before leaving?';
            return e.returnValue;
        }
    });

    // --- 2. WORKSTATION SHUTTER HEADER (AUTO COLLAPSE AFTER 2 SECONDS) ---
    const shutterHeader = document.getElementById("workstation-shutter-header");
    const workspaceCore = document.querySelector(".workspace-core");
    let shutterTimer = null;

    function collapseShutter() {
        if (shutterHeader && workspaceCore) {
            shutterHeader.classList.add("shutter-collapsed");
            workspaceCore.classList.add("workspace-expanded");
            if (typeof autofitViewportText === 'function') {
                setTimeout(autofitViewportText, 450);
            }
        }
    }

    function expandShutter() {
        if (shutterHeader && workspaceCore) {
            shutterHeader.classList.remove("shutter-collapsed");
            workspaceCore.classList.remove("workspace-expanded");
            if (typeof autofitViewportText === 'function') {
                setTimeout(autofitViewportText, 450);
            }
        }
    }

    if (shutterHeader) {
        // Expand on mouse enter
        shutterHeader.addEventListener("mouseenter", () => {
            clearTimeout(shutterTimer);
            expandShutter();
        });

        // 2-second collapse timer on mouse leave
        shutterHeader.addEventListener("mouseleave", () => {
            clearTimeout(shutterTimer);
            shutterTimer = setTimeout(collapseShutter, 2000);
        });

        // Click on collapsed bar restores it
        shutterHeader.addEventListener("click", () => {
            if (shutterHeader.classList.contains("shutter-collapsed")) {
                expandShutter();
            }
        });

        // Initial launch countdown: collapse after 2 seconds
        shutterTimer = setTimeout(collapseShutter, 2000);
    }

    // --- 3. WORKSTATION VIEW SWITCHING (COURSEWARE, SETTINGS, HAMMER) ---
    const btnStudy = document.getElementById('btn-nav-study');
    const btnGear  = document.getElementById('btn-nav-gear');
    const btnCopy  = document.getElementById('btn-nav-slate');

    const displayStudy    = document.getElementById('display-study-material');
    const displayCopy     = document.getElementById('display-copy-slate');
    const displaySettings = document.getElementById('display-settings');

    const allButtons = [btnStudy, btnGear, btnCopy];
    const allDisplays = [displayStudy, displayCopy, displaySettings];

    function switchView(activeDisplay, activeButton) {
        if (typeof releaseEditLock === 'function') releaseEditLock();
        allDisplays.forEach(disp => disp && disp.classList.remove('active'));
        allButtons.forEach(btn => btn && btn.classList.remove('active-toggle'));
        if (activeDisplay) activeDisplay.classList.add('active');
        if (activeButton) activeButton.classList.add('active-toggle');
        if (typeof updateActiveGroupsIndicator === 'function') updateActiveGroupsIndicator();
        autofitViewportText();
    }

    // Set initial view to study/courseware
    if (displayStudy && btnStudy) switchView(displayStudy, btnStudy);

    if (btnStudy) btnStudy.addEventListener('click', () => switchView(displayStudy, btnStudy));
    if (btnGear)  btnGear.addEventListener('click',  () => switchView(displaySettings, btnGear));
    if (btnCopy)  btnCopy.addEventListener('click',  () => switchView(displayCopy, btnCopy));

    // --- 4. ACCOUNT SETTINGS MODAL ---
    const btnOpenAccountSettings = document.getElementById('btn-open-account-settings');
    const accountModal = document.getElementById('account-settings-modal');
    const btnCloseAccountSettings = document.getElementById('btn-close-account-settings');

    if (btnOpenAccountSettings && accountModal) {
        btnOpenAccountSettings.addEventListener('click', () => {
            accountModal.style.display = 'flex';
        });
    }

    if (btnCloseAccountSettings && accountModal) {
        btnCloseAccountSettings.addEventListener('click', () => {
            accountModal.style.display = 'none';
        });
    }

    if (accountModal) {
        accountModal.addEventListener('click', (e) => {
            if (e.target === accountModal) {
                accountModal.style.display = 'none';
            }
        });
    }

    // --- 5. SETTINGS PANEL INTERFACES ---
    const displayGroupSize = document.getElementById('group-size-display');
    const editContainer = document.getElementById('group-size-edit-container');
    const inputGroupSize = document.getElementById('input-group-size');
    const btnSaveGroupSize = document.getElementById('btn-save-group-size');

    const groupBreaksControl = document.getElementById('group-breaks-control');
    const viewportAppearanceControl = document.getElementById('viewport-appearance-control');
    const colorsControl = document.getElementById('colors-control');
    const textControl = document.getElementById('text-control');

    if (displayGroupSize && editContainer && inputGroupSize && btnSaveGroupSize) {
        displayGroupSize.addEventListener('click', () => {
            inputGroupSize.value = GROUP_SIZE;
            editContainer.style.display = 'inline-flex';
            inputGroupSize.focus();
        });

        btnSaveGroupSize.addEventListener('click', () => {
            const val = parseInt(inputGroupSize.value, 10);
            if (!isNaN(val) && val >= 2 && val <= 50) {
                GROUP_SIZE = val;
                displayGroupSize.textContent = GROUP_SIZE;
                editContainer.style.display = 'none';

                if (typeof activeBuckets !== 'undefined' && activeBuckets && typeof renderGroupedText === 'function') {
                    for (const [binKey, content] of Object.entries(activeBuckets)) {
                        renderGroupedText(binKey, content);
                    }
                }
            }
        });
    }

    const settingsItems = document.querySelectorAll('.settings-list .settings-item');
    const subMenuTitle = document.getElementById('sub-menu-title');

    settingsItems.forEach(item => {
        item.addEventListener('click', () => {
            settingsItems.forEach(i => i.classList.remove('active-category'));
            item.classList.add('active-category');
            const categoryName = item.getAttribute('data-category');
            if (subMenuTitle) subMenuTitle.textContent = `[ ${categoryName} Options ]`;

            if (groupBreaksControl) groupBreaksControl.style.display = categoryName === 'GROUP BREAKS' ? 'block' : 'none';
            if (viewportAppearanceControl) viewportAppearanceControl.style.display = categoryName === 'VIEWPORT APPEARANCE' ? 'block' : 'none';
            if (colorsControl) colorsControl.style.display = categoryName === 'COLORS' ? 'block' : 'none';
            if (textControl) textControl.style.display = categoryName === 'TEXT' ? 'block' : 'none';

            if (categoryName === 'TEXT') updateTextOptionButtonStates();
        });
    });

    // Ruled Lines Palette
    const ruledDots = document.querySelectorAll('#palette-ruled-lines .palette-dot');
    ruledDots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            ruledDots.forEach(d => d.classList.remove('active-dot'));
            dot.classList.add('active-dot');
            activeRuledLineColor = dot.getAttribute('data-color');
            applyViewportAppearance();
        });
    });

    // Margin Palette
    const marginDots = document.querySelectorAll('#palette-margin .palette-dot');
    marginDots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            marginDots.forEach(d => d.classList.remove('active-dot'));
            dot.classList.add('active-dot');
            activeMarginColor = dot.getAttribute('data-color');
            applyViewportAppearance();
        });
    });

    // 18 Essential Swatches & Direct Hex
    const swatchDots = document.querySelectorAll('.swatch-dot');
    const nativeColorWell = document.getElementById('native-color-picker');
    const inputHex = document.getElementById('input-hex-code');
    const btnApplyHex = document.getElementById('btn-apply-hex');

    swatchDots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            const colorHex = dot.getAttribute('data-color');
            document.documentElement.style.setProperty(activeColorTargetVar, colorHex);
            if (nativeColorWell) nativeColorWell.value = colorHex;
            if (inputHex) inputHex.value = colorHex.toUpperCase();
        });
    });

    if (nativeColorWell) {
        nativeColorWell.addEventListener('input', (e) => {
            const val = e.target.value;
            document.documentElement.style.setProperty(activeColorTargetVar, val);
            if (inputHex) inputHex.value = val.toUpperCase();
        });
    }

    if (btnApplyHex && inputHex) {
        btnApplyHex.addEventListener('click', () => {
            let val = inputHex.value.trim();
            if (!val.startsWith('#') && val.length === 6) val = '#' + val;
            if (/^#[0-9A-F]{6}$/i.test(val) \vert{}\vert{} /^#[0-9A-F]{3}$/i.test(val)) {
                document.documentElement.style.setProperty(activeColorTargetVar, val);
                if (nativeColorWell) nativeColorWell.value = val;
            } else {
                alert("Please enter a valid HEX color code (e.g., #00FF66 or #B29C6D)");
            }
        });
    }

    // Border Frame Selection
    const btnWood = document.getElementById('btn-border-wood');
    const btnTitanium = document.getElementById('btn-border-titanium');
    const btnBlackGlass = document.getElementById('btn-border-blackglass');

    if (btnWood) {
        btnWood.addEventListener('click', () => {
            activeFrameBorder = 'WOOD';
            applyViewportAppearance();
        });
    }

    if (btnTitanium) {
        btnTitanium.addEventListener('click', () => {
            activeFrameBorder = 'TITANIUM';
            applyViewportAppearance();
        });
    }

    if (btnBlackGlass) {
        btnBlackGlass.addEventListener('click', () => {
            activeFrameBorder = 'BLACK_GLASS';
            applyViewportAppearance();
        });
    }

    // Color Targets Matrix
    document.querySelectorAll('.color-target-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-target-btn').forEach(b => b.classList.remove('active-target'));
            btn.classList.add('active-target');
            activeColorTargetVar = btn.getAttribute('data-target');
        });
    });

    // Text Targets Matrix
    document.querySelectorAll('.text-target-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.text-target-btn').forEach(b => b.classList.remove('active-target'));
            btn.classList.add('active-target');
            activeTextTarget = btn.getAttribute('data-target');
            updateTextOptionButtonStates();
        });
    });

    // Text Styling Toggles
    const btnTextBold = document.getElementById('btn-text-bold');
    if (btnTextBold) {
        btnTextBold.addEventListener('click', () => {
            const root = document.documentElement;
            const currentWeight = getComputedStyle(root).getPropertyValue(`--font-weight-${activeTextTarget}`).trim();
            const newWeight = (currentWeight === 'bold' || currentWeight === '700' || currentWeight === '900') ? 'normal' : 'bold';
            root.style.setProperty(`--font-weight-${activeTextTarget}`, newWeight);
            updateTextOptionButtonStates();
        });
    }

    const btnTextItalic = document.getElementById('btn-text-italic');
    if (btnTextItalic) {
        btnTextItalic.addEventListener('click', () => {
            const root = document.documentElement;
            const currentStyle = getComputedStyle(root).getPropertyValue(`--font-style-${activeTextTarget}`).trim();
            const newStyle = (currentStyle === 'italic') ? 'normal' : 'italic';
            root.style.setProperty(`--font-style-${activeTextTarget}`, newStyle);
            updateTextOptionButtonStates();
        });
    }

    // 16-Font Dropdown Listener
    const selectTokenFont = document.getElementById('select-token-font');
    if (selectTokenFont) {
        selectTokenFont.addEventListener('change', (e) => {
            document.documentElement.style.setProperty(`--font-family-${activeTextTarget}`, e.target.value);
        });
    }

    // Board Theme Cards
    document.querySelectorAll('.theme-preset-card[data-theme]').forEach(card => {
        card.addEventListener('click', () => {
            currentThemeKey = card.getAttribute('data-theme');
            applyViewportAppearance();
        });
    });
});
