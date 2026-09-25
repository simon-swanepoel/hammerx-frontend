// ==========================================
// SST-SUPABASE ENGINE (MODULE 3)
// File: SST-comparator_supabase_engine.js
// ==========================================

const SUPABASE_URL = "https://jqycpxdzeevoxmcvvmvu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxeWNweGR6ZWV2b3htY3Z2bXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDExNTAsImV4cCI6MjEwNTQ3NzE1MH0.NgSWSuXa-4gJu7pnJCSCKpaGU4S2q4z8wrV1t6sz6_w";

const supa = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        storageKey: 'sst_auth_token',
        storage: window.localStorage,
        autoRefreshToken: true,
        detectSessionInUrl: true
    }
}) : null;

let currentUserSession = null;
let activeUserId = null;
let authMode = "LOGIN";

function updateAuthUi(session) {
    currentUserSession = session;
    const userDisplaySpan = document.querySelector('.user-display-name');
    const profileDrawer = document.getElementById('comparator-profile-drawer');
    const authModal = document.getElementById('sst-auth-modal');
    const accountModal = document.getElementById('account-settings-modal');

    if (session && session.user) {
        activeUserId = session.user.id;
        if (userDisplaySpan) {
            userDisplaySpan.textContent = session.user.email.split('@')[0];
        }
        if (profileDrawer) {
            profileDrawer.innerHTML = `
                <a href="javascript:void(0)" class="sst-nav-link" id="btn-open-account-settings" data-i18n="nav_account_settings">Account Settings</a>
                <a href="javascript:void(0)" class="sst-nav-link" id="btn-auth-signout" style="color: #ff3344;" data-i18n="nav_signout">Sign Out</a>
            `;
            if (typeof applyLanguage === 'function') applyLanguage(currentLanguage);

            const btnSignOut = document.getElementById('btn-auth-signout');
            if (btnSignOut) {
                btnSignOut.addEventListener('click', async () => {
                    await supa.auth.signOut();
                });
            }
            const btnAcc = document.getElementById('btn-open-account-settings');
            if (btnAcc && accountModal) {
                btnAcc.addEventListener('click', () => {
                    accountModal.style.display = 'flex';
                });
            }
        }
    } else {
        activeUserId = null;
        if (userDisplaySpan) {
            userDisplaySpan.textContent = "SIGN IN";
        }
        if (profileDrawer) {
            profileDrawer.innerHTML = `
                <a href="javascript:void(0)" class="sst-nav-link" id="btn-trigger-login">Sign In / Register</a>
                <a href="javascript:void(0)" class="sst-nav-link" id="btn-open-account-settings" data-i18n="nav_account_settings">Account Settings</a>
            `;
            if (typeof applyLanguage === 'function') applyLanguage(currentLanguage);

            const btnLogin = document.getElementById('btn-trigger-login');
            if (btnLogin && authModal) {
                btnLogin.addEventListener('click', () => {
                    authModal.style.display = 'flex';
                });
            }
            const btnAcc = document.getElementById('btn-open-account-settings');
            if (btnAcc && accountModal) {
                btnAcc.addEventListener('click', () => {
                    accountModal.style.display = 'flex';
                });
            }
        }
    }
}

async function populateCloudProjectsDropdown() {
    const dropdown = document.getElementById('select-cloud-projects') || document.getElementById('cloud-projects-dropdown');
    if (!dropdown || !supa) return;

    dropdown.innerHTML = '<option value="">Scanning cloud projects...</option>';

    try {
        const { data: { session } } = await supa.auth.getSession();
        const user = session?.user;

        let query = supa
            .from('study_materials')
            .select('id, title, created_at, page_range, is_sample');

        if (user) {
            query = query.or(`owner_id.eq.${user.id},is_sample.eq.true`);
        } else {
            query = query.eq('is_sample', true);
        }

        const { data: items, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        dropdown.innerHTML = '';
        if (!items || items.length === 0) {
            dropdown.innerHTML = user 
                ? '<option value="">No projects found in database</option>'
                : '<option value="">No public sample projects available</option>';
            return;
        }

        const promptOpt = document.createElement('option');
        promptOpt.value = "";
        promptOpt.textContent = user ? "-- SELECT YOUR PROJECT OR SAMPLE --" : "-- SELECT A SAMPLE DRILL DECK --";
        dropdown.appendChild(promptOpt);

        items.forEach(proj => {
            const opt = document.createElement('option');
            opt.value = proj.id;
            const dateStr = new Date(proj.created_at).toLocaleDateString();
            const rangeStr = proj.page_range ? ` (${proj.page_range})` : '';
            const sampleTag = proj.is_sample ? ' [SAMPLE]' : '';
            opt.textContent = `${proj.title || 'Untitled'}${rangeStr}${sampleTag} [${dateStr}]`;
            dropdown.appendChild(opt);
        });

    } catch (err) {
        console.error("[SST Supabase] Error listing projects:", err);
        dropdown.innerHTML = '<option value="">Error listing projects</option>';
    }
}

async function loadCloudNouns(projectId) {
    if (!supa || !projectId) return;

    try {
        const { data: row, error } = await supa
            .from('study_materials')
            .select('*')
            .eq('id', projectId)
            .single();

        if (error) throw error;
        if (!row || !row.payload) {
            alert("Empty payload for selected project.");
            return;
        }

        let payload = row.payload;
        if (typeof payload === 'string') {
            try {
                payload = JSON.parse(payload);
            } catch (e) {
                console.warn("[SST Supabase] Payload secondary parse warning:", e);
            }
        }

        if (!payload.title && row.title) payload.title = row.title;
        if (typeof processAndDistributePayload === 'function') {
            processAndDistributePayload(payload);
        }

        const btnStudy = document.getElementById('btn-nav-study');
        if (btnStudy) btnStudy.click();

    } catch (err) {
        alert(`Cloud Load Error: ${err.message}`);
        console.error("[SST Supabase] Cloud load error:", err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const authModal = document.getElementById('sst-auth-modal');
    const authTitle = document.getElementById('auth-modal-title');
    const inputEmail = document.getElementById('auth-input-email');
    const inputPass = document.getElementById('auth-input-password');
    const authError = document.getElementById('auth-error-msg');
    const btnAuthToggle = document.getElementById('btn-auth-toggle-mode');
    const btnAuthSubmit = document.getElementById('btn-auth-submit');
    const btnAuthCancel = document.getElementById('btn-auth-cancel');
    const userProfileTrigger = document.getElementById('comparator-user-profile-trigger');

    if (supa) {
        supa.auth.getSession().then(({ data: { session } }) => {
            updateAuthUi(session);
        });

        supa.auth.onAuthStateChange((_event, session) => {
            updateAuthUi(session);
        });
    }

    // Auto-load sample from URL query param if provided (e.g. ?sample=uuid)
    const urlParams = new URLSearchParams(window.location.search);
    const sampleId = urlParams.get('sample');
    if (sampleId) {
        loadCloudNouns(sampleId);
    }

    if (btnAuthToggle) {
        btnAuthToggle.addEventListener('click', () => {
            if (authMode === "LOGIN") {
                authMode = "SIGNUP";
                if (authTitle) authTitle.textContent = "CREATE NEW ACCOUNT";
                if (btnAuthSubmit) btnAuthSubmit.textContent = "REGISTER";
                btnAuthToggle.textContent = "Already have an account? Sign In";
            } else {
                authMode = "LOGIN";
                if (authTitle) authTitle.textContent = "ACCOUNT SIGN IN";
                if (btnAuthSubmit) btnAuthSubmit.textContent = "LOGIN";
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

    if (btnAuthSubmit) {
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
                    alert("Account registered successfully! You are now signed in.");
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
});
