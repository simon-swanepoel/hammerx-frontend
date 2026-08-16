// CONFIGURATION & MEMORY STATE
let GROUP_SIZE = 10;
let isExpanded = false;
let loadedBuckets = null;

let currentThemeKey = 'BLACK_BOARD';
let activeRuledLineColor = 'transparent';
let activeMarginColor = 'transparent';
let activeFrameBorder = 'WOOD';
let activeColorTargetVar = '--color-part-tag';
let activeTextTarget = 'tag'; // 'tag', 'name', 'desc', 'where'

// HAMMER STATE
let slateMode = 'NOUN';
let checkEngineMode = 'VERBATUM';
let currentLineNum = 1;
let currentStep = 0;
let REQUIRED_PASS_PERCENTAGE = 80;

let draggedRowElement = null;
let activeEditingRow = null;

const BOARD_THEMES = {
    'BLACK_BOARD': {
        '--board-bg': '#0d0f12',
        '--board-ink': '#f0f0f0',
        '--header-text': '#ffffff',
        '--number-color': '#606b7a',
        '--divider-color': 'rgba(255, 255, 255, 0.25)'
    },
    'GREEN_BOARD': {
        '--board-bg': '#12261a',
        '--board-ink': '#f0f7f2',
        '--header-text': '#ffffff',
        '--number-color': '#5a8067',
        '--divider-color': 'rgba(255, 255, 255, 0.25)'
    },
    'RED_BOARD': {
        '--board-bg': '#2b0e14',
        '--board-ink': '#f7f0f1',
        '--header-text': '#ffffff',
        '--number-color': '#8c525d',
        '--divider-color': 'rgba(255, 255, 255, 0.25)'
    },
    'WHITEBOARD': {
        '--board-bg': '#f8f9fa',
        '--board-ink': '#111827',
        '--header-text': '#0b2545',
        '--number-color': '#6b7280',
        '--divider-color': 'rgba(0, 0, 0, 0.2)'
    },
    'PAPER': {
        '--board-bg': '#f5eedc',
        '--board-ink': '#1a1d20',
        '--header-text': '#2d2319',
        '--number-color': '#8c7d6b',
        '--divider-color': 'rgba(0, 0, 0, 0.15)'
    }
};

function applyViewportAppearance() {
    const theme = BOARD_THEMES[currentThemeKey];
    if (!theme) return;

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

function parseLineToTokens(rawText) {
    let tag = '', name = '', desc = '', where = '';
    
    const tagMatch = rawText.match(/^(\[[^\]]+\])\s*/);
    if (tagMatch) {
        tag = tagMatch[1];
        rawText = rawText.replace(tagMatch[0], '');
    }

    const parts = rawText.split('|').map(p => p.trim());
    if (parts.length >= 3) {
        name = parts[0];
        desc = parts[1];
        where = parts.slice(2).join(' | ');
    } else if (parts.length === 2) {
        name = parts[0];
        desc = parts[1];
    } else {
        name = parts[0] || '';
    }

    let tokenHtml = '';
    if (tag) tokenHtml += `<span class="line-part-tag" data-field="tag">${tag}</span> `;
    tokenHtml += `<span class="line-part-name" data-field="name" contenteditable="true" spellcheck="false">${name}</span>`;
    tokenHtml += ` <span style="color: var(--number-color);">|</span> <span class="line-part-desc" data-field="desc" contenteditable="true" spellcheck="false">${desc}</span>`;
    tokenHtml += ` <span style="color: var(--number-color);">|</span> <span class="line-part-where" data-field="where" contenteditable="true" spellcheck="false">${where}</span>`;

    return tokenHtml;
}

function generate10x10ColorGrid() {
    const container = document.getElementById('color-matrix-container');
    if (!container) return;
    container.innerHTML = '';
    const hues = [null, 0, 30, 50, 90, 140, 180, 210, 270, 320];

    for (let row = 0; row < 10; row++) {
        const lightness = 15 + row * 7;
        for (let col = 0; col < 10; col++) {
            const dot = document.createElement('div');
            dot.className = 'color-dot';
            let colorHex = col === 0 ? `hsl(0, 0%, ${Math.min(Math.round(row * 28.3), 100)}%)` : `hsl(${hues[col]}, 85%, ${lightness}%)`;
            dot.style.backgroundColor = colorHex;
            dot.addEventListener('click', () => {
                document.documentElement.style.setProperty(activeColorTargetVar, colorHex);
            });
            container.appendChild(dot);
        }
    }
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
    if (selectFont) selectFont.value = familyVal || 'monospace';
}

function getActiveTabSchemaRequirement() {
    const activePane = document.querySelector('.study-tab-pane.active');
    if (!activePane || activePane.id === '00_SUMMARY') return { requiresDesc: false, requiresWhere: false, schemaName: 'FREE-FORM' };

    const sampleRow = activePane.querySelector('.line-row');
    if (!sampleRow) return { requiresDesc: true, requiresWhere: true, schemaName: 'NOUN + DESCRIPTION + WHERE' };

    const hasDesc = sampleRow.querySelector('[data-field="desc"]') !== null;
    const hasWhere = sampleRow.querySelector('[data-field="where"]') !== null;

    if (hasDesc && hasWhere) {
        return { requiresDesc: true, requiresWhere: true, schemaName: 'NOUN + DESCRIPTION + WHERE' };
    } else if (hasDesc) {
        return { requiresDesc: true, requiresWhere: false, schemaName: 'NOUN + DESCRIPTION' };
    }
    return { requiresDesc: false, requiresWhere: false, schemaName: 'NOUN ONLY' };
}

function setEditLock(row) {
    activeEditingRow = row;
    document.body.classList.add('is-editing-locked');
}

