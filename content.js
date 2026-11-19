'use strict';
/* ===== Hulpjes ===== */
const U = {
  ri: (a, b) => Math.floor(Math.random() * (b - a + 1)) + a,
  pick: a => a[Math.floor(Math.random() * a.length)],
  shuffle: a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  nl: n => { let s = String(Math.round(n * 1000) / 1000); let [i, f] = s.split('.'); if (i.length > 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.'); return f ? i + ',' + f : i; },
  eur: n => '€ ' + n.toFixed(2).replace('.', ','),
  near: (a, b) => Math.abs(a - b) < 1e-6,
  cap: s => s.charAt(0).toUpperCase() + s.slice(1)
};
const fr = (n, d) => '<span class="fr"><sup>' + n + '</sup>&frasl;<sub>' + d + '</sub></span>';
const B = s => '<b>' + s + '</b>';

function mcq(skill, prompt, correct, wrongs, o) {
  const seen = new Set([String(correct)]); const opts = [{ t: correct, ok: true }];
  for (const w of wrongs) { if (w && !seen.has(String(w.t))) { seen.add(String(w.t)); opts.push({ t: w.t, why: w.why }); } if (opts.length === 4) break; }
  return Object.assign({ skill, type: 'mc', prompt, options: U.shuffle(opts), correctText: correct }, o || {});
}
function inq(skill, prompt, answer, o) { return Object.assign({ skill, type: 'num', prompt, answer, correctText: U.nl(answer) }, o || {}); }
function pickItem(n, ctx) {
  if (ctx && ctx.id != null && ctx.id < n) return ctx.id;
  const rec = ((ctx && ctx.recent) || []).slice(-Math.max(1, Math.floor(n * 0.75))); let c = [];
  for (let i = 0; i < n; i++) if (!rec.includes(i)) c.push(i);
  if (!c.length) for (let i = 0; i < n; i++) if (i !== rec[rec.length - 1]) c.push(i);
  return U.pick(c);
}

/* ===== Vakken en vaardigheden ===== */
const SUBJ = {
  rek: { n: 'Rekenen', ic: '🧮', w: 0.30 },
  sp: { n: 'Spelling', ic: '✏️', w: 0.17 },
  ww: { n: 'Werkwoorden', ic: '⚡', w: 0.15 },
  taal: { n: 'Taal & ontleden', ic: '🔍', w: 0.13 },
  lez: { n: 'Begrijpend lezen', ic: '📖', w: 0.15 },
  wsch: { n: 'Woordenschat', ic: '💬', w: 0.10 }
};
const SKILLS = {
  afronden: { s: 'rek', n: 'Afronden', vid: 'afronden', trick: '5 of hoger? Omhoog! 4 of lager? Blijf laag. Kijk alléén naar het cijfer rechts van de plek waarop je afrondt.' },
  kommaKeer: { s: 'rek', n: 'Keer met kommagetallen', vid: 'vermenigvuldigen met kommagetallen', trick: 'Schat eerst met hele getallen. Dan weet je meteen waar de komma ongeveer moet staan.' },
  kommaMin: { s: 'rek', n: 'Min met kommagetallen', vid: 'aftrekken met kommagetallen', trick: 'Eerst de helen eraf, daarna het stukje achter de komma. Twee kleine stapjes zijn makkelijker dan één grote.' },
  procBreuk: { s: 'rek', n: 'Procenten en breuken', vid: 'procenten en breuken', trick: 'Procent betekent "van de 100". 50% = de helft, 25% = een kwart, 10% = één tiende. Die drie ken je uit je hoofd!' },
  deelVan: { s: 'rek', n: 'Deel van een getal', vid: 'breuken deel van een geheel', trick: 'Onder = delen, boven = keer. Eerst delen door de noemer, dan keer de teller.' },
  maten: { s: 'rek', n: 'Maten omrekenen', vid: 'metriek stelsel omrekenen', trick: 'Denk aan het trappetje. Naar een kleinere maat (trap af) wordt het getal groter: ×10 per tree. Trap op: :10 per tree.' },
  korting: { s: 'rek', n: 'Korting en procenten', vid: 'procenten korting berekenen', trick: 'Lees de laatste zin van de som twee keer: vragen ze euro\'s, procenten of de nieuwe prijs?' },
  rechthoek: { s: 'rek', n: 'Omtrek en oppervlakte', vid: 'omtrek en oppervlakte', trick: 'Omtrek = eromheen lopen, dus optellen. Oppervlakte = de vloer vullen, dus lengte × breedte.' },
  verhouding: { s: 'rek', n: 'Verhoudingen', vid: 'verhoudingstabel', trick: 'Maak een verhoudingstabel. Wat je boven doet (×3), doe je onder ook (×3).' },
  breukOrde: { s: 'rek', n: 'Breuken vergelijken', vid: 'breuken vergelijken gelijknamig maken', trick: 'Maak de noemers gelijk. Dan hoef je alleen nog naar de tellers te kijken.' },
  plaatswaarde: { s: 'rek', n: 'Kommagetallen: plaatswaarde', vid: 'kommagetallen plaatswaarde', trick: 'Na de komma: tienden, honderdsten, duizendsten. Elke plek naar rechts is 10× zo klein.' },
  getallenlijn: { s: 'rek', n: 'Getallenlijn', vid: 'getallenlijn kommagetallen', trick: 'Tel de sprongen (niet de streepjes) en reken eerst uit hoe groot één sprong is.' },
  klok: { s: 'rek', n: 'Klokkijken digitaal', vid: 'klokkijken digitaal', trick: 'De kórte wijzer is van de uren. Is het middag of avond? Dan 12 bij de uren optellen.' },
  eenOpDe: { s: 'rek', n: 'Schatten: 1 op de …', vid: 'schattend rekenen', trick: '"1 op de 4" betekent: delen door 4. Rond het grote getal eerst af op een makkelijk getal.' },
  vereenvoudig: { s: 'rek', n: 'Breuken vereenvoudigen', vid: 'breuken vereenvoudigen', trick: 'Deel boven én onder door hetzelfde getal. Eerlijk delen: wat boven gebeurt, gebeurt onder ook.' },
  geld: { s: 'rek', n: 'Rekenen met geld', vid: 'rekenen met geld', trick: 'Tel aan: eerst naar de hele euro, dan naar het briefje. Zo hoef je nooit te lenen.' },
  sp_isch: { s: 'sp', n: 'Woorden op -isch', vid: 'spelling woorden op isch', trick: 'Je hoort -ies, maar je schrijft -isch. Denk aan: fantast-isch!' },
  sp_dubbel: { s: 'sp', n: 'Enkele of dubbele medeklinker', vid: 'spelling open en gesloten lettergrepen', trick: 'Klap het woord in stukjes. Korte klank? Dan twee medeklinkers erachter. Lange klank aan het eind van een stukje? Eén klinker schrijven.' },
  sp_eiau: { s: 'sp', n: 'ei/ij en au/ou', vid: 'spelling ei ij au ou', trick: 'Dit zijn weetwoorden: je kunt het niet horen. Maak een fotootje van het woord in je hoofd.' },
  sp_moeilijk: { s: 'sp', n: 'Lastige leenwoorden', vid: 'spelling leenwoorden', trick: 'Spreek het woord in je hoofd "gek" uit, precies zoals het er staat (tro-toir, ma-chi-ne). Dan vergeet je de rare letters niet.' },
  ww_tt: { s: 'ww', n: 'Tegenwoordige tijd (d/t)', vid: 'werkwoordspelling tegenwoordige tijd', trick: 'De loop-truc: vervang het werkwoord door "lopen". Hoor je "loopt"? Dan stam + t. Hoor je "loop"? Dan alleen de stam.' },
  ww_vt: { s: 'ww', n: 'Verleden tijd', vid: 'werkwoordspelling verleden tijd kofschip', trick: '\'t kofschip: haal -en van het werkwoord af. Zit de laatste letter in \'t kofschip? Dan -te(n). Anders -de(n).' },
  ww_vd: { s: 'ww', n: 'Voltooid deelwoord', vid: 'voltooid deelwoord d of t', trick: 'Maak het woord langer: "de geverfde deur" → je hoort een d. "De gewerkte uren" → je hoort een t.' },
  ont_pv: { s: 'taal', n: 'Persoonsvorm', vid: 'persoonsvorm vinden', trick: 'Zet de zin in een andere tijd. Het woord dat verandert, is de persoonsvorm.' },
  ont_ow: { s: 'taal', n: 'Onderwerp', vid: 'onderwerp vinden', trick: 'Zoek eerst de persoonsvorm. Vraag dan: wie of wat + persoonsvorm? Het antwoord is het onderwerp.' },
  ont_gez: { s: 'taal', n: 'Werkwoordelijk gezegde', vid: 'werkwoordelijk gezegde', trick: 'Verzamel álle werkwoorden uit de zin. Samen vormen ze het gezegde.' },
  ont_ws: { s: 'taal', n: 'Woordsoorten', vid: 'woordsoorten', trick: 'Lidwoord = de, het, een. Voorzetsel = past vóór "de kast" (in, op, onder de kast). Bijvoeglijk naamwoord = zegt iets over een ding.' },
  tv_lees: { s: 'taal', n: 'Hoofdletters en leestekens', vid: 'hoofdletters en leestekens', trick: 'Drie checks: hoofdletter vooraan? Namen met een hoofdletter? Leesteken aan het eind?' },
  lez_hoofd: { s: 'lez', n: 'Hoofdgedachte en doel', vid: 'begrijpend lezen hoofdgedachte', trick: 'Vraag je af: als ik deze tekst in één zin aan een vriendin vertel, wat zeg ik dan? Een detail is nooit de hoofdgedachte.' },
  lez_verband: { s: 'lez', n: 'Verbanden en verwijswoorden', vid: 'begrijpend lezen signaalwoorden verwijswoorden', trick: 'Een verwijswoord wijst bijna altijd terug. Lees de zin ervóór en vul je antwoord in op de plek van het woord.' },
  lez_info: { s: 'lez', n: 'Informatie zoeken, feit en mening', vid: 'begrijpend lezen feit en mening', trick: 'Zoek het antwoord eerst zélf in de tekst en kijk dan pas naar A-B-C-D. Kun je het bewijzen? Feit. Vindt iemand iets? Mening.' },
  wsch: { s: 'wsch', n: 'Woordenschat en spreekwoorden', vid: 'woordenschat groep 7', trick: 'Vul jouw antwoord in de zin in. Klopt de zin nog? Dan zit je goed.' }
};

/* ===== Rekenen ===== */
const GEN = {};
GEN.afronden = l => {
  const c = l === 1 ? { p: 10, nm: 'tiental', lo: 120, hi: 990 } : l === 2 ? U.pick([{ p: 100, nm: 'honderdtal', lo: 1100, hi: 9900 }, { p: 1000, nm: 'duizendtal', lo: 11000, hi: 99000 }]) : { p: 1000, nm: 'duizendtal', lo: 100000, hi: 900000 };
  let n; do { n = U.ri(c.lo, c.hi); } while (n % c.p === 0);
  const ans = Math.round(n / c.p) * c.p, dig = Math.floor((n % c.p) / (c.p / 10)), lo = Math.floor(n / c.p) * c.p, hi = lo + c.p;
  return inq('afronden', 'Rond ' + B(U.nl(n)) + ' af op een ' + B(c.nm) + '.', ans, {
    steps: 'Kijk naar het cijfer rechts van het ' + c.nm + ': dat is een ' + B(dig) + '. ' + (dig >= 5 ? '5 of hoger, dus omhoog.' : '4 of lager, dus omlaag.') + ' Zo wordt ' + U.nl(n) + ' → ' + B(U.nl(ans)) + '.',
    diagnose: a => a === n ? 'Je hebt het getal overgeschreven, maar nog niet afgerond.' :
      (a === lo && dig >= 5) ? 'Je hebt naar beneden afgerond. Maar het cijfer rechts van het ' + c.nm + ' is een ' + dig + ', en bij 5 of hoger ga je juist omhoog.' :
      (a === hi && dig < 5) ? 'Je hebt naar boven afgerond. Maar het cijfer rechts van het ' + c.nm + ' is een ' + dig + ', en bij 4 of lager blijf je laag.' :
      [10, 100, 1000].some(p => p !== c.p && a === Math.round(n / p) * p) ? 'Je hebt wel goed afgerond, maar op een andere plek dan gevraagd. Er stond: afronden op een ' + c.nm + '.' : null
  });
};
GEN.kommaKeer = l => {
  const a = U.ri(l === 1 ? 2 : 3, 9), h = U.ri(1, l === 1 ? 9 : 12), fh = l === 3 ? U.pick([25, 75, 45, 15, 35]) : U.ri(1, 9) * 10;
  const b = h + fh / 100, ans = a * (h * 100 + fh) / 100;
  return inq('kommaKeer', 'Reken uit: ' + B(a + ' × ' + U.nl(b)), ans, {
    steps: 'Splits het kommagetal: ' + a + ' × ' + h + ' = ' + a * h + ' en ' + a + ' × ' + U.nl(fh / 100) + ' = ' + U.nl(a * fh / 100) + '. Samen: ' + B(U.nl(ans)) + '.',
    diagnose: x => (U.near(x, ans * 10) || U.near(x, ans / 10) || U.near(x, ans * 100)) ? 'De cijfers kloppen, maar de komma staat op de verkeerde plek. Schat eerst: ' + a + ' × ' + h + ' = ' + a * h + ', dus het antwoord moet daar in de buurt liggen.' :
      U.near(x, a * h) ? 'Je hebt alleen ' + a + ' × ' + h + ' gedaan. Het stukje achter de komma (' + U.nl(fh / 100) + ') moet óók keer ' + a + '.' :
      U.near(x, a * h + fh / 100) ? 'Je hebt de helen keer ' + a + ' gedaan, maar het stukje achter de komma gewoon overgeschreven. Dat stukje moet ook keer ' + a + '.' : null
  });
};
GEN.kommaMin = l => {
  const a = U.ri(l === 1 ? 10 : 20, l === 1 ? 40 : 90), h = U.ri(2, 9), f = l === 1 ? 50 : l === 2 ? U.pick([50, 25, 75]) : U.pick([35, 65, 45, 85, 15]);
  const b = h + f / 100, ans = (a * 100 - h * 100 - f) / 100;
  return inq('kommaMin', 'Reken uit: ' + B(a + ' − ' + U.nl(b)), ans, {
    steps: 'Eerst de helen: ' + a + ' − ' + h + ' = ' + (a - h) + '. Dan nog ' + U.nl(f / 100) + ' eraf: ' + B(U.nl(ans)) + '.',
    diagnose: x => U.near(x, a - h + f / 100) ? 'Je deed ' + a + ' − ' + h + ' = ' + (a - h) + ' en plakte toen ' + U.nl(f / 100).slice(1) + ' erachter. Maar dat stukje moet er ook nog áf. Je komt dus ónder de ' + (a - h) + ' uit.' :
      U.near(x, a - h) ? 'Je hebt alleen de helen afgetrokken. Het stukje ' + U.nl(f / 100) + ' moet er ook nog af.' :
      U.near(x, a + b) ? 'Je hebt opgeteld in plaats van afgetrokken. Kijk goed naar het teken in de som.' : null
  });
};
GEN.procBreuk = l => {
  const T = [[50, 1, 2], [25, 1, 4], [75, 3, 4], [10, 1, 10], [20, 1, 5], [40, 2, 5], [60, 3, 5], [80, 4, 5], [30, 3, 10], [70, 7, 10], [5, 1, 20], [12.5, 1, 8]];
  const pool = l === 1 ? T.slice(0, 5) : l === 2 ? T.slice(0, 10) : T, t = U.pick(pool), others = U.shuffle(T.filter(x => x !== t));
  const g = t[0] === 12.5 ? 12.5 : 100 / t[2];
  if (l >= 2 && Math.random() < 0.4) return mcq('procBreuk', 'Hoeveel procent is ' + fr(t[1], t[2]) + ' deel?', U.nl(t[0]) + '%', others.map(o => ({ t: U.nl(o[0]) + '%', why: U.nl(o[0]) + '% hoort bij ' + fr(o[1], o[2]) + ', niet bij ' + fr(t[1], t[2]) + '.' })), { steps: fr(1, t[2]) + ' deel is 100 : ' + t[2] + ' = ' + U.nl(100 / t[2]) + '%. Je hebt er ' + t[1] + ' van, dus ' + t[1] + ' × ' + U.nl(100 / t[2]) + ' = ' + B(U.nl(t[0]) + '%') + '.' });
  return mcq('procBreuk', 'Welke breuk hoort bij ' + B(U.nl(t[0]) + '%') + '?', fr(t[1], t[2]), others.map(o => ({ t: fr(o[1], o[2]), why: 'Deze breuk is ' + U.nl(o[0]) + '%. Je zocht ' + U.nl(t[0]) + '%.' })), { steps: U.nl(t[0]) + '% betekent ' + U.nl(t[0]) + ' van de 100. Deel boven en onder door ' + U.nl(g) + ' en je krijgt ' + fr(t[1], t[2]) + '.' });
};
GEN.deelVan = l => {
  const d = U.pick(l === 1 ? [2, 3, 4, 5] : l === 2 ? [4, 5, 8, 10] : [6, 8, 9, 12]), n = d === 2 ? 1 : U.ri(l === 1 ? 1 : 2, d - 1), q = U.ri(2, l === 3 ? 20 : 9), X = d * q, ans = n * q;
  const ctx = U.pick([null, ['Bij de voetbalclub trainen ' + X + ' kinderen. ', ' deel is verdediger. Hoeveel verdedigers zijn er?'], ['In de doos zitten ' + X + ' kleurpotloden. ', ' deel heeft al een punt. Hoeveel potloden zijn dat?'], ['Een kickbokstraining bestaat uit ' + X + ' oefeningen. ', ' deel is traptechniek. Hoeveel oefeningen zijn dat?']]);
  const p = ctx ? ctx[0] + fr(n, d) + ctx[1] : 'Reken uit: ' + fr(n, d) + ' deel van ' + B(X);
  return inq('deelVan', p, ans, {
    steps: 'Eerst delen door de noemer: ' + X + ' : ' + d + ' = ' + q + '. Dat is ' + fr(1, d) + ' deel. Dan keer de teller: ' + n + ' × ' + q + ' = ' + B(ans) + '.',
    diagnose: x => (x === q && n > 1) ? 'Je hebt gedeeld door ' + d + '. Dat is goed, maar dan heb je pas ' + fr(1, d) + ' deel. Je moet nog keer ' + n + ' doen.' :
      x === X * n ? 'Je hebt alleen keer ' + n + ' gedaan. Vergeet niet eerst te delen door ' + d + '.' :
      x === X - ans ? 'Je hebt uitgerekend wat er óverblijft. De vraag was het deel zelf.' : null
  });
};
GEN.maten = l => {
  const T = [['liter', 'dl', 10, 1], ['liter', 'cl', 100, 2], ['liter', 'ml', 1000, 3], ['kg', 'gram', 1000, 3], ['m', 'cm', 100, 2], ['km', 'm', 1000, 3], ['cm', 'mm', 10, 1], ['m', 'dm', 10, 1],
    ['dl', 'liter', 0.1, 1], ['cl', 'liter', 0.01, 2], ['ml', 'liter', 0.001, 3], ['gram', 'kg', 0.001, 3], ['cm', 'm', 0.01, 2], ['m', 'km', 0.001, 3], ['mm', 'cm', 0.1, 1]];
  const t = U.pick(l === 1 ? T.slice(0, 8) : T); let v, ans;
  if (t[2] >= 1) { ans = U.pick(l === 1 ? [30, 250, 600, 1500, 2500, 3000, 45, 8000] : [25, 60, 250, 340, 600, 1500, 1658, 2500, 45, 750]); v = ans / t[2]; }
  else { v = U.pick([250, 600, 1500, 75, 3400, 40, 125]); ans = Math.round(v * t[2] * 1000) / 1000; }
  const big = t[2] >= 1, fac = big ? t[2] : Math.round(1 / t[2]);
  return inq('maten', B(U.nl(v) + ' ' + t[0]) + ' = … ' + t[1], ans, {
    unit: t[1],
    steps: 'Van ' + t[0] + ' naar ' + t[1] + ' is ' + t[3] + (t[3] === 1 ? ' tree' : ' treden') + ' op het trappetje. ' + (big ? 'Je gaat naar een kleinere maat, dus ×' + fac : 'Je gaat naar een grotere maat, dus :' + fac) + '. ' + U.nl(v) + (big ? ' × ' : ' : ') + fac + ' = ' + B(U.nl(ans) + ' ' + t[1]) + '.',
    diagnose: x => { if (!(x > 0)) return null; const r = x / ans, lg = Math.log10(r); if (U.near(lg, Math.round(lg)) && Math.round(lg) !== 0) { return U.near(r, 1 / (t[2] * t[2])) ? 'Je hebt de verkeerde kant op gerekend. ' + (big ? 'Een ' + t[1] + ' is kleiner dan een ' + t[0] + ', dus er passen er méér in: het getal wordt groter.' : 'Een ' + t[0] + ' is kleiner dan een ' + t[1] + ', dus het getal wordt juist kleiner.') : 'Je rekende de goede kant op, maar je nam niet het goede aantal treden. Van ' + t[0] + ' naar ' + t[1] + ' is het ' + (big ? '×' : ':') + fac + '.'; } return null; }
  });
};
GEN.korting = l => {
  const it = U.pick(['een paar voetbalschoenen', 'een paar bokshandschoenen', 'een voetbalshirt', 'een set scheenbeschermers', 'een sporttas', 'een trainingspak', 'een bokszak', 'een keepersshirt']);
  let P, pct, K; do { P = U.pick([20, 40, 50, 60, 80, 120, 200]); pct = U.pick(l === 1 ? [10, 20, 25, 50] : [5, 10, 15, 20, 25, 30, 40, 75]); K = P * pct / 100; } while (K !== Math.round(K));
  const N = P - K, kind = l === 1 ? 'bedrag' : l === 2 ? U.pick(['bedrag', 'procent']) : U.pick(['procent', 'nieuw']);
  if (kind === 'bedrag') return inq('korting', U.cap(it) + ' kost € ' + P + '. Je krijgt ' + B(pct + '% korting') + '. Hoeveel euro korting is dat?', K, { pre: '€', steps: '1% van € ' + P + ' is € ' + U.nl(P / 100) + '. ' + pct + '% is dus ' + pct + ' × ' + U.nl(P / 100) + ' = ' + B('€ ' + K) + '.', diagnose: x => x === N ? 'Dat is de nieuwe prijs. De vraag was: hoeveel euro kórting krijg je?' : x === pct ? 'Dat is het percentage. 10% is niet hetzelfde als € 10; je moet het percentage van de prijs nemen.' : null });
  if (kind === 'procent') return inq('korting', 'De prijs van ' + it + ' is verlaagd van € ' + P + ' naar € ' + N + '. Hoeveel ' + B('procent') + ' korting is dat?', pct, { unit: '%', steps: 'De korting is ' + P + ' − ' + N + ' = € ' + K + '. 1% van € ' + P + ' is € ' + U.nl(P / 100) + '. Hoe vaak past dat in € ' + K + '? ' + K + ' : ' + U.nl(P / 100) + ' = ' + B(pct + '%') + '.', diagnose: x => x === K ? 'Dat is de korting in euro\'s. De vraag was hoeveel procént dat is van de oude prijs.' : U.near(x, N / P * 100) ? 'Dat is het deel dat je nog betáált. De korting is de rest: 100% − ' + U.nl(N / P * 100) + '%.' : null });
  return inq('korting', U.cap(it) + ' kost € ' + P + '. Er gaat ' + pct + '% korting af. Wat is de ' + B('nieuwe prijs') + '?', N, { pre: '€', steps: 'Korting: ' + pct + '% van € ' + P + ' = € ' + K + '. Nieuwe prijs: ' + P + ' − ' + K + ' = ' + B('€ ' + N) + '.', diagnose: x => x === K ? 'Dat is alleen de korting. Trek die nog van de oude prijs af.' : x === P - pct ? 'Je hebt ' + pct + ' euro van de prijs afgehaald, maar het is ' + pct + ' procént. Reken eerst uit hoeveel euro dat is.' : null });
};
GEN.rechthoek = l => {
  const nm = U.pick(['voetbalveldje', 'trainingsveld', 'boksring', 'sportzaal', 'gymmat']), cm = nm === 'schildersdoek';
  let a = U.ri(l === 1 ? 4 : 12, l === 1 ? 12 : 40), b = U.ri(3, l === 1 ? 9 : 20); if (l === 3) b += 0.5; if (a === b) a += 2;
  const om = 2 * (a + b), op = a * b, ask = U.pick(['omtrek', 'oppervlakte']), u = cm ? 'cm' : 'm';
  return inq('rechthoek', 'Een ' + nm + ' is ' + U.nl(a) + ' ' + u + ' lang en ' + U.nl(b) + ' ' + u + ' breed. Wat is de ' + B(ask) + '?', ask === 'omtrek' ? om : op, {
    unit: ask === 'omtrek' ? u : u + '²',
    steps: ask === 'omtrek' ? 'Loop eromheen: ' + U.nl(a) + ' + ' + U.nl(b) + ' + ' + U.nl(a) + ' + ' + U.nl(b) + ' = ' + B(U.nl(om) + ' ' + u) + '.' : 'Lengte × breedte: ' + U.nl(a) + ' × ' + U.nl(b) + ' = ' + B(U.nl(op) + ' ' + u + '²') + '.',
    diagnose: x => (ask === 'omtrek' && U.near(x, op)) ? 'Je hebt lengte × breedte gedaan. Dat is de oppervlakte (de vloer). De omtrek is de rand eromheen: alle vier de zijden optellen.' :
      (ask === 'oppervlakte' && U.near(x, om)) ? 'Je hebt de zijden opgeteld. Dat is de omtrek (de rand). De oppervlakte is lengte × breedte.' :
      (ask === 'omtrek' && U.near(x, a + b)) ? 'Je hebt maar twee zijden opgeteld. Een rechthoek heeft er vier, dus je bent pas halverwege.' : null
  });
};
GEN.verhouding = l => {
  if (Math.random() < 0.5) {
    const P = U.pick([6, 7.5, 8, 9, 12]), A = U.pick([8, 10, 12, 16]), k = U.ri(2, l === 1 ? 3 : 5), Bm = A * k;
    return mcq('verhouding', 'Een pot verf kost ' + U.eur(P) + '. Daarmee schilder je ' + A + ' m² clubhuismuur. Hoeveel betaal je voor ' + B(Bm + ' m²') + '?', U.eur(P * k), [
      { t: U.eur(P), why: 'Dat is de prijs van één pot. Voor ' + Bm + ' m² heb je ' + k + ' potten nodig.' },
      { t: U.eur(k), why: k + ' is het áántal potten dat je nodig hebt. Je moet nog keer de prijs van een pot doen.' },
      { t: U.eur(P * (k + 1)), why: 'Je hebt één pot te veel gerekend. ' + Bm + ' : ' + A + ' = ' + k + ' potten.' },
      { t: U.eur(P * Bm), why: 'Je hebt de prijs keer alle vierkante meters gedaan. Maar één pot is genoeg voor ' + A + ' m², niet voor 1 m².' }
    ], { steps: 'Hoeveel potten? ' + Bm + ' : ' + A + ' = ' + k + '. Dus ' + k + ' × ' + U.eur(P) + ' = ' + B(U.eur(P * k)) + '.' });
  }
  const T = U.pick(l === 1 ? [2, 0.5] : [0.5, 1.5, 2, 2.5]), v = U.pick([8, 10, 12, 14, 16, 20, 30, 60, 90]), D = v * T;
  const tt = T === 0.5 ? 'een half uur' : T === 1.5 ? 'anderhalf uur' : U.nl(T) + ' uur';
  return mcq('verhouding', (v > 25 ? 'De spelersbus rijdt ' : 'Een hardloopster loopt ') + U.nl(D) + ' km in ' + tt + '. Hoeveel km is dat gemiddeld ' + B('per uur') + '?', U.nl(v) + ' km per uur', [
    { t: U.nl(D) + ' km per uur', why: 'Dat is de hele afstand. Die werd in ' + tt + ' gereden, niet in precies één uur.' },
    { t: U.nl(D * T) + ' km per uur', why: 'Je hebt vermenigvuldigd. "Per uur" betekent: terugrekenen naar 1 uur.' },
    { t: U.nl(T < 1 ? D / 2 : v * 2) + ' km per uur', why: 'Maak een verhoudingstabel: ' + U.nl(D) + ' km hoort bij ' + U.nl(T) + ' uur. Welke afstand hoort dan bij 1 uur?' },
    { t: U.nl(v + 5) + ' km per uur', why: 'Bijna, maar reken het precies na met een verhoudingstabel.' }
  ], { steps: 'Verhoudingstabel: ' + U.nl(D) + ' km in ' + U.nl(T) + ' uur. ' + (T < 1 ? 'Naar 1 uur is ×2' : 'Naar 1 uur is :' + U.nl(T)) + ', dus ' + B(U.nl(v) + ' km per uur') + '.' });
};
GEN.breukOrde = l => {
  const pool = l === 1 ? [[1, 2], [1, 4], [3, 4], [1, 10], [9, 10], [1, 5]] : [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10], [3, 10], [7, 10], [9, 10], [3, 20], [7, 20], [11, 20]];
  const f = U.shuffle(pool).slice(0, 3), val = x => x[0] / x[1], srt = f.slice().sort((x, y) => val(x) - val(y));
  const show = a => a.map(x => fr(x[0], x[1])).join(' &nbsp;–&nbsp; '), tw = x => x[0] * 20 / x[1];
  const perms = [[2, 1, 0], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1]].map(p => p.map(i => srt[i]));
  const wr = perms.map((p, i) => { let why; if (i === 0) why = 'Dit is van groot naar klein. Er werd gevraagd: van klein naar groot.'; else { const j = val(p[0]) > val(p[1]) ? 0 : 1; why = fr(p[j][0], p[j][1]) + ' staat hier vóór ' + fr(p[j + 1][0], p[j + 1][1]) + '. Maar ' + fr(p[j][0], p[j][1]) + ' = ' + fr(tw(p[j]), 20) + ' en ' + fr(p[j + 1][0], p[j + 1][1]) + ' = ' + fr(tw(p[j + 1]), 20) + ', dus die eerste is groter.'; } return { t: show(p), why }; });
  return mcq('breukOrde', 'In welke rij staan de breuken van ' + B('klein naar groot') + '?', show(srt), [wr[0]].concat(U.shuffle(wr.slice(1))), { steps: 'Maak ze gelijknamig, allemaal twintigsten: ' + srt.map(x => fr(x[0], x[1]) + ' = ' + fr(tw(x), 20)).join(', ') + '. Nu zie je de volgorde aan de tellers.' });
};
GEN.plaatswaarde = l => {
  const dg = U.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 5), np = l === 1 ? 3 : l === 2 ? 4 : 5;
  const PL = [[10, 'tientallen'], [1, 'eenheden'], [0.1, 'tienden'], [0.01, 'honderdsten'], [0.001, 'duizendsten']];
  let n = 0; for (let i = 0; i < np; i++) n += dg[i] * PL[i][0];
  const ti = U.ri(l === 1 ? 0 : 1, np - 1), d = dg[ti], lab = i => U.nl(d * PL[i][0]) + ' (' + d + ' ' + PL[i][1] + ')';
  const wr = U.shuffle([0, 1, 2, 3, 4].filter(i => i !== ti)).map(i => ({ t: lab(i), why: 'Dat zou kloppen als de ' + d + ' op de plek van de ' + PL[i][1] + ' stond. Tel de plekken vanaf de komma: links de eenheden en tientallen, rechts eerst tienden, dan honderdsten, dan duizendsten.' }));
  return mcq('plaatswaarde', 'Hoeveel is de ' + B(d) + ' waard in het getal ' + B(U.nl(n)) + '?', lab(ti), wr, { steps: 'De ' + d + ' staat op de plek van de ' + PL[ti][1] + '. Dus is die ' + B(U.nl(d * PL[ti][0])) + ' waard.' });
};
GEN.getallenlijn = l => {
  let A, step, parts, k;
  if (l === 1) { A = U.ri(2, 20); step = 0.1; parts = 10; k = U.ri(1, 9); }
  else if (l === 2) { A = U.ri(2, 12); step = U.pick([0.2, 0.5, 0.25]); parts = 10; k = U.ri(1, 9); }
  else { A = U.ri(2, 9) + U.ri(1, 9) / 10 + 0.05; if (Math.random() < 0.5) { step = 0.5; parts = 2; k = 1; } else { step = 0.25; parts = 4; k = U.pick([1, 3]); } }
  const Bv = A + parts * step, ans = Math.round((A + k * step) * 1000) / 1000;
  let svg = '<svg class="nline" viewBox="0 0 340 70" role="img" aria-label="getallenlijn"><line x1="20" y1="40" x2="320" y2="40"/>';
  for (let i = 0; i <= parts; i++) { const x = 20 + 300 * i / parts; svg += '<line x1="' + x + '" y1="' + (i % parts === 0 ? 28 : 33) + '" x2="' + x + '" y2="' + (i % parts === 0 ? 52 : 47) + '"/>'; }
  const ax = 20 + 300 * k / parts;
  svg += '<path class="arrow" d="M' + (ax - 7) + ' 10 L' + (ax + 7) + ' 10 L' + ax + ' 26Z"/><text x="20" y="67" text-anchor="middle">' + U.nl(A) + '</text><text x="320" y="67" text-anchor="middle">' + U.nl(Bv) + '</text></svg>';
  return inq('getallenlijn', 'Welk getal hoort op de plek van de pijl?' + svg, ans, {
    steps: 'Van ' + U.nl(A) + ' tot ' + U.nl(Bv) + ' is ' + U.nl(Bv - A) + '. Dat stuk is verdeeld in ' + parts + ' gelijke sprongen, dus één sprong is ' + U.nl(step) + '. De pijl staat ' + k + (k === 1 ? ' sprong' : ' sprongen') + ' na ' + U.nl(A) + ': ' + B(U.nl(ans)) + '.',
    diagnose: x => (step !== 0.1 && U.near(x, A + k * 0.1)) ? 'Je ging ervan uit dat elke sprong 0,1 is. Dat is niet altijd zo. Reken eerst uit hoe groot één sprong hier is.' : (U.near(x, A + (k + 1) * step) || U.near(x, A + (k - 1) * step)) ? 'Je zit één sprong ernaast. Tel de sprongen (de boogjes tussen de streepjes), niet de streepjes zelf.' : null
  });
};
GEN.klok = l => {
  const part = l === 1 ? U.pick(['ochtend', 'middag']) : U.pick(['ochtend', 'middag', 'avond', 'avond']);
  const h = part === 'middag' ? U.ri(1, 5) : U.ri(6, 11), m = l === 1 ? U.pick([0, 15, 30, 45]) : U.ri(0, 11) * 5, add = part === 'ochtend' ? 0 : 12;
  const f = (hh, mm) => String((hh + 24) % 24).padStart(2, '0') + ':' + String(mm).padStart(2, '0') + ' uur';
  const ha = (h % 12 + m / 60) * 30, ma = m * 6, pt = (ang, r) => (50 + r * Math.sin(ang * Math.PI / 180)).toFixed(1) + '" y2="' + (50 - r * Math.cos(ang * Math.PI / 180)).toFixed(1);
  let svg = '<svg class="clock" viewBox="0 0 100 100" role="img" aria-label="klok"><circle cx="50" cy="50" r="46"/>';
  for (let i = 0; i < 12; i++) svg += '<line class="tk" x1="50" y1="8" x2="50" y2="' + (i % 3 === 0 ? 15 : 12) + '" transform="rotate(' + i * 30 + ' 50 50)"/>';
  svg += '<text x="50" y="25">12</text><text x="80" y="54">3</text><text x="50" y="84">6</text><text x="20" y="54">9</text><line class="hh" x1="50" y1="50" x2="' + pt(ha, 24) + '"/><line class="mh" x1="50" y1="50" x2="' + pt(ma, 36) + '"/><circle class="dot" cx="50" cy="50" r="3"/></svg>';
  const ot = part === 'ochtend' ? "'s avonds" : "'s ochtends";
  const wr = [
    { t: f(h + (add ? 0 : 12), m), why: 'De wijzers heb je goed gelezen, maar dit is de tijd ' + ot + '. Er stond: het is ' + part + '. ' + (add ? 'Na 12 uur \'s middags tel je 12 bij de uren op.' : '\'s Ochtends tel je er niets bij op.') },
    { t: f(h + add + (m >= 30 ? 1 : -1), m), why: 'Kijk goed naar de korte wijzer. Die staat tussen de ' + h + ' en de ' + (h % 12 + 1) + '. Het uur is pas voorbij als de lange wijzer weer op de 12 staat, dus het is nog ' + h + ' uur en een stukje.' },
    { t: f((m / 5 || 12) + add, (h % 12) * 5), why: 'Je hebt de wijzers omgewisseld. De kórte wijzer wijst de uren aan, de lánge de minuten.' },
    { t: f(h + add, (m + 30) % 60), why: 'De minuten kloppen niet. Elke stip op de klok is 5 minuten: tel vanaf de 12 in stapjes van vijf.' }
  ];
  return mcq('klok', 'Het is ' + B(part) + '. Welke tijd geeft een digitale klok aan?' + svg, f(h + add, m), wr, { steps: 'De korte wijzer is de ' + h + ' voorbij, dus ' + h + ' uur. De lange wijzer wijst ' + m + ' minuten aan. ' + (add ? 'Het is ' + part + ', dus ' + h + ' + 12 = ' + (h + 12) + '.' : 'Het is ochtend, dus er komt niets bij.') + ' Antwoord: ' + B(f(h + add, m)) + '.' });
};
GEN.eenOpDe = l => {
  const k = U.pick(l === 1 ? [2, 4, 5] : [3, 4, 5, 8]), place = l === 1 ? 10 : 100, q = U.pick(l === 1 ? [20, 30, 40, 50, 60] : [100, 200, 300, 400]);
  const N = k * q + (Math.random() < 0.5 ? -1 : 1) * U.ri(l === 1 ? 1 : 3, l === 1 ? k * 3 : k * 20), pn = place === 10 ? 'tiental' : 'honderdtal';
  const c = U.pick([['toeschouwers in het stadion', 'koopt een sjaal'], ['kinderen op de voetbalclub', 'is linksbenig'], ['leden van de sportschool', 'doet aan kickboksen'], ['supporters bij de wedstrijd', 'draagt een clubshirt']]);
  return inq('eenOpDe', 'Van de ' + U.nl(N) + ' ' + c[0] + ' geldt: ongeveer ' + B('1 op de ' + k) + ' ' + c[1] + '. Ongeveer hoeveel zijn dat? Rond af op een ' + pn + '.', q, {
    steps: 'Rond ' + U.nl(N) + ' af op een getal dat je makkelijk door ' + k + ' kunt delen: ' + U.nl(k * q) + '. Dan ' + U.nl(k * q) + ' : ' + k + ' = ' + B(q) + '.',
    diagnose: x => x === Math.round(N / place) * place ? 'Je hebt alleen afgerond. "1 op de ' + k + '" betekent dat je ook nog door ' + k + ' moet delen.' : x === Math.round(N / k) ? 'Je hebt heel precies gerekend. Knap, maar de vraag was "ongeveer", afgerond op een ' + pn + '. Schatten gaat veel sneller.' : x === k * q ? 'Dat is het afgeronde totaal. Deel dat nog door ' + k + '.' : null
  });
};
GEN.vereenvoudig = l => {
  if (Math.random() < 0.5) {
    const n = U.ri(2, l === 1 ? 4 : 7), k = U.ri(2, 9);
    return inq('vereenvoudig', fr(n, n * k) + ' is hetzelfde als 1 op de …', k, { pre: '1 op de', steps: 'Deel boven en onder door ' + n + ': ' + n + ' : ' + n + ' = 1 en ' + n * k + ' : ' + n + ' = ' + k + '. Dus ' + fr(1, k) + ', oftewel ' + B('1 op de ' + k) + '.', diagnose: x => x === n * k ? 'Dat is de noemer die er al stond. Je moet de breuk eerst kleiner maken, tot er een 1 boven staat.' : x === n * k - n ? 'Je hebt afgetrokken. Bij vereenvoudigen deel je boven en onder door hetzelfde getal.' : null });
  }
  const P = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5]], p = U.pick(P), m = U.ri(2, l === 1 ? 3 : 6), a = p[0], b = p[1];
  return mcq('vereenvoudig', 'Welke breuk is evenveel als ' + fr(a * m, b * m) + '?', fr(a, b), [
    { t: fr(a, b * m), why: 'Je hebt alleen de teller door ' + m + ' gedeeld. De noemer moet óók door ' + m + '.' },
    { t: fr(a * m - 1, b * m - 1), why: 'Je hebt er boven en onder 1 afgehaald. Dat mag niet: bij vereenvoudigen deel je, je trekt niet af.' },
    { t: fr(b, a), why: 'Je hebt de breuk omgedraaid. De kleinste van de twee getallen blijft boven staan.' },
    { t: fr(a + 1, b + 1), why: 'Deze breuk is niet even groot. Deel ' + a * m + ' en ' + b * m + ' allebei door ' + m + '.' }
  ], { steps: 'Zoek een getal waar ' + a * m + ' en ' + b * m + ' allebei door te delen zijn: ' + m + '. ' + a * m + ' : ' + m + ' = ' + a + ' en ' + b * m + ' : ' + m + ' = ' + b + '. Dus ' + fr(a, b) + '.' });
};
GEN.geld = l => {
  const it = U.pick(['een bidon', 'een paar sportsokken', 'een springtouw', 'een bitje', 'een sleutelhanger van de club', 'een zweetbandje']);
  const c = () => U.ri(3, 9) * 100 + U.ri(1, 19) * 5; let P = c(); const two = l === 3; let P2 = two ? c() : 0;
  const paid = (P + P2) > 1000 ? 2000 : U.pick(l === 1 ? [1000] : [1000, 2000]), ans = (paid - P - P2) / 100, e = x => U.eur(x / 100);
  return inq('geld', two ? '{naam} koopt ' + it + ' van ' + e(P) + ' en een handdoek van ' + e(P2) + '. Ze betaalt met ' + e(paid) + '. Hoeveel krijgt ze terug?' : '{naam} koopt ' + it + ' van ' + e(P) + '. Ze betaalt met een briefje van ' + e(paid) + '. Hoeveel krijgt ze terug?', ans, {
    pre: '€', correctText: e(paid - P - P2).slice(2),
    steps: (two ? 'Samen kost het ' + e(P + P2) + '. ' : '') + 'Tel aan vanaf ' + e(P + P2) + ': eerst naar de hele euro (' + e(Math.ceil((P + P2) / 100) * 100) + '), dat is ' + e(Math.ceil((P + P2) / 100) * 100 - P - P2) + '. Dan naar ' + e(paid) + ', dat is nog ' + e(paid - Math.ceil((P + P2) / 100) * 100) + '. Samen: ' + B(e(paid - P - P2)) + '.',
    diagnose: x => U.near(x, ans + 1) ? 'Je zit precies één euro te hoog. Dat gebeurt als je de euro\'s en de centen apart aftrekt. Tel liever aan: eerst naar de hele euro, dan naar het briefje.' : (two && (U.near(x, (paid - P) / 100) || U.near(x, (paid - P2) / 100))) ? 'Je hebt maar één van de twee spullen afgerekend. Tel eerst alles op wat ze koopt.' : U.near(x, (P + P2) / 100) ? 'Dat is wat het kost. De vraag is hoeveel ze terúgkrijgt.' : null
  });
};

/* ===== Spelling ===== */
const ISCH = ['elektrisch', 'historisch', 'komisch', 'allergisch', 'vegetarisch', 'fantastisch', 'automatisch', 'praktisch', 'tragisch', 'magisch', 'logisch', 'tropisch', 'typisch', 'kritisch', 'dramatisch', 'romantisch', 'medisch', 'technisch', 'exotisch', 'elastisch', 'realistisch', 'optimistisch', 'chaotisch'];
const DUB = [
  ['millimeter', ['milimeter', 'millimetter'], 'mil-li-me-ter: korte i → dubbele l. De e van "me" is lang en staat aan het eind van het stukje → één e en één t.'],
  ['overwinning', ['overwining', 'overwinnig'], 'o-ver-win-ning: korte i → dubbele n.'],
  ['beloning', ['belonning', 'belooning'], 'be-lo-ning: de o is lang en staat aan het eind van het stukje → één o, één n.'],
  ['winnares', ['winares', 'winnaares'], 'win-na-res: korte i → dubbele n. De a is lang aan het eind van het stukje → één a.'],
  ['beslissing', ['beslising', 'beslissink'], 'be-slis-sing: korte i → dubbele s.'],
  ['verzameling', ['verzammeling', 'verzaameling'], 'ver-za-me-ling: de a is lang aan het eind van het stukje → één a, één m.'],
  ['evenaar', ['evvenaar', 'eevenaar'], 'e-ve-naar: de eerste e is lang aan het eind van het stukje → één e, één v.'],
  ['kalender', ['kallender', 'kaalender'], 'ka-len-der: de a staat aan het eind van het stukje → één a, één l.'],
  ['betaling', ['betalling', 'betaaling'], 'be-ta-ling: lange a aan het eind van het stukje → één a, één l.'],
  ['ontploffing', ['ontplofing', 'ontplovving'], 'ont-plof-fing: korte o → dubbele f.'],
  ['programma', ['programa', 'proggramma'], 'pro-gram-ma: korte a → dubbele m.'],
  ['uitdrukking', ['uitdruking', 'uitdrukkink'], 'uit-druk-king: korte u → dubbele k.'],
  ['ontdekker', ['ontdeker', 'ondekker'], 'ont-dek-ker: korte e → dubbele k. En het is ont + dekken, dus de t blijft staan.'],
  ['planeten', ['planneten', 'planeeten'], 'pla-ne-ten: lange e aan het eind van het stukje → één e, één t.'],
  ['vergissing', ['vergising', 'vergiesing'], 'ver-gis-sing: korte i → dubbele s.'],
  ['bemanning', ['bemaning', 'bemaaning'], 'be-man-ning: korte a → dubbele n.'],
  ['bonnetje', ['bonetje', 'bonnentje'], 'bon-ne-tje: korte o → dubbele n.'],
  ['galopperen', ['galoperen', 'gallopperen'], 'ga-lop-pe-ren: korte o → dubbele p. De eerste a staat aan het eind van het stukje → één l.'],
  ['penselen', ['pensselen', 'penseelen'], 'pen-se-len: lange e aan het eind van het stukje → één e, één l.'],
  ['tekening', ['tekenning', 'teekening'], 'te-ke-ning: lange e aan het eind van het stukje → één e, één k.'],
  ['koppig', ['kopig', 'koppug'], 'kop-pig: korte o → dubbele p.'],
  ['draven', ['dravven', 'draaven'], 'dra-ven: lange a aan het eind van het stukje → één a, één v.'],
  ['hoefijzers', ['hoefeizers', 'hoeffijzers'], 'hoef + ijzer: twee woorden aan elkaar. IJzer schrijf je met een lange ij.'],
  ['stallen', ['stalen', 'staallen'], 'stal-len: korte a → dubbele l. (Stalen met één l is iets anders: van staal gemaakt.)'],
  ['manege', ['mannege', 'maneege'], 'ma-ne-ge: een Frans leenwoord. Eén n, en -ge aan het eind klinkt als "zje".'],
  ['appels', ['apels', 'appells'], 'ap-pels: korte a → dubbele p.'],
  ['wortelen', ['wortellen', 'wortelden'], 'wor-te-len: de e in "te" is een stomme e, daarna komt één l.']
];
const EIAU = [['schilderij', 'schilder_', 'ij', 'ei'], ['hoefijzer', 'hoef_zer', 'ij', 'ei'], ['paleis', 'pal_s', 'ei', 'ij'], ['fontein', 'font_n', 'ei', 'ij'], ['wedstrijd', 'wedstr_d', 'ij', 'ei'], ['kapitein', 'kapit_n', 'ei', 'ij'], ['prijs', 'pr_s', 'ij', 'ei'], ['reis', 'r_s', 'ei', 'ij'], ['geheim', 'geh_m', 'ei', 'ij'], ['twijfel', 'tw_fel', 'ij', 'ei'], ['meisje', 'm_sje', 'ei', 'ij'], ['strijken', 'str_ken', 'ij', 'ei'], ['eindelijk', '_ndelijk', 'ei', 'ij'], ['terrein', 'terr_n', 'ei', 'ij'], ['wijzer', 'w_zer', 'ij', 'ei'], ['weide', 'w_de', 'ei', 'ij'], ['blauw', 'bl_w', 'au', 'ou'], ['gauw', 'g_w', 'au', 'ou'], ['kauwen', 'k_wen', 'au', 'ou'], ['pauze', 'p_ze', 'au', 'ou'], ['applaus', 'appl_s', 'au', 'ou'], ['goud', 'g_d', 'ou', 'au'], ['schouder', 'sch_der', 'ou', 'au'], ['trouw', 'tr_w', 'ou', 'au'], ['mouw', 'm_w', 'ou', 'au'], ['nauwkeurig', 'n_wkeurig', 'au', 'ou'], ['benauwd', 'ben_wd', 'au', 'ou'], ['kabouter', 'kab_ter', 'ou', 'au'], ['touw', 't_w', 'ou', 'au'], ['flauw', 'fl_w', 'au', 'ou'], ['houten', 'h_ten', 'ou', 'au'], ['saus', 's_s', 'au', 'ou']];
const MOEI = [['politie', ['polietsie', 'politsie']], ['vakantie', ['vakansie', 'vakantsie']], ['informatie', ['informasie', 'informatsie']], ['circus', ['sirkus', 'cirkus']], ['citroen', ['sitroen', 'citroun']], ['concert', ['konsert', 'consert']], ['centrum', ['sentrum', 'centrem']], ['theater', ['teater', 'theaater']], ['thermometer', ['termometer', 'thermomeeter']], ['bibliotheek', ['biblioteek', 'bieblioteek']], ['chocolade', ['sjokolade', 'sjocolade']], ['journaal', ['zjoernaal', 'joernaal']], ['etage', ['etaazje', 'etasje']], ['garage', ['garaazje', 'garasje']], ['horloge', ['horloozje', 'horlosje']], ['restaurant', ['restaurand', 'restorant']], ['bureau', ['buro', 'bureou']], ['niveau', ['nivo', 'niveou']], ['trottoir', ['trotwaar', 'trottuar']], ['douche', ['doesj', 'douge']], ['machine', ['masjine', 'machiene']], ['enthousiast', ['entoesiast', 'enthoesiast']], ['interessant', ['intresant', 'interresant']], ['onmiddellijk', ['onmiddelijk', 'onmidellijk']], ['cadeautje', ['kadootje', 'cadeutje']], ['dressuur', ['dresuur', 'dressuhr']]];
const flashQ = (skill, w, why) => ({ skill, type: 'flash', word: w, prompt: 'Flitswoord! Kijk goed naar het woord. Daarna verdwijnt het en typ jij het uit je hoofd.', correctText: w, retype: w, flashWhy: why });

GEN.sp_isch = (l, ctx) => {
  const i = pickItem(ISCH.length, ctx), w = ISCH[i], st = w.slice(0, -4);
  if (l > 1 && Math.random() < 0.45) return Object.assign(flashQ('sp_isch', w, 'Woorden die eindigen op de klank -ies schrijf je met -isch.'), { item: i, steps: 'Het goede woord is ' + B(w) + '. Je hoort -ies, je schrijft -isch.' });
  return mcq('sp_isch', 'Welk woord is goed geschreven?', w, U.shuffle([
    { t: st + 'ies', why: 'Je schreef het woord precies zoals je het hoort. Dat is slim gedacht, maar bij deze woorden schrijf je de klank -ies als -isch.' },
    { t: st + 'iesch', why: 'Bijna! Je wist dat er -sch achter moet. Maar het is -isch met alleen een i, geen ie.' },
    { t: st + 'ish', why: '-ish is Engels, zoals in "English". In het Nederlands schrijf je -isch, met sch.' }
  ]), { item: i, retype: w, steps: 'Het goede woord is ' + B(w) + '.' });
};
GEN.sp_dubbel = (l, ctx) => {
  const i = pickItem(DUB.length, ctx), d = DUB[i];
  if (l > 1 && Math.random() < 0.4) return Object.assign(flashQ('sp_dubbel', d[0], d[2]), { item: i, steps: 'Het goede woord is ' + B(d[0]) + '. ' + d[2] });
  return mcq('sp_dubbel', 'Welk woord is goed geschreven?', d[0], U.shuffle(d[1].map(w => ({ t: w, why: 'Klap het woord in stukjes en luister naar de klank. ' + d[2] }))), { item: i, retype: d[0], steps: 'Het goede woord is ' + B(d[0]) + '. ' + d[2] });
};
GEN.sp_eiau = (l, ctx) => {
  const i = pickItem(EIAU.length, ctx), e = EIAU[i];
  return mcq('sp_eiau', 'Welke letters horen op de streepjes? ' + '<span class="bigword">' + e[1].replace('_', '<i>__</i>') + '</span>', e[2], [{ t: e[3], why: 'Je kunt het verschil tussen ' + e[2] + ' en ' + e[3] + ' niet horen. Dit is een weetwoord: het is ' + B(e[0]) + '. Kijk er drie tellen naar en typ het dan over. Zo onthoudt je hand het ook.' }], { item: i, retype: e[0], steps: 'Het woord is ' + B(e[0]) + ', met ' + B(e[2]) + '.' });
};
GEN.sp_moeilijk = (l, ctx) => {
  const i = pickItem(MOEI.length, ctx), m = MOEI[i];
  if (l > 1 && Math.random() < 0.4) return Object.assign(flashQ('sp_moeilijk', m[0], 'Dit is een leenwoord uit een andere taal. Daarom schrijf je het anders dan je het hoort.'), { item: i, steps: 'Het goede woord is ' + B(m[0]) + '.' });
  return mcq('sp_moeilijk', 'Welk woord is goed geschreven?', m[0], U.shuffle(m[1].map(w => ({ t: w, why: 'Je schreef het woord zoals het klinkt. Maar ' + B(m[0]) + ' is een leenwoord uit een andere taal en houdt zijn eigen spelling.' }))), { item: i, retype: m[0], steps: 'Het goede woord is ' + B(m[0]) + '. Spreek het één keer "gek" uit, precies zoals het er staat.' });
};

/* ===== Werkwoorden ===== */
const VTT = [['vinden', 'vind', 'de borstel niet'], ['worden', 'word', 'steeds beter in tekenen'], ['rijden', 'rijd', 'elke zaterdag op een pony'], ['houden', 'houd', 'veel van paarden'], ['antwoorden', 'antwoord', 'meteen op de vraag'], ['raden', 'raad', 'het goede antwoord'], ['lopen', 'loop', 'naar de manege'], ['werken', 'werk', 'hard aan het schilderij'], ['tekenen', 'teken', 'een paard met lange manen'], ['praten', 'praat', 'zachtjes tegen de pony'], ['wachten', 'wacht', 'bij de stal'], ['rusten', 'rust', 'even in het gras'], ['verven', 'verf', 'het hek roze'], ['reizen', 'reis', 'met de trein naar oma'], ['kiezen', 'kies', 'de mooiste kleur'], ['schrijven', 'schrijf', 'een verhaal over een veulen'], ['geloven', 'geloof', 'het verhaal meteen'], ['zetten', 'zet', 'de emmer in de stal']];
const WHO = ['{naam}', 'De ruiter', 'Mijn vriendin', 'De juf', 'Hij', 'Zij', 'Oma'];
GEN.ww_tt = (l, ctx) => {
  const i = pickItem(VTT.length, ctx), v = VTT[i], st = v[1], endT = st.endsWith('t'), endD = st.endsWith('d');
  const per = U.pick(l === 1 ? ['hij', 'hij', 'ik'] : ['hij', 'hij', 'ik', 'jij', 'inv']), needT = per === 'hij' || per === 'jij';
  const ans = needT && !endT ? st + 't' : st, who = per === 'hij' ? U.pick(WHO) : per === 'ik' ? 'Ik' : 'Jij';
  const sent = per === 'inv' ? '<i>…</i> jij ' + v[2] + '?' : who + ' <i>…</i> ' + v[2] + '.', disp = s => per === 'inv' ? U.cap(s) : s;
  const loop = per === 'inv' ? '"Loop jij"' : per === 'ik' ? '"Ik loop"' : '"' + who + ' loopt"';
  const rule = per === 'ik' ? 'Bij "ik" schrijf je alleen de stam.' : per === 'inv' ? 'Staat "jij" áchter het werkwoord, dan valt de t weg.' : per === 'jij' ? 'Staat "jij" vóór het werkwoord, dan is het stam + t.' : 'Bij hij, zij, het of één persoon is het stam + t.';
  const wr = [];
  if (!endT) wr.push(needT ? { t: disp(st), why: 'Je bent de t vergeten. ' + rule + ' De stam is "' + st + '", dus het wordt "' + ans + '".' + (endD ? ' Je hoort die t niet apart, maar hij staat er wel: d én t.' : '') } : { t: disp(st + 't'), why: 'Hier hoort geen t achter. ' + rule + ' Check met de loop-truc: ' + loop + ' → geen t.' });
  if (endD) wr.push({ t: disp(st.slice(0, -1) + 't'), why: 'Je schreef wat je hoort. Maar de stam van "' + v[0] + '" is "' + st + '" en eindigt op een d. Die d blijft altijd staan.' });
  else if (endT) { wr.push({ t: disp(st + 't'), why: 'De stam "' + st + '" eindigt al op een t. Een woord eindigt in het Nederlands nooit op tt.' }); wr.push({ t: disp(st.slice(0, -1) + 'd'), why: 'De stam van "' + v[0] + '" is "' + st + '", met een t. Die letter verandert niet.' }); }
  else wr.push({ t: disp(st + 'd'), why: 'Achter de stam komt alleen een t of niets, nooit een d. Stam = "' + st + '".' });
  return mcq('ww_tt', 'Vul de goede vorm in van ' + B(v[0]) + ' (tegenwoordige tijd).<span class="sent">' + sent + '</span>', disp(ans), wr, { item: i, retype: disp(ans), steps: 'Stap 1: de stam van "' + v[0] + '" is "' + st + '". Stap 2: ' + rule + ' Stap 3: check met lopen: ' + loop + '. Dus: ' + B(disp(ans)) + '.' });
};
const VVT = [['wennen', 'wen', 0, 'snel aan de nieuwe stal', 1], ['werken', 'werk', 1, 'aan een groot schilderij'], ['fietsen', 'fiets', 1, 'naar de manege'], ['spelen', 'speel', 0, 'buiten met de hond'], ['landen', 'land', 0, 'veilig na de sprong', 1], ['praten', 'praat', 1, 'over de wedstrijd'], ['wachten', 'wacht', 1, 'op de bus'], ['verven', 'verf', 0, 'het hek wit'], ['reizen', 'reis', 0, 'naar Parijs', 1], ['borstelen', 'borstel', 0, 'de pony'], ['tekenen', 'teken', 0, 'een eenhoorn'], ['schilderen', 'schilder', 0, 'een zonsondergang'], ['rusten', 'rust', 1, 'even op de bank'], ['antwoorden', 'antwoord', 0, 'heel beleefd'], ['stappen', 'stap', 1, 'rustig door de bak'], ['draven', 'draaf', 0, 'door de wei'], ['kammen', 'kam', 0, 'de manen van het paard'], ['poetsen', 'poets', 1, 'het zadel'], ['kloppen', 'klop', 1, 'op de staldeur'], ['durven', 'durf', 0, 'bijna niet te kijken', 1], ['verhuizen', 'verhuis', 0, 'naar een ander dorp', 1], ['missen', 'mis', 1, 'de bus'], ['lachen', 'lach', 1, 'om de grap', 1], ['juichen', 'juich', 1, 'voor de winnaar']];
const kofTxt = v => { const c = v[0].slice(0, -2).slice(-1); return 'Haal -en van "' + v[0] + '" af: de laatste letter is dan een ' + B(c) + '. Zit de ' + c + ' in \'t kofschip? ' + (v[2] ? 'Ja' : 'Nee') + '.'; };
GEN.ww_vt = (l, ctx) => {
  const i = pickItem(VVT.length, ctx), v = VVT[i], st = v[1], pl = l > 1 && Math.random() < 0.4, n = pl ? 'n' : '';
  const who = pl ? U.pick(['{naam} en Noor', 'de ruiters', 'de kinderen']) : U.pick(['{naam}', 'de ruiter', 'mijn vriendin', 'de juf', 'oma']);
  const ans = st + (v[2] ? 'te' : 'de') + n, wr = [{ t: st + (v[2] ? 'de' : 'te') + n, why: 'Je koos de verkeerde uitgang. ' + kofTxt(v) + ' Dus het wordt -' + (v[2] ? 'te' : 'de') + n + '.' }];
  if (/[dt]$/.test(st)) wr.push({ t: st.replace(/([aeou])\1([dt])$/, '$1$2') + 'e' + n, why: 'Je hoort maar één ' + st.slice(-1) + ', maar je schrijft er twee. De stam "' + st + '" eindigt al op een ' + st.slice(-1) + ' en daar komt -' + (v[2] ? 'te' : 'de') + n + ' nog achter: ' + st + ' + ' + (v[2] ? 'te' : 'de') + n + '.' });
  wr.push({ t: pl ? v[0] : (st.endsWith('t') ? st : st + 't'), why: 'Dat is de tegenwoordige tijd. Het is al gebeurd, dus je hebt de verleden tijd nodig.' });
  return mcq('ww_vt', 'Vul de goede vorm in van ' + B(v[0]) + ' (verleden tijd).<span class="sent">' + U.pick(['Gisteren', 'Vorige week', 'Vanochtend', 'Vorig jaar']) + ' <i>…</i> ' + who + ' ' + v[3] + '.</span>', ans, wr, { item: i, retype: ans, steps: 'Stap 1: de stam is "' + st + '". Stap 2: ' + kofTxt(v) + ' Stap 3: stam + ' + (v[2] ? 'te' : 'de') + n + ' = ' + B(ans) + '.' });
};
GEN.ww_vd = (l, ctx) => {
  const ok = VVT.map((v, i) => i).filter(i => !VVT[i][4]); let i = (ctx && ctx.id != null && ok.includes(ctx.id)) ? ctx.id : (() => { const rec = ((ctx && ctx.recent) || []).filter(x => ok.includes(x)).slice(-Math.floor(ok.length * 0.75)), c = ok.filter(x => !rec.includes(x)); return U.pick(c.length ? c : ok); })();
  const v = VVT[i], st = v[1], dt = /[dt]$/.test(st), ans = 'ge' + st + (dt ? '' : v[2] ? 't' : 'd'), lang = 'de ' + ans + 'e …';
  const wr = dt ? [{ t: 'ge' + st + 't', why: 'Een voltooid deelwoord eindigt nooit op -dt of -tt. De stam "' + st + '" eindigt al op een ' + st.slice(-1) + ', daar komt niets meer achter.' }, { t: 'ge' + st.slice(0, -1) + (st.endsWith('d') ? 't' : 'd'), why: 'De laatste letter van de stam blijft staan. Stam = "' + st + '", dus het deelwoord eindigt ook op een ' + st.slice(-1) + '.' }]
    : [{ t: 'ge' + st + (v[2] ? 'd' : 't'), why: 'Je koos de verkeerde eindletter. ' + kofTxt(v) + ' Dus een ' + (v[2] ? 't' : 'd') + '. Je kunt het ook horen als je het langer maakt: "' + lang + '".' }, { t: 'ge' + st + (v[2] ? 'dt' : 'dt'), why: 'Een voltooid deelwoord eindigt nooit op -dt. Het is een t óf een d.' }];
  return mcq('ww_vd', 'Vul het voltooid deelwoord in van ' + B(v[0]) + '.<span class="sent">' + U.pick(['{naam}', 'De ruiter', 'Mijn vriendin', 'De juf']) + ' heeft ' + v[3] + ' <i>…</i>.</span>', ans, wr, { item: i, retype: ans, steps: 'Stap 1: de stam is "' + st + '". Stap 2: ' + (dt ? 'de stam eindigt al op een ' + st.slice(-1) + ', dus er komt niets achter.' : kofTxt(v) + ' Dus een ' + (v[2] ? 't' : 'd') + '.') + ' Stap 3: ge + stam' + (dt ? '' : ' + ' + (v[2] ? 't' : 'd')) + ' = ' + B(ans) + '.' });
};

/* ===== Taal en ontleden ===== */
const ZIN = [[['{naam}', 'borstelt', 'elke ochtend', 'haar pony'], 1, 0], [['Morgen', 'gaat', 'de hele klas', 'naar het museum'], 1, 2], [['In de wei', 'staan', 'drie bruine paarden'], 1, 2], [['De schilder', 'mengt', 'rood en wit', 'tot roze'], 1, 0], [['Gisteren', 'won', 'mijn zus', 'de eerste prijs'], 1, 2], [['Na de les', 'krijgt', 'het veulen', 'een wortel'], 1, 2], [['Onze juf', 'heeft', 'een prachtig schilderij', 'gemaakt'], 1, 0], [['Elke zaterdag', 'rijden', 'wij', 'door het bos'], 1, 2], [['De oude hoefsmid', 'maakt', 'nieuwe hoefijzers'], 1, 0], [['Vanmiddag', 'tekenen', 'de kinderen', 'een paard'], 1, 2], [['Het witte paard', 'springt', 'over de hoge hindernis'], 1, 0], [['Waarom', 'hinnikt', 'die pony', 'zo hard'], 1, 2], [['Mijn opa', 'heeft', 'vroeger', 'op een boerderij', 'gewoond'], 1, 0], [['Op het doek', 'verschijnt', 'langzaam', 'een kleurrijke vlinder'], 1, 3], [['Volgende week', 'begint', 'de tekenwedstrijd'], 1, 2], [['Zachtjes', 'aait', 'het meisje', 'de neus van het paard'], 1, 2]];
const zinTxt = z => z[0].join(' ') + (/^(Waarom|Hoe|Wanneer|Wie|Wat|Waar)\b/.test(z[0][0]) ? '?' : '.');
GEN.ont_pv = (l, ctx) => {
  const i = pickItem(ZIN.length, ctx), z = ZIN[i], pv = z[0][z[1]];
  const wr = z[0].map((c, j) => j === z[1] ? null : { t: c, why: (j === z[0].length - 1 && /^ge/.test(c)) ? '"' + c + '" is wel een werkwoord, maar het is het voltooid deelwoord. Zet de zin maar in een andere tijd: "' + c + '" verandert niet, "' + pv + '" wel.' : j === z[2] ? '"' + c + '" is het onderwerp: wie of wat iets doet. De persoonsvorm is het werkwoord dat verandert als je de tijd verandert.' : 'Zet de zin in een andere tijd. "' + c + '" blijft precies hetzelfde, dus dat is niet de persoonsvorm.' }).filter(Boolean);
  return mcq('ont_pv', 'Wat is de ' + B('persoonsvorm') + ' van deze zin?<span class="sent">' + zinTxt(z) + '</span>', pv, U.shuffle(wr), { item: i, steps: 'Zet de zin in een andere tijd. Het enige woord dat verandert is ' + B(pv) + '. Dat is de persoonsvorm.' });
};
GEN.ont_ow = (l, ctx) => {
  const i = pickItem(ZIN.length, ctx), z = ZIN[i], pv = z[0][z[1]], ow = z[0][z[2]];
  const wr = z[0].map((c, j) => j === z[2] ? null : { t: c, why: j === z[1] ? '"' + c + '" is de persoonsvorm. Die heb je nodig om het onderwerp te vínden: wie of wat ' + pv + '?' : (j === 0 ? 'Het onderwerp staat niet altijd vooraan in de zin! ' : '') + 'Stel de vraag: wie of wat ' + pv + '? Het antwoord is niet "' + c + '".' }).filter(Boolean);
  return mcq('ont_ow', 'Wat is het ' + B('onderwerp') + ' van deze zin?<span class="sent">' + zinTxt(z) + '</span>', ow, U.shuffle(wr), { item: i, steps: 'Stap 1: de persoonsvorm is "' + pv + '". Stap 2: wie of wat ' + pv + '? → ' + B(ow) + '.' });
};
const GEZ = [['{naam} heeft haar pony geborsteld.', 'heeft geborsteld', ['heeft', 'geborsteld', 'heeft haar pony']], ['De schilder wil een paard tekenen.', 'wil tekenen', ['wil', 'tekenen', 'wil een paard']], ['Wij zullen morgen naar de manege gaan.', 'zullen gaan', ['zullen', 'gaan', 'Wij zullen']], ['Het veulen had de hele dag moeten rusten.', 'had moeten rusten', ['had', 'had moeten', 'moeten rusten']], ['De juf kan heel mooi schilderen.', 'kan schilderen', ['kan', 'schilderen', 'kan heel mooi']], ['Mijn broer is gisteren van zijn fiets gevallen.', 'is gevallen', ['is', 'gevallen', 'is gisteren']], ['De ruiters hebben de paarden kunnen kalmeren.', 'hebben kunnen kalmeren', ['hebben', 'hebben kunnen', 'kunnen kalmeren']], ['Noor mag vandaag de verf mengen.', 'mag mengen', ['mag', 'mengen', 'mag vandaag']]];
GEN.ont_gez = (l, ctx) => {
  const i = pickItem(GEZ.length, ctx), g = GEZ[i], nv = g[1].split(' ').length;
  return mcq('ont_gez', 'Wat is het ' + B('werkwoordelijk gezegde') + ' van deze zin?<span class="sent">' + g[0] + '</span>', g[1], U.shuffle(g[2].map(w => ({ t: w, why: w.split(' ').every(x => g[1].split(' ').includes(x)) ? 'Je hebt niet alle werkwoorden. In deze zin staan er ' + nv + '. Samen vormen ze het gezegde.' : 'Hier zit een woord bij dat geen werkwoord is. In het werkwoordelijk gezegde staan alléén werkwoorden.' }))), { item: i, steps: 'Zoek alle werkwoorden in de zin: ' + B(g[1]) + '. Dat zijn er ' + nv + ', en samen zijn ze het werkwoordelijk gezegde.' });
};
const WS = [['De *pony* eet een appel.', 'zn'], ['Het *witte* paard draaft.', 'bn'], ['{naam} *schildert* een regenboog.', 'ww'], ['*De* juf lacht.', 'lw'], ['De kat zit *onder* de tafel.', 'vz'], ['Ik zie *een* veulen.', 'lw'], ['Het veulen is nog *klein*.', 'bn'], ['We lopen *naar* de stal.', 'vz'], ['Mijn *kwast* is nat.', 'zn'], ['De ruiter *springt* hoog.', 'ww'], ['Zij draagt een *roze* cap.', 'bn'], ['*Het* museum is open.', 'lw'], ['Het boek ligt *op* de kast.', 'vz'], ['De *vrolijke* schilder zingt.', 'bn'], ['Morgen *rijden* we buiten.', 'ww'], ['Er hangt een *schilderij* aan de muur.', 'zn'], ['De pony staat *in* de wei.', 'vz'], ['Die *tekening* is prachtig.', 'zn'], ['De hoefsmid *maakt* een hoefijzer.', 'ww'], ['Ze aait het *zachte* veulen.', 'bn']];
const WSN = { zn: ['zelfstandig naamwoord', 'Een zelfstandig naamwoord is een mens, dier of ding. Je kunt er "de" of "het" voor zetten.'], bn: ['bijvoeglijk naamwoord', 'Een bijvoeglijk naamwoord vertelt hoe iets of iemand is: groot, roze, vrolijk.'], ww: ['werkwoord', 'Een werkwoord zegt wat iemand doet of wat er gebeurt. Je kunt het vervoegen: ik loop, wij lopen.'], lw: ['lidwoord', 'Er zijn maar drie lidwoorden: de, het en een.'], vz: ['voorzetsel', 'Een voorzetsel past vóór "de kast": in, op, onder, naar de kast.'] };
GEN.ont_ws = (l, ctx) => {
  const i = pickItem(WS.length, ctx), w = WS[i], word = w[0].match(/\*(.+)\*/)[1];
  return mcq('ont_ws', 'Welke woordsoort is het ' + B('dikke') + ' woord?<span class="sent">' + w[0].replace(/\*(.+)\*/, '<b class="hl">$1</b>') + '</span>', WSN[w[1]][0], U.shuffle(Object.keys(WSN).filter(k => k !== w[1])).map(k => ({ t: WSN[k][0], why: WSN[k][1] + ' Past dat bij "' + word + '"? Nee. ' + WSN[w[1]][1] })), { item: i, steps: '"' + U.cap(word) + '" is een ' + B(WSN[w[1]][0]) + '. ' + WSN[w[1]][1] });
};
const LEES = [['Morgen gaat Sara naar Parijs.', ['Sara', 'Parijs']], ['Waarom hinnikt de pony van Noor zo hard?', ['Noor']], ['In Amsterdam hangt een beroemd schilderij.', ['Amsterdam']], ['Hoe heet het nieuwe veulen van Emma?', ['Emma']], ['Wat een prachtige tekening heb jij gemaakt!', []], ['Op zaterdag rijdt Lina op Bella.', ['Lina', 'Bella']], ['Heb jij het museum in Den Haag al gezien?', ['Den Haag']], ['Kijk uit, het paard schrikt!', []], ['Vorige week tekende Yara een eenhoorn.', ['Yara']], ['Mag ik de roze verf even lenen?', []]];
GEN.tv_lees = (l, ctx) => {
  const i = pickItem(LEES.length, ctx), s = LEES[i][0], names = LEES[i][1], end = s.slice(-1), wr = [];
  wr.push({ t: s.charAt(0).toLowerCase() + s.slice(1), why: 'Elke zin begint met een hoofdletter. Hier begint de zin met een kleine letter.' });
  if (names.length) wr.push({ t: names.reduce((x, n) => x.replace(n, n.toLowerCase()), s), why: 'Namen van mensen, dieren en plaatsen krijgen altijd een hoofdletter. Kijk naar: ' + names.join(' en ') + '.' });
  wr.push(end === '?' ? { t: s.slice(0, -1) + '.', why: 'Dit is een vraag. Achter een vraag hoort een vraagteken, geen punt.' } : { t: s.slice(0, -1), why: 'Er staat geen leesteken aan het eind. Elke zin eindigt met een punt, vraagteken of uitroepteken.' });
  const ws = s.slice(0, -1).split(' '), ci = ws.findIndex((w, j) => j > 0 && w.length > 4 && w === w.toLowerCase());
  if (ci > 0) { const c = ws.slice(); c[ci] = U.cap(c[ci]); wr.push({ t: c.join(' ') + end, why: 'Het woord "' + c[ci] + '" is geen naam. Gewone woorden krijgen midden in een zin geen hoofdletter.' }); }
  return mcq('tv_lees', 'Welke zin is helemaal goed geschreven? Let op hoofdletters en leestekens.', s, U.shuffle(wr), { item: i, long: true, steps: 'Goed is: ' + B(s) + ' Hoofdletter vooraan, namen met een hoofdletter en een leesteken aan het eind.' });
};

/* ===== Begrijpend lezen (eigen teksten) ===== */
const TEXTS = [
  { t: 'Schoenen voor paarden', b: 'Een paard loopt de hele dag op zijn hoeven. Een hoef is gemaakt van hoorn, net als jouw nagels. In het wild slijten hoeven vanzelf een beetje af, en dat is precies genoeg. Maar paarden die op harde wegen lopen of een ruiter dragen, slijten hun hoeven veel sneller. Daarom krijgen zij hoefijzers.</p><p>De hoefsmid maakt het ijzer eerst gloeiend heet, zodat hij het in de juiste vorm kan buigen. Daarna spijkert hij het vast aan de hoef. Dat klinkt pijnlijk, maar het paard voelt er niets van. In de rand van de hoef zitten namelijk geen zenuwen. Ongeveer elke acht weken komt de hoefsmid terug, want de hoeven groeien gewoon door.',
    q: [['info', 'Waarom krijgen sommige paarden hoefijzers?', 'omdat hun hoeven anders te snel slijten', [['omdat hoeven van hoorn zijn gemaakt', 'Dat staat wel in de tekst, maar het is niet de réden voor hoefijzers. Zoek het signaalwoord "Daarom" en lees de zin ervoor.'], ['omdat de hoefsmid dat mooi vindt', 'Dat staat nergens in de tekst. Een goed antwoord kun je altijd aanwijzen in de tekst.'], ['omdat wilde paarden ze ook dragen', 'In de tekst staat juist dat hoeven in het wild vanzelf genoeg slijten. Wilde paarden hebben dus geen hoefijzers.']]],
      ['verband', 'Lees: "Dat klinkt pijnlijk." Waar verwijst <b>Dat</b> naar?', 'het vastspijkeren van het ijzer aan de hoef', [['het heet maken van het ijzer', 'Dat staat twee zinnen eerder. Een verwijswoord wijst meestal naar de zin er vlák voor.'], ['het lopen op harde wegen', 'Dat staat in de eerste alinea, veel te ver weg. Kijk naar de zin vlak voor "Dat klinkt pijnlijk".'], ['het doorgroeien van de hoeven', 'Dat komt pas ná de zin. Een verwijswoord wijst bijna altijd terug, niet vooruit.']]],
      ['verband', 'Wat betekent <b>slijten</b> in deze tekst?', 'door gebruik langzaam dunner of korter worden', [['steeds sneller groeien', 'Dat is juist het omgekeerde. In de tekst staat dat hoeven "afslijten": er gaat iets af.'], ['pijn doen bij het lopen', 'Over pijn gaat het pas in de tweede alinea. Vul je antwoord in de zin in: "hoeven doen vanzelf een beetje pijn af" klopt niet.'], ['in stukken breken', 'Slijten gaat langzaam en beetje bij beetje, niet in één keer.']]],
      ['hoofd', 'Wat is de hoofdgedachte van deze tekst?', 'Paarden die veel op harde grond lopen hebben hoefijzers nodig om hun hoeven te beschermen.', [['De hoefsmid heeft een zwaar beroep.', 'Dat staat niet in de tekst. De hoofdgedachte moet over de héle tekst gaan en er echt in staan.'], ['Hoeven groeien altijd door.', 'Dat klopt, maar het is een detail uit de laatste zin. De hoofdgedachte past bij de hele tekst.'], ['Wilde paarden hebben geen hoefijzers.', 'Dat is één detail uit de eerste alinea. De rest van de tekst gaat daar niet over.']]]] },
  { t: 'Drie potjes verf', b: 'Met maar drie potjes verf kun je bijna elke kleur maken. Rood, geel en blauw noemen we de primaire kleuren. Die kun je niet zelf mengen; je moet ze kopen. Meng je twee primaire kleuren, dan krijg je een secundaire kleur. Zo wordt geel met blauw groen, en rood met geel oranje.</p><p>Wil je een kleur lichter maken? Doe er dan een beetje wit bij. Maar pas op: begin altijd met de lichte kleur en voeg de donkere druppel voor druppel toe. Andersom heb je namelijk heel veel lichte verf nodig om het weer goed te maken. Volgens veel schilders is mengen het leukste onderdeel van schilderen. Je weet immers nooit precies welke kleur er ontstaat.',
    q: [['info', 'Welke kleur krijg je als je rood en geel mengt?', 'oranje', [['groen', 'Groen krijg je van geel met blauw. Zoek het woord "rood" op in de tekst en lees die zin precies.'], ['paars', 'Paars staat niet in deze tekst. Gebruik alleen wat er in de tekst staat, niet wat je al wist.'], ['roze', 'Roze maak je met wit erbij. De vraag ging over rood met geel.']]],
      ['info', 'In welke zin staat een <b>mening</b>?', 'Volgens veel schilders is mengen het leukste onderdeel van schilderen.', [['Rood, geel en blauw noemen we de primaire kleuren.', 'Dit is een feit: het is een afspraak die je kunt opzoeken. Een mening is wat iemand ergens van víndt.'], ['Zo wordt geel met blauw groen.', 'Dit kun je zelf uitproberen en bewijzen. Dan is het een feit.'], ['Doe er dan een beetje wit bij.', 'Dit is een tip of instructie, geen mening. Zoek een woord als "leukste", "mooi" of "stom".']]],
      ['verband', 'Waarom moet je beginnen met de lichte kleur?', 'omdat je anders heel veel lichte verf nodig hebt', [['omdat donkere verf duurder is', 'Over de prijs van verf staat niets in de tekst.'], ['omdat lichte verf sneller droogt', 'Over drogen staat niets in de tekst. Zoek het signaalwoord "namelijk": daar staat de reden.'], ['omdat je primaire kleuren niet kunt mengen', 'Dat staat in de eerste alinea en gaat over iets anders.']]],
      ['verband', 'Wat betekent <b>primaire kleuren</b> in deze tekst?', 'kleuren die je niet zelf kunt mengen', [['kleuren die je krijgt door te mengen', 'Dat zijn juist de secundaire kleuren. Lees de zin na het woord "primaire kleuren": daar staat de uitleg.'], ['lichte kleuren', 'Blauw en rood zijn niet licht. De uitleg staat in de zin direct erna.'], ['de mooiste kleuren', 'Dat zou een mening zijn. De tekst legt het woord uit in de zin erna.']]]] },
  { t: 'Een museum zonder muren', b: 'In sommige steden hoef je geen kaartje te kopen om kunst te zien. De kunst hangt er namelijk gewoon buiten. Op tientallen muren staan enorme schilderingen, gemaakt door kunstenaars uit de hele wereld.</p><p>Vroeger vonden veel mensen verf op muren maar rommel. Tegenwoordig denken ze daar anders over. De gemeente nodigt de kunstenaars zelfs uit en betaalt de verf. Bewoners merken dat hun straat er vrolijker van wordt. Bovendien komen er steeds meer toeristen kijken.</p><p>Toch is niet iedereen tevreden. Sommige buren vinden een schildering van tien meter hoog te druk. Zij kijken er immers elke dag tegenaan.',
    q: [['hoofd', 'Wat wil de schrijver vooral vertellen?', 'Muurschilderingen worden tegenwoordig als kunst gezien, al vindt niet iedereen ze fijn.', [['Je moet een kaartje kopen om kunst te zien.', 'In de tekst staat juist dat dat níét hoeft. Lees de eerste zin nog eens.'], ['Verf op muren is rommel.', 'Dat vonden mensen vróéger. De tekst zegt dat ze er nu anders over denken.'], ['Toeristen maken de stad te druk.', 'Niet de toeristen zijn te druk, maar de schildering zelf. En het is maar een klein stukje van de tekst.']]],
      ['verband', 'Lees: "Tegenwoordig denken ze <b>daar</b> anders over." Waarover?', 'over verf op muren', [['over toeristen', 'De toeristen komen pas later in de tekst. Een verwijswoord wijst terug naar de zin ervoor.'], ['over kaartjes kopen', 'Dat staat in de eerste alinea. Kijk naar de zin vlak voor "Tegenwoordig".'], ['over de gemeente', 'De gemeente wordt pas ná deze zin genoemd.']]],
      ['verband', 'De laatste alinea begint met <b>Toch</b>. Wat geeft dat woord aan?', 'een tegenstelling', [['een voorbeeld', 'Bij een voorbeeld staat "bijvoorbeeld" of "zoals". "Toch" betekent: maar aan de andere kant…'], ['een reden', 'Een reden herken je aan "omdat", "want" of "namelijk".'], ['een opsomming', 'Een opsomming herken je aan "ook", "bovendien" of "ten eerste".']]],
      ['info', 'Welke zin is <b>waar</b> volgens de tekst?', 'De gemeente betaalt de verf.', [['De kunstenaars komen allemaal uit Nederland.', 'Er staat: kunstenaars uit de hele wereld.'], ['Alle bewoners zijn blij met de schilderingen.', 'In de laatste alinea staat dat niet iedereen tevreden is. Pas op met woorden als "alle" en "nooit".'], ['Je moet betalen om de schilderingen te zien.', 'De kunst hangt buiten en je hoeft geen kaartje te kopen.']]]] },
  { t: 'Slapen op vier benen', noTitleQ: false, b: 'Heb je weleens een paard zien slapen? Grote kans dat je het niet eens doorhad. Paarden kunnen namelijk staand slapen. In hun benen zit een slim systeem van pezen dat de knieën "op slot" zet. Daardoor vallen ze niet om, ook al zijn hun spieren ontspannen.</p><p>Dat staand slapen is geen luiheid, maar een oude gewoonte. In het wild moest een paard direct kunnen wegrennen als er een roofdier aankwam. Wie eerst moest opstaan, was te laat.</p><p>Toch gaan paarden ook af en toe liggen. Alleen dan kunnen ze heel diep slapen en dromen. Dat doen ze alleen als ze zich veilig voelen. In een kudde blijft er daarom altijd één paard wakker om de wacht te houden.',
    q: [['info', 'Waardoor vallen slapende paarden niet om?', 'doordat pezen hun knieën op slot zetten', [['doordat hun spieren aangespannen blijven', 'In de tekst staat juist dat hun spieren ontspannen zijn. Lees de zin met "Daardoor" en de zin ervoor.'], ['doordat een ander paard de wacht houdt', 'Dat helpt tegen gevaar, niet tegen omvallen.'], ['doordat ze nooit diep slapen', 'Dat staat er niet. Zoek het signaalwoord "Daardoor": het antwoord staat in de zin ervóór.']]],
      ['verband', 'Lees: "<b>Dat</b> doen ze alleen als ze zich veilig voelen." Wat doen ze dan?', 'gaan liggen om diep te slapen', [['staand slapen', 'Staand slapen doen ze juist altijd. Kijk naar de twee zinnen vlak voor "Dat doen ze".'], ['wegrennen voor een roofdier', 'Dat staat in de alinea ervoor. Een verwijswoord wijst naar iets dichtbij.'], ['de wacht houden', 'Dat komt pas in de zin erná.']]],
      ['verband', 'Waarom slapen paarden staand?', 'zodat ze vroeger snel konden vluchten', [['omdat ze lui zijn', 'In de tekst staat letterlijk: het is géén luiheid.'], ['omdat liggen pijn doet', 'Dat staat nergens. Paarden gaan zelfs af en toe liggen.'], ['omdat ze niet kunnen dromen', 'Ze kunnen wel dromen, maar alleen als ze liggen.']]],
      ['hoofd', 'Welke andere titel past het best boven deze tekst?', 'Hoe en waarom paarden staand slapen', [['Roofdieren in het wild', 'Roofdieren komen maar in één zin voor. Een titel past bij de héle tekst.'], ['De dromen van een veulen', 'Over veulens gaat de tekst niet, en dromen is maar een detail.'], ['Waarom paarden lui zijn', 'De tekst zegt juist dat het geen luiheid is.']]]] },
  { t: 'Regenboog', b: 'Na een regenbui zie je soms een regenboog. Die ontstaat alleen als de zon schijnt terwijl het ergens nog regent. Zonlicht lijkt wit, maar het bestaat eigenlijk uit <b>____1____</b>. Als het licht door een regendruppel gaat, wordt het gebogen. Elke kleur buigt net een beetje anders. Daardoor <b>____2____</b> en zie je ze naast elkaar aan de hemel.',
    q: [['verband', 'Wat past het best op plaats <b>1</b>?', 'allemaal verschillende kleuren', [['kleine druppels water', 'Lees verder: de volgende zinnen gaan over kleuren die elk anders buigen. Het licht bestaat dus uit kleuren, niet uit druppels.'], ['warme lucht', 'Over warmte gaat deze tekst niet. Kijk wat er ná het gat staat.'], ['alleen geel licht', 'Verderop staat "elke kleur". Het zijn er dus meer dan één.']]],
      ['verband', 'Wat past het best op plaats <b>2</b>?', 'vallen de kleuren uit elkaar', [['verdwijnen de kleuren', 'Na het gat staat: "en zie je ze naast elkaar". Dan kunnen ze niet verdwenen zijn.'], ['wordt het licht weer wit', 'Je ziet de kleuren juist apart naast elkaar. Lees altijd ook het stukje ná het gat.'], ['houdt het op met regenen', 'De zin gaat over licht en kleuren, niet over het weer.']]]] },
  { t: 'Te koop', b: '<b>Lieve pony zoekt nieuw baasje!</b></p><p>Bella is een vrolijke Shetlander van acht jaar. Ze is braaf in het verkeer en dol op kinderen. Bella is al gewend aan een zadel en een hoofdstel. Kom snel kijken, want zo\'n lieve pony vind je nergens! Bel manege De Hoefslag voor een afspraak.',
    q: [['hoofd', 'Wat is het doel van deze tekst?', 'iemand overhalen om Bella te kopen', [['uitleggen hoe je een pony verzorgt', 'Er staan geen stappen of tips over verzorgen in. Let op zinnen als "Kom snel kijken": de schrijver wil dat je iets gaat dóén.'], ['een spannend verhaal vertellen', 'Er gebeurt niets spannends. Het is een advertentie.'], ['nieuws vertellen over de manege', 'Het gaat maar over één pony die te koop is, niet over nieuws.']]],
      ['info', 'Welke zin is een <b>mening</b>?', 'Zo\'n lieve pony vind je nergens!', [['Bella is acht jaar.', 'Dat kun je controleren in haar paspoort. Dan is het een feit.'], ['Bella is een Shetlander.', 'Het ras van een pony kun je bewijzen. Feit dus.'], ['Bella is gewend aan een zadel.', 'Dat kun je uitproberen en zien. Een mening kun je niet bewijzen.']]]] },
  { t: 'Praten met je oren', b: '<i>Hieronder zie je alleen het begin van een tekst.</i></p><p>Een paard kan niet praten zoals wij. Toch vertelt het je de hele dag hoe het zich voelt. Je moet alleen goed naar zijn oren kijken.',
    q: [['hoofd', 'Waar zal de rest van de tekst vooral over gaan?', 'over wat de stand van de oren zegt over hoe een paard zich voelt', [['over hoe goed paarden kunnen horen', 'De titel zegt "praten", niet "horen". En er staat: het paard vertelt hoe het zich voelt.'], ['over paarden die leren praten', 'De eerste zin zegt juist dat een paard niet kan praten zoals wij.'], ['over de ziektes die een paard aan zijn oren kan krijgen', 'Nergens in het begin gaat het over ziek zijn. Gebruik de titel én de laatste zin om te voorspellen.']]]] }
];
const LQ = { hoofd: [], verband: [], info: [] };
TEXTS.forEach((t, ti) => t.q.forEach((q, qi) => LQ[q[0]].push([ti, qi])));
function lezGen(kind, skill) {
  return (l, ctx) => {
    const i = pickItem(LQ[kind].length, ctx), ref = LQ[kind][i], t = TEXTS[ref[0]], q = t.q[ref[1]];
    return mcq(skill, q[1], q[2], U.shuffle(q[3].map(w => ({ t: w[0], why: w[1] }))), { item: i, long: true, context: '<h3>' + t.t + '</h3><p>' + t.b + '</p>', steps: 'Het goede antwoord is: ' + B(q[2]) + ' Zoek in de tekst de zin waar je dit kunt aanwijzen.' });
  };
}
GEN.lez_hoofd = lezGen('hoofd', 'lez_hoofd');
GEN.lez_verband = lezGen('verband', 'lez_verband');
GEN.lez_info = lezGen('info', 'lez_info');

/* ===== Woordenschat ===== */
const WOORD = [
  ['De schilder werkt heel <b>nauwkeurig</b>.', 'heel precies', ['heel snel', 'een beetje slordig', 'erg vrolijk'], 'Nauwkeurig = heel precies, met aandacht voor elk klein dingetje.'],
  ['Het paard was <b>schichtig</b>.', 'snel bang en schrikachtig', ['heel sterk', 'erg moe', 'een beetje ondeugend'], 'Een schichtig dier schrikt snel en springt weg.'],
  ['Dat is een <b>zeldzaam</b> schilderij.', 'het komt bijna nergens voor', ['het is heel oud', 'het is erg groot', 'het is lelijk'], 'Zeldzaam = je ziet het bijna nooit, er zijn er maar weinig van.'],
  ['<b>Vervolgens</b> mengde ze de verf.', 'daarna', ['daarvoor', 'daarom', 'misschien'], 'Vervolgens = daarna. Het is een signaalwoord voor volgorde.'],
  ['Wat betekent het spreekwoord <b>"het paard achter de wagen spannen"</b>?', 'iets op een verkeerde, onhandige manier aanpakken', ['heel hard werken', 'iemand anders het werk laten doen', 'te laat komen'], 'Een paard hoort vóór de wagen. Erachter kan het niet trekken: je pakt het dus verkeerd om aan.'],
  ['Wat betekent <b>"een gegeven paard mag je niet in de bek kijken"</b>?', 'op een cadeau mag je geen kritiek hebben', ['je moet voorzichtig zijn met dieren', 'je mag niet stiekem kijken', 'cadeaus moet je teruggeven'], 'Vroeger keek je in de bek van een paard om te zien hoe oud het was. Bij een cadeau doe je dat niet: wees er gewoon blij mee.'],
  ['Wat betekent <b>"over het paard getild zijn"</b>?', 'verwaand zijn doordat je te veel bent geprezen', ['heel goed kunnen paardrijden', 'van je paard gevallen zijn', 'erg verlegen zijn'], 'Wie te hoog wordt opgetild, vliegt over het paard heen. Te veel complimenten maken iemand verwaand.'],
  ['De pony is <b>koppig</b>.', 'ze wil niet doen wat een ander wil', ['ze heeft een groot hoofd', 'ze is heel slim', 'ze is snel moe'], 'Koppig = eigenwijs, niet willen luisteren.'],
  ['Hij schilderde op een <b>enorm</b> doek.', 'heel groot', ['heel duur', 'heel oud', 'vierkant'], 'Enorm = heel erg groot.'],
  ['Het veulen <b>aarzelde</b> bij de sloot.', 'het twijfelde en durfde nog niet', ['het sprong meteen', 'het viel in het water', 'het dronk wat'], 'Aarzelen = even wachten omdat je twijfelt.'],
  ['Zij <b>bewondert</b> het schilderij.', 'ze vindt het heel knap en mooi', ['ze koopt het', 'ze maakt het schoon', 'ze begrijpt het niet'], 'Bewonderen = iets of iemand heel knap vinden.'],
  ['De schimmel had een <b>opvallende</b> vlek.', 'een vlek die je meteen ziet', ['een vlek die je bijna niet ziet', 'een vieze vlek', 'een kleine vlek'], 'Opvallend = het valt op, je ziet het direct.'],
  ['De ruiter wachtte <b>geduldig</b>.', 'rustig, zonder boos of zenuwachtig te worden', ['heel lang', 'met tegenzin', 'stiekem'], 'Geduldig = je kunt rustig wachten.'],
  ['Hij <b>beweert</b> dat zijn pony de snelste is.', 'hij zegt dat het zo is, maar het is niet bewezen', ['hij bewijst het', 'hij vraagt het', 'hij ontkent het'], 'Beweren = zeggen dat iets waar is, zonder bewijs.'],
  ['De regen was de <b>oorzaak</b> van de modder.', 'waardoor iets gebeurt', ['wat er daarna gebeurt', 'de oplossing', 'het einde'], 'Oorzaak = waardoor iets komt. Gevolg = wat er daarna door gebeurt.'],
  ['Het publiek juichte <b>uitbundig</b>.', 'heel vrolijk en druk', ['zachtjes', 'een beetje verdrietig', 'beleefd'], 'Uitbundig = heel blij en met veel lawaai of beweging.'],
  ['Eerst maakte ze een <b>schets</b>.', 'een snelle, eenvoudige tekening als begin', ['een lijst om het schilderij', 'een foto', 'een vlek'], 'Een schets is een snelle tekening om te proberen, vóór je echt begint.'],
  ['Ik <b>vermoed</b> dat het gaat regenen.', 'ik denk het, maar ik weet het niet zeker', ['ik weet het zeker', 'ik hoop het', 'ik vind het jammer'], 'Vermoeden = denken dat iets zo is, zonder het zeker te weten.'],
  ['Wat betekent <b>"iets onder de knie hebben"</b>?', 'iets goed kunnen', ['pijn hebben aan je been', 'iets verstoppen', 'iets kwijt zijn'], 'Als je iets onder de knie hebt, heb je het geleerd en kun je het goed.'],
  ['Wat betekent <b>"de draad kwijt zijn"</b>?', 'niet meer weten waar je was', ['je naaigaren verliezen', 'verdwaald zijn in het bos', 'heel moe zijn'], 'De draad is de rode lijn van je verhaal. Ben je die kwijt, dan weet je niet meer waar je gebleven was.'],
  ['Het regende <b>voortdurend</b>.', 'de hele tijd, zonder te stoppen', ['af en toe', 'heel hard', 'heel even'], 'Voortdurend = het duurt steeds voort, het houdt niet op.'],
  ['Ze was <b>trots</b> op haar tekening.', 'blij met wat je zelf hebt gedaan', ['bang voor wat anderen vinden', 'boos op jezelf', 'jaloers op een ander'], 'Trots = je bent blij en tevreden over iets wat je zelf hebt gedaan.'],
  ['Wat betekent <b>"de teugels laten vieren"</b>?', 'minder streng zijn', ['harder gaan rijden', 'de leiding nemen', 'stoppen met werken'], 'Met losse teugels krijgt een paard meer vrijheid. Zo is het ook bij mensen: minder streng zijn.'],
  ['De kleuren <b>vervagen</b> in de zon.', 'ze worden langzaam minder fel', ['ze worden feller', 'ze lopen door elkaar', 'ze drogen op'], 'Vervagen = vaag worden, steeds minder duidelijk.']
];
GEN.wsch = (l, ctx) => {
  const i = pickItem(WOORD.length, ctx), w = WOORD[i], isQ = w[0].startsWith('Wat betekent') || w[0].includes('Welk woord');
  return mcq('wsch', isQ ? w[0] : 'Wat betekent het dikke woord?<span class="sent">' + w[0] + '</span>', w[1], U.shuffle(w[2].map(x => ({ t: x, why: 'Vul jouw antwoord eens in op de plek van het dikke woord. Past het dan nog bij de rest van de zin? ' + w[3] }))), { item: i, long: true, steps: w[3] });
};

/* ===== Mentor-teksten ===== */
const JOKES = [
  'Waarom is het in een voetbalstadion altijd zo lekker koel? Omdat het vol zit met fans!',
  'Waarom kan een keeper zo goed sparen? Ze houdt alles tegen!',
  'Waarom nam de scheidsrechter een woordenboek mee? Voor als iemand buiten-spel-ling ging.',
  'Wat zegt de ene bokshandschoen tegen de andere? "Samen zijn wij een echte klapper!"',
  'Wat zegt de nul tegen de acht? "Mooie riem heb jij om! Ben jij soms kampioen?"',
  'Waarom is het rekenboek altijd zo verdrietig? Het zit vol met problemen.',
  'Waarom ging de breuk naar de dokter? Hij voelde zich maar half.',
  'Waarom kreeg het potlood een tien? Het had een goede punt gemaakt. Net als jij straks.',
  'Wat doet een voetbal in de bibliotheek? Een goede voorzet zoeken voor het volgende hoofdstuk.',
  'Hoe noem je een bal die heel goed kan spellen? Een woord-voetbal. (Oké, dat was een eigen doelpunt.)',
  'Waarom zijn kommagetallen zo sportief? Ze laten altijd netjes een plekje vrij voor de komma.',
  'Wat is het lievelingsgetal van een kickbokser? De high-five. Met haar voet.',
  'Waarom nemen vossen nooit een penalty? Ze zijn veel te sluw: ze laten de keeper eerst duiken.',
  'Wat eet een kickbokser als ontbijt? Een stevige combinatie: links een boterham, rechts een banaan.'
];
const PRAISE = ['Goal! Die zat erin! ⚽', 'Raak! Wat een combinatie! 🥊', 'Precies goed. Dat was een knock-out antwoord!', 'Ja! Jij bent in topvorm vandaag.', 'Helemaal goed! High five! 🙌', 'Scoren maar! Weer eentje binnen.', 'Bam, goed! Zo doet een kampioen dat.', 'Top! De hele tribune juicht voor jou.'];
const OOPS = ['Net naast. Geeft niks: zelfs de beste spits mist weleens. Kijk even mee naar de herhaling.', 'Deze counter was gemeen. Kom, we zoeken samen uit waar het misging.', 'Niet goed, wél goed geprobeerd. Even de tactiek bekijken.', 'Foutje! Mooi, want van een rematch word je sterker.', 'Hé, elke kampioen heeft eerst duizend keer gemist. Kijk even mee.'];

/* ===== Uitlegfilmpjes van het YouTube-kanaal Wijzer over de Basisschool: id -> [seconden, titel] ===== */
const VID = {
  'qsAlM2o4E1c': [502, 'Getallen afronden'], 'NxwRgMM29_Q': [469, 'Kommagetallen vermenigvuldigen'], 'SpK5lVL8rCM': [150, 'Minsommen met kommagetallen'],
  'HQpPDmSyT3Y': [408, 'Van procenten naar breuken'], 'PYVIS91pnEg': [672, 'Breuken in 7 stappen'], 'Asncx7_cPeI': [774, 'Metriek stelsel: inhoudsmaten'],
  'AjyPazr3PO4': [1096, 'Metriek stelsel: lengtematen'], 'wpYpC1UKCyg': [118, 'Maten omrekenen: ezelsbruggetje'], 'HSvcc0uNxQ4': [935, 'Korting berekenen'],
  '3O5puB-43ZI': [606, 'Omtrek berekenen'], 'ZdTYf27SnNA': [639, 'Oppervlakte berekenen'], 'zxkRDZq111g': [787, 'De verhoudingstabel'],
  'CgY8Xn0yjrQ': [253, 'Gelijknamig maken van breuken'], 'Kf6w-zeZfgw': [175, 'Wat zijn kommagetallen?'], 'jTuSwkbM370': [496, 'Klokkijken: analoog naar digitaal'],
  'ILpcOpAuHCU': [134, 'Breuken, kommagetallen, verhoudingen en procenten'], 'tvz3yPUFRmY': [339, 'Werkwoordspelling d of t'], 'RoymgdKweno': [617, 'Voltooid deelwoord'],
  'iN2iJbhk8D0': [584, 'Persoonsvorm vinden op 3 manieren'], 'EK6sDcvkWFk': [521, 'Wat is het onderwerp in een zin?'], 'Riz75rOb_hQ': [167, 'Ontleden: een zin in zinsdelen verdelen'],
  'yzTZPVu1tT0': [599, 'Wat is een zelfstandig naamwoord?'], 'xuU62E2HVLA': [321, 'Bijvoeglijk naamwoord'], 'uO6sBGxwRAs': [645, 'Wat is een werkwoord?'],
  'BODVykxmSM8': [131, 'Redekundig en taalkundig ontleden'], 'OKUUbXBOkZM': [339, 'Wanneer gebruik je hoofdletters?'], 'OtRptQk0SSM': [370, 'Hoofdgedachte van een tekst vinden'],
  'eNWKBtZZLBA': [625, 'Signaalwoorden bij begrijpend lezen'], 'ppEG5obSqWA': [415, 'Verwijswoorden in 4 stappen'], 'h8KXEH4ylgA': [588, 'Begrijpend lezen: samenvatten'],
  '1Q08WXn3L44': [619, 'Woordenschat vergroten op 6 manieren']
};
Object.entries({ afronden: 'qsAlM2o4E1c', kommaKeer: 'NxwRgMM29_Q', kommaMin: 'SpK5lVL8rCM', procBreuk: 'HQpPDmSyT3Y', deelVan: 'PYVIS91pnEg', maten: 'Asncx7_cPeI', korting: 'HSvcc0uNxQ4', rechthoek: 'ZdTYf27SnNA', verhouding: 'zxkRDZq111g', breukOrde: 'CgY8Xn0yjrQ', plaatswaarde: 'Kf6w-zeZfgw', getallenlijn: 'Kf6w-zeZfgw', klok: 'jTuSwkbM370', eenOpDe: 'ILpcOpAuHCU', vereenvoudig: 'PYVIS91pnEg', geld: 'SpK5lVL8rCM', ww_tt: 'tvz3yPUFRmY', ww_vt: 'tvz3yPUFRmY', ww_vd: 'RoymgdKweno', ont_pv: 'iN2iJbhk8D0', ont_ow: 'EK6sDcvkWFk', ont_gez: 'Riz75rOb_hQ', ont_ws: 'BODVykxmSM8', tv_lees: 'OKUUbXBOkZM', lez_hoofd: 'OtRptQk0SSM', lez_verband: 'eNWKBtZZLBA', lez_info: 'h8KXEH4ylgA', wsch: '1Q08WXn3L44' }).forEach(([k, v]) => { SKILLS[k].v = v; });
/* Sommige onderdelen hebben per vraag een preciezer filmpje */
const vwrap = (id, f) => { const g = GEN[id]; GEN[id] = (l, c) => { const q = g(l, c), v = f(q); if (v) q.v = v; return q; }; };
vwrap('maten', q => /liter/.test(q.prompt) ? 'Asncx7_cPeI' : /kg|gram/.test(q.prompt) ? 'wpYpC1UKCyg' : 'AjyPazr3PO4');
vwrap('rechthoek', q => /<b>omtrek/.test(q.prompt) ? '3O5puB-43ZI' : 'ZdTYf27SnNA');
vwrap('ont_ws', q => ({ 'zelfstandig naamwoord': 'yzTZPVu1tT0', 'bijvoeglijk naamwoord': 'xuU62E2HVLA', 'werkwoord': 'uO6sBGxwRAs' })[q.correctText]);
vwrap('lez_verband', q => /verwijst|Waarover|Wat doen ze dan/.test(q.prompt) ? 'ppEG5obSqWA' : null);
