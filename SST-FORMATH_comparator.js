// ==========================================
// SST MATH & FORMULA HAMMER WORKSTATION ENGINE
// ==========================================

let masterDataset = [];
let activeFormulaDataset = [];
let currentFilterMode = "MATH"; // "MATH" or "FORMULA"
let currentSlateLineCount = 0;
let activeSlateInput = null;

let GROUP_SIZE = 10;
let checkEngineMode = "VERBATUM";

// THEMES & VIEWPORT APPEARANCE ENGINE
let currentThemeKey = 'BLACK_BOARD';
let activeFrameBorder = 'WOOD';

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

// SUPABASE AUTH & CLOUD LISTING
const SUPABASE_URL = "https://lsjswxsrskaxyzvgqezu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzanN3eHNyc2theHl6dmdxZXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MzgxMTQsImV4cCI6MjA5OTIxNDExNH0._D99dnmEsQPULWcCBQcp1ThOYyzfRV4zEyMBxAPbYD8";
const supa = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

let currentUserSession = null;
let activeUserId = null;
let authMode = "LOGIN";

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

// STENO 37 KEYBOARD DATA
const HOLD_KEYS = [
  { key: "1", sym: "∠" }, { key: "2", sym: "⊥" }, { key: "3", sym: "∥" },
  { key: "4", sym: "≅" }, { key: "5", sym: "Δ" }, { key: "6", sym: "^", type: "st" },
  { key: "7", sym: "∈" }, { key: "8", sym: "∞" }, { key: "9", sym: "∏" }, { key: "0", sym: "∅" }
];
const ROW1_L = [{ key: "`", sym: "≈" }];
const ROW1_R = [{ key: "-", sym: "±" }, { key: "=", sym: "≠" }];
const BASE_QWERTY = [
  [
    { key: "Q", sym: "|", type: "op" }, { key: "W", sym: "ω" }, { key: "E", sym: "e" }, { key: "R", sym: "ρ" },
    { key: "T", sym: "θ" }, { key: "Y", sym: "σ" }, { key: "U", sym: "∪" }, { key: "I", sym: "∫", type: "op" },
    { key: "O", sym: "Ω" }, { key: "P", sym: "π" }, { key: "[", sym: "sub", type: "st" },
    { key: "]", sym: "norm", type: "st" }, { key: "\\", sym: "√", type: "st" }
  ],
  [
    { key: "A", sym: "α" }, { key: "S", sym: "∑", type: "op" }, { key: "D", sym: "∂" }, { key: "F", sym: "∀" },
    { key: "G", sym: "γ" }, { key: "H", sym: "ℏ" }, { key: "J", sym: "j" }, { key: "K", sym: "κ" },
    { key: "L", sym: "λ" }, { key: ";", sym: "…" }, { key: "'", sym: "′" }
  ],
  [
    { key: "Z", sym: "ζ" }, { key: "X", sym: "∃" }, { key: "C", sym: "⊂" }, { key: "V", sym: "∇" },
    { key: "B", sym: "β" }, { key: "N", sym: "∩" }, { key: "M", sym: "μ" }, { key: ",", sym: "≤" },
    { key: ".", sym: "≥" }, { key: "/", sym: "÷", type: "st" }
  ]
];
const SHIFT_LAYOUT = [
  [
    { key: "~", sym: "∼" }, { key: "!", sym: "!" }, { key: "@", sym: "°" }, { key: "#", sym: "#" },
    { key: "$", sym: "$" }, { key: "%", sym: "%" }, { key: "^", sym: "v̂ / ℝ", type: "st" }, { key: "&", sym: "∧" },
    { key: "*", sym: "×" }, { key: "(", sym: "(" }, { key: ")", sym: ")" }, { key: "_", sym: "—" }, { key: "+", sym: "∓" }
  ],
  [
    { key: "Q", sym: "‖" }, { key: "W", sym: "W" }, { key: "E", sym: "Ɛ" }, { key: "R", sym: "ℝ" },
    { key: "T", sym: "Θ" }, { key: "Y", sym: "Σ" }, { key: "U", sym: "⋃" }, { key: "I", sym: "∬" },
    { key: "O", sym: "Ω" }, { key: "P", sym: "Π" }, { key: "{", sym: "{" }, { key: "}", sym: "}" }, { key: "|", sym: "∤" }
  ],
  [
    { key: "A", sym: "Å" }, { key: "S", sym: "∯" }, { key: "D", sym: "Δ" }, { key: "F", sym: "Φ" },
    { key: "G", sym: "Γ" }, { key: "H", sym: "H" }, { key: "J", sym: "J" }, { key: "K", sym: "K" },
    { key: "L", sym: "Λ" }, { key: ":", sym: "∝" }, { key: "\"", sym: "″" }
  ],
  [
    { key: "Z", sym: "ℤ" }, { key: "X", sym: "⊗" }, { key: "C", sym: "ℂ" }, { key: "V", sym: "V" },
    { key: "B", sym: "B" }, { key: "N", sym: "⋂" }, { key: "M", sym: "M" }, { key: "<", sym: "≪" },
    { key: ">", sym: "≫" }, { key: "?", sym: "¿" }
  ]
];

