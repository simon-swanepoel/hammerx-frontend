// =========================================================================
// SST MATH & FORMULA HAMMER WORKSTATION ENGINE
// Master File: SST-FORMATH_comparator.js
// Features: 3-State Viewport, Dimensioning Tags, Slate Engine & Auto-Save
// =========================================================================

let masterDataset = [];
let activeFormulaDataset = [];
let currentFilterMode = "MATH"; // "MATH" or "FORMULA"
let currentSlateLineCount = 0;
let activeSlateInput = null;

let GROUP_SIZE = 10;
let checkEngineMode = "VERBATUM";
// =========================================================================
// SST-COMPARATOR WORKSTATION MASTER SCRIPT
// File: SST-comparator.js
// Standard Courseware & Verbatim Slate Engine (Plain Text Math e.g. V=IxR)
// =========================================================================

// -------------------------------------------------------------------------
// 0. GLOBAL EXPORTS & FOUNDATIONAL STATE (Binds immediately to window)
// -------------------------------------------------------------------------
window.switchStudyTab = function(evt, tabId) {
  document.querySelectorAll('.study-tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.study-tab-button').forEach(b => b.classList.remove('active-study-tab'));
  const targetPane = document.getElementById(tabId);
  if (targetPane) targetPane.classList.add('active');
  if (evt && evt.currentTarget) evt.currentTarget.classList.add('active-study-tab');
};


let activeDataset = [];


let currentSlateMode = "NOUN"; // "NOUN", "NOUN_DESC", "NOUN_DESC_WHERE"

// 1. COURSEWARE 3-STATE STRUCTURE TOGGLE MODES
const CW_MODES = [
  { id: "NOUN", label: "NOUN" },
  { id: "NOUN_DESC", label: "NOUN + DESCRIPTION" },
  { id: "NOUN_DESC_APP", label: "NOUN + DESCRIPTION + APPLICATION" }
];
let currentCwModeIndex = 0;

// 3. DIMENSIONING QUESTION EXPANSION LOOKUP
const DIMENSION_QUESTION_MAP = [
  { match: "[what]", text: "[what is/are?]" },
  { match: "[purpose]", text: "[what is the purpose of ____ to?]" },
  { match: "[objective]", text: "[what is the objective of/for/by?]" },
  { match: "[why]", text: "[why is/are ____ necessary/needed?]" },
  { match: "[use]", text: "[why do we need/use/implement?]" },
  { match: "[related]", text: "[additional related rule or principles]" },
  { match: "[id]", text: "[how or what identifies?]" }
];

// THEMES & VIEWPORT ENGINE VARIABLES
let currentThemeKey = 'BLACK_BOARD';
let activeFrameBorder = 'WOOD';
let isSettingsModified = false;

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
  root.style.setProperty('--number-color', theme['--number-color']);
  root.style.setProperty('--divider-color', theme['--divider-color']);

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

// -------------------------------------------------------------------------
// 1 & 2. 3-STATE COURSEWARE TOGGLE & AUTO-HIDE [WHAT]
// -------------------------------------------------------------------------
function cycleCoursewareMode() {
  currentCwModeIndex = (currentCwModeIndex + 1) % CW_MODES.length;
  const activeMode = CW_MODES[currentCwModeIndex];

  const btn = document.getElementById("btn-courseware-toggle");
  const lbl = document.getElementById("courseware-mode-label");
  const displayContainer = document.getElementById("display-study-material");

  if (lbl) lbl.textContent = activeMode.label;
  if (btn) btn.dataset.mode = activeMode.id;

  if (displayContainer) {
    displayContainer.classList.remove("viewport-mode-NOUN", "viewport-mode-NOUN_DESC", "viewport-mode-NOUN_DESC_APP");
    displayContainer.classList.add(`viewport-mode-${activeMode.id}`);
  }
}

// 3. DIMENSIONING QUESTION EXPANDER HELPER
function formatDimensionTagText(rawTag) {
  if (!rawTag) return "";
  const cleaned = rawTag.trim().toLowerCase();
  const entry = DIMENSION_QUESTION_MAP.find(item => item.match === cleaned);
  return entry ? entry.text : rawTag;
}

// -------------------------------------------------------------------------
// SUPABASE CLIENT & AUTH BRIDGE
// -------------------------------------------------------------------------
const SUPABASE_URL = "https://lsjswxsrskaxyzvgqezu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzanN3eHNyc2theHl6dmdxZXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MzgxMTQsImV4cCI6MjA5OTIxNDExNH0._D99dnmEsQPULWcCBQcp1ThOYyzfRV4zEyMBxAPbYD8";
const supa = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

let currentUserSession = null;
let activeUserId = null;
let authMode = "LOGIN";

// 4. AUTOSAVE USER PREFERENCES TO SUPABASE UPON EXITING SETTINGS
async function autoSavePreferencesOnSettingsExit() {
  if (!supa || !activeUserId || !isSettingsModified) return;

  const rootStyle = getComputedStyle(document.documentElement);
  const currentPreferences = {
    user_id: activeUserId,
    board_theme: currentThemeKey,
    console_frame: activeFrameBorder,
    group_size: GROUP_SIZE,
    custom_colors: {
      part_tag: rootStyle.getPropertyValue('--color-part-tag').trim(),
      part_name: rootStyle.getPropertyValue('--color-part-name').trim(),
      part_desc: rootStyle.getPropertyValue('--color-part-desc').trim(),
      part_where: rootStyle.getPropertyValue('--color-part-where').trim()
    },
    updated_at: new Date().toISOString()
  };

  try {
    const { error } = await supa
      .from('user_preferences')
      .upsert(currentPreferences, { onConflict: 'user_id' });

    if (error) {
      console.warn("Autosave preferences error:", error.message);
    } else {
      isSettingsModified = false;
      console.log("Settings automatically synced to cloud profile.");
    }
  } catch (err) {
    console.error("Autosave runtime exception:", err);
  }
}

async function loadUserPreferencesFromCloud(userId) {
  if (!supa || !userId) return;

  try {
    const { data: prefs, error } = await supa
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (prefs) {
      if (prefs.board_theme) currentThemeKey = prefs.board_theme;
      if (prefs.console_frame) activeFrameBorder = prefs.console_frame;
      if (prefs.group_size) {
        GROUP_SIZE = prefs.group_size;
        const disp = document.getElementById("group-size-display");
        if (disp) disp.textContent = GROUP_SIZE;
      }
      if (prefs.custom_colors) {
        const root = document.documentElement;
        if (prefs.custom_colors.part_tag) root.style.setProperty('--color-part-tag', prefs.custom_colors.part_tag);
        if (prefs.custom_colors.part_name) root.style.setProperty('--color-part-name', prefs.custom_colors.part_name);
        if (prefs.custom_colors.part_desc) root.style.setProperty('--color-part-desc', prefs.custom_colors.part_desc);
        if (prefs.custom_colors.part_where) root.style.setProperty('--color-part-where', prefs.custom_colors.part_where);
      }
      applyViewportAppearance();
    }
  } catch (err) {
    console.warn("Could not load user preferences:", err.message);
  }
}

async function populateCloudProjectsDropdown() {
  const dropdown = document.getElementById('select-cloud-projects');
  if (!dropdown || !supa) return;

  dropdown.innerHTML = '<option value="">Scanning cloud projects...</option>';

  try {
    const { data: { user } } = await supa.auth.getUser();
    if (!user) {
      dropdown.innerHTML = '<option value="">Please sign in to view cloud projects</option>';
      return;
    }

    const { data: items, error } = await supa
      .from('study_items')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    dropdown.innerHTML = '';
    if (!items || items.length === 0) {
      dropdown.innerHTML = '<option value="">No projects found in database</option>';
      return;
    }

    items.forEach(proj => {
      const opt = document.createElement('option');
      opt.value = proj.id;
      const dateStr = new Date(proj.created_at).toLocaleDateString();
      opt.textContent = `${proj.title || 'Untitled'} (${dateStr})`;
      dropdown.appendChild(opt);
    });

  } catch (err) {
    console.error("Database error:", err);
    dropdown.innerHTML = '<option value="">Error listing projects</option>';
  }
}

async function loadCloudProject(projectId) {
  if (!supa || !projectId) return;

  try {
    const { data: row, error } = await supa
      .from('study_items')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;
    if (!row || !row.payload) {
      alert("Selected project has an empty payload.");
      return;
    }

    parseAndLoadManifest(row.payload);
    const sourceModal = document.getElementById('sst-source-modal');
    if (sourceModal) sourceModal.style.display = 'none';

  } catch (err) {
    alert(`Cloud Load Error: ${err.message}`);
    console.error(err);
  }
}

