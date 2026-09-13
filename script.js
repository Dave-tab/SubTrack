// script.js - Subscription Tracker & Manager v2

const STORAGE_KEY_SUBS = 'subtrack:subscriptions';
const STORAGE_KEY_SETTINGS = 'subtrack:settings';
const STORAGE_KEY_LANDING = 'subtrack:seen_landing';

const EXCHANGE_RATES = {
  NGN: 1,
  USD: 1500,
  EUR: 1600,
  GBP: 1900
};

const CURRENCY_SYMBOLS = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£'
};

const DEFAULT_CATEGORIES = ['Streaming', 'Software', 'Fitness', 'Gaming', 'News/Media', 'Utilities', 'Other'];

let subscriptions = [];
let settings = {
  name: '',
  budget: 50000,
  currency: 'NGN',
  darkMode: false,
  customCategories: []
};
let editingId = null;
let draggedCardId = null;

// DOM Elements
let landingView, appView, skeletonLoader, getStartedBtn, getStartedBtnFooter;
let themeToggleBtn, globalCurrency, settingsBtn, settingsModal, closeSettingsBtn, saveSettingsBtn, userNameInput, monthlyBudgetInput, greetingText;
let dueSoonBanner, dueSoonText, milestoneBanner, milestoneText;
let subForm, formTitle, submitBtn, cancelEditBtn, subIdInput, subNameInput, subCostInput, subCurrencyInput, subCycleInput, subCategoryInput, customCategoryInput, subPriorityInput, subTrialDateInput, subDateInput;
let emptyState, dashboardSection, budgetSection, budgetStatusText, budgetBarFill;
let totalMonthlyEl, totalYearlyEl, activeCountEl, healthScoreNum, healthRingFill, sparklinePath, renewalStrip, categoryBreakdownEl;
let snapshotBody, copySnapshotBtn, downloadSnapshotImgBtn, copyToast;
let cancelCandidatesSection, cancelCandidatesList;
let controlsBar, searchInput, sortSelect, exportCsvBtn;
let gridSection, subCountBadge, subscriptionsGrid, recommendationsSection, recommendationsList;

function initDOMElements() {
  landingView = document.getElementById('landingView');
  appView = document.getElementById('appView');
  skeletonLoader = document.getElementById('skeletonLoader');
  getStartedBtn = document.getElementById('getStartedBtn');
  getStartedBtnFooter = document.getElementById('getStartedBtnFooter');

  themeToggleBtn = document.getElementById('themeToggleBtn');
  globalCurrency = document.getElementById('globalCurrency');
  settingsBtn = document.getElementById('settingsBtn');
  settingsModal = document.getElementById('settingsModal');
  closeSettingsBtn = document.getElementById('closeSettingsBtn');
  saveSettingsBtn = document.getElementById('saveSettingsBtn');
  userNameInput = document.getElementById('userNameInput');
  monthlyBudgetInput = document.getElementById('monthlyBudgetInput');
  greetingText = document.getElementById('greetingText');

  dueSoonBanner = document.getElementById('dueSoonBanner');
  dueSoonText = document.getElementById('dueSoonText');
  milestoneBanner = document.getElementById('milestoneBanner');
  milestoneText = document.getElementById('milestoneText');

  subForm = document.getElementById('subForm');
  formTitle = document.getElementById('formTitle');
  submitBtn = document.getElementById('submitBtn');
  cancelEditBtn = document.getElementById('cancelEditBtn');
  subIdInput = document.getElementById('subId');
  subNameInput = document.getElementById('subName');
  subCostInput = document.getElementById('subCost');
  subCurrencyInput = document.getElementById('subCurrency');
  subCycleInput = document.getElementById('subCycle');
  subCategoryInput = document.getElementById('subCategory');
  customCategoryInput = document.getElementById('customCategoryInput');
  subPriorityInput = document.getElementById('subPriority');
  subTrialDateInput = document.getElementById('subTrialDate');
  subDateInput = document.getElementById('subDate');

  emptyState = document.getElementById('emptyState');
  dashboardSection = document.getElementById('dashboardSection');
  budgetSection = document.getElementById('budgetSection');
  budgetStatusText = document.getElementById('budgetStatusText');
  budgetBarFill = document.getElementById('budgetBarFill');

  totalMonthlyEl = document.getElementById('totalMonthly');
  totalYearlyEl = document.getElementById('totalYearly');
  activeCountEl = document.getElementById('activeCount');
  healthScoreNum = document.getElementById('healthScoreNum');
  healthRingFill = document.getElementById('healthRingFill');
  sparklinePath = document.getElementById('sparklinePath');
  renewalStrip = document.getElementById('renewalStrip');
  categoryBreakdownEl = document.getElementById('categoryBreakdown');

  snapshotBody = document.getElementById('snapshotBody');
  copySnapshotBtn = document.getElementById('copySnapshotBtn');
  downloadSnapshotImgBtn = document.getElementById('downloadSnapshotImgBtn');
  copyToast = document.getElementById('copyToast');

  cancelCandidatesSection = document.getElementById('cancelCandidatesSection');
  cancelCandidatesList = document.getElementById('cancelCandidatesList');

  controlsBar = document.getElementById('controlsBar');
  searchInput = document.getElementById('searchInput');
  sortSelect = document.getElementById('sortSelect');
  exportCsvBtn = document.getElementById('exportCsvBtn');

  gridSection = document.getElementById('gridSection');
  subCountBadge = document.getElementById('subCountBadge');
  subscriptionsGrid = document.getElementById('subscriptionsGrid');
  recommendationsSection = document.getElementById('recommendationsSection');
  recommendationsList = document.getElementById('recommendationsList');
}

// Load & Save State
function loadState() {
  try {
    const rawSubs = localStorage.getItem(STORAGE_KEY_SUBS);
    if (rawSubs) subscriptions = JSON.parse(rawSubs);

    const rawSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (rawSettings) settings = { ...settings, ...JSON.parse(rawSettings) };

    const seenLanding = sessionStorage.getItem(STORAGE_KEY_LANDING);
    if (seenLanding === 'true') {
      landingView.classList.add('hidden');
      appView.classList.remove('hidden');
    }
  } catch (e) {
    console.error('Error loading state', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY_SUBS, JSON.stringify(subscriptions));
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving state', e);
  }
}

// Currency Conversion & Formatting
function convertToSelectedCurrency(cost, fromCurrency, toCurrency) {
  const rateFrom = EXCHANGE_RATES[fromCurrency] || 1;
  const rateTo = EXCHANGE_RATES[toCurrency] || 1;
  const inNgn = cost * rateFrom;
  return inNgn / rateTo;
}

function formatMoney(amountInTargetCurrency) {
  const symbol = CURRENCY_SYMBOLS[settings.currency] || '₦';
  return `${symbol}${amountInTargetCurrency.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function calculateMonthlyEquivalentTarget(sub) {
  const cost = parseFloat(sub.cost) || 0;
  const subCurrency = sub.currency || 'NGN';
  const costInTarget = convertToSelectedCurrency(cost, subCurrency, settings.currency);

  if (sub.cycle === 'weekly') {
    return (costInTarget * 52) / 12;
  } else if (sub.cycle === 'yearly') {
    return costInTarget / 12;
  } else {
    return costInTarget;
  }
}

function calculateTotals(subs) {
  let monthly = 0;
  const byCategory = {};

  subs.forEach(sub => {
    if (sub.paused) return; // skip paused items in totals
    const m = calculateMonthlyEquivalentTarget(sub);
    monthly += m;
    const cat = sub.category || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + m;
  });

  const yearly = monthly * 12;
  return { monthly, yearly, byCategory };
}

// Health Score & Recommendations
function calculateHealthScore(subs, totals) {
  if (subs.length === 0) return 100;
  let score = 100;

  const categoryCounts = {};
  subs.filter(s => !s.paused).forEach(s => {
    categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
  });
  Object.values(categoryCounts).forEach(count => {
    if (count >= 2) score -= 15;
  });

  const reconsideringCount = subs.filter(s => !s.paused && s.priority === 'Reconsidering').length;
  score -= reconsideringCount * 10;

  if (settings.budget > 0 && totals.monthly > settings.budget) {
    score -= 20;
  }

  return Math.max(10, Math.min(100, score));
}

function generateRecommendations(subs, totals) {
  const recs = [];
  const activeSubs = subs.filter(s => !s.paused);
  if (activeSubs.length === 0) return recs;

  const categoryCounts = {};
  activeSubs.forEach(s => { categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1; });
  Object.entries(categoryCounts).forEach(([cat, count]) => {
    if (count >= 2 && recs.length < 4) {
      recs.push({
        type: 'warning',
        text: `You have ${count} active subscriptions in "${cat}". Review for feature overlap or bundle discounts.`
      });
    }
  });

  activeSubs.forEach(s => {
    if (s.cycle === 'monthly' && recs.length < 4) {
      const monthlyCost = calculateMonthlyEquivalentTarget(s);
      const yearlyEquivalent = monthlyCost * 12;
      const potentialYearly = convertToSelectedCurrency(parseFloat(s.cost) * 10, s.currency || 'NGN', settings.currency);
      const savings = yearlyEquivalent - potentialYearly;
      if (savings > 0) {
        recs.push({
          type: 'success',
          text: `Switching "${s.name}" from monthly to yearly billing could save you approximately ${formatMoney(savings)} a year.`
        });
      }
    }
  });

  if (settings.budget > 0 && totals.monthly > settings.budget && recs.length < 4) {
    recs.push({
      type: 'warning',
      text: `Your monthly spend (${formatMoney(totals.monthly)}) exceeds your budget goal (${formatMoney(settings.budget)}). Consider pausing a "Nice-to-have" or "Reconsidering" item.`
    });
  }

  activeSubs.forEach(s => {
    if (!s.nextPaymentDate && recs.length < 4) {
      recs.push({
        type: 'info',
        text: `"${s.name}" is missing a next payment date. Set one to populate your renewal calendar.`
      });
    }
  });

  if (recs.length === 0) {
    recs.push({
      type: 'success',
      text: "Your subscriptions are well-balanced and you're staying under budget!"
    });
  }

  return recs.slice(0, 4);
}

function getCancelCandidates(subs) {
  return subs.filter(s => !s.paused && (s.priority === 'Reconsidering' || !s.nextPaymentDate));
}

// CRUD
function addSubscription(formData) {
  const newSub = {
    id: 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9),
    name: formData.name.trim(),
    cost: parseFloat(formData.cost),
    currency: formData.currency,
    cycle: formData.cycle,
    category: formData.category,
    priority: formData.priority,
    trialEndDate: formData.trialEndDate || null,
    nextPaymentDate: formData.nextPaymentDate || null,
    paused: false
  };
  subscriptions.push(newSub);
  saveState();
  renderApp();
}

function editSubscription(id, formData) {
  const idx = subscriptions.findIndex(s => s.id === id);
  if (idx !== -1) {
    subscriptions[idx] = {
      ...subscriptions[idx],
      name: formData.name.trim(),
      cost: parseFloat(formData.cost),
      currency: formData.currency,
      cycle: formData.cycle,
      category: formData.category,
      priority: formData.priority,
      trialEndDate: formData.trialEndDate || null,
      nextPaymentDate: formData.nextPaymentDate || null
    };
    saveState();
    renderApp();
  }
}

function deleteSubscription(id) {
  const sub = subscriptions.find(s => s.id === id);
  subscriptions = subscriptions.filter(s => s.id !== id);
  saveState();
  if (sub) {
    showMilestoneBanner(sub);
  }
  renderApp();
}

function togglePauseSubscription(id) {
  const sub = subscriptions.find(s => s.id === id);
  if (sub) {
    sub.paused = !sub.paused;
    saveState();
    if (sub.paused) {
      showMilestoneBanner(sub);
    }
    renderApp();
  }
}

function showMilestoneBanner(sub) {
  const monthlyVal = calculateMonthlyEquivalentTarget(sub);
  milestoneText.textContent = `Nice! Pausing or removing "${sub.name}" puts about ${formatMoney(monthlyVal)} a month back in your pocket.`;
  milestoneBanner.classList.remove('hidden');
  setTimeout(() => {
    milestoneBanner.classList.add('hidden');
  }, 5000);
}

// Render App
function renderApp() {
  applyTheme();
  updateCategoryDropdown();

  const searchTerm = searchInput.value.toLowerCase();
  const sortMode = sortSelect.value;

  let filtered = subscriptions.filter(s => s.name.toLowerCase().includes(searchTerm));

  filtered.sort((a, b) => {
    if (sortMode === 'name') return a.name.localeCompare(b.name);
    if (sortMode === 'cost-desc') return calculateMonthlyEquivalentTarget(b) - calculateMonthlyEquivalentTarget(a);
    if (sortMode === 'cost-asc') return calculateMonthlyEquivalentTarget(a) - calculateMonthlyEquivalentTarget(b);
    if (sortMode === 'date') {
      if (!a.nextPaymentDate) return 1;
      if (!b.nextPaymentDate) return -1;
      return new Date(a.nextPaymentDate) - new Date(b.nextPaymentDate);
    }
    return 0;
  });

  const totals = calculateTotals(subscriptions);
  const isEmpty = subscriptions.length === 0;

  if (isEmpty) {
    emptyState.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
    cancelCandidatesSection.classList.add('hidden');
    controlsBar.classList.add('hidden');
    gridSection.classList.add('hidden');
    recommendationsSection.classList.add('hidden');
  } else {
    emptyState.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    controlsBar.classList.remove('hidden');
    gridSection.classList.remove('hidden');
    recommendationsSection.classList.remove('hidden');
  }

  greetingText.textContent = settings.name ? `Hey ${settings.name}, here's your subscription snapshot.` : `Hey there, here's your subscription snapshot.`;
  
  if (settings.budget > 0) {
    budgetSection.classList.remove('hidden');
    const pct = Math.min(100, (totals.monthly / settings.budget) * 100);
    budgetStatusText.textContent = `${formatMoney(totals.monthly)} / ${formatMoney(settings.budget)}`;
    budgetBarFill.style.width = `${pct}%`;
    budgetBarFill.style.backgroundColor = totals.monthly > settings.budget ? '#C53030' : 'var(--color-accent)';
  } else {
    budgetSection.classList.add('hidden');
  }

  totalMonthlyEl.textContent = formatMoney(totals.monthly);
  totalYearlyEl.textContent = formatMoney(totals.yearly);
  activeCountEl.textContent = `${subscriptions.filter(s => !s.paused).length} active subscription${subscriptions.filter(s => !s.paused).length === 1 ? '' : 's'}`;
  subCountBadge.textContent = subscriptions.length;

  const health = calculateHealthScore(subscriptions, totals);
  healthScoreNum.textContent = health;
  healthRingFill.style.strokeDasharray = `${health}, 100`;

  renderRenewalStrip();
  renderSparkline();
  renderCategoryBreakdown(totals.byCategory, totals.monthly);
  renderShareSnapshot(totals);

  const candidates = getCancelCandidates(subscriptions);
  if (candidates.length > 0) {
    cancelCandidatesSection.classList.remove('hidden');
    renderCancelCandidates(candidates);
  } else {
    cancelCandidatesSection.classList.add('hidden');
  }

  renderGrid(filtered);
  renderRecommendations(totals);
  checkDueSoonBanner();
}

function applyTheme() {
  if (settings.darkMode) {
    document.body.classList.add('dark-mode');
  } else {
    document.body.classList.remove('dark-mode');
  }
  globalCurrency.value = settings.currency;
  document.querySelectorAll('.currency-symbol').forEach(el => {
    el.textContent = CURRENCY_SYMBOLS[settings.currency] || '₦';
  });
}

function updateCategoryDropdown() {
  const allCats = [...DEFAULT_CATEGORIES, ...(settings.customCategories || [])];
  subCategoryInput.innerHTML = '';
  allCats.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    subCategoryInput.appendChild(opt);
  });
  const addCustomOpt = document.createElement('option');
  addCustomOpt.value = 'ADD_NEW';
  addCustomOpt.textContent = '+ Add Custom Category...';
  subCategoryInput.appendChild(addCustomOpt);
}

function renderRenewalStrip() {
  renewalStrip.innerHTML = '';
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    const dueSubs = subscriptions.filter(s => !s.paused && s.nextPaymentDate === dateStr);
    const dayEl = document.createElement('div');
    dayEl.className = `strip-day ${dueSubs.length > 0 ? 'has-due' : ''}`;
    dayEl.title = `${d.toLocaleDateString(undefined, {month:'short', day:'numeric'})}${dueSubs.length > 0 ? ': ' + dueSubs.map(s => s.name).join(', ') : ''}`;
    dayEl.innerHTML = `
      <span>${d.getDate()}</span>
      ${dueSubs.length > 0 ? '<div class="strip-dot"></div>' : ''}
    `;
    renewalStrip.appendChild(dayEl);
  }
}

function renderSparkline() {
  const totals = calculateTotals(subscriptions);
  const base = totals.monthly;
  const points = [base * 0.9, base * 0.95, base * 0.88, base * 1.05, base * 0.98, base];
  const max = Math.max(...points, 100);
  const pathD = points.map((p, i) => {
    const x = (i / (points.length - 1)) * 300;
    const y = 50 - (p / max) * 40;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');
  sparklinePath.setAttribute('d', pathD);
}

function renderCategoryBreakdown(byCategory, totalMonthly) {
  categoryBreakdownEl.innerHTML = '';
  const cats = Object.keys(byCategory);
  if (cats.length === 0) {
    categoryBreakdownEl.innerHTML = '<p class="text-muted text-sm">No category data yet.</p>';
    return;
  }
  cats.forEach(cat => {
    const amt = byCategory[cat];
    const pct = totalMonthly > 0 ? (amt / totalMonthly) * 100 : 0;
    const item = document.createElement('div');
    item.className = 'breakdown-item';
    item.innerHTML = `
      <div class="breakdown-info">
        <span>${cat}</span>
        <span>${formatMoney(amt)}/mo (${pct.toFixed(0)}%)</span>
      </div>
      <div class="breakdown-bar-bg">
        <div class="breakdown-bar-fill" style="width: ${pct}%"></div>
      </div>
    `;
    categoryBreakdownEl.appendChild(item);
  });
}

function renderShareSnapshot(totals) {
  let topCat = 'None';
  let maxAmt = 0;
  Object.entries(totals.byCategory).forEach(([cat, amt]) => {
    if (amt > maxAmt) { maxAmt = amt; topCat = cat; }
  });
  const activeCount = subscriptions.filter(s => !s.paused).length;
  snapshotBody.innerHTML = `
    Tracking <strong>${activeCount} active subscription${activeCount === 1 ? '' : 's'}</strong> totaling <strong>${formatMoney(totals.monthly)}/month</strong> (${formatMoney(totals.yearly)}/year). Top category is <strong>${topCat}</strong> at ${formatMoney(maxAmt)}/mo. Staying on top of bills with SubTrack!
  `;
}

function renderCancelCandidates(candidates) {
  cancelCandidatesList.innerHTML = '';
  candidates.forEach(sub => {
    const item = document.createElement('div');
    item.className = 'rec-item warning';
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(sub.name)}</strong> (${formatMoney(convertToSelectedCurrency(sub.cost, sub.currency || 'NGN', settings.currency))}/${sub.cycle}) — Priority: ${sub.priority}${!sub.nextPaymentDate ? ', No renewal date set' : ''}
      </div>
      <button type="button" class="btn btn-sm btn-danger pause-cand-btn" data-id="${sub.id}">Pause / Cut</button>
    `;
    cancelCandidatesList.appendChild(item);
  });
}

function renderGrid(filtered) {
  subscriptionsGrid.innerHTML = '';
  filtered.forEach(sub => {
    const card = document.createElement('div');
    card.className = `sub-card ${sub.paused ? 'paused' : ''}`;
    card.setAttribute('data-id', sub.id);
    card.setAttribute('draggable', 'true');

    const currency = sub.currency || 'NGN';
    const convertedCost = convertToSelectedCurrency(sub.cost, currency, settings.currency);
    const formattedCost = convertedCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const symbol = CURRENCY_SYMBOLS[settings.currency] || '₦';

    let trialHtml = '';
    if (sub.trialEndDate) {
      const daysLeft = Math.ceil((new Date(sub.trialEndDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (daysLeft >= 0) {
        trialHtml = `<span class="trial-badge">Trial ends in ${daysLeft}d</span>`;
      }
    }

    const dateFormatted = sub.nextPaymentDate ? new Date(sub.nextPaymentDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'No renewal date';

    card.innerHTML = `
      <div class="sub-card-header">
        <div class="sub-name-area">
          <span class="sub-name">${escapeHtml(sub.name)}</span>
          <div class="badges-row">
            <span class="sub-category-tag">${escapeHtml(sub.category)}</span>
            <span class="priority-tag ${sub.priority}">${sub.priority}</span>
            ${trialHtml}
            ${sub.paused ? '<span class="trial-badge" style="background:#EDF2F7; color:#4A5568;">Paused</span>' : ''}
          </div>
        </div>
        <button type="button" class="sub-edit-icon-btn edit-btn" data-id="${sub.id}" title="Edit Subscription">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
        </button>
      </div>
      <div class="sub-card-body">
        <div class="sub-cost-display">${symbol}${formattedCost}</div>
        <div class="sub-cycle-text">Billed ${sub.cycle}</div>
        <div class="sub-date-text">Next: ${dateFormatted}</div>
      </div>
      <div class="sub-card-footer">
        <div class="card-actions-left">
          <button type="button" class="btn btn-secondary btn-sm pause-btn" data-id="${sub.id}">${sub.paused ? 'Resume' : 'Pause'}</button>
        </div>
        <div class="card-actions-right">
          <button type="button" class="btn btn-danger btn-sm delete-prompt-btn" data-id="${sub.id}">Delete</button>
        </div>
      </div>
    `;

    card.addEventListener('dragstart', (e) => {
      draggedCardId = sub.id;
      card.classList.add('dragging');
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('dragging');
      draggedCardId = null;
    });
    card.addEventListener('dragover', (e) => e.preventDefault());
    card.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!draggedCardId || draggedCardId === sub.id) return;
      const fromIdx = subscriptions.findIndex(s => s.id === draggedCardId);
      const toIdx = subscriptions.findIndex(s => s.id === sub.id);
      if (fromIdx !== -1 && toIdx !== -1) {
        const [moved] = subscriptions.splice(fromIdx, 1);
        subscriptions.splice(toIdx, 0, moved);
        saveState();
        renderApp();
      }
    });

    subscriptionsGrid.appendChild(card);
  });
}

function renderRecommendations(totals) {
  recommendationsList.innerHTML = '';
  const recs = generateRecommendations(subscriptions, totals);
  recs.forEach(rec => {
    const item = document.createElement('div');
    item.className = `rec-item ${rec.type}`;
    item.innerHTML = `<div><p>${escapeHtml(rec.text)}</p></div>`;
    recommendationsList.appendChild(item);
  });
}

function checkDueSoonBanner() {
  const today = new Date();
  const upcoming = subscriptions.find(s => {
    if (s.paused || !s.nextPaymentDate) return false;
    const d = new Date(s.nextPaymentDate);
    const diffDays = (d - today) / (1000 * 60 * 60 * 24);
    return diffDays >= 0 && diffDays <= 3;
  });

  if (upcoming) {
    dueSoonText.textContent = `"${upcoming.name}" is renewing soon on ${upcoming.nextPaymentDate}!`;
    dueSoonBanner.classList.remove('hidden');
  } else {
    dueSoonBanner.classList.add('hidden');
  }
}

function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function bindEvents() {
  const enterApp = () => {
    sessionStorage.setItem(STORAGE_KEY_LANDING, 'true');
    if (landingView) landingView.classList.add('hidden');
    if (skeletonLoader) skeletonLoader.classList.remove('hidden');
    if (appView) appView.classList.remove('hidden');
    setTimeout(() => {
      if (skeletonLoader) skeletonLoader.classList.add('hidden');
      renderApp();
    }, 400);
  };
  if (getStartedBtn) getStartedBtn.addEventListener('click', enterApp);
  if (getStartedBtnFooter) getStartedBtnFooter.addEventListener('click', enterApp);

  const sidebarLogo = document.querySelector('.sidebar-logo');
  if (sidebarLogo) {
    sidebarLogo.style.cursor = 'pointer';
    sidebarLogo.title = 'Back to Landing Page';
    sidebarLogo.addEventListener('click', () => {
      sessionStorage.removeItem(STORAGE_KEY_LANDING);
      if (appView) appView.classList.add('hidden');
      if (landingView) landingView.classList.remove('hidden');
    });
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      settings.darkMode = !settings.darkMode;
      saveState();
      applyTheme();
    });
  }

  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const appSidebar = document.getElementById('appSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');
  const sidebarSettingsBtn = document.getElementById('sidebarSettingsBtn');

  if (hamburgerBtn && appSidebar && sidebarOverlay) {
    const toggleSidebar = () => {
      appSidebar.classList.toggle('open');
      sidebarOverlay.classList.toggle('hidden');
    };
    hamburgerBtn.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);
  }

  if (sidebarSettingsBtn) {
    sidebarSettingsBtn.addEventListener('click', () => {
      if (userNameInput) userNameInput.value = settings.name || '';
      if (monthlyBudgetInput) monthlyBudgetInput.value = settings.budget || '';
      if (settingsModal) settingsModal.classList.toggle('hidden');
      if (window.innerWidth < 1024 && appSidebar && sidebarOverlay) {
        appSidebar.classList.remove('open');
        sidebarOverlay.classList.add('hidden');
      }
    });
  }

  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const targetId = link.getAttribute('data-target');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth' });
      }
      if (window.innerWidth < 1024 && appSidebar && sidebarOverlay) {
        appSidebar.classList.remove('open');
        sidebarOverlay.classList.add('hidden');
      }
    });
  });

  // Auto-reset mobile sidebar state on desktop viewport resize
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) {
      if (appSidebar) appSidebar.classList.remove('open');
      if (sidebarOverlay) sidebarOverlay.classList.add('hidden');
    }
  });

  // IntersectionObserver to auto-update active navigation link on scroll
  const observerOptions = {
    root: null,
    rootMargin: '-20% 0px -60% 0px',
    threshold: 0.1
  };

  const observerCallback = (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const targetId = entry.target.id;
        document.querySelectorAll('.sidebar-link').forEach(link => {
          if (link.getAttribute('data-target') === targetId) {
            link.classList.add('active');
          } else {
            link.classList.remove('active');
          }
        });
      }
    });
  };

  const sectionObserver = new IntersectionObserver(observerCallback, observerOptions);
  ['dashboardSection', 'gridSection', 'formSection', 'recommendationsSection', 'snapshotCard'].forEach(id => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });

  if (globalCurrency) {
    globalCurrency.addEventListener('change', (e) => {
      settings.currency = e.target.value;
      saveState();
      renderApp();
    });
  }

  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      if (userNameInput) userNameInput.value = settings.name || '';
      if (monthlyBudgetInput) monthlyBudgetInput.value = settings.budget || '';
      if (settingsModal) settingsModal.classList.toggle('hidden');
    });
  }
  if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', () => settingsModal && settingsModal.classList.add('hidden'));
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      if (userNameInput) settings.name = userNameInput.value.trim();
      if (monthlyBudgetInput) settings.budget = parseFloat(monthlyBudgetInput.value) || 0;
      saveState();
      if (settingsModal) settingsModal.classList.add('hidden');
      renderApp();
    });
  }

  if (subCategoryInput) {
    subCategoryInput.addEventListener('change', (e) => {
      if (e.target.value === 'ADD_NEW') {
        if (customCategoryInput) {
          customCategoryInput.classList.remove('hidden');
          customCategoryInput.focus();
        }
      } else {
        if (customCategoryInput) {
          customCategoryInput.classList.add('hidden');
          customCategoryInput.value = '';
        }
      }
    });
  }

  if (subForm) {
    subForm.addEventListener('submit', (e) => {
      e.preventDefault();
      let isValid = true;
      const nameVal = subNameInput ? subNameInput.value.trim() : '';
      const costVal = subCostInput ? parseFloat(subCostInput.value) : NaN;

      const nameGroup = subNameInput ? subNameInput.closest('.form-group') : null;
      const costGroup = subCostInput ? subCostInput.closest('.form-group') : null;

      if (!nameVal) { if (nameGroup) nameGroup.classList.add('invalid'); isValid = false; } else { if (nameGroup) nameGroup.classList.remove('invalid'); }
      if (isNaN(costVal) || costVal <= 0) { if (costGroup) costGroup.classList.add('invalid'); isValid = false; } else { if (costGroup) costGroup.classList.remove('invalid'); }
      if (!isValid) return;

      let catVal = subCategoryInput ? subCategoryInput.value : 'Other';
      if (catVal === 'ADD_NEW') {
        const customCat = customCategoryInput ? customCategoryInput.value.trim() : '';
        if (customCat) {
          if (!settings.customCategories) settings.customCategories = [];
          if (!settings.customCategories.includes(customCat) && !DEFAULT_CATEGORIES.includes(customCat)) {
            settings.customCategories.push(customCat);
          }
          catVal = customCat;
        } else {
          catVal = 'Other';
        }
      }

      const formData = {
        name: nameVal,
        cost: costVal,
        currency: subCurrencyInput ? subCurrencyInput.value : 'NGN',
        cycle: subCycleInput ? subCycleInput.value : 'monthly',
        category: catVal,
        priority: subPriorityInput ? subPriorityInput.value : 'Must-have',
        trialEndDate: subTrialDateInput && subTrialDateInput.value ? subTrialDateInput.value : null,
        nextPaymentDate: subDateInput && subDateInput.value ? subDateInput.value : null
      };

      if (editingId) {
        editSubscription(editingId, formData);
        resetForm();
      } else {
        addSubscription(formData);
        if (subForm) subForm.reset();
        if (customCategoryInput) customCategoryInput.classList.add('hidden');
      }
    });
  }

  if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => resetForm());

  if (searchInput) searchInput.addEventListener('input', () => renderApp());
  if (sortSelect) sortSelect.addEventListener('change', () => renderApp());
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      let csvContent = "data:text/csv;charset=utf-8,Name,Cost,Currency,Cycle,Category,Priority,NextPaymentDate,Paused\n";
      subscriptions.forEach(s => {
        csvContent += `"${s.name}",${s.cost},${s.currency || 'NGN'},${s.cycle},"${s.category}","${s.priority}",${s.nextPaymentDate || ''},${s.paused}\n`;
      });
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "subtrack_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }

  if (subscriptionsGrid) {
    subscriptionsGrid.addEventListener('click', (e) => {
      const target = e.target;
      const card = target.closest('.sub-card');
      if (!card) return;
      const id = card.getAttribute('data-id');

      const editBtn = target.classList.contains('edit-btn') ? target : target.closest('.edit-btn');
      if (editBtn) {
        const sub = subscriptions.find(s => s.id === id);
        if (sub) {
          editingId = sub.id;
          if (subIdInput) subIdInput.value = sub.id;
          if (subNameInput) subNameInput.value = sub.name;
          if (subCostInput) subCostInput.value = sub.cost;
          if (subCurrencyInput) subCurrencyInput.value = sub.currency || 'NGN';
          if (subCycleInput) subCycleInput.value = sub.cycle;
          
          const allCats = [...DEFAULT_CATEGORIES, ...(settings.customCategories || [])];
          if (!allCats.includes(sub.category)) {
            settings.customCategories.push(sub.category);
            updateCategoryDropdown();
          }
          if (subCategoryInput) subCategoryInput.value = sub.category;
          if (customCategoryInput) customCategoryInput.classList.add('hidden');

          if (subPriorityInput) subPriorityInput.value = sub.priority || 'Must-have';
          if (subTrialDateInput) subTrialDateInput.value = sub.trialEndDate || '';
          if (subDateInput) subDateInput.value = sub.nextPaymentDate || '';

          if (formTitle) formTitle.textContent = 'Edit Subscription';
          if (submitBtn) submitBtn.textContent = 'Save Changes';
          if (cancelEditBtn) cancelEditBtn.classList.remove('hidden');
          const formSection = document.getElementById('formSection');
          if (formSection) formSection.scrollIntoView({ behavior: 'smooth' });
        }
      }

      if (target.classList.contains('pause-btn')) {
        togglePauseSubscription(id);
      }

      if (target.classList.contains('delete-prompt-btn')) {
        card.classList.add('delete-confirm');
        const sub = subscriptions.find(s => s.id === id);
        card.innerHTML = `
          <div class="delete-confirm-content">
            <p>Delete "${escapeHtml(sub ? sub.name : 'this item')}"?</p>
            <div class="delete-confirm-actions">
              <button type="button" class="btn btn-danger btn-sm confirm-yes" data-id="${id}">Yes, Delete</button>
              <button type="button" class="btn btn-secondary btn-sm confirm-no" data-id="${id}">Cancel</button>
            </div>
          </div>
        `;
      }

      if (target.classList.contains('confirm-yes')) {
        deleteSubscription(id);
        if (editingId === id) resetForm();
      }

      if (target.classList.contains('confirm-no')) {
        renderApp();
      }
    });
  }

  if (cancelCandidatesList) {
    cancelCandidatesList.addEventListener('click', (e) => {
      if (e.target.classList.contains('pause-cand-btn')) {
        const id = e.target.getAttribute('data-id');
        togglePauseSubscription(id);
      }
    });
  }

  if (copySnapshotBtn) {
    copySnapshotBtn.addEventListener('click', () => {
      const text = snapshotBody ? snapshotBody.innerText : '';
      navigator.clipboard.writeText(text).then(() => {
        if (copyToast) {
          copyToast.classList.remove('hidden');
          setTimeout(() => copyToast.classList.add('hidden'), 2000);
        }
      });
    });
  }

  if (downloadSnapshotImgBtn) {
    downloadSnapshotImgBtn.addEventListener('click', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 600, 300);
      grad.addColorStop(0, settings.darkMode ? '#1E293B' : '#16274F');
      grad.addColorStop(1, settings.darkMode ? '#0F172A' : '#24396B');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 300);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 24px system-ui';
      ctx.fillText('SubTrack Spending Snapshot', 40, 50);

      ctx.font = '16px system-ui';
      ctx.fillStyle = '#E2E8F0';
      const totals = calculateTotals(subscriptions);
      const activeCount = subscriptions.filter(s => !s.paused).length;
      const text1 = `Active Subscriptions: ${activeCount}`;
      const text2 = `Monthly Spend: ${formatMoney(totals.monthly)}`;
      const text3 = `Yearly Spend: ${formatMoney(totals.yearly)}`;

      ctx.fillText(text1, 40, 110);
      ctx.fillText(text2, 40, 150);
      ctx.fillText(text3, 40, 190);

      ctx.font = 'italic 12px system-ui';
      ctx.fillStyle = '#94A3B8';
      ctx.fillText('Generated with SubTrack — Private Subscription Manager', 40, 260);

      const link = document.createElement('a');
      link.download = 'subtrack_snapshot.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }
}

function resetForm() {
  editingId = null;
  subForm.reset();
  subIdInput.value = '';
  subCurrencyInput.value = settings.currency || 'NGN';
  customCategoryInput.classList.add('hidden');
  formTitle.textContent = 'Add New Subscription';
  submitBtn.textContent = 'Add Subscription';
  cancelEditBtn.classList.add('hidden');
  document.querySelectorAll('.form-group').forEach(g => g.classList.remove('invalid'));
}

function initApp() {
  initDOMElements();
  loadState();
  bindEvents();
  applyTheme();
  updateCategoryDropdown();
  if (sessionStorage.getItem(STORAGE_KEY_LANDING) === 'true') {
    renderApp();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
