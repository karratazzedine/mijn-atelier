'use strict';
/* Mijn Atelier – app-logica. Alles wordt bewaard in localStorage van deze browser. */
const KEY = 'atelier-v1', GOAL = 900; // 900 seconden = 15 minuten
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function def() { return { v: 1, setup: false, name: '', pin: '', ppin: '', mentor: 'Luna', theme: { pal: 'roze', accent: '', pattern: 'hartjes', font: 'rond' }, skills: {}, days: {}, review: [], recent: {}, stars: 0, paid: [], art: {}, qcount: 0 }; }
function load() { try { const j = JSON.parse(localStorage.getItem(KEY)); if (j && j.v === 1) return Object.assign(def(), j); } catch (e) { } return def(); }
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
let vidUntil = 0, S = load(), view = '', authed = false, parentOK = false, sess = null, cur = null, lastAct = 0, repWeek = 0, artColor = '#f0428f', jokeI = new Date().getDate();

const dkey = (d = new Date()) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const EMPTY = { sec: 0, sk: {}, euro: false };
const dayRO = k => S.days[k] || EMPTY;
const day = () => S.days[dkey()] || (S.days[dkey()] = { sec: 0, sk: {}, euro: false });
const tot = r => Object.values(r.sk).reduce((a, x) => ({ q: a.q + x.q, r: a.r + x.r }), { q: 0, r: 0 });
const skill = id => S.skills[id] || (S.skills[id] = { lvl: 1, run: 0, q: 0, r: 0 });
const pct = (r, q) => q ? Math.round(100 * r / q) : 0;
function monday(off = 0) { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - (d.getDay() + 6) % 7 + 7 * off); return d; }
function streak() { let n = 0; const d = new Date(); d.setHours(12); if (!tot(dayRO(dkey(d))).q) d.setDate(d.getDate() - 1); while (tot(dayRO(dkey(d))).q) { n++; d.setDate(d.getDate() - 1); } return n; }
const earned = () => Object.values(S.days).filter(d => d.euro).length;
const paidOut = () => S.paid.reduce((a, p) => a + p.amt, 0);
const wpick = (arr, wf) => { const ws = arr.map(wf), t = ws.reduce((a, b) => a + b, 0); let r = Math.random() * t; for (let i = 0; i < arr.length; i++) { r -= ws[i]; if (r <= 0) return arr[i]; } return arr[arr.length - 1]; };

/* ===== Thema ===== */
const PALS = {
  roze: { n: 'Roze droom', bg: '#fff0f6', card: '#ffffff', ink: '#4a2740', accent: '#f0428f', accent2: '#a66bff', soft: '#ffd9ea' },
  lavendel: { n: 'Lavendel', bg: '#f4efff', card: '#ffffff', ink: '#3a2a5c', accent: '#8b5cf6', accent2: '#f0629f', soft: '#e4d9ff' },
  mint: { n: 'Mintijsje', bg: '#ecfbf5', card: '#ffffff', ink: '#1f4a40', accent: '#14a884', accent2: '#f0629f', soft: '#c9f2e4' },
  perzik: { n: 'Zonsondergang', bg: '#fff4ea', card: '#ffffff', ink: '#5a2e22', accent: '#f26a3d', accent2: '#e0428f', soft: '#ffdcc8' },
  oceaan: { n: 'Zeemeermin', bg: '#eef7ff', card: '#ffffff', ink: '#1f3a5c', accent: '#2f86eb', accent2: '#a66bff', soft: '#d3e8ff' },
  nacht: { n: 'Sterrennacht', bg: '#241b3a', card: '#32264f', ink: '#f7efff', accent: '#ff6fb5', accent2: '#9f8cff', soft: '#4a3a75' }
};
const PATS = { hartjes: ['💗', '✨'], sterren: ['⭐', '🌙'], paarden: ['🐎', '🌸'], kunst: ['🎨', '🖌️'], vlinders: ['🦋', '🌷'], geen: null };
function applyTheme() {
  const t = S.theme, p = PALS[t.pal] || PALS.roze, r = document.documentElement.style;
  ['bg', 'card', 'ink', 'accent', 'accent2', 'soft'].forEach(k => r.setProperty('--' + k, p[k]));
  if (t.accent) r.setProperty('--accent', t.accent);
  const e = PATS[t.pattern];
  r.setProperty('--pat', e ? 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><text x="14" y="44" font-size="24" opacity=".22">' + e[0] + '</text><text x="90" y="118" font-size="19" opacity=".22">' + e[1] + '</text></svg>') + '")' : 'none');
  document.body.className = t.font === 'sier' ? 'f-sier' : t.font === 'strak' ? 'f-strak' : '';
}
function mentorSVG() {
  return '<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M88 42 Q110 62 96 100 Q92 74 84 62Z" fill="var(--accent)"/><path d="M36 44 L29 16 L50 34Z" fill="#f3cfa9"/><path d="M84 44 L91 16 L70 34Z" fill="#f3cfa9"/><ellipse cx="60" cy="66" rx="31" ry="34" fill="#f6d9b8"/><ellipse cx="60" cy="92" rx="21" ry="15" fill="#fdeedd"/><path d="M40 34 Q60 12 80 34 Q72 30 68 46 Q60 32 52 46 Q48 30 40 34Z" fill="var(--accent)"/><circle cx="47" cy="64" r="6" fill="#3b2a3a"/><circle cx="73" cy="64" r="6" fill="#3b2a3a"/><circle cx="49" cy="62" r="2" fill="#fff"/><circle cx="75" cy="62" r="2" fill="#fff"/><circle cx="38" cy="78" r="6" fill="#ff9ec4" opacity=".6"/><circle cx="82" cy="78" r="6" fill="#ff9ec4" opacity=".6"/><ellipse cx="53" cy="92" rx="2.4" ry="3.2" fill="#c79a78"/><ellipse cx="67" cy="92" rx="2.4" ry="3.2" fill="#c79a78"/><path d="M51 100 Q60 107 69 100" stroke="#8a5a44" stroke-width="2.5" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="24" rx="25" ry="10" fill="var(--accent2)" transform="rotate(-14 50 24)"/><circle cx="46" cy="13" r="3.5" fill="var(--accent2)"/></svg>';
}
const mentor = (html, small) => '<div class="mentor' + (small ? ' small' : '') + '">' + mentorSVG() + '<div class="bubble"><b class="nm">' + esc(S.mentor) + ':</b> ' + html + '</div></div>';
function ring(mini) {
  const sec = dayRO(dkey()).sec, p = Math.min(1, sec / GOAL), c = 2 * Math.PI * 42, m = Math.floor(sec / 60);
  return '<div class="ring' + (mini ? ' mini' : '') + '" id="tring" title="Geoefend vandaag"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42"/><circle class="p" cx="50" cy="50" r="42" stroke-dasharray="' + c + '" stroke-dashoffset="' + c * (1 - p) + '"/></svg><div class="in">' + (mini ? '<b>' + (p >= 1 ? '€1' : m + '′') + '</b>' : p >= 1 ? '<b>€1 ✔</b><span>' + m + ' min</span>' : '<b>' + m + '</b><span>van 15 min</span>') + '</div></div>';
}
function toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3200); }
function confetti(em) { const f = $('#fx'); for (let i = 0; i < 36; i++) { const s = document.createElement('span'); s.textContent = em[i % em.length]; s.style.left = Math.random() * 100 + 'vw'; s.style.animationDuration = 1.8 + Math.random() * 2 + 's'; s.style.animationDelay = Math.random() * .6 + 's'; f.appendChild(s); setTimeout(() => s.remove(), 4800); } }

/* ===== Oefentijd tellen (alleen als ze echt bezig is) ===== */
['click', 'keydown', 'touchstart', 'input'].forEach(e => document.addEventListener(e, () => { lastAct = Date.now(); }, true));
setInterval(() => {
  const vc = $('#vidclaim'); if (vc && cur && cur.vidT0 && vc.disabled) { const left = cur.vidNeed - Math.floor((Date.now() - cur.vidT0) / 1000); if (left > 0) vc.textContent = 'Kijk nog ' + left + ' seconden…'; else { vc.disabled = false; vc.textContent = '✔ Ik heb gekeken: geef me 3 sterren'; } }
  if (view !== 'practice' || document.hidden || (Date.now() - lastAct > 75000 && Date.now() > vidUntil)) return;
  const d = day(); d.sec++;
  if (d.sec >= GOAL && !d.euro) { d.euro = true; save(); confetti(['💶', '🎉', '⭐', '🐎']); toast('15 minuten geoefend: je hebt € 1 verdiend! 🎉'); }
  if (d.sec % 5 === 0) save();
  const el = $('#tring'); if (el) el.outerHTML = ring(true);
}, 1000);