function releaseEditLock() {
    activeEditingRow = null;
    document.body.classList.remove('is-editing-locked');
    autoSaveMemory();
}

function checkRowCompleteness(row) {
    const schema = getActiveTabSchemaRequirement();
    const nameEl = row.querySelector('[data-field="name"]');
    const descEl = row.querySelector('[data-field="desc"]');
    const whereEl = row.querySelector('[data-field="where"]');

    const nameVal = nameEl ? nameEl.textContent.trim() : '';
    const descVal = descEl ? descEl.textContent.trim() : '';
    const whereVal = whereEl ? whereEl.textContent.trim() : '';

    const isDescMissing = schema.requiresDesc && (!descVal || descVal === 'Description');
    const isWhereMissing = schema.requiresWhere && (!whereVal || whereVal === 'Location' || whereVal === 'Context');

    const missing = [];
    if (!nameVal || nameVal === 'New Term') missing.push("NOUN");
    if (isDescMissing) missing.push("DESCRIPTION");
    if (isWhereMissing) missing.push("WHERE / CONTEXT");

    return missing;
}

function createStudyLineRowElement(lineNum, rawText) {
    const paddedNum = String(lineNum).padStart(2, '0');
    const row = document.createElement('div');
    row.className = 'line-row';
    row.setAttribute('draggable', 'true');

    row.innerHTML = `<input type="checkbox" class="line-select-dot" title="Select line" /><span class="line-number">${paddedNum}.</span><span class="line-text">${parseLineToTokens(rawText)}</span>`;

    attachRowDragEvents(row);
    attachRowKeyEvents(row);
    return row;
}

function attachRowDragEvents(row) {
    row.addEventListener('dragstart', (e) => {
        draggedRowElement = row;
        row.classList.add('is-dragging');
        e.dataTransfer.effectAllowed = 'move';
    });

    row.addEventListener('dragend', () => {
        if (draggedRowElement) {
            draggedRowElement.classList.remove('is-dragging');
            draggedRowElement = null;
        }
        document.querySelectorAll('.line-row').forEach(r => {
            r.classList.remove('drag-over-top', 'drag-over-bottom');
        });
        renumberAllLinesInActivePane();
        autoSaveMemory();
    });

    row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        const rect = row.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
            row.classList.add('drag-over-top');
            row.classList.remove('drag-over-bottom');
        } else {
            row.classList.add('drag-over-bottom');
            row.classList.remove('drag-over-top');
        }
    });

    row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over-top', 'drag-over-bottom');
    });

    row.addEventListener('drop', (e) => {
        e.preventDefault();
        if (!draggedRowElement || draggedRowElement === row) return;

        const rect = row.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
            row.parentNode.insertBefore(draggedRowElement, row);
        } else {
            row.parentNode.insertBefore(draggedRowElement, row.nextSibling);
        }
        row.classList.remove('drag-over-top', 'drag-over-bottom');
        renumberAllLinesInActivePane();
        autoSaveMemory();
    });
}

function attachRowKeyEvents(row) {
    let lastEnterTime = 0;

    row.querySelectorAll('[contenteditable="true"]').forEach(editableSpan => {
        editableSpan.addEventListener('input', () => {
            const missing = checkRowCompleteness(row);
            if (missing.length > 0) {
                setEditLock(row);
            } else if (activeEditingRow === row) {
                releaseEditLock();
            }
        });

        editableSpan.addEventListener('blur', () => {
            const missing = checkRowCompleteness(row);
            if (missing.length === 0 && activeEditingRow === row) {
                releaseEditLock();
            }
        });
    });

    row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();

            const currentTime = new Date().getTime();
            const isDoubleEnter = (currentTime - lastEnterTime) < 450;
            lastEnterTime = currentTime;

            const targetEl = e.target.closest('[data-field]');
            const targetField = targetEl ? targetEl.getAttribute('data-field') : 'where';

            const descEl = row.querySelector('[data-field="desc"]');
            const whereEl = row.querySelector('[data-field="where"]');
            const schema = getActiveTabSchemaRequirement();
            const missing = checkRowCompleteness(row);

            if (isDoubleEnter && missing.length > 0) {
                promptFieldRequirementsModal(row, missing, () => autoFillLineWithAi(row));
                return;
            }

            if (targetField === 'name') {
                if (descEl) {
                    descEl.focus();
                } else if (!schema.requiresDesc) {
                    finishAndInsertNext(row);
                } else {
                    promptFieldRequirementsModal(row, ["DESCRIPTION", "WHERE"], () => autoFillLineWithAi(row));
                }
            } else if (targetField === 'desc') {
                if (whereEl) {
                    whereEl.focus();
                } else if (!schema.requiresWhere) {
                    finishAndInsertNext(row);
                } else {
                    promptFieldRequirementsModal(row, ["WHERE / CONTEXT"], () => autoFillLineWithAi(row));
                }
            } else if (targetField === 'where') {
                if (missing.length > 0) {
                    promptFieldRequirementsModal(row, missing, () => autoFillLineWithAi(row));
                    return;
                }
                finishAndInsertNext(row);
            }
        }
    });
}

function finishAndInsertNext(row) {
    releaseEditLock();
    insertNewStudyLineAfter(row);
}