// MODAL HUBS CONTROLLER
const opBackdrop = document.getElementById("opBackdrop");
const opTitle = document.getElementById("opTitle");
const opGlyph = document.getElementById("opGlyph");
const slotFront = document.getElementById("slotFront"), slotTop = document.getElementById("slotTop");
const slotBot = document.getElementById("slotBot"), slotBody = document.getElementById("slotBody");
const slotRup = document.getElementById("slotRup"), slotRlow = document.getElementById("slotRlow");
const opCycle = [slotFront, slotTop, slotBot, slotBody, slotRlow, slotRup];

// 4. FRACTION HUB (NUMERATOR ONLY)
const fracBackdrop = document.getElementById("fracBackdrop");
const fracNum = document.getElementById("fracNum");
let fracStages = [], fracStageIndex = 0, fracBasePrefix = "", fracOriginalAfter = "";

// 3. RADICAL BUILDER (\\)
const rootBackdrop = document.getElementById("rootBackdrop");
const rootDegree = document.getElementById("rootDegree");
const rootBody = document.getElementById("rootBody");

function openOpModal(type = "int") {
  if (!activeSlateInput) return;
  activeOpType = type;
  const val = activeSlateInput.value, cur = activeSlateInput.selectionStart;
  opInitialPrefix = val.slice(0, cur).trim();
  slotFront.value = opInitialPrefix;
  slotTop.value = slotBot.value = slotBody.value = slotRup.value = slotRlow.value = "";
  if (type === "sum") { opGlyph.innerHTML = "&sum;"; opTitle.textContent = "Summation Builder"; }
  else if (type === "int") { opGlyph.innerHTML = "&int;"; opTitle.textContent = "Integral Builder"; }
  else if (type === "eval") { opGlyph.innerHTML = "|"; opTitle.textContent = "Evaluation Bar"; }
  opBackdrop.style.display = "flex";
  if (slotFront.value) slotTop.focus(); else slotFront.focus();
}

function commitOpModal() {
  opBackdrop.style.display = "none";
  if (!activeSlateInput) return;
  const f = slotFront.value.trim(), t = slotTop.value.trim(), b = slotBot.value.trim();
  const body = slotBody.value.trim(), rup = slotRup.value.trim(), rlow = slotRlow.value.trim();
  let op = activeOpType === "sum" ? "\\sum" : (activeOpType === "eval" ? "\\Big|" : "\\int");
  let res = f ? `${f} ` : "";
  res += op;
  if (b) res += `_{${b}}`;
  if (t) res += `^{${t}}`;
  if (body) res += ` ${body}`;
  if (rlow) res += `_{${rlow}}`;
  if (rup) res += `^{${rup}}`;
  activeSlateInput.value = res;
  activeSlateInput.focus();
  activeSlateInput.dispatchEvent(new Event("input"));
}

function autoSeal(str) {
  let s = str;
  const ob = (s.match(/\{/g) || []).length, cb = (s.match(/\}/g) || []).length;
  if (ob > cb) s += "}".repeat(ob - cb);
  const ok = (s.match(/\[/g) || []).length, ck = (s.match(/\]/g) || []).length;
  if (ok > ck) s += "]".repeat(ok - ck);
  return s;
}

