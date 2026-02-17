// Data stores
let companies = [];
let filterCategory = 'all';
let alumniData = [];

const devResources = [
  { title: 'Build a Campus Lost & Found', desc: 'Next.js + Supabase + UploadThing starter', tags: ['nextjs', 'supabase', 'product'], level: 'Weekend build', link: 'https://github.com' },
  { title: 'Realtime Study Rooms', desc: 'Socket.io + Redis pub/sub template', tags: ['realtime', 'redis', 'node'], level: 'Team sprint', link: 'https://github.com' },
  { title: 'Placement Board CMS', desc: 'Headless CMS for training & placements', tags: ['cms', 'strapi', 'react'], level: 'Capstone', link: 'https://github.com' },
  { title: 'SNIST Map + Indoor Nav', desc: 'Leaflet + beacons mock data', tags: ['maps', 'ui'], level: 'Research', link: 'https://github.com' }
];

const dsaResources = [
  { title: '90-Day DS&A Ladder', desc: 'Arrays → Graphs → DP curated by peers', tags: ['roadmap', 'dp', 'graphs'], level: 'All levels', link: 'https://leetcode.com' },
  { title: 'System Design Seeds', desc: 'Mini problems: rate limiter, feed fanout', tags: ['lld', 'hld'], level: 'Intern+, SDE1', link: 'https://github.com' },
  { title: 'Contest Prep Pack', desc: '5 problems/day sheet', tags: ['cp', 'math'], level: 'Contest', link: 'https://codeforces.com' }
];

const newsItems = [
  { title: 'SNIST HackNight winners ship AI timetable optimizer', meta: 'CSE • Feb 2026', tags: ['ai', 'product'], link: '#' },
  { title: 'ECE team gets shortlisted for Smart India Hackathon 2026', meta: 'ECE • Feb 2026', tags: ['hardware', 'iot'], link: '#' },
  { title: 'Alumni at Snowflake hosting data infra AMA next week', meta: 'Alumni • Mar 2026', tags: ['data', 'cloud'], link: '#' }
];

const THEME_KEY = 'snist-theme';
let firebaseReady = false;
const ENABLE_PLACEMENT_ENTRIES = false;
const ALUMNI_CSV_PATH = '/assets/data/snist-established-alumni.csv';
const ALUMNI_ANIMATION_PATH = '/assets/lottie/alumni-chat.json';
const PLACEMENT_WORKFLOW_ANIMATION_PATH = '/assets/lottie/workflow.json';
const alumniFilters = { query: '', year: 'all', company: 'all', sortBy: 'gradYear', sortDir: 'desc' };
const ALUMNI_PAGE_SIZE = 25;
let alumniCurrentPage = 1;
let placementEmptyAnimation = null;

function applyTheme(theme) {
  const next = theme === 'day' ? 'theme-day' : 'theme-night';
  document.body.classList.remove('theme-day', 'theme-night');
  document.body.classList.add(next);
  localStorage.setItem(THEME_KEY, theme);
  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.textContent = theme === 'day' ? '🌙 Night' : '🌞 Day';
}

function initThemeToggle() {
  const stored = localStorage.getItem(THEME_KEY) || 'night';
  applyTheme(stored);
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const current = document.body.classList.contains('theme-day') ? 'day' : 'night';
      applyTheme(current === 'day' ? 'night' : 'day');
    });
  }
}

function useFirebase() {
  return typeof window !== 'undefined' && window.firebaseAuthApi;
}

function bindModalGoogleButtons(authInstance) {
  const buttonMap = [
    { id: 'firebaseGoogleBtnModal', modal: 'signupModal' },
    { id: 'firebaseGoogleBtnModalLogin', modal: 'loginModal' }
  ];

  buttonMap.forEach(({ id, modal }) => {
    const button = document.getElementById(id);
    if (!button || button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await window.firebaseAuthApi.signInWithGoogle();
        authInstance.closeModal(modal);
      } catch (err) {
        alert('Google sign-in failed');
        console.error(err);
      }
    });
  });
}