// -------------------------------------------------------------------------
// COURSEWARE RENDERING ENGINE (Text Math: V=IxR, P=VxI)
// -------------------------------------------------------------------------
function renderCoursewarePane() {
  const refContainer = document.getElementById("00_SUMMARY");
  if (!refContainer) return;
  refContainer.innerHTML = "";

  if (activeDataset.length === 0) {
    refContainer.innerHTML = `<div style="color: var(--number-color); padding: 15px;">[*] Click LOAD to select a local JSON file or pull from Supabase Cloud.</div>`;
    return;
  }

  let globalIndex = 0;
  let groupIndex = 1;
  const totalItems = activeDataset.length;

  for (let i = 0; i < totalItems; i += GROUP_SIZE) {
    const chunk = activeDataset.slice(i, i + GROUP_SIZE);
    const startNum = i + 1;
    const endNum = Math.min(i + GROUP_SIZE, totalItems);

    const groupWrapper = document.createElement("div");
    groupWrapper.className = "line-group open";
    groupWrapper.id = `group-wrapper-${groupIndex}`;

    const groupHeader = document.createElement("div");
    groupHeader.className = "group-header";
    groupHeader.innerHTML = `<span>GROUP ${groupIndex} <span class="group-range">(${String(startNum).padStart(2, '0')}-${String(endNum).padStart(2, '0')})</span></span>`;
    
    groupHeader.addEventListener("click", () => {
      groupWrapper.classList.toggle("open");
    });

    const linesHolder = document.createElement("div");
    linesHolder.className = "group-lines";

    chunk.forEach((item) => {
      const currentIndex = globalIndex;
      const lineNum = String(currentIndex + 1).padStart(2, '0');

      const lineRow = document.createElement("div");
      lineRow.className = "line-row";
      lineRow.dataset.index = currentIndex;

      const selectDot = document.createElement("input");
      selectDot.type = "checkbox";
      selectDot.className = "line-select-dot";
      selectDot.dataset.index = currentIndex;

      const numSpan = document.createElement("span");
      numSpan.className = "line-number";
      numSpan.textContent = `${lineNum}.`;

      const lineText = document.createElement("div");
      lineText.className = "line-text";

      // 3. Apply Tag Format & Check for [what]
      const rawTagStr = item.rawTag || "[WHAT]";
      const displayTag = formatDimensionTagText(rawTagStr);
      const isWhatTag = rawTagStr.trim().toLowerCase() === "[what]";

      const tagSpan = document.createElement("span");
      tagSpan.className = `line-part-tag ${isWhatTag ? 'tag-what' : ''} dim-expanded-tag`;
      tagSpan.textContent = `${displayTag} `;

      const nameSpan = document.createElement("span");
      nameSpan.className = "line-part-name";
      nameSpan.textContent = item.name || "Item";

      const descDivider = document.createElement("span");
      descDivider.className = "desc-divider";
      descDivider.style.color = "var(--number-color)";
      descDivider.textContent = " | ";

      const descSpan = document.createElement("span");
      descSpan.className = "line-part-desc";
      descSpan.textContent = item.description || "";

      const whereDivider = document.createElement("span");
      whereDivider.className = "where-divider";
      whereDivider.style.color = "var(--number-color)";
      whereDivider.textContent = " | ";

      const whereSpan = document.createElement("span");
      whereSpan.className = "line-part-where";
      whereSpan.textContent = item.where || `"${item.name || ''} in use"`;

      lineText.appendChild(tagSpan);
      lineText.appendChild(nameSpan);
      lineText.appendChild(descDivider);
      lineText.appendChild(descSpan);
      lineText.appendChild(whereDivider);
      lineText.appendChild(whereSpan);

      lineRow.appendChild(selectDot);
      lineRow.appendChild(numSpan);
      lineRow.appendChild(lineText);
      linesHolder.appendChild(lineRow);

      globalIndex++;
    });

    groupWrapper.appendChild(groupHeader);
    groupWrapper.appendChild(linesHolder);
    refContainer.appendChild(groupWrapper);
    groupIndex++;
  }
}

// Parse Manifest for all standard tabs & paragraph formulas (e.g. V=IxR)
function parseAndLoadManifest(jsonData) {
  const items = [];
  const rawData = jsonData.milled_manifest || jsonData;

  if (rawData.feedback_log) {
    const lines = rawData.feedback_log.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('---') || trimmed.startsWith('**')) return;

      const tagMatch = trimmed.match(/^(\[[a-zA-Z0-9_\-\s]+\])\s*:\s*(.+)$/i);
      if (tagMatch) {
        const rawTag = tagMatch[1];
        const body = tagMatch[2].trim();
        const parts = body.split('–').length > 1 ? body.split('–') : body.split(' - ');
        const name = parts[0]?.trim() || "Item";
        const descAndWhere = parts.slice(1).join(' - ')?.trim() || "";

        const subParts = descAndWhere.split('|');
        const desc = subParts[0]?.trim() || "";
        const where = subParts[1]?.trim() || "";

        items.push({
          rawTag: rawTag,
          name: name,
          description: desc,
          where: where
        });
      }
    });
  } else if (Array.isArray(rawData)) {
    items.push(...rawData);
  }

  if (items.length > 0) {
    masterDataset = items;
    activeDataset = items;
    renderCoursewarePane();
  } else {
    alert("No structured items found in this file.");
  }
}

// -------------------------------------------------------------------------
// 1. HAMMER COMPARATOR ENGINE (Respects 3-State Scope)
// -------------------------------------------------------------------------
function evaluateComparator() {
  const inputs = document.querySelectorAll(".copy-slate-input-field");
  const scoreDisplay = document.getElementById("slate-score-display");
  if (inputs.length === 0 || activeDataset.length === 0) {
    alert("Please load reference lines and enter values on the slate.");
    return;
  }

  const activeMode = document.getElementById("btn-courseware-toggle")?.dataset.mode || "NOUN";

  let correctCount = 0;
  const total = activeDataset.length;

  inputs.forEach((inp, idx) => {
    const userRaw = inp.value || "";
    const targetItem = activeDataset[idx];
    if (!targetItem) return;

    let targetStringToMatch = "";
    if (activeMode === "NOUN") {
      targetStringToMatch = targetItem.name;
    } else if (activeMode === "NOUN_DESC") {
      targetStringToMatch = `${targetItem.name} ${targetItem.description || ""}`;
    } else {
      targetStringToMatch = `${targetItem.name} ${targetItem.description || ""} ${targetItem.where || ""}`;
    }

    const cleanUser = userRaw.replace(/\s+/g, " ").trim().toLowerCase();
    const cleanTarget = targetStringToMatch.replace(/\s+/g, " ").trim().toLowerCase();

    const isMatch = cleanUser.length > 0 && cleanUser === cleanTarget;
    const block = document.getElementById(`slate-block-${idx}`);

    if (isMatch) {
      correctCount++;
      if (block) block.style.borderLeft = "3px solid #00ff66";
    } else {
      if (block) block.style.borderLeft = "3px solid #ff3366";
    }
  });

  const accuracy = Math.round((correctCount / total) * 100);
  if (scoreDisplay) {
    scoreDisplay.textContent = `[ ${accuracy}% ]`;
    scoreDisplay.className = accuracy >= 80 ? "copy-slate-score-display score-pass" : "copy-slate-score-display score-fail";
  }
}

function appendNewSlateRow() {
  const slateContainer = document.getElementById("copy-slate-canvas");
  if (!slateContainer) return;

  const lineIndex = slateContainer.children.length;
  const lineNum = String(lineIndex + 1).padStart(2, '0');

  const block = document.createElement("div");
  block.className = "line-row";
  block.id = `slate-block-${lineIndex}`;
  block.style.padding = "4px 0";

  const numSpan = document.createElement("span");
  numSpan.className = "line-number";
  numSpan.textContent = `${lineNum}.`;

  const inputEl = document.createElement("input");
  inputEl.type = "text";
  inputEl.className = "copy-slate-input-field";
  inputEl.style.background = "transparent";
  inputEl.style.border = "none";
  inputEl.style.borderBottom = "1px solid var(--divider-color)";
  inputEl.style.color = "var(--board-ink)";
  inputEl.style.fontFamily = "monospace";
  inputEl.style.fontSize = "0.8rem";
  inputEl.style.width = "100%";
  inputEl.style.outline = "none";
  inputEl.placeholder = "Enter verbatim response...";

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      appendNewSlateRow();
    }
  });

  block.appendChild(numSpan);
  block.appendChild(inputEl);
  slateContainer.appendChild(block);
  inputEl.focus();
}

