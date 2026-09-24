// ==========================================
// SST-COURSEWARE ENGINE (MODULE 4)
// ==========================================

let draggedRowElement = null;
let activeEditingRow = null;

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
    if (desc) tokenHtml += ` <span style="color: var(--number-color);">|</span> <span class="line-part-desc" data-field="desc" contenteditable="true" spellcheck="false">${desc}</span>`;
    if (where) tokenHtml += ` <span style="color: var(--number-color);">|</span> <span class="line-part-where" data-field="where" contenteditable="true" spellcheck="false">${where}</span>`;

    return tokenHtml;
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
    autoSaveActiveTabOrder();
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
    row.dataset.rawText = rawText;

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
        autoSaveActiveTabOrder();
        renderActiveTab();
        markUnsavedChanges();
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
        autoSaveActiveTabOrder();
        renderActiveTab();
        markUnsavedChanges();
    });
}

function attachRowKeyEvents(row) {
    let lastEnterTime = 0;

    row.querySelectorAll('[contenteditable="true"]').forEach(editableSpan => {
        editableSpan.addEventListener('input', () => {
            markUnsavedChanges();
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
                    autoSaveActiveTabOrder();
                    renderActiveTab();
                    releaseEditLock();
                    markUnsavedChanges();
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
                    markUnsavedChanges();
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

    autoSaveActiveTabOrder();
    renderActiveTab();
    markUnsavedChanges();
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
    
    autoSaveActiveTabOrder();
    renderActiveTab();
    setEditLock(newRow);
    markUnsavedChanges();

    const firstEditable = newRow.querySelector('[data-field="name"]');
    if (firstEditable) {
        firstEditable.focus();
        document.execCommand('selectAll', false, null);
    }
}

function autoSaveActiveTabOrder() {
    const activePane = document.querySelector('.study-tab-pane.active');
    if (!activePane || activePane.id === '00_SUMMARY') return;

    const currentRows = [];
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

        if (compiled.trim()) currentRows.push(compiled.trim());
    });

    if (!activeBuckets) activeBuckets = {};
    if (!rawMasterBuckets) rawMasterBuckets = {};

    activeBuckets[activePane.id] = currentRows;
    rawMasterBuckets[activePane.id] = [...currentRows];
}

function renderActiveTab() {
    const activePane = document.querySelector('.study-tab-pane.active');
    if (activePane && activeBuckets && activeBuckets[activePane.id]) {
        renderGroupedText(activePane.id, activeBuckets[activePane.id]);
    }
}

function exportProjectStateToJson() {
    autoSaveActiveTabOrder();

    const compiledBins = {};
    const rawFeedbackLines = [];

    if (rawMasterBuckets) {
        for (const [binKey, rows] of Object.entries(rawMasterBuckets)) {
            if (binKey === '00_SUMMARY') continue;
            compiledBins[binKey] = rows;
            rows.forEach(r => rawFeedbackLines.push(r));
        }
    }

    const payload = {
        metadata: {
            ...currentProjectMetadata,
            timestamp: new Date().toISOString(),
            saved_by: activeUserId
        },
        project_settings: {
            group_size: GROUP_SIZE,
            theme: currentThemeKey,
            frame: activeFrameBorder,
            font_styles: {
                tag: getComputedStyle(document.documentElement).getPropertyValue('--font-family-tag').trim(),
                name: getComputedStyle(document.documentElement).getPropertyValue('--font-family-name').trim(),
                desc: getComputedStyle(document.documentElement).getPropertyValue('--font-family-desc').trim(),
                where: getComputedStyle(document.documentElement).getPropertyValue('--font-family-where').trim()
            }
        },
        bins: compiledBins,
        feedback_log: rawFeedbackLines.join('\n')
    };

    localStorage.setItem('sst_courseware_backup', JSON.stringify(payload));

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = downloadUrl;
    downloadAnchor.download = currentProjectMetadata.source_file.endsWith('.json') ? currentProjectMetadata.source_file : `${currentProjectMetadata.source_file}.json`;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(downloadUrl);

    hasUnsavedChanges = false;
}

function getOpenGroupIndices() {
    const activePane = document.querySelector('.study-tab-pane.active');
    if (!activePane) return [];

    const wrapper = activePane.querySelector('.grouped-wrapper');
    if (!wrapper) return ['1'];

    const openIndices = [];
    wrapper.querySelectorAll('.line-group').forEach(g => {
        if (g.classList.contains('open')) {
            const match = g.id.match(/-(\d+)$/);
            if (match) openIndices.push(match[1]);
        }
    });

    return openIndices.length > 0 ? openIndices : ['1'];
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

    let items = [];
    if (Array.isArray(rawText)) {
        items = rawText;
    } else if (typeof rawText === 'string') {
        items = rawText.replace(/\r/g, '').split('\n').map(l => l.trim()).filter(l => l !== '');
    } else if (rawText !== null && rawText !== undefined) {
        items = [String(rawText)];
    }

    if (items.length === 0) {
        container.innerHTML = '<div style="color: var(--number-color); padding: 15px; font-family: monospace;">[ NO ENTRIES IN THIS BIN ]</div>';
        updateActiveGroupsIndicator();
        return;
    }

    if (paneId === '00_SUMMARY') {
        let html = '<div style="display:flex; flex-direction:column; gap:4px; padding:4px;">';
        items.forEach(l => {
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
    wrapper.className = 'grouped-wrapper';
    wrapper.id = `wrapper-${paneId}`;

    let globalLineCount = 1;
    let groupIndex = 1;

    for (let i = 0; i < items.length; i += GROUP_SIZE) {
        const chunk = items.slice(i, i + GROUP_SIZE);
        const startNum = globalLineCount;
        const endNum = globalLineCount + chunk.length - 1;

        const groupEl = document.createElement('div');
        groupEl.className = 'line-group';
        groupEl.id = `group-${paneId}-${groupIndex}`;

        if (openMemory.has(String(groupIndex)) || groupIndex === 1) {
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
    if (typeof autofitViewportText === 'function') autofitViewportText();
}

function toggleGroup(paneId, groupIndex) {
    const groupEl = document.getElementById(`group-${paneId}-${groupIndex}`);
    if (groupEl) {
        groupEl.classList.toggle('open');
        updateActiveGroupsIndicator();
    }
}

function switchStudyTab(evt, targetBin) {
    releaseEditLock();
    document.querySelectorAll('.study-tab-pane').forEach(pane => pane.classList.remove('active'));
    document.querySelectorAll('.study-tab-button').forEach(btn => btn.classList.remove('active-study-tab'));

    const activePane = document.getElementById(targetBin);
    if (activePane) {
        activePane.classList.add('active');
        if (!activePane.querySelector('.line-row') && !activePane.querySelector('.grouped-wrapper') && activePane.id !== '00_SUMMARY') {
            activePane.innerHTML = '<div style="color: var(--number-color); padding: 15px; font-family: monospace;">[ NO ENTRIES IN THIS BIN ]</div>';
        }
    }
    if (evt && evt.currentTarget) {
        evt.currentTarget.classList.add('active-study-tab');
    } else {
        const matchingBtn = document.querySelector(`button[onclick*="${targetBin}"]`);
        if (matchingBtn) matchingBtn.classList.add('active-study-tab');
    }
    updateActiveGroupsIndicator();
    if (typeof autofitViewportText === 'function') autofitViewportText();
}

function processAndDistributePayload(data) {
    console.log("--> [PAYLOAD INGEST] Parsing and distributing manifest into comparator bins...", data);

    const buckets = {
        '00_SUMMARY': [],
        '01_WHAT': [],
        '02_PURPOSE': [],
        '03_RULE': [],
        '04_FORMULA': [],
        '05_ID': [],
        '06_RELATED': [],
        '07_OBJECTIVE': [],
        '08_SOURCE': [],
        '09_WHY': []
    };

    const tagMap = {
        'WHAT': '01_WHAT',
        'NOUN': '01_WHAT',
        'PURPOSE': '02_PURPOSE',
        'OBJECTIVE': '07_OBJECTIVE',
        'RULE': '03_RULE',
        'FORMULA': '04_FORMULA',
        'MATH': '04_FORMULA',
        'STEP': '03_RULE',
        'INPUT': '06_RELATED',
        'OUTPUT': '06_RELATED',
        'FAILURE': '09_WHY',
        'LINK': '06_RELATED',
        'FEEDBACK': '09_WHY',
        'ID': '05_ID',
        'RELATED': '06_RELATED',
        'SOURCE': '08_SOURCE',
        'WHY': '09_WHY'
    };

    const rawData = data.milled_manifest || data;

    if (rawData.metadata || data.metadata) {
        const meta = rawData.metadata || data.metadata || {};
        currentProjectMetadata = { ...meta };
        buckets['00_SUMMARY'].push(`[PROJECT NAME] ${data.title || data.project_title || meta.project_name || meta.source_file || 'N/A'}`);
        buckets['00_SUMMARY'].push(`[SOURCE FILE] ${meta.source_file || data.source_file || 'N/A'}`);
        buckets['00_SUMMARY'].push(`[PAGES MILLED] ${data.page_range || meta.pages_milled || 'N/A'}`);
        buckets['00_SUMMARY'].push(`[TIMESTAMP] ${data.timestamp || meta.timestamp || new Date().toISOString()}`);
        buckets['00_SUMMARY'].push(`[STORAGE PATH] ${data.storage_path || 'N/A'}`);
        buckets['00_SUMMARY'].push('----------------------------------------');
    }

    if (Array.isArray(rawData.system_log)) {
        buckets['00_SUMMARY'].push(...rawData.system_log);
    }

    if (rawData.bins) {
        for (const [binKey, textContent] of Object.entries(rawData.bins)) {
            if (buckets[binKey] !== undefined) {
                buckets[binKey] = Array.isArray(textContent) ? [...textContent] : [String(textContent)];
            }
        }
    } else if (rawData.feedback_log) {
        const rawLines = rawData.feedback_log.split('\n');
        
        rawLines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('---') || trimmed.startsWith('**') || trimmed.startsWith('#')) return;

            const tagMatch = trimmed.match(/^(?:\[?([A-Z_]+)\]?\s*:\s*|\[([A-Z_]+)\]\s*)(.+)$/i);
            
            if (tagMatch) {
                const tagKey = (tagMatch[1] || tagMatch[2]).toUpperCase().trim();
                const content = tagMatch[3].trim();
                let targetBin = tagMap[tagKey] || '01_WHAT';

                if (tagKey === 'RULE' && (content.includes('=') || content.includes('/') || content.includes('+') || content.includes('\\frac') || content.includes('*'))) {
                    targetBin = '04_FORMULA';
                }

                if (content.includes('–')) {
                    const splitDash = content.split('–').map(s => s.trim());
                    buckets[targetBin].push(`[${tagKey}] ${splitDash[0]} | ${splitDash.slice(1).join(' - ')}`);
                } else if (content.includes(' - ')) {
                    const splitDash = content.split(' - ').map(s => s.trim());
                    buckets[targetBin].push(`[${tagKey}] ${splitDash[0]} | ${splitDash.slice(1).join(' - ')}`);
                } else {
                    buckets[targetBin].push(`[${tagKey}] ${content}`);
                }
            }
        });
    } else if (Array.isArray(rawData)) {
        rawData.forEach(item => {
            const tagKey = (item.tag || item.type || item.discipline || 'WHAT').toUpperCase();
            const targetBin = tagMap[tagKey] || '01_WHAT';
            const name = item.name || item.title || item.term || 'Term';
            const desc = item.desc || item.description || item.content || '';
            const where = item.where || item.location || '';
            
            let rowStr = `[${tagKey}] ${name}`;
            if (desc) rowStr += ` | ${desc}`;
            if (where) rowStr += ` | ${where}`;
            buckets[targetBin].push(rowStr);
        });
    }

    rawMasterBuckets = JSON.parse(JSON.stringify(buckets));
    activeBuckets = JSON.parse(JSON.stringify(buckets));

    for (const [binKey, linesArray] of Object.entries(activeBuckets)) {
        renderGroupedText(binKey, linesArray);
    }

    hasUnsavedChanges = false;
    switchStudyTab(null, '01_WHAT');
}

function checkSessionHandoff() {
    const stagedData = sessionStorage.getItem('staged_manifest_payload');
    if (stagedData) {
        console.log("--> [HANDOFF DETECTED] Found staged payload from gateway dispatch.");
        try {
            const parsed = JSON.parse(stagedData);
            processAndDistributePayload(parsed);
            sessionStorage.removeItem('staged_manifest_payload');
            return true;
        } catch (e) {
            console.error("Error parsing staged manifest handoff:", e);
        }
    }
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    const btnHide = document.getElementById('btn-study-hide');
    if (btnHide) {
        btnHide.addEventListener('click', () => {
            const activePane = document.querySelector('.study-tab-pane.active');
            if (!activePane || !activeBuckets || !activeBuckets[activePane.id]) return;

            const checkedBoxes = activePane.querySelectorAll('.line-select-dot:checked');
            if (checkedBoxes.length === 0) {
                alert("Please select at least one line dot to hide.");
                return;
            }

            const hideTexts = new Set();
            checkedBoxes.forEach(box => {
                const row = box.closest('.line-row');
                if (row && row.dataset.rawText) {
                    hideTexts.add(row.dataset.rawText.trim());
                }
            });

            activeBuckets[activePane.id] = activeBuckets[activePane.id].filter(line => !hideTexts.has(line.trim()));
            renderGroupedText(activePane.id, activeBuckets[activePane.id]);
            markUnsavedChanges();
        });
    }

    const btnUnhide = document.getElementById('btn-study-unhide');
    if (btnUnhide) {
        btnUnhide.addEventListener('click', () => {
            const activePane = document.querySelector('.study-tab-pane.active');
            if (!activePane || !rawMasterBuckets || !rawMasterBuckets[activePane.id]) return;

            activeBuckets[activePane.id] = [...rawMasterBuckets[activePane.id]];
            renderGroupedText(activePane.id, activeBuckets[activePane.id]);
        });
    }

    const btnDelete = document.getElementById('btn-study-delete');
    if (btnDelete) {
        btnDelete.addEventListener('click', () => {
            const activePane = document.querySelector('.study-tab-pane.active');
            if (!activePane || !activeBuckets || !activeBuckets[activePane.id]) return;

            const checkedBoxes = activePane.querySelectorAll('.line-select-dot:checked');
            if (checkedBoxes.length === 0) {
                alert("Please select at least one line dot to delete.");
                return;
            }

            const deleteTexts = new Set();
            checkedBoxes.forEach(box => {
                const row = box.closest('.line-row');
                if (row && row.dataset.rawText) {
                    deleteTexts.add(row.dataset.rawText.trim());
                }
            });

            showGlobalModal({
                title: "PERMANENT DELETE WARNING",
                body: `Are you sure you want to permanently delete **${deleteTexts.size}** line(s)? This will remove them from the project dataset.`,
                buttons: [
                    { text: "CANCEL", className: "btn-modal-discard" },
                    {
                        text: "YES, DELETE",
                        className: "btn-modal-danger",
                        onClick: () => {
                            activeBuckets[activePane.id] = activeBuckets[activePane.id].filter(line => !deleteTexts.has(line.trim()));
                            rawMasterBuckets[activePane.id] = rawMasterBuckets[activePane.id].filter(line => !deleteTexts.has(line.trim()));
                            renderGroupedText(activePane.id, activeBuckets[activePane.id]);
                            markUnsavedChanges();
                        }
                    }
                ]
            });
        });
    }

    const btnStudySave = document.getElementById('btn-study-save');
    if (btnStudySave) {
        btnStudySave.addEventListener('click', () => {
            exportProjectStateToJson();
            const originalText = btnStudySave.textContent;
            btnStudySave.textContent = "SAVED ✓";
            btnStudySave.style.color = "#00ff66";
            setTimeout(() => {
                btnStudySave.textContent = originalText;
                btnStudySave.style.color = "";
            }, 1500);
        });
    }

    const btnLoadFile = document.getElementById('btn-load-file');
    const jsonFileInput = document.getElementById('json-file-input');
    const sourceModal = document.getElementById('sst-source-modal');
    const btnCloseSourceModal = document.getElementById('btn-close-source-modal');
    const btnChoiceLocal = document.getElementById('btn-choice-local');
    const btnChoiceCloud = document.getElementById('btn-choice-cloud');
    const selectProjects = document.getElementById('select-cloud-projects') || document.getElementById('cloud-projects-dropdown');

    function promptLoadWithUnsavedGuard(actionCallback) {
        if (!hasUnsavedChanges) {
            actionCallback();
            return;
        }

        showGlobalModal({
            title: "UNSAVED PROJECT CHANGES",
            body: "You have unsaved edits or group rearrangements in your current project.<br><br>Would you like to save your project before loading a new data source?",
            isActionModal: true,
            buttons: [
                {
                    text: "DISCARD & LOAD",
                    className: "btn-modal-discard btn-modal-danger",
                    onClick: () => {
                        hasUnsavedChanges = false;
                        actionCallback();
                    }
                },
                {
                    text: "CANCEL",
                    className: "btn-modal-discard",
                    onClick: () => {}
                },
                {
                    text: "SAVE & PROCEED",
                    className: "btn-modal-save",
                    onClick: () => {
                        exportProjectStateToJson();
                        actionCallback();
                    }
                }
            ]
        });
    }

    if (btnLoadFile) {
        btnLoadFile.addEventListener('click', (e) => {
            e.preventDefault();
            promptLoadWithUnsavedGuard(() => {
                if (sourceModal) {
                    if (typeof populateCloudProjectsDropdown === 'function') populateCloudProjectsDropdown();
                    sourceModal.style.display = 'flex';
                } else if (jsonFileInput) {
                    jsonFileInput.click();
                }
            });
        });
    }

    if (btnCloseSourceModal && sourceModal) {
        btnCloseSourceModal.addEventListener('click', () => {
            sourceModal.style.display = 'none';
        });
    }

    if (btnChoiceLocal && jsonFileInput) {
        btnChoiceLocal.addEventListener('click', () => {
            if (sourceModal) sourceModal.style.display = 'none';
            jsonFileInput.click();
        });
    }

    if (btnChoiceCloud && selectProjects) {
        btnChoiceCloud.addEventListener('click', () => {
            const chosen = selectProjects.value;
            if (!chosen) {
                alert("Please select a project.");
                return;
            }
            if (sourceModal) sourceModal.style.display = 'none';
            if (typeof loadCloudNouns === 'function') loadCloudNouns(chosen);
        });
    }

    if (jsonFileInput) {
        jsonFileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    if (!data.metadata) data.metadata = {};
                    data.metadata.source_file = file.name;
                    processAndDistributePayload(data);
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

    checkSessionHandoff();
});
