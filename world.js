'use strict';
/* Sportwereld, opdrachten, eigen woorden, toetsen en logboek. Wordt geladen vóór app.js en daar ingehaakt. */

/* ===== Eigen woorden als extra spellingonderdeel ===== */
SKILLS.sp_eigen = { s: 'sp', n: 'Mijn eigen woorden', vid: 'spelling oefenen', trick: 'Kijk naar het woord, dek het af, schrijf het op en controleer. Zo train je woorden van school het snelst.' };
GEN.sp_eigen = (l, ctx) => { const i = pickItem(S.words.length, ctx), w = S.words[i]; return Object.assign(flashQ('sp_eigen', w, 'Dit woord komt uit jouw eigen lijst.'), { item: i, steps: 'Het goede woord is <b>' + w + '</b>.' }); };

/* ===== Wereld ===== */
const WLV = [0, 10, 30, 60, 100, 160, 240, 340, 460, 600, 800];
const xp = () => Object.values(S.skills).reduce((a, s) => a + s.r, 0);
const wlevel = () => { const x = xp(); let l = 1; while (l < WLV.length && x >= WLV[l]) l++; return l; };
const wsize = l => [Math.min(10, 5 + Math.ceil((l - 1) / 2)), Math.min(8, 4 + Math.floor((l - 1) / 2))];
const subjLv = k => { const ids = Object.keys(SKILLS).filter(s => SKILLS[s].s === k && s !== 'sp_eigen'); return ids.reduce((a, s) => a + skill(s).lvl, 0) / ids.length; };
const GROUND = { gras: ['Gras', 0], veld: ['Voetbalveld', 1], mat: ['Vechtmat', 1], ring: ['Boksring', 2], tegel: ['Tegels', 1], zand: ['Zand', 1], water: ['Water', 2] };
// id, plaatje, naam, groep, prijs in bouwstenen, voorwaarde
const ITEMS = [
  ['bal', '⚽', 'Voetbal', 'Voetbal', 5], ['doel', '🥅', 'Doel', 'Voetbal', 20], ['vlag', '🚩', 'Cornervlag', 'Voetbal', 8], ['schoen', '👟', 'Voetbalschoenen', 'Voetbal', 10], ['shirt', '🎽', 'Clubshirt', 'Voetbal', 12], ['fans', '📣', 'Supporters', 'Voetbal', 18, { l: 2 }], ['trommel', '🥁', 'Trommelaar', 'Voetbal', 22, { l: 3 }], ['stadion', '🏟️', 'Stadion', 'Voetbal', 150, { l: 6 }],
  ['zak', '🥊', 'Bokszak', 'Vechtsport', 15], ['pak', '🥋', 'Vechtpak', 'Vechtsport', 14], ['gong', '🔔', 'Gong', 'Vechtsport', 12], ['gewicht', '🏋️', 'Krachthoek', 'Vechtsport', 28, { l: 2 }], ['duo', '🤼', 'Sparringpartners', 'Vechtsport', 30, { l: 3 }], ['dojo', '⛩️', 'Poort van de gym', 'Vechtsport', 60, { l: 4 }], ['riem', '🎗️', 'Kampioensriem', 'Vechtsport', 80, { st: 7 }],
  ['boom', '🌳', 'Boom', 'Park', 6], ['bloem', '🌷', 'Bloemen', 'Park', 4], ['lamp', '💡', 'Lichtmast', 'Park', 12], ['huis', '🏠', 'Clubhuis', 'Park', 60, { l: 3 }], ['friet', '🍟', 'Kantine', 'Park', 45, { l: 3 }], ['fontein', '⛲', 'Fontein', 'Park', 40, { l: 4 }], ['bus', '🚌', 'Spelersbus', 'Park', 70, { l: 5 }], ['beeld', '🗿', 'Standbeeld', 'Park', 100, { l: 7 }], ['tent', '🎪', 'Feesttent', 'Park', 90, { l: 8 }],
  ['loper', '🏃‍♀️', 'Speelster', 'Bewoners', 15], ['hond', '🐕', 'Clubhond', 'Bewoners', 20], ['coach', '🧑‍🏫', 'Trainer', 'Bewoners', 30, { l: 2 }], ['vos', '🦊', 'Mascotte', 'Bewoners', 35, { l: 4 }], ['radslag', '🤸‍♀️', 'Acrobaat', 'Bewoners', 25, { l: 3 }],
  ['beker', '🏆', 'Beker (maak een toets)', 'Prijzenkast', 40, { t: 1 }], ['medaille', '🥇', 'Gouden medaille', 'Prijzenkast', 40, { st: 5 }], ['scherm', '📺', 'Groot scorebord', 'Prijzenkast', 30, { s: 'rek' }], ['krant', '📰', 'Clubkrant', 'Prijzenkast', 30, { s: 'sp' }], ['mic', '🎤', 'Commentaarhok', 'Prijzenkast', 30, { s: 'ww' }], ['vergroot', '🔍', 'Scoutingbureau', 'Prijzenkast', 30, { s: 'taal' }], ['boeken', '📚', 'Clubbibliotheek', 'Prijzenkast', 30, { s: 'lez' }], ['radio', '📻', 'Stadionradio', 'Prijzenkast', 30, { s: 'wsch' }], ['schrift', '📝', 'Eigen-woordenbord', 'Prijzenkast', 20, { w: 5 }]
];
const item = id => ITEMS.find(x => x[0] === id);
const reqOK = r => !r || (r.l ? wlevel() >= r.l : r.s ? subjLv(r.s) >= 2 : r.t ? S.tests.length >= r.t : r.st ? streak() >= r.st : r.w ? S.words.length >= r.w : true);
const reqTxt = r => r.l ? 'wereldniveau ' + r.l : r.s ? SUBJ[r.s].n + ' gemiddeld op niveau 2' : r.t ? 'maak een toets' : r.st ? r.st + ' dagen op rij trainen' : r.w ? r.w + ' eigen woorden toevoegen' : '';
let wtool = { k: 'obj', id: 'bal' }, wcat = 'Voetbal';
const WV = {}, WACT = {}, WFORM = {};

WV.world = () => {
  const l = wlevel(), x = xp(), sz = wsize(l), nextAt = WLV[l], cells = S.world.cells, cats = [...new Set(ITEMS.map(i => i[3]))];
  let grid = '';
  for (let r = 0; r < sz[1]; r++) for (let c = 0; c < sz[0]; c++) { const k = c + '_' + r, ce = cells[k] || {}, it = ce.o && item(ce.o); grid += '<button class="wc g-' + (ce.g || 'gras') + '" data-act="wcell" data-c="' + k + '" aria-label="vak ' + (c + 1) + ',' + (r + 1) + '">' + (it ? '<span class="wo">' + it[1] + '</span>' : '') + '</button>'; }
  const placed = Object.values(cells).filter(c => c.o).length;
  return head('🏟 Mijn sportwereld', '<span class="pill" title="Bouwstenen">🧱 ' + S.bricks + '</span>') +
    '<div class="card"><div class="row sp"><input class="inp wide" data-bind="wname" value="' + esc(S.world.name) + '" maxlength="24" placeholder="Geef je wereld een naam" aria-label="naam van je wereld"><span class="pill">🌍 Wereldniveau ' + l + '</span><span class="pill">' + placed + ' gebouwd</span></div>' +
    (nextAt != null ? '<p class="muted" style="margin:10px 0 4px">Nog <b>' + (nextAt - x) + '</b> goede antwoorden en je wereld wordt groter.</p><div class="bar"><i style="width:' + Math.round(100 * (x - WLV[l - 1]) / (nextAt - WLV[l - 1])) + '%"></i></div>' : '<p class="muted">Je wereld heeft de grootste maat bereikt. Wat een bouwer!</p>') +
    '<div class="wwrap"><div class="wgrid" style="--wc:' + sz[0] + '">' + grid + '</div></div>' +
    '<p class="muted center">Kies hieronder wat je wilt bouwen en tik dan op een vak. Je verdient 🧱 met goede antwoorden, herkansingen en opdrachten.</p></div>' +
    '<div class="card"><div class="row">' + cats.map(c => '<button class="pick' + (wcat === c ? ' on' : '') + '" data-act="wcat" data-k="' + c + '">' + c + '</button>').join('') + '<button class="pick' + (wcat === 'Grond' ? ' on' : '') + '" data-act="wcat" data-k="Grond">Grond</button><button class="pick' + (wtool.k === 'gum' ? ' on' : '') + '" data-act="wtool" data-k="gum">🧽 Weghalen</button></div><div class="grid" style="margin-top:14px">' +
    (wcat === 'Grond' ? Object.keys(GROUND).map(g => '<button class="shopit witem' + (wtool.k === 'ground' && wtool.id === g ? ' on' : '') + '" data-act="wtool" data-k="ground" data-id="' + g + '"><span class="wsw g-' + g + '"></span><b>' + GROUND[g][0] + '</b><span class="muted">' + (GROUND[g][1] ? '🧱 ' + GROUND[g][1] + ' per vak' : 'gratis') + '</span></button>').join('')
      : ITEMS.filter(i => i[3] === wcat).map(i => { const ok = reqOK(i[5]); return '<button class="shopit witem' + (wtool.k === 'obj' && wtool.id === i[0] ? ' on' : '') + (ok ? '' : ' locked') + '" data-act="wtool" data-k="obj" data-id="' + i[0] + '"' + (ok ? '' : ' disabled') + '><span class="ic">' + i[1] + '</span><b>' + i[2] + '</b><span class="muted">' + (ok ? '🧱 ' + i[4] : '🔒 ' + reqTxt(i[5])) + '</span></button>'; }).join('')) + '</div></div>';
};
WACT.wcat = el => { wcat = el.dataset.k; if (wtool.k === 'gum') wtool = { k: 'obj', id: '' }; render(); };
WACT.wtool = el => { wtool = { k: el.dataset.k, id: el.dataset.id || '' }; render(); };
WACT.wcell = el => {
  const k = el.dataset.c, ce = S.world.cells[k] || (S.world.cells[k] = {});
  if (wtool.k === 'gum') { if (!ce.o) return toast('Hier staat niets om weg te halen.'); const back = Math.ceil(item(ce.o)[4] / 2); S.bricks += back; delete ce.o; toast('Weggehaald. Je krijgt 🧱 ' + back + ' terug.'); }
  else if (wtool.k === 'ground') { if ((ce.g || 'gras') === wtool.id) return; const c = GROUND[wtool.id][1]; if (S.bricks < c) return toast('Je hebt nog 🧱 ' + (c - S.bricks) + ' nodig. Verdien ze met goede antwoorden!'); S.bricks -= c; ce.g = wtool.id; }
  else { const it = item(wtool.id); if (!it) return toast('Kies eerst hieronder wat je wilt bouwen.'); if (ce.o) return toast('Hier staat al iets. Haal het eerst weg met 🧽.'); if (!reqOK(it[5])) return; if (S.bricks < it[4]) return toast('Je hebt nog 🧱 ' + (it[4] - S.bricks) + ' nodig. Verdien ze met goede antwoorden!'); S.bricks -= it[4]; ce.o = it[0]; }
  save(); render();
};

/* ===== Opdrachten (missies) ===== */
function ensureMissions() {
  const t = dkey();
  if (S.mday !== t) {
    S.mday = t; S.missions = S.missions.filter(m => m.own && !m.claimed);
    const s = U.pick(Object.keys(SUBJ));
    S.missions.push({ t: '8 goede antwoorden bij ' + SUBJ[s].n, kind: 'subj', key: s, goal: 8, prog: 0, rew: 15 });
    S.missions.push(S.review.length >= 3 ? { t: 'Win 3 herkansingen', kind: 'rev', goal: 3, prog: 0, rew: 15 } : { t: '20 goede antwoorden in totaal', kind: 'subj', key: 'alle', goal: 20, prog: 0, rew: 20 });
    S.missions.push({ t: '15 minuten trainen', kind: 'min', goal: 15, prog: 0, rew: 20 });
    save();
  }
  S.missions.forEach(m => { if (m.kind === 'min') m.prog = Math.min(m.goal, Math.floor(dayRO(t).sec / 60)); });
}
function missionEvent(type, q) {
  ensureMissions();
  S.missions.forEach(m => { if (m.prog >= m.goal) return; if (type === 'ok' && ((m.kind === 'subj' && (m.key === 'alle' || SKILLS[q.skill].s === m.key)) || (m.kind === 'rev' && (q.rev || q.revanche)))) m.prog++; if (m.prog >= m.goal && !m.told) { m.told = true; toast('Opdracht gehaald: ' + m.t + '! Haal je 🧱 op bij Opdrachten.'); } });
}
/* Wordt na elk antwoord aangeroepen: logboek, bouwstenen, opdrachten en niveau-momentopname */
function onAnswer(q, ok, isTest) {
  S.log.push([Math.floor(Date.now() / 1000), q.skill, skill(q.skill).lvl, ok ? 1 : 0, Math.min(600, Math.round((Date.now() - (cur.t0 || Date.now())) / 1000)), isTest ? 1 : 0]);
  if (S.log.length > 30000) S.log.splice(0, S.log.length - 30000);
  const d = day(); d.lv = {}; Object.keys(SUBJ).forEach(k => { d.lv[k] = Math.round(subjLv(k) * 10) / 10; });
  if (isTest) return;
  if (ok) { S.bricks += (q.rev || q.revanche) ? 4 : 2; missionEvent('ok', q); }
}
const ownOpen = () => S.missions.filter(m => m.own && !m.claimed).length;
WV.missions = () => {
  ensureMissions();
  const row = (m, i) => '<div class="skill"><div><b>' + esc(m.t) + '</b>' + (m.own ? ' <span class="chip">eigen opdracht</span>' : '') + '<div class="bar" style="margin-top:6px"><i style="width:' + Math.round(100 * m.prog / m.goal) + '%"></i></div><div class="muted">' + m.prog + ' van ' + m.goal + '</div></div><b>🧱 ' + m.rew + '</b>' + (m.claimed ? '<span>opgehaald ✔</span>' : m.prog >= m.goal ? '<button class="btn sm" data-act="mclaim" data-i="' + i + '">Ophalen!</button>' : m.own ? '<button class="btn ghost sm" data-act="mdel" data-i="' + i + '">✕</button>' : '<span class="muted">bezig…</span>') + '</div>';
  const last = S.tests[S.tests.length - 1], days = last ? Math.round((new Date(dkey()) - new Date(last.d)) / 864e5) : 99;
  return head('🎯 Opdrachten', '<span class="pill">🧱 ' + S.bricks + '</span>') +
    '<div class="card">' + mentor('Elke dag staan er nieuwe opdrachten klaar. Haal je ze, dan krijg je bouwstenen voor je sportwereld. Je kunt ook je eigen opdrachten en je eigen woorden toevoegen!', true) + '</div>' +
    '<div class="card"><h3>Opdrachten van vandaag</h3>' + S.missions.map((m, i) => m.own ? '' : row(m, i)).join('') + '</div>' +
    '<div class="card"><h3>✍️ Mijn eigen opdrachten</h3>' + (S.missions.some(m => m.own) ? S.missions.map((m, i) => m.own ? row(m, i) : '').join('') : '<p class="muted">Je hebt nog geen eigen opdracht. Daag jezelf uit!</p>') +
    (ownOpen() < 3 ? '<form data-form="mnew" class="row" style="margin-top:14px"><span>Ik ga</span><select class="inp" name="n" style="width:110px">' + [5, 10, 15, 20, 30, 40, 50].map(n => '<option' + (n === 10 ? ' selected' : '') + '>' + n + '</option>').join('') + '</select><span>goede antwoorden halen bij</span><select class="inp" name="s" style="width:auto"><option value="alle">alle vakken</option>' + Object.keys(SUBJ).map(k => '<option value="' + k + '">' + SUBJ[k].n + '</option>').join('') + '</select><button class="btn two sm">Maak opdracht</button></form><p class="muted">Hoe groter de opdracht, hoe meer bouwstenen: anderhalve 🧱 per goed antwoord.</p>' : '<p class="muted">Je hebt drie eigen opdrachten lopen. Maak er eerst een af.</p>') + '</div>' +
    '<div class="card"><h3>📝 Mijn eigen woorden</h3><p class="muted">Zet hier de woorden van school in (bijvoorbeeld van het dictee). Vanaf 3 woorden komen ze terug in je training als flitswoord.</p><form data-form="wadd" class="row"><input class="inp wide" name="w" maxlength="30" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="typ een woord"><button class="btn two sm">Toevoegen</button></form><div class="row" style="margin-top:12px">' + (S.words.length ? S.words.map((w, i) => '<span class="pill">' + esc(w) + ' <button class="x" data-act="wdel" data-i="' + i + '" aria-label="verwijder ' + esc(w) + '">✕</button></span>').join('') : '<span class="muted">Nog geen woorden.</span>') + '</div></div>' +
    '<div class="card"><h3>🏆 De toets</h3><p>24 vragen uit alle vakken, zonder hulp en zonder uitleg. Zo zie je (en zien papa en mama) hoeveel je vooruit bent gegaan. Beloning: <b>🧱 30</b> en een beker voor je prijzenkast.</p>' + (last ? '<p class="muted">Laatste toets: ' + last.d.split('-').reverse().join('-') + ', ' + pct(last.right, last.total) + '% goed.</p>' : '') + (days >= 7 ? '<button class="btn" data-act="start" data-m="toets">Start de toets</button>' : '<p class="muted">De volgende toets kan over ' + (7 - days) + ' dag(en). Eerst nog even trainen!</p>') + '</div>';
};
WACT.mclaim = el => { const m = S.missions[+el.dataset.i]; if (!m || m.claimed || m.prog < m.goal) return; m.claimed = true; S.bricks += m.rew; save(); confetti(['🧱', '⭐', '🎯']); toast('🧱 ' + m.rew + ' erbij! Tijd om te bouwen.'); render(); };
WACT.mdel = el => { const m = S.missions[+el.dataset.i]; if (m && m.own && !m.claimed) { S.missions.splice(+el.dataset.i, 1); save(); render(); } };
WACT.wdel = el => { S.words.splice(+el.dataset.i, 1); delete S.recent.sp_eigen; S.review = S.review.filter(r => r.skill !== 'sp_eigen'); save(); render(); };
WFORM.mnew = fd => { if (ownOpen() >= 3) return; const n = Math.max(5, Math.min(50, +fd.get('n') || 10)), s = fd.get('s'); if (s !== 'alle' && !SUBJ[s]) return; S.missions.push({ t: n + ' goede antwoorden bij ' + (s === 'alle' ? 'alle vakken' : SUBJ[s].n), kind: 'subj', key: s, goal: n, prog: 0, rew: Math.round(n * 1.5), own: true }); save(); render(); };
WFORM.wadd = fd => { const w = String(fd.get('w') || '').trim(); if (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ' -]{1,29}$/.test(w)) return toast('Typ één woord met alleen letters.'); if (S.words.some(x => x.toLowerCase() === w.toLowerCase())) return toast('Dat woord staat er al in.'); if (S.words.length >= 60) return toast('De lijst is vol. Haal eerst een woord weg.'); S.words.push(w); save(); render(); };

/* ===== Toets (meetmoment) ===== */
function toetsNext() {
  if (!sess.plan) { sess.plan = []; Object.keys(SUBJ).forEach(s => { const ids = U.shuffle(Object.keys(SKILLS).filter(k => SKILLS[k].s === s && k !== 'sp_eigen')); for (let i = 0; i < 4; i++) sess.plan.push(ids[i % ids.length]); }); sess.plan = U.shuffle(sess.plan); sess.tn = sess.plan.length; sess.ti = 0; sess.res = {}; sess.used = {}; sess.tsec = Date.now(); }
  if (!sess.plan.length) return toetsDone();
  const id = sess.plan.shift(), used = sess.used[id] || (sess.used[id] = []), q = pers(GEN[id](2, { recent: used }));
  if (q.item != null) used.push(q.item);
  sess.ti++; cur = { q, done: false, phase: q.type === 'flash' ? 'ready' : 'ask', t0: Date.now() }; render();
}
function toetsAnswer(ok) {
  const q = cur.q, s = SKILLS[q.skill].s, r = sess.res[s] || (sess.res[s] = [0, 0]), d = day(), ds = d.sk[q.skill] || (d.sk[q.skill] = { q: 0, r: 0 });
  r[1]++; ds.q++; sess.n++; S.qcount++; if (ok) { r[0]++; ds.r++; sess.right++; }
  onAnswer(q, ok, true); save(); toetsNext();
}
function toetsDone() {
  const right = Object.values(sess.res).reduce((a, r) => a + r[0], 0), total = Object.values(sess.res).reduce((a, r) => a + r[1], 0);
  S.tests.push({ d: dkey(), right, total, res: sess.res, sec: Math.round((Date.now() - sess.tsec) / 1000) }); S.bricks += 30; save();
  confetti(['🏆', '⭐', '🧱']); view = 'toetsres'; render();
}
WV.toetsres = () => {
  const t = S.tests[S.tests.length - 1], p = S.tests[S.tests.length - 2], pc = pct(t.right, t.total);
  const msg = (p ? (pc > pct(p.right, p.total) ? 'Je bent vooruitgegaan sinds de vorige toets: van ' + pct(p.right, p.total) + '% naar ' + pc + '%. Dat is echte groei! ' : pc === pct(p.right, p.total) ? 'Precies even goed als de vorige keer. Stabiel als een keeper! ' : 'Iets lager dan de vorige keer. Dat gebeurt de beste kampioen: we weten nu waar we op gaan trainen. ') : 'Dit was je eerste toets. Vanaf nu kunnen we precies zien hoe hard je groeit. ') + 'Je krijgt 🧱 30 en je mag een beker in je prijzenkast zetten.';
  return '<div class="card center" style="margin-top:3vh">' + mentor(msg) + '<div class="stats" style="margin:18px 0"><div class="stat"><b>' + t.right + ' / ' + t.total + '</b>goed</div><div class="stat"><b>' + pc + '%</b>score</div><div class="stat"><b>' + Math.round(t.sec / 60) + ' min</b>tijd</div></div>' +
    Object.keys(SUBJ).map(k => { const r = t.res[k] || [0, 0], o = p && p.res[k]; return '<div class="skill" style="text-align:left"><div><b>' + SUBJ[k].ic + ' ' + SUBJ[k].n + '</b></div><div class="bar"><i style="width:' + pct(r[0], r[1]) + '%"></i></div><span>' + r[0] + ' van ' + r[1] + (o ? ' <span class="muted">(vorige keer ' + o[0] + ')</span>' : '') + '</span></div>'; }).join('') +
    '<p class="row" style="justify-content:center;margin-top:16px"><button class="btn" data-act="go" data-v="home">Naar huis</button><button class="btn two" data-act="go" data-v="world">🏟 Naar mijn wereld</button></p></div>';
};

/* ===== Groei en toetsen voor ouders ===== */
function parentGrowth() {
  const months = {}; Object.keys(S.days).sort().forEach(k => { const d = S.days[k], t = tot(d); if (!t.q) return; const m = months[k.slice(0, 7)] || (months[k.slice(0, 7)] = { days: 0, sec: 0, q: 0, r: 0, lv: null }); m.days++; m.sec += d.sec; m.q += t.q; m.r += t.r; if (d.lv) m.lv = d.lv; });
  const mk = Object.keys(months), avg = lv => lv ? (Object.values(lv).reduce((a, b) => a + b, 0) / Object.values(lv).length).toFixed(1).replace('.', ',') : '–';
  return '<div class="card"><h3>📈 Groei en toetsen</h3>' +
    (S.tests.length ? '<div class="tablewrap"><table><tr><th>Toets</th><th class="n">Score</th>' + Object.keys(SUBJ).map(k => '<th class="n" title="' + SUBJ[k].n + '">' + SUBJ[k].ic + '</th>').join('') + '<th class="n">Tijd</th></tr>' + S.tests.map((t, i) => { const p = S.tests[i - 1]; return '<tr><td>' + t.d.split('-').reverse().join('-') + '</td><td class="n"><b>' + pct(t.right, t.total) + '%</b>' + (p ? (pct(t.right, t.total) > pct(p.right, p.total) ? ' <span class="up">▲</span>' : pct(t.right, t.total) < pct(p.right, p.total) ? ' <span class="down">▼</span>' : ' =') : '') + '</td>' + Object.keys(SUBJ).map(k => '<td class="n">' + ((t.res[k] || [0, 0])[0]) + '/' + ((t.res[k] || [0, 0])[1]) + '</td>').join('') + '<td class="n">' + Math.round(t.sec / 60) + ' min</td></tr>'; }).join('') + '</table></div><p class="muted">De toets heeft elke keer 24 nieuwe vragen op hetzelfde vaste niveau (niveau 2 van 3), zonder uitleg of hulp. Daardoor zijn de scores onderling te vergelijken.</p>'
      : '<p class="muted">Er is nog geen toets gemaakt. Laat ' + esc(S.name) + ' nu een eerste toets doen als beginmeting (onder Opdrachten), en daarna bijvoorbeeld elke maand.</p>') +
    (mk.length ? '<h4 style="margin-top:16px">Per maand</h4><div class="tablewrap"><table><tr><th>Maand</th><th class="n">Dagen</th><th class="n">Minuten</th><th class="n">Vragen</th><th class="n">Goed</th><th class="n">Gem. niveau</th></tr>' + mk.map(k => { const m = months[k]; return '<tr><td>' + new Date(k + '-15').toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' }) + '</td><td class="n">' + m.days + '</td><td class="n">' + Math.round(m.sec / 60) + '</td><td class="n">' + m.q + '</td><td class="n">' + pct(m.r, m.q) + '%</td><td class="n">' + avg(m.lv) + ' / 3</td></tr>'; }).join('') + '</table></div>' : '') +
    '<p class="noprint" style="margin-top:14px"><button class="btn two sm" data-act="csv">⬇ Logboek als Excel-bestand (CSV)</button> <span class="muted">' + S.log.length + ' antwoorden vastgelegd' + (S.lastExport ? ', laatste export ' + S.lastExport.split('-').reverse().join('-') : ', nog niet eerder geëxporteerd') + '</span></p></div>';
}
WACT.csv = () => {
  const rows = ['datum;tijd;vak;onderdeel;niveau;goed;seconden;toets'].concat(S.log.map(e => { const d = new Date(e[0] * 1000), sk = SKILLS[e[1]]; return [dkey(d), d.toTimeString().slice(0, 5), sk ? SUBJ[sk.s].n : '', sk ? sk.n : e[1], e[2], e[3], e[4], e[5] || 0].join(';'); }));
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv' })); a.download = 'logboek-' + dkey() + '.csv'; a.click(); S.lastExport = dkey(); save(); render();
};
document.addEventListener('input', e => { if (e.target.dataset.bind === 'wname') { S.world.name = e.target.value.slice(0, 24); save(); } });