function initSingleLineSlate() {
  const slateContainer = document.getElementById("copy-slate-canvas");
  if (!slateContainer) return;
  slateContainer.innerHTML = "";
  appendNewSlateRow();
  const scoreDisplay = document.getElementById("slate-score-display");
  if (scoreDisplay) {
    scoreDisplay.textContent = "[ --- ]";
    scoreDisplay.className = "copy-slate-score-display";
  }
}

// -------------------------------------------------------------------------
// AUTH MODAL & PROFILE DRAWER LOGIC
// -------------------------------------------------------------------------
function initAuthSystem() {
  const authModal = document.getElementById('sst-auth-modal');
  const authTitle = document.getElementById('auth-modal-title');
  const inputEmail = document.getElementById('auth-input-email');
  const inputPass = document.getElementById('auth-input-password');
  const authError = document.getElementById('auth-error-msg');
  const btnAuthToggle = document.getElementById('btn-auth-toggle-mode');
  const btnAuthSubmit = document.getElementById('btn-auth-submit');
  const btnAuthCancel = document.getElementById('btn-auth-cancel');
  const userDisplaySpan = document.querySelector('.user-display-name');
  const profileDrawer = document.getElementById('comparator-profile-drawer');
  const userProfileTrigger = document.getElementById('comparator-user-profile-trigger');

  function updateAuthUi(session) {
    currentUserSession = session;
    if (session && session.user) {
      activeUserId = session.user.id;
      if (userDisplaySpan) userDisplaySpan.textContent = session.user.email.split('@')[0];
      loadUserPreferencesFromCloud(activeUserId);
      if (profileDrawer) {
        profileDrawer.innerHTML = `
          <a href="javascript:void(0)" class="sst-nav-link" id="btn-open-account-settings">Account Settings</a>
          <a href="javascript:void(0)" class="sst-nav-link" id="btn-auth-signout" style="color: #ff3344;">Sign Out</a>
        `;
        const btnSignOut = document.getElementById('btn-auth-signout');
        if (btnSignOut) {
          btnSignOut.addEventListener('click', async () => await supa.auth.signOut());
        }
      }
    } else {
      activeUserId = null;
      if (userDisplaySpan) userDisplaySpan.textContent = "SIGN IN";
      if (profileDrawer) {
        profileDrawer.innerHTML = `
          <a href="javascript:void(0)" class="sst-nav-link" id="btn-trigger-login">Sign In / Register</a>
          <a href="javascript:void(0)" class="sst-nav-link" id="btn-open-account-settings">Account Settings</a>
        `;
        const btnLogin = document.getElementById('btn-trigger-login');
        if (btnLogin && authModal) {
          btnLogin.addEventListener('click', () => { authModal.style.display = 'flex'; });
        }
      }
    }
  }

  if (supa) {
    supa.auth.getSession().then(({ data: { session } }) => updateAuthUi(session));
    supa.auth.onAuthStateChange((_event, session) => updateAuthUi(session));
  }

  if (btnAuthToggle && authTitle && btnAuthSubmit) {
    btnAuthToggle.addEventListener('click', () => {
      if (authMode === "LOGIN") {
        authMode = "SIGNUP";
        authTitle.textContent = "CREATE NEW ACCOUNT";
        btnAuthSubmit.textContent = "REGISTER";
        btnAuthToggle.textContent = "Already have an account? Sign In";
      } else {
        authMode = "LOGIN";
        authTitle.textContent = "ACCOUNT SIGN IN";
        btnAuthSubmit.textContent = "LOGIN";
        btnAuthToggle.textContent = "Need an account? Sign Up";
      }
      if (authError) authError.textContent = "";
    });
  }

  if (btnAuthCancel && authModal) {
    btnAuthCancel.addEventListener('click', () => {
      authModal.style.display = 'none';
      if (authError) authError.textContent = "";
    });
  }

  if (btnAuthSubmit && inputEmail && inputPass) {
    btnAuthSubmit.addEventListener('click', async () => {
      const email = inputEmail.value.trim().toLowerCase();
      const pass = inputPass.value.trim();
      if (authError) authError.textContent = "";
      if (!email || !pass) {
        if (authError) authError.textContent = "Please fill in all fields.";
        return;
      }
      btnAuthSubmit.textContent = "WAIT...";
      try {
        if (authMode === "LOGIN") {
          const { data, error } = await supa.auth.signInWithPassword({ email, password: pass });
          if (error) throw error;
          updateAuthUi(data.session);
        } else {
          const { data, error } = await supa.auth.signUp({ email, password: pass });
          if (error) throw error;
          updateAuthUi(data.session);
        }
        if (authModal) authModal.style.display = 'none';
        inputEmail.value = "";
        inputPass.value = "";
      } catch (err) {
        if (authError) authError.textContent = err.message;
      } finally {
        btnAuthSubmit.textContent = authMode === "LOGIN" ? "LOGIN" : "REGISTER";
      }
    });
  }

  if (userProfileTrigger && authModal) {
    userProfileTrigger.addEventListener('click', (e) => {
      if (!currentUserSession) {
        e.stopPropagation();
        authModal.style.display = 'flex';
      }
    });
  }
}

