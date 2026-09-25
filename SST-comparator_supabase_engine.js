// =========================================================================
// FILE: SST-comparator_supabase_engine.js
// DESCRIPTION: Supabase Client, Auth Handlers, Profile Drawer & Data Sync
// =========================================================================

const SUPABASE_URL = "https://jqycpxdzeevoxmcvvmvu.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxeWNweGR6ZWV2b3htY3Z2bXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MDExNTAsImV4cCI6MjEwNTQ3NzE1MH0.NgSWSuXa-4gJu7pnJCSCKpaGU4S2q4z8wrV1t6sz6_w";

// Global Supabase client instance
window.supa = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

let currentUserSession = null;
let activeUserId = null;
let authMode = "LOGIN"; // or "SIGNUP"

// --- MODAL UTILITIES ---
function openAuthModal() {
    const authModal = document.getElementById('sst-auth-modal');
    if (!authModal) return;
    authModal.classList.add('active-modal');
}

function closeAuthModal() {
    const authModal = document.getElementById('sst-auth-modal');
    if (!authModal) return;
    authModal.classList.remove('active-modal');
    const authError = document.getElementById('auth-error-msg');
    if (authError) authError.textContent = "";
}

// --- UPDATE UI ON AUTH STATE CHANGE ---
function updateAuthUi(session) {
    currentUserSession = session;
    const userDisplaySpan = document.querySelector('.user-display-name');
    const profileDrawer = document.getElementById('comparator-profile-drawer');
    const rightDrawerWrapper = document.querySelector('.menu-right .drawer-wrapper');

    if (session && session.user) {
        activeUserId = session.user.id;

        // Update ribbon display
        if (userDisplaySpan) {
            userDisplaySpan.textContent = session.user.email.split('@')[0].toUpperCase();
        }

        // Render drawer for logged-in user
        if (profileDrawer) {
            profileDrawer.innerHTML = `
                <a href="javascript:void(0)" class="sst-nav-link" id="btn-open-account-settings" data-i18n="nav_account_settings">Account Settings</a>
                <a href="javascript:void(0)" class="sst-nav-link" id="btn-auth-signout" style="color: #ff3344; font-weight: bold;" data-i18n="nav_signout">Sign Out</a>
            `;

            // Wire Sign Out directly
            const btnSignOut = document.getElementById('btn-auth-signout');
            if (btnSignOut) {
                btnSignOut.onclick = async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (rightDrawerWrapper) rightDrawerWrapper.classList.remove('drawer-open');
                    
                    try {
                        const { error } = await supa.auth.signOut();
                        if (error) throw error;
                    } catch (err) {
                        alert("Sign out error: " + err.message);
                    }
                };
            }

            // Wire Account Settings modal
            const btnAcc = document.getElementById('btn-open-account-settings');
            if (btnAcc) {
                btnAcc.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (rightDrawerWrapper) rightDrawerWrapper.classList.remove('drawer-open');
                    const accModal = document.getElementById('account-settings-modal');
                    if (accModal) accModal.classList.add('active-modal');
                };
            }
        }

    } else {
        activeUserId = null;

        // Reset ribbon display
        if (userDisplaySpan) {
            userDisplaySpan.textContent = "SIGN IN";
        }

        // Render drawer for public / unauthenticated visitor
        if (profileDrawer) {
            profileDrawer.innerHTML = `
                <a href="javascript:void(0)" class="sst-nav-link" id="btn-trigger-login">Sign In / Register</a>
                <a href="javascript:void(0)" class="sst-nav-link" id="btn-open-account-settings" data-i18n="nav_account_settings">Account Settings</a>
            `;

            const btnLogin = document.getElementById('btn-trigger-login');
            if (btnLogin) {
                btnLogin.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (rightDrawerWrapper) rightDrawerWrapper.classList.remove('drawer-open');
                    openAuthModal();
                };
            }
        }
    }

    // Refresh projects dropdown based on active session
    if (typeof populateCloudProjectsDropdown === 'function') {
        populateCloudProjectsDropdown();
    }
}

