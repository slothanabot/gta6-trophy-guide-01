// Vice City Trophy Ledger — loads the 55 trophies, renders the filterable ledger,
// the roadmap stages, the guide panel, and saves progress to localStorage.
const STORAGE_KEY = 'vice-city-trophy-ledger-v1';
const SPOILER_KEY = 'vice-city-trophy-ledger-spoilers-v1';

const rowsEl = document.getElementById('rows');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('filterKind');
const gradeEl = document.getElementById('filterGrade');
const missableEl = document.getElementById('filterMissable');
const unearnedEl = document.getElementById('filterUnearned');
const spoilerEl = document.getElementById('spoilerToggle');
const countEl = document.getElementById('countLine');
const onlineNoteEl = document.getElementById('onlineNote');
const guidePanel = document.getElementById('guidePanel');
const guideBody = document.getElementById('guideBody');

let earned = new Set(readStoredIds(STORAGE_KEY));
let spoilersHidden = localStorage.getItem(SPOILER_KEY) === '1';
spoilerEl.checked = spoilersHidden;

const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;

const KIND_LABELS = {
  story: 'Story', side: 'Side strand', collectible: 'Collectible',
  activity: 'Activity', combat: 'Combat & crime', exploration: 'Exploration',
  economy: 'Economy', misc: 'Odd & misc',
};

// Five roadmap stages, built from the official descriptions: story chapters and
// named missions first, then side strands, activities, collectibles, and cleanup.
const ROADMAP = [
  {
    title: 'Play the story — Chapters 1 to 4 and the finale',
    text: 'Follow the main story markers through Gone Fishing and Chapters 1–4, finishing the named missions Breakfast Run, The Cartel Heist, Child\u2019s Play, Headliners, VCIA Takedown and Operation Savage Glory, then the final mission. This earns the chapter trophies and the gold for the finale, and unlocks the map and activities the rest of the list needs.',
    ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  },
  {
    title: 'Side strands and partner trophies',
    text: 'Between chapters, finish the stranger strands for Andy, Kenton, Billy, Randy and Tyrone, hunt the unique animal for Bret, and do the partner trophies while your partner is beside you — lose a 4-star wanted level together, rob 3 shops back-to-back, and the melee drive-by. These are the trophies that get harder to arrange once the story is over.',
    ids: [22, 23, 24, 25, 26, 27, 29, 33, 34, 51],
  },
  {
    title: 'Activities — races, range, fishing, bowling',
    text: 'Try every activity type once, then finish each one: gold all 42 Shooting Range challenges, win a Top Fun drone race at all 14 locations, win 20 different races, beat Cal at fishing, finish an arcade game, and bowl at the Kolt & Associates alley. Stunts and challenges stack up naturally while you travel between venues.',
    ids: [15, 16, 17, 18, 19, 20, 21, 32, 46],
  },
  {
    title: 'Collectibles and exploration',
    text: 'Sweep Leonida region by region: meditate at all 18 spots, complete 3 card sets, WAiNK It at 100 locations, visit all 52 areas, discover 100 vehicles, and enjoy the cocktail on Ocean Beach. Do these after the story, when the whole map is open.',
    ids: [28, 30, 31, 35, 42, 44],
  },
  {
    title: 'Crime, economy and cleanup',
    text: 'Finish the robbery set — 5 bank vaults, one armored truck, one illegal operation per gang, the undetected jewelry store, the showroom smash-out and the single Combat Focus with 5 takedowns — then the economy: launder $250,000 of Marked Bills, spend $100,000 in shops, buy all 8 garages and register 10 vehicles to Scooter Bros. Last, the choice and encounter trophies, and 100% completion for the second gold and the platinum.',
    ids: [36, 37, 38, 39, 40, 41, 43, 45, 47, 48, 49, 50, 52, 53, 54, 55, 14, 1],
  },
];

function readStoredIds(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

function isStorySpoiled(trophy) {
  return spoilersHidden && trophy.kind === 'story' && !earned.has(trophy.id);
}

function gradeBadge(grade) {
  const span = document.createElement('span');
  span.className = `grade grade-${grade}`;
  span.textContent = grade;
  return span;
}

function filteredTrophies() {
  const q = searchEl.value.trim().toLowerCase();
  return trophies.filter((t) => {
    if (kindEl.value === 'online') return false; // No online trophies exist in this list.
    if (kindEl.value !== 'all' && t.kind !== kindEl.value) return false;
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (missableEl.checked && !t.missable) return false;
    if (unearnedEl.checked && earned.has(t.id)) return false;
    if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.guide || '').toLowerCase().includes(q))) return false;
    return true;
  });
}