// -------------------------------------------------------------------------
// DOM INITIALIZATION & SAFE EVENT BINDINGS
// -------------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  initSingleLineSlate();
  renderCoursewarePane();
  applyViewportAppearance();
  initAuthSystem();

  // 1. Hook the 3-State Structure Toggler
  const btnCwToggle = document.getElementById("btn-courseware-toggle");
  if (btnCwToggle) {
    btnCwToggle.addEventListener("click", cycleCoursewareMode);
  }

  // Verbatim Toggle
  const btnToggleCheck = document.getElementById("btn-toggle-check-mode");
  if (btnToggleCheck) {
    btnToggleCheck.addEventListener("click", () => {
      checkEngineMode = checkEngineMode === "VERBATUM" ? "AI_CHECK" : "VERBATUM";
      btnToggleCheck.textContent = checkEngineMode === "VERBATUM" ? "[ VERBATUM ]" : "[ AI CHECK ]";
    });
  }

  // Navigation: Courseware vs Hammer Viewports
  const btnNavStudy = document.getElementById("btn-nav-study");
  const btnNavSlate = document.getElementById("btn-nav-slate");
  const displayStudy = document.getElementById("display-study-material");
  const displaySlate = document.getElementById("display-copy-slate");
  const displaySettings = document.getElementById("display-settings");

  if (btnNavStudy && btnNavSlate) {
    btnNavStudy.addEventListener("click", () => {
      if (displaySettings && displaySettings.style.display === "flex") {
        autoSavePreferencesOnSettingsExit();
        displaySettings.style.display = "none";
      }
      if (displayStudy) displayStudy.style.display = "block";
      if (displaySlate) displaySlate.style.display = "none";
      btnNavStudy.classList.add("active-toggle");
      btnNavSlate.classList.remove("active-toggle");
    });

    btnNavSlate.addEventListener("click", () => {
      if (displaySettings && displaySettings.style.display === "flex") {
        autoSavePreferencesOnSettingsExit();
        displaySettings.style.display = "none";
      }
      if (displayStudy) displayStudy.style.display = "none";
      if (displaySlate) displaySlate.style.display = "block";
      btnNavSlate.classList.add("active-toggle");
      btnNavStudy.classList.remove("active-toggle");
    });
  }

  // Multi-Select Operations
  const getSelectedIndices = () => {
    const selectedDots = document.querySelectorAll(".line-select-dot:checked");
    return Array.from(selectedDots).map(dot => parseInt(dot.dataset.index, 10));
  };

  const btnStudyHide = document.getElementById("btn-study-hide");
  if (btnStudyHide) {
    btnStudyHide.addEventListener("click", () => {
      const indices = new Set(getSelectedIndices());
      if (indices.size === 0) { alert("Select dots to hide."); return; }
      activeDataset = activeDataset.filter((_, idx) => !indices.has(idx));
      renderCoursewarePane();
    });
  }

  const btnStudyUnhide = document.getElementById("btn-study-unhide");
  if (btnStudyUnhide) {
    btnStudyUnhide.addEventListener("click", () => {
      activeDataset = [...masterDataset];
      renderCoursewarePane();
    });
  }

  const btnStudyDelete = document.getElementById("btn-study-delete");
  if (btnStudyDelete) {
    btnStudyDelete.addEventListener("click", () => {
      const indices = new Set(getSelectedIndices());
      if (indices.size === 0) { alert("Select dots to delete."); return; }
      if (confirm(`Delete ${indices.size} selected items permanently?`)) {
        activeDataset = activeDataset.filter((_, idx) => !indices.has(idx));
        masterDataset = masterDataset.filter((_, idx) => !indices.has(idx));
        renderCoursewarePane();
      }
    });
  }

  const btnStudySave = document.getElementById("btn-study-save");
  if (btnStudySave) {
    btnStudySave.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(masterDataset, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "milled_study_manifest.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      btnStudySave.textContent = "SAVED ✓";
      btnStudySave.style.color = "#00ff66";
      setTimeout(() => {
        btnStudySave.textContent = "SAVE";
        btnStudySave.style.color = "";
      }, 1500);
    });
  }

  // 4. SETTINGS NAVIGATION & AUTOSAVE TRIGGER (Null-guarded)
  const btnGear = document.getElementById("btn-nav-gear");

  if (btnGear && displaySettings) {
    btnGear.addEventListener("click", () => {
      const isSettingsOpen = displaySettings.style.display === "flex";
      if (isSettingsOpen) {
        autoSavePreferencesOnSettingsExit();
        displaySettings.style.display = "none";
        if (displayStudy) displayStudy.style.display = "block";
        btnGear.classList.remove("active-toggle");
      } else {
        if (displayStudy) displayStudy.style.display = "none";
        if (displaySlate) displaySlate.style.display = "none";
        displaySettings.style.display = "flex";
        btnGear.classList.add("active-toggle");
      }
    });
  }

  if (displaySettings) {
    displaySettings.addEventListener("input", () => { 
      isSettingsModified = true; 
    });
    displaySettings.addEventListener("click", (e) => {
      if (e.target && e.target.closest && e.target.closest(".theme-preset-card, .palette-dot, .swatch-dot, .text-format-btn, #btn-apply-hex")) {
        isSettingsModified = true;
      }
    });
  }

  // Settings Subcategories
  const settingsItems = document.querySelectorAll(".settings-list .settings-item");
  const subMenuTitle = document.getElementById("sub-menu-title");
  const groupBreaksControl = document.getElementById("group-breaks-control");
  const viewportAppearanceControl = document.getElementById("viewport-appearance-control");
  const colorsControl = document.getElementById("colors-control");
  const textControl = document.getElementById("text-control");

  settingsItems.forEach(item => {
    item.addEventListener("click", () => {
      settingsItems.forEach(i => i.classList.remove("active-category"));
      item.classList.add("active-category");
      const categoryName = item.getAttribute("data-category");
      if (subMenuTitle) subMenuTitle.textContent = `[ ${categoryName} Options ]`;

      if (groupBreaksControl) groupBreaksControl.style.display = categoryName === "GROUP BREAKS" ? "block" : "none";
      if (viewportAppearanceControl) viewportAppearanceControl.style.display = categoryName === "VIEWPORT APPEARANCE" ? "block" : "none";
      if (colorsControl) colorsControl.style.display = categoryName === "COLORS" ? "block" : "none";
      if (textControl) textControl.style.display = categoryName === "TEXT" ? "block" : "none";
    });
  });

  // Group Breaks Edit Field
  const displayGroupSize = document.getElementById("group-size-display");
  const editContainer = document.getElementById("group-size-edit-container");
  const inputGroupSize = document.getElementById("input-group-size");
  const btnSaveGroupSize = document.getElementById("btn-save-group-size");

  if (displayGroupSize && editContainer && inputGroupSize && btnSaveGroupSize) {
    displayGroupSize.addEventListener("click", () => {
      inputGroupSize.value = GROUP_SIZE;
      editContainer.style.display = "inline-flex";
      inputGroupSize.focus();
    });

    btnSaveGroupSize.addEventListener("click", () => {
      const val = parseInt(inputGroupSize.value, 10);
      if (!isNaN(val) && val >= 2 && val <= 50) {
        GROUP_SIZE = val;
        displayGroupSize.textContent = GROUP_SIZE;
        editContainer.style.display = "none";
        isSettingsModified = true;
        renderCoursewarePane();
      }
    });
  }

  // Theme Presets Click Handlers
  document.querySelectorAll('.theme-preset-card[data-theme]').forEach(card => {
    card.addEventListener('click', () => {
      currentThemeKey = card.getAttribute('data-theme');
      isSettingsModified = true;
      applyViewportAppearance();
    });
  });

  // Shutter Bar Hover & Auto-Collapse
  const shutterHeader = document.getElementById("workstation-shutter-header");
  const workspaceCore = document.querySelector(".workspace-core");
  let shutterTimer = null;
  function collapseShutter() {
    if (shutterHeader && workspaceCore) {
      shutterHeader.classList.add("shutter-collapsed");
      workspaceCore.classList.add("workspace-expanded");
    }
  }
  function expandShutter() {
    if (shutterHeader && workspaceCore) {
      shutterHeader.classList.remove("shutter-collapsed");
      workspaceCore.classList.remove("workspace-expanded");
    }
  }
  if (shutterHeader) {
    shutterHeader.addEventListener("mouseenter", () => { clearTimeout(shutterTimer); expandShutter(); });
    shutterHeader.addEventListener("mouseleave", () => {
      clearTimeout(shutterTimer);
      shutterTimer = setTimeout(collapseShutter, 2000);
    });
    shutterTimer = setTimeout(collapseShutter, 2000);
  }

  // Data Loading Modals
  const btnLoad = document.getElementById("btn-load-file");
  const sourceModal = document.getElementById("sst-source-modal");
  const btnCloseSource = document.getElementById("btn-close-source-modal");
  const btnChoiceLocal = document.getElementById("btn-choice-local");
  const btnChoiceCloud = document.getElementById("btn-choice-cloud");
  const selectCloudProjects = document.getElementById("select-cloud-projects");
  const fileInput = document.getElementById("json-file-input");

  if (btnLoad && sourceModal) {
    btnLoad.addEventListener("click", () => {
      populateCloudProjectsDropdown();
      sourceModal.style.display = "flex";
    });
  }
  if (btnCloseSource && sourceModal) {
    btnCloseSource.addEventListener("click", () => { sourceModal.style.display = "none"; });
  }
  if (btnChoiceLocal && fileInput) {
    btnChoiceLocal.addEventListener("click", () => {
      if (sourceModal) sourceModal.style.display = "none";
      fileInput.click();
    });
  }
  if (btnChoiceCloud && selectCloudProjects) {
    btnChoiceCloud.addEventListener("click", () => {
      const selectedId = selectCloudProjects.value;
      if (!selectedId) {
        alert("Please select a project from the cloud list.");
        return;
      }
      loadCloudProject(selectedId);
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          parseAndLoadManifest(data);
        } catch (err) {
          alert("Error parsing JSON: " + err.message);
        }
      };
      reader.readAsText(file);
    });
  }

  const btnClear = document.getElementById("btn-slate-clear");
  if (btnClear) btnClear.addEventListener("click", initSingleLineSlate);

  const btnCheck = document.getElementById("btn-check-comparator");
  if (btnCheck) {
    btnCheck.addEventListener("click", () => {
      if (checkEngineMode === "VERBATUM") {
        evaluateComparator();
      } else {
        alert("[ AI CHECK ] Dispatching slate inputs to comparison engine.");
      }
    });
  }
});
// 1. COURSEWARE 3-STATE STRUCTURE TOGGLE MODES
const CW_MODES = [
  { id: "NOUN", label: "NOUN" },
  { id: "NOUN_DESC", label: "NOUN + DESCRIPTION" },
  { id: "NOUN_DESC_APP", label: "NOUN + DESCRIPTION + APPLICATION" }
];
let currentCwModeIndex = 0;

// 3. DIMENSIONING QUESTION REPLACEMENT MAPPING
const DIMENSION_QUESTION_MAP = [
  { match: "[what]", text: "[what is/are?]" },
  { match: "[purpose]", text: "[what is the purpose of ____ to?]" },
  { match: "[objective]", text: "[what is the objective of/for/by?]" },
  { match: "[why]", text: "[why is/are ____ necessary/needed?]" },
  { match: "[use]", text: "[why do we need/use/implement?]" },
  { match: "[related]", text: "[additional related rule or principles]" },
  { match: "[id]", text: "[how or what identifies?]" }
];

// THEMES & VIEWPORT APPEARANCE ENGINE
let currentThemeKey = 'BLACK_BOARD';
let activeFrameBorder = 'WOOD';
let isSettingsModified = false;

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
  root.style.setProperty('--number-color', theme['--number-color']);
  root.style.setProperty('--divider-color', theme['--divider-color']);

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

// =========================================================================
// 1 & 2. 3-STATE TOGGLE LOGIC & VIEWPORT MODE HANDLER
// =========================================================================
function cycleCoursewareMode() {
  currentCwModeIndex = (currentCwModeIndex + 1) % CW_MODES.length;
  const activeMode = CW_MODES[currentCwModeIndex];

  const btn = document.getElementById("btn-courseware-toggle");
  const lbl = document.getElementById("courseware-mode-label");
  const displayContainer = document.getElementById("display-study-material");

  if (lbl) lbl.textContent = activeMode.label;
  if (btn) btn.dataset.mode = activeMode.id;

  if (displayContainer) {
    displayContainer.classList.remove("viewport-mode-NOUN", "viewport-mode-NOUN_DESC", "viewport-mode-NOUN_DESC_APP");
    displayContainer.classList.add(`viewport-mode-${activeMode.id}`);
  }
}