function promptFieldRequirementsModal(row, missingFields, aiCallback) {
    const nameText = row.querySelector('[data-field="name"]')?.textContent.trim() || 'New Item';
    const schema = getActiveTabSchemaRequirement();

    showGlobalModal({
        title: "REQUIRED FIELDS MISSING",
        body: `This study tab requires <b>${schema.schemaName}</b>.<br><br>Please complete the <b>${missingFields.join(' and ')}</b> for: "<i>${nameText}</i>".<br><br>Click <b>OK</b> to complete it manually, or click <b>ASK AI</b> to auto-populate the details.`,
        isActionModal: true,
        buttons: [
            {
                text: "DELETE INPUT",
                className: "btn-modal-discard btn-modal-danger",
                onClick: () => {
                    row.remove();
                    renumberAllLinesInActivePane();
                    releaseEditLock();
                }
            },
            { 
                text: "OK",
                className: "btn-modal-discard",
                onClick: () => {
                    const descEl = row.querySelector('[data-field="desc"]');
                    const whereEl = row.querySelector('[data-field="where"]');
                    if (descEl && (!descEl.textContent.trim() || descEl.textContent.trim() === 'Description')) {
                        descEl.focus();
                        document.execCommand('selectAll', false, null);
                    } else if (whereEl) {
                        whereEl.focus();
                        document.execCommand('selectAll', false, null);
                    }
                }
            },
            { 
                text: "ASK AI",
                className: "btn-modal-ai",
                onClick: () => {
                    aiCallback();
                    releaseEditLock();
                }
            }
        ]
    });
}

function autoFillLineWithAi(row) {
    const nameText = row.querySelector('[data-field="name"]')?.textContent.trim() || "Term";
    const descEl = row.querySelector('[data-field="desc"]');
    const whereEl = row.querySelector('[data-field="where"]');

    if (descEl && (!descEl.textContent.trim() || descEl.textContent.trim() === 'Description')) {
        descEl.textContent = `[AI: Definition & mechanics for ${nameText}]`;
    }
    if (whereEl && (!whereEl.textContent.trim() || whereEl.textContent.trim() === 'Location' || whereEl.textContent.trim() === 'Context')) {
        whereEl.textContent = `[AI: Section context for ${nameText}]`;
    }

    autoSaveMemory();
}

function insertNewStudyLineAfter(targetRow) {
    const newRow = createStudyLineRowElement(0, "New Term | Description | Location");
    if (targetRow) {
        targetRow.parentNode.insertBefore(newRow, targetRow.nextSibling);
    } else {
        const activePane = document.querySelector('.study-tab-pane.active');
        if (activePane) {
            const firstGroup = activePane.querySelector('.group-lines');
            if (firstGroup) firstGroup.appendChild(newRow);
            else activePane.appendChild(newRow);
        }
    }
    
    renumberAllLinesInActivePane();
    updateActiveGroupsIndicator();
    setEditLock(newRow);

    const firstEditable = newRow.querySelector('[data-field="name"]');
    if (firstEditable) {
        firstEditable.focus();
        document.execCommand('selectAll', false, null);
    }
}

function renumberAllLinesInActivePane() {
    const activePane = document.querySelector('.study-tab-pane.active');
    if (!activePane) return;

    let counter = 1;
    activePane.querySelectorAll('.line-row').forEach(row => {
        const numSpan = row.querySelector('.line-number');
        if (numSpan) {
            numSpan.textContent = `${String(counter).padStart(2, '0')}.`;
            counter++;
        }
    });
}

function autoSaveMemory() {
    const activePane = document.querySelector('.study-tab-pane.active');
    if (!activePane) return;

    const updatedLines = [];
    activePane.querySelectorAll('.line-row').forEach(row => {
        const tag = row.querySelector('[data-field="tag"]')?.textContent.trim() || '';
        const name = row.querySelector('[data-field="name"]')?.textContent.trim() || '';
        const desc = row.querySelector('[data-field="desc"]')?.textContent.trim() || '';
        const where = row.querySelector('[data-field="where"]')?.textContent.trim() || '';

        let compiled = '';
        if (tag) compiled += `${tag} `;
        compiled += name;
        if (desc) compiled += ` | ${desc}`;
        if (where) compiled += ` | ${where}`;

        if (compiled.trim()) updatedLines.push(compiled.trim());
    });

    if (!loadedBuckets) loadedBuckets = {};
    loadedBuckets[activePane.id] = updatedLines;
}

