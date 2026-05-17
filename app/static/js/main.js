/* ── SmartToursim — main.js ─────────────────────────────────────────── */

const TOTAL = 3;
let current = 0;
const formData = {};

/* ── DOM ─────────────────────────────────────────────────────────────── */
const hero       = document.getElementById('hero');
const wizard     = document.getElementById('wizard');
const results    = document.getElementById('results');
const prevBtn    = document.getElementById('prev-btn');
const submitBtn  = document.getElementById('submit-btn');
const submitText = document.getElementById('submit-text');
const spinner    = document.getElementById('spinner');
const cards      = document.getElementById('cards');
const restartBtn = document.getElementById('restart-btn');

/* ── Destination metadata ────────────────────────────────────────────── */
const DEST_META = {
  'Bali':         { continent: 'Asia',              emoji: '🌴' },
  'Kerala':       { continent: 'Asia',              emoji: '🌿' },
  'Maldives':     { continent: 'Asia',              emoji: '🏝️' },
  'Goa':          { continent: 'Asia',              emoji: '🏖️' },
  'Thailand':     { continent: 'Asia',              emoji: '🛺' },
  'Tokyo':        { continent: 'Asia',              emoji: '⛩️' },
  'Dubai':        { continent: 'Asia',              emoji: '🏙️' },
  'Manali':       { continent: 'Asia',              emoji: '⛰️' },
  'Leh-Ladakh':   { continent: 'Asia',              emoji: '🏔️' },
  'Andaman':      { continent: 'Asia',              emoji: '🐠' },
  'Rajasthan':    { continent: 'Asia',              emoji: '🏰' },
  'Singapore':    { continent: 'Asia',              emoji: '🦁' },
  'Paris':        { continent: 'Europe',            emoji: '🗼' },
  'London':       { continent: 'Europe',            emoji: '🎡' },
  'Rome':         { continent: 'Europe',            emoji: '🍕' },
  'Switzerland':  { continent: 'Europe',            emoji: '🏔️' },
  'Santorini':    { continent: 'Europe',            emoji: '🌅' },
  'Iceland':      { continent: 'Europe',            emoji: '🌋' },
  'Cape Town':    { continent: 'Africa',            emoji: '🦁' },
  'Canada':       { continent: 'North America',     emoji: '🍁' },
  'Machu Picchu': { continent: 'South America',     emoji: '🗿' },
  'New Zealand':  { continent: 'Australia/Oceania', emoji: '🌄' },
};