// 3. DIMENSIONING TAG PARSER & EXPANDER
function formatDimensionTagText(rawTag) {
  if (!rawTag) return "";
  const cleaned = rawTag.trim().toLowerCase();
  const entry = DIMENSION_QUESTION_MAP.find(item => item.match === cleaned);
  return entry ? entry.text : rawTag;
}

// SUPABASE AUTH & REPOSITORY ENGINE
const SUPABASE_URL = "https://lsjswxsrskaxyzvgqezu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzanN3eHNyc2theHl6dmdxZXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MzgxMTQsImV4cCI6MjA5OTIxNDExNH0._D99dnmEsQPULWcCBQcp1ThOYyzfRV4zEyMBxAPbYD8";
const supa = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

let currentUserSession = null;
let activeUserId = null;
let authMode = "LOGIN";

// =========================================================================
// 4. AUTOSAVE USER PREFERENCES TO SUPABASE ON SETTINGS EXIT
// =========================================================================
async function autoSavePreferencesOnSettingsExit() {
  if (!supa || !activeUserId || !isSettingsModified) return;

  const rootStyle = getComputedStyle(document.documentElement);
  const currentPreferences = {
    user_id: activeUserId,
    board_theme: currentThemeKey,
    console_frame: activeFrameBorder,
    group_size: GROUP_SIZE,
    custom_colors: {
      part_tag: rootStyle.getPropertyValue('--color-part-tag').trim(),
      part_name: rootStyle.getPropertyValue('--color-part-name').trim(),
      part_desc: rootStyle.getPropertyValue('--color-part-desc').trim(),
      part_where: rootStyle.getPropertyValue('--color-part-where').trim()
    },
    updated_at: new Date().toISOString()
  };

  try {
    const { error } = await supa
      .from('user_preferences')
      .upsert(currentPreferences, { onConflict: 'user_id' });

    if (error) {
      console.warn("Autosave preferences failure:", error.message);
    } else {
      isSettingsModified = false;
      console.log("User preferences synchronized to Supabase.");
    }
  } catch (err) {
    console.error("Autosave runtime exception:", err);
  }
}

async function loadUserPreferencesFromCloud(userId) {
  if (!supa || !userId) return;

  try {
    const { data: prefs, error } = await supa
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (prefs) {
      if (prefs.board_theme) currentThemeKey = prefs.board_theme;
      if (prefs.console_frame) activeFrameBorder = prefs.console_frame;
      if (prefs.group_size) {
        GROUP_SIZE = prefs.group_size;
        const disp = document.getElementById("group-size-display");
        if (disp) disp.textContent = GROUP_SIZE;
      }
      if (prefs.custom_colors) {
        const root = document.documentElement;
        if (prefs.custom_colors.part_tag) root.style.setProperty('--color-part-tag', prefs.custom_colors.part_tag);
        if (prefs.custom_colors.part_name) root.style.setProperty('--color-part-name', prefs.custom_colors.part_name);
        if (prefs.custom_colors.part_desc) root.style.setProperty('--color-part-desc', prefs.custom_colors.part_desc);
        if (prefs.custom_colors.part_where) root.style.setProperty('--color-part-where', prefs.custom_colors.part_where);
      }
      applyViewportAppearance();
    }
  } catch (err) {
    console.warn("Could not load cloud user preferences:", err.message);
  }
}

async function populateCloudProjectsDropdown() {
  const dropdown = document.getElementById('select-cloud-projects');
  if (!dropdown || !supa) return;

  dropdown.innerHTML = '<option value="">Scanning cloud projects...</option>';

  try {
    const { data: { user } } = await supa.auth.getUser();
    if (!user) {
      dropdown.innerHTML = '<option value="">Please sign in to view cloud projects</option>';
      return;
    }

    const { data: items, error } = await supa
      .from('study_items')
      .select('id, title, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    dropdown.innerHTML = '';
    if (!items || items.length === 0) {
      dropdown.innerHTML = '<option value="">No projects found in database</option>';
      return;
    }

    items.forEach(proj => {
      const opt = document.createElement('option');
      opt.value = proj.id;
      const dateStr = new Date(proj.created_at).toLocaleDateString();
      opt.textContent = `${proj.title || 'Untitled'} (${dateStr})`;
      dropdown.appendChild(opt);
    });

  } catch (err) {
    console.error("Database error:", err);
    dropdown.innerHTML = '<option value="">Error listing projects</option>';
  }
}

async function loadCloudProject(projectId) {
  if (!supa || !projectId) return;

  try {
    const { data: row, error } = await supa
      .from('study_items')
      .select('*')
      .eq('id', projectId)
      .single();

    if (error) throw error;
    if (!row || !row.payload) {
      alert("Selected project has an empty payload.");
      return;
    }

    parseAndLoadManifest(row.payload);
    const sourceModal = document.getElementById('sst-source-modal');
    if (sourceModal) sourceModal.style.display = 'none';

  } catch (err) {
    alert(`Cloud Load Error: ${err.message}`);
    console.error(err);
  }
}

// STENO COMPILER
const REPLACEMENTS = [
  { p: /≤/g, l: " \\leq " }, { p: /≥/g, l: " \\geq " }, { p: /≠/g, l: " \\neq " },
  { p: /≈/g, l: " \\approx " }, { p: /±/g, l: " \\pm " }, { p: /∠/g, l: " \\angle " },
  { p: /⊥/g, l: " \\perp " }, { p: /∥/g, l: " \\parallel " }, { p: /≅/g, l: " \\cong " },
  { p: /Δ/g, l: " \\Delta " }, { p: /π/g, l: " \\pi " }, { p: /∏/g, l: " \\prod " },
  { p: /∞/g, l: " \\infty " }, { p: /∈/g, l: " \\in " }, { p: /∅/g, l: " \\emptyset " },
  { p: /∪/g, l: " \\cup " }, { p: /∩/g, l: " \\cap " }, { p: /∀/g, l: " \\forall " },
  { p: /∃/g, l: " \\exists " }, { p: /α/g, l: " \\alpha " }, { p: /β/g, l: " \\beta " },
  { p: /θ/g, l: " \\theta " }, { p: /λ/g, l: " \\lambda " }, { p: /γ/g, l: " \\gamma " },
  { p: /σ/g, l: " \\sigma " }, { p: /Ω/g, l: " \\Omega " }, { p: /ω/g, l: " \\omega " },
  { p: /μ/g, l: " \\mu " }, { p: /ρ/g, l: " \\rho " }, { p: /κ/g, l: " \\kappa " },
  { p: /ζ/g, l: " \\zeta " }, { p: /⊂/g, l: " \\subset " }, { p: /…/g, l: " \\dots " },
  { p: /∇/g, l: " \\nabla " }, { p: /∂/g, l: " \\partial " }, { p: /′/g, l: "^{\\prime}" }
];

function compileLatex(raw) {
  if (!raw) return "";
  let l = raw;
  l = l.replace(/\|_\{([^}]*)\}\^\{([^}]*)\}/g, "\\Big|_{$1}^{$2}");
  l = l.replace(/\|_\{([^}]*)\}/g, "\\Big|_{$1}");
  l = l.replace(/(\d+)√\[([^\]]*)\]/g, "\\sqrt[$1]{$2}");
  l = l.replace(/√\[([^\]]*)\]/g, "\\sqrt{$1}");
  l = l.replace(/(\d+)√\[([^\]]*)$/g, "\\sqrt[$1]{$2}");
  l = l.replace(/√\[([^\]]*)$/g, "\\sqrt{$1}");
  l = l.replace(/\(([^)]+)\)\/\{([^}]*)\}/g, "\\frac{$1}{$2}");
  l = l.replace(/([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)/g, "\\frac{$1}{$2}");
  REPLACEMENTS.forEach(r => { l = l.replace(r.p, r.l); });
  const ob = (l.match(/\{/g) || []).length, cb = (l.match(/\}/g) || []).length;
  if (ob > cb) l += "}".repeat(ob - cb);
  return l;
}

function normalizeMathForComparison(str) {
  if (!str) return "";
  let clean = String(str).trim();
  clean = clean.replace(/^\$\$?/, '').replace(/\$\$?$/, '').trim();
  clean = clean
      .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1 / $2)')
      .replace(/\\cdot|\\times/g, '*')
      .replace(/\\approx/g, '≈')
      .replace(/\\pm/g, '±')
      .replace(/\\left|\\right/g, '')
      .replace(/[{}]/g, '');
  clean = clean
      .replace(/\s*=\s*/g, ' = ').replace(/\s*\/\s*/g, ' / ').replace(/\s*\*\s*/g, ' * ')
      .replace(/\s*\+\s*/g, ' + ').replace(/\s*-\s*/g, ' - ').replace(/\s+/g, ' ');
  return clean.toLowerCase();
}