function showGlobalModal({ title, body, buttons, isActionModal = false }) {
    const modal = document.getElementById('sst-global-modal');
    const titleEl = document.getElementById('global-modal-title');
    const bodyEl = document.getElementById('global-modal-body');
    const actionsEl = document.getElementById('global-modal-actions');

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

function getOpenGroupIndices() {
    const activePane = document.querySelector('.study-tab-pane.active');
    if (!activePane) return [];

    const wrapper = activePane.querySelector('.grouped-wrapper');
    if (!wrapper) return ['1'];

    if (wrapper.classList.contains('expand-all')) {
        const total = wrapper.querySelectorAll('.line-group').length;
        const all = [];
        for (let i = 1; i <= total; i++) all.push(String(i));
        return all;
    }

    const openIndices = [];
    wrapper.querySelectorAll('.line-group').forEach(g => {
        if (g.classList.contains('open')) {
            const match = g.id.match(/-(\d+)$/);
            if (match) openIndices.push(match[1]);
        }
    });

    return openIndices;
}

function updateActiveGroupsIndicator() {
    const display = document.getElementById('slate-active-groups-display');
    if (!display) return;

    const open = getOpenGroupIndices();
    display.textContent = open.length > 0 ? `[ ${open.join(', ')} ]` : '[ NONE ]';
}

function renderGroupedText(paneId, rawText) {
    const container = document.getElementById(paneId);
    if (!container) return;

    let lines = [];
    if (Array.isArray(rawText)) {
        lines = rawText.map(l => String(l).replace(/\r/g, '').trim()).filter(l => l !== '');
    } else if (typeof rawText === 'string') {
        lines = rawText.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(l => l !== '');
    } else if (rawText !== null && rawText !== undefined) {
        lines = [String(rawText)];
    }

    if (lines.length === 0) {
        container.innerHTML = '<div style="color: var(--number-color); padding: 10px; font-family: monospace;">[ EMPTY PAYLOAD OR UNMATCHED KEY ]</div>';
        return;
    }

    if (paneId === '00_SUMMARY') {
        let html = '<div style="display:flex; flex-direction:column; gap:4px; padding:4px;">';
        lines.forEach(l => {
            html += `<div class="line-row" style="border-bottom:1px solid var(--grid-line-color);"><span class="line-text" style="color:var(--board-ink);">${l}</span></div>`;
        });
        html += '</div>';
        container.innerHTML = html;
        return;
    }

    const openMemory = new Set();
    container.querySelectorAll('.line-group.open').forEach(g => {
        const match = g.id.match(/-(\d+)$/);
        if (match) openMemory.add(match[1]);
    });

    const wrapper = document.createElement('div');
    wrapper.className = `grouped-wrapper ${isExpanded ? 'expand-all' : ''}`;
    wrapper.id = `wrapper-${paneId}`;

    let globalLineCount = 1;
    let groupIndex = 1;

    for (let i = 0; i < lines.length; i += GROUP_SIZE) {
        const chunk = lines.slice(i, i + GROUP_SIZE);
        const startNum = globalLineCount;
        const endNum = globalLineCount + chunk.length - 1;

        const groupEl = document.createElement('div');
        groupEl.className = 'line-group line-group-divider';
        groupEl.id = `group-${paneId}-${groupIndex}`;

        if (openMemory.has(String(groupIndex))) {
            groupEl.classList.add('open');
        }

        const headerEl = document.createElement('div');
        headerEl.className = 'group-header';
        headerEl.innerHTML = `GROUP ${groupIndex} <span class="group-range">(${startNum}-${endNum})</span>`;
        const currentGIdx = groupIndex;
        headerEl.onclick = () => toggleGroup(paneId, currentGIdx);

        const linesHolder = document.createElement('div');
        linesHolder.className = 'group-lines';

        chunk.forEach(lineText => {
            const row = createStudyLineRowElement(globalLineCount, lineText);
            linesHolder.appendChild(row);
            globalLineCount++;
        });

        groupEl.appendChild(headerEl);
        groupEl.appendChild(linesHolder);
        wrapper.appendChild(groupEl);
        groupIndex++;
    }

    container.innerHTML = '';
    container.appendChild(wrapper);
    updateActiveGroupsIndicator();
}

function toggleGroup(paneId, groupIndex) {
    const groupEl = document.getElementById(`group-${paneId}-${groupIndex}`);
    if (groupEl) {
        groupEl.classList.toggle('open');
        updateActiveGroupsIndicator();
    }
}

function toggleExpandAll() {
    isExpanded = !isExpanded;
    const expandBtn = document.getElementById('btn-expand-toggle');
    if (expandBtn) expandBtn.textContent = isExpanded ? 'COLLAPSE' : 'EXPAND/COLLAPSE';

    document.querySelectorAll('.grouped-wrapper').forEach(wrapper => {
        if (isExpanded) {
            wrapper.classList.add('expand-all');
        } else {
            wrapper.classList.remove('expand-all');
            wrapper.querySelectorAll('.line-group').forEach(g => g.classList.remove('open'));
        }
    });

    updateActiveGroupsIndicator();
}

function switchStudyTab(evt, targetBin) {
    releaseEditLock();
    document.querySelectorAll('.study-tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.study-tab-button').forEach(btn => btn.classList.remove('active-study-tab'));

    const activePane = document.getElementById(targetBin);
    if (activePane) {
        activePane.classList.add('active');
        if (!activePane.querySelector('.line-row') && activePane.id !== '00_SUMMARY') {
            activePane.innerHTML = '';
            insertNewStudyLineAfter(null);
        }
    }
    if (evt && evt.currentTarget) evt.currentTarget.classList.add('active-study-tab');
    updateActiveGroupsIndicator();
}

// HAMMER LOGIC
function initCopySlate() {
    const canvas = document.getElementById('copy-slate-canvas');
    if (!canvas) return;
    canvas.innerHTML = '';
    currentLineNum = 1;
    currentStep = 0;
    createNewSlateLine();
    updateActiveGroupsIndicator();
}

function createNewSlateLine() {
    const canvas = document.getElementById('copy-slate-canvas');
    if (!canvas) return;
    const paddedNum = String(currentLineNum).padStart(2, '0');
    
    const lineRow = document.createElement('div');
    lineRow.className = 'line-row';
    lineRow.id = `slate-line-${currentLineNum}`;
    
    lineRow.innerHTML = `<span class="line-number">${paddedNum}.</span><span class="line-text" id="slate-text-${currentLineNum}"><span class="line-part-name active-segment" contenteditable="true" spellcheck="false" id="seg-${currentLineNum}-0"></span></span>`;

    const feedbackRow = document.createElement('div');
    feedbackRow.className = 'line-feedback-row';
    feedbackRow.id = `slate-feedback-row-${currentLineNum}`;
    feedbackRow.innerHTML = `<span class="line-feedback-spacer"></span><span class="line-feedback-text" id="slate-feedback-${currentLineNum}"></span>`;

    canvas.appendChild(lineRow);
    canvas.appendChild(feedbackRow);

    const firstSeg = document.getElementById(`seg-${currentLineNum}-0`);
    if (firstSeg) {
        attachSlateKeyListeners(firstSeg);
    }
}

function advanceSlateStep() {
    const activeSeg = document.querySelector('.active-segment');
    if (activeSeg) activeSeg.classList.remove('active-segment');

    const textContainer = document.getElementById(`slate-text-${currentLineNum}`);
    if (!textContainer) return;

    if (slateMode === 'NOUN') {
        currentLineNum++;
        currentStep = 0;
        createNewSlateLine();
    } else if (slateMode === 'NOUN_DESC') {
        if (currentStep === 0) {
            textContainer.insertAdjacentHTML('beforeend', ` <span style="color: var(--number-color);">|</span> <span class="line-part-desc active-segment" contenteditable="true" spellcheck="false" id="seg-${currentLineNum}-1"></span>`);
            currentStep = 1;
            const nextSeg = document.getElementById(`seg-${currentLineNum}-1`);
            if (nextSeg) {
                nextSeg.focus();
                attachSlateKeyListeners(nextSeg);
            }
        } else {
            currentLineNum++;
            currentStep = 0;
            createNewSlateLine();
        }
    } else if (slateMode === 'NOUN_DESC_WHERE') {
        if (currentStep === 0) {
            textContainer.insertAdjacentHTML('beforeend', ` <span style="color: var(--number-color);">|</span> <span class="line-part-desc active-segment" contenteditable="true" spellcheck="false" id="seg-${currentLineNum}-1"></span>`);
            currentStep = 1;
            const nextSeg = document.getElementById(`seg-${currentLineNum}-1`);
            if (nextSeg) {
                nextSeg.focus();
                attachSlateKeyListeners(nextSeg);
            }
        } else if (currentStep === 1) {
            textContainer.insertAdjacentHTML('beforeend', ` <span style="color: var(--number-color);">|</span> <span class="line-part-where active-segment" contenteditable="true" spellcheck="false" id="seg-${currentLineNum}-2"></span>`);
            currentStep = 2;
            const nextSeg = document.getElementById(`seg-${currentLineNum}-2`);
            if (nextSeg) {
                nextSeg.focus();
                attachSlateKeyListeners(nextSeg);
            }
        } else {
            currentLineNum++;
            currentStep = 0;
            createNewSlateLine();
        }
    }
}

function attachSlateKeyListeners(element) {
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            advanceSlateStep();
        }
    });
}

