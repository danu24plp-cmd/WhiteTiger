/**
 * White Tiger Dashboard - Firebase Authentication Module
 * Menangani Login dengan GitHub OAuth, Logout, dan pemantauan status autentikasi.
 */

const AuthModule = {
  currentUser: null,

  async init() {
    const auth = FirebaseApp.getAuth();

    // Pantau perubahan status autentikasi secara real-time
    auth.onAuthStateChanged(async (user) => {
      this.currentUser = user;
      if (user) {
        // Pengguna sudah login
        const userData = {
          name: user.displayName || user.email || 'User',
          email: user.email,
          avatar: user.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`,
          role: 'Admin', // Default role
          uid: user.uid
        };
        this.handleAuthChange(true, userData);

        // Log ke Firestore
        try {
          await FirestoreService.addLog('LOGIN', 'User logged in via GitHub', userData.name);
        } catch (e) { /* ignore jika Firestore belum siap */ }

      } else {
        // Pengguna belum login / sudah logout
        this.handleAuthChange(false, null);
      }
    });

    this.bindEvents();
  },

  bindEvents() {
    // Tombol Login dengan GitHub
    const githubBtn = document.getElementById('btn-github-login');
    if (githubBtn) {
      githubBtn.addEventListener('click', () => this.loginWithGitHub());
    }

    // Tombol Logout
    const logoutBtns = [
      document.getElementById('topbar-logout-btn'),
      document.getElementById('mobile-logout-btn')
    ];
    logoutBtns.forEach(btn => {
      if (btn) btn.addEventListener('click', () => this.logout());
    });
  },

  async loginWithGitHub() {
    const btn = document.getElementById('btn-github-login');
    const errorEl = document.getElementById('login-error-msg');

    try {
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>Menghubungkan ke GitHub...`;
      }
      if (errorEl) errorEl.classList.add('hidden');

      const auth = FirebaseApp.getAuth();
      const provider = FirebaseApp.getGithubProvider();
      await auth.signInWithPopup(provider);

      // onAuthStateChanged akan otomatis dipanggil
    } catch (error) {
      console.error('Login GitHub gagal:', error);
      let msg = 'Login gagal. Silakan coba lagi.';
      if (error.code === 'auth/popup-blocked') msg = 'Pop-up diblokir. Izinkan pop-up untuk situs ini.';
      if (error.code === 'auth/popup-closed-by-user') msg = 'Login dibatalkan.';
      if (error.code === 'auth/account-exists-with-different-credential') msg = 'Akun sudah ada dengan metode login berbeda.';

      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.classList.remove('hidden');
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<svg class="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.92.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"/></svg>Login dengan GitHub`;
      }
    }
  },

  async logout() {
    try {
      const auth = FirebaseApp.getAuth();
      await FirestoreService.addLog('LOGOUT', 'User logged out', this.currentUser?.displayName || 'User');
      await auth.signOut();
      if (window.App) window.App.showToast('Anda berhasil keluar.', 'info');
      // Hentikan semua Firestore listener
      FirestoreService.unsubscribeAll();
    } catch (error) {
      console.error('Logout gagal:', error);
    }
  },

  handleAuthChange(isAuthenticated, user) {
    const authOverlay = document.getElementById('auth-view-overlay');
    const mainDashboard = document.getElementById('main-dashboard-wrapper');

    if (isAuthenticated && user) {
      if (authOverlay) authOverlay.classList.add('hidden');
      if (mainDashboard) mainDashboard.classList.remove('hidden');

      // Update UI header
      const topbarName = document.getElementById('topbar-user-name');
      const topbarAvatar = document.getElementById('topbar-user-avatar');
      const roleLabel = document.getElementById('active-role-text');

      if (topbarName) topbarName.textContent = user.name;
      if (topbarAvatar) topbarAvatar.src = user.avatar;
      if (roleLabel) roleLabel.textContent = 'Administrator';

      // Inisialisasi modul setelah login
      if (window.App && window.App.initModulesAfterLogin) {
        window.App.initModulesAfterLogin(user);
      }
    } else {
      if (authOverlay) authOverlay.classList.remove('hidden');
      if (mainDashboard) mainDashboard.classList.add('hidden');
    }
  },

  getCurrentUser() {
    return this.currentUser;
  },

  isAuthenticated() {
    return !!this.currentUser;
  }
};