function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  const pct = Math.round((done / total) * 100);
  document.getElementById('progressText').textContent = `${done} of ${total} earned`;
  document.getElementById('progressPct').textContent = `${pct}%`;
  document.getElementById('progressFill').style.width = `${pct}%`;
  const byGrade = (g) => `${earnedCount(g)}/${trophies.filter((t) => t.grade === g).length}`;
  document.getElementById('progressBreakdown').textContent =
    `Platinum ${byGrade('platinum')} · Gold ${byGrade('gold')} · Silver ${byGrade('silver')} · Bronze ${byGrade('bronze')}`;
  function earnedCount(grade) {
    return trophies.filter((t) => t.grade === grade && earned.has(t.id)).length;
  }
}

function renderLedger() {
  const list = filteredTrophies();
  rowsEl.replaceChildren();
  for (const t of list) {
    const tr = document.createElement('tr');
    if (earned.has(t.id)) tr.classList.add('earned');
    const boxCell = document.createElement('td');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'earned-box';
    box.checked = earned.has(t.id);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('change', (event) => {
      event.stopPropagation();
      if (box.checked) earned.add(t.id); else earned.delete(t.id);
      saveProgress();
      renderProgress();
      renderLedger();
    });
    boxCell.append(box);
    const gradeCell = document.createElement('td');
    gradeCell.append(gradeBadge(t.grade));
    const nameCell = document.createElement('td');
    const nameSpan = document.createElement('span');
    nameSpan.className = 'trophy-name';
    nameSpan.textContent = isStorySpoiled(t) ? 'Hidden story trophy — earn it to reveal' : t.name;
    nameCell.append(nameSpan);
    const descCell = document.createElement('td');
    descCell.textContent = isStorySpoiled(t) ? 'Spoiler hidden until earned.' : t.description;
    if (isStorySpoiled(t)) descCell.classList.add('spoiled');
    const kindCell = document.createElement('td');
    const kindSpan = document.createElement('span');
    kindSpan.className = 'kind-tag';
    kindSpan.textContent = KIND_LABELS[t.kind] ?? t.kind;
    kindCell.append(kindSpan);
    const missCell = document.createElement('td');
    if (t.missable) {
      const flag = document.createElement('span');
      flag.className = 'flag';
      flag.textContent = '⚠ Missable';
      missCell.append(flag);
    } else {
      missCell.textContent = '—';
    }
    tr.append(boxCell, gradeCell, nameCell, descCell, kindCell, missCell);
    tr.addEventListener('click', () => openGuide(t));
    rowsEl.append(tr);
  }
  countEl.textContent = `Showing ${list.length} of ${trophies.length} trophies` +
    (earned.size ? ` — ${earned.size} earned` : '');
  onlineNoteEl.hidden = kindEl.value !== 'online';
}

function openGuide(trophy) {
  guideBody.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = isStorySpoiled(trophy) ? 'Hidden story trophy' : trophy.name;
  const meta = document.createElement('p');
  meta.className = 'guide-meta';
  meta.append(gradeBadge(trophy.grade));
  meta.append(document.createTextNode(`  ${KIND_LABELS[trophy.kind] ?? trophy.kind}`));
  if (trophy.missable) {
    const flag = document.createElement('span');
    flag.className = 'flag';
    flag.textContent = '  ⚠ Missable';
    meta.append(flag);
  }
  const desc = document.createElement('p');
  desc.className = 'official-desc';
  desc.textContent = `Official description: “${trophy.description}”`;
  const guideText = document.createElement('p');
  guideText.textContent = trophy.guide;
  const stepsTitle = document.createElement('h3');
  stepsTitle.textContent = 'Steps';
  const steps = document.createElement('ol');
  for (const step of trophy.steps ?? []) {
    const li = document.createElement('li');
    li.textContent = step;
    steps.append(li);
  }
  const sourceBox = document.createElement('div');
  sourceBox.className = 'source-box';
  const sourceLabel = document.createElement('strong');
  sourceLabel.textContent = 'Source: ';
  const sourceLink = document.createElement('a');
  sourceLink.href = trophy.sourceUrl;
  sourceLink.textContent = trophy.source;
  sourceLink.rel = 'noopener';
  sourceBox.append(sourceLabel, sourceLink);
  const sourceNote = document.createElement('p');
  sourceNote.textContent = 'The guide above is written in this ledger’s own words; the source is cited for the facts it supports. The official name and description are shown as PlayStation publishes them.';
  sourceBox.append(sourceNote);
  const earnedBtn = document.createElement('button');
  earnedBtn.type = 'button';
  earnedBtn.className = 'tab';
  earnedBtn.style.marginTop = '14px';
  earnedBtn.textContent = earned.has(trophy.id) ? '✓ Earned — click to unmark' : 'Mark as earned';
  earnedBtn.addEventListener('click', () => {
    if (earned.has(trophy.id)) earned.delete(trophy.id); else earned.add(trophy.id);
    saveProgress();
    renderProgress();
    renderLedger();
    openGuide(trophy);
  });
  guideBody.append(heading, meta, desc, guideText, stepsTitle, steps, sourceBox, earnedBtn);
  guidePanel.hidden = false;
}