function initFirebaseHooks(authInstance) {
  if (firebaseReady) return;
  if (!useFirebase()) return;
  firebaseReady = true;
  window.firebaseAuthApi.onAuthStateChanged((user) => {
    if (user) {
      authInstance.setUser({ name: user.displayName || 'SNIST User', email: user.email });
    } else {
      authInstance.setUser(null);
    }
  });
  const googleSlot = document.getElementById('googleSignIn');
  if (googleSlot) {
    googleSlot.innerHTML = '<button class="btn btn-primary btn-google" id="firebaseGoogleBtn">Continue with Google</button>';
    googleSlot.querySelector('#firebaseGoogleBtn').addEventListener('click', async () => {
      try {
        await window.firebaseAuthApi.signInWithGoogle();
      } catch (err) {
        alert('Google sign-in failed');
        console.error(err);
      }
    });
  }
  bindModalGoogleButtons(authInstance);
}

function bootstrapFirebaseAuth(authInstance) {
  if (useFirebase()) {
    initFirebaseHooks(authInstance);
    return;
  }

  const onReady = () => initFirebaseHooks(authInstance);
  window.addEventListener('firebase-auth-ready', onReady, { once: true });

  // Safety polling in case the ready event fires before this listener is attached.
  let tries = 0;
  const maxTries = 40;
  const timer = window.setInterval(() => {
    tries += 1;
    if (useFirebase()) {
      window.clearInterval(timer);
      initFirebaseHooks(authInstance);
      return;
    }
    if (tries >= maxTries) {
      window.clearInterval(timer);
      console.warn('Firebase auth did not initialize in time.');
    }
  }, 100);
}

function initAlumniAnimation() {
  if (typeof window === 'undefined' || !window.lottie) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const container = document.getElementById('alumniLottie');
  if (!container) return;

  const animation = window.lottie.loadAnimation({
    container,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: ALUMNI_ANIMATION_PATH,
    rendererSettings: { preserveAspectRatio: 'xMidYMid meet' }
  });
  animation.setSpeed(0.85);
}

function initPlacementEmptyAnimation() {
  if (typeof window === 'undefined' || !window.lottie) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const container = document.getElementById('placementEmptyLottie');
  if (!container) return;

  if (placementEmptyAnimation) {
    placementEmptyAnimation.destroy();
    placementEmptyAnimation = null;
  }

  placementEmptyAnimation = window.lottie.loadAnimation({
    container,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: PLACEMENT_WORKFLOW_ANIMATION_PATH,
    rendererSettings: { preserveAspectRatio: 'xMidYMid meet' }
  });
  placementEmptyAnimation.setSpeed(0.9);
}

