/* ═══════════════════════════════════════════════
   JOBHUNT — DATA & STATE MANAGEMENT
   ═══════════════════════════════════════════════ */

'use strict';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const EMOJI_MAP = {
  'Frontend': '🎨', 'Backend': '⚙️', 'Full Stack': '🔥',
  'Devops': '🚀', 'Digital Marketing': '📣'
};

const CATEGORIES = ['Frontend', 'Backend', 'Full Stack', 'Devops', 'Digital Marketing'];

const DESCRIPTIONS = [
  "We're building the next generation of developer tools and are looking for a passionate professional to join our team. You'll work on challenging real-world problems, collaborate with brilliant minds across the globe, and ship features that impact millions of users every day. We care deeply about craftsmanship and move quickly without breaking things.",
  "This is a rare opportunity to shape our product from the ground up. You'll own your work end-to-end — from architecture decisions to deployment. We're a small but mighty team that values autonomy, creativity, and continuous learning. We offer fully remote work, equity, and a culture where great ideas win regardless of seniority.",
  "Join a team obsessed with making the product experience as great as possible. You'll be deep in the stack, contributing across frontend, services, and infrastructure. We value pragmatism, fast iteration, and mentoring. Great culture, excellent pay, and a product that people genuinely love using every day.",
  "We're seeking a seasoned professional to lead technical direction and mentor junior developers. You'll drive meaningful architectural decisions and help create a product used by enterprises globally. This is a high-impact role with real ownership — not just a cog in the machine. Competitive salary, generous equity, and strong remote flexibility."
];

const SEED_JOBS = [
  { id: 1, company: 'Stripe', role: 'Frontend', position: 'Senior React Engineer', location: 'Remote', salary: '$120K–$150K', experience: '4-5', worktype: 'Remote', posted: '2 days ago', featured: true, desc: DESCRIPTIONS[0] },
  { id: 2, company: 'Vercel', role: 'Backend', position: 'Node.js Backend Engineer', location: 'San Francisco', salary: '$100K–$130K', experience: '2-3', worktype: 'Hybrid', posted: '1 day ago', featured: false, desc: DESCRIPTIONS[1] },
  { id: 3, company: 'Linear', role: 'Full Stack', position: 'Full Stack Product Engineer', location: 'Remote', salary: '$90K–$120K', experience: '2-3', worktype: 'Remote', posted: '3 hours ago', featured: true, desc: DESCRIPTIONS[2] },
  { id: 4, company: 'Cloudflare', role: 'Devops', position: 'DevOps / Platform Engineer', location: 'London', salary: '$80K–$110K', experience: '4-5', worktype: 'Hybrid', posted: '5 days ago', featured: false, desc: DESCRIPTIONS[3] },
  { id: 5, company: 'HubSpot', role: 'Digital Marketing', position: 'Growth Marketing Manager', location: 'New York', salary: '$60K–$90K', experience: '0-1', worktype: 'Onsite', posted: '1 week ago', featured: false, desc: DESCRIPTIONS[0] },
  { id: 6, company: 'Figma', role: 'Frontend', position: 'UI / Design Systems Engineer', location: 'Remote', salary: '$130K–$160K', experience: '5+', worktype: 'Remote', posted: '4 days ago', featured: true, desc: DESCRIPTIONS[1] },
  { id: 7, company: 'PlanetScale', role: 'Backend', position: 'Database Infrastructure Engineer', location: 'Remote', salary: '$110K–$140K', experience: '4-5', worktype: 'Remote', posted: '2 days ago', featured: false, desc: DESCRIPTIONS[2] },
  { id: 8, company: 'Loom', role: 'Digital Marketing', position: 'SEO & Content Strategist', location: 'New York', salary: '$50K–$70K', experience: '0-1', worktype: 'Hybrid', posted: '6 days ago', featured: false, desc: DESCRIPTIONS[3] },
  { id: 9, company: 'Railway', role: 'Devops', position: 'Cloud Platform Engineer', location: 'Remote', salary: '$100K–$130K', experience: '2-3', worktype: 'Remote', posted: '3 days ago', featured: false, desc: DESCRIPTIONS[0] },
  { id: 10, company: 'Notion', role: 'Full Stack', position: 'Senior Product Engineer', location: 'San Francisco', salary: '$115K–$145K', experience: '4-5', worktype: 'Onsite', posted: '1 day ago', featured: true, desc: DESCRIPTIONS[1] },
];

// ─── STATE ───────────────────────────────────────────────────────────────────
const State = (() => {
  let _s = {
    jobs: [],
    savedJobs: [],
    applications: [],
    theme: 'dark',
    activeCategory: '',
    activeExp: '',
    activeWorktype: '',
    currentJob: null,
  };

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem('jh_v2') || '{}');
      _s.savedJobs    = raw.savedJobs    || [];
      _s.applications = raw.applications || [];
      _s.theme        = raw.theme        || 'dark';
      const posted    = raw.postedJobs   || [];
      _s.jobs         = [...SEED_JOBS, ...posted];
    } catch (e) {
      _s.jobs = [...SEED_JOBS];
    }
  }

  function save() {
    const posted = _s.jobs.filter(j => !SEED_JOBS.find(s => s.id === j.id));
    localStorage.setItem('jh_v2', JSON.stringify({
      savedJobs:    _s.savedJobs,
      applications: _s.applications,
      postedJobs:   posted,
      theme:        _s.theme,
    }));
  }

  function get(key) { return _s[key]; }
  function set(key, val) { _s[key] = val; }

  function isJobSaved(id) { return _s.savedJobs.some(j => j.id === id); }
  function saveJob(job) {
    if (!isJobSaved(job.id)) { _s.savedJobs.push(job); save(); return true; }
    return false;
  }
  function unsaveJob(id) {
    _s.savedJobs = _s.savedJobs.filter(j => j.id !== id);
    save();
  }
  function toggleSave(id) {
    const job = _s.jobs.find(j => j.id === id);
    if (!job) return false;
    if (isJobSaved(id)) { unsaveJob(id); return false; }
    else { saveJob(job); return true; }
  }
  function addJob(job) { _s.jobs.unshift(job); save(); }
  function addApplication(app) { _s.applications.push(app); save(); }

  function getFilteredJobs({ search = '', category = '', exp = '', worktype = '', sort = 'newest' } = {}) {
    let jobs = _s.jobs.filter(j => {
      const q = search.toLowerCase();
      const matchQ  = !q || [j.company, j.position, j.role, j.location].join(' ').toLowerCase().includes(q);
      const matchCat = !category || j.role === category;
      const matchExp = !exp || j.experience === exp;
      const matchWt  = !worktype || j.worktype === worktype;
      return matchQ && matchCat && matchExp && matchWt;
    });
    if (sort === 'company') jobs.sort((a, b) => a.company.localeCompare(b.company));
    if (sort === 'salary')  jobs.sort((a, b) => b.salary.localeCompare(a.salary));
    return jobs;
  }

  function getCounts() {
    const c = { all: _s.jobs.length };
    CATEGORIES.forEach(cat => { c[cat] = _s.jobs.filter(j => j.role === cat).length; });
    return c;
  }

  return { load, save, get, set, isJobSaved, toggleSave, addJob, addApplication, getFilteredJobs, getCounts };
})();

State.load();
