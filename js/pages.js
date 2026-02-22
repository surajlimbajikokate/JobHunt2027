/* ═══════════════════════════════════════════════
   JOBHUNT — PAGE RENDERING & LOGIC
   ═══════════════════════════════════════════════ */

'use strict';

// ─── ROUTER ───────────────────────────────────────────────────────────────────
const Router = (() => {
  const pages = ['home', 'jobs', 'postJob', 'apply', 'saved', 'profile'];

  function navigate(page) {
    pages.forEach(p => {
      const el = document.getElementById(`page-${p}`);
      if (el) el.classList.toggle('active', p === page);
    });
    NavbarManager.setActive(page);
    closeMobileMenu();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Page init hooks
    if (page === 'jobs')    { Pages.renderJobs(); Pages.updateCounts(); }
    if (page === 'saved')   Pages.renderSaved();
    if (page === 'profile') Pages.updateProfile();
  }
  return { navigate };
})();

// ─── PAGES ────────────────────────────────────────────────────────────────────
const Pages = (() => {

  /* ── JOBS PAGE ────────────────────────────────── */
  function getJobFilters() {
    return {
      search:   (document.getElementById('jobSearch')?.value   || ''),
      category: State.get('activeCategory') || (document.getElementById('catFilter')?.value || ''),
      exp:      State.get('activeExp'),
      worktype: State.get('activeWorktype'),
      sort:     document.getElementById('sortSelect')?.value || 'newest',
    };
  }

  function renderJobs() {
    const jobs = State.getFilteredJobs(getJobFilters());
    const el   = document.getElementById('jobsList');
    const cntEl = document.getElementById('resultCount');
    if (cntEl) cntEl.textContent = jobs.length;
    if (!el) return;

    if (!jobs.length) {
      el.innerHTML = `
        <div class="jobs-empty">
          <i class="fas fa-search"></i>
          <h3>No matches found</h3>
          <p>Try adjusting your filters or search term</p>
        </div>`;
      return;
    }

    el.innerHTML = jobs.map(job => jobCardHTML(job)).join('');
  }

  function jobCardHTML(job) {
    const isSaved = State.isJobSaved(job.id);
    const emoji   = EMOJI_MAP[job.role] || '💼';
    const isNew   = job.posted.includes('hour') || job.posted.includes('1 day');
    return `
      <div class="job-card${job.featured ? ' featured' : ''}" onclick="openModalById(${job.id})">
        ${job.featured ? `<div class="featured-tag">Featured</div>` : ''}
        <div class="job-logo">${job.logo ? `<img src="${job.logo}" alt="${job.company}">` : emoji}</div>
        <div class="job-info">
          <div class="job-company">${job.company} · ${job.posted}</div>
          <div class="job-title">${job.position}</div>
          <div class="job-meta">
            <span class="tag"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
            <span class="tag ${job.worktype === 'Remote' ? 'remote' : ''}">${job.worktype}</span>
            ${isNew ? '<span class="tag new">✨ New</span>' : ''}
            ${job.featured ? '<span class="tag hot">🔥 Hot</span>' : ''}
          </div>
        </div>
        <div class="job-right">
          <div class="job-salary">${job.salary}</div>
          <div class="job-btns">
            <button class="btn-apply" onclick="event.stopPropagation(); applyJobById(${job.id})">Apply</button>
            <button class="btn-save ${isSaved ? 'saved' : ''}" onclick="event.stopPropagation(); toggleSaveBtn(${job.id}, this)" title="${isSaved ? 'Unsave' : 'Save'}">${isSaved ? '❤️' : '🤍'}</button>
          </div>
        </div>
      </div>`;
  }

  function filterJobs() { renderJobs(); updateCounts(); }

  function setCategoryFilter(cat) {
    State.set('activeCategory', cat);
    document.querySelectorAll('[data-cat]').forEach(el => {
      el.classList.toggle('active', el.dataset.cat === cat);
    });
    renderJobs();
  }

  function setExpFilter(exp) {
    const current = State.get('activeExp');
    State.set('activeExp', current === exp ? '' : exp);
    renderJobs();
  }

  function setWorktype(wt) {
    const current = State.get('activeWorktype');
    State.set('activeWorktype', current === wt ? '' : wt);
    renderJobs();
  }

  function updateCounts() {
    const counts = State.getCounts();
    const map = {
      '': 'count-all',
      'Frontend': 'count-frontend',
      'Backend': 'count-backend',
      'Full Stack': 'count-fullstack',
      'Devops': 'count-devops',
      'Digital Marketing': 'count-dm'
    };
    Object.entries(map).forEach(([cat, id]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = cat === '' ? counts.all : (counts[cat] || 0);
    });
  }

  /* ── SAVED PAGE ───────────────────────────────── */
  function renderSaved() {
    const savedJobs = State.get('savedJobs');
    const el = document.getElementById('savedList');
    if (!el) return;

    if (!savedJobs.length) {
      el.innerHTML = `
        <div class="saved-empty">
          <div class="saved-empty-icon">💔</div>
          <h3>No saved jobs yet</h3>
          <p>Browse jobs and tap the ❤️ button to save them here for later.</p>
          <button class="btn btn-gold" onclick="Router.navigate('jobs')">Browse Jobs</button>
        </div>`;
      return;
    }

    el.innerHTML = savedJobs.map(job => {
      const emoji = EMOJI_MAP[job.role] || '💼';
      return `
        <div class="job-card" style="margin-bottom:12px" onclick="openModalById(${job.id})">
          <div class="job-logo">${emoji}</div>
          <div class="job-info">
            <div class="job-company">${job.company}</div>
            <div class="job-title">${job.position}</div>
            <div class="job-meta">
              <span class="tag"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
              <span class="tag ${job.worktype === 'Remote' ? 'remote' : ''}">${job.worktype}</span>
            </div>
          </div>
          <div class="job-right">
            <div class="job-salary">${job.salary}</div>
            <div class="job-btns">
              <button class="btn-apply" onclick="event.stopPropagation(); applyJobById(${job.id})">Apply</button>
              <button class="btn-save saved" onclick="event.stopPropagation(); removeSavedJob(${job.id})">❤️</button>
            </div>
          </div>
        </div>`;
    }).join('');
  }

  /* ── PROFILE PAGE ─────────────────────────────── */
  function updateProfile() {
    const apps  = State.get('applications');
    const saved = State.get('savedJobs');

    const appliedEl = document.getElementById('appliedCount');
    const savedEl   = document.getElementById('savedCount');
    if (appliedEl) appliedEl.textContent = apps.length;
    if (savedEl)   savedEl.textContent   = saved.length;

    const histEl = document.getElementById('appHistory');
    if (!histEl) return;

    if (!apps.length) {
      histEl.innerHTML = `<p style="color:var(--text-3);text-align:center;padding:2rem;font-size:0.9rem">No applications yet. <a href="#" onclick="Router.navigate('jobs')" style="color:var(--gold)">Browse jobs →</a></p>`;
      return;
    }

    histEl.innerHTML = apps.slice().reverse().map(app => {
      const job   = State.get('jobs').find(j => j.id === app.jobId);
      const emoji = EMOJI_MAP[job?.role] || '💼';
      return `
        <div class="app-item">
          <div class="app-icon">${emoji}</div>
          <div class="app-info">
            <div class="app-title">${app.jobTitle || 'Job Position'}</div>
            <div class="app-sub">${app.company} · Applied ${app.appliedAt}</div>
          </div>
          <span class="app-status">Applied</span>
        </div>`;
    }).join('');
  }

  return { renderJobs, filterJobs, setCategoryFilter, setExpFilter, setWorktype, updateCounts, renderSaved, updateProfile, jobCardHTML };
})();