// Helpers
function formatDate(dateString) {
  if (!dateString || /deadline/i.test(dateString)) return 'TBD';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return 'TBD';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function inferCategory(companyName = '') {
  const name = companyName.toLowerCase();
  if (['google', 'amazon', 'microsoft', 'adobe', 'salesforce', 'meta'].some(n => name.includes(n))) return 'product';
  if (['tcs', 'infosys', 'wipro', 'cognizant', 'hcl', 'accenture'].some(n => name.includes(n))) return 'service';
  return 'fresher';
}

function salaryNumber(ctcString = '') {
  const match = ctcString.replace(/[,₹]/g, '').match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : 0;
}

// Placements UI
function createCompanyRow(company, index) {
  const statusClass = company.applied ? 'checked' : '';
  const rowClass = company.applied ? 'applied' : '';
  return `
    <div class="company-row ${rowClass}" data-index="${index}">
      <div class="company-header">
        <div class="company-name">${company.name}</div>
        <div class="status-checkbox ${statusClass}" onclick="toggleStatus(${index})">${company.applied ? '✓' : ''}</div>
      </div>
      <div class="company-details">
        <div class="ctc-info">
          <div class="info-label">CTC</div>
          <div class="ctc-value">${company.ctc}</div>
        </div>
        <div class="date-info">
          <div class="info-label">Last Date</div>
          <div class="last-date">${formatDate(company.lastDate)}</div>
        </div>
        <a href="${company.link || '#'}" target="_blank" class="apply-link">${company.applied ? 'Applied' : 'Apply'}</a>
      </div>
    </div>
  `;
}

function renderCompanies() {
  const companyList = document.getElementById('companyList');
  const appliedCount = document.getElementById('appliedCount');
  const pendingCount = document.getElementById('pendingCount');
  const filtered = companies.filter(c => filterCategory === 'all' || c.category === filterCategory);

  let applied = 0;
  filtered.forEach(c => { if (c.applied) applied += 1; });
  appliedCount.textContent = applied;
  pendingCount.textContent = Math.max(filtered.length - applied, 0);

  if (!filtered.length) {
    const isBootstrapping = companies.length === 0;
    const emptyTitle = isBootstrapping ? 'The Opportunity Engine Is Warming Up' : 'No Drives Match This Filter';
    const emptyMessage = isBootstrapping
      ? 'We are working on it. Fresh company drives and deadlines will drop here soon.'
      : 'Try another quick filter to see active opportunities.';

    companyList.innerHTML = `
      <article class="placement-empty-card">
        <div id="placementEmptyLottie" class="placement-empty-lottie" aria-hidden="true"></div>
        <div class="placement-empty-copy">
          <p class="placement-empty-kicker">Placement Track</p>
          <h3>${emptyTitle}</h3>
          <p>${emptyMessage}</p>
        </div>
      </article>
    `;
    initPlacementEmptyAnimation();
    updatePlacementMetrics(filtered);
    return;
  }

  if (placementEmptyAnimation) {
    placementEmptyAnimation.destroy();
    placementEmptyAnimation = null;
  }

  companyList.innerHTML = filtered.map(createCompanyRow).join('');

  updatePlacementMetrics(filtered);
}

function updatePlacementMetrics(list) {
  const highestEl = document.getElementById('metricHighest');
  const nextEl = document.getElementById('metricNext');
  if (!list || list.length === 0) {
    highestEl.textContent = '-';
    nextEl.textContent = '-';
    return;
  }
  const highest = list.reduce((max, c) => Math.max(max, salaryNumber(c.ctc)), 0);
  highestEl.textContent = highest ? `₹${highest} LPA` : '-';

  const upcoming = list
    .map(c => new Date(c.lastDate))
    .filter(d => !isNaN(d.getTime()) && d >= new Date())
    .sort((a, b) => a - b);
  nextEl.textContent = upcoming.length ? upcoming[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'TBD';
}

function toggleStatus(i) {
  companies[i].applied = !companies[i].applied;
  renderCompanies();
}
window.toggleStatus = toggleStatus;

// Alumni
function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function parseCsv(text = '') {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        field += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (ch === ',' && !inQuotes) {
      row.push(field);
      field = '';
      continue;
    }

    if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field);
      field = '';
      if (row.some((col) => col.trim() !== '')) rows.push(row);
      row = [];
      continue;
    }

    field += ch;
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    if (row.some((col) => col.trim() !== '')) rows.push(row);
  }

  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.replace(/^\uFEFF/, '').trim());
  return rows
    .slice(1)
    .filter((cols) => cols.some((col) => col.trim() !== ''))
    .map((cols) => {
      const mapped = {};
      headers.forEach((header, idx) => {
        mapped[header] = (cols[idx] || '').trim();
      });
      return mapped;
    });
}

function normalizeYear(value = '') {
  const year = String(value).trim();
  return /^\d{4}$/.test(year) ? year : '';
}

function createInitials(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'NA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function createCompanyInitial(company = '') {
  const cleaned = company.trim();
  if (!cleaned) return 'NA';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function toneFromName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return hash % 6;
}

function loadAlumniData() {
  fetch(ALUMNI_CSV_PATH, { cache: 'no-store' })
    .then((res) => {
      if (!res.ok) throw new Error(`Alumni CSV fetch failed: ${res.status}`);
      return res.text();
    })
    .then((csvText) => {
      const parsed = parseCsv(csvText);
      alumniData = parsed
        .map((item, index) => {
          const normalized = Object.fromEntries(
            Object.entries(item).map(([k, v]) => [k.trim(), String(v || '').trim()])
          );
          const name = normalized.Name || 'Unknown Alumni';
          const gradYear = normalizeYear(normalized['Graduation Year']);
          const position = normalized.Position || 'Position not specified';
          const company = normalized.Company || 'Company not specified';
          const dept = normalized.Department || normalized.Dept || normalized.Branch || 'SNIST';
          return {
            id: index + 1,
            name,
            gradYear,
            position,
            company,
            dept,
            initials: createInitials(name),
            companyInitial: createCompanyInitial(company),
            tone: toneFromName(name),
            searchBlob: `${Object.values(normalized).join(' ')} ${dept}`.toLowerCase()
          };
        })
        .filter((a) => a.name && a.name.trim() !== '')
        .sort((a, b) => a.name.localeCompare(b.name));
      alumniCurrentPage = 1;
      populateAlumniFilters();
      updateAlumniSortButtons();
      renderAlumni();
    })
    .catch((err) => {
      console.error(err);
      alumniData = [];
      alumniCurrentPage = 1;
      populateAlumniFilters();
      updateAlumniSortButtons();
      renderAlumni();
    });
}

function populateAlumniFilters() {
  const yearFilter = document.getElementById('alumniYearFilter');
  const companyFilter = document.getElementById('alumniCompanyFilter');
  if (!yearFilter || !companyFilter) return;

  const years = [...new Set(alumniData.map((a) => a.gradYear).filter(Boolean))]
    .sort((a, b) => Number(b) - Number(a));
  const companies = [...new Set(alumniData.map((a) => a.company).filter(Boolean))]
    .sort((a, b) => a.localeCompare(b));

  yearFilter.innerHTML = ['<option value="all">All years</option>', ...years.map((y) => `<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`)].join('');
  companyFilter.innerHTML = ['<option value="all">All companies</option>', ...companies.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)].join('');

  if (alumniFilters.year !== 'all' && !years.includes(alumniFilters.year)) alumniFilters.year = 'all';
  if (alumniFilters.company !== 'all' && !companies.includes(alumniFilters.company)) alumniFilters.company = 'all';

  yearFilter.value = alumniFilters.year;
  companyFilter.value = alumniFilters.company;
}

function getFilteredAlumni() {
  const query = alumniFilters.query.trim().toLowerCase();
  const filtered = alumniData.filter((a) => {
    const matchesQuery = !query || a.searchBlob.includes(query);
    const matchesYear = alumniFilters.year === 'all' || a.gradYear === alumniFilters.year;
    const matchesCompany = alumniFilters.company === 'all' || a.company === alumniFilters.company;
    return matchesQuery && matchesYear && matchesCompany;
  });

  const direction = alumniFilters.sortDir === 'asc' ? 1 : -1;
  return filtered.sort((a, b) => {
    const key = alumniFilters.sortBy;
    if (key === 'gradYear') {
      const aYear = Number(a.gradYear) || 0;
      const bYear = Number(b.gradYear) || 0;
      return (aYear - bYear) * direction || a.name.localeCompare(b.name);
    }
    const aVal = String(a[key] || '').toLowerCase();
    const bVal = String(b[key] || '').toLowerCase();
    return aVal.localeCompare(bVal) * direction || a.name.localeCompare(b.name);
  });
}

function updateAlumniSortButtons() {
  const buttons = document.querySelectorAll('.alumni-sort');
  buttons.forEach((btn) => {
    const sortKey = btn.dataset.sort;
    const icon = btn.querySelector('.sort-icon');
    const isActive = sortKey === alumniFilters.sortBy;
    btn.classList.toggle('is-active', isActive);
    if (!icon) return;
    if (!isActive) {
      icon.textContent = '↕';
      return;
    }
    icon.textContent = alumniFilters.sortDir === 'asc' ? '↑' : '↓';
  });
}

function buildAlumniPageItems(totalPages, currentPage) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, idx) => idx + 1);

  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) pages.push('ellipsis-left');
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push('ellipsis-right');

  pages.push(totalPages);
  return pages;
}

function renderAlumniPagination(totalItems, totalPages) {
  const pagination = document.getElementById('alumniPagination');
  if (!pagination) return;

  if (!totalItems || totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  const pageItems = buildAlumniPageItems(totalPages, alumniCurrentPage);
  const numberButtons = pageItems.map((item) => {
    if (typeof item !== 'number') return '<span class="alumni-page-ellipsis" aria-hidden="true">…</span>';
    const activeClass = item === alumniCurrentPage ? ' is-active' : '';
    const currentAttr = item === alumniCurrentPage ? ' aria-current="page"' : '';
    return `<button type="button" class="alumni-page-btn${activeClass}" data-page="${item}"${currentAttr}>${item}</button>`;
  }).join('');

  const prevDisabled = alumniCurrentPage === 1 ? ' disabled' : '';
  const nextDisabled = alumniCurrentPage === totalPages ? ' disabled' : '';

  pagination.innerHTML = `
    <button type="button" class="alumni-page-nav" data-page="${alumniCurrentPage - 1}"${prevDisabled}>Prev</button>
    <div class="alumni-page-numbers">${numberButtons}</div>
    <button type="button" class="alumni-page-nav" data-page="${alumniCurrentPage + 1}"${nextDisabled}>Next</button>
  `;

  pagination.querySelectorAll('button[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      const targetPage = Number(button.dataset.page);
      if (!Number.isFinite(targetPage)) return;
      const bounded = Math.min(Math.max(targetPage, 1), totalPages);
      if (bounded === alumniCurrentPage) return;
      alumniCurrentPage = bounded;
      renderAlumni();
    });
  });
}

function renderAlumni() {
  const grid = document.getElementById('alumniGrid');
  const count = document.getElementById('alumniResultCount');
  if (!grid) return;
  updateAlumniSortButtons();

  const filtered = getFilteredAlumni();
  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / ALUMNI_PAGE_SIZE));
  alumniCurrentPage = Math.min(Math.max(alumniCurrentPage, 1), totalPages);
  const startIndex = (alumniCurrentPage - 1) * ALUMNI_PAGE_SIZE;
  const endIndex = Math.min(startIndex + ALUMNI_PAGE_SIZE, totalFiltered);
  const currentPageRows = filtered.slice(startIndex, endIndex);

  if (!totalFiltered) {
    if (count) count.textContent = `Showing 0 of ${alumniData.length} alumni`;
    grid.innerHTML = '<div class="empty-state">No alumni match your filters. Try a different name, role, company, or year.</div>';
    renderAlumniPagination(0, 0);
    return;
  }

  if (count) {
    const baseText = `Showing ${startIndex + 1}-${endIndex} of ${totalFiltered} alumni`;
    count.textContent = totalFiltered === alumniData.length ? baseText : `${baseText} (filtered from ${alumniData.length})`;
  }

  grid.innerHTML = currentPageRows.map((a) => `
    <article class="alumni-row">
      <div class="alumni-col alumni-name-col">
        <span class="alumni-avatar avatar-tone-${a.tone}">${escapeHtml(a.initials)}</span>
        <div class="alumni-name-text">
          <h3>${escapeHtml(a.name)}</h3>
          <p class="alumni-name-sub">${escapeHtml(a.dept)}</p>
        </div>
      </div>
      <div class="alumni-col">
        <p class="alumni-role-text">${escapeHtml(a.position)}</p>
      </div>
      <div class="alumni-col alumni-company-col">
        <span class="company-initial">${escapeHtml(a.companyInitial)}</span>
        <p class="alumni-company-name">${escapeHtml(a.company)}</p>
      </div>
      <div class="alumni-col">
        <span class="alumni-pill dept">${escapeHtml(a.dept)}</span>
      </div>
      <div class="alumni-col">
        <span class="alumni-pill batch">${escapeHtml(a.gradYear || '--')}</span>
      </div>
    </article>
  `).join('');
  renderAlumniPagination(totalFiltered, totalPages);
}

// Generic resource list
function renderResourceList(containerId, items) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items.map(item => `
    <div class="card">
      <h3>${item.title}</h3>
      <div class="meta">${item.level}</div>
      <p class="meta">${item.desc}</p>
      <div class="tag-row">
        ${(item.tags || []).map(t => `<span class="tag ${t.includes('product') || t.includes('roadmap') ? 'green' : ''}">${t}</span>`).join('')}
      </div>
      <a class="chip-link" href="${item.link}" target="_blank">Open resource ↗</a>
    </div>
  `).join('');
}

function renderNews() {
  const el = document.getElementById('newsList');
  if (!el) return;
  el.innerHTML = newsItems.map(n => `
    <div class="card">
      <h3>${n.title}</h3>
      <div class="meta">${n.meta}</div>
      <div class="tag-row">
        ${(n.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}
      </div>
      <a class="chip-link" href="${n.link}" target="_blank">Details ↗</a>
    </div>
  `).join('');
}

// Navigation
function initNav() {
  const navItems = document.querySelectorAll('.nav-item');
  const sections = document.querySelectorAll('.section');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      navItems.forEach(n => n.classList.remove('active'));
      item.classList.add('active');
      const target = item.getAttribute('data-section');
      sections.forEach(sec => sec.classList.remove('is-active'));
      const found = document.getElementById(`section-${target}`);
      if (found) found.classList.add('is-active');
    });
  });
}

// Auth class (unchanged core)
class Auth {
  constructor() {
    this.modalOpen = false;
    this.authLottieByModal = {};
    this.prefersReducedMotion = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.users = JSON.parse(localStorage.getItem('snist-users') || '{}');
    this.currentUser = null;
    this.initializeEventListeners();
    this.checkExistingUser();
  }

  normalizeUser(user) {
    if (!user) return null;
    const email = String(user.email || '').trim().toLowerCase();
    const name = String(user.name || '').trim() || deriveNameFromEmail(email) || 'SNIST User';
    if (!email) return null;
    return { ...user, name, email };
  }

  initializeEventListeners() {
    const signupBtn = document.getElementById('signupBtn');
    const loginBtn = document.getElementById('loginBtn');
    const closeButtons = document.querySelectorAll('.close');

    closeButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const modalId = btn.closest('.modal').id;
        this.closeModal(modalId);
      });
    });

    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) this.closeModal(modal.id);
      });
    });

    if (signupBtn) signupBtn.addEventListener('click', (e) => { e.preventDefault(); this.openModal('signupModal'); });
    if (loginBtn) loginBtn.addEventListener('click', (e) => { e.preventDefault(); this.openModal('loginModal'); });
  }

  openModal(modalId) {
    if (this.modalOpen) return;
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('hidden');
      this.modalOpen = true;
      this.playAuthLottie(modalId);
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
      this.modalOpen = false;
      this.pauseAuthLottie(modalId);
    }
  }

  setupAuthLottie(modalId) {
    if (this.prefersReducedMotion || typeof window === 'undefined' || !window.lottie) return null;
    if (this.authLottieByModal[modalId]) return this.authLottieByModal[modalId];

    const containerId = modalId === 'signupModal'
      ? 'authLottieSignup'
      : modalId === 'loginModal'
        ? 'authLottieLogin'
        : null;

    if (!containerId) return null;
    const container = document.getElementById(containerId);
    if (!container) return null;

    const animation = window.lottie.loadAnimation({
      container,
      renderer: 'svg',
      loop: true,
      autoplay: false,
      path: '/assets/lottie/login.json',
      rendererSettings: { preserveAspectRatio: 'xMidYMid meet' }
    });

    this.authLottieByModal[modalId] = animation;
    return animation;
  }

  playAuthLottie(modalId) {
    const animation = this.setupAuthLottie(modalId);
    if (animation) animation.goToAndPlay(0, true);
  }

  pauseAuthLottie(modalId) {
    const animation = this.authLottieByModal[modalId];
    if (animation) animation.pause();
  }

  handleSignup(e) {
    e.preventDefault();
    const nameInput = document.getElementById('signupName');
    const emailInput = document.getElementById('signupEmail');
    const passInput = document.getElementById('signupPassword');
    if (!this.validateEmail(emailInput)) return;
    const email = emailInput.value.trim().toLowerCase();
    if (this.users[email]) {
      alert('User exists, please log in.');
      this.closeModal('signupModal');
      this.openModal('loginModal');
      return;
    }
    if (useFirebase()) {
      window.firebaseAuthApi.signUpEmail(nameInput.value.trim(), email, passInput.value)
        .then((user) => {
          this.setUser({ name: user.displayName || nameInput.value.trim(), email: user.email });
          this.closeModal('signupModal');
        })
        .catch((err) => {
          alert('Signup failed');
          console.error(err);
        });
    } else {
      this.users[email] = { name: nameInput.value.trim(), email, password: passInput.value };
      this.currentUser = this.users[email];
      this.persist();
      this.updateNavbar();
      this.closeModal('signupModal');
    }
  }

  handleLogin(e) {
    e.preventDefault();
    const emailInput = document.getElementById('loginEmail');
    const passInput = document.getElementById('loginPassword');
    if (!this.validateEmail(emailInput)) return;
    const email = emailInput.value.trim().toLowerCase();
    const user = this.users[email];
    if (useFirebase()) {
      window.firebaseAuthApi.signInEmail(email, passInput.value)
        .then((u) => {
          this.setUser({ name: u.displayName || u.email, email: u.email });
          this.closeModal('loginModal');
        })
        .catch(() => alert('Invalid credentials'));
    } else {
      if (!user || user.password !== passInput.value) {
        alert('Invalid credentials');
        return;
      }
      this.currentUser = user;
      this.persist();
      this.updateNavbar();
      this.closeModal('loginModal');
    }
  }

  validateEmail(input) {
    const email = input.value.trim();
    const isValid = /\S+@\S+\.\S+/.test(email);
    if (!isValid && email !== '') { input.classList.add('error'); return false; }
    input.classList.remove('error');
    return true;
  }

  showError(input, message) {
    input.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    input.parentNode.appendChild(errorDiv);
  }

  persist() {
    localStorage.setItem('snist-users', JSON.stringify(this.users));
    localStorage.setItem('snist-current-user', this.currentUser ? JSON.stringify(this.currentUser) : 'null');
  }

  setUser(user) {
    this.currentUser = this.normalizeUser(user);
    this.persist();
    this.updateNavbar();
    window.dispatchEvent(new CustomEvent('snist-auth-changed', { detail: { user: this.currentUser } }));
  }

  checkExistingUser() {
    const saved = JSON.parse(localStorage.getItem('snist-current-user'));
    if (saved) {
      this.currentUser = this.normalizeUser(saved);
      if (!this.currentUser) {
        localStorage.setItem('snist-current-user', 'null');
      }
      this.updateNavbar();
      window.dispatchEvent(new CustomEvent('snist-auth-changed', { detail: { user: this.currentUser } }));
    }
  }

  updateNavbar() {
    const headerButtons = document.querySelector('.header-buttons');
    const googleSlot = document.getElementById('googleSignIn');
    if (!headerButtons) return;
    if (this.currentUser) {
      const displayName = String(this.currentUser.name || '').trim() || deriveNameFromEmail(this.currentUser.email) || 'SNIST User';
      const avatarInitial = displayName.charAt(0).toUpperCase() || 'S';
      if (googleSlot) googleSlot.classList.add('is-hidden');
      headerButtons.innerHTML = `
        <div class="user-menu-wrapper">
          <div class="user-menu" id="userMenu">
            <div class="user-avatar">${avatarInitial}</div>
            <span class="user-name">${displayName}</span>
          </div>
          <div class="user-menu-dropdown hidden" id="userMenuDropdown">
            <div class="dropdown-item" id="logoutBtn">Log out</div>
          </div>
        </div>
      `;
      const menu = document.getElementById('userMenu');
      const dropdown = document.getElementById('userMenuDropdown');
      const logoutBtn = document.getElementById('logoutBtn');
      if (menu && dropdown) {
        menu.addEventListener('click', (e) => {
          e.stopPropagation();
          dropdown.classList.toggle('hidden');
        });
        document.addEventListener('click', () => dropdown.classList.add('hidden'));
      }
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          if (useFirebase() && window.firebaseAuthApi) {
            window.firebaseAuthApi.signOut();
          }
          if (googleSlot) googleSlot.classList.remove('is-hidden');
          this.setUser(null);
          dropdown?.classList.add('hidden');
        });
      }
    } else {
      if (googleSlot) googleSlot.classList.remove('is-hidden');
      headerButtons.innerHTML = `
        <button class="btn btn-primary" id="signupBtn">Sign Up</button>
        <button class="btn btn-ghost" id="loginBtn">Log In</button>
      `;
      this.initializeEventListeners();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.auth = new Auth();
  initThemeToggle();
  initAlumniAnimation();
  initNav();
  loadAlumniData();

  bootstrapFirebaseAuth(window.auth);

  const chipButtons = document.querySelectorAll('.chip');
  chipButtons.forEach(btn => btn.addEventListener('click', () => {
    filterCategory = btn.dataset.filter || 'all';
    chipButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderCompanies();
  }));

  const alumniSearch = document.getElementById('alumniSearch');
  const alumniYearFilter = document.getElementById('alumniYearFilter');
  const alumniCompanyFilter = document.getElementById('alumniCompanyFilter');
  const alumniClearBtn = document.getElementById('alumniClearBtn');
  const alumniSortButtons = document.querySelectorAll('.alumni-sort');

  if (alumniSearch) {
    alumniSearch.addEventListener('input', (e) => {
      alumniFilters.query = e.target.value || '';
      alumniCurrentPage = 1;
      renderAlumni();
    });
  }
  if (alumniYearFilter) {
    alumniYearFilter.addEventListener('change', (e) => {
      alumniFilters.year = e.target.value || 'all';
      alumniCurrentPage = 1;
      renderAlumni();
    });
  }
  if (alumniCompanyFilter) {
    alumniCompanyFilter.addEventListener('change', (e) => {
      alumniFilters.company = e.target.value || 'all';
      alumniCurrentPage = 1;
      renderAlumni();
    });
  }
  if (alumniClearBtn) {
    alumniClearBtn.addEventListener('click', () => {
      alumniFilters.query = '';
      alumniFilters.year = 'all';
      alumniFilters.company = 'all';
      if (alumniSearch) alumniSearch.value = '';
      if (alumniYearFilter) alumniYearFilter.value = 'all';
      if (alumniCompanyFilter) alumniCompanyFilter.value = 'all';
      alumniCurrentPage = 1;
      renderAlumni();
    });
  }
  alumniSortButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selectedSort = btn.dataset.sort || 'name';
      if (alumniFilters.sortBy === selectedSort) {
        alumniFilters.sortDir = alumniFilters.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        alumniFilters.sortBy = selectedSort;
        alumniFilters.sortDir = selectedSort === 'gradYear' ? 'desc' : 'asc';
      }
      alumniCurrentPage = 1;
      renderAlumni();
    });
  });

  document.getElementById('signupForm').addEventListener('submit', (e) => window.auth.handleSignup(e));
  document.getElementById('loginForm').addEventListener('submit', (e) => window.auth.handleLogin(e));

  if (ENABLE_PLACEMENT_ENTRIES) {
    fetch('/api/placements')
      .then(res => res.json())
      .then(data => {
        companies = data.map(c => ({
          name: c.company || 'Unknown',
          ctc: c.salary || 'Salary not specified',
          lastDate: c.lastDate || 'Deadline not specified',
          applied: false,
          link: c.applicationLink || c.link || '#',
          category: inferCategory(c.company)
        }));
        renderCompanies();
      })
      .catch(() => {
        companies = [];
        renderCompanies();
      });
    return;
  }

  companies = [];
  renderCompanies();
});
