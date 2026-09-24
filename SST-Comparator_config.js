// ==========================================
// SST-COMPARATOR CONFIG & GLOBAL STATE
// File: SST-Comparator_config.js
// ==========================================

const TRANSLATIONS = {
    en: {
        brand_title: "Swanepoel Study Tools",
        brand_sub: "HAMMERX COMPARATOR",
        nav_home: "HOME",
        nav_hammerx_home: "HAMMERX HOME",
        nav_stats: "STATS",
        nav_guardian_portal: "GARDIAN PORTAL",
        nav_tutorials: "TUTORIALS",
        nav_account_settings: "Account Settings",
        nav_security: "Security",
        nav_signout: "Sign Out",
        btn_courseware: "COURSEWARE",
        btn_hammer: "HAMMER",
        tab_what: "01.[WHAT]",
        tab_purpose: "02.[PURPOSE]",
        tab_rule: "03.[RULE]",
        tab_formula: "04.[FORMULA]",
        tab_id: "05.[ID]",
        tab_related: "06.[RELATED]",
        tab_objective: "07.[OBJECTIVE]",
        tab_source: "08.[SOURCE]",
        tab_why: "09.[WHY]",
        tab_summary: "SUMMARY",
        summary_default_prompt: "[*] Click LOAD to select a local JSON file or pull from Supabase Cloud.",
        btn_hide: "HIDE",
        btn_unhide: "UNHIDE",
        btn_delete: "DELETE",
        btn_save: "SAVE",
        mode_noun: "[NOUN]",
        mode_noun_desc: "[NOUN + DESC]",
        mode_noun_desc_where: "[NOUN + DESC + WHERE]",
        btn_clear: "[ CLEAR ]",
        label_groups: "GROUPS:",
        settings_heading: "SETTINGS",
        cat_group_breaks: "GROUP BREAKS",
        cat_viewport_appearance: "VIEWPORT APPEARANCE",
        cat_colors: "COLORS",
        cat_text: "TEXT",
        label_lines_per_group: "LINES PER GROUP:",
        theme_black_board: "BLACK BOARD",
        theme_green_board: "GREEN BOARD",
        theme_red_board: "RED BOARD",
        theme_whiteboard: "WHITEBOARD",
        theme_paper: "PAPER (PLAIN)",
        label_ruled_lines: "RULED LINES",
        label_margin: "MARGIN",
        frame_wood: "WOOD BORDER",
        frame_titanium: "TITANIUM BORDER",
        frame_blackglass: "NITE-LIT (BLACK GLASS)",
        label_swatches: "ESSENTIAL PALETTE",
        label_custom_color: "CUSTOM COLOR / HEX",
        btn_apply: "APPLY",
        btn_bold: "[ BOLD ]",
        btn_italic: "[ ITALIC ]",
        label_font_style: "FONT STYLE:",
        btn_load: "LOAD",
        btn_check: "CHECK",
        modal_data_source_title: "SELECT DATA SOURCE",
        btn_load_local: "📁 LOAD LOCAL JSON FILE (.json)",
        label_cloud_or: "— OR PULL FROM CLOUD —",
        label_supabase_project: "SUPABASE PROJECT:",
        btn_load_cloud: "☁️ LOAD CLOUD NOUNS",
        btn_cancel: "CANCEL",
        account_settings_title: "ACCOUNT SETTINGS",
        label_language: "LANGUAGE",
        btn_ok: "OK",
        auth_title: "ACCOUNT SIGN IN",
        auth_toggle_signup: "Need an account? Sign Up",
        btn_login: "LOGIN",
        modal_save_test_title: "SAVE TEST RESULTS?",
        modal_save_test_body: "Would you like to log your test score and attempt data before clearing the slate?",
        btn_clear_no_save: "CLEAR WITHOUT SAVING",
        btn_save_and_clear: "SAVE & CLEAR"
    },
    af: {
        brand_title: "Swanepoel Studiegereedskap",
        brand_sub: "HAMMERX VERGELYKER",
        nav_home: "TUIS",
        nav_hammerx_home: "HAMMERX TUIS",
        nav_stats: "STATISTIEK",
        nav_guardian_portal: "VOOG PORTAAL",
        nav_tutorials: "HANDLEIDINGS",
        nav_account_settings: "Rekeninginstellings",
        nav_security: "Sekuriteit",
        nav_signout: "Teken Uit",
        btn_courseware: "LEERMATERIAAL",
        btn_hammer: "HAMER",
        tab_summary: "OPSOMMING",
        btn_hide: "VERSTEEK",
        btn_unhide: "WYS ALLES",
        btn_delete: "VERWYDER",
        btn_save: "STOOR",
        btn_clear: "[ SKOONMAAK ]",
        label_groups: "GROEPE:",
        settings_heading: "INSTELLINGS",
        btn_load: "LAI",
        btn_check: "KONTROLEER",
        label_language: "TAAL"
    }
};

let currentLanguage = 'en';

function applyLanguage(langKey) {
    currentLanguage = langKey;
    localStorage.setItem('sst_selected_language', langKey);
    const langDict = TRANSLATIONS[langKey] || TRANSLATIONS.en;

    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (langDict[key]) {
            el.textContent = langDict[key];
        } else if (TRANSLATIONS.en[key]) {
            el.textContent = TRANSLATIONS.en[key];
        }
    });
}

// Global Memory State
let GROUP_SIZE = 10;
let rawMasterBuckets = null;
let activeBuckets = null;
let currentProjectMetadata = {
    source_file: "untitled_project.json",
    timestamp: new Date().toISOString(),
    pages_milled: "N/A",
    engine_version: "SST_HammerX_V2.6"
};
let hasUnsavedChanges = false;

let currentThemeKey = 'BLACK_BOARD';
let activeRuledLineColor = 'transparent';
let activeMarginColor = 'transparent';
let activeFrameBorder = 'WOOD';
let activeColorTargetVar = '--color-part-tag';
let activeTextTarget = 'tag';

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

function markUnsavedChanges() {
    hasUnsavedChanges = true;
}
