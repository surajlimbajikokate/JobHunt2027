/* ═══════════════════════════════════════════════
   JOBHUNT — UI UTILITIES
   (Toast, Modal, Theme, Navbar, Progress)
   ═══════════════════════════════════════════════ */

'use strict';

// ─── THEME ────────────────────────────────────────────────────────────────────
const ThemeManager = (() => {
  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme === 'light' ? 'light' : '');
    const btn = document.getElementById('themeBtn');
    if (btn) btn.innerHTML = theme === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    State.set('theme', theme);
    State.save();
  }
  function toggle() {
    const next = State.get('theme') === 'dark' ? 'light' : 'dark';
    apply(next);
  }
  function init() { apply(State.get('theme')); }
  return { toggle, init };
})();

// ─── TOAST ────────────────────────────────────────────────────────────────────
const Toast = (() => {
  function show(msg, type = 'info') {
    const wrap = document.getElementById('toastWrap');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    el.innerHTML = `<span>${icon}</span> ${msg}`;
    wrap.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(20px)';
      el.style.transition = '0.3s';
      setTimeout(() => el.remove(), 300);
    }, 3200);
  }
  return { show };
})();

// ─── PROGRESS BAR ─────────────────────────────────────────────────────────────
const ProgressBar = (() => {
  function update() {
    const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    const bar = document.getElementById('progressBar');
    if (bar) bar.style.width = Math.min(pct, 100) + '%';
  }
  function init() { window.addEventListener('scroll', update, { passive: true }); }
  return { init };
})();

// ─── NAVBAR ───────────────────────────────────────────────────────────────────
const NavbarManager = (() => {
  function init() {
    window.addEventListener('scroll', () => {
      const nb = document.getElementById('navbar');
      if (nb) nb.classList.toggle('scrolled', window.scrollY > 20);
    }, { passive: true });
  }
  function setActive(page) {
    document.querySelectorAll('[data-nav-page]').forEach(a => {
      a.classList.toggle('active', a.dataset.navPage === page);
    });
  }
  return { init, setActive };
})();

// ─── MOBILE MENU ──────────────────────────────────────────────────────────────
function openMobileMenu() {
  document.getElementById('mobileMenu').classList.add('open');
}
function closeMobileMenu() {
  document.getElementById('mobileMenu').classList.remove('open');
}

// ─── MODAL ────────────────────────────────────────────────────────────────────
const Modal = (() => {
  function open(job) {
    const el = document.getElementById('jobModal');
    if (!el) return;
    State.set('currentJob', job);
    const isSaved = State.isJobSaved(job.id);

    document.getElementById('modalEmoji').textContent    = EMOJI_MAP[job.role] || '💼';
    document.getElementById('modalTitle').textContent    = job.position;
    document.getElementById('modalCompany').textContent  = `${job.company} · ${job.posted}`;
    document.getElementById('modalLocation').textContent = job.location;
    document.getElementById('modalSalary').textContent   = job.salary;
    document.getElementById('modalExp').textContent      = job.experience + ' yrs';
    document.getElementById('modalCat').textContent      = job.role;
    document.getElementById('modalDesc').textContent     = job.desc || DESCRIPTIONS[0];
    document.getElementById('modalSaveBtn').textContent  = isSaved ? '💔 Unsave' : '❤️ Save';
    document.getElementById('modalApplyBtn').onclick     = () => { close(); Router.navigate('apply'); };
    document.getElementById('modalSaveBtn').onclick      = () => toggleModalSave(job.id);

    el.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  function close() {
    const el = document.getElementById('jobModal');
    if (el) el.style.display = 'none';
    document.body.style.overflow = '';
  }
  function toggleModalSave(id) {
    const wasSaved = State.isJobSaved(id);
    const nowSaved = !wasSaved;
    if (wasSaved) { State.toggleSave(id); Toast.show('Removed from saved'); }
    else          { State.toggleSave(id); Toast.show('Job saved! ❤️', 'success'); }
    document.getElementById('modalSaveBtn').textContent = nowSaved ? '💔 Unsave' : '❤️ Save';
    Pages.renderJobs();
  }
  function initOverlayClose() {
    const el = document.getElementById('jobModal');
    if (el) el.addEventListener('click', e => { if (e.target === el) close(); });
  }
  return { open, close, initOverlayClose };
})();