// 4. OPEN FRACTION (CAPTURES NUMERATOR ONLY)
function openFracModal() {
  if (!activeSlateInput) return;
  const val = activeSlateInput.value, cur = activeSlateInput.selectionStart;
  let before = autoSeal(val.slice(0, cur).trimEnd());
  fracOriginalAfter = val.slice(cur);
  const eqIdx = before.lastIndexOf("=");
  fracBasePrefix = eqIdx !== -1 ? before.slice(0, eqIdx + 1) + " " : "";
  let expr = (eqIdx !== -1 ? before.slice(eqIdx + 1) : before).trim();

  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    if (expr[i] === "√") {
      let j = i + 1;
      if (expr[j] === "[") {
        let d = 1; j++;
        while (j < expr.length && d > 0) {
          if (expr[j] === "[") d++; if (expr[j] === "]") d--; j++;
        }
      }
      tokens.push(expr.slice(i, j)); i = j;
    } else if ("+-±*".includes(expr[i])) {
      tokens.push(expr[i]); i++;
    } else if (expr[i] === " ") {
      i++;
    } else {
      let j = i;
      while (j < expr.length && !"+-±* √".includes(expr[j])) j++;
      tokens.push(expr.slice(i, j)); i = j;
    }
  }

  fracStages = [];
  for (let k = tokens.length - 1; k >= 0; k--) {
    const candidate = tokens.slice(k).join("").trim();
    if (candidate && !"+-±*".includes(candidate)) {
      fracStages.push({ stem: tokens.slice(0, k).join(" ").trim(), num: candidate });
    }
  }
  if (fracStages.length === 0) fracStages.push({ stem: "", num: expr || "x" });

  fracStageIndex = 0;
  fracNum.value = fracStages[0].num;
  fracBackdrop.style.display = "flex";
  fracNum.focus();
  fracNum.select();
}

// 4. COMMIT FRACTION AND POSITION CURSOR CLEANLY INSIDE DENOMINATOR BRACES
function commitFracModal() {
  fracBackdrop.style.display = "none";
  if (!activeSlateInput) return;
  const num = fracNum.value.trim() || " ";
  const activeStage = fracStages[fracStageIndex] || { stem: "" };
  const stem = activeStage.stem ? `${activeStage.stem} ` : "";

  // Output: \frac{num}{}
  const leftChunk = `${fracBasePrefix}${stem}\\frac{${num}}{`;
  const fullFrac = `${leftChunk}}`;
  
  activeSlateInput.value = fullFrac + fracOriginalAfter;
  activeSlateInput.focus();

  // Caret placed directly inside the denominator braces
  const caretTarget = leftChunk.length;
  activeSlateInput.setSelectionRange(caretTarget, caretTarget);
  activeSlateInput.dispatchEvent(new Event("input"));
}

// 3. OPEN RADICAL BUILDER WINDOW (\\)
function openRadicalModal() {
  if (!activeSlateInput) return;
  rootDegree.value = "";
  rootBody.value = "";
  rootBackdrop.style.display = "flex";
  rootBody.focus();
}

// 3. COMMIT RADICAL BUILDER TO SLATE
function commitRadicalModal() {
  rootBackdrop.style.display = "none";
  if (!activeSlateInput) return;
  const deg = rootDegree.value.trim();
  const body = rootBody.value.trim();

  let radStr = deg ? `\\sqrt[${deg}]{${body}}` : `\\sqrt{${body}}`;
  
  const v = activeSlateInput.value, s = activeSlateInput.selectionStart, e = activeSlateInput.selectionEnd;
  activeSlateInput.value = v.slice(0, s) + radStr + v.slice(e);
  const nextCaret = s + radStr.length;
  activeSlateInput.setSelectionRange(nextCaret, nextCaret);
  activeSlateInput.focus();
  activeSlateInput.dispatchEvent(new Event("input"));
}

opBackdrop.addEventListener("keydown", e => {
  if (e.key === "Escape") { e.preventDefault(); commitOpModal(); }
  if (e.key === "Enter") {
    e.preventDefault();
    const idx = opCycle.indexOf(document.activeElement);
    opCycle[idx !== -1 ? (idx + 1) % opCycle.length : 0].focus();
  }
});

fracBackdrop.addEventListener("keydown", e => {
  if (e.key === "Escape" || e.key === "Enter") {
    e.preventDefault();
    commitFracModal();
  } else if (e.key === "/") {
    e.preventDefault();
    fracStageIndex = (fracStageIndex + 1) % fracStages.length;
    fracNum.value = fracStages[fracStageIndex].num;
  }
});

rootBackdrop.addEventListener("keydown", e => {
  if (e.key === "Escape" || e.key === "Enter") {
    e.preventDefault();
    commitRadicalModal();
  }
});

