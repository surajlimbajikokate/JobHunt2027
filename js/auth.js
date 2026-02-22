/* ═══════════════════════════════════════════════
   JOBHUNT — AUTH MODULE (Login / Register)
   ═══════════════════════════════════════════════ */

'use strict';

const Auth = (() => {

  // Simple in-memory + localStorage user store
  let users = [];
  let currentUser = null;
  let inputMethod = 'email'; // 'email' | 'phone'

  function loadUsers() {
    try {
      users = JSON.parse(localStorage.getItem('jh_users') || '[]');
      const cu = localStorage.getItem('jh_current_user');
      if (cu) currentUser = JSON.parse(cu);
    } catch (e) { users = []; }
  }

  function saveUsers() {
    localStorage.setItem('jh_users', JSON.stringify(users));
  }

  function isLoggedIn() { return !!currentUser; }

  function getUser() { return currentUser; }

  function login(identifier, password) {
    const user = users.find(u =>
      (u.email === identifier || u.phone === identifier) && u.password === password
    );
    if (!user) return { ok: false, msg: 'Invalid credentials. Please try again.' };
    currentUser = user;
    localStorage.setItem('jh_current_user', JSON.stringify(user));
    return { ok: true, user };
  }

  function register(data) {
    // Check duplicate
    if (users.find(u => u.email && u.email === data.email)) {
      return { ok: false, msg: 'An account with this email already exists.' };
    }
    if (data.phone && users.find(u => u.phone === data.phone)) {
      return { ok: false, msg: 'An account with this phone already exists.' };
    }
    const user = {
      id: Date.now(),
      name: data.name,
      email: data.email || '',
      phone: data.phone || '',
      password: data.password,
      createdAt: new Date().toLocaleDateString(),
    };
    users.push(user);
    saveUsers();
    currentUser = user;
    localStorage.setItem('jh_current_user', JSON.stringify(user));
    return { ok: true, user };
  }

  function logout() {
    currentUser = null;
    localStorage.removeItem('jh_current_user');
  }

  // ─── UI ──────────────────────────────────────────

  function showAuth() {
    document.getElementById('auth-overlay').style.display = 'flex';
    document.getElementById('auth-overlay').style.animation = 'authFadeIn 0.3s ease';
  }

  function hideAuth() {
    document.getElementById('auth-overlay').style.opacity = '0';
    document.getElementById('auth-overlay').style.transform = 'scale(1.02)';
    setTimeout(() => {
      document.getElementById('auth-overlay').style.display = 'none';
      document.getElementById('auth-overlay').style.opacity = '';
      document.getElementById('auth-overlay').style.transform = '';
    }, 280);
  }

  function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.toggle('active', p.id === `auth-${tab}`));
    // Update title/sub
    if (tab === 'login') {
      document.getElementById('auth-form-title').textContent = 'Welcome back';
      document.getElementById('auth-form-sub').textContent = 'Sign in to your JobHunt account to continue';
    } else {
      document.getElementById('auth-form-title').textContent = 'Create account';
      document.getElementById('auth-form-sub').textContent = 'Join thousands finding their dream career';
    }
  }

  function setInputMethod(method) {
    inputMethod = method;
    document.querySelectorAll('.auth-method-btn').forEach(b => b.classList.toggle('active', b.dataset.method === method));
    // Toggle login fields
    const emailGroup = document.getElementById('login-email-group');
    const phoneGroup = document.getElementById('login-phone-group');
    if (emailGroup && phoneGroup) {
      emailGroup.style.display = method === 'email' ? 'block' : 'none';
      phoneGroup.style.display = method === 'phone' ? 'block' : 'none';
    }
    const rEmailGroup = document.getElementById('reg-email-group');
    const rPhoneGroup = document.getElementById('reg-phone-group');
    if (rEmailGroup && rPhoneGroup) {
      rEmailGroup.style.display = method === 'email' ? 'block' : 'none';
      rPhoneGroup.style.display = method === 'phone' ? 'block' : 'none';
    }
  }

  function togglePasswordVis(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    btn.innerHTML = isPass ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
  }

  function clearErrors() {
    document.querySelectorAll('.field-error').forEach(e => e.classList.remove('show'));
    document.querySelectorAll('.form-input.error').forEach(i => i.classList.remove('error'));
  }

  function showError(inputId, errorId, msg) {
    const input = document.getElementById(inputId);
    const errEl = document.getElementById(errorId);
    if (input) input.classList.add('error');
    if (errEl) { errEl.textContent = msg; errEl.classList.add('show'); }
  }

  function handleLogin(e) {
    e.preventDefault();
    clearErrors();

    const identifier = inputMethod === 'email'
      ? document.getElementById('login-email')?.value.trim()
      : document.getElementById('login-phone')?.value.trim();
    const password = document.getElementById('login-password')?.value;

    let valid = true;
    if (!identifier) {
      showError(inputMethod === 'email' ? 'login-email' : 'login-phone', 'login-id-error', 'This field is required.');
      valid = false;
    }
    if (!password) {
      showError('login-password', 'login-pass-error', 'Password is required.');
      valid = false;
    }
    if (!valid) return;

    const result = login(identifier, password);
    if (!result.ok) {
      showError(inputMethod === 'email' ? 'login-email' : 'login-phone', 'login-id-error', result.msg);
      return;
    }

    Toast.show(`Welcome back, ${result.user.name}! 👋`, 'success');
    hideAuth();
    onLoginSuccess(result.user);
  }

  function handleRegister(e) {
    e.preventDefault();
    clearErrors();

    const firstName = document.getElementById('reg-first')?.value.trim();
    const lastName  = document.getElementById('reg-last')?.value.trim();
    const name = [firstName, lastName].filter(Boolean).join(' ');
    const email = inputMethod === 'email' ? document.getElementById('reg-email')?.value.trim() : '';
    const phone = inputMethod === 'phone' ? document.getElementById('reg-phone')?.value.trim() : '';
    const password = document.getElementById('reg-password')?.value;
    const confirm  = document.getElementById('reg-confirm')?.value;

    let valid = true;
    if (!firstName) { showError('reg-first', 'reg-name-error', 'First name is required.'); valid = false; }
    if (!email && !phone) {
      const id = inputMethod === 'email' ? 'reg-email' : 'reg-phone';
      showError(id, 'reg-id-error', 'Email or phone is required.');
      valid = false;
    }
    if (email && !/\S+@\S+\.\S+/.test(email)) { showError('reg-email', 'reg-id-error', 'Enter a valid email address.'); valid = false; }
    if (phone && phone.replace(/\D/g,'').length < 8) { showError('reg-phone', 'reg-id-error', 'Enter a valid phone number.'); valid = false; }
    if (!password || password.length < 6) { showError('reg-password', 'reg-pass-error', 'Password must be at least 6 characters.'); valid = false; }
    if (password !== confirm) { showError('reg-confirm', 'reg-confirm-error', 'Passwords do not match.'); valid = false; }
    if (!valid) return;

    const result = register({ name, email, phone, password });
    if (!result.ok) {
      showError(inputMethod === 'email' ? 'reg-email' : 'reg-phone', 'reg-id-error', result.msg);
      return;
    }

    Toast.show(`Welcome to JobHunt, ${firstName}! 🎉`, 'success');
    hideAuth();
    onLoginSuccess(result.user);
  }

  function onLoginSuccess(user) {
    updateNavUser(user);
    // Pre-fill profile if available
    const nameEl = document.getElementById('prof-name');
    const emailEl = document.getElementById('prof-email');
    const phoneEl = document.getElementById('prof-phone');
    if (nameEl) nameEl.value = user.name || '';
    if (emailEl) emailEl.value = user.email || '';
    if (phoneEl && user.phone) phoneEl.value = user.phone;
    updateProfileName(user.name);
  }

  function updateNavUser(user) {
    const btn = document.getElementById('nav-auth-btn');
    const avatar = document.getElementById('nav-avatar');
    if (!user) {
      if (btn) { btn.textContent = 'Sign In'; btn.onclick = () => showAuth(); }
      if (avatar) avatar.style.display = 'none';
    } else {
      if (btn) { btn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Sign Out`; btn.onclick = () => handleLogout(); }
      if (avatar) {
        const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
        avatar.textContent = initials;
        avatar.style.display = 'flex';
        avatar.title = user.name;
      }
    }
  }

  function handleLogout() {
    logout();
    updateNavUser(null);
    Toast.show('Signed out. See you soon! 👋');
    Router.navigate('home');
  }

  function init() {
    loadUsers();
    // Update nav state based on whether user is logged in
    if (currentUser) {
      updateNavUser(currentUser);
      onLoginSuccess(currentUser);
    } else {
      updateNavUser(null);
    }
  }

  return {
    init, showAuth, hideAuth, switchTab, setInputMethod,
    togglePasswordVis, handleLogin, handleRegister, isLoggedIn, getUser
  };
})();