// ─── GLOBAL ACTION FUNCTIONS ──────────────────────────────────────────────────

function toggleSaveBtn(id, btn) {
  const nowSaved = State.toggleSave(id);
  btn.textContent = nowSaved ? '❤️' : '🤍';
  btn.classList.toggle('saved', nowSaved);
  Toast.show(nowSaved ? 'Job saved! ❤️' : 'Removed from saved', nowSaved ? 'success' : 'info');
}

function removeSavedJob(id) {
  State.toggleSave(id);
  Pages.renderSaved();
  Toast.show('Removed from saved');
}

function applyJobById(id) {
  const job = State.get('jobs').find(j => j.id === id);
  if (job) {
    State.set('currentJob', job);
    const titleEl = document.getElementById('applyJobTitle');
    if (titleEl) titleEl.textContent = `${job.position} at ${job.company}`;
  }
  Router.navigate('apply');
}

// Hero search
function heroSearch() {
  const val = document.getElementById('heroSearch')?.value || '';
  Router.navigate('jobs');
  setTimeout(() => {
    const el = document.getElementById('jobSearch');
    if (el) { el.value = val; Pages.filterJobs(); }
  }, 100);
}

function filterByCategory(cat) {
  Router.navigate('jobs');
  setTimeout(() => Pages.setCategoryFilter(cat), 100);
}

