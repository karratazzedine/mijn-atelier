'use strict';
/* Mijn Sportwereld – app-logica. Alles wordt bewaard in localStorage van deze browser. */
const KEY = 'atelier-v1', GOAL = 900; // 900 seconden = 15 minuten
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function def() { return { v: 1, setup: false, name: '', pin: '', ppin: '', mentor: 'Luna', theme: { pal: 'roze', accent: '', pattern: 'sport', font: 'rond' }, skills: {}, days: {}, review: [], recent: {}, stars: 0, paid: [], art: {}, qcount: 0, spent: 0, shop: null, coupons: [], acc: [], wear: '', bonus: { wd: 5, wa: 2, ka: 5 }, blog: [], bricks: 40, world: { name: '', cells: {} }, missions: [], mday: '', words: [], log: [], tests: [], lastExport: '', themeV: 2 }; }
function load() { try { const j = JSON.parse(localStorage.getItem(KEY)); if (j && j.v === 1) { const s = Object.assign(def(), j); if (!j.themeV) s.theme.pattern = 'sport'; return s; } } catch (e) { } return def(); }
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
const earned = () => Object.values(S.days).filter(d => d.euro).length + S.blog.reduce((a, b) => a + b.amt, 0);
const sbal = () => S.stars - (S.spent || 0);
const SHOP0 = [{ ic: '🌙', t: 'Een half uur later naar bed', cost: 50, val: '30 minuten' }, { ic: '🍦', t: 'Samen een ijsje halen', cost: 60, val: '€ 2,50' }, { ic: '🍝', t: 'Jij kiest het avondeten', cost: 70, val: '1 avond' }, { ic: '🎬', t: 'Filmavond: jij kiest de film', cost: 80, val: '1 avond' }, { ic: '🎨', t: 'Nieuw teken- of knutselspul', cost: 200, val: '€ 7,50' }, { ic: '⚽', t: 'Nieuwe bal of sportspullen', cost: 400, val: '€ 15' }];
const shop = () => S.shop || (S.shop = JSON.parse(JSON.stringify(SHOP0)));
const ACCS = [['strik', '🎀', 'Strik', 20], ['hoed', '🎩', 'Hoge hoed', 25], ['bril', '🕶️', 'Zonnebril', 30], ['krans', '🌸', 'Bloemenkrans', 35], ['kroon', '👑', 'Kroon', 40], ['hoorn', '🦄', 'Eenhoorn-hoorn', 60]];
function wearSVG() {
  const beret = '<path d="M26 50 Q60 32 94 50 L94 59 Q60 41 26 59Z" fill="var(--accent)"/><path d="M93 52 L107 46 L104 56Z M93 56 L105 64 L96 65Z" fill="var(--accent)"/>';
  return ({
    strik: beret + '<path d="M60 111 L43 102 L43 120Z M60 111 L77 102 L77 120Z" fill="var(--accent2)"/><circle cx="60" cy="111" r="4.5" fill="var(--accent)"/>',
    hoed: '<rect x="43" y="3" width="34" height="25" rx="3" fill="#3b2a3a"/><rect x="43" y="19" width="34" height="6" fill="var(--accent)"/><rect x="34" y="26" width="52" height="7" rx="3.5" fill="#3b2a3a"/>',
    bril: beret + '<rect x="36" y="56" width="21" height="15" rx="6" fill="#2a2030"/><rect x="63" y="56" width="21" height="15" rx="6" fill="#2a2030"/><path d="M57 62h6" stroke="#2a2030" stroke-width="3"/><path d="M40 60l5-2M67 60l5-2" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>',
    krans: [[38, 34, '#ff8fc7'], [48, 27, '#ffd23f'], [60, 24, '#b57bff'], [72, 27, '#7bd88f'], [82, 34, '#ff8fc7']].map(c => '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="7" fill="' + c[2] + '"/><circle cx="' + c[0] + '" cy="' + c[1] + '" r="2.5" fill="#fff"/>').join(''),
    kroon: '<path d="M39 32 L43 9 L52 22 L60 5 L68 22 L77 9 L81 32Z" fill="#ffd23f" stroke="#c9a227" stroke-width="2" stroke-linejoin="round"/><circle cx="60" cy="24" r="3" fill="var(--accent)"/><circle cx="48" cy="26" r="2.2" fill="var(--accent2)"/><circle cx="72" cy="26" r="2.2" fill="var(--accent2)"/>',
    hoorn: '<path d="M60 0 L52 32 L68 32Z" fill="#ffd23f" stroke="#c9a227" stroke-width="2" stroke-linejoin="round"/><path d="M55 22l9-4M56 14l6-3" stroke="#c9a227" stroke-width="2"/>'
  })[S.wear] || beret;
}
function checkBonuses() {
  const has = k => S.blog.some(b => b.key === k), add = (key, amt, why) => { S.blog.push({ key, amt, why, d: dkey() }); save(); confetti(['💶', '🎉', '🏆']); toast(why + ': € ' + amt + ' extra in je spaarpot! 🎉'); };
  [0, -1].forEach(o => { const w = weekStats(o), k = 'w' + dkey(w.m); if (S.bonus.wa > 0 && w.eur >= S.bonus.wd && !has(k)) add(k, S.bonus.wa, 'Weekbonus (' + S.bonus.wd + ' dagen geoefend)'); });
  Object.keys(SUBJ).forEach(s => { const ids = Object.keys(SKILLS).filter(k => SKILLS[k].s === s && k !== 'sp_eigen'); if (S.bonus.ka > 0 && ids.every(k => skill(k).lvl === 3 && skill(k).r >= 15) && ids.reduce((x, k) => x + skill(k).r, 0) >= 60 && !has('k-' + s)) add('k-' + s, S.bonus.ka, 'Kampioenbonus ' + SUBJ[s].n); });
}
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
const PATS = { sport: ['⚽', '🥊'], hartjes: ['💗', '✨'], sterren: ['⭐', '🌙'], paarden: ['🐴', '🌸'], kunst: ['🎨', '🖌️'], vlinders: ['🦋', '🌷'], geen: null };
function applyTheme() {
  const t = S.theme, p = PALS[t.pal] || PALS.roze, r = document.documentElement.style;
  ['bg', 'card', 'ink', 'accent', 'accent2', 'soft'].forEach(k => r.setProperty('--' + k, p[k]));
  if (t.accent) r.setProperty('--accent', t.accent);
  const e = PATS[t.pattern];
  r.setProperty('--pat', e ? 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><text x="14" y="44" font-size="24" opacity=".22">' + e[0] + '</text><text x="90" y="118" font-size="19" opacity=".22">' + e[1] + '</text></svg>') + '")' : 'none');
  document.body.className = t.font === 'sier' ? 'f-sier' : t.font === 'strak' ? 'f-strak' : '';
}
function mentorSVG() {
  return '<svg viewBox="0 0 120 120" aria-hidden="true"><path d="M30 46 L24 12 L54 30Z" fill="#ee8434"/><path d="M90 46 L96 12 L66 30Z" fill="#ee8434"/><path d="M33 38 L30 20 L46 30Z" fill="#ffd9b8"/><path d="M87 38 L90 20 L74 30Z" fill="#ffd9b8"/><ellipse cx="60" cy="64" rx="35" ry="32" fill="#f59a4a"/><path d="M26 68 Q40 98 60 99 Q80 98 94 68 Q78 80 60 80 Q42 80 26 68Z" fill="#fff6ea"/><ellipse cx="60" cy="86" rx="17" ry="12" fill="#fff6ea"/><circle cx="46" cy="64" r="6" fill="#3b2a3a"/><circle cx="74" cy="64" r="6" fill="#3b2a3a"/><circle cx="48" cy="62" r="2" fill="#fff"/><circle cx="76" cy="62" r="2" fill="#fff"/><circle cx="36" cy="76" r="5" fill="#ff9ec4" opacity=".55"/><circle cx="84" cy="76" r="5" fill="#ff9ec4" opacity=".55"/><ellipse cx="60" cy="80" rx="5" ry="3.6" fill="#3b2a3a"/><path d="M52 88 Q60 95 68 88" stroke="#8a5a44" stroke-width="2.5" fill="none" stroke-linecap="round"/>' + wearSVG() + '<g fill="var(--accent2)"><circle cx="19" cy="104" r="14"/><circle cx="31" cy="96" r="6"/><circle cx="101" cy="104" r="14"/><circle cx="89" cy="96" r="6"/></g><path d="M9 112h20M91 112h20" stroke="#fff" stroke-width="4" stroke-linecap="round"/></svg>';
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
  if (d.sec >= GOAL && !d.euro) { d.euro = true; save(); confetti(['💶', '🎉', '⭐', '⚽']); toast('15 minuten geoefend: je hebt € 1 verdiend! En er wacht een schatkist op je… 🎁'); checkBonuses(); }
  if (d.sec % 5 === 0) save();
  const el = $('#tring'); if (el) el.outerHTML = ring(true);
}, 1000);

/* ===== Vragen kiezen ===== */
function start(mode) { sess = { mode, n: 0, right: 0, last: [], lastSubj: null, revanche: null, ups: [], miss: {} }; view = 'practice'; lastAct = Date.now(); nextQ(); }
function chooseSkill() {
  const all = Object.keys(SKILLS).filter(k => k !== 'sp_eigen' || S.words.length >= 3); let subj = sess.mode;
  if (sess.mode === 'mix') subj = wpick(Object.keys(SUBJ).filter(k => k !== sess.lastSubj), k => SUBJ[k].w);
  let ids = all.filter(k => SKILLS[k].s === subj && !sess.last.includes(k)); if (!ids.length) ids = all.filter(k => SKILLS[k].s === subj);
  return wpick(ids, k => { const s = skill(k); return 1 + (s.q ? 2 * (1 - s.r / s.q) : 1) + (s.q < 3 ? 1.5 : 0); });
}
function pers(q) { const n = esc(S.name || 'Ster'), f = s => typeof s === 'string' ? s.split('{naam}').join(n) : s; ['prompt', 'context', 'steps', 'correctText'].forEach(k => { q[k] = f(q[k]); }); (q.options || []).forEach(o => { o.t = f(o.t); o.why = f(o.why); }); q.v = q.v || SKILLS[q.skill].v || null; return q; }
function nextQ() {
  vidUntil = 0;
  if (sess.mode === 'toets') return toetsNext();
  let id, item, rev = null, revanche = false;
  const inMode = s => sess.mode === 'mix' || sess.mode === 'fouten' || SKILLS[s].s === sess.mode;
  if (sess.revanche) { id = sess.revanche; sess.revanche = null; revanche = true; }
  else {
    const pool = S.review.filter(r => SKILLS[r.skill] && inMode(r.skill) && (r.skill !== 'sp_eigen' || S.words.length)), due = pool.filter(r => r.due <= S.qcount);
    if (sess.mode === 'fouten') { if (!pool.length) { sess.cleared = true; view = 'summary'; return render(); } rev = due[0] || pool[0]; }
    else if (due.length && Math.random() < 0.35) rev = due[0];
    if (rev) { id = rev.skill; item = rev.item; } else id = chooseSkill();
  }
  const sk = skill(id), q = pers(GEN[id](sk.lvl, { id: item, recent: S.recent[id] || [] }));
  if (q.item != null) { const r = S.recent[id] || (S.recent[id] = []); r.push(q.item); if (r.length > 80) r.shift(); }
  q.rev = rev; q.revanche = revanche;
  cur = { q, done: false, t0: Date.now(), phase: q.type === 'flash' ? 'ready' : 'ask' };
  sess.last.push(id); if (sess.last.length > 3) sess.last.shift(); sess.lastSubj = SKILLS[id].s;
  render();
}
function answer(ok, why, given) {
  if (cur.done) return; if (sess.mode === 'toets') return toetsAnswer(ok); const q = cur.q;
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
  onAnswer(q, ok); save(); if (ok) checkBonuses(); render();
}
function parseNum(s) { s = String(s).trim().replace(/\s|€|%/g, ''); if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) s = s.replace(/\./g, ''); s = s.replace(',', '.'); return /^-?\d+(\.\d+)?$/.test(s) ? parseFloat(s) : NaN; }
const LVL = ['', 'Rookie', 'Prof', 'Kampioen'];
const lvIcons = l => '<span class="lv" title="Niveau ' + l + ': ' + LVL[l] + '">' + [1, 2, 3].map(i => '<span class="' + (i <= l ? '' : 'off') + '">🏅</span>').join('') + '</span>';
const vidUrl = id => SKILLS[id].v ? 'https://www.youtube.com/watch?v=' + SKILLS[id].v : 'https://www.youtube.com/results?search_query=' + encodeURIComponent('Wijzer over de Basisschool ' + SKILLS[id].vid);

/* ===== Schermen ===== */
const V = {};
const head = (title, extra) => '<div class="top noprint"><button class="btn ghost sm" data-act="go" data-v="home">← Terug</button><h2 style="margin:0">' + title + '</h2><span>' + (extra || '') + '</span></div>';
const palButtons = () => Object.keys(PALS).map(k => '<button class="sw' + (S.theme.pal === k ? ' on' : '') + '" data-act="pal" data-k="' + k + '" title="' + PALS[k].n + '" style="background:' + PALS[k].accent + '"><i style="background:' + PALS[k].accent2 + '"></i></button>').join('');

V.setup = () => '<div class="card" style="margin-top:4vh">' + mentor('Hoi! Ik ben <b>Luna</b>, een vos met bokshandschoenen én jouw nieuwe coach. Ik train je elke dag een stukje slimmer. En met alles wat je leert, bouw jij je eigen sportwereld. ⚽🥊') +
  '<form data-form="setup" style="margin-top:18px"><label class="f">Hoe heet jij?</label><input class="inp wide" name="name" value="' + esc(S.name) + '" placeholder="je voornaam" required maxlength="20">' +
  '<label class="f">Kies een geheime code van 4 cijfers</label><input class="inp" name="pin" type="password" inputmode="numeric" pattern="[0-9]{4}" maxlength="4" required placeholder="••••" autocomplete="off">' +
  '<label class="f">Kies je lievelingskleuren (je kunt dit later altijd veranderen)</label><div class="row">' + palButtons() + '</div>' +
  '<p style="margin-top:22px"><button class="btn big">Ik ben er klaar voor! ⚽</button></p></form></div>';

V.login = () => '<div class="card pinbox">' + mentor('Hé ' + esc(S.name) + '! Wat is je geheime code?', true) +
  '<form data-form="login" style="margin-top:18px"><input class="inp" name="pin" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off" autofocus><p><button class="btn big">Naar binnen</button></p></form>' +
  '<p class="muted">Code vergeten? Vraag papa of mama: zij kunnen hem bij "Ouders" opnieuw instellen.</p><button class="btn ghost sm" data-act="go" data-v="parent">👨‍👩‍👧 Ouders</button></div>';

V.home = () => {
  checkBonuses(); ensureMissions();
  const d = dayRO(dkey()), t = tot(d), st = streak(), hr = new Date().getHours(), bal = earned() - paidOut(), left = Math.max(0, Math.ceil((GOAL - d.sec) / 60));
  const hi = hr < 12 ? 'Goedemorgen' : hr < 18 ? 'Hoi' : 'Goedenavond';
  const msg = d.euro ? 'Je euro voor vandaag is binnen! Wil je nog even door, of ga je verder bouwen aan je sportwereld?' : t.q ? 'Lekker bezig! Nog ' + left + ' minuten en je euro van vandaag is binnen.' : st > 1 ? 'Al ' + st + ' dagen op rij geoefend. Zullen we er ' + (st + 1) + ' van maken?' : 'Fijn dat je er bent. Vandaag weer een kwartiertje slimmer worden?';
  const lastW = weekStats(-1), isMon = new Date().getDay() === 1;
  return '<div class="top"><h1>' + esc(S.name) + '\'s Sportwereld</h1><div class="row"><span class="pill" title="Sterren om uit te geven">⭐ ' + sbal() + '</span><span class="pill" title="Bouwstenen voor je wereld">🧱 ' + S.bricks + '</span><span class="pill" title="Dagen op rij">🔥 ' + st + '</span><span class="pill" title="Spaarpot">💶 € ' + bal + '</span><button class="btn ghost sm" data-act="logout">Uitloggen</button></div></div>' +
    '<div class="card hero"><div>' + mentor(hi + ' ' + esc(S.name) + '! ' + msg) + '<p style="margin:16px 0 0"><button class="btn big" data-act="start" data-m="mix">▶ Start de training van vandaag</button>' + (d.euro && !d.chest ? ' <button class="btn two big" data-act="chest">🎁 Open je schatkist</button>' : '') + '</p></div>' + ring(false) + '</div>' +
    '<div class="card">' + mentor('<span id="joke">' + JOKES[jokeI % JOKES.length] + '</span> <button class="btn ghost sm" data-act="joke" style="margin-left:6px">Nog een grap</button>', true) + '</div>' +
    '<h2>Zelf kiezen wat je oefent</h2><div class="grid" style="margin-bottom:22px">' + Object.keys(SUBJ).map(k => { const ids = Object.keys(SKILLS).filter(s => SKILLS[s].s === k), lv = ids.reduce((a, s) => a + skill(s).lvl, 0) / ids.length; return '<button class="tile" data-act="start" data-m="' + k + '"><span class="ic">' + SUBJ[k].ic + '</span>' + SUBJ[k].n + '<small>niveau ' + lv.toFixed(1).replace('.', ',') + ' van 3</small></button>'; }).join('') + '</div>' +
    '<h2>Mijn plekjes</h2><div class="grid">' +
    '<button class="tile" data-act="go" data-v="world"><span class="ic">🏟</span>Mijn sportwereld<small>wereldniveau ' + wlevel() + ' · 🧱 ' + S.bricks + '</small></button>' +
    '<button class="tile" data-act="go" data-v="missions"><span class="ic">🎯</span>Opdrachten<small>' + (S.missions.filter(m => !m.claimed && m.prog >= m.goal).length ? S.missions.filter(m => !m.claimed && m.prog >= m.goal).length + ' beloning(en) klaar!' : S.missions.filter(m => !m.claimed).length + ' opdrachten open') + '</small></button>' +
    '<button class="tile" data-act="start" data-m="fouten"><span class="ic">🥊</span>Herkansing<small>' + (S.review.length ? S.review.length + ' om terug te pakken' : 'alles teruggepakt!') + '</small></button>' +
    '<button class="tile" data-act="go" data-v="shop"><span class="ic">🎁</span>Beloningswinkel<small>' + (S.coupons.filter(c => !c.used).length ? S.coupons.filter(c => !c.used).length + ' bon(nen) om in te leveren' : 'ruil je sterren in') + '</small></button>' +
    '<button class="tile" data-act="go" data-v="progress"><span class="ic">📈</span>Mijn voortgang<small>zie hoe je groeit</small></button>' +
    '<button class="tile" data-act="go" data-v="style"><span class="ic">💅</span>Mijn stijl<small>kleuren en plaatjes</small></button>' +
    '<button class="tile" data-act="go" data-v="parent"><span class="ic">👨‍👩‍👧</span>Ouders<small>' + (isMon && lastW.q ? 'weekrapport staat klaar!' : 'weekrapport') + '</small></button></div>';
};

V.practice = () => {
  const q = cur.q, sk = SKILLS[q.skill], su = SUBJ[sk.s];
  let h = '<div class="top"><button class="btn ghost sm" data-act="stop">⏹ Stoppen</button><div class="row">' + ring(true) + '<span class="pill">⭐ ' + sbal() + '</span><span class="pill">' + (sess.mode === 'toets' ? '📝 vraag ' + sess.ti + ' van ' + sess.tn : '✅ ' + sess.right + ' van ' + sess.n) + '</span></div></div><div class="card">';
  h += '<div><span class="chip">' + su.ic + ' ' + su.n + '</span><span class="chip">' + sk.n + '</span>' + (q.rev ? '<span class="chip rev">🥊 herkansing</span>' : '') + (q.revanche ? '<span class="chip rev">💪 revanche</span>' : '') + '</div>';
  if (q.context) h += '<div class="context">' + q.context + '</div>';
  h += '<div class="prompt">' + q.prompt + '</div>';
  if (q.type === 'mc') h += '<div class="opts' + (q.long ? ' long' : '') + '">' + q.options.map((o, i) => '<button class="opt' + (cur.done && o.ok ? ' good' : '') + (cur.done && cur.given === i && !o.ok ? ' wrong' : '') + '" data-act="ans" data-i="' + i + '"' + (cur.done ? ' disabled' : '') + '><span class="l">' + 'ABCD'[i] + '</span><span>' + o.t + '</span></button>').join('') + '</div>';
  else if (q.type === 'num') h += '<form data-form="num" class="numrow"><span>' + (q.pre || '') + '</span><input class="inp" name="a" inputmode="decimal" autocomplete="off" placeholder="?" ' + (cur.done ? 'disabled value="' + esc(cur.given) + '"' : '') + '><span>' + (q.unit || '') + '</span>' + (cur.done ? '' : '<button class="btn">Controleer</button>') + '</form>';
  else if (cur.phase === 'ready') h += '<button class="btn two big" data-act="flash">👀 Laat het woord zien</button>';
  else if (cur.phase === 'show') h += '<div class="flash">' + esc(q.word) + '</div><div class="flashbar"></div>';
  else h += '<form data-form="txt" class="numrow"><input class="inp wide" name="a" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="typ het woord" ' + (cur.done ? 'disabled value="' + esc(cur.given) + '"' : '') + '>' + (cur.done ? '' : '<button class="btn">Controleer</button>') + '</form>';
  if (cur.done) h += cur.ok ? '<div class="fb good">' + mentor(cur.praise + (cur.up ? ' <b>En… niveau omhoog! Je bent nu ' + LVL[skill(q.skill).lvl] + ' in ' + sk.n + '!</b> 🌟' : '') + (q.rev ? ' Herkansing gewonnen! 🥊' : ''), true) + '<p style="margin:12px 0 0"><button class="btn" data-act="next" id="nextb">Volgende →</button></p></div>'
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
  const msg = sess.cleared && !sess.n ? 'Je hebt alle herkansingen al gewonnen! Er valt niks terug te pakken. Ga lekker de gewone training doen.' : !sess.n ? 'Je hebt nog geen vraag gemaakt. Kom je straks terug?' : p >= 85 ? 'Wauw, ' + p + '% goed! Jij ging als een raket. Of nou ja, als een spits in topvorm.' : p >= 60 ? p + '% goed. Mooi gewerkt! En van de fouten heb je het meest geleerd.' : 'Dit waren pittige vragen en je bent er tóch voor gaan zitten. Daar word je echt beter van. Morgen pakken we ze terug!';
  return '<div class="card center" style="margin-top:4vh">' + mentor(msg) + '<div class="stats" style="margin:20px 0"><div class="stat"><b>' + sess.n + '</b>vragen</div><div class="stat"><b>' + sess.right + '</b>goed</div><div class="stat"><b>' + m + ' min</b>vandaag</div><div class="stat"><b>' + (d.euro ? '€ 1 ✔' : 'nog ' + Math.max(1, Math.ceil((GOAL - d.sec) / 60)) + ' min') + '</b>' + (d.euro ? 'verdiend' : 'tot je euro') + '</div></div>' +
    (sess.ups.length ? '<p>🌟 <b>Niveau omhoog</b> bij: ' + sess.ups.map(s => SKILLS[s].n).join(', ') + '</p>' : '') +
    (miss.length ? '<p>🧹 <b>Nog even oefenen:</b> ' + miss.map(s => SKILLS[s].n).join(', ') + '. Die komen vanzelf terug.</p>' : '') +
    '<p class="row" style="justify-content:center"><button class="btn" data-act="go" data-v="home">Naar huis</button>' + (d.euro && !d.chest ? '<button class="btn two" data-act="chest">🎁 Open je schatkist</button>' : '') + (d.euro ? '' : '<button class="btn two" data-act="start" data-m="mix">Nog even door</button>') + '<button class="btn ghost" data-act="go" data-v="world">🏟 Bouwen</button></p>' + (sess.n >= 5 ? '<p><button class="btn two big" data-act="game">⚽ Speel de dribbelbaan</button></p>' : '<p class="muted">Maak minstens 5 vragen, dan mag je de dribbelbaan spelen.</p>') + '</div>';
};

function badges() {
  const lv3 = Object.values(S.skills).filter(s => s.lvl === 3).length, days = Object.values(S.days).filter(d => tot(d).q).length, subjDone = Object.keys(SUBJ).every(k => Object.keys(SKILLS).some(s => SKILLS[s].s === k && skill(s).q));
  return [['🐣', 'Eerste stapjes', days >= 1], ['🔥', '3 dagen op rij', streak() >= 3], ['🏆', 'Week vol', streak() >= 7], ['⭐', '50 sterren', S.stars >= 50], ['🌟', '250 sterren', S.stars >= 250], ['🧭', 'Alle vakken geproefd', subjDone], ['🥇', 'Eerste Kampioen-niveau', lv3 >= 1], ['👑', '10× Kampioen-niveau', lv3 >= 10], ['💶', 'Eerste euro', earned() >= 1], ['💰', '10 euro verdiend', earned() >= 10], ['🧹', 'Alle herkansingen gewonnen', S.qcount > 10 && !S.review.length], ['🦄', '20 oefendagen', days >= 20]];
}
V.progress = () => {
  let ch = ''; const d = new Date(); d.setHours(12); d.setDate(d.getDate() - 13); let mx = 20;
  const ds = []; for (let i = 0; i < 14; i++) { const r = dayRO(dkey(d)); ds.push([d.getDate(), r.sec / 60]); mx = Math.max(mx, r.sec / 60); d.setDate(d.getDate() + 1); }
  ch = '<div class="chart"><div class="goal" style="bottom:' + (15 / mx * 100 * 0.82 + 12) + '%">15 min = € 1</div>' + ds.map(x => '<div class="col"><i class="' + (x[1] >= 15 ? 'hit' : '') + '" style="height:' + x[1] / mx * 82 + '%"></i>' + x[0] + '</div>').join('') + '</div>';
  const all = Object.values(S.skills).reduce((a, s) => ({ q: a.q + s.q, r: a.r + s.r }), { q: 0, r: 0 });
  return head('📈 Mijn voortgang') + '<div class="card"><div class="stats"><div class="stat"><b>' + all.q + '</b>vragen gemaakt</div><div class="stat"><b>' + pct(all.r, all.q) + '%</b>goed</div><div class="stat"><b>' + streak() + '</b>dagen op rij</div><div class="stat"><b>€ ' + earned() + '</b>verdiend</div></div><h3 style="margin-top:18px">Minuten per dag (laatste 2 weken)</h3>' + ch + '</div>' +
    '<div class="card"><h3>Mijn medailles</h3><div class="badges">' + badges().map(b => '<div class="badge' + (b[2] ? '' : ' off') + '"><span>' + b[0] + '</span>' + b[1] + '</div>').join('') + '</div></div>' +
    Object.keys(SUBJ).map(k => '<div class="card"><h3>' + SUBJ[k].ic + ' ' + SUBJ[k].n + '</h3>' + Object.keys(SKILLS).filter(s => SKILLS[s].s === k).map(s => { const x = skill(s); return '<div class="skill"><div><b>' + SKILLS[s].n + '</b> <a href="' + vidUrl(s) + '" target="_blank" rel="noopener" title="Uitlegfilmpje">🎬</a><div class="muted">' + (x.q ? x.q + ' vragen, ' + pct(x.r, x.q) + '% goed' : 'nog niet geoefend') + '</div></div><div class="bar"><i style="width:' + pct(x.r, x.q) + '%"></i></div>' + lvIcons(x.lvl) + '</div>'; }).join('') + '</div>').join('') +
    '<p class="muted center">🏅 = Rookie · 🏅🏅 = Prof · 🏅🏅🏅 = Kampioen. Vier keer achter elkaar goed? Dan ga je een niveau omhoog.</p>';
};

V.style = () => head('💅 Mijn stijl') + '<div class="card">' + mentor('Maak het hier helemaal van jou. Alles wat je kiest, zie je meteen.', true) +
  '<label class="f">Kleurenpalet</label><div class="row">' + palButtons() + '</div>' +
  '<label class="f">Of kies helemaal zelf je hoofdkleur</label><div class="row"><input type="color" data-bind="accent" value="' + (S.theme.accent || PALS[S.theme.pal].accent) + '" style="width:64px;height:48px;border:0;background:none;cursor:pointer"><button class="btn ghost sm" data-act="noaccent">Terug naar palet</button></div>' +
  '<label class="f">Plaatjes op de achtergrond</label><div class="row">' + Object.keys(PATS).map(k => '<button class="pick' + (S.theme.pattern === k ? ' on' : '') + '" data-act="pat" data-k="' + k + '">' + (PATS[k] ? PATS[k].join(' ') + ' ' : '') + k + '</button>').join('') + '</div>' +
  '<label class="f">Letters</label><div class="row">' + [['rond', 'Rond en vrolijk'], ['sier', 'Sierlijk'], ['strak', 'Strak']].map(f => '<button class="pick' + (S.theme.font === f[0] ? ' on' : '') + '" data-act="font" data-k="' + f[0] + '">' + f[1] + '</button>').join('') + '</div>' +
  '<label class="f">Mijn naam</label><input class="inp wide" data-bind="name" value="' + esc(S.name) + '" maxlength="20">' +
  '<label class="f">Naam van mijn coach</label><input class="inp wide" data-bind="mentor" value="' + esc(S.mentor) + '" maxlength="16"></div>';

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



/* ===== Beloningswinkel ===== */
V.shop = () => {
  const w = weekStats(0), open = S.coupons.filter(c => !c.used), b = sbal();
  return head('🎁 Beloningswinkel', '<span class="pill">⭐ ' + b + '</span>') +
    '<div class="card">' + mentor('Met je sterren kun je hier echte beloningen kopen. Een bon lever je in bij papa of mama. Sparen voor iets groots mag ook!', true) + '</div>' +
    (open.length ? '<div class="card"><h3>🎟 Mijn bonnen</h3><p class="muted">Laat deze zien aan papa of mama om ze in te leveren.</p><div class="grid">' + open.map(c => '<div class="coupon"><b>' + esc(c.t) + '</b>' + (c.val ? '<span>waarde: ' + esc(c.val) + '</span>' : '') + '<small>gekocht op ' + c.d.split('-').reverse().join('-') + '</small></div>').join('') + '</div></div>' : '') +
    '<div class="card"><h3>🛍 Waardebonnen</h3><div class="grid">' + shop().map((it, i) => '<div class="shopit"><span class="ic">' + esc(it.ic) + '</span><b>' + esc(it.t) + '</b>' + (it.val ? '<span class="muted">waarde: ' + esc(it.val) + '</span>' : '') + '<button class="btn sm" data-act="buy" data-i="' + i + '"' + (b >= it.cost ? '' : ' disabled') + '>' + (b >= it.cost ? 'Koop voor ⭐ ' + it.cost : 'Nog ' + (it.cost - b) + ' ⭐ sparen') + '</button><div class="bar"><i style="width:' + Math.min(100, Math.round(100 * b / it.cost)) + '%"></i></div></div>').join('') + '</div></div>' +
    '<div class="card"><h3>👗 De kleedkamer van ' + esc(S.mentor) + '</h3><div class="grid">' + ACCS.map(x => { const own = S.acc.includes(x[0]), on = S.wear === x[0]; return '<div class="shopit"><span class="ic">' + x[1] + '</span><b>' + x[2] + '</b><button class="btn sm' + (own ? ' two' : '') + '" data-act="acc" data-k="' + x[0] + '"' + (own || b >= x[3] ? '' : ' disabled') + '>' + (on ? 'Zet af' : own ? 'Zet op' : b >= x[3] ? 'Koop voor ⭐ ' + x[3] : 'Nog ' + (x[3] - b) + ' ⭐') + '</button></div>'; }).join('') + '</div></div>' +
    '<div class="card"><h3>💶 Extra euro\'s verdienen</h3><div class="skill"><div><b>Dagelijkse euro</b><div class="muted">15 minuten oefenen op een dag</div></div><b>€ 1</b><span>+ 🎁 schatkist</span></div>' +
    (S.bonus.wa > 0 ? '<div class="skill"><div><b>Weekbonus</b><div class="muted">' + S.bonus.wd + ' dagen in één week je euro halen. Deze week: ' + Math.min(w.eur, S.bonus.wd) + ' van ' + S.bonus.wd + '</div></div><b>€ ' + S.bonus.wa + '</b><div class="bar"><i style="width:' + Math.min(100, 100 * w.eur / S.bonus.wd) + '%"></i></div></div>' : '') +
    (S.bonus.ka > 0 ? '<div class="skill"><div><b>Kampioenbonus</b><div class="muted">Alle onderdelen van een vak op Kampioen-niveau (🏅🏅🏅), met minstens 60 goede antwoorden in dat vak</div></div><b>€ ' + S.bonus.ka + '</b><span>per vak</span></div>' : '') + '</div>';
};

/* ===== Beloningsspel: de hindernisbaan ===== */
let G = null;
V.game = () => '<div class="card center" style="margin-top:2vh">' + mentor((sess && sess.resume ? 'Tien vragen gedaan, tijd voor een pauze! ' : 'Goed gewerkt, je hebt een spelletje verdiend! ') + 'Laat de bal over de pionnen springen en pak de sterren. <b>Tik op het spel</b> of druk op de <b>spatiebalk</b> om te springen.', true) +
  '<canvas id="gc" width="800" height="320" aria-label="Dribbelbaan-spel"></canvas><div class="row" style="justify-content:center;margin-top:12px"><span class="pill">⭐ <span id="gsc">0</span></span><span class="pill">💗 <span id="glv">3</span></span><span class="pill">⏱ <span id="gtm">45</span></span><span class="pill">🏆 record ' + (S.hi || 0) + '</span></div>' +
  '<div id="gend" class="row" style="justify-content:center;margin-top:14px"><button class="btn ghost sm" data-act="gamedone">Sla het spel over</button></div><p class="muted">Het spel is een pauze: de oefenklok staat even stil.</p></div>';
function jump() { if (G && !G.over && G.y === 0) G.vy = -13.5; }
function startGame() {
  const cv = $('#gc'); if (!cv) return; const cx = cv.getContext('2d'), cs = getComputedStyle(document.documentElement), col = k => cs.getPropertyValue('--' + k).trim();
  const C = { bg: col('bg'), soft: col('soft'), acc: col('accent'), acc2: col('accent2'), ink: col('ink'), card: col('card') };
  const g = G = { y: 0, vy: 0, obs: [], stars: [], score: 0, lives: 3, dist: 0, nextObs: 500, nextStar: 300, inv: 0, over: false, t0: performance.now(), last: performance.now(), left: 45 };
  cv.onpointerdown = e => { e.preventDefault(); jump(); };
  const GY = 262, PX = 120;
  function pony(leg) {
    const by = GY - 20 + g.y; cx.save(); if (g.inv > 0 && Math.floor(g.inv / 5) % 2) cx.globalAlpha = .35;
    cx.fillStyle = 'rgba(0,0,0,.15)'; cx.beginPath(); cx.ellipse(PX, GY + 5, Math.max(6, 20 + g.y / 8), 5, 0, 0, 7); cx.fill();
    cx.translate(PX, by); cx.rotate(leg / 2);
    cx.fillStyle = '#fff'; cx.strokeStyle = '#2a2030'; cx.lineWidth = 3; cx.beginPath(); cx.arc(0, 0, 20, 0, 7); cx.fill(); cx.stroke();
    cx.fillStyle = '#2a2030'; const pent = (x, y, r) => { cx.beginPath(); for (let i = 0; i < 5; i++) { const an = -Math.PI / 2 + i * 2 * Math.PI / 5; cx.lineTo(x + r * Math.cos(an), y + r * Math.sin(an)); } cx.closePath(); cx.fill(); };
    pent(0, 0, 7); for (let i = 0; i < 5; i++) { const an = -Math.PI / 2 + i * 2 * Math.PI / 5; pent(17 * Math.cos(an), 17 * Math.sin(an), 4.5); }
    cx.restore();
  }
  function frame(now) {
    if (G !== g || view !== 'game') return;
    const k = Math.min(3, (now - g.last) / 16.67); g.last = now;
    if (!g.over) {
      const sp = (5 + (now - g.t0) / 9000) * k; g.dist += sp; g.left = Math.max(0, 45 - (now - g.t0) / 1000);
      g.vy += .65 * k; g.y = Math.min(0, g.y + g.vy * k); if (g.y === 0) g.vy = 0; if (g.inv > 0) g.inv -= k;
      if (g.dist > g.nextObs) { g.obs.push({ x: 840, h: 30 + Math.random() * 26, hit: false, done: false }); g.nextObs = g.dist + 330 + Math.random() * 300; }
      if (g.dist > g.nextStar) { g.stars.push({ x: 840, y: GY - 70 - Math.random() * 90 }); g.nextStar = g.dist + 200 + Math.random() * 260; }
      g.obs.forEach(o => { o.x -= sp; if (!o.hit && !o.done && o.x < PX + 16 && o.x + 22 > PX - 16 && GY + g.y > GY - o.h + 8) { o.hit = true; if (g.inv <= 0) { g.lives--; g.inv = 70; } } if (!o.hit && !o.done && o.x + 22 < PX - 16) { o.done = true; g.score++; } });
      g.stars.forEach(s => { s.x -= sp; if (!s.got && Math.abs(s.x - PX) < 40 && Math.abs(s.y - 10 - (GY - 20 + g.y)) < 42) { s.got = true; g.score += 2; } });
      g.obs = g.obs.filter(o => o.x > -40); g.stars = g.stars.filter(s => s.x > -40 && !s.got);
      if (g.lives <= 0 || g.left <= 0) endGame(g);
      $('#gsc').textContent = g.score; $('#glv').textContent = Math.max(0, g.lives); $('#gtm').textContent = Math.ceil(g.left);
    }
    cx.fillStyle = C.bg; cx.fillRect(0, 0, 800, 320);
    cx.fillStyle = C.soft; for (let i = 0; i < 4; i++) { const hx = ((i * 290 - g.dist * .25) % 1160 + 1160) % 1160 - 180; cx.beginPath(); cx.ellipse(hx, GY + 6, 170, 80 + i % 2 * 30, 0, Math.PI, 0); cx.fill(); }
    cx.fillStyle = C.card; for (let i = 0; i < 3; i++) { const wx = ((i * 330 - g.dist * .12) % 990 + 990) % 990 - 90; cx.beginPath(); cx.ellipse(wx, 50 + i * 22, 44, 15, 0, 0, 7); cx.ellipse(wx + 30, 42 + i * 22, 28, 14, 0, 0, 7); cx.fill(); }
    cx.fillStyle = C.acc2; cx.globalAlpha = .28; cx.fillRect(0, GY + 4, 800, 60); cx.globalAlpha = 1;
    cx.fillStyle = C.ink; for (let i = 0; i < 14; i++) { const gx = ((i * 64 - g.dist) % 896 + 896) % 896 - 40; cx.fillRect(gx, GY + 18 + i % 3 * 10, 16, 3); }
    g.obs.forEach(o => { cx.globalAlpha = o.hit ? .35 : 1; cx.fillStyle = C.acc; cx.beginPath(); cx.moveTo(o.x + 11, GY - o.h); cx.lineTo(o.x + 25, GY + 4); cx.lineTo(o.x - 3, GY + 4); cx.closePath(); cx.fill(); cx.fillStyle = '#fff'; cx.fillRect(o.x + 5, GY - o.h * .5, 12, 5); cx.fillStyle = C.ink; cx.fillRect(o.x - 7, GY + 2, 36, 5); cx.globalAlpha = 1; });
    cx.font = '30px serif'; cx.textAlign = 'center'; g.stars.forEach(s => cx.fillText('⭐', s.x, s.y + Math.sin(now / 200 + s.x) * 4));
    pony(g.dist / 14);
    if (g.over) { cx.fillStyle = C.ink; cx.globalAlpha = .55; cx.fillRect(0, 0, 800, 320); cx.globalAlpha = 1; cx.fillStyle = '#fff'; cx.font = '800 44px ' + (cs.getPropertyValue('--hf') || 'sans-serif'); cx.fillText(g.lives > 0 ? 'Finish! ' + g.score + ' punten' : 'Oeps! ' + g.score + ' punten', 400, 150); cx.font = '700 24px sans-serif'; cx.fillText(g.rec ? 'Nieuw record! 🏆' : 'Record: ' + (S.hi || 0), 400, 196); return; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
function endGame(g) {
  g.over = true; if (g.score > (S.hi || 0)) { S.hi = g.score; g.rec = true; save(); confetti(['🏆', '⭐', '⚽']); }
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
    '<li>Bij de herkansingen staan nu <b>' + S.review.length + '</b> onderdelen klaar om opnieuw te oefenen.</li></ul>';
  h += '</div><div class="card"><h3>Per dag</h3><div class="tablewrap"><table><tr><th>Dag</th><th class="n">Minuten</th><th class="n">Vragen</th><th class="n">Goed</th><th class="n">Euro</th></tr>' + w.days.map((d, i) => '<tr><td>' + dn[i] + ' ' + d.d.getDate() + '</td><td class="n">' + Math.floor(d.sec / 60) + '</td><td class="n">' + d.q + '</td><td class="n">' + (d.q ? pct(d.r, d.q) + '%' : '–') + '</td><td class="n">' + (d.euro ? '€ 1' : d.q ? 'nog ' + Math.max(1, Math.ceil((GOAL - d.sec) / 60)) + ' min te kort' : '–') + '</td></tr>').join('') + '</table></div></div>';
  h += '<div class="card"><h3>Per vak</h3><div class="tablewrap"><table><tr><th>Vak</th><th class="n">Vragen</th><th class="n">Goed deze week</th><th class="n">Vorige week</th><th>Niveau nu</th></tr>' + Object.keys(SUBJ).map(k => { const a = w.subj[k], b = pw.subj[k], ids = Object.keys(SKILLS).filter(s => SKILLS[s].s === k), lv = ids.reduce((x, s) => x + skill(s).lvl, 0) / ids.length; return '<tr><td>' + SUBJ[k].ic + ' ' + SUBJ[k].n + '</td><td class="n">' + (a ? a.q : 0) + '</td><td class="n">' + (a ? pct(a.r, a.q) + '%' + trend(a, b) : '–') + '</td><td class="n">' + (b ? pct(b.r, b.q) + '%' : '–') + '</td><td>' + lv.toFixed(1).replace('.', ',') + ' / 3 · ' + lvlTxt(lv) + '</td></tr>'; }).join('') + '</table></div>' +
    '<p class="muted">Niveau 1 = basis, 2 = op koers voor groep 7, 3 = uitdagende opgaven. Dit is een indicatie op basis van haar antwoorden hier, geen officiële toetsuitslag.</p></div>';
  const rows = Object.keys(w.sk).filter(k => SKILLS[k]).sort((a, b) => pct(w.sk[a].r, w.sk[a].q) - pct(w.sk[b].r, w.sk[b].q));
  if (rows.length) h += '<div class="card"><h3>Per onderdeel (zwakste bovenaan)</h3><div class="tablewrap"><table><tr><th>Onderdeel</th><th class="n">Vragen</th><th class="n">Goed</th><th>Niveau</th></tr>' + rows.map(k => '<tr><td>' + SKILLS[k].n + ' <span class="muted">(' + SUBJ[SKILLS[k].s].n + ')</span></td><td class="n">' + w.sk[k].q + '</td><td class="n">' + pct(w.sk[k].r, w.sk[k].q) + '%</td><td>' + LVL[skill(k).lvl] + ' (' + skill(k).lvl + '/3)</td></tr>').join('') + '</table></div></div>';
  h += '<div class="card"><h3>💶 Spaarpot</h3><div class="stats"><div class="stat"><b>€ ' + earned() + '</b>totaal verdiend</div><div class="stat"><b>€ ' + paidOut() + '</b>uitbetaald</div><div class="stat"><b>€ ' + bal + '</b>nog te krijgen</div></div><p class="muted">Regel: elke dag met minstens 15 minuten actief oefenen levert € 1 op. De klok loopt alleen als ' + esc(S.name) + ' echt bezig is.</p>' +
    '<p class="noprint"><button class="btn" data-act="payout"' + (bal > 0 ? '' : ' disabled') + '>Markeer € ' + bal + ' als uitbetaald</button></p>' + (S.paid.length ? '<p class="muted">Uitbetaald: ' + S.paid.map(p => '€ ' + p.amt + ' op ' + p.d.split('-').reverse().join('-')).join(' · ') + '</p>' : '') + '</div>' +
    parentGrowth() + '<div class="card"><h3>🎁 Beloningen</h3>' + (S.coupons.length ? '<div class="tablewrap"><table><tr><th>Bon</th><th>Waarde</th><th>Gekocht</th><th></th></tr>' + S.coupons.map((c, i) => '<tr><td>' + esc(c.t) + '</td><td>' + esc(c.val || '–') + '</td><td>' + c.d.split('-').reverse().join('-') + '</td><td>' + (c.used ? 'ingeleverd ✔' : '<button class="btn sm noprint" data-act="cused" data-i="' + i + '">Ingeleverd</button>') + '</td></tr>').join('') + '</table></div>' : '<p class="muted">Er zijn nog geen bonnen gekocht.</p>') +
    (S.blog.length ? '<p class="muted">Bonussen: ' + S.blog.map(b => '€ ' + b.amt + ' ' + esc(b.why) + ' (' + b.d.split('-').reverse().join('-') + ')').join(' · ') + '</p>' : '') +
    '<div class="noprint"><h4 style="margin-top:16px">Bonussen in euro\'s (0 = uit)</h4><p class="row"><span>Weekbonus: bij</span><input class="inp" style="width:80px" type="number" min="1" max="7" data-bonus="wd" value="' + S.bonus.wd + '"><span>euro-dagen per week krijgt ze € </span><input class="inp" style="width:80px" type="number" min="0" data-bonus="wa" value="' + S.bonus.wa + '"></p><p class="row"><span>Kampioenbonus: een heel vak op niveau 3 levert € </span><input class="inp" style="width:80px" type="number" min="0" data-bonus="ka" value="' + S.bonus.ka + '"><span>op</span></p>' +
    '<h4 style="margin-top:16px">Waardebonnen in de winkel (pas ze aan naar wat bij jullie past)</h4>' + shop().map((it, i) => '<p class="row shoprow"><input class="inp" style="width:64px" data-shop="' + i + '" data-f="ic" value="' + esc(it.ic) + '" maxlength="4" aria-label="plaatje"><input class="inp wide" data-shop="' + i + '" data-f="t" value="' + esc(it.t) + '" maxlength="50" aria-label="beloning"><span>⭐</span><input class="inp" style="width:95px" type="number" min="1" data-shop="' + i + '" data-f="cost" value="' + it.cost + '" aria-label="prijs in sterren"><input class="inp" style="width:130px" data-shop="' + i + '" data-f="val" value="' + esc(it.val || '') + '" maxlength="20" placeholder="waarde" aria-label="waarde"><button class="btn ghost sm" data-act="shopdel" data-i="' + i + '">✕</button></p>').join('') + '<p><button class="btn ghost sm" data-act="shopadd">+ Beloning toevoegen</button></p></div></div>' +
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
  else if (view !== window.__lv) window.scrollTo(0, 0);
  window.__lv = view;
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
  chest: () => { const d = day(); if (!d.euro || d.chest) return; const n = Math.random() < 0.1 ? 25 : U.ri(5, 15); d.chest = n; S.stars += n; save(); confetti(['🎁', '⭐', '💎', '✨']); toast('In de schatkist zaten ' + n + ' sterren!' + (n === 25 ? ' Dat is de jackpot! 💎' : '')); render(); },
  buy: el => { const it = shop()[+el.dataset.i]; if (!it || sbal() < it.cost || !confirm('"' + it.t + '" kopen voor ' + it.cost + ' sterren?')) return; S.spent += it.cost; S.coupons.push({ t: it.ic + ' ' + it.t, val: it.val, d: dkey(), used: false }); save(); confetti(['🎟', '🎉', '⭐']); toast('Gekocht! Laat je bon zien aan papa of mama.'); render(); },
  acc: el => { const x = ACCS.find(a => a[0] === el.dataset.k); if (!x) return; if (S.acc.includes(x[0])) S.wear = S.wear === x[0] ? '' : x[0]; else if (sbal() >= x[3]) { S.spent += x[3]; S.acc.push(x[0]); S.wear = x[0]; confetti([x[1], '✨']); } save(); render(); },
  cused: el => { const c = S.coupons[+el.dataset.i]; if (c) { c.used = dkey(); save(); render(); } },
  shopdel: el => { shop().splice(+el.dataset.i, 1); save(); render(); },
  shopadd: () => { shop().push({ ic: '🎁', t: 'Nieuwe beloning', cost: 100, val: '' }); save(); render(); },
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
  setup: fd => { const pin = fd.get('pin'); if (!/^\d{4}$/.test(pin)) return toast('Kies precies 4 cijfers.'); S.name = (fd.get('name') || '').trim() || 'Ster'; S.pin = pin; S.setup = true; authed = true; view = 'home'; save(); render(); confetti(['🎨', '⚽', '💗', '✨']); },
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
  if (t.dataset.shop != null) { const it = shop()[+t.dataset.shop]; if (it) { it[t.dataset.f] = t.dataset.f === 'cost' ? Math.max(1, Math.round(+t.value) || 1) : t.value; save(); } }
  if (t.dataset.bonus) { S.bonus[t.dataset.bonus] = Math.max(t.dataset.bonus === 'wd' ? 1 : 0, Math.round(+t.value) || 0); save(); }
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
Object.assign(V, WV); Object.assign(ACT, WACT); Object.assign(FORM, WFORM);
applyTheme(); render();