function getCopySlateLines() {
    const canvas = document.getElementById('copy-slate-canvas');
    if (!canvas) return [];
    const rows = canvas.querySelectorAll('.line-row');
    const extractedLines = [];

    rows.forEach(row => {
        const textSpan = row.querySelector('.line-text');
        if (textSpan) {
            const segments = Array.from(textSpan.querySelectorAll('span'))
                .map(s => s.textContent.trim())
                .filter(t => t !== '' && t !== '|' && t !== '...');
            if (segments.length > 0) extractedLines.push(segments.join(' | '));
        }
    });
    return extractedLines;
}

function getActiveOpenStudyMaterialLines() {
    const activePane = document.querySelector('.study-tab-pane.active');
    if (!activePane) return [];

    const wrapper = activePane.querySelector('.grouped-wrapper');
    const extractedLines = [];
    let targetRows = [];

    if (!wrapper) {
        targetRows = Array.from(activePane.querySelectorAll('.line-row'));
    } else if (wrapper.classList.contains('expand-all')) {
        targetRows = Array.from(wrapper.querySelectorAll('.line-row'));
    } else {
        const openGroups = wrapper.querySelectorAll('.line-group.open');
        openGroups.forEach(g => {
            targetRows.push(...Array.from(g.querySelectorAll('.line-row')));
        });
    }

    targetRows.forEach(row => {
        if (row.classList.contains('is-hidden-row')) return;
        const textSpan = row.querySelector('.line-text');
        if (textSpan) {
            let rawText = textSpan.textContent.trim().replace(/^\[[^\]]+\]\s*/, '').trim();
            if (rawText) {
                const parts = rawText.split('|').map(p => p.trim());
                let modeFormattedLine = '';
                if (slateMode === 'NOUN') modeFormattedLine = parts[0] || '';
                else if (slateMode === 'NOUN_DESC') modeFormattedLine = parts.slice(0, 2).join(' | ');
                else modeFormattedLine = parts.join(' | ');
                extractedLines.push(modeFormattedLine);
            }
        }
    });
    return extractedLines;
}

function runVerbatimCheck() {
    const slateLines = getCopySlateLines();
    const openStudyLines = getActiveOpenStudyMaterialLines();
    const scoreDisplay = document.getElementById('slate-score-display');

    if (openStudyLines.length === 0) {
        alert("[ VERBATUM COMPARATOR ] No groups are currently open in Courseware. Click a group header to expand it.");
        return;
    }

    if (slateLines.length === 0) {
        alert("[ VERBATUM COMPARATOR ] HAMMER is empty. Please enter text on the slate first.");
        return;
    }

    let exactMatches = 0;
    const totalLinesInOpenGroups = openStudyLines.length;
    const linesToEvaluate = slateLines.length;

    for (let i = 0; i < linesToEvaluate; i++) {
        const lineIdx = i + 1;
        const typed = slateLines[i];
        const target = openStudyLines[i] || "";
        const isMatch = (typed.trim().toLowerCase() === target.trim().toLowerCase());

        const feedbackSpan = document.getElementById(`slate-feedback-${lineIdx}`);
        if (feedbackSpan) {
            if (isMatch) {
                exactMatches++;
                feedbackSpan.className = "line-feedback-text feedback-correct";
                feedbackSpan.textContent = `✓ MATCH (100% Accuracy)`;
            } else {
                feedbackSpan.className = "line-feedback-text feedback-error";
                feedbackSpan.textContent = `✗ MISMATCH | Target: "${target}"`;
            }
        }
    }

    const accuracy = Math.round((exactMatches / totalLinesInOpenGroups) * 100);

    if (scoreDisplay) {
        scoreDisplay.textContent = `[ ${accuracy}% ]`;
        scoreDisplay.className = accuracy >= REQUIRED_PASS_PERCENTAGE ? "copy-slate-score-display score-pass" : "copy-slate-score-display score-fail";
    }
}