function injectBracketedStructure(openStr, closeStr) {
  if (!activeSlateInput) return;
  const v = activeSlateInput.value, s = activeSlateInput.selectionStart, e = activeSlateInput.selectionEnd;
  const selText = v.slice(s, e);
  const insertion = `${openStr}${selText}${closeStr}`;
  activeSlateInput.value = v.slice(0, s) + insertion + v.slice(e);
  const newCaret = s + openStr.length + selText.length;
  activeSlateInput.setSelectionRange(newCaret, newCaret);
  activeSlateInput.focus();
  activeSlateInput.dispatchEvent(new Event("input"));
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

// KEYBOARD CREATOR
function createKeyEl(item, customClass = "") {
  const el = document.createElement("div");
  el.className = "k-key";
  if (item.type === "op") el.classList.add("op");
  if (item.type === "st") el.classList.add("st");
  if (customClass) el.classList.add(customClass);
  el.innerHTML = `<span class="k-base">${item.key}</span><span class="k-sym">${item.sym}</span>`;
  el.addEventListener("mousedown", e => e.preventDefault());
  el.addEventListener("click", (e) => {
    e.stopPropagation();
    if (!activeSlateInput) return;
    const v = activeSlateInput.value, s = activeSlateInput.selectionStart;
    if (customClass === "sh" && item.key === "^") {
      const p = s > 0 ? v[s - 1] : "";
      if (/[a-zA-Z]/.test(p)) {
        const wrap = /^[ijkrnIJKRN]$/.test(p) ? `\\mathbf{\\hat{${p}}}` : `\\hat{${p}}`;
        activeSlateInput.value = v.slice(0, s - 1) + wrap + v.slice(s);
      } else {
        activeSlateInput.value = v.slice(0, s) + "\\mathbb{R}" + v.slice(s);
      }
    } else if (item.sym === "∑") openOpModal("sum");
    else if (item.sym === "∫") openOpModal("int");
    else if (item.sym === "|") openOpModal("eval");
    else if (item.sym === "÷") openFracModal();
    else if (item.sym === "√") openRadicalModal();
    else if (item.sym === "^") injectBracketedStructure("^{", "}");
    else if (item.sym === "sub") injectBracketedStructure("_{", "}");
    else if (item.sym === "norm") injectBracketedStructure("\\|", "\\|");
    else {
      activeSlateInput.value = v.slice(0, s) + item.sym + v.slice(s);
      activeSlateInput.setSelectionRange(s + item.sym.length, s + item.sym.length);
    }

    activeSlateInput.focus();
    activeSlateInput.dispatchEvent(new Event("input"));
  });
  return el;
}

function renderDecks() {
  const baseDeck = document.getElementById("baseDeck");
  const shiftDeck = document.getElementById("shiftDeck");
  if (!baseDeck || !shiftDeck) return;
  baseDeck.innerHTML = "";
  shiftDeck.innerHTML = "";

  const r1 = document.createElement("div"); r1.className = "steno-kb-row";
  ROW1_L.forEach(i => r1.appendChild(createKeyEl(i)));
  const hb = document.createElement("div"); hb.className = "hold-box";
  hb.innerHTML = `<div class="hold-tag">HOLD 500ms</div>`;
  HOLD_KEYS.forEach(i => hb.appendChild(createKeyEl(i)));
  r1.appendChild(hb);
  ROW1_R.forEach(i => r1.appendChild(createKeyEl(i)));
  baseDeck.appendChild(r1);

  BASE_QWERTY.forEach(row => {
    const rd = document.createElement("div"); rd.className = "steno-kb-row";
    row.forEach(i => rd.appendChild(createKeyEl(i)));
    baseDeck.appendChild(rd);
  });

  SHIFT_LAYOUT.forEach(row => {
    const rd = document.createElement("div"); rd.className = "steno-kb-row";
    row.forEach(i => rd.appendChild(createKeyEl(i, "sh")));
    shiftDeck.appendChild(rd);
  });

  const stenoDock = document.getElementById("stenoDock");
  if (stenoDock) {
    stenoDock.addEventListener("dblclick", (e) => {
      if (e.target.closest(".k-key")) return;
      stenoDock.classList.toggle("is-minimized");
    });
  }
}

// 3. RADICAL MODAL BOUND TO DOUBLE-TAP BACKSLASH (\\)
const holdTimers = {}, lastTaps = {};
const NUMBER_MAP = {
  "1": (inp) => { inp.value += "∠"; }, "2": (inp) => { inp.value += "⊥"; }, "3": (inp) => { inp.value += "∥"; },
  "4": (inp) => { inp.value += "≅"; }, "5": (inp) => { inp.value += "Δ"; }, "6": () => { injectBracketedStructure("^{", "}"); },
  "7": (inp) => { inp.value += "∈"; }, "8": (inp) => { inp.value += "∞"; }, "9": (inp) => { inp.value += "∏"; }, "0": (inp) => { inp.value += "∅"; }
};
const DBL_MAP = {
  "/": () => openFracModal(),
  "\\": () => openRadicalModal(),
  "[": () => injectBracketedStructure("_{", "}"),
  "6": () => injectBracketedStructure("^{", "}"),
  "]": () => injectBracketedStructure("\\|", "\\|"), ";": (inp) => inp.value += "…", ",": (inp) => inp.value += "≤", ".": (inp) => inp.value += "≥",
  "`": (inp) => inp.value += "≈", "-": (inp) => inp.value += "±", "=": (inp) => inp.value += "≠",
  "s": () => openOpModal("sum"), "i": () => openOpModal("int"), "q": () => openOpModal("eval"),
  "p": (inp) => inp.value += "π", "e": (inp) => inp.value += "e", "r": (inp) => inp.value += "ρ", "u": (inp) => inp.value += "∪",
  "n": (inp) => inp.value += "∩", "x": (inp) => inp.value += "∃", "f": (inp) => inp.value += "∀", "a": (inp) => inp.value += "α",
  "b": (inp) => inp.value += "β", "t": (inp) => inp.value += "θ", "l": (inp) => inp.value += "λ", "g": (inp) => inp.value += "γ",
  "y": (inp) => inp.value += "σ", "o": (inp) => inp.value += "Ω", "w": (inp) => inp.value += "ω", "m": (inp) => inp.value += "μ",
  "v": (inp) => inp.value += "∇", "d": (inp) => inp.value += "∂", "j": (inp) => inp.value += "j", "k": (inp) => inp.value += "κ",
  "z": (inp) => inp.value += "ζ", "c": (inp) => inp.value += "⊂"
};

function attachStenoEngineToInput(inputEl, displayEl) {
  inputEl.addEventListener("focus", () => { activeSlateInput = inputEl; });

  inputEl.addEventListener("input", () => {
    const raw = inputEl.value;
    inputEl.dataset.rawFormula = raw;
    const compiled = compileLatex(raw);
    if (window.katex && compiled) {
      try { katex.render(compiled, displayEl, { throwOnError: false, displayMode: false }); }
      catch (e) { displayEl.textContent = compiled; }
    } else {
      displayEl.textContent = raw || "...";
    }
  });

  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      e.preventDefault();
      const v = inputEl.value, s = inputEl.selectionStart;
      const nb = v.indexOf("}", s);
      const nk = v.indexOf("]", s);

      if (nb !== -1 && nk !== -1) {
        const target = Math.min(nb, nk) + 1;
        inputEl.setSelectionRange(target, target);
      } else if (nb !== -1) {
        inputEl.setSelectionRange(nb + 1, nb + 1);
      } else if (nk !== -1) {
        inputEl.setSelectionRange(nk + 1, nk + 1);
      }
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      const bubble = inputEl.closest(".math-slate-input-bubble");
      if (bubble) bubble.style.display = "none";
      appendNewSlateRow();
      return;
    }

    if (e.repeat && NUMBER_MAP[e.key]) { e.preventDefault(); return; }

    // 500ms Hold
    if (!e.altKey && !e.ctrlKey && /^[0-9]$/.test(e.key) && NUMBER_MAP[e.key]) {
      const k = e.key;
      holdTimers[k] = setTimeout(() => {
        if (inputEl.selectionStart > 0) {
          inputEl.value = inputEl.value.slice(0, inputEl.selectionStart - 1) + inputEl.value.slice(inputEl.selectionStart);
        }
        NUMBER_MAP[k](inputEl);
        inputEl.dispatchEvent(new Event("input"));
        delete holdTimers[k];
      }, 500);
    }

    // Double Tap
    const lk = e.key.toLowerCase();
    if (!e.altKey && !e.ctrlKey && DBL_MAP[lk]) {
      const now = Date.now(), last = lastTaps[lk] || 0;
      if (now - last < 250) {
        e.preventDefault();
        if (inputEl.selectionStart > 0) {
          inputEl.value = inputEl.value.slice(0, inputEl.selectionStart - 1) + inputEl.value.slice(inputEl.selectionStart);
        }
        DBL_MAP[lk](inputEl);
        inputEl.dispatchEvent(new Event("input"));
        lastTaps[lk] = 0;
        return;
      }
      lastTaps[lk] = now;
    }
  });

  inputEl.addEventListener("keyup", (e) => {
    if (holdTimers[e.key]) { clearTimeout(holdTimers[e.key]); delete holdTimers[e.key]; }
  });
}