/* ===== Vragen kiezen ===== */
function start(mode) { sess = { mode, n: 0, right: 0, last: [], lastSubj: null, revanche: null, ups: [], miss: {} }; view = 'practice'; lastAct = Date.now(); nextQ(); }
function chooseSkill() {
  const all = Object.keys(SKILLS); let subj = sess.mode;
  if (sess.mode === 'mix') subj = wpick(Object.keys(SUBJ).filter(k => k !== sess.lastSubj), k => SUBJ[k].w);
  let ids = all.filter(k => SKILLS[k].s === subj && !sess.last.includes(k)); if (!ids.length) ids = all.filter(k => SKILLS[k].s === subj);
  return wpick(ids, k => { const s = skill(k); return 1 + (s.q ? 2 * (1 - s.r / s.q) : 1) + (s.q < 3 ? 1.5 : 0); });
}
function pers(q) { const n = esc(S.name || 'Ster'), f = s => typeof s === 'string' ? s.split('{naam}').join(n) : s; ['prompt', 'context', 'steps', 'correctText'].forEach(k => { q[k] = f(q[k]); }); (q.options || []).forEach(o => { o.t = f(o.t); o.why = f(o.why); }); q.v = q.v || SKILLS[q.skill].v || null; return q; }
function nextQ() {
  vidUntil = 0;
  let id, item, rev = null, revanche = false;
  const inMode = s => sess.mode === 'mix' || sess.mode === 'fouten' || SKILLS[s].s === sess.mode;
  if (sess.revanche) { id = sess.revanche; sess.revanche = null; revanche = true; }
  else {
    const pool = S.review.filter(r => SKILLS[r.skill] && inMode(r.skill)), due = pool.filter(r => r.due <= S.qcount);
    if (sess.mode === 'fouten') { if (!pool.length) { sess.cleared = true; view = 'summary'; return render(); } rev = due[0] || pool[0]; }
    else if (due.length && Math.random() < 0.35) rev = due[0];
    if (rev) { id = rev.skill; item = rev.item; } else id = chooseSkill();
  }
  const sk = skill(id), q = pers(GEN[id](sk.lvl, { id: item, recent: S.recent[id] || [] }));
  if (q.item != null) { const r = S.recent[id] || (S.recent[id] = []); r.push(q.item); if (r.length > 12) r.shift(); }
  q.rev = rev; q.revanche = revanche;
  cur = { q, done: false, phase: q.type === 'flash' ? 'ready' : 'ask' };
  sess.last.push(id); if (sess.last.length > 3) sess.last.shift(); sess.lastSubj = SKILLS[id].s;
  render();
}
function answer(ok, why, given) {
  if (cur.done) return; const q = cur.q;
  Object.assign(cur, { done: true, ok, why, given, praise: U.pick(PRAISE), oops: U.pick(OOPS) });
  const sk = skill(q.skill), d = day(), ds = d.sk[q.skill] || (d.sk[q.skill] = { q: 0, r: 0 });
  ds.q++; sk.q++; sess.n++; S.qcount++;
  if (ok) {
    ds.r++; sk.r++; sess.right++; S.stars++; sk.run = Math.max(0, sk.run) + 1;
    if (q.rev) S.review = S.review.filter(r => r !== q.rev);
    if (sk.run >= 4 && sk.lvl < 3) { sk.lvl++; sk.run = 0; cur.up = true; sess.ups.push(q.skill); confetti(['⭐', '🌟', '🦄']); }
  } else {
    sk.run = Math.min(0, sk.run) - 1; sess.miss[q.skill] = (sess.miss[q.skill] || 0) + 1;
    if (sk.run <= -2 && sk.lvl > 1) { sk.lvl--; sk.run = 0; }
    if (q.rev) q.rev.due = S.qcount + 4;
    else if (!S.review.some(r => r.skill === q.skill && r.item === q.item)) S.review.push({ skill: q.skill, item: q.item, due: S.qcount + 4 });
    if (!q.revanche) sess.revanche = q.skill;
  }
  save(); render();
}
function parseNum(s) { s = String(s).trim().replace(/\s|€|%/g, ''); if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, ''); s = s.replace(',', '.'); return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN; }
const LVL = ['', 'Veulen', 'Pony', 'Kampioen'];
const lvIcons = l => '<span class="lv" title="Niveau ' + l + ': ' + LVL[l] + '">' + [1, 2, 3].map(i => '<span class="' + (i <= l ? '' : 'off') + '">🏅</span>').join('') + '</span>';
const vidUrl = id => SKILLS[id].v ? 'https://www.youtube.com/watch?v=' + SKILLS[id].v : 'https://www.youtube.com/results?search_query=' + encodeURIComponent('Wijzer over de Basisschool ' + SKILLS[id].vid);

/* ===== Schermen ===== */
const V = {};
const head = (title, extra) => '<div class="top noprint"><button class="btn ghost sm" data-act="go" data-v="home">← Terug</button><h2 style="margin:0">' + title + '</h2><span>' + (extra || '') + '</span></div>';
const palButtons = () => Object.keys(PALS).map(k => '<button class="sw' + (S.theme.pal === k ? ' on' : '') + '" data-act="pal" data-k="' + k + '" title="' + PALS[k].n + '" style="background:' + PALS[k].accent + '"><i style="background:' + PALS[k].accent2 + '"></i></button>').join('');

V.setup = () => '<div class="card" style="margin-top:4vh">' + mentor('Hoi! Ik ben <b>Luna</b>, een pony met een baret én jouw nieuwe mentor. Ik help je elke dag een stukje slimmer te worden. En ja, ik vertel ook grapjes. Sorry alvast. 🎨') +
  '<form data-form="setup" style="margin-top:18px"><label class="f">Hoe heet jij?</label><input class="inp wide" name="name" value="' + esc(S.name) + '" placeholder="je voornaam" required maxlength="20">' +
  '<label class="f">Kies een geheime code van 4 cijfers</label><input class="inp" name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required placeholder="••••" autocomplete="off">' +
  '<label class="f">Kies je lievelingskleuren (je kunt dit later altijd veranderen)</label><div class="row">' + palButtons() + '</div>' +
  '<p style="margin-top:22px"><button class="btn big">Ik ben er klaar voor! 🐎</button></p></form></div>';

V.login = () => '<div class="card pinbox">' + mentor('Hé ' + esc(S.name) + '! Wat is je geheime code?', true) +
  '<form data-form="login" style="margin-top:18px"><input class="inp" name="pin" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off" autofocus><p><button class="btn big">Naar binnen</button></p></form>' +
  '<p class="muted">Code vergeten? Vraag papa of mama: zij kunnen hem bij "Ouders" opnieuw instellen.</p><button class="btn ghost sm" data-act="go" data-v="parent">👨‍👩‍👧 Ouders</button></div>';