function compileTestResultRecord() {
    const slateLines = getCopySlateLines();
    const studyLines = getActiveOpenStudyMaterialLines();
    const activeTabBtn = document.querySelector('.study-tab-button.active-study-tab');
    const activeTab = activeTabBtn ? activeTabBtn.textContent.trim() : "UNKNOWN";

    let passedCount = 0;
    const records = [];
    const totalStudyLines = studyLines.length;

    for (let i = 0; i < slateLines.length; i++) {
        const typed = slateLines[i];
        const target = studyLines[i] || "";
        const isMatch = (typed.trim().toLowerCase() === target.trim().toLowerCase());
        if (isMatch) passedCount++;

        records.push({
            line_number: i + 1,
            user_input: typed,
            correct_target: target,
            is_correct: isMatch
        });
    }

    const percentage = totalStudyLines > 0 ? Math.round((passedCount / totalStudyLines) * 100) : 0;
    const timestamp = new Date().toISOString();
    const dateFormatted = timestamp.replace(/[:.-]/g, '').slice(0, 15);

    return {
        test_id: `RUN-${dateFormatted}`,
        timestamp: timestamp,
        active_tab: activeTab,
        open_groups: getOpenGroupIndices(),
        mode: slateMode,
        engine: checkEngineMode,
        score_percentage: percentage,
        total_open_lines: totalStudyLines,
        passed_count: passedCount,
        records: records
    };
}

function performSlateClear() {
    initCopySlate();
    const scoreDisplay = document.getElementById('slate-score-display');
    if (scoreDisplay) {
        scoreDisplay.textContent = '[ --- ]';
        scoreDisplay.className = 'copy-slate-score-display';
    }
}

// STORAGE CONFIGURATION FOR ACCOUNT SETTINGS
const SST_SETTINGS_STORAGE_KEY = "sst_user_account_settings";

function loadAccountSettings() {
    const saved = localStorage.getItem(SST_SETTINGS_STORAGE_KEY);
    if (!saved) return { mode: 'light' };
    try {
        return JSON.parse(saved);
    } catch(e) {
        return { mode: 'light' };
    }
}