/* ── Why-this logic: maps user choices → human-readable reasons ──────── */
function buildReasons(dest, input) {
  const reasons = [];

  const activityMap = {
    Activity_Beaches:           'Beaches',
    Activity_Mountains:         'Mountains',
    Activity_Trekking_Hiking:   'Trekking',
    Activity_Wildlife_Nature:   'Wildlife',
    Activity_Historical_Places: 'History',
    Activity_Local_Food_Cuisine:'Local food',
    Activity_Shopping:          'Shopping',
    Activity_Nightlife:         'Nightlife',
  };

  // Activities the user selected that match this destination's known strengths
  const destStrengths = {
    'Bali':         ['Activity_Beaches','Activity_Wildlife_Nature','Activity_Local_Food_Cuisine'],
    'Kerala':       ['Activity_Wildlife_Nature','Activity_Beaches','Activity_Local_Food_Cuisine'],
    'Maldives':     ['Activity_Beaches'],
    'Goa':          ['Activity_Beaches','Activity_Nightlife'],
    'Thailand':     ['Activity_Beaches','Activity_Local_Food_Cuisine','Activity_Nightlife'],
    'Tokyo':        ['Activity_Local_Food_Cuisine','Activity_Shopping','Activity_Historical_Places'],
    'Dubai':        ['Activity_Shopping','Activity_Nightlife'],
    'Manali':       ['Activity_Mountains','Activity_Trekking_Hiking'],
    'Leh-Ladakh':   ['Activity_Trekking_Hiking','Activity_Mountains'],
    'Andaman':      ['Activity_Beaches','Activity_Wildlife_Nature'],
    'Rajasthan':    ['Activity_Historical_Places','Activity_Local_Food_Cuisine'],
    'Singapore':    ['Activity_Shopping','Activity_Local_Food_Cuisine'],
    'Paris':        ['Activity_Historical_Places','Activity_Local_Food_Cuisine','Activity_Shopping'],
    'London':       ['Activity_Historical_Places','Activity_Shopping'],
    'Rome':         ['Activity_Historical_Places','Activity_Local_Food_Cuisine'],
    'Switzerland':  ['Activity_Mountains','Activity_Trekking_Hiking'],
    'Santorini':    ['Activity_Beaches'],
    'Iceland':      ['Activity_Trekking_Hiking','Activity_Wildlife_Nature'],
    'Cape Town':    ['Activity_Beaches','Activity_Wildlife_Nature'],
    'Canada':       ['Activity_Mountains','Activity_Wildlife_Nature'],
    'Machu Picchu': ['Activity_Trekking_Hiking','Activity_Historical_Places'],
    'New Zealand':  ['Activity_Mountains','Activity_Trekking_Hiking','Activity_Wildlife_Nature'],
  };

  const strengths = destStrengths[dest] || [];
  for (const act of strengths) {
    if (input[act] === 1) {
      reasons.push(activityMap[act]);
    }
  }

  // Budget match
  const budgetMap = {
    'Maldives': ['High'], 'Dubai': ['High'], 'Switzerland': ['High'],
    'Santorini': ['High','Medium'], 'Paris': ['High','Medium'],
    'Goa': ['Low','Medium'], 'Kerala': ['Low','Medium'],
    'Thailand': ['Low','Medium'], 'Rajasthan': ['Low','Medium'],
  };
  if (budgetMap[dest] && input.Budget_Range && budgetMap[dest].includes(input.Budget_Range)) {
    reasons.push(`${input.Budget_Range} budget`);
  }

  // Season match
  const seasonMap = {
    'Goa': ['Winter'], 'Manali': ['Summer'], 'Rajasthan': ['Winter'],
    'Kerala': ['Winter','Spring'], 'Bali': ['Spring','Summer'],
    'Iceland': ['Summer'], 'Maldives': ['Winter','Spring'],
  };
  if (seasonMap[dest] && input.Preferred_Season && seasonMap[dest].includes(input.Preferred_Season)) {
    reasons.push(`Great in ${input.Preferred_Season}`);
  }

  // Travel purpose
  const purposeMap = {
    'Maldives': ['Honeymoon','Relaxation'],
    'Santorini': ['Honeymoon','Relaxation'],
    'Paris': ['Honeymoon','Cultural Exploration'],
    'New Zealand': ['Adventure'],
    'Manali': ['Adventure'],
    'Leh-Ladakh': ['Adventure'],
    'Machu Picchu': ['Adventure','Educational'],
    'Rome': ['Cultural Exploration','Educational'],
    'Rajasthan': ['Cultural Exploration','Educational'],
  };
  if (purposeMap[dest] && input.Travel_Purpose && purposeMap[dest].includes(input.Travel_Purpose)) {
    reasons.push(input.Travel_Purpose);
  }

  // Fallback
  if (reasons.length === 0) reasons.push('AI matched');

  return reasons.slice(0, 4); // max 4 tags
}

/* ── Start ───────────────────────────────────────────────────────────── */
document.getElementById('start-btn').addEventListener('click', () => {
  hero.classList.add('hidden');
  wizard.classList.remove('hidden');
  updateNav();
});

/* ── Next buttons ────────────────────────────────────────────────────── */
document.getElementById('next-0').addEventListener('click', () => goTo(1));
document.getElementById('next-1').addEventListener('click', () => goTo(2));

/* ── Back ────────────────────────────────────────────────────────────── */
prevBtn.addEventListener('click', () => {
  if (current > 0) goTo(current - 1);
});