V.home = () => {
  const d = dayRO(dkey()), t = tot(d), st = streak(), hr = new Date().getHours(), bal = earned() - paidOut(), left = Math.max(0, Math.ceil((GOAL - d.sec) / 60));
  const hi = hr < 12 ? 'Goedemorgen' : hr < 18 ? 'Hoi' : 'Goedenavond';
  const msg = d.euro ? 'Je euro voor vandaag is binnen! Wil je nog even door, of ga je iets moois kleuren in het atelier?' : t.q ? 'Lekker bezig! Nog ' + left + ' minuten en je euro van vandaag is binnen.' : st > 1 ? 'Al ' + st + ' dagen op rij geoefend. Zullen we er ' + (st + 1) + ' van maken?' : 'Fijn dat je er bent. Vandaag weer een kwartiertje slimmer worden?';
  const lastW = weekStats(-1), isMon = new Date().getDay() === 1;
  return '<div class="top"><h1>' + esc(S.name) + '\'s Atelier</h1><div class="row"><span class="pill" title="Sterren">⭐ ' + S.stars + '</span><span class="pill" title="Dagen op rij">🔥 ' + st + '</span><span class="pill" title="Spaarpot">💶 € ' + bal + '</span><button class="btn ghost sm" data-act="logout">Uitloggen</button></div></div>' +
    '<div class="card hero"><div>' + mentor(hi + ' ' + esc(S.name) + '! ' + msg) + '<p style="margin:16px 0 0"><button class="btn big" data-act="start" data-m="mix">▶ Start de training van vandaag</button></p></div>' + ring(false) + '</div>' +
    '<div class="card">' + mentor('<span id="joke">' + JOKES[jokeI % JOKES.length] + '</span> <button class="btn ghost sm" data-act="joke" style="margin-left:6px">Nog een grap</button>', true) + '</div>' +
    '<h2>Zelf kiezen wat je oefent</h2><div class="grid" style="margin-bottom:22px">' + Object.keys(SUBJ).map(k => { const ids = Object.keys(SKILLS).filter(s => SKILLS[s].s === k), lv = ids.reduce((a, s) => a + skill(s).lvl, 0) / ids.length; return '<button class="tile" data-act="start" data-m="' + k + '"><span class="ic">' + SUBJ[k].ic + '</span>' + SUBJ[k].n + '<small>niveau ' + lv.toFixed(1).replace('.', ',') + ' van 3</small></button>'; }).join('') + '</div>' +
    '<h2>Mijn plekjes</h2><div class="grid">' +
    '<button class="tile" data-act="start" data-m="fouten"><span class="ic">🧹</span>Foutenstal<small>' + (S.review.length ? S.review.length + ' om op te ruimen' : 'helemaal schoon!') + '</small></button>' +
    '<button class="tile" data-act="go" data-v="atelier"><span class="ic">🎨</span>Kleur-atelier<small>kleur je eigen paard</small></button>' +
    '<button class="tile" data-act="go" data-v="progress"><span class="ic">📈</span>Mijn voortgang<small>zie hoe je groeit</small></button>' +
    '<button class="tile" data-act="go" data-v="style"><span class="ic">💅</span>Mijn stijl<small>kleuren en plaatjes</small></button>' +
    '<button class="tile" data-act="go" data-v="parent"><span class="ic">👨‍👩‍👧</span>Ouders<small>' + (isMon && lastW.q ? 'weekrapport staat klaar!' : 'weekrapport') + '</small></button></div>';
};

V.practice = () => {
  const q = cur.q, sk = SKILLS[q.skill], su = SUBJ[sk.s];
  let h = '<div class="top"><button class="btn ghost sm" data-act="stop">⏹ Stoppen</button><div class="row">' + ring(true) + '<span class="pill">⭐ ' + S.stars + '</span><span class="pill">✅ ' + sess.right + ' van ' + sess.n + '</span></div></div><div class="card">';
  h += '<div><span class="chip">' + su.ic + ' ' + su.n + '</span><span class="chip">' + sk.n + '</span>' + (q.rev ? '<span class="chip rev">🧹 uit de Foutenstal</span>' : '') + (q.revanche ? '<span class="chip rev">💪 revanche</span>' : '') + '</div>';
  if (q.context) h += '<div class="context">' + q.context + '</div>';
  h += '<div class="prompt">' + q.prompt + '</div>';
  if (q.type === 'mc') h += '<div class="opts' + (q.long ? ' long' : '') + '">' + q.options.map((o, i) => '<button class="opt' + (cur.done && o.ok ? ' good' : '') + (cur.done && cur.given === i && !o.ok ? ' wrong' : '') + '" data-act="ans" data-i="' + i + '"' + (cur.done ? ' disabled' : '') + '><span class="l">' + 'ABCD'[i] + '</span><span>' + o.t + '</span></button>').join('') + '</div>';
  else if (q.type === 'num') h += '<form data-form="num" class="numrow"><span>' + (q.pre || '') + '</span><input class="inp" name="a" inputmode="decimal" autocomplete="off" placeholder="?" ' + (cur.done ? 'disabled value="' + esc(cur.given) + '"' : '') + '><span>' + (q.unit || '') + '</span>' + (cur.done ? '' : '<button class="btn">Controleer</button>') + '</form>';
  else if (cur.phase === 'ready') h += '<button class="btn two big" data-act="flash">👀 Laat het woord zien</button>';
  else if (cur.phase === 'show') h += '<div class="flash">' + esc(q.word) + '</div><div class="flashbar"></div>';
  else h += '<form data-form="txt" class="numrow"><input class="inp wide" name="a" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="typ het woord" ' + (cur.done ? 'disabled value="' + esc(cur.given) + '"' : '') + '>' + (cur.done ? '' : '<button class="btn">Controleer</button>') + '</form>';
  if (cur.done) h += cur.ok ? '<div class="fb good">' + mentor(cur.praise + (cur.up ? ' <b>En… niveau omhoog! Je bent nu ' + LVL[skill(q.skill).lvl] + ' in ' + sk.n + '!</b> 🌟' : '') + (q.rev ? ' Deze mag weg uit de Foutenstal. 🧹' : ''), true) + '<p style="margin:12px 0 0"><button class="btn" data-act="next" id="nextb">Volgende →</button></p></div>'
    : '<div class="fb bad">' + mentor(cur.oops, true) +
    '<h4>🔎 Waarom ging het mis?</h4><div class="why">' + (cur.why || 'Jouw antwoord was <b>' + esc(cur.given) + '</b>. Loop de stappen hieronder één voor één na en kijk bij welke stap jouw som anders ging.') + '</div>' +
    '<h4>🪄 Zo doe je het</h4><div class="why">' + (q.steps || 'Het goede antwoord is <b>' + q.correctText + '</b>.') + '</div>' +
    '<h4>💡 Zo maak je deze fout nooit meer</h4><div class="why">' + sk.trick + '</div>' +
    (q.retype ? '<h4>✍️ Typ het goede woord één keer over</h4><input class="inp wide" data-retype="' + esc(q.retype) + '" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="' + esc(q.retype) + '">' : '') +
    (q.v ? '<div class="vidch"><h4 style="margin-top:0">🎬 ' + esc(S.mentor) + '\'s uitdaging</h4><p>' + (sess.miss[q.skill] >= 2 ? '<b>Dit onderdeel ging nu al ' + sess.miss[q.skill] + ' keer mis.</b> Geen ramp, maar dan is het slim om eerst de uitleg te kijken. Daarna lukt de revanche vast wel!' : 'Durf jij de uitleg te kijken voordat je revanche neemt?') + ' Het filmpje <i>' + VID[q.v][1] + '</i> duurt ongeveer ' + Math.max(1, Math.round(VID[q.v][0] / 60)) + ' minuten. Kijk je het, dan krijg je <b>3 bonussterren</b> en telt de kijktijd mee voor je euro.</p><div id="vidbox"><button class="btn two" data-act="vid">▶ Ik neem de uitdaging aan</button></div></div>' : '') +
    '<p class="row" style="margin:14px 0 0"><button class="btn' + (q.v && sess.miss[q.skill] >= 2 ? ' ghost sm' : '') + '" data-act="next" id="nextb"' + (q.retype ? ' disabled' : '') + '>' + (q.v && sess.miss[q.skill] >= 2 ? 'Verder zonder filmpje' : 'Ik snap het! Geef me een revanche 💪') + '</button>' + (q.v ? '' : '<a class="btn ghost sm" target="_blank" rel="noopener" href="' + vidUrl(q.skill) + '">🎬 Zoek een uitlegfilmpje</a>') + '</p></div>';
  return h + '</div>';
};

V.summary = () => {
  const d = dayRO(dkey()), m = Math.floor(d.sec / 60), p = pct(sess.right, sess.n), miss = Object.keys(sess.miss);
  const msg = sess.cleared && !sess.n ? 'De Foutenstal is helemaal schoon! Er valt niks op te ruimen. Ga lekker de gewone training doen.' : !sess.n ? 'Je hebt nog geen vraag gemaakt. Kom je straks terug?' : p >= 85 ? 'Wauw, ' + p + '% goed! Jij ging als een raket. Of nou ja, als een renpaard.' : p >= 60 ? p + '% goed. Mooi gewerkt! En van de fouten heb je het meest geleerd.' : 'Dit waren pittige vragen en je bent er tóch voor gaan zitten. Daar word je echt beter van. Morgen pakken we ze terug!';
  return '<div class="card center" style="margin-top:4vh">' + mentor(msg) + '<div class="stats" style="margin:20px 0"><div class="stat"><b>' + sess.n + '</b>vragen</div><div class="stat"><b>' + sess.right + '</b>goed</div><div class="stat"><b>' + m + ' min</b>vandaag</div><div class="stat"><b>' + (d.euro ? '€ 1 ✔' : 'nog ' + Math.max(1, Math.ceil((GOAL - d.sec) / 60)) + ' min') + '</b>' + (d.euro ? 'verdiend' : 'tot je euro') + '</div></div>' +
    (sess.ups.length ? '<p>🌟 <b>Niveau omhoog</b> bij: ' + sess.ups.map(s => SKILLS[s].n).join(', ') + '</p>' : '') +
    (miss.length ? '<p>🧹 <b>Nog even oefenen:</b> ' + miss.map(s => SKILLS[s].n).join(', ') + '. Die komen vanzelf terug.</p>' : '') +
    '<p class="row" style="justify-content:center"><button class="btn" data-act="go" data-v="home">Naar mijn atelier</button>' + (d.euro ? '' : '<button class="btn two" data-act="start" data-m="mix">Nog even door</button>') + '<button class="btn ghost" data-act="go" data-v="atelier">🎨 Kleuren</button></p>' + (sess.n >= 5 ? '<p><button class="btn two big" data-act="game">🏇 Speel de hindernisbaan</button></p>' : '<p class="muted">Maak minstens 5 vragen, dan mag je de hindernisbaan spelen.</p>') + '</div>';
};

function badges() {
  const lv3 = Object.values(S.skills).filter(s => s.lvl === 3).length, days = Object.values(S.days).filter(d => tot(d).q).length, subjDone = Object.keys(SUBJ).every(k => Object.keys(SKILLS).some(s => SKILLS[s].s === k && skill(s).q));
  return [['🐣', 'Eerste stapjes', days >= 1], ['🔥', '3 dagen op rij', streak() >= 3], ['🏆', 'Week vol', streak() >= 7], ['⭐', '50 sterren', S.stars >= 50], ['🌟', '250 sterren', S.stars >= 250], ['🧭', 'Alle vakken geproefd', subjDone], ['🥇', 'Eerste Kampioen-niveau', lv3 >= 1], ['👑', '10× Kampioen-niveau', lv3 >= 10], ['💶', 'Eerste euro', earned() >= 1], ['💰', '10 euro verdiend', earned() >= 10], ['🧹', 'Foutenstal schoon', S.qcount > 10 && !S.review.length], ['🦄', '20 oefendagen', days >= 20]];
}
V.progress = () => {
  let ch = ''; const d = new Date(); d.setHours(12); d.setDate(d.getDate() - 13); let mx = 20;
  const ds = []; for (let i = 0; i < 14; i++) { const r = dayRO(dkey(d)); ds.push([d.getDate(), r.sec / 60]); mx = Math.max(mx, r.sec / 60); d.setDate(d.getDate() + 1); }
  ch = '<div class="chart"><div class="goal" style="bottom:' + (15 / mx * 100 * 0.82 + 12) + '%">15 min = € 1</div>' + ds.map(x => '<div class="col"><i class="' + (x[1] >= 15 ? 'hit' : '') + '" style="height:' + x[1] / mx * 82 + '%"></i>' + x[0] + '</div>').join('') + '</div>';
  const all = Object.values(S.skills).reduce((a, s) => ({ q: a.q + s.q, r: a.r + s.r }), { q: 0, r: 0 });
  return head('📈 Mijn voortgang') + '<div class="card"><div class="stats"><div class="stat"><b>' + all.q + '</b>vragen gemaakt</div><div class="stat"><b>' + pct(all.r, all.q) + '%</b>goed</div><div class="stat"><b>' + streak() + '</b>dagen op rij</div><div class="stat"><b>€ ' + earned() + '</b>verdiend</div></div><h3 style="margin-top:18px">Minuten per dag (laatste 2 weken)</h3>' + ch + '</div>' +
    '<div class="card"><h3>Mijn medailles</h3><div class="badges">' + badges().map(b => '<div class="badge' + (b[2] ? '' : ' off') + '"><span>' + b[0] + '</span>' + b[1] + '</div>').join('') + '</div></div>' +
    Object.keys(SUBJ).map(k => '<div class="card"><h3>' + SUBJ[k].ic + ' ' + SUBJ[k].n + '</h3>' + Object.keys(SKILLS).filter(s => SKILLS[s].s === k).map(s => { const x = skill(s); return '<div class="skill"><div><b>' + SKILLS[s].n + '</b> <a href="' + vidUrl(s) + '" target="_blank" rel="noopener" title="Uitlegfilmpje">🎬</a><div class="muted">' + (x.q ? x.q + ' vragen, ' + pct(x.r, x.q) + '% goed' : 'nog niet geoefend') + '</div></div><div class="bar"><i style="width:' + pct(x.r, x.q) + '%"></i></div>' + lvIcons(x.lvl) + '</div>'; }).join('') + '</div>').join('') +
    '<p class="muted center">🏅 = Veulen · 🏅🏅 = Pony · 🏅🏅🏅 = Kampioen. Vier keer achter elkaar goed? Dan ga je een niveau omhoog.</p>';
};

V.style = () => head('💅 Mijn stijl') + '<div class="card">' + mentor('Maak het hier helemaal van jou. Alles wat je kiest, zie je meteen.', true) +
  '<label class="f">Kleurenpalet</label><div class="row">' + palButtons() + '</div>' +
  '<label class="f">Of kies helemaal zelf je hoofdkleur</label><div class="row"><input type="color" data-bind="accent" value="' + (S.theme.accent || PALS[S.theme.pal].accent) + '" style="width:64px;height:48px;border:0;background:none;cursor:pointer"><button class="btn ghost sm" data-act="noaccent">Terug naar palet</button></div>' +
  '<label class="f">Plaatjes op de achtergrond</label><div class="row">' + Object.keys(PATS).map(k => '<button class="pick' + (S.theme.pattern === k ? ' on' : '') + '" data-act="pat" data-k="' + k + '">' + (PATS[k] ? PATS[k].join(' ') + ' ' : '') + k + '</button>').join('') + '</div>' +
  '<label class="f">Letters</label><div class="row">' + [['rond', 'Rond en vrolijk'], ['sier', 'Sierlijk'], ['strak', 'Strak']].map(f => '<button class="pick' + (S.theme.font === f[0] ? ' on' : '') + '" data-act="font" data-k="' + f[0] + '">' + f[1] + '</button>').join('') + '</div>' +
  '<label class="f">Mijn naam</label><input class="inp wide" data-bind="name" value="' + esc(S.name) + '" maxlength="20">' +
  '<label class="f">Naam van mijn mentor-pony</label><input class="inp wide" data-bind="mentor" value="' + esc(S.mentor) + '" maxlength="16"></div>';

const COLS = [[0, '#ffffff'], [0, '#f0428f'], [0, '#ffd23f'], [0, '#6ec6ff'], [0, '#7bd88f'], [0, '#8b5a3c'], [10, '#a66bff'], [25, '#ff8a5c'], [45, '#3b2a3a'], [70, '#ffb6d9'], [100, '#2bbf9a'], [140, '#c9a227'], [190, '#e63946'], [250, '#b8f2ff'], [320, 'rainbow']];
const fillOf = r => { const c = S.art[r] || '#ffffff'; return c === 'rainbow' ? 'url(#rb)' : c; };
function scene() {
  const R = (id, inner, tag = 'g') => '<' + tag + ' data-r="' + id + '" fill="' + fillOf(id) + '"' + inner;
  const fl = (id, x, y) => R(id, '><circle cx="' + (x - 7) + '" cy="' + y + '" r="6"/><circle cx="' + (x + 7) + '" cy="' + y + '" r="6"/><circle cx="' + x + '" cy="' + (y - 7) + '" r="6"/><circle cx="' + x + '" cy="' + (y + 7) + '" r="6"/></g>') + '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#ffd23f" stroke="#4a2740" stroke-width="1.5"/>';
  return '<svg viewBox="0 0 400 300" role="img" aria-label="Kleurplaat van een paard"><defs><linearGradient id="rb" x1="0" x2="1"><stop offset="0" stop-color="#ff5f6d"/><stop offset=".25" stop-color="#ffd23f"/><stop offset=".5" stop-color="#7bd88f"/><stop offset=".75" stop-color="#6ec6ff"/><stop offset="1" stop-color="#a66bff"/></linearGradient></defs>' +
    R('lucht', ' x="0" y="0" width="400" height="300"/>', 'rect') + R('zon', ' cx="345" cy="48" r="28"/>', 'circle') +
    R('wolk1', '><ellipse cx="80" cy="50" rx="34" ry="16"/><ellipse cx="108" cy="42" rx="24" ry="16"/><ellipse cx="58" cy="44" rx="20" ry="12"/></g>') + R('wolk2', '><ellipse cx="225" cy="34" rx="28" ry="12"/><ellipse cx="248" cy="28" rx="18" ry="11"/></g>') +
    R('heuvel', ' d="M0 205 Q100 150 200 195 T400 185 V300 H0Z"/>', 'path') + R('gras', ' d="M0 252 Q200 228 400 252 V300 H0Z"/>', 'path') +
    R('staart', ' d="M142 158 Q100 160 108 232 Q124 196 146 182Z"/>', 'path') +
    R('benen', '><rect x="156" y="190" width="15" height="58" rx="5"/><rect x="180" y="194" width="15" height="54" rx="5"/><rect x="222" y="194" width="15" height="54" rx="5"/><rect x="244" y="190" width="15" height="58" rx="5"/></g>') +
    R('hoeven', '><rect x="154" y="246" width="19" height="11" rx="3"/><rect x="178" y="246" width="19" height="11" rx="3"/><rect x="220" y="246" width="19" height="11" rx="3"/><rect x="242" y="246" width="19" height="11" rx="3"/></g>') +
    R('lijf', '><ellipse cx="205" cy="170" rx="66" ry="38"/><path d="M246 150 L284 92 L308 112 L266 178Z"/><ellipse cx="304" cy="98" rx="30" ry="17" transform="rotate(24 304 98)"/><path d="M284 82 L286 58 L299 78Z"/></g>') +
    R('manen', ' d="M250 146 Q250 100 284 78 Q292 84 286 94 Q268 112 270 156Z"/>', 'path') + R('zadel', ' d="M178 136 Q205 122 232 138 L228 164 Q205 172 182 164Z"/>', 'path') +
    '<circle cx="310" cy="92" r="3.5" fill="#4a2740"/><path d="M322 110 Q327 112 330 108" stroke="#4a2740" stroke-width="2" fill="none"/>' +
    fl('bloem1', 50, 262) + fl('bloem2', 110, 276) + fl('bloem3', 340, 268) +
    R('vlinder', '><ellipse cx="52" cy="128" rx="11" ry="15" transform="rotate(-25 52 128)"/><ellipse cx="74" cy="128" rx="11" ry="15" transform="rotate(25 74 128)"/></g>') + '<line x1="63" y1="118" x2="63" y2="142" stroke="#4a2740" stroke-width="3" stroke-linecap="round"/></svg>';
}
V.atelier = () => { const nx = COLS.find(c => c[0] > S.stars); return head('🎨 Kleur-atelier', '<span class="pill">⭐ ' + S.stars + '</span>') + '<div class="card">' + mentor('Kies een kleur en tik op een stukje van de tekening. ' + (nx ? 'Nog <b>' + (nx[0] - S.stars) + ' sterren</b> en je krijgt er een nieuwe kleur bij!' : 'Je hebt álle kleuren, zelfs de regenboog. Wat een kunstenaar!'), true) +
  '<div class="cols">' + COLS.map(c => c[0] > S.stars ? '<button class="col-b lock" disabled title="Nog ' + (c[0] - S.stars) + ' sterren">⭐' + c[0] + '</button>' : '<button class="col-b' + (artColor === c[1] ? ' on' : '') + '" data-act="col" data-c="' + c[1] + '" style="background:' + (c[1] === 'rainbow' ? 'linear-gradient(90deg,#ff5f6d,#ffd23f,#7bd88f,#6ec6ff,#a66bff)' : c[1]) + '" aria-label="kleur"></button>').join('') + '</div>' +
  '<div class="easel">' + scene() + '</div><p style="margin:14px 0 0"><button class="btn ghost sm" data-act="artclear">🧽 Opnieuw beginnen</button></p></div>'; };


/* ===== Beloningsspel: de hindernisbaan ===== */
let G = null;
V.game = () => '<div class="card center" style="margin-top:2vh">' + mentor((sess && sess.resume ? 'Tien vragen gedaan, tijd voor een pauze! ' : 'Goed gewerkt, je hebt een spelletje verdiend! ') + 'Spring over de hindernissen en pak de sterren. <b>Tik op het spel</b> of druk op de <b>spatiebalk</b> om te springen.', true) +
  '<canvas id="gc" width="800" height="320" aria-label="Hindernisbaan-spel"></canvas><div class="row" style="justify-content:center;margin-top:12px"><span class="pill">⭐ <span id="gsc">0</span></span><span class="pill">💗 <span id="glv">3</span></span><span class="pill">⏱ <span id="gtm">45</span></span><span class="pill">🏆 record ' + (S.hi || 0) + '</span></div>' +
  '<div id="gend" class="row" style="justify-content:center;margin-top:14px"><button class="btn ghost sm" data-act="gamedone">Sla het spel over</button></div><p class="muted">Het spel is een pauze: de oefenklok staat even stil.</p></div>';