function saveAccountSettings(settings) {
    localStorage.setItem(SST_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}

function applyAccountShutterMode(isDark) {
    const labelLight = document.getElementById('label-mode-light');
    const labelDark = document.getElementById('label-mode-dark');

    if (isDark) {
        document.body.classList.add('shutter-dark-mode');
        if (labelDark) labelDark.classList.add('active-mode');
        if (labelLight) labelLight.classList.remove('active-mode');
    } else {
        document.body.classList.remove('shutter-dark-mode');
        if (labelLight) labelLight.classList.add('active-mode');
        if (labelDark) labelDark.classList.remove('active-mode');
    }
}

// DOM INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {

    applyViewportAppearance();
    generate10x10ColorGrid();
    initCopySlate();

    // Initialize Shutter Light / Dark Mode from Storage
    const accountSettings = loadAccountSettings();
    const shutterToggle = document.getElementById('shutter-mode-toggle');
    if (shutterToggle) {
        shutterToggle.checked = accountSettings.mode === 'dark';
    }
    applyAccountShutterMode(accountSettings.mode === 'dark');

    // ACCOUNT SETTINGS MODAL CONTROLS
    const btnOpenAccountSettings = document.getElementById('btn-open-account-settings');
    const accountModal = document.getElementById('account-settings-modal');
    const btnCloseAccountSettings = document.getElementById('btn-close-account-settings');

    if (btnOpenAccountSettings && accountModal) {
        btnOpenAccountSettings.addEventListener('click', () => {
            const current = loadAccountSettings();
            if (shutterToggle) shutterToggle.checked = current.mode === 'dark';
            applyAccountShutterMode(current.mode === 'dark');
            accountModal.style.display = 'flex';
        });
    }

    if (shutterToggle) {
        shutterToggle.addEventListener('change', () => {
            applyAccountShutterMode(shutterToggle.checked);
        });
    }

    if (btnCloseAccountSettings && accountModal) {
        btnCloseAccountSettings.addEventListener('click', () => {
            const isDark = shutterToggle ? shutterToggle.checked : false;
            saveAccountSettings({ mode: isDark ? 'dark' : 'light' });
            applyAccountShutterMode(isDark);
            accountModal.style.display = 'none';
        });
    }

    if (accountModal) {
        accountModal.addEventListener('click', (e) => {
            if (e.target === accountModal) {
                const current = loadAccountSettings();
                applyAccountShutterMode(current.mode === 'dark');
                accountModal.style.display = 'none';
            }
        });
    }

    const btnStudy = document.getElementById('btn-nav-study') || document.querySelectorAll('.viewport-button-corner')[0];
    const btnGear  = document.getElementById('btn-nav-gear') || document.querySelector('.viewport-button-center');
    const btnCopy  = document.getElementById('btn-nav-slate') || document.querySelectorAll('.viewport-button-corner')[1];

    const displayStudy    = document.getElementById('display-study-material');
    const displayCopy     = document.getElementById('display-copy-slate');
    const displaySettings = document.getElementById('display-settings');

    const allButtons = [btnStudy, btnGear, btnCopy];
    const allDisplays = [displayStudy, displayCopy, displaySettings];

    function switchView(activeDisplay, activeButton) {
        releaseEditLock();
        allDisplays.forEach(disp => disp.classList.remove('active'));
        allButtons.forEach(btn => btn.classList.remove('active-toggle'));
        activeDisplay.classList.add('active');
        activeButton.classList.add('active-toggle');
        updateActiveGroupsIndicator();
    }

    switchView(displayStudy, btnStudy);

    btnStudy.addEventListener('click', () => switchView(displayStudy, btnStudy));
    btnGear.addEventListener('click', () => switchView(displaySettings, btnGear));
    btnCopy.addEventListener('click', () => switchView(displayCopy, btnCopy));

    // FOOTER ACTIONS
    const btnHide = document.getElementById('btn-study-hide');
    if (btnHide) {
        btnHide.addEventListener('click', () => {
            const activePane = document.querySelector('.study-tab-pane.active');
            if (!activePane) return;
            const checkedBoxes = activePane.querySelectorAll('.line-select-dot:checked');
            checkedBoxes.forEach(box => {
                const row = box.closest('.line-row');
                if (row) {
                    row.classList.add('is-hidden-row');
                    box.checked = false;
                }
            });
        });
    }

    const btnUnhide = document.getElementById('btn-study-unhide');
    if (btnUnhide) {
        btnUnhide.addEventListener('click', () => {
            const activePane = document.querySelector('.study-tab-pane.active');
            if (!activePane) return;
            activePane.querySelectorAll('.line-row.is-hidden-row').forEach(row => {
                row.classList.remove('is-hidden-row');
            });
        });
    }

    const btnDelete = document.getElementById('btn-study-delete');
    if (btnDelete) {
        btnDelete.addEventListener('click', () => {
            const activePane = document.querySelector('.study-tab-pane.active');
            if (!activePane) return;
            const checkedBoxes = activePane.querySelectorAll('.line-select-dot:checked');
            if (checkedBoxes.length === 0) {
                alert("Please select at least one line dot to delete.");
                return;
            }

            showGlobalModal({
                title: "PERMANENT DELETE WARNING",
                body: `Are you sure you want to permanently delete **${checkedBoxes.length}** line(s)? The remaining lines will regroup automatically.`,
                buttons: [
                    { text: "CANCEL", className: "btn-modal-discard" },
                    {
                        text: "YES, DELETE",
                        className: "btn-modal-danger",
                        onClick: () => {
                            checkedBoxes.forEach(box => {
                                const row = box.closest('.line-row');
                                if (row) row.remove();
                            });
                            renumberAllLinesInActivePane();
                            autoSaveMemory();
                        }
                    }
                ]
            });
        });
    }

    // FILE LOADING
    const btnLoadFile = document.getElementById('btn-load-file');
    const jsonFileInput = document.getElementById('json-file-input');

    if (btnLoadFile && jsonFileInput) {
        btnLoadFile.addEventListener('click', () => jsonFileInput.click());

        jsonFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    const buckets = {
                        '00_SUMMARY': [], '01_WHAT': [], '02_PURPOSE': [],
                        '03_RULE': [], '04_FORMULA': [], '05_ID': [],
                        '06_RELATED': [], '07_OBJECTIVE': [], '08_SOURCE': [], '09_WHY': []
                    };

                    const tagMap = {
                        '[WHAT]': '01_WHAT', '[PURPOSE]': '02_PURPOSE', '[RULE]': '03_RULE',
                        '[FORMULA]': '04_FORMULA', '[ID]': '05_ID', '[RELATED]': '06_RELATED',
                        '[OBJECTIVE]': '07_OBJECTIVE', '[SOURCE]': '08_SOURCE', '[WHY]': '09_WHY'
                    };

                    if (data.feedback_log) {
                        if (data.metadata) {
                            buckets['00_SUMMARY'].push(`[SOURCE FILE] ${data.metadata.source_file || 'N/A'}`);
                            buckets['00_SUMMARY'].push(`[PAGES MILLED] ${data.metadata.pages_milled || 'N/A'}`);
                            buckets['00_SUMMARY'].push(`[TIMESTAMP] ${data.metadata.timestamp || 'N/A'}`);
                            buckets['00_SUMMARY'].push(`[ENGINE] ${data.metadata.engine_version || 'N/A'}`);
                            buckets['00_SUMMARY'].push('----------------------------------------');
                        }
                        if (Array.isArray(data.system_log)) buckets['00_SUMMARY'].push(...data.system_log);

                        const lines = data.feedback_log.split('\n');
                        lines.forEach(line => {
                            const trimmed = line.trim();
                            if (!trimmed || trimmed.startsWith('--- PAGE')) return;
                            for (const [tag, binId] of Object.entries(tagMap)) {
                                if (trimmed.startsWith(tag)) {
                                    buckets[binId].push(trimmed);
                                    break;
                                }
                            }
                        });

                        loadedBuckets = buckets;
                        for (const [binKey, linesArray] of Object.entries(buckets)) {
                            renderGroupedText(binKey, linesArray);
                        }
                        switchView(displayStudy, btnStudy);
                    } else {
                        const payload = data.bins ? data.bins : data;
                        loadedBuckets = payload;
                        for (const [binKey, textContent] of Object.entries(payload)) {
                            if (document.getElementById(binKey)) {
                                renderGroupedText(binKey, textContent);
                            }
                        }
                        switchView(displayStudy, btnStudy);
                    }
                } catch (err) {
                    alert("Error parsing JSON file. Check console (F12) for details.");
                    console.error("JSON Parse Error:", err);
                } finally {
                    jsonFileInput.value = '';
                }
            };
            reader.readAsText(file);
        });
    }

    // SETTINGS GROUP SIZE
    const displayGroupSize = document.getElementById('group-size-display');
    const editContainer = document.getElementById('group-size-edit-container');
    const inputGroupSize = document.getElementById('input-group-size');
    const btnSaveGroupSize = document.getElementById('btn-save-group-size');

    const groupBreaksControl = document.getElementById('group-breaks-control');
    const viewportAppearanceControl = document.getElementById('viewport-appearance-control');
    const colorsControl = document.getElementById('colors-control');
    const textControl = document.getElementById('text-control');

    if (displayGroupSize && editContainer && inputGroupSize) {
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

                if (loadedBuckets) {
                    for (const [binKey, content] of Object.entries(loadedBuckets)) {
                        const text = Array.isArray(content) ? content : content;
                        renderGroupedText(binKey, text);
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
            subMenuTitle.textContent = `[ ${categoryName} Options ]`;

            groupBreaksControl.style.display = categoryName === 'GROUP BREAKS' ? 'block' : 'none';
            viewportAppearanceControl.style.display = categoryName === 'VIEWPORT APPEARANCE' ? 'block' : 'none';
            colorsControl.style.display = categoryName === 'COLORS' ? 'block' : 'none';
            if (textControl) textControl.style.display = categoryName === 'TEXT' ? 'block' : 'none';

            if (categoryName === 'TEXT') updateTextOptionButtonStates();
        });
    });

    // RULED LINES PALETTE SELECTION
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

    // MARGIN PALETTE SELECTION
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

    // 3x3 COLOR PRESET SWATCHES LISTENER
    const preset3x3Dots = document.querySelectorAll('#color-preset-3x3 .preset-dot');
    preset3x3Dots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            e.stopPropagation();
            const chosenColor = dot.getAttribute('data-color');
            document.documentElement.style.setProperty(activeColorTargetVar, chosenColor);
        });
    });

    // BORDER MATERIAL BUTTON SELECTIONS (WOOD, TITANIUM, BLACK GLASS)
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

    // COLOR TARGET SELECTORS
    document.querySelectorAll('.color-target-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.color-target-btn').forEach(b => b.classList.remove('active-target'));
            btn.classList.add('active-target');
            activeColorTargetVar = btn.getAttribute('data-target');
        });
    });

    // TEXT TARGET SELECTORS
    document.querySelectorAll('.text-target-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.text-target-btn').forEach(b => b.classList.remove('active-target'));
            btn.classList.add('active-target');
            activeTextTarget = btn.getAttribute('data-target');
            updateTextOptionButtonStates();
        });
    });

    // TEXT BOLD TOGGLE
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

    // TEXT ITALIC TOGGLE
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

    // TEXT FONT FAMILY SELECTOR
    const selectTokenFont = document.getElementById('select-token-font');
    if (selectTokenFont) {
        selectTokenFont.addEventListener('change', (e) => {
            document.documentElement.style.setProperty(`--font-family-${activeTextTarget}`, e.target.value);
        });
    }

    document.querySelectorAll('.theme-preset-card[data-theme]').forEach(card => {
        card.addEventListener('click', () => {
            currentThemeKey = card.getAttribute('data-theme');
            applyViewportAppearance();
        });
    });

    // SLATE MODES
    const btnNoun = document.getElementById('btn-mode-noun');
    const btnNounDesc = document.getElementById('btn-mode-noun-desc');
    const btnNounDescWhere = document.getElementById('btn-mode-noun-desc-where');
    const modeBtns = [btnNoun, btnNounDesc, btnNounDescWhere];

    function setSlateMode(newMode, activeBtn) {
        slateMode = newMode;
        modeBtns.forEach(b => b && b.classList.remove('active-slate-mode'));
        if (activeBtn) activeBtn.classList.add('active-slate-mode');
        initCopySlate();
    }

    if (btnNoun) btnNoun.addEventListener('click', () => setSlateMode('NOUN', btnNoun));
    if (btnNounDesc) btnNounDesc.addEventListener('click', () => setSlateMode('NOUN_DESC', btnNounDesc));
    if (btnNounDescWhere) btnNounDescWhere.addEventListener('click', () => setSlateMode('NOUN_DESC_WHERE', btnNounDescWhere));

    const btnToggleCheckMode = document.getElementById('btn-toggle-check-mode');
    if (btnToggleCheckMode) {
        btnToggleCheckMode.addEventListener('click', () => {
            checkEngineMode = checkEngineMode === 'VERBATUM' ? 'AI_CHECK' : 'VERBATUM';
            btnToggleCheckMode.textContent = checkEngineMode === 'VERBATUM' ? '[ VERBATUM ]' : '[ AI CHECK ]';
        });
    }

    const btnSlateClear = document.getElementById('btn-slate-clear');
    const clearModal = document.getElementById('slate-clear-modal');
    const btnModalSave = document.getElementById('btn-modal-save');
    const btnModalDiscard = document.getElementById('btn-modal-discard');

    if (btnSlateClear && clearModal) {
        btnSlateClear.addEventListener('click', () => {
            if (getCopySlateLines().length === 0) performSlateClear();
            else clearModal.style.display = 'flex';
        });
    }

    if (btnModalDiscard) {
        btnModalDiscard.addEventListener('click', () => {
            clearModal.style.display = 'none';
            performSlateClear();
        });
    }

    if (btnModalSave) {
        btnModalSave.addEventListener('click', () => {
            const record = compileTestResultRecord();
            clearModal.style.display = 'none';
            performSlateClear();
            alert(`[ TEST SAVED ]\nTest ID: ${record.test_id}\nScore: ${record.score_percentage}%`);
        });
    }

    const btnCheck = document.getElementById('btn-check-comparator');
    if (btnCheck) {
        btnCheck.addEventListener('click', () => {
            if (checkEngineMode === 'VERBATUM') runVerbatimCheck();
            else alert("[ AI CHECK ] Dispatching active slate & open group study lines to Gemini comparator engine.");
        });
    }

});