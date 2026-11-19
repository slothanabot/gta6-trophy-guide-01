// Vice City Trophy Ledger — an offline trophy guide and tracker for GTA VI.
// Loads app/data/trophies.json, renders the ledger, roadmap and missables,
// saves progress in localStorage, exports/imports it, and hides story
// spoilers until a trophy is earned. No network: the only fetch is the
// local data file, and every link out is an <a> the reader follows.
const KEY = 'gta6-trophy-ledger-v1';
const RING_C = 326.7;

const $ = (id) => document.getElementById(id);
const rowsEl = $('rows');
const searchEl = $('search');
const gradeEl = $('grade');
const spoilerEl = $('spoiler');

const params = new URLSearchParams(location.search);
const demoMode = params.get('demo') === '1';
const DEMO_EARNED = [2, 3, 4, 5, 8, 15, 16, 20, 21, 32, 42, 52];

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const byId = new Map(trophies.map((t) => [t.id, t]));

let earned = new Set();
try { earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]')); } catch { earned = new Set(); }
earned = new Set([...earned].filter((id) => byId.has(id)));
if (demoMode) for (const id of DEMO_EARNED) earned.add(id);

let kindFilter = 'all';
let currentPanel = null;

function save() {
  if (demoMode) return; // demo progress is a preview, never written over real progress
  localStorage.setItem(KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function isHidden(t) {
  return spoilerEl.checked && t.kind === 'story' && !earned.has(t.id);
}

function kindLabel(t) {
  if (t.kind === 'platinum') return 'Platinum';
  return t.kind.charAt(0).toUpperCase() + t.kind.slice(1);
}

function gradeBadge(grade) {
  const s = document.createElement('span');
  s.className = 'badge ' + grade;
  s.textContent = grade;
  return s;
}

function renderProgress() {
  const n = earned.size;
  const total = trophies.length;
  const pct = Math.round((n / total) * 100);
  $('earnedCount').textContent = n;
  $('progressLine').textContent = `${n} of ${total} earned · ${pct}%`;
  $('ringFg').style.strokeDashoffset = String(RING_C * (1 - n / total));
  const counts = ['platinum', 'gold', 'silver', 'bronze'].map((g) => {
    const all = trophies.filter((t) => t.grade === g).length;
    const got = trophies.filter((t) => t.grade === g && earned.has(t.id)).length;
    return `${g.charAt(0).toUpperCase() + g.slice(1)} ${got}/${all}`;
  });
  $('gradeCounts').textContent = counts.join(' · ');
}

function matches(t) {
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (kindFilter === 'missable' && !t.missable) return false;
  if (kindFilter === 'online') return false;
  if (kindFilter !== 'all' && kindFilter !== 'missable' && t.kind !== kindFilter) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q) {
    const hay = `${t.name} ${t.description} ${t.guide} ${t.kind}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function renderRows() {
  rowsEl.replaceChildren();
  const shown = trophies.filter(matches);
  $('emptyOnline').hidden = kindFilter !== 'online';
  $('emptyNone').hidden = kindFilter === 'online' || shown.length > 0;
  $('resultLine').textContent = kindFilter === 'online'
    ? '0 of 55 trophies — there are no online trophies in GTA VI.'
    : `Showing ${shown.length} of ${trophies.length} trophies${earned.size ? ` · ${earned.size} earned` : ''}.`;
  for (const t of shown) {
    const tr = document.createElement('tr');
    if (earned.has(t.id)) tr.classList.add('earned');
    const hidden = isHidden(t);

    const checkTd = document.createElement('td');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      save();
      renderProgress();
      renderRows();
    });
    box.addEventListener('click', (e) => e.stopPropagation());
    checkTd.append(box);

    const nameTd = document.createElement('td');
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = hidden ? 'Hidden story trophy' : t.name;
    if (t.missable && !hidden) {
      const flag = document.createElement('span');
      flag.className = 'missable-flag';
      flag.textContent = 'Missable';
      name.append(flag);
    }
    const desc = document.createElement('div');
    desc.className = 'trophy-desc' + (hidden ? ' hidden-spoiler' : '');
    desc.textContent = hidden ? 'Earn it to reveal the name and description.' : t.description;
    nameTd.append(name, desc);

    const gradeTd = document.createElement('td');
    gradeTd.append(gradeBadge(t.grade));

    const kindTd = document.createElement('td');
    const kind = document.createElement('span');
    kind.className = 'kind-tag';
    kind.textContent = kindLabel(t);
    kindTd.append(kind);

    const guideTd = document.createElement('td');
    guideTd.className = 'guide-cell';
    if (hidden) {
      guideTd.textContent = 'Hidden — earn this trophy to reveal its guide.';
    } else {
      guideTd.textContent = t.guide;
      const link = document.createElement('div');
      const a = document.createElement('a');
      a.href = '#';
      a.className = 'guide-link';
      a.textContent = 'Full guide, steps & source →';
      a.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openPanel(t.id); });
      link.append(a);
      guideTd.append(document.createElement('br'), link);
    }

    const sourceTd = document.createElement('td');
    sourceTd.className = 'source-cell';
    if (!hidden) {
      const a = document.createElement('a');
      a.href = t.sourceUrl;
      a.textContent = t.source;
      a.target = '_blank';
      a.rel = 'noopener';
      sourceTd.append(a);
    } else {
      sourceTd.textContent = '—';
    }

    tr.append(checkTd, nameTd, gradeTd, kindTd, guideTd, sourceTd);
    if (!hidden) tr.addEventListener('click', () => openPanel(t.id));
    rowsEl.append(tr);
  }
}

// ---- Guide panel ----
function openPanel(id) {
  const t = byId.get(id);
  if (!t || isHidden(t)) return;
  currentPanel = id;
  $('panelGrade').replaceChildren(gradeBadge(t.grade));
  $('panelTitle').textContent = t.name;
  $('panelDesc').textContent = t.description;
  const miss = $('panelMissable');
  if (t.missable) {
    miss.hidden = false;
    miss.textContent = 'Missable — ' + (t.missableNote ?? 'Do it when it appears; there is no mission replay.');
  } else {
    miss.hidden = true;
  }
  $('panelGuide').textContent = t.guide;
  const steps = $('panelSteps');
  steps.replaceChildren();
  for (const s of t.steps ?? []) {
    const li = document.createElement('li');
    li.textContent = s;
    steps.append(li);
  }
  const src = $('panelSource');
  src.href = t.sourceUrl;
  src.textContent = t.source;
  const box = $('panelEarned');
  box.checked = earned.has(id);
  box.onchange = () => {
    if (box.checked) earned.add(id); else earned.delete(id);
    save();
    renderProgress();
    renderRows();
  };
  $('panel').hidden = false;
  $('panelBackdrop').hidden = false;
  document.body.style.overflow = 'hidden';
  history.replaceState(null, '', `#trophy-${id}`);
}

function closePanel() {
  currentPanel = null;
  $('panel').hidden = true;
  $('panelBackdrop').hidden = true;
  document.body.style.overflow = '';
  history.replaceState(null, '', location.pathname + location.search);
}

$('panelClose').addEventListener('click', closePanel);
$('panelBackdrop').addEventListener('click', closePanel);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

// ---- Tabs ----
const ROADMAP = [
  { title: 'Play the story — Chapters 1–5', time: 'about 60–80 hours',
    text: 'Finish all five chapters in order. Take stranger missions as they appear, scan vehicles and study animals as you go, and meditate at Jason’s house in Chapter 1 — the one confirmed missable. Keep cheats off the whole run.',
    ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 28] },
  { title: 'Side strands while the story runs', time: 'alongside stage 1',
    text: 'Complete the 8 Strangers & Freaks strands and the five character finales — Andy, Kenton, Billy, Randy and Tyrone. Strands can lock out as the story advances, so do them when they appear rather than saving them for after the credits.',
    ids: [22, 23, 24, 25, 26, 27, 47] },
  { title: 'After the credits — the 100% checklist', time: 'about 100 hours',
    text: 'The checklist appears under Progress > Stats > 100% Completion after the story, but progress made during the story already counts. Scan 200 of 277 vehicles, study 100 of 255 animals, hold 50 of 66 weapons, and complete 70 of 80 challenges. Only robberies, underwater discoveries, shooting ranges, drone races and Bret’s quests need everything.',
    ids: [14, 15, 17, 18, 29, 32, 35] },
  { title: 'Collectibles and activities cleanup', time: 'as you go, then mop up',
    text: 'Finish the card sets, WAiNK spots, garages and Scooter Bros registrations; land 250 stunts, win 20 different races and a drone race at all 14 locations, and earn the shooting-range golds.',
    ids: [16, 19, 20, 21, 30, 31, 42, 46, 51, 54, 55] },
  { title: 'Money, crime and the last bits', time: 'about 10 hours',
    text: 'Launder $250,000 in Marked Bills, spend $100,000 across shops, rob the five bank vaults and an armored truck, hit every gang’s illegal operation, and pick up the vague story moments — they come from playing, not hunting.',
    ids: [33, 34, 36, 37, 38, 39, 40, 41, 43, 44, 45, 48, 49, 50, 52, 53] },
];

function renderRoadmap() {
  const list = $('roadmapList');
  list.replaceChildren();
  for (const stage of ROADMAP) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = stage.title;
    const time = document.createElement('p');
    time.className = 'stage-time';
    time.textContent = stage.time;
    const p = document.createElement('p');
    p.textContent = stage.text;
    const ul = document.createElement('ul');
    for (const id of stage.ids) {
      const t = byId.get(id);
      if (!t) continue;
      const item = document.createElement('li');
      const b = document.createElement('strong');
      b.textContent = t.name;
      item.append(b, ` — ${t.grade}`);
      ul.append(item);
    }
    li.append(h, time, p, ul);
    list.append(li);
  }
}

