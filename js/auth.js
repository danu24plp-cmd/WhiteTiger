/**
 * White Tiger Dashboard - Authentication Module
 * Handles Login, Log Out, Session Guard, and Forgot Password flow.
 */

const AuthModule = {
  resetState: {
    email: '',
    code: '',
    generatedCode: null
  },

  init() {
    this.bindEvents();
    this.checkInitialAuth();

    // Listen to session changes
    window.addEventListener('wt:auth-changed', (e) => {
      this.handleAuthChange(e.detail.authenticated, e.detail.user);
    });
  },

  checkInitialAuth() {
    const isAuthenticated = StorageService.isAuthenticated();
    const user = StorageService.getSession();
    this.handleAuthChange(isAuthenticated, user);
  },

  handleAuthChange(isAuthenticated, user) {
    const authOverlay = document.getElementById('auth-view-overlay');
    const mainDashboard = document.getElementById('main-dashboard-wrapper');

    if (isAuthenticated && user) {
      if (authOverlay) authOverlay.classList.add('hidden');
      if (mainDashboard) mainDashboard.classList.remove('hidden');

      // Update user details in header
      const topbarName = document.getElementById('topbar-user-name');
      const topbarAvatar = document.getElementById('topbar-user-avatar');
      const roleLabel = document.getElementById('active-role-text');

      if (topbarName) topbarName.textContent = user.name;
      if (topbarAvatar) topbarAvatar.src = user.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.name}`;
      if (roleLabel) roleLabel.textContent = user.role === 'Admin' ? 'Administrator' : 'Standard User';
    } else {
      if (authOverlay) authOverlay.classList.remove('hidden');
      if (mainDashboard) mainDashboard.classList.add('hidden');
      this.showLoginCard();
    }
  },

  bindEvents() {
    // 1. Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        this.login(email, password);
      });
    }

    // Toggle Password Visibility (Login)
    const togglePassBtn = document.getElementById('toggle-password-btn');
    if (togglePassBtn) {
      togglePassBtn.addEventListener('click', () => {
        const passInput = document.getElementById('login-password');
        const eyeIcon = togglePassBtn.querySelector('i');
        if (passInput.type === 'password') {
          passInput.type = 'text';
          togglePassBtn.innerHTML = '<i data-lucide="eye-off" class="w-4 h-4 text-[#0570e9]"></i>';
        } else {
          passInput.type = 'password';
          togglePassBtn.innerHTML = '<i data-lucide="eye" class="w-4 h-4 text-slate-400"></i>';
        }
        if (window.lucide) window.lucide.createIcons();
      });
    }

    // Quick Login Demo Buttons
    const quickAdminBtn = document.getElementById('quick-login-admin');
    const quickUserBtn = document.getElementById('quick-login-user');

    if (quickAdminBtn) {
      quickAdminBtn.addEventListener('click', () => {
        document.getElementById('login-email').value = 'admin@whitetiger.internal';
        document.getElementById('login-password').value = 'admin123';
        this.login('admin@whitetiger.internal', 'admin123');
      });
    }

    if (quickUserBtn) {
      quickUserBtn.addEventListener('click', () => {
        document.getElementById('login-email').value = 'alex@whitetiger.internal';
        document.getElementById('login-password').value = 'tiger123';
        this.login('alex@whitetiger.internal', 'tiger123');
      });
    }

    // 2. Navigation between Login & Forgot Password
    const toForgotBtn = document.getElementById('link-to-forgot');
    const backToLoginBtn1 = document.getElementById('back-to-login-btn-1');
    const backToLoginBtn2 = document.getElementById('back-to-login-btn-2');

    if (toForgotBtn) {
      toForgotBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showForgotStep1();
      });
    }

    if (backToLoginBtn1) {
      backToLoginBtn1.addEventListener('click', (e) => {
        e.preventDefault();
        this.showLoginCard();
      });
    }

    if (backToLoginBtn2) {
      backToLoginBtn2.addEventListener('click', (e) => {
        e.preventDefault();
        this.showLoginCard();
      });
    }

    // 3. Forgot Password - Step 1 Form (Request Code)
    const forgotRequestForm = document.getElementById('forgot-request-form');
    if (forgotRequestForm) {
      forgotRequestForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('forgot-email').value.trim();
        this.handleForgotRequest(email);
      });
    }

    // 4. Forgot Password - Step 2 Form (Verify & Reset)
    const forgotResetForm = document.getElementById('forgot-reset-form');
    if (forgotResetForm) {
      forgotResetForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = document.getElementById('reset-code').value.trim();
        const newPass = document.getElementById('reset-new-password').value;
        const confirmPass = document.getElementById('reset-confirm-password').value;
        this.handleForgotReset(code, newPass, confirmPass);
      });
    }

    // 5. Log Out Button in Topbar
    const logoutBtn = document.getElementById('topbar-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }

    // Mobile Logout Button
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', () => {
        this.logout();
      });
    }
  },

  login(email, password) {
    const errorEl = document.getElementById('login-error-msg');
    if (errorEl) errorEl.classList.add('hidden');

    if (!email || !password) {
      this.showLoginError('Please enter both email and password.');
      return;
    }

    const result = StorageService.authenticate(email, password);
    if (!result.success) {
      this.showLoginError(result.message);
      return;
    }

    // Successful login
    const user = result.user;
    StorageService.setSession(user);
    window.App.showToast(`Welcome back, ${user.name}!`, 'success');
  },

  logout() {
    const currentUser = StorageService.getSession();
    const name = currentUser ? currentUser.name : 'User';

    StorageService.clearSession();
    window.App.showToast('You have been signed out successfully.', 'info');
  },

  handleForgotRequest(email) {
    const errorEl = document.getElementById('forgot-error-msg');
    if (errorEl) errorEl.classList.add('hidden');

    if (!email) {
      this.showForgotError('Please enter your email address.');
      return;
    }

    const users = StorageService.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      this.showForgotError('No account found with this email address.');
      return;
    }

    // Generate 6-digit demo verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    this.resetState = {
      email,
      code,
      generatedCode: code
    };

    // Show step 2
    this.showForgotStep2(email, code);
  },

  handleForgotReset(code, newPassword, confirmPassword) {
    const errorEl = document.getElementById('reset-error-msg');
    if (errorEl) errorEl.classList.add('hidden');

    if (code !== this.resetState.generatedCode) {
      this.showResetError('Invalid verification code. Please check the code provided.');
      return;
    }

    if (newPassword.length < 6) {
      this.showResetError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      this.showResetError('Passwords do not match.');
      return;
    }

    const success = StorageService.updateUserPassword(this.resetState.email, newPassword);
    if (success) {
      window.App.showToast('Password reset successful! Please sign in.', 'success');
      
      // Prefill email in login
      document.getElementById('login-email').value = this.resetState.email;
      document.getElementById('login-password').value = '';
      
      this.showLoginCard();
    }
  },

  showLoginCard() {
    const cardLogin = document.getElementById('auth-card-login');
    const cardForgotStep1 = document.getElementById('auth-card-forgot-1');
    const cardForgotStep2 = document.getElementById('auth-card-forgot-2');

    if (cardLogin) cardLogin.classList.remove('hidden');
    if (cardForgotStep1) cardForgotStep1.classList.add('hidden');
    if (cardForgotStep2) cardForgotStep2.classList.add('hidden');

    if (window.lucide) window.lucide.createIcons();
  },

  showForgotStep1() {
    const cardLogin = document.getElementById('auth-card-login');
    const cardForgotStep1 = document.getElementById('auth-card-forgot-1');
    const cardForgotStep2 = document.getElementById('auth-card-forgot-2');

    if (cardLogin) cardLogin.classList.add('hidden');
    if (cardForgotStep1) cardForgotStep1.classList.remove('hidden');
    if (cardForgotStep2) cardForgotStep2.classList.add('hidden');

    const emailInput = document.getElementById('forgot-email');
    const loginEmail = document.getElementById('login-email').value;
    if (emailInput && loginEmail) emailInput.value = loginEmail;

    if (window.lucide) window.lucide.createIcons();
  },

  showForgotStep2(email, demoCode) {
    const cardLogin = document.getElementById('auth-card-login');
    const cardForgotStep1 = document.getElementById('auth-card-forgot-1');
    const cardForgotStep2 = document.getElementById('auth-card-forgot-2');

    if (cardLogin) cardLogin.classList.add('hidden');
    if (cardForgotStep1) cardForgotStep1.classList.add('hidden');
    if (cardForgotStep2) cardForgotStep2.classList.remove('hidden');

    const emailDisplay = document.getElementById('reset-email-display');
    const demoCodeDisplay = document.getElementById('demo-code-display');
    const codeInput = document.getElementById('reset-code');

    if (emailDisplay) emailDisplay.textContent = email;
    if (demoCodeDisplay) demoCodeDisplay.textContent = demoCode;
    if (codeInput) codeInput.value = demoCode; // Convenient autofill for seamless testing

    if (window.lucide) window.lucide.createIcons();
  },

  showLoginError(msg) {
    const el = document.getElementById('login-error-msg');
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  },

  showForgotError(msg) {
    const el = document.getElementById('forgot-error-msg');
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  },

  showResetError(msg) {
    const el = document.getElementById('reset-error-msg');
    if (el) {
      el.textContent = msg;
      el.classList.remove('hidden');
    }
  }
};