/* ── Navigate ────────────────────────────────────────────────────────── */
function goTo(n) {
  document.getElementById(`step-${current}`).classList.remove('active');
  current = n;
  document.getElementById(`step-${current}`).classList.add('active');
  updateNav();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNav() {
  // Pips
  for (let i = 0; i < TOTAL; i++) {
    const pip = document.getElementById(`pip-${i}`);
    pip.classList.remove('active', 'done');
    if (i === current) pip.classList.add('active');
    else if (i < current) pip.classList.add('done');
  }
  // Label
  document.getElementById('step-label').textContent = `Step ${current + 1} of ${TOTAL}`;
  // Back button
  current > 0
    ? prevBtn.classList.remove('hidden')
    : prevBtn.classList.add('hidden');
}

/* ── Single-select chips ─────────────────────────────────────────────── */
document.querySelectorAll('.chips:not(.multi)').forEach(group => {
  const field = group.dataset.field;
  group.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      group.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      formData[field] = chip.dataset.value;
    });
  });
});

/* ── Multi-select chips (activities) ────────────────────────────────── */
document.querySelectorAll('.chips.multi .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const on = chip.classList.toggle('selected');
    chip.dataset.value = on ? '1' : '0';
    formData[chip.dataset.field] = on ? 1 : 0;
  });
});

/* ── Slider ──────────────────────────────────────────────────────────── */
const durSlider = document.getElementById('dur-slider');
const durVal    = document.getElementById('dur-val');
durSlider.addEventListener('input', () => {
  durVal.textContent = `${durSlider.value} days`;
  formData['Total_Travel_Duration_Days'] = parseInt(durSlider.value);
});
formData['Total_Travel_Duration_Days'] = 7;

/* ── Submit ──────────────────────────────────────────────────────────── */
submitBtn.addEventListener('click', async () => {
  // Set all unselected activity chips to 0
  document.querySelectorAll('.chips.multi .chip').forEach(chip => {
    if (!(chip.dataset.field in formData)) formData[chip.dataset.field] = 0;
  });

  submitText.classList.add('hidden');
  spinner.classList.remove('hidden');
  submitBtn.disabled = true;

  try {
    const res  = await fetch('/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    showResults(data.recommendations, data.probabilities || []);
  } catch (err) {
    alert('Something went wrong: ' + err.message);
    submitText.classList.remove('hidden');
    spinner.classList.add('hidden');
    submitBtn.disabled = false;
  }
});

/* ── Results ─────────────────────────────────────────────────────────── */
function showResults(destinations, probabilities) {
  wizard.classList.add('hidden');
  results.classList.remove('hidden');
  cards.innerHTML = '';

  destinations.forEach((dest, i) => {
    const meta    = DEST_META[dest] || { continent: '', emoji: '✈️' };
    const reasons = buildReasons(dest, formData);
    const pct     = probabilities[i]
      ? Math.round(probabilities[i] * 100)
      : Math.max(90 - i * 8, 55);

    const card = document.createElement('div');
    card.className = 'card';
    card.style.animationDelay = `${i * 0.08}s`;

    card.innerHTML = `
      <div class="card-rank">#${i + 1} recommendation</div>
      <div class="card-name">${meta.emoji} ${dest}</div>
      <div class="card-continent">${meta.continent}</div>

      <div class="match-row">
        <div class="match-bar-bg">
          <div class="match-bar-fill" style="width: ${pct}%"></div>
        </div>
        <span class="match-pct">${pct}% match</span>
      </div>

      <div class="card-why">
        <div class="card-why-label">Why this?</div>
        <div class="card-reasons">
          ${reasons.map(r => `<span class="reason-tag">${r}</span>`).join('')}
        </div>
      </div>
    `;

    cards.appendChild(card);
  });
}

/* ── Restart ─────────────────────────────────────────────────────────── */
restartBtn.addEventListener('click', () => {
  results.classList.add('hidden');
  hero.classList.remove('hidden');
  Object.keys(formData).forEach(k => delete formData[k]);
  document.querySelectorAll('.chip').forEach(c => {
    c.classList.remove('selected');
    if (c.dataset.value !== undefined && c.closest('.multi')) c.dataset.value = '0';
  });
  current = 0;
  goTo(0);
  wizard.classList.add('hidden');
});