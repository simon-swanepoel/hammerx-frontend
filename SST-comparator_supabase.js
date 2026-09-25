// ==========================================
// SST-SUPABASE ENGINE (MODULE 3)
// File: SST-comparator_supabase_engine.js
// ==========================================

const SUPABASE_URL = "https://jqycpxdzeevoxmcvvmvu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxeWNweGR6ZWV2b3htY3Z2bXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDExNTAsImV4cCI6MjEwNTQ3NzE1MH0.NgSWSuXa-4gJu7pnJCSCKpaGU4S2q4z8wrV1t6sz6_w";

const supa = (window.supabase && typeof window.supabase.createClient === 'function') 
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true,
            storageKey: 'sst_auth_token',
            storage: window.localStorage,
            autoRefreshToken: true,
            detectSessionInUrl: true
        }
    }) 
    : null;

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
            userDisplaySpan.textContent = session.user.email ? session.user.email.split('@')[0] : "USER";
        }
        if (profileDrawer) {
            profileDrawer.innerHTML = `
                <a href="javascript:void(0)" class="sst-nav-link" id="btn-open-account-settings" data-i18n="nav_account_settings">Account Settings</a>
                <a href="javascript:void(0)" class="sst-nav-link" id="btn-auth-signout" style="color: #ff3344;" data-i18n="nav_signout">Sign Out</a>
            `;
            if (typeof applyLanguage === 'function' && typeof currentLanguage !== 'undefined') applyLanguage(currentLanguage);

            const btnSignOut = document.getElementById('btn-auth-signout');
            if (btnSignOut && supa) {
                btnSignOut.addEventListener('click', async (e) => {
                    e.preventDefault();
                    await supa.auth.signOut();
                    updateAuthUi(null);
                });
            }
            const btnAcc = document.getElementById('btn-open-account-settings');
            if (btnAcc && accountModal) {
                btnAcc.addEventListener('click', (e) => {
                    e.preventDefault();
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
            if (typeof applyLanguage === 'function' && typeof currentLanguage !== 'undefined') applyLanguage(currentLanguage);

            const btnLogin = document.getElementById('btn-trigger-login');
            if (btnLogin && authModal) {
                btnLogin.addEventListener('click', (e) => {
                    e.preventDefault();
                    authModal.style.display = 'flex';
                });
            }
            const btnAcc = document.getElementById('btn-open-account-settings');
            if (btnAcc && accountModal) {
                btnAcc.addEventListener('click', (e) => {
                    e.preventDefault();
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
        if (!user) {
            dropdown.innerHTML = '<option value="">Please sign in to view projects</option>';
            return;
        }

        const { data: items, error } = await supa
            .from('study_materials')
            .select('id, title, created_at, page_range')
            .eq('owner_id', user.id)
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
            const rangeStr = proj.page_range ? ` (${proj.page_range})` : '';
            opt.textContent = `${proj.title || 'Untitled'}${rangeStr} [${dateStr}]`;
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

    // Click support for Hamburger (left) and 3-Dots Profile (right)
    document.querySelectorAll('.drawer-wrapper').forEach(wrapper => {
        const trigger = wrapper.querySelector('.menu-trigger') || wrapper.querySelector('.user-profile-trigger');
        const drawer = wrapper.querySelector('.nav-links-drawer');
        if (trigger && drawer) {
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                const wasOpen = drawer.classList.contains('drawer-open');
                document.querySelectorAll('.nav-links-drawer').forEach(d => d.classList.remove('drawer-open'));
                if (!wasOpen) {
                    drawer.classList.add('drawer-open');
                }
            });
        }
    });

    document.addEventListener('click', () => {
        document.querySelectorAll('.nav-links-drawer').forEach(d => d.classList.remove('drawer-open'));
    });

    // Clicking "SIGN IN" directly opens the modal
    if (userProfileTrigger && authModal) {
        userProfileTrigger.addEventListener('click', (e) => {
            if (!currentUserSession) {
                authModal.style.display = 'flex';
            }
        });
    }

    if (supa) {
        supa.auth.getSession().then(({ data: { session } }) => {
            updateAuthUi(session);
        }).catch(err => {
            console.warn("Supabase auth session check fallback:", err);
            updateAuthUi(null);
        });

        supa.auth.onAuthStateChange((_event, session) => {
            updateAuthUi(session);
        });
    } else {
        updateAuthUi(null);
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
            const email = inputEmail ? inputEmail.value.trim().toLowerCase() : "";
            const pass = inputPass ? inputPass.value.trim() : "";
            if (authError) authError.textContent = "";

            if (!email || !pass) {
                if (authError) authError.textContent = "Please fill in all fields.";
                return;
            }

            if (!supa) {
                if (authError) authError.textContent = "Database connection offline.";
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
                if (inputEmail) inputEmail.value = "";
                if (inputPass) inputPass.value = "";
            } catch (err) {
                if (authError) authError.textContent = err.message;
            } finally {
                btnAuthSubmit.textContent = authMode === "LOGIN" ? "LOGIN" : "REGISTER";
            }
        });
    }
});