function renderRoadmap() {
  const stagesEl = document.getElementById('stages');
  stagesEl.replaceChildren();
  for (const stage of ROADMAP) {
    const li = document.createElement('li');
    const title = document.createElement('h4');
    title.textContent = stage.title;
    const text = document.createElement('p');
    text.textContent = stage.text;
    const names = document.createElement('p');
    names.className = 'stage-trophies';
    names.textContent = 'Trophies: ' + stage.ids
      .map((id) => trophies.find((t) => t.id === id)?.name ?? '')
      .filter(Boolean).join(' · ');
    li.append(title, text, names);
    stagesEl.append(li);
  }
  const missList = document.getElementById('missableList');
  missList.replaceChildren();
  for (const t of trophies.filter((x) => x.missable)) {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = t.name;
    li.append(strong, document.createTextNode(` — ${t.description}`));
    missList.append(li);
  }
}

function switchTab(name) {
  guidePanel.hidden = true;
  for (const view of document.querySelectorAll('.view')) view.classList.remove('active');
  for (const tab of document.querySelectorAll('.tab')) tab.classList.remove('active');
  document.getElementById(`view-${name}`).classList.add('active');
  document.getElementById(`tab${name[0].toUpperCase()}${name.slice(1)}`).classList.add('active');
  if (name === 'roadmap') renderRoadmap();
}

for (const tab of document.querySelectorAll('.tab[data-tab]')) {
  tab.addEventListener('click', () => switchTab(tab.dataset.tab));
}

searchEl.addEventListener('input', renderLedger);
kindEl.addEventListener('change', renderLedger);
gradeEl.addEventListener('change', renderLedger);
missableEl.addEventListener('change', renderLedger);
unearnedEl.addEventListener('change', renderLedger);
spoilerEl.addEventListener('change', () => {
  spoilersHidden = spoilerEl.checked;
  localStorage.setItem(SPOILER_KEY, spoilersHidden ? '1' : '0');
  renderLedger();
});

document.getElementById('closeGuide').addEventListener('click', () => {
  guidePanel.hidden = true;
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') guidePanel.hidden = true;
});

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned].sort((a, b) => a - b) }, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const ids = Array.isArray(parsed) ? parsed : parsed.earned;
    const valid = new Set(trophies.map((t) => t.id));
    earned = new Set((ids ?? []).filter((n) => valid.has(n)));
    saveProgress();
    renderProgress();
    renderLedger();
  } catch {
    alert('That file could not be read as trophy progress.');
  }
  event.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (confirm('Clear all earned trophies in this ledger?')) {
    earned = new Set();
    saveProgress();
    renderProgress();
    renderLedger();
  }
});

// Deep links for screenshots and sharing: #roadmap opens the roadmap tab,
// #guide-<id> opens that trophy's guide panel.
function applyHash() {
  const hash = location.hash.replace('#', '');
  if (hash === 'roadmap') switchTab('roadmap');
  else if (hash === 'about') switchTab('about');
  else if (hash.startsWith('guide-')) {
    const trophy = trophies.find((t) => t.id === Number(hash.slice(6)));
    if (trophy) openGuide(trophy);
  }
}

renderProgress();
renderLedger();
renderRoadmap();
applyHash();
window.addEventListener('hashchange', applyHash);