function renderMissables() {
  const list = $('missableList');
  list.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const li = document.createElement('li');
    const h = document.createElement('h3');
    h.textContent = t.name;
    const why = document.createElement('p');
    why.className = 'why';
    why.textContent = t.missableNote ?? '';
    const guide = document.createElement('p');
    guide.textContent = t.guide;
    const tag = document.createElement('p');
    if (t.id === 28) {
      const s = document.createElement('span');
      s.className = 'confirmed';
      s.textContent = 'Confirmed potentially missable — PowerPyx';
      tag.append(s);
    } else {
      tag.textContent = `Source: ${t.source}`;
    }
    const open = document.createElement('p');
    const a = document.createElement('a');
    a.href = `#trophy-${t.id}`;
    a.textContent = 'Open the full guide →';
    a.addEventListener('click', (e) => { e.preventDefault(); showTab('ledger'); openPanel(t.id); });
    open.append(a);
    li.append(h, why, guide, tag, open);
    list.append(li);
  }
}

function showTab(name) {
  document.querySelectorAll('.tab').forEach((b) => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${name}`));
  window.scrollTo({ top: 0 });
}
document.querySelectorAll('.tab').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));

// ---- Toolbar wiring ----
document.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => {
  document.querySelectorAll('.chip').forEach((x) => x.classList.remove('active'));
  c.classList.add('active');
  kindFilter = c.dataset.kind;
  renderRows();
}));
searchEl.addEventListener('input', renderRows);
gradeEl.addEventListener('change', renderRows);
spoilerEl.addEventListener('change', renderRows);

$('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', exportedAt: new Date().toISOString(), earned: [...earned].sort((x, y) => x - y) }, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const ids = Array.isArray(data) ? data : data.earned ?? [];
    earned = new Set(ids.filter((id) => byId.has(id)));
    save();
    renderProgress();
    renderRows();
  } catch {
    alert('That file is not a trophy progress export.');
  }
  e.target.value = '';
});
$('reset').addEventListener('click', () => {
  if (confirm('Clear all earned trophies in this ledger?')) {
    earned = new Set();
    save();
    renderProgress();
    renderRows();
  }
});

// ---- Deep links ----
function applyUrlState() {
  const tab = params.get('tab');
  if (tab && ['ledger', 'roadmap', 'missables', 'about'].includes(tab)) showTab(tab);
  if (params.get('spoiler') === 'on') spoilerEl.checked = true;
  const kind = params.get('kind');
  if (kind && ['all', 'story', 'missable', 'collectibles', 'activities', 'online'].includes(kind)) {
    document.querySelectorAll('.chip').forEach((x) => x.classList.toggle('active', x.dataset.kind === kind));
    kindFilter = kind;
    renderRows();
  }
  const m = location.hash.match(/^#trophy-(\d+)$/);
  if (m) {
    showTab('ledger');
    openPanel(Number(m[1]));
  }
}
window.addEventListener('hashchange', () => {
  const m = location.hash.match(/^#trophy-(\d+)$/);
  if (m) openPanel(Number(m[1]));
});

renderRoadmap();
renderMissables();
renderProgress();
renderRows();
applyUrlState();