function applyActiveFilter() {
  if (currentFilterMode === "MATH") {
    activeFormulaDataset = masterDataset.filter(item => item.type === "MATH");
  } else {
    activeFormulaDataset = masterDataset.filter(item => item.type === "FORMULA");
  }
  renderMathReferencePane();
}

function renderMathReferencePane() {
  const refContainer = document.getElementById("00_SUMMARY");
  if (!refContainer) return;
  refContainer.innerHTML = "";

  if (activeFormulaDataset.length === 0) {
    refContainer.innerHTML = `<div style="color: var(--number-color); padding: 15px;">[ NO ${currentFilterMode} LOADED - CLICK LOAD ]</div>`;
    return;
  }

  let globalIndex = 0;
  let groupIndex = 1;
  const totalItems = activeFormulaDataset.length;

  for (let i = 0; i < totalItems; i += GROUP_SIZE) {
    const chunk = activeFormulaDataset.slice(i, i + GROUP_SIZE);
    const startNum = i + 1;
    const endNum = Math.min(i + GROUP_SIZE, totalItems);

    const groupWrapper = document.createElement("div");
    groupWrapper.className = "line-group open";
    groupWrapper.id = `group-wrapper-${groupIndex}`;

    const groupHeader = document.createElement("div");
    groupHeader.className = "group-header";
    groupHeader.innerHTML = `<span>GROUP ${groupIndex} <span class="group-range">(${String(startNum).padStart(2, '0')}-${String(endNum).padStart(2, '0')})</span></span>`;
    
    groupHeader.addEventListener("click", () => {
      groupWrapper.classList.toggle("open");
    });

    const linesHolder = document.createElement("div");
    linesHolder.className = "group-lines";

    chunk.forEach((item) => {
      const currentIndex = globalIndex;
      const lineNum = String(currentIndex + 1).padStart(2, '0');

      const lineRow = document.createElement("div");
      lineRow.className = "line-row";
      lineRow.dataset.index = currentIndex;

      const selectDot = document.createElement("input");
      selectDot.type = "checkbox";
      selectDot.className = "line-select-dot";
      selectDot.dataset.index = currentIndex;

      const numSpan = document.createElement("span");
      numSpan.className = "line-number";
      numSpan.textContent = `${lineNum}.`;

      const lineText = document.createElement("div");
      lineText.className = "line-text";

      // 3. Apply Tag Conversion
      const displayTag = formatDimensionTagText(item.rawTag || "[WHAT]");
      const isWhatTag = (item.rawTag || "").toLowerCase() === "[what]";

      const tagSpan = document.createElement("span");
      tagSpan.className = `line-part-tag ${isWhatTag ? 'tag-what' : ''} dim-expanded-tag`;
      tagSpan.textContent = `${displayTag} `;

      const nameSpan = document.createElement("span");
      nameSpan.className = "line-part-name";
      nameSpan.textContent = item.name || "Item";

      const descDivider = document.createElement("span");
      descDivider.className = "desc-divider";
      descDivider.style.color = "var(--number-color)";
      descDivider.textContent = " | ";

      const descSpan = document.createElement("span");
      descSpan.className = "line-part-desc";
      descSpan.textContent = item.description || (item.latex || "");

      const whereDivider = document.createElement("span");
      whereDivider.className = "where-divider";
      whereDivider.style.color = "var(--number-color)";
      whereDivider.textContent = " | ";

      const whereSpan = document.createElement("span");
      whereSpan.className = "line-part-where";
      whereSpan.textContent = item.where || `"${item.name || ''} in use"`;

      lineText.appendChild(tagSpan);
      lineText.appendChild(nameSpan);
      lineText.appendChild(descDivider);
      lineText.appendChild(descSpan);
      lineText.appendChild(whereDivider);
      lineText.appendChild(whereSpan);

      lineRow.appendChild(selectDot);
      lineRow.appendChild(numSpan);
      lineRow.appendChild(lineText);
      linesHolder.appendChild(lineRow);

      globalIndex++;
    });

    groupWrapper.appendChild(groupHeader);
    groupWrapper.appendChild(linesHolder);
    refContainer.appendChild(groupWrapper);
    groupIndex++;
  }
}

function parseAndLoadManifest(jsonData) {
  const items = [];
  const rawData = jsonData.milled_manifest || jsonData;

  if (rawData.feedback_log) {
    const lines = rawData.feedback_log.split('\n');
    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('---') || trimmed.startsWith('**')) return;

      const tagMatch = trimmed.match(/^(\[[a-zA-Z0-9_\-\s]+\])\s*:\s*(.+)$/i);
      const isMath = trimmed.match(/^\[?(MATH)\]?\s*:\s*(.+)$/i);
      const isFormula = trimmed.match(/^\[?(FORMULA)\]?\s*:\s*(.+)$/i);
      const isEquationRule = trimmed.match(/^\[?(RULE\vert{}OUTPUT)\]?\s*:\s*(.+)$/i);

      if (tagMatch) {
        const rawTag = tagMatch[1];
        const body = tagMatch[2].trim();
        const parts = body.split('–').length > 1 ? body.split('–') : body.split(' - ');
        const name = parts[0].trim();
        const desc = parts.slice(1).join(' - ').trim();
        items.push({ rawTag: rawTag, name: name, description: desc, latex: desc, type: "MATH" });
      } else if (isMath) {
        const content = isMath[2].trim();
        items.push({ rawTag: "[WHAT]", name: "Math Element", latex: content, description: content, type: "MATH" });
      } else if (isFormula) {
        const content = isFormula[2].trim();
        let name = "Formula";
        let formulaStr = content;
        if (content.includes('–')) {
          const parts = content.split('–');
          name = parts[0].trim();
          formulaStr = parts.slice(1).join('–').trim();
        } else if (content.includes(' - ')) {
          const parts = content.split(' - ');
          name = parts[0].trim();
          formulaStr = parts.slice(1).join(' - ').trim();
        }
        items.push({ rawTag: "[FORMULA]", name: name, latex: formulaStr, description: formulaStr, type: "FORMULA" });
      } else if (isEquationRule) {
        const content = isEquationRule[2].trim();
        items.push({ rawTag: "[RULE]", name: "Equation", latex: content, description: content, type: "MATH" });
      }
    });
  }

  if (items.length > 0) {
    masterDataset = items;
    applyActiveFilter();
  } else {
    alert("No mathematical rules or formulas detected in this manifest.");
  }
}

// =========================================================================
// 1. HAMMER COMPARATOR EVALUATION (EXCLUDES HIDDEN TOKENS)
// =========================================================================
function evaluateMathComparator() {
  const inputs = document.querySelectorAll(".math-steno-in");
  const scoreDisplay = document.getElementById("slate-score-display");
  if (inputs.length === 0 || activeFormulaDataset.length === 0) {
    alert("Please load reference lines and enter values on the slate.");
    return;
  }

  // Read the active 3-state toggle mode
  const activeMode = document.getElementById("btn-courseware-toggle")?.dataset.mode || "NOUN";

  let correctCount = 0;
  const total = activeFormulaDataset.length;

  inputs.forEach((inp, idx) => {
    const userRaw = inp.dataset.rawFormula || inp.value || "";
    const targetItem = activeFormulaDataset[idx];
    if (!targetItem) return;

    let targetStringToMatch = "";
    if (activeMode === "NOUN") {
      // Only verify the Noun
      targetStringToMatch = targetItem.name;
    } else if (activeMode === "NOUN_DESC") {
      // Verify Noun + Description
      targetStringToMatch = `${targetItem.name} ${targetItem.description || targetItem.latex || ""}`;
    } else {
      // NOUN_DESC_APP: Verify Full Line
      targetStringToMatch = `${targetItem.name} ${targetItem.description || targetItem.latex || ""} ${targetItem.where || ""}`;
    }

    const cleanUser = userRaw.replace(/\s+/g, " ").trim().toLowerCase();
    const cleanTarget = targetStringToMatch.replace(/\s+/g, " ").trim().toLowerCase();

    const isMatch = cleanUser.length > 0 && cleanUser === cleanTarget;
    const block = document.getElementById(`math-slate-block-${idx}`);

    if (isMatch) {
      correctCount++;
      if (block) block.style.borderLeft = "3px solid #00ff66";
    } else {
      if (block) block.style.borderLeft = "3px solid #ff3366";
    }
  });

  const accuracy = Math.round((correctCount / total) * 100);
  if (scoreDisplay) {
    scoreDisplay.textContent = `[ ${accuracy}% ]`;
    scoreDisplay.className = accuracy >= 80 ? "copy-slate-score-display score-pass" : "copy-slate-score-display score-fail";
  }
}