function jump() { if (G && !G.over && G.y === 0) G.vy = -13.5; }
function startGame() {
  const cv = $('#gc'); if (!cv) return; const cx = cv.getContext('2d'), cs = getComputedStyle(document.documentElement), col = k => cs.getPropertyValue('--' + k).trim();
  const C = { bg: col('bg'), soft: col('soft'), acc: col('accent'), acc2: col('accent2'), ink: col('ink'), card: col('card') };
  const g = G = { y: 0, vy: 0, obs: [], stars: [], score: 0, lives: 3, dist: 0, nextObs: 500, nextStar: 300, inv: 0, over: false, t0: performance.now(), last: performance.now(), left: 45 };
  cv.onpointerdown = e => { e.preventDefault(); jump(); };
  const GY = 262, PX = 120;
  function pony(leg) {
    const by = GY - 44 + g.y; cx.save(); if (g.inv > 0 && Math.floor(g.inv / 5) % 2) cx.globalAlpha = .35;
    cx.strokeStyle = '#d9b48f'; cx.lineWidth = 8; cx.lineCap = 'round';
    [[-20, 1], [-8, -1], [14, 1], [26, -1]].forEach(l => { const s = g.y < 0 ? 10 * l[1] : Math.sin(leg + l[1]) * 12 * l[1]; cx.beginPath(); cx.moveTo(PX + l[0], by + 12); cx.lineTo(PX + l[0] + s, by + 42); cx.stroke(); });
    cx.fillStyle = C.acc; cx.beginPath(); cx.moveTo(PX - 34, by - 6); cx.quadraticCurveTo(PX - 66, by + 2 + Math.sin(leg) * 4, PX - 52, by + 34); cx.quadraticCurveTo(PX - 46, by + 10, PX - 30, by + 6); cx.fill();
    cx.fillStyle = '#f6d9b8'; cx.beginPath(); cx.ellipse(PX, by, 38, 22, 0, 0, 7); cx.fill();
    cx.beginPath(); cx.moveTo(PX + 18, by - 12); cx.lineTo(PX + 38, by - 46); cx.lineTo(PX + 56, by - 34); cx.lineTo(PX + 36, by + 4); cx.fill();
    cx.beginPath(); cx.ellipse(PX + 54, by - 40, 20, 12, .35, 0, 7); cx.fill();
    cx.beginPath(); cx.moveTo(PX + 40, by - 50); cx.lineTo(PX + 42, by - 66); cx.lineTo(PX + 52, by - 52); cx.fill();
    cx.fillStyle = C.acc; cx.beginPath(); cx.moveTo(PX + 20, by - 14); cx.quadraticCurveTo(PX + 18, by - 44, PX + 40, by - 56); cx.quadraticCurveTo(PX + 36, by - 34, PX + 34, by - 8); cx.fill();
    cx.fillStyle = C.acc2; cx.beginPath(); cx.ellipse(PX + 46, by - 60, 15, 6, -.3, 0, 7); cx.fill();
    cx.fillStyle = '#3b2a3a'; cx.beginPath(); cx.arc(PX + 58, by - 43, 3, 0, 7); cx.fill();
    cx.fillStyle = C.acc2; cx.beginPath(); cx.ellipse(PX - 2, by - 14, 16, 8, 0, Math.PI, 0); cx.fill(); cx.restore();
  }
  function frame(now) {
    if (G !== g || view !== 'game') return;
    const k = Math.min(3, (now - g.last) / 16.67); g.last = now;
    if (!g.over) {
      const sp = (5 + (now - g.t0) / 9000) * k; g.dist += sp; g.left = Math.max(0, 45 - (now - g.t0) / 1000);
      g.vy += .65 * k; g.y = Math.min(0, g.y + g.vy * k); if (g.y === 0) g.vy = 0; if (g.inv > 0) g.inv -= k;
      if (g.dist > g.nextObs) { g.obs.push({ x: 840, h: 30 + Math.random() * 26, hit: false, done: false }); g.nextObs = g.dist + 330 + Math.random() * 300; }
      if (g.dist > g.nextStar) { g.stars.push({ x: 840, y: GY - 70 - Math.random() * 90 }); g.nextStar = g.dist + 200 + Math.random() * 260; }
      g.obs.forEach(o => { o.x -= sp; if (!o.hit && !o.done && o.x < PX + 40 && o.x + 20 > PX - 30 && GY + g.y > GY - o.h + 8) { o.hit = true; if (g.inv <= 0) { g.lives--; g.inv = 70; } } if (!o.hit && !o.done && o.x + 20 < PX - 30) { o.done = true; g.score++; } });
      g.stars.forEach(s => { s.x -= sp; if (!s.got && Math.abs(s.x - PX - 10) < 44 && Math.abs(s.y - (GY - 40 + g.y)) < 46) { s.got = true; g.score += 2; } });
      g.obs = g.obs.filter(o => o.x > -40); g.stars = g.stars.filter(s => s.x > -40 && !s.got);
      if (g.lives <= 0 || g.left <= 0) endGame(g);
      $('#gsc').textContent = g.score; $('#glv').textContent = Math.max(0, g.lives); $('#gtm').textContent = Math.ceil(g.left);
    }
    cx.fillStyle = C.bg; cx.fillRect(0, 0, 800, 320);
    cx.fillStyle = C.soft; for (let i = 0; i < 4; i++) { const hx = ((i * 290 - g.dist * .25) % 1160 + 1160) % 1160 - 180; cx.beginPath(); cx.ellipse(hx, GY + 6, 170, 80 + i % 2 * 30, 0, Math.PI, 0); cx.fill(); }
    cx.fillStyle = C.card; for (let i = 0; i < 3; i++) { const wx = ((i * 330 - g.dist * .12) % 990 + 990) % 990 - 90; cx.beginPath(); cx.ellipse(wx, 50 + i * 22, 44, 15, 0, 0, 7); cx.ellipse(wx + 30, 42 + i * 22, 28, 14, 0, 0, 7); cx.fill(); }
    cx.fillStyle = C.acc2; cx.globalAlpha = .28; cx.fillRect(0, GY + 4, 800, 60); cx.globalAlpha = 1;
    cx.fillStyle = C.ink; for (let i = 0; i < 14; i++) { const gx = ((i * 64 - g.dist) % 896 + 896) % 896 - 40; cx.fillRect(gx, GY + 18 + i % 3 * 10, 16, 3); }
    g.obs.forEach(o => { cx.globalAlpha = o.hit ? .35 : 1; cx.fillStyle = C.ink; cx.fillRect(o.x, GY - o.h, 5, o.h + 4); cx.fillRect(o.x + 17, GY - o.h, 5, o.h + 4); cx.fillStyle = C.acc; cx.fillRect(o.x - 3, GY - o.h + 4, 28, 6); cx.fillStyle = C.card; cx.fillRect(o.x - 3, GY - o.h + 16, 28, 6); cx.globalAlpha = 1; });
    cx.font = '30px serif'; cx.textAlign = 'center'; g.stars.forEach(s => cx.fillText('⭐', s.x, s.y + Math.sin(now / 200 + s.x) * 4));
    pony(g.dist / 14);
    if (g.over) { cx.fillStyle = C.ink; cx.globalAlpha = .55; cx.fillRect(0, 0, 800, 320); cx.globalAlpha = 1; cx.fillStyle = '#fff'; cx.font = '800 44px ' + (cs.getPropertyValue('--hf') || 'sans-serif'); cx.fillText(g.lives > 0 ? 'Finish! ' + g.score + ' punten' : 'Oeps! ' + g.score + ' punten', 400, 150); cx.font = '700 24px sans-serif'; cx.fillText(g.rec ? 'Nieuw record! 🏆' : 'Record: ' + (S.hi || 0), 400, 196); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
function endGame(g) {
  g.over = true; if (g.score > (S.hi || 0)) { S.hi = g.score; g.rec = true; save(); confetti(['🏆', '⭐', '🐎']); }
  sess.plays = (sess.plays || 0) + 1;
  $('#gend').innerHTML = (sess.plays < 2 ? '<button class="btn two" data-act="gameagain">Nog één keer!</button>' : '') + '<button class="btn" data-act="gamedone">' + (sess.resume ? 'Verder met oefenen →' : 'Klaar') + '</button>';
}

/* ===== Ouders ===== */
function weekStats(off) {
  const m = monday(off), days = [], sk = {}; let q = 0, r = 0, sec = 0, eur = 0, vid = 0;
  for (let i = 0; i < 7; i++) { const d = new Date(m); d.setDate(m.getDate() + i); const rec = dayRO(dkey(d)), t = tot(rec); days.push({ d, sec: rec.sec, q: t.q, r: t.r, euro: rec.euro }); q += t.q; r += t.r; sec += rec.sec; if (rec.euro) eur++; vid += Object.values(rec.vid || {}).reduce((x, y) => x + y, 0); for (const k in rec.sk) { const s = sk[k] || (sk[k] = { q: 0, r: 0 }); s.q += rec.sk[k].q; s.r += rec.sk[k].r; } }
  const subj = {}; for (const k in sk) { if (!SKILLS[k]) continue; const s = subj[SKILLS[k].s] || (subj[SKILLS[k].s] = { q: 0, r: 0 }); s.q += sk[k].q; s.r += sk[k].r; }
  return { m, days, sk, subj, q, r, sec, eur, vid };
}
const fd = d => d.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long' });
V.parent = () => {
  if (!S.ppin) return head('👨‍👩‍👧 Ouders') + '<div class="card pinbox"><h3>Kies een oudercode</h3><p class="muted">Hiermee opent u het weekrapport en de spaarpot. Kies een andere code dan die van ' + esc(S.name) + '.</p><form data-form="ppinset"><input class="inp" name="pin" type="password" inputmode="numeric" pattern="[0-9]{4,8}" maxlength="8" required placeholder="4 tot 8 cijfers" autocomplete="off"><p><button class="btn">Opslaan</button></p></form></div>';
  if (!parentOK) return head('👨‍👩‍👧 Ouders') + '<div class="card pinbox"><h3>Oudercode</h3><form data-form="ppin"><input class="inp" name="pin" type="password" inputmode="numeric" maxlength="8" autocomplete="off" autofocus><p><button class="btn">Openen</button></p></form></div>';
  const w = weekStats(repWeek), pw = weekStats(repWeek - 1), end = new Date(w.m); end.setDate(end.getDate() + 6);
  const bal = earned() - paidOut(), dn = ['ma', 'di', 'wo', 'do', 'vr', 'za', 'zo'];
  const weak = Object.keys(w.sk).filter(k => SKILLS[k] && w.sk[k].q > w.sk[k].r).sort((a, b) => (w.sk[b].q - w.sk[b].r) - (w.sk[a].q - w.sk[a].r)).slice(0, 3);
  const strong = Object.keys(w.subj).filter(k => w.subj[k].q >= 4).sort((a, b) => w.subj[b].r / w.subj[b].q - w.subj[a].r / w.subj[a].q)[0];
  const trend = (a, b) => !b || !b.q || !a || !a.q ? '' : pct(a.r, a.q) > pct(b.r, b.q) + 2 ? ' <span class="up">▲</span>' : pct(a.r, a.q) < pct(b.r, b.q) - 2 ? ' <span class="down">▼</span>' : ' =';
  const lvlTxt = l => l >= 2.5 ? 'uitdagend (richting havo/vwo)' : l >= 1.6 ? 'op koers' : 'basis';
  let h = head('👨‍👩‍👧 Weekrapport', '<button class="btn ghost sm" data-act="plock">Vergrendel</button>') +
    '<div class="card"><div class="row sp noprint"><button class="btn ghost sm" data-act="wk" data-d="-1">← Vorige week</button><button class="btn ghost sm" data-act="wk" data-d="1"' + (repWeek >= 0 ? ' disabled' : '') + '>Volgende week →</button></div>' +
    '<h2 style="margin-top:12px">Week van ' + fd(w.m) + ' t/m ' + fd(end) + '</h2><p class="muted">Rapport van ' + esc(S.name) + ', groep 7</p>' +
    '<div class="stats"><div class="stat"><b>' + w.days.filter(d => d.q).length + ' / 7</b>dagen geoefend</div><div class="stat"><b>' + Math.round(w.sec / 60) + ' min</b>oefentijd</div><div class="stat"><b>' + w.q + '</b>vragen</div><div class="stat"><b>' + pct(w.r, w.q) + '%</b>goed' + trend(w, pw) + '</div><div class="stat"><b>' + w.vid + '</b>uitlegfilmpjes gekeken</div><div class="stat"><b>€ ' + w.eur + '</b>verdiend</div></div>';
  h += !w.q ? '<p style="margin-top:14px">Deze week is er nog niet geoefend.</p>' : '<h3 style="margin-top:18px">In het kort</h3><ul>' + (strong ? '<li><b>Sterkste vak:</b> ' + SUBJ[strong].n + ' (' + pct(w.subj[strong].r, w.subj[strong].q) + '% goed).</li>' : '') +
    (weak.length ? weak.map(k => '<li><b>Aandachtspunt:</b> ' + SKILLS[k].n + ' (' + (w.sk[k].q - w.sk[k].r) + ' van de ' + w.sk[k].q + ' fout). Tip om thuis te herhalen: <i>' + SKILLS[k].trick + '</i> <a href="' + vidUrl(k) + '" target="_blank" rel="noopener">🎬 uitlegfilmpje</a>' + (w.days.some(d => (dayRO(dkey(d.d)).vid || {})[k]) ? ' (deze week gekeken ✔)' : '') + '</li>').join('') : '<li>Geen fouten deze week. Tijd voor moeilijkere vragen: die komen vanzelf.</li>') +
    '<li>In de Foutenstal staan nu <b>' + S.review.length + '</b> onderdelen klaar om opnieuw te oefenen.</li></ul>';
  h += '</div><div class="card"><h3>Per dag</h3><div class="tablewrap"><table><tr><th>Dag</th><th class="n">Minuten</th><th class="n">Vragen</th><th class="n">Goed</th><th class="n">Euro</th></tr>' + w.days.map((d, i) => '<tr><td>' + dn[i] + ' ' + d.d.getDate() + '</td><td class="n">' + Math.floor(d.sec / 60) + '</td><td class="n">' + d.q + '</td><td class="n">' + (d.q ? pct(d.r, d.q) + '%' : '–') + '</td><td class="n">' + (d.euro ? '€ 1' : d.q ? 'nog ' + Math.max(1, Math.ceil((GOAL - d.sec) / 60)) + ' min te kort' : '–') + '</td></tr>').join('') + '</table></div></div>';
  h += '<div class="card"><h3>Per vak</h3><div class="tablewrap"><table><tr><th>Vak</th><th class="n">Vragen</th><th class="n">Goed deze week</th><th class="n">Vorige week</th><th>Niveau nu</th></tr>' + Object.keys(SUBJ).map(k => { const a = w.subj[k], b = pw.subj[k], ids = Object.keys(SKILLS).filter(s => SKILLS[s].s === k), lv = ids.reduce((x, s) => x + skill(s).lvl, 0) / ids.length; return '<tr><td>' + SUBJ[k].ic + ' ' + SUBJ[k].n + '</td><td class="n">' + (a ? a.q : 0) + '</td><td class="n">' + (a ? pct(a.r, a.q) + '%' + trend(a, b) : '–') + '</td><td class="n">' + (b ? pct(b.r, b.q) + '%' : '–') + '</td><td>' + lv.toFixed(1).replace('.', ',') + ' / 3 · ' + lvlTxt(lv) + '</td></tr>'; }).join('') + '</table></div>' +
    '<p class="muted">Niveau 1 = basis, 2 = op koers voor groep 7, 3 = uitdagende opgaven. Dit is een indicatie op basis van haar antwoorden hier, geen officiële toetsuitslag.</p></div>';
  const rows = Object.keys(w.sk).filter(k => SKILLS[k]).sort((a, b) => pct(w.sk[a].r, w.sk[a].q) - pct(w.sk[b].r, w.sk[b].q));
  if (rows.length) h += '<div class="card"><h3>Per onderdeel (zwakste bovenaan)</h3><div class="tablewrap"><table><tr><th>Onderdeel</th><th class="n">Vragen</th><th class="n">Goed</th><th>Niveau</th></tr>' + rows.map(k => '<tr><td>' + SKILLS[k].n + ' <span class="muted">(' + SUBJ[SKILLS[k].s].n + ')</span></td><td class="n">' + w.sk[k].q + '</td><td class="n">' + pct(w.sk[k].r, w.sk[k].q) + '%</td><td>' + LVL[skill(k).lvl] + ' (' + skill(k).lvl + '/3)</td></tr>').join('') + '</table></div></div>';
  h += '<div class="card"><h3>💶 Spaarpot</h3><div class="stats"><div class="stat"><b>€ ' + earned() + '</b>totaal verdiend</div><div class="stat"><b>€ ' + paidOut() + '</b>uitbetaald</div><div class="stat"><b>€ ' + bal + '</b>nog te krijgen</div></div><p class="muted">Regel: elke dag met minstens 15 minuten actief oefenen levert € 1 op. De klok loopt alleen als ' + esc(S.name) + ' echt bezig is.</p>' +
    '<p class="noprint"><button class="btn" data-act="payout"' + (bal > 0 ? '' : ' disabled') + '>Markeer € ' + bal + ' als uitbetaald</button></p>' + (S.paid.length ? '<p class="muted">Uitbetaald: ' + S.paid.map(p => '€ ' + p.amt + ' op ' + p.d.split('-').reverse().join('-')).join(' · ') + '</p>' : '') + '</div>' +
    '<div class="card noprint"><h3>Beheer</h3><p class="row"><button class="btn two sm" data-act="print">🖨 Rapport afdrukken of als pdf bewaren</button><button class="btn ghost sm" data-act="export">⬇ Reservekopie maken</button><label class="btn ghost sm">⬆ Reservekopie terugzetten<input type="file" accept="application/json" data-import hidden></label></p>' +
    '<form data-form="newpin" class="row"><span>Nieuwe code voor ' + esc(S.name) + ':</span><input class="inp" style="width:130px" name="pin" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required autocomplete="off"><button class="btn ghost sm">Wijzig</button></form>' +
    '<p style="margin-top:14px"><button class="btn ghost sm" data-act="reset">Alles wissen en opnieuw beginnen</button></p><p class="muted">Alle voortgang staat alleen in deze browser op dit apparaat. Maak af en toe een reservekopie.</p></div>';
  return h;
};

/* ===== Tekenen en bedienen ===== */
function render() {
  if (!S.setup) view = 'setup'; else if (!authed && view !== 'parent') view = 'login';
  $('#app').innerHTML = V[view]();
  if (view === 'practice') { const f = cur.done ? ($('[data-retype]') || $('#nextb')) : $('.inp'); if (f) f.focus(); if (cur.done) { const fb = $('.fb'); if (fb && fb.scrollIntoView) fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }
  else window.scrollTo(0, 0);
  if (view === 'game') startGame(); else G = null;
}
const ACT = {
  go: el => { view = el.dataset.v; if (view !== 'parent') parentOK = false; render(); },
  start: el => start(el.dataset.m),
  stop: () => { save(); view = 'summary'; render(); },
  next: () => { if (sess.n - (sess.gameAt || 0) >= 10) { sess.gameAt = sess.n; sess.resume = true; sess.plays = 0; vidUntil = 0; view = 'game'; render(); } else nextQ(); },
  game: () => { sess.resume = false; sess.plays = 0; view = 'game'; render(); },
  gameagain: () => render(),
  gamedone: () => { if (sess.resume) { sess.resume = false; view = 'practice'; lastAct = Date.now(); nextQ(); } else { view = 'summary'; render(); } },
  ans: el => { const i = +el.dataset.i, o = cur.q.options[i]; answer(!!o.ok, o.why, i); },
  flash: () => { cur.phase = 'show'; render(); setTimeout(() => { if (cur && cur.phase === 'show') { cur.phase = 'type'; render(); } }, 3000); },
  vid: () => { const q = cur.q, v = VID[q.v]; cur.vidT0 = Date.now(); cur.vidNeed = Math.min(90, Math.round(v[0] / 2)); vidUntil = Date.now() + v[0] * 1000; $('#vidbox').innerHTML = '<div class="vidframe"><iframe src="https://www.youtube-nocookie.com/embed/' + q.v + '?autoplay=1&rel=0" title="Uitlegfilmpje: ' + v[1] + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe></div><p style="margin:10px 0 0"><button class="btn two sm" id="vidclaim" data-act="vidclaim" disabled>Kijk nog ' + cur.vidNeed + ' seconden…</button></p>'; },
  vidclaim: () => { const q = cur.q, d = day(); if (cur.vidDone) return; cur.vidDone = true; S.stars += 3; d.vid = d.vid || {}; d.vid[q.skill] = (d.vid[q.skill] || 0) + 1; save(); confetti(['⭐', '🎬', '🌟']); $('#vidclaim').outerHTML = '<b>Knap gedaan! +3 ⭐ Kijk het filmpje gerust af en neem daarna je revanche.</b>'; const b = $('#nextb'); if (b) { b.className = 'btn'; b.textContent = 'Ik snap het! Geef me een revanche 💪'; } },
  joke: () => { jokeI++; $('#joke').textContent = JOKES[jokeI % JOKES.length]; },
  pal: el => { S.theme.pal = el.dataset.k; S.theme.accent = ''; save(); applyTheme(); if (view === 'setup') { document.querySelectorAll('.sw').forEach(b => b.classList.toggle('on', b === el)); } else render(); },
  noaccent: () => { S.theme.accent = ''; save(); applyTheme(); render(); },
  pat: el => { S.theme.pattern = el.dataset.k; save(); applyTheme(); render(); },
  font: el => { S.theme.font = el.dataset.k; save(); applyTheme(); render(); },
  col: el => { artColor = el.dataset.c; render(); },
  artclear: () => { if (confirm('Wil je de hele tekening weer wit maken?')) { S.art = {}; save(); render(); } },
  logout: () => { authed = false; parentOK = false; view = 'login'; render(); },
  plock: () => { parentOK = false; view = authed ? 'home' : 'login'; render(); },
  wk: el => { repWeek = Math.min(0, repWeek + (+el.dataset.d)); render(); },
  payout: () => { const b = earned() - paidOut(); if (b > 0 && confirm('€ ' + b + ' als uitbetaald markeren?')) { S.paid.push({ d: dkey(), amt: b }); save(); render(); } },
  print: () => window.print(),
  export: () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(S)], { type: 'application/json' })); a.download = 'atelier-voortgang-' + dkey() + '.json'; a.click(); },
  reset: () => { if (confirm('Weet u het zeker? Alle voortgang, sterren en de spaarpot worden gewist.') && confirm('Echt alles wissen? Dit kan niet ongedaan worden gemaakt.')) { localStorage.removeItem(KEY); S = def(); authed = parentOK = false; applyTheme(); render(); } }
};
const FORM = {
  setup: fd => { const pin = fd.get('pin'); if (!/^\d{4}$/.test(pin)) return toast('Kies precies 4 cijfers.'); S.name = (fd.get('name') || '').trim() || 'Ster'; S.pin = pin; S.setup = true; authed = true; view = 'home'; save(); render(); confetti(['🎨', '🐎', '💗', '✨']); },
  login: fd => { if (fd.get('pin') === S.pin) { authed = true; view = 'home'; render(); } else toast('Dat is niet de goede code. Probeer het nog eens.'); },
  ppinset: fd => { const p = fd.get('pin'); if (!/^\d{4,8}$/.test(p)) return toast('Kies 4 tot 8 cijfers.'); S.ppin = p; parentOK = true; save(); render(); },
  ppin: fd => { if (fd.get('pin') === S.ppin) { parentOK = true; render(); } else toast('Onjuiste code.'); },
  newpin: fd => { const p = fd.get('pin'); if (/^\d{4}$/.test(p)) { S.pin = p; save(); toast('De code is gewijzigd.'); render(); } },
  num: fd => { const raw = fd.get('a'), v = parseNum(raw), q = cur.q; if (isNaN(v)) return toast('Typ een getal, bijvoorbeeld 12 of 3,5.'); const ok = U.near(v, q.answer); answer(ok, ok ? null : (q.diagnose && q.diagnose(v)) || null, String(raw).trim()); },
  txt: fd => { const raw = String(fd.get('a')).trim(), q = cur.q; if (!raw) return; const ok = raw.toLowerCase() === q.word.toLowerCase(); answer(ok, ok ? null : 'Jij schreef <b>' + esc(raw) + '</b>, maar het is <b>' + q.word + '</b>. ' + q.flashWhy, raw); }
};
document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (el) { if (el.disabled) return; const f = ACT[el.dataset.act]; if (f) f(el); return; }
  const r = e.target.closest('[data-r]'); if (r && view === 'atelier') { S.art[r.dataset.r] = artColor; r.setAttribute('fill', fillOf(r.dataset.r)); save(); }
});
document.addEventListener('submit', e => { e.preventDefault(); const f = FORM[e.target.dataset.form]; if (f) f(new FormData(e.target)); });
document.addEventListener('input', e => {
  const t = e.target;
  if (t.dataset.retype != null) { const b = $('#nextb'); if (b) b.disabled = t.value.trim().toLowerCase() !== t.dataset.retype.toLowerCase(); }
  if (t.dataset.bind === 'name') { S.name = t.value.trim() || 'Ster'; save(); }
  if (t.dataset.bind === 'mentor') { S.mentor = t.value.trim() || 'Luna'; save(); }
  if (t.dataset.bind === 'accent') { S.theme.accent = t.value; save(); applyTheme(); }
});
document.addEventListener('change', e => {
  if (e.target.dataset.import == null || !e.target.files[0]) return;
  const rd = new FileReader(); rd.onload = () => { try { const j = JSON.parse(rd.result); if (j.v !== 1 || !j.days) throw 0; if (confirm('De huidige voortgang vervangen door deze reservekopie?')) { S = Object.assign(def(), j); save(); applyTheme(); render(); toast('Reservekopie teruggezet.'); } } catch (x) { toast('Dit bestand is geen geldige reservekopie.'); } }; rd.readAsText(e.target.files[0]);
});
document.addEventListener('keydown', e => {
  if (view === 'game') { if (e.key === ' ' || e.key === 'ArrowUp') { e.preventDefault(); jump(); } return; }
  if (view !== 'practice' || !cur) return;
  if (!cur.done && cur.q.type === 'mc' && !e.metaKey && !e.ctrlKey) { const i = 'abcd'.indexOf(e.key.toLowerCase()), j = i >= 0 ? i : '1234'.indexOf(e.key); if (j >= 0 && j < cur.q.options.length) { e.preventDefault(); const o = cur.q.options[j]; answer(!!o.ok, o.why, j); } }
  else if (cur.done && e.key === 'Enter' && e.target.dataset.retype != null) { const b = $('#nextb'); if (b && !b.disabled) ACT.next(); }
});
window.addEventListener('beforeunload', save);
applyTheme(); render();