// --- POPULATE CLOUD PROJECTS (STRICT SQL SCHEMA MATCH) ---
async function populateCloudProjectsDropdown() {
    const dropdown = document.getElementById('select-cloud-projects') || document.getElementById('cloud-projects-dropdown');
    if (!dropdown || !supa) return;

    dropdown.innerHTML = '<option value="">Scanning cloud projects...</option>';

    try {
        const { data: { session } } = await supa.auth.getSession();
        const user = session?.user;

        if (!user) {
            dropdown.innerHTML = '<option value="">Sign in to access cloud projects</option>';
            return;
        }

        // Strictly queries columns present in sst_database_master_v1.sql
        const { data: items, error } = await supa
            .from('study_materials')
            .select('id, title, created_at, page_range')
            .eq('owner_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error("[SST Supabase] Query error:", error.message);
            dropdown.innerHTML = '<option value="">Error reading projects</option>';
            return;
        }

        dropdown.innerHTML = '';
        if (!items || items.length === 0) {
            dropdown.innerHTML = '<option value="">No projects found</option>';
            return;
        }

        const promptOpt = document.createElement('option');
        promptOpt.value = "";
        promptOpt.textContent = "-- SELECT YOUR PROJECT --";
        dropdown.appendChild(promptOpt);

        items.forEach(proj => {
            const opt = document.createElement('option');
            opt.value = proj.id;
            const dateStr = new Date(proj.created_at).toLocaleDateString();
            const rangeStr = proj.page_range ? ` (${proj.page_range})` : '';
            opt.textContent = `${proj.title || 'Untitled'}${rangeStr} [${dateStr}]`;
            dropdown.appendChild(opt);
        });

    } catch (err) {
        console.error("[SST Supabase] Error:", err);
        dropdown.innerHTML = '<option value="">Error listing projects</option>';
    }
}

// --- INITIALIZE LISTENERS ON DOM LOAD ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Hook auth listener
    if (supa) {
        supa.auth.getSession().then(({ data: { session } }) => {
            updateAuthUi(session);
        });

        supa.auth.onAuthStateChange((_event, session) => {
            updateAuthUi(session);
        });
    }

    // 2. Profile Trigger (Top Ribbon Button)
    const userProfileTrigger = document.getElementById('comparator-user-profile-trigger');
    const rightDrawerWrapper = document.querySelector('.menu-right .drawer-wrapper');
    const leftDrawerWrapper = document.querySelector('.menu-left .drawer-wrapper');

    if (userProfileTrigger && rightDrawerWrapper) {
        userProfileTrigger.onclick = function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (!currentUserSession) {
                openAuthModal();
                return;
            }

            rightDrawerWrapper.classList.toggle('drawer-open');
            if (leftDrawerWrapper) leftDrawerWrapper.classList.remove('drawer-open');
        };
    }

    // 3. Modal Controls & Form Submissions
    const btnAuthCancel = document.getElementById('btn-auth-cancel');
    if (btnAuthCancel) {
        btnAuthCancel.onclick = (e) => {
            e.preventDefault();
            closeAuthModal();
        };
    }

    const btnAuthToggle = document.getElementById('btn-auth-toggle-mode');
    const authModalTitle = document.getElementById('auth-modal-title');
    const btnAuthSubmit = document.getElementById('btn-auth-submit');

    if (btnAuthToggle && authModalTitle && btnAuthSubmit) {
        btnAuthToggle.onclick = (e) => {
            e.preventDefault();
            if (authMode === "LOGIN") {
                authMode = "SIGNUP";
                authModalTitle.textContent = "CREATE NEW ACCOUNT";
                btnAuthSubmit.textContent = "SIGN UP";
                btnAuthToggle.textContent = "Already have an account? Sign In";
            } else {
                authMode = "LOGIN";
                authModalTitle.textContent = "ACCOUNT SIGN IN";
                btnAuthSubmit.textContent = "LOGIN";
                btnAuthToggle.textContent = "Need an account? Sign Up";
            }
        };
    }

    if (btnAuthSubmit) {
        btnAuthSubmit.onclick = async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('auth-input-email');
            const passInput = document.getElementById('auth-input-password');
            const errorMsg = document.getElementById('auth-error-msg');

            const email = emailInput?.value.trim();
            const pass = passInput?.value.trim();

            if (!email || !pass) {
                if (errorMsg) errorMsg.textContent = "Please enter both email and password.";
                return;
            }

            btnAuthSubmit.textContent = "WAIT...";
            if (errorMsg) errorMsg.textContent = "";

            try {
                if (authMode === "LOGIN") {
                    const { data, error } = await supa.auth.signInWithPassword({ email, password: pass });
                    if (error) throw error;
                    closeAuthModal();
                } else {
                    const { data, error } = await supa.auth.signUp({ email, password: pass });
                    if (error) throw error;
                    alert("Account registered successfully! You are now signed in.");
                    closeAuthModal();
                }
            } catch (err) {
                if (errorMsg) errorMsg.textContent = err.message;
            } finally {
                btnAuthSubmit.textContent = (authMode === "LOGIN") ? "LOGIN" : "SIGN UP";
            }
        };
    }
});