// SLATE ROW GENERATOR
function appendNewSlateRow() {
  const slateContainer = document.getElementById("copy-slate-canvas");
  if (!slateContainer) return;

  currentSlateLineCount++;
  const lineIndex = currentSlateLineCount - 1;
  const lineNum = String(currentSlateLineCount).padStart(2, '0');

  const block = document.createElement("div");
  block.className = "line-row";
  block.id = `math-slate-block-${lineIndex}`;
  block.style.padding = "4px 0";

  const numSpan = document.createElement("span");
  numSpan.className = "line-number";
  numSpan.textContent = `${lineNum}.`;

  const stenoIn = document.createElement("input");
  stenoIn.type = "text";
  stenoIn.className = "math-steno-in";
  stenoIn.style.background = "transparent";
  stenoIn.style.border = "none";
  stenoIn.style.borderBottom = "1px solid var(--divider-color)";
  stenoIn.style.color = "var(--board-ink)";
  stenoIn.style.fontFamily = "monospace";
  stenoIn.style.width = "100%";
  stenoIn.placeholder = "Enter response...";

  stenoIn.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      appendNewSlateRow();
    }
  });

  block.appendChild(numSpan);
  block.appendChild(stenoIn);
  slateContainer.appendChild(block);
  stenoIn.focus();
}

function initSingleLineSlate() {
  const slateContainer = document.getElementById("copy-slate-canvas");
  if (!slateContainer) return;
  slateContainer.innerHTML = "";
  currentSlateLineCount = 0;
  appendNewSlateRow();
  const scoreDisplay = document.getElementById("slate-score-display");
  if (scoreDisplay) {
    scoreDisplay.textContent = "[ --- ]";
    scoreDisplay.className = "copy-slate-score-display";
  }
}

// AUTH SYSTEM INITIALIZER
function initAuthSystem() {
  const authModal = document.getElementById('sst-auth-modal');
  const authTitle = document.getElementById('auth-modal-title');
  const inputEmail = document.getElementById('auth-input-email');
  const inputPass = document.getElementById('auth-input-password');
  const authError = document.getElementById('auth-error-msg');
  const btnAuthToggle = document.getElementById('btn-auth-toggle-mode');
  const btnAuthSubmit = document.getElementById('btn-auth-submit');
  const btnAuthCancel = document.getElementById('btn-auth-cancel');
  const userDisplaySpan = document.querySelector('.user-display-name');
  const profileDrawer = document.getElementById('comparator-profile-drawer');
  const userProfileTrigger = document.getElementById('comparator-user-profile-trigger');

  function updateAuthUi(session) {
    currentUserSession = session;
    if (session && session.user) {
      activeUserId = session.user.id;
      if (userDisplaySpan) userDisplaySpan.textContent = session.user.email.split('@')[0];
      loadUserPreferencesFromCloud(activeUserId);
      if (profileDrawer) {
        profileDrawer.innerHTML = `
          <a href="javascript:void(0)" class="sst-nav-link" id="btn-open-account-settings">Account Settings</a>
          <a href="javascript:void(0)" class="sst-nav-link" id="btn-auth-signout" style="color: #ff3344;">Sign Out</a>
        `;
        const btnSignOut = document.getElementById('btn-auth-signout');
        if (btnSignOut) {
          btnSignOut.addEventListener('click', async () => await supa.auth.signOut());
        }
      }
    } else {
      activeUserId = null;
      if (userDisplaySpan) userDisplaySpan.textContent = "SIGN IN";
      if (profileDrawer) {
        profileDrawer.innerHTML = `
          <a href="javascript:void(0)" class="sst-nav-link" id="btn-trigger-login">Sign In / Register</a>
          <a href="javascript:void(0)" class="sst-nav-link" id="btn-open-account-settings">Account Settings</a>
        `;
        const btnLogin = document.getElementById('btn-trigger-login');
        if (btnLogin && authModal) {
          btnLogin.addEventListener('click', () => { authModal.style.display = 'flex'; });
        }
      }
    }
  }

  if (supa) {
    supa.auth.getSession().then(({ data: { session } }) => updateAuthUi(session));
    supa.auth.onAuthStateChange((_event, session) => updateAuthUi(session));
  }

  if (btnAuthToggle) {
    btnAuthToggle.addEventListener('click', () => {
      if (authMode === "LOGIN") {
        authMode = "SIGNUP";
        authTitle.textContent = "CREATE NEW ACCOUNT";
        btnAuthSubmit.textContent = "REGISTER";
        btnAuthToggle.textContent = "Already have an account? Sign In";
      } else {
        authMode = "LOGIN";
        authTitle.textContent = "ACCOUNT SIGN IN";
        btnAuthSubmit.textContent = "LOGIN";
        btnAuthToggle.textContent = "Need an account? Sign Up";
      }
      authError.textContent = "";
    });
  }

  if (btnAuthCancel && authModal) {
    btnAuthCancel.addEventListener('click', () => {
      authModal.style.display = 'none';
      authError.textContent = "";
    });
  }

  if (btnAuthSubmit) {
    btnAuthSubmit.addEventListener('click', async () => {
      const email = inputEmail.value.trim().toLowerCase();
      const pass = inputPass.value.trim();
      authError.textContent = "";
      if (!email || !pass) {
        authError.textContent = "Please fill in all fields.";
        return;
      }
      btnAuthSubmit.textContent = "WAIT...";
      try {
        if (authMode === "LOGIN") {
          const { data, error } = await supa.auth.signInWithPassword({ email, password: pass });
          if (error) throw error;
          updateAuthUi(data.session);
        } else {
          const { data, error } = await supa.auth.signUp({ email, password: pass });
          if (error) throw error;
          updateAuthUi(data.session);
        }
        authModal.style.display = 'none';
        inputEmail.value = "";
        inputPass.value = "";
      } catch (err) {
        authError.textContent = err.message;
      } finally {
        btnAuthSubmit.textContent = authMode === "LOGIN" ? "LOGIN" : "REGISTER";
      }
    });
  }

  if (userProfileTrigger && authModal) {
    userProfileTrigger.addEventListener('click', (e) => {
      if (!currentUserSession) {
        e.stopPropagation();
        authModal.style.display = 'flex';
      }
    });
  }
}

// SWITCH STUDY TABS
function switchStudyTab(evt, tabId) {
  document.querySelectorAll('.study-tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.study-tab-button').forEach(b => b.classList.remove('active-study-tab'));
  const targetPane = document.getElementById(tabId);
  if (targetPane) targetPane.classList.add('active');
  if (evt && evt.currentTarget) evt.currentTarget.classList.add('active-study-tab');
}
window.switchStudyTab = switchStudyTab;

// =========================================================================
// DOM INITIALIZATION
// =========================================================================
document.addEventListener("DOMContentLoaded", () => {
  initSingleLineSlate();
  renderMathReferencePane();
  applyViewportAppearance();
  initAuthSystem();

  // 1. Hook the 3-State Structure Toggler
  const btnCwToggle = document.getElementById("btn-courseware-toggle");
  if (btnCwToggle) {
    btnCwToggle.addEventListener("click", cycleCoursewareMode);
  }

  // Verbatim Toggle
  const btnToggleCheck = document.getElementById("btn-toggle-check-mode");
  if (btnToggleCheck) {
    btnToggleCheck.addEventListener("click", () => {
      checkEngineMode = checkEngineMode === "VERBATUM" ? "AI_CHECK" : "VERBATUM";
      btnToggleCheck.textContent = checkEngineMode === "VERBATUM" ? "[ VERBATUM ]" : "[ AI CHECK ]";
    });
  }

  // Navigation: Courseware vs Hammer
  const btnNavStudy = document.getElementById("btn-nav-study");
  const btnNavSlate = document.getElementById("btn-nav-slate");
  const displayStudy = document.getElementById("display-study-material");
  const displaySlate = document.getElementById("display-copy-slate");
  const displaySettings = document.getElementById("display-settings");

  if (btnNavStudy && btnNavSlate) {
    btnNavStudy.addEventListener("click", () => {
      if (displaySettings.style.display === "flex") {
        autoSavePreferencesOnSettingsExit();
        displaySettings.style.display = "none";
      }
      displayStudy.style.display = "block";
      displaySlate.style.display = "none";
      btnNavStudy.classList.add("active-toggle");
      btnNavSlate.classList.remove("active-toggle");
    });

    btnNavSlate.addEventListener("click", () => {
      if (displaySettings.style.display === "flex") {
        autoSavePreferencesOnSettingsExit();
        displaySettings.style.display = "none";
      }
      displayStudy.style.display = "none";
      displaySlate.style.display = "block";
      btnNavSlate.classList.add("active-toggle");
      btnNavStudy.classList.remove("active-toggle");
    });
  }

  // Multi-Select Operations
  const getSelectedIndices = () => {
    const selectedDots = document.querySelectorAll(".line-select-dot:checked");
    return Array.from(selectedDots).map(dot => parseInt(dot.dataset.index, 10));
  };

  const btnStudyHide = document.getElementById("btn-study-hide");
  if (btnStudyHide) {
    btnStudyHide.addEventListener("click", () => {
      const indices = new Set(getSelectedIndices());
      if (indices.size === 0) { alert("Select dots to hide."); return; }
      activeFormulaDataset = activeFormulaDataset.filter((_, idx) => !indices.has(idx));
      renderMathReferencePane();
    });
  }

  const btnStudyUnhide = document.getElementById("btn-study-unhide");
  if (btnStudyUnhide) {
    btnStudyUnhide.addEventListener("click", () => {
      applyActiveFilter();
    });
  }

  const btnStudyDelete = document.getElementById("btn-study-delete");
  if (btnStudyDelete) {
    btnStudyDelete.addEventListener("click", () => {
      const indices = new Set(getSelectedIndices());
      if (indices.size === 0) { alert("Select dots to delete."); return; }
      if (confirm(`Delete ${indices.size} selected items permanently?`)) {
        activeFormulaDataset = activeFormulaDataset.filter((_, idx) => !indices.has(idx));
        masterDataset = masterDataset.filter((_, idx) => !indices.has(idx));
        renderMathReferencePane();
      }
    });
  }

  const btnStudySave = document.getElementById("btn-study-save");
  if (btnStudySave) {
    btnStudySave.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(masterDataset, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "milled_study_manifest.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      btnStudySave.textContent = "SAVED ✓";
      btnStudySave.style.color = "#00ff66";
      setTimeout(() => {
        btnStudySave.textContent = "SAVE";
        btnStudySave.style.color = "";
      }, 1500);
    });
  }

  // 4. SETTINGS PANEL NAVIGATION & AUTOSAVE CONTROLLER
  const btnGear = document.getElementById("btn-nav-gear");

  if (btnGear && displaySettings) {
    btnGear.addEventListener("click", () => {
      const isSettingsOpen = displaySettings.style.display === "flex";
      if (isSettingsOpen) {
        // Exiting Settings -> Autosave to user_preferences
        autoSavePreferencesOnSettingsExit();

        displaySettings.style.display = "none";
        displayStudy.style.display = "block";
        btnGear.classList.remove("active-toggle");
      } else {
        displayStudy.style.display = "none";
        displaySlate.style.display = "none";
        displaySettings.style.display = "flex";
        btnGear.classList.add("active-toggle");
      }
    });
  }

  // Mark Settings as Dirty on Any Change
  if (displaySettings) {
    displaySettings.addEventListener("input", () => { isSettingsModified = true; });
    displaySettings.addEventListener("click", (e) => {
      if (e.target.closest(".theme-preset-card, .palette-dot, .swatch-dot, .text-format-btn, #btn-apply-hex")) {
        isSettingsModified = true;
      }
    });
  }

  // Settings Sub-Tabs
  const settingsItems = document.querySelectorAll(".settings-list .settings-item");
  const subMenuTitle = document.getElementById("sub-menu-title");
  const groupBreaksControl = document.getElementById("group-breaks-control");
  const viewportAppearanceControl = document.getElementById("viewport-appearance-control");
  const colorsControl = document.getElementById("colors-control");
  const textControl = document.getElementById("text-control");

  settingsItems.forEach(item => {
    item.addEventListener("click", () => {
      settingsItems.forEach(i => i.classList.remove("active-category"));
      item.classList.add("active-category");
      const categoryName = item.getAttribute("data-category");
      if (subMenuTitle) subMenuTitle.textContent = `[ ${categoryName} Options ]`;

      if (groupBreaksControl) groupBreaksControl.style.display = categoryName === "GROUP BREAKS" ? "block" : "none";
      if (viewportAppearanceControl) viewportAppearanceControl.style.display = categoryName === "VIEWPORT APPEARANCE" ? "block" : "none";
      if (colorsControl) colorsControl.style.display = categoryName === "COLORS" ? "block" : "none";
      if (textControl) textControl.style.display = categoryName === "TEXT" ? "block" : "none";
    });
  });

  // Group Breaks Slider
  const displayGroupSize = document.getElementById("group-size-display");
  const editContainer = document.getElementById("group-size-edit-container");
  const inputGroupSize = document.getElementById("input-group-size");
  const btnSaveGroupSize = document.getElementById("btn-save-group-size");

  if (displayGroupSize && editContainer && inputGroupSize) {
    displayGroupSize.addEventListener("click", () => {
      inputGroupSize.value = GROUP_SIZE;
      editContainer.style.display = "inline-flex";
      inputGroupSize.focus();
    });

    btnSaveGroupSize.addEventListener("click", () => {
      const val = parseInt(inputGroupSize.value, 10);
      if (!isNaN(val) && val >= 2 && val <= 50) {
        GROUP_SIZE = val;
        displayGroupSize.textContent = GROUP_SIZE;
        editContainer.style.display = "none";
        isSettingsModified = true;
        renderMathReferencePane();
      }
    });
  }

  // Theme Presets Click Handlers
  document.querySelectorAll('.theme-preset-card[data-theme]').forEach(card => {
    card.addEventListener('click', () => {
      currentThemeKey = card.getAttribute('data-theme');
      isSettingsModified = true;
      applyViewportAppearance();
    });
  });

  // Top Shutter Bar
  const shutterHeader = document.getElementById("workstation-shutter-header");
  const workspaceCore = document.querySelector(".workspace-core");
  let shutterTimer = null;
  function collapseShutter() {
    if (shutterHeader && workspaceCore) {
      shutterHeader.classList.add("shutter-collapsed");
      workspaceCore.classList.add("workspace-expanded");
    }
  }
  function expandShutter() {
    if (shutterHeader && workspaceCore) {
      shutterHeader.classList.remove("shutter-collapsed");
      workspaceCore.classList.remove("workspace-expanded");
    }
  }
  if (shutterHeader) {
    shutterHeader.addEventListener("mouseenter", () => { clearTimeout(shutterTimer); expandShutter(); });
    shutterHeader.addEventListener("mouseleave", () => {
      clearTimeout(shutterTimer);
      shutterTimer = setTimeout(collapseShutter, 2000);
    });
    shutterTimer = setTimeout(collapseShutter, 2000);
  }

  // File Loading & Data Modal Hooks
  const btnLoad = document.getElementById("btn-load-file");
  const sourceModal = document.getElementById("sst-source-modal");
  const btnCloseSource = document.getElementById("btn-close-source-modal");
  const btnChoiceLocal = document.getElementById("btn-choice-local");
  const btnChoiceCloud = document.getElementById("btn-choice-cloud");
  const selectCloudProjects = document.getElementById("select-cloud-projects");
  const fileInput = document.getElementById("json-file-input");

  if (btnLoad && sourceModal) {
    btnLoad.addEventListener("click", () => {
      populateCloudProjectsDropdown();
      sourceModal.style.display = "flex";
    });
  }
  if (btnCloseSource && sourceModal) {
    btnCloseSource.addEventListener("click", () => { sourceModal.style.display = "none"; });
  }
  if (btnChoiceLocal && fileInput) {
    btnChoiceLocal.addEventListener("click", () => {
      sourceModal.style.display = "none";
      fileInput.click();
    });
  }
  if (btnChoiceCloud && selectCloudProjects) {
    btnChoiceCloud.addEventListener("click", () => {
      const selectedId = selectCloudProjects.value;
      if (!selectedId) {
        alert("Please select a project from the cloud list.");
        return;
      }
      loadCloudProject(selectedId);
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          parseAndLoadManifest(data);
        } catch (err) {
          alert("Error parsing JSON: " + err.message);
        }
      };
      reader.readAsText(file);
    });
  }

  const btnClear = document.getElementById("btn-slate-clear");
  if (btnClear) btnClear.addEventListener("click", initSingleLineSlate);

  const btnCheck = document.getElementById("btn-check-comparator");
  if (btnCheck) {
    btnCheck.addEventListener("click", () => {
      if (checkEngineMode === "VERBATUM") {
        evaluateMathComparator();
      } else {
        alert("[ AI CHECK ] Dispatching slate inputs to comparison engine.");
      }
    });
  }
});