function appendNewSlateRow() {
  const slateContainer = document.getElementById("math-slate-container");
  if (!slateContainer) return;

  currentSlateLineCount++;
  const lineIndex = currentSlateLineCount - 1;
  const lineNum = String(currentSlateLineCount).padStart(2, '0');

  const block = document.createElement("div");
  block.className = "math-slate-row-block";
  block.id = `math-slate-block-${lineIndex}`;

  const lineRow = document.createElement("div");
  lineRow.className = "math-slate-line-row";

  const numSpan = document.createElement("span");
  numSpan.className = "line-number";
  numSpan.textContent = `${lineNum}.`;

  const outputOnLine = document.createElement("div");
  outputOnLine.className = "math-slate-output-on-line";
  outputOnLine.id = `math-slate-output-${lineIndex}`;
  outputOnLine.textContent = "...";

  lineRow.appendChild(numSpan);
  lineRow.appendChild(outputOnLine);

  const bubble = document.createElement("div");
  bubble.className = "math-slate-input-bubble";

  const bubbleTag = document.createElement("span");
  bubbleTag.textContent = "INPUT:";

  const stenoIn = document.createElement("input");
  stenoIn.type = "text";
  stenoIn.className = "math-steno-in";
  stenoIn.placeholder = "Type formula (// = frac, \\\\ = root, 66 = pow)... Esc exits bracket";
  stenoIn.autocomplete = "off";

  bubble.appendChild(bubbleTag);
  bubble.appendChild(stenoIn);

  block.appendChild(lineRow);
  block.appendChild(bubble);
  slateContainer.appendChild(block);

  attachStenoEngineToInput(stenoIn, outputOnLine);
  activeSlateInput = stenoIn;
  stenoIn.focus();
}

