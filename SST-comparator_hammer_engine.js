// ==========================================
// SST-HAMMER ENGINE (MODULE 5)
// ==========================================

let slateMode = 'NOUN';
let checkEngineMode = 'VERBATUM';
let currentLineNum = 1;
let currentStep = 0;
let REQUIRED_PASS_PERCENTAGE = 80;

function isLatexFormula(str) {
    if (!str) return false;
    const latexPattern = /(\$\$?[\s\S]*?\$\$?|\\frac|\\cdot|\\times|\\approx|\\sum|\\int|\\[a-zA-Z]+|\^\{?[0-9a-zA-Z]+\}?|_\{?[0-9a-zA-Z]+\}?)/;
    return latexPattern.test(str);
}

function normalizeFormulaForComparison(formulaStr) {
    if (!formulaStr) return "";
    let clean = String(formulaStr).trim();

    clean = clean.replace(/^\$\$?/, '').replace(/\$\$?$/, '').trim();

    clean = clean
        .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
        .replace(/\\cdot|\\times/g, '*')
        .replace(/\\approx/g, '≈')
        .replace(/\\left|\\right/g, '')
        .replace(/[{}]/g, '');

    clean = clean
        .replace(/\s*=\s*/g, ' = ')
        .replace(/\s*\/\s*/g, ' / ')
        .replace(/\s*\*\s*/g, ' * ')
        .replace(/\s*\+\s*/g, ' + ')
        .replace(/\s*-\s*/g, ' - ')
        .replace(/\s+/g, ' ');

    return clean.toLowerCase();
}

function initCopySlate() {
    const canvas = document.getElementById('copy-slate-canvas');
    if (!canvas) return;
    canvas.innerHTML = '';
    currentLineNum = 1;
    currentStep = 0;
    createNewSlateLine();
    if (typeof updateActiveGroupsIndicator === 'function') updateActiveGroupsIndicator();
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
    } else {
        const openGroups = wrapper.querySelectorAll('.line-group.open');
        openGroups.forEach(g => {
            targetRows.push(...Array.from(g.querySelectorAll('.line-row')));
        });
    }

    targetRows.forEach(row => {
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

        let isMatch = false;
        if (isLatexFormula(typed) || isLatexFormula(target)) {
            isMatch = (normalizeFormulaForComparison(typed) === normalizeFormulaForComparison(target));
        } else {
            isMatch = (typed.trim().toLowerCase() === target.trim().toLowerCase());
        }

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

        let isMatch = false;
        if (isLatexFormula(typed) || isLatexFormula(target)) {
            isMatch = (normalizeFormulaForComparison(typed) === normalizeFormulaForComparison(target));
        } else {
            isMatch = (typed.trim().toLowerCase() === target.trim().toLowerCase());
        }
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
        open_groups: typeof getOpenGroupIndices === 'function' ? getOpenGroupIndices() : ['1'],
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

document.addEventListener('DOMContentLoaded', () => {
    initCopySlate();

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
