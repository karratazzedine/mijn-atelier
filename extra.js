'use strict';
/* Gordels, bezoekers, baasgevecht, duel met een ouder, uitlegrol en de weekbrief van de coach.
   Wordt geladen na world.js en vóór app.js; app.js roept deze functies aan. */

/* ===== Gordels per vak ===== */
// naam, kleur, benodigde goede antwoorden in het vak, benodigd gemiddeld niveau
const BELTS = [['witte', '#ffffff', 0, 0], ['gele', '#ffd23f', 15, 1], ['oranje', '#ff9838', 40, 1.3], ['groene', '#3fb565', 80, 1.6], ['blauwe', '#2f86eb', 140, 2], ['bruine', '#8a5a3c', 220, 2.4], ['zwarte', '#22202a', 320, 2.75]];
const subjR = k => Object.keys(SKILLS).filter(s => SKILLS[s].s === k).reduce((a, s) => a + skill(s).r, 0);
const beltNow = k => { const r = subjR(k), lv = subjLv(k); let b = 0; BELTS.forEach((x, i) => { if (r >= x[2] && lv >= x[3]) b = i; }); return b; };
/* Een behaalde gordel raak je nooit meer kwijt */
const belt = k => Math.max((S.belts && S.belts[k]) || 0, 0);
function ensureBelts() { if (!S.belts) { S.belts = {}; Object.keys(SUBJ).forEach(k => { S.belts[k] = beltNow(k); }); } }
const beltDot = i => '<span class="belt" style="background:' + BELTS[i][1] + '" title="' + BELTS[i][0] + ' band"></span>';
const beltChip = k => { ensureBelts(); return beltDot(belt(k)) + BELTS[belt(k)][0] + ' band'; };
function beltNeed(k) {
  const b = belt(k), n = BELTS[b + 1]; if (!n) return null;
  const r = Math.max(0, n[2] - subjR(k)), lv = subjLv(k) < n[3];
  return { name: n[0], r, lv: lv ? n[3] : 0 };
}
function checkBelts() {
  ensureBelts();
  Object.keys(SUBJ).forEach(k => { const b = beltNow(k); if (b > belt(k)) { S.belts[k] = b; const rew = 15 * b; S.bricks += rew; confetti(['🥋', '🥊', '⭐']); toast('🥋 Nieuwe gordel! Je hebt nu de ' + BELTS[b][0] + ' band bij ' + SUBJ[k].n + '. 🧱 ' + rew + ' erbij!'); } });
}
function beltCard() {
  ensureBelts();
  return '<div class="card"><h3>🥋 Mijn gordels</h3><p class="muted">Net als bij kickboksen begin je met de witte band. Met goede antwoorden en een hoger niveau verdien je de volgende kleur. Een gordel die je hebt, raak je nooit meer kwijt.</p>' +
    Object.keys(SUBJ).map(k => { const n = beltNeed(k), b = belt(k), nx = BELTS[b + 1], p = nx ? Math.min(100, Math.round(100 * (subjR(k) - BELTS[b][2]) / (nx[2] - BELTS[b][2]))) : 100; return '<div class="skill"><div><b>' + SUBJ[k].ic + ' ' + SUBJ[k].n + '</b><div class="muted">' + beltDot(b) + BELTS[b][0] + ' band' + (n ? ' · voor de ' + n.name + ' band: ' + (n.r ? 'nog ' + n.r + ' goede antwoorden' : '') + (n.r && n.lv ? ' en ' : '') + (n.lv ? 'gemiddeld niveau ' + String(n.lv).replace('.', ',') : '') : ' · de hoogste band!') + '</div></div><div class="bar"><i style="width:' + p + '%"></i></div><span class="beltrow">' + BELTS.map((x, i) => '<span class="belt' + (i <= b ? '' : ' off') + '" style="background:' + x[1] + '"></span>').join('') + '</span></div>'; }).join('') + '</div>';
}

/* ===== Bezoekers in de wereld ===== */
const VIS = ['🏃‍♀️', '🚶‍♀️', '🙋‍♀️', '🧒', '👧', '⛹️‍♀️', '🤾‍♀️', '🧍‍♂️', '🚶‍♂️', '👦'];
function visitors(sz) {
  const cells = S.world.cells, placed = Object.values(cells).filter(c => c.o), free = [];
  for (let r = 0; r < sz[1]; r++) for (let c = 0; c < sz[0]; c++) { const k = c + '_' + r; if (!(cells[k] && (cells[k].o || (cells[k].b && cells[k].b.length))) && (!cells[k] || cells[k].g !== 'water')) free.push(k); }
  const pull = placed.filter(c => ['fans', 'trommel', 'stadion', 'friet', 'tent'].includes(c.o)).length;
  const n = Math.min(free.length, 14, Math.floor(placed.length / 2) + 2 * pull + Math.min(streak(), 5) + (wlevel() - 1));
  /* vaste plekken per dag en per bouwstand, zodat ze niet bij elke klik verspringen */
  let seed = +dkey().replace(/-/g, '') + placed.length * 7919; const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
  const out = {}; for (let i = 0; i < n; i++) { const j = Math.floor(rnd() * free.length); out[free.splice(j, 1)[0]] = VIS[Math.floor(rnd() * VIS.length)]; }
  return out;
}

/* ===== Baasgevecht (vrijdag t/m zondag) ===== */
const BOSSES = ['IJzeren Iris', 'Bliksem-Bo', 'Kapitein Kopbal', 'Tornado Tess', 'De Muur'];
const weekKey = () => dkey(monday());
const bossDay = () => [5, 6, 0].includes(new Date().getDay());
const bossDone = () => !!(S.boss && S.boss.wk === weekKey());
const bossName = () => BOSSES[Math.floor(monday().getTime() / 6048e5) % BOSSES.length];
function bossQueue() {
  const from = new Date(monday()); from.setHours(0, 0, 0, 0); const t0 = from.getTime() / 1000, miss = {};
  const ok = k => SKILLS[k] && (k !== 'sp_eigen' || S.words.length >= 3);
  S.log.forEach(e => { if (e[0] >= t0 && !e[3] && !e[5] && ok(e[1])) miss[e[1]] = (miss[e[1]] || 0) + 1; });
  let q = Object.keys(miss).sort((a, b) => miss[b] - miss[a]); q = q.concat(q.filter(k => miss[k] >= 2));
  const rest = U.shuffle(Object.keys(SKILLS).filter(k => ok(k) && !q.includes(k))).sort((a, b) => { const x = skill(a), y = skill(b); return (x.q ? x.r / x.q : 0.5) - (y.q ? y.r / y.q : 0.5); });
  return { fromMiss: Object.keys(miss).length, list: U.shuffle(q.slice(0, 10).concat(rest).slice(0, 10)) };
}
function bossEnd() {
  const wrong = sess.n - sess.right, win = sess.right >= 8;
  S.boss = { wk: weekKey(), right: sess.right, wrong, win, name: bossName() }; if (win) S.bwins = (S.bwins || 0) + 1;
  S.bricks += win ? 40 : 10; save(); if (win) confetti(['🏆', '🥊', '⭐']); view = 'bossres'; render();
}
const bossBar = () => { const wrong = sess.n - sess.right; return '<div class="bossbar"><span>Jij ' + [0, 1, 2].map(i => i < 3 - wrong ? '❤️' : '🖤').join('') + '</span><b>🥊 ' + esc(bossName()) + '</b><span>nog ' + Math.max(0, 8 - sess.right) + ' rake klappen</span></div>'; };
WV.bossres = () => {
  const b = S.boss;
  return '<div class="card center" style="margin-top:3vh">' + mentor(b.win ? 'KNOCK-OUT! Je hebt <b>' + esc(b.name) + '</b> verslagen met ' + b.right + ' rake klappen. Je krijgt 🧱 40 en je mag de kampioensbeker in je wereld zetten!' : 'Wat een gevecht! ' + esc(b.name) + ' was deze week nog net te sterk: ' + b.right + ' rake klappen. Je krijgt 🧱 10 voor je moed. Volgende week staat er een nieuwe tegenstander, en dan ben jij weer een week sterker.') +
    '<div class="stats" style="margin:18px 0"><div class="stat"><b>' + b.right + '</b>raak</div><div class="stat"><b>' + b.wrong + '</b>gemist</div><div class="stat"><b>' + (S.bwins || 0) + '</b>bekers</div></div>' +
    '<p class="row" style="justify-content:center"><button class="btn" data-act="go" data-v="home">Naar huis</button><button class="btn two" data-act="go" data-v="world">🏟 Naar mijn wereld</button></p></div>';
};
WACT.boss = () => {
  if (!bossDay()) return toast('Het baasgevecht is er van vrijdag tot en met zondag.'); if (bossDone()) return toast('Je hebt deze week al gevochten. Volgende week weer!');
  sess = { mode: 'baas', n: 0, right: 0, last: [], lastSubj: null, revanche: null, ups: [], miss: {}, queue: bossQueue().list }; view = 'practice'; lastAct = Date.now(); nextQ();
};

/* ===== Duel met papa of mama ===== */
function startDuel() {
  const subs = U.shuffle(Object.keys(SUBJ)).slice(0, 5), dq = subs.map(s => { const id = U.pick(Object.keys(SKILLS).filter(k => SKILLS[k].s === s && k !== 'sp_eigen')); return pers(GEN[id](skill(id).lvl, { recent: S.recent[id] || [] })); });
  sess = { mode: 'duel', n: 0, right: 0, last: [], ups: [], miss: {}, dq, di: 0, who: 0, dres: [[], []], dsec: [0, 0], dt0: Date.now() }; view = 'practice'; lastAct = Date.now(); duelNext();
}
function duelNext() {
  if (sess.di >= sess.dq.length) {
    sess.dsec[sess.who] = Math.round((Date.now() - sess.dt0) / 1000);
    if (sess.who === 0) { view = 'duelswap'; return render(); }
    return duelEnd();
  }
  const q = sess.dq[sess.di]; cur = { q, done: false, phase: q.type === 'flash' ? 'ready' : 'ask', t0: Date.now() }; render();
}
function duelAnswer(ok) { sess.dres[sess.who].push(ok ? 1 : 0); sess.di++; duelNext(); }
function duelEnd() {
  const k = sess.dres[0].reduce((a, b) => a + b, 0), p = sess.dres[1].reduce((a, b) => a + b, 0), win = k > p || (k === p && sess.dsec[0] <= sess.dsec[1]);
  const first = !(S.duels || []).some(d => d.d === dkey()), rew = first ? (win ? 25 : 10) : 0;
  (S.duels || (S.duels = [])).push({ d: dkey(), k, p, win }); if (S.duels.length > 200) S.duels.shift();
  S.bricks += rew; sess.dwin = win; sess.drew = rew; sess.dk = k; sess.dp = p; save(); if (win) confetti(['🏆', '⚔️', '⭐']); view = 'duelres'; render();
}
WV.duelswap = () => '<div class="card center" style="margin-top:6vh">' + mentor('Jouw beurt zit erop, ' + esc(S.name) + '! Geef de laptop nu aan <b>papa of mama</b>. Zij krijgen precies dezelfde 5 vragen. Niet voorzeggen hè! 🤫') + '<p style="margin-top:18px"><button class="btn big" data-act="duelgo">Ik ben de ouder en ik ben er klaar voor</button></p></div>';
WV.duelres = () => {
  const ans = q => q.type === 'flash' ? esc(q.word) : q.correctText, mk = v => v ? '<span class="up">✔</span>' : '<span class="down">✘</span>';
  const all = S.duels || [], wins = all.filter(d => d.win).length;
  return '<div class="card center" style="margin-top:3vh">' + mentor(sess.dwin ? (sess.dk === sess.dp ? 'Gelijkspel in punten, maar jij was sneller. ' : '') + 'JIJ WINT het duel met ' + sess.dk + ' tegen ' + sess.dp + '! ' + (sess.drew ? 'Je krijgt 🧱 ' + sess.drew + '.' : 'Vandaag had je de duelbeloning al, maar de eer is helemaal van jou.') : 'Papa of mama wint deze keer met ' + sess.dp + ' tegen ' + sess.dk + '. ' + (sess.drew ? 'Je krijgt 🧱 ' + sess.drew + ' voor het durven. ' : '') + 'Vraag meteen om een revanche!') +
    '<div class="tablewrap" style="margin:16px 0"><table><tr><th>Vraag</th><th>Goede antwoord</th><th class="n">' + esc(S.name) + '</th><th class="n">Ouder</th></tr>' + sess.dq.map((q, i) => '<tr><td style="text-align:left">' + SKILLS[q.skill].n + '</td><td style="text-align:left">' + ans(q) + '</td><td class="n">' + mk(sess.dres[0][i]) + '</td><td class="n">' + mk(sess.dres[1][i]) + '</td></tr>').join('') + '<tr><td colspan="2" style="text-align:left"><b>Tijd</b></td><td class="n">' + sess.dsec[0] + ' s</td><td class="n">' + sess.dsec[1] + ' s</td></tr></table></div>' +
    '<p class="muted">Stand tot nu toe: ' + esc(S.name) + ' ' + wins + ' – ' + (all.length - wins) + ' ouders.</p>' +
    '<p class="row" style="justify-content:center"><button class="btn" data-act="go" data-v="home">Naar huis</button><button class="btn two" data-act="duel">⚔️ Revanche</button></p></div>';
};
WACT.duel = () => startDuel();
WACT.duelgo = () => { sess.who = 1; sess.di = 0; sess.dt0 = Date.now(); view = 'practice'; duelNext(); };

/* ===== Uitlegrol: zij is even de coach ===== */
function maybeExplain(q) {
  if (sess.mode === 'baas' || q.rev || q.revanche || Math.random() > 0.18) return null;
  const others = U.shuffle(Object.keys(SKILLS).filter(k => k !== q.skill && SKILLS[k].s === SKILLS[q.skill].s && SKILLS[k].trick !== SKILLS[q.skill].trick));
  const fill = U.shuffle(Object.keys(SKILLS).filter(k => k !== q.skill && !others.includes(k)));
  const wr = others.concat(fill).slice(0, 2); if (wr.length < 2) return null;
  return { opts: U.shuffle([{ t: SKILLS[q.skill].trick, ok: true }].concat(wr.map(k => ({ t: SKILLS[k].trick })))), done: false };
}
function explainHTML() {
  const x = cur.xp; if (!x) return '';
  return '<div class="xp"><h4 style="margin-top:0">🎓 Jij bent nu de coach!</h4><p>Een teamgenoot snapt dit soort vragen nog niet. Welke tip geef jij?' + (x.done ? '' : ' Goed gekozen = <b>2 sterren en 🧱 3</b>.') + '</p><div class="opts long">' + x.opts.map((o, i) => '<button class="opt' + (x.done && o.ok ? ' good' : '') + (x.done && x.given === i && !o.ok ? ' wrong' : '') + '" data-act="xp" data-i="' + i + '"' + (x.done ? ' disabled' : '') + '><span class="l">' + 'ABC'[i] + '</span><span>' + o.t + '</span></button>').join('') + '</div>' + (x.done ? '<p><b>' + (x.ok ? 'Precies! Wie het kan uitleggen, snapt het echt.' : 'Bijna. De groene tip hoort bij deze vraag; lees hem nog één keer rustig.') + '</b></p>' : '') + '</div>';
}
WACT.xp = el => { const x = cur.xp; if (!x || x.done) return; x.done = true; x.given = +el.dataset.i; x.ok = !!x.opts[x.given].ok; if (x.ok) { S.stars += 2; S.bricks += 3; S.xpOk = (S.xpOk || 0) + 1; } save(); render(); };

/* ===== Weekbrief van de coach ===== */
function briefData() {
  const w = weekStats(-1), pw = weekStats(-2); if (!w.q) return null;
  const days = w.days.filter(d => d.q).length, p = pct(w.r, w.q), pp = pw.q ? pct(pw.r, pw.q) : null;
  const best = Object.keys(w.subj).filter(k => w.subj[k].q >= 5).sort((a, b) => w.subj[b].r / w.subj[b].q - w.subj[a].r / w.subj[a].q)[0];
  const weak = Object.keys(w.sk).filter(k => SKILLS[k] && w.sk[k].q >= 3 && w.sk[k].r / w.sk[k].q < 0.8).sort((a, b) => w.sk[a].r / w.sk[a].q - w.sk[b].r / w.sk[b].q)[0];
  let near = null; Object.keys(SUBJ).forEach(k => { const n = beltNeed(k); if (n && !n.lv && n.r > 0 && (!near || n.r < near.r)) near = { k, r: n.r, name: n.name }; });
  return { w, days, p, pp, best, weak, near, goal: Math.min(7, Math.max(4, days + 1)) };
}
function briefCard() {
  if (S.briefSeen === weekKey()) return ''; const b = briefData(); if (!b) return '';
  return '<div class="card brief"><h3>✉️ Weekbrief van ' + esc(S.mentor) + '</h3><p>Hoi ' + esc(S.name) + ',</p>' +
    '<p>Vorige week heb je op <b>' + b.days + (b.days === 1 ? ' dag' : ' dagen') + '</b> getraind, samen <b>' + Math.round(b.w.sec / 60) + ' minuten</b>. Je maakte <b>' + b.w.q + ' vragen</b> en had er <b>' + b.p + '%</b> van goed.' + (b.pp == null ? '' : b.p > b.pp ? ' Dat is beter dan de week ervoor (' + b.pp + '%). Je groeit!' : b.p < b.pp ? ' De week ervoor was dat ' + b.pp + '%. Niet erg: moeilijkere vragen horen bij groeien.' : ' Precies even goed als de week ervoor.') + '</p>' +
    (b.best ? '<p>🏅 Je sterkste vak was <b>' + SUBJ[b.best].n + '</b> (' + pct(b.w.subj[b.best].r, b.w.subj[b.best].q) + '% goed). Daar ben ik trots op.</p>' : '') +
    (b.weak ? '<p>🎯 Deze week wil ik samen met jou werken aan <b>' + SKILLS[b.weak].n + '</b>. Mijn tip: ' + SKILLS[b.weak].trick + '</p>' : '') +
    (b.near ? '<p>🥋 Je bent nog maar <b>' + b.near.r + ' goede antwoorden</b> verwijderd van de ' + b.near.name + ' band bij ' + SUBJ[b.near.k].n + '.</p>' : '') +
    '<p>💪 Jouw doel voor deze week: <b>' + b.goal + ' dagen een kwartier trainen</b>' + (bossDone() ? '' : ' en vrijdag het baasgevecht winnen') + '.</p><p>Groetjes van je coach,<br><b>' + esc(S.mentor) + '</b> 🦊</p>' +
    '<p class="row">' + (b.weak ? '<button class="btn two" data-act="briefgo" data-m="' + b.weak + '">▶ Meteen ' + SKILLS[b.weak].n + ' trainen</button>' : '') + '<button class="btn" data-act="briefok">Gelezen, aan de slag!</button></p></div>';
}
WACT.briefok = () => { S.briefSeen = weekKey(); save(); render(); };
WACT.briefgo = el => { S.briefSeen = weekKey(); save(); start(el.dataset.m); };

/* ===== Tegels op het startscherm ===== */
function extraHome() {
  const b = S.boss, done = bossDone();
  return '<h2>Uitdagingen</h2><div class="grid" style="margin-bottom:22px">' +
    '<button class="tile" data-act="boss"><span class="ic">' + (done && b.win ? '🏆' : '🥊') + '</span>Baasgevecht<small>' + (done ? (b.win ? 'gewonnen deze week!' : 'volgende week een nieuwe kans') : bossDay() ? esc(bossName()) + ' wacht op je!' : 'vrijdag t/m zondag') + '</small></button>' +
    '<button class="tile" data-act="duel"><span class="ic">⚔️</span>Duel met papa of mama<small>5 vragen, wie wint?</small></button>' +
    '<button class="tile" data-act="go" data-v="progress"><span class="ic">🥋</span>Mijn gordels<small>' + Object.keys(SUBJ).map(k => beltDot(belt(k))).join('') + '</small></button></div>';
}