function initSingleLineSlate() {
  const slateContainer = document.getElementById("math-slate-container");
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

function applyActiveFilter() {
  if (currentFilterMode === "MATH") {
    activeFormulaDataset = masterDataset.filter(item => item.type === "MATH");
  } else {
    activeFormulaDataset = masterDataset.filter(item => item.type === "FORMULA");
  }
  renderMathReferencePane();
}

function renderMathReferencePane() {
  const refContainer = document.getElementById("math-reference-container");
  const leftGroupInfo = document.getElementById("left-group-info");
  if (!refContainer) return;
  refContainer.innerHTML = "";

  if (activeFormulaDataset.length === 0) {
    refContainer.innerHTML = `<div style="color: var(--number-color); padding: 15px;">[ NO ${currentFilterMode} LOADED - CLICK LOAD ]</div>`;
    if (leftGroupInfo) leftGroupInfo.textContent = "GROUPS: 1-1 (TOTAL 0)";
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
    groupWrapper.className = "group-wrapper";
    groupWrapper.id = `group-wrapper-${groupIndex}`;

    const groupHeader = document.createElement("div");
    groupHeader.className = "group-header";
    groupHeader.innerHTML = `<span>GROUP ${groupIndex} <span style="color: var(--number-color);">(${String(startNum).padStart(2, '0')}-${String(endNum).padStart(2, '0')})</span></span><span>▼</span>`;
    
    groupHeader.addEventListener("click", () => {
      groupWrapper.classList.toggle("is-collapsed");
      groupHeader.querySelector("span:last-child").textContent = groupWrapper.classList.contains("is-collapsed") ? "▶" : "▼";
    });

    const linesHolder = document.createElement("div");
    linesHolder.className = "group-lines-holder";

    chunk.forEach((item) => {
      const currentIndex = globalIndex;
      const lineNum = String(currentIndex + 1).padStart(2, '0');

      const refRow = document.createElement("div");
      refRow.className = "math-reference-row";
      refRow.dataset.index = currentIndex;

      const selectRadio = document.createElement("div");
      selectRadio.className = "line-select-radio";
      selectRadio.dataset.index = currentIndex;
      selectRadio.addEventListener("click", (e) => {
        e.stopPropagation();
        selectRadio.classList.toggle("selected");
      });

      const numSpan = document.createElement("span");
      numSpan.className = "line-number";
      numSpan.textContent = `${lineNum}.`;

      const renderSpan = document.createElement("span");
      renderSpan.className = "math-rendered-display";

      const compiled = compileLatex(item.latex);
      if (window.katex) {
        try { katex.render(compiled, renderSpan, { throwOnError: false, displayMode: false }); }
        catch (e) { renderSpan.textContent = item.latex; }
      } else {
        renderSpan.textContent = item.latex;
      }

      const shapeSpan = document.createElement("span");
      shapeSpan.className = "math-shape-label";
      shapeSpan.textContent = item.name;

      refRow.appendChild(selectRadio);
      refRow.appendChild(numSpan);
      refRow.appendChild(renderSpan);
      refRow.appendChild(shapeSpan);
      linesHolder.appendChild(refRow);

      globalIndex++;
    });

    groupWrapper.appendChild(groupHeader);
    groupWrapper.appendChild(linesHolder);
    refContainer.appendChild(groupWrapper);
    groupIndex++;
  }

  if (leftGroupInfo) {
    leftGroupInfo.textContent = `GROUPS: 1-${groupIndex - 1} (TOTAL ${totalItems})`;
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

      const isMath = trimmed.match(/^\[?(MATH)\]?\s*:\s*(.+)$/i);
      const isFormula = trimmed.match(/^\[?(FORMULA)\]?\s*:\s*(.+)$/i);
      const isEquationRule = trimmed.match(/^\[?(RULE|OUTPUT)\]?\s*:\s*(.+)$/i);

      if (isMath) {
        const content = isMath[2].trim();
        items.push({ name: "Math Element", latex: content, rawAscii: content, type: "MATH" });
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
        items.push({ name: name, latex: formulaStr, rawAscii: formulaStr, type: "FORMULA" });
      } else if (isEquationRule) {
        const content = isEquationRule[2].trim();
        const eqMatch = content.match(/([a-zA-Z0-9_\(\)\^]+(?:\/[a-zA-Z0-9_\(\)\^]+)?\s*=\s*[^,\(\)]+)/);
        if (eqMatch) {
          items.push({ name: "Equation", latex: eqMatch[1].trim(), rawAscii: eqMatch[1].trim(), type: "MATH" });
        }
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

function evaluateMathComparator() {
  const inputs = document.querySelectorAll(".math-steno-in");
  const scoreDisplay = document.getElementById("slate-score-display");
  if (inputs.length === 0 || activeFormulaDataset.length === 0) {
    alert("Please load reference lines and enter formulas on the slate.");
    return;
  }

  let correctCount = 0;
  const total = activeFormulaDataset.length;

  inputs.forEach((inp, idx) => {
    const userRaw = inp.dataset.rawFormula || inp.value || "";
    const targetRaw = activeFormulaDataset[idx] ? activeFormulaDataset[idx].latex : "";
    const block = document.getElementById(`math-slate-block-${idx}`);

    let isMatch = false;

    if (checkEngineMode === "VERBATUM") {
      const cleanUser = userRaw.replace(/\s+/g, "").toLowerCase();
      const cleanTarget = targetRaw.replace(/\s+/g, "").toLowerCase();
      const normUser = normalizeMathForComparison(compileLatex(userRaw));
      const normTarget = normalizeMathForComparison(compileLatex(targetRaw));
      isMatch = (cleanUser.length > 0 && cleanUser === cleanTarget) || (normUser.length > 0 && normUser === normTarget);
    } else {
      const normUser = normalizeMathForComparison(compileLatex(userRaw));
      const normTarget = normalizeMathForComparison(compileLatex(targetRaw));
      isMatch = normUser.length > 0 && normUser === normTarget;
    }

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

// DOM INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
  renderDecks();
  initSingleLineSlate();
  renderMathReferencePane();
  applyViewportAppearance();
  initAuthSystem();

  // Mode Filter Buttons
  const btnFilterMath = document.getElementById("btn-filter-math");
  const btnFilterFormula = document.getElementById("btn-filter-formula");

  if (btnFilterMath && btnFilterFormula) {
    btnFilterMath.addEventListener("click", () => {
      currentFilterMode = "MATH";
      btnFilterMath.classList.add("active-filter-btn");
      btnFilterFormula.classList.remove("active-filter-btn");
      applyActiveFilter();
    });

    btnFilterFormula.addEventListener("click", () => {
      currentFilterMode = "FORMULA";
      btnFilterFormula.classList.add("active-filter-btn");
      btnFilterMath.classList.remove("active-filter-btn");
      applyActiveFilter();
    });
  }

  // Verbatim Toggle
  const btnToggleCheck = document.getElementById("btn-toggle-check-mode");
  if (btnToggleCheck) {
    btnToggleCheck.addEventListener("click", () => {
      checkEngineMode = checkEngineMode === "VERBATUM" ? "AI_CHECK" : "VERBATUM";
      btnToggleCheck.textContent = checkEngineMode === "VERBATUM" ? "[ VERBATUM ]" : "[ AI CHECK ]";
    });
  }

  // Multi-Select Operations
  const getSelectedIndices = () => {
    const selectedDots = document.querySelectorAll(".line-select-radio.selected");
    return Array.from(selectedDots).map(dot => parseInt(dot.dataset.index, 10));
  };

  const btnHdrHide = document.getElementById("btn-hdr-hide");
  if (btnHdrHide) {
    btnHdrHide.addEventListener("click", () => {
      const indices = new Set(getSelectedIndices());
      if (indices.size === 0) { alert("Click one or more radio dots to hide."); return; }
      activeFormulaDataset = activeFormulaDataset.filter((_, idx) => !indices.has(idx));
      renderMathReferencePane();
    });
  }

  const btnHdrUnhide = document.getElementById("btn-hdr-unhide");
  if (btnHdrUnhide) {
    btnHdrUnhide.addEventListener("click", () => {
      applyActiveFilter();
    });
  }

  const btnHdrDelete = document.getElementById("btn-hdr-delete");
  if (btnHdrDelete) {
    btnHdrDelete.addEventListener("click", () => {
      const indices = new Set(getSelectedIndices());
      if (indices.size === 0) { alert("Click one or more radio dots to delete."); return; }
      if (confirm(`Delete ${indices.size} selected items permanently?`)) {
        activeFormulaDataset = activeFormulaDataset.filter((_, idx) => !indices.has(idx));
        masterDataset = masterDataset.filter((_, idx) => !indices.has(idx));
        renderMathReferencePane();
      }
    });
  }

  const btnHdrSave = document.getElementById("btn-hdr-save");
  if (btnHdrSave) {
    btnHdrSave.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(masterDataset, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "math_formula_items.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      btnHdrSave.textContent = "SAVED ✓";
      btnHdrSave.style.color = "#00ff66";
      setTimeout(() => {
        btnHdrSave.textContent = "SAVE";
        btnHdrSave.style.color = "";
      }, 1500);
    });
  }

  // 1. FULL VIEWPORT SETTINGS TOGGLE
  const btnGear = document.getElementById("btn-nav-gear");
  const displayWorkbench = document.getElementById("display-workbench");
  const displaySettings = document.getElementById("display-settings");

  if (btnGear && displayWorkbench && displaySettings) {
    btnGear.addEventListener("click", () => {
      const isSettingsOpen = displaySettings.style.display === "flex";
      if (isSettingsOpen) {
        displaySettings.style.display = "none";
        displayWorkbench.style.display = "flex";
        btnGear.classList.remove("active-toggle");
      } else {
        displayWorkbench.style.display = "none";
        displaySettings.style.display = "flex";
        btnGear.classList.add("active-toggle");
      }
    });
  }

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
        renderMathReferencePane();
      }
    });
  }

  // Viewport Theme & Border Presets
  document.querySelectorAll('.theme-preset-card[data-theme]').forEach(card => {
    card.addEventListener('click', () => {
      currentThemeKey = card.getAttribute('data-theme');
      applyViewportAppearance();
    });
  });

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

  // Shutter ribbon
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

  // File Loading & Cloud Dropdown Hook
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
        alert("[ AI CHECK ] Dispatching slate inputs to Gemini comparator engine.");
      }
    });
  }
});