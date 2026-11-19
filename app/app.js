// Vice City Trophy Ledger — offline guide + tracker for the 55 GTA VI PS5 trophies.
// Data lives in data/trophies.json. Progress lives in localStorage. No network calls.
const EARNED_KEY = 'vctl-earned-v1';
const SPOILER_KEY = 'vctl-spoiler-v1';
const TOTAL = 55;
const DEMO_EARNED = [2, 3, 5, 8, 10, 16, 20, 21, 33, 44, 46, 51];
const KIND_LABELS = {
  story: 'Story', strand: 'Stranger strand', activity: 'Activity',
  collectible: 'Collectible', exploration: 'Exploration', crime: 'Crime',
  economy: 'Economy', misc: 'Misc', platinum: 'Platinum'
};
const STAGES = [
  { n: 1, title: 'Story — Chapters 1–5', meta: 'About 60–80 hours · 15 trophies',
    blurb: 'Play the five chapters in order and grab the one-time moments on the way: the opening mission, the Chapter 1 meditation at Jason’s house, the VCIA departure, the showroom smash and the jewelry robbery.' },
  { n: 2, title: 'Side strands — Strangers & Freaks', meta: 'About 10 hours, alongside the story · 7 trophies',
    blurb: 'Work the stranger strands to their finales. You need 8 finished strands for the silver, and every finale is a one-time mission with no replay.' },
  { n: 3, title: 'Activities — ranges, races, challenges', meta: 'Part of the checklist phase · 9 trophies',
    blurb: 'Gold all 42 Shooting Range challenges, win a Top Fun drone race at all 14 locations, win 20 different races, and clear 50 of the 80 Challenges.' },
  { n: 4, title: 'Collectibles & exploration', meta: 'Part of the checklist phase · 7 trophies',
    blurb: '3 card sets, WAiNK at 100 locations, 100 vehicles discovered, all 52 areas explored, all 8 garages, 10 Scooter Bros registrations, and a cocktail on Ocean Beach.' },
  { n: 5, title: 'Crime, economy & the platinum', meta: 'Cleanup after the story · 17 trophies',
    blurb: 'Bank vaults, armored trucks, gang operations, Marked Bills laundering, $100,000 of shopping, and the 100% Completion Checklist — then the platinum.' }
];

const params = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
const rowsEl = $('rows'), missableRowsEl = $('missableRows'), guideEl = $('guide');
const ringEl = $('ring'), progressTextEl = $('progressText'), percentTextEl = $('percentText');
const gradeChipsEl = $('gradeChips'), showingEl = $('showing');
const kindSel = $('kind'), gradeSel = $('grade'), statusSel = $('status');
const missableOnlyEl = $('missableOnly'), searchEl = $('search'), spoilerEl = $('spoiler');

let doc = { trophies: [] };
let earned = new Set();
let spoiler = false;
let selectedId = null;

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined && text !== null) node.textContent = text;
  return node;
}
function save() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}
function loadSave() {
  try {
    const raw = localStorage.getItem(EARNED_KEY);
    if (raw) earned = new Set(JSON.parse(raw).filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL));
  } catch (e) { earned = new Set(); }
}
function isHidden(t) {
  return spoiler && t.kind === 'story' && !earned.has(t.id);
}
function gradeBadge(grade) {
  return el('span', 'badge ' + grade, grade);
}
function trophyRow(t, showMissableNote) {
  const tr = document.createElement('tr');
  if (earned.has(t.id)) tr.classList.add('earned-row');
  const checkTd = el('td', 'col-check');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.setAttribute('aria-label', 'Earned: ' + t.name);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.id); else earned.delete(t.id);
    save();
    renderAll();
    if (selectedId === t.id) openGuide(t.id);
  });
  checkTd.appendChild(box);
  tr.appendChild(checkTd);
  const gradeTd = el('td', 'col-grade');
  gradeTd.appendChild(gradeBadge(t.grade));
  tr.appendChild(gradeTd);
  const nameTd = document.createElement('td');
  if (isHidden(t)) {
    nameTd.appendChild(el('div', 'tname spoiler-name', '··· hidden story trophy ···'));
    nameTd.appendChild(el('div', 'tdesc', 'Earn this trophy to reveal its name.'));
  } else {
    nameTd.appendChild(el('div', 'tname' + (earned.has(t.id) ? ' earned' : ''), t.name));
    nameTd.appendChild(el('div', 'tdesc', t.description));
  }
  tr.appendChild(nameTd);
  const kindTd = el('td', 'col-kind');
  kindTd.appendChild(el('span', 'kind-label', KIND_LABELS[t.kind] || t.kind));
  tr.appendChild(kindTd);
  const missTd = el('td', 'col-miss');
  if (t.missable) missTd.appendChild(el('span', 'miss-flag', 'Missable'));
  else missTd.textContent = '—';
  tr.appendChild(missTd);
  const guideTd = el('td', 'col-guide');
  const btn = el('button', 'guide-btn', 'Guide');
  btn.type = 'button';
  btn.addEventListener('click', () => openGuide(t.id));
  guideTd.appendChild(btn);
  tr.appendChild(guideTd);
  if (showMissableNote) {
    const noteTd = document.createElement('td');
    noteTd.textContent = t.missableNote || '';
    tr.appendChild(noteTd);
  }
  return tr;
}
function filtered() {
  const q = searchEl.value.trim().toLowerCase();
  return doc.trophies.filter((t) => {
    if (kindSel.value !== 'all' && t.kind !== kindSel.value) return false;
    if (gradeSel.value !== 'all' && t.grade !== gradeSel.value) return false;
    if (statusSel.value === 'earned' && !earned.has(t.id)) return false;
    if (statusSel.value === 'not' && earned.has(t.id)) return false;
    if (missableOnlyEl.checked && !t.missable) return false;
    if (q && !(t.name + ' ' + t.description + ' ' + t.guide + ' ' + (KIND_LABELS[t.kind] || '')).toLowerCase().includes(q)) return false;
    return true;
  });
}
function renderHeader() {
  const n = earned.size;
  const pct = Math.round((n / TOTAL) * 100);
  progressTextEl.textContent = n + ' of ' + TOTAL + ' earned';
  percentTextEl.textContent = pct + '% to platinum';
  ringEl.style.strokeDashoffset = String(251.3 * (1 - n / TOTAL));
  gradeChipsEl.replaceChildren();
  for (const g of ['platinum', 'gold', 'silver', 'bronze']) {
    const total = doc.trophies.filter((t) => t.grade === g).length;
    const got = doc.trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
    const chip = el('span', 'chip', g.charAt(0).toUpperCase() + g.slice(1));
    chip.appendChild(el('b', null, got + '/' + total));
    gradeChipsEl.appendChild(chip);
  }
}
function renderLedger() {
  const list = filtered();
  rowsEl.replaceChildren();
  for (const t of list) rowsEl.appendChild(trophyRow(t, false));
  showingEl.textContent = 'Showing ' + list.length + ' of ' + TOTAL;
}
function renderMissables() {
  missableRowsEl.replaceChildren();
  for (const t of doc.trophies.filter((x) => x.missable)) {
    missableRowsEl.appendChild(trophyRow(t, true));
  }
}
function renderRoadmap() {
  const wrap = $('roadmap');
  wrap.replaceChildren();
  for (const s of STAGES) {
    const card = el('div', 'stage');
    card.appendChild(el('h2', null, 'Stage ' + s.n + ' · ' + s.title));
    card.appendChild(el('p', 'stage-meta', s.meta));
    card.appendChild(el('p', null, s.blurb));
    const ul = document.createElement('ul');
    for (const t of doc.trophies.filter((x) => x.stage === s.n)) {
      const li = document.createElement('li');
      if (earned.has(t.id)) li.classList.add('done');
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = (earned.has(t.id) ? '✓ ' : '') + t.name + ' (' + t.grade + ')';
      b.addEventListener('click', () => {
        switchTab('ledger');
        openGuide(t.id);
      });
      li.appendChild(b);
      ul.appendChild(li);
    }
    card.appendChild(ul);
    wrap.appendChild(card);
  }
}
function renderAll() {
  renderHeader();
  renderLedger();
  renderMissables();
  renderRoadmap();
}
function openGuide(id) {
  const t = doc.trophies.find((x) => x.id === id);
  if (!t) return;
  selectedId = id;
  guideEl.hidden = false;
  guideEl.replaceChildren();
  guideEl.appendChild(el('h2', null, isHidden(t) ? '··· hidden story trophy ···' : t.name));
  if (!isHidden(t)) guideEl.appendChild(el('p', 'gdesc', t.description));
  const meta = el('div', 'guide-meta');
  meta.appendChild(gradeBadge(t.grade));
  meta.appendChild(el('span', 'kind-label', KIND_LABELS[t.kind] || t.kind));
  if (t.missable) meta.appendChild(el('span', 'miss-flag', 'Missable'));
  const checkLabel = document.createElement('label');
  checkLabel.className = 'check';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(t.id);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(t.id); else earned.delete(t.id);
    save();
    renderAll();
    openGuide(t.id);
  });
  checkLabel.appendChild(box);
  checkLabel.appendChild(document.createTextNode(' Earned'));
  meta.appendChild(checkLabel);
  guideEl.appendChild(meta);
  if (isHidden(t)) {
    guideEl.appendChild(el('p', null, 'This is a story trophy and spoiler-safe mode is on. Earn it in the game to reveal its guide, or turn spoiler-safe off in the toolbar.'));
  } else {
    if (t.missable && t.missableNote) {
      const note = el('p', 'miss-note');
      note.appendChild(el('strong', null, 'Missable: '));
      note.appendChild(document.createTextNode(t.missableNote));
      guideEl.appendChild(note);
    }
    guideEl.appendChild(el('p', null, t.guide));
    const ol = document.createElement('ol');
    for (const s of t.steps || []) ol.appendChild(el('li', null, s));
    guideEl.appendChild(ol);
    const src = el('p', 'guide-source', 'Source: ');
    const a = document.createElement('a');
    a.href = t.sourceUrl;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = t.source + ' trophy guide';
    src.appendChild(a);
    guideEl.appendChild(src);
  }
  const nav = el('div', 'guide-nav');
  const prev = el('button', null, '← Previous trophy');
  prev.type = 'button';
  prev.disabled = id <= 1;
  prev.addEventListener('click', () => openGuide(id - 1));
  const next = el('button', null, 'Next trophy →');
  next.type = 'button';
  next.disabled = id >= TOTAL;
  next.addEventListener('click', () => openGuide(id + 1));
  const close = el('button', null, 'Close');
  close.type = 'button';
  close.addEventListener('click', () => { guideEl.hidden = true; selectedId = null; history.replaceState(null, '', location.pathname + location.search); });
  nav.appendChild(prev);
  nav.appendChild(next);
  nav.appendChild(close);
  guideEl.appendChild(nav);
  guideEl.scrollIntoView({ behavior: 'auto', block: 'start' });
  history.replaceState(null, '', '#trophy-' + id);
}
function switchTab(name) {
  for (const b of document.querySelectorAll('.tabs button')) {
    b.classList.toggle('active', b.dataset.tab === name);
  }
  for (const p of document.querySelectorAll('.tab-panel')) {
    p.classList.toggle('active', p.id === 'tab-' + name);
  }
}
for (const b of document.querySelectorAll('.tabs button')) {
  b.addEventListener('click', () => switchTab(b.dataset.tab));
}
for (const c of [kindSel, gradeSel, statusSel, missableOnlyEl]) c.addEventListener('change', renderLedger);
searchEl.addEventListener('input', renderLedger);
spoilerEl.addEventListener('change', () => {
  spoiler = spoilerEl.checked;
  localStorage.setItem(SPOILER_KEY, JSON.stringify(spoiler));
  renderAll();
  if (selectedId !== null) openGuide(selectedId);
});
$('export').addEventListener('click', () => {
  const payload = { game: 'Grand Theft Auto VI', platform: 'PlayStation 5', earned: [...earned].sort((a, b) => a - b) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
$('import').addEventListener('change', (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result));
      const list = Array.isArray(data) ? data : data.earned;
      const ids = (list || []).filter((n) => Number.isInteger(n) && n >= 1 && n <= TOTAL);
      earned = new Set(ids);
      save();
      renderAll();
    } catch (e) {
      alert('That file is not a valid progress export.');
    }
  };
  reader.readAsText(file);
  ev.target.value = '';
});
async function init() {
  doc = await (await fetch('data/trophies.json')).json();
  loadSave();
  try { spoiler = JSON.parse(localStorage.getItem(SPOILER_KEY) || 'false'); } catch (e) { spoiler = false; }
  if (params.get('demo') === '1' && !localStorage.getItem(EARNED_KEY)) {
    earned = new Set(DEMO_EARNED);
    save();
  }
  if (params.get('spoiler') === '1') spoiler = true;
  spoilerEl.checked = spoiler;
  const tab = params.get('tab');
  if (tab === 'roadmap' || tab === 'missables' || tab === 'about') switchTab(tab);
  if (params.get('kind') === 'missable') missableOnlyEl.checked = true;
  else if (params.get('kind')) kindSel.value = params.get('kind');
  renderAll();
  const trophyParam = params.get('trophy');
  const hashMatch = location.hash.match(/^#trophy-(\d+)$/);
  const openId = trophyParam ? Number(trophyParam) : (hashMatch ? Number(hashMatch[1]) : null);
  if (openId && openId >= 1 && openId <= TOTAL) openGuide(openId);
}
init();