// Post Job
let selectedExp = '';
let uploadedLogo = null;

function selectExpRadio(el, val) {
  document.querySelectorAll('.radio-option').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
  selectedExp = val;
}

function handleLogoUpload(input) {
  if (!input.files[0]) return;
  document.getElementById('logoFileName').textContent = '✅ ' + input.files[0].name;
  const reader = new FileReader();
  reader.onload = e => { uploadedLogo = e.target.result; };
  reader.readAsDataURL(input.files[0]);
}

function handleResumeUpload(input) {
  if (input.files[0]) document.getElementById('resumeFileName').textContent = '✅ ' + input.files[0].name;
}

function submitPostJob(e) {
  e.preventDefault();
  const company  = document.getElementById('pj-company')?.value.trim();
  const location = document.getElementById('pj-location')?.value.trim();
  const role     = document.getElementById('pj-role')?.value.trim();
  const position = document.getElementById('pj-position')?.value;
  const salary   = document.getElementById('pj-salary')?.value   || '$60K–$90K';
  const desc     = document.getElementById('pj-desc')?.value;
  const worktype = document.getElementById('pj-worktype')?.value;

  if (!company || !location || !role || !position) {
    Toast.show('Please fill all required fields', 'error'); return;
  }

  const newJob = {
    id: Date.now(), company, location,
    role: position, position: role,
    salary, experience: selectedExp || '0-1',
    worktype, posted: 'Just now',
    featured: false,
    desc: desc || DESCRIPTIONS[0],
    logo: uploadedLogo,
  };

  State.addJob(newJob);
  Toast.show('Job posted successfully! 🚀', 'success');
  e.target.reset();
  document.querySelectorAll('.radio-option').forEach(r => r.classList.remove('selected'));
  document.getElementById('logoFileName').textContent = 'Click to upload company logo';
  uploadedLogo = null; selectedExp = '';
  setTimeout(() => Router.navigate('jobs'), 1000);
}

function submitApply(e) {
  e.preventDefault();
  const name  = document.getElementById('ap-name')?.value;
  const email = document.getElementById('ap-email')?.value;
  if (!name || !email) { Toast.show('Please fill required fields', 'error'); return; }

  const currentJob = State.get('currentJob');
  const app = {
    id: Date.now(),
    jobId:    currentJob?.id,
    jobTitle: currentJob?.position,
    company:  currentJob?.company,
    name, email,
    appliedAt: new Date().toLocaleDateString(),
  };
  State.addApplication(app);
  Toast.show('Application submitted! 🎉', 'success');
  e.target.reset();

  // Animate steps
  document.querySelectorAll('.step').forEach((s, i) => {
    s.classList.toggle('done', i < 3);
    s.classList.remove('active');
  });
  setTimeout(() => Router.navigate('profile'), 1100);
}

function updateProfileName(val) {
  if (!val) return;
  const initials = val.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const avatarEl = document.getElementById('avatarEl');
  const nameEl   = document.getElementById('profileNameEl');
  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl)   nameEl.textContent   = val;
}

function saveProfile() { Toast.show('Profile saved! ✅', 'success'); }

// ─── MODAL OPENER BY ID ────────────────────────────────────────────────────────
function openModalById(id) {
  const job = State.get('jobs').find(j => j.id === id);
  if (job) Modal.open(job);
}
