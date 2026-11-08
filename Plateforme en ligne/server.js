// New Colombus — serveur de jeu en ligne
// Node 18+ · Express + Socket.io · état en mémoire, sauvegardé dans data/sessions.json

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const ExcelJS = require('exceljs');
const M = require('./lib/model');
const C = require('./lib/content');
const IA = require('./lib/interview');
const D = require('./lib/dialogues');
const scripte = id => !IA.enabled() && D.has(id);

const PORT = process.env.PORT || 3000;
const ANIMATEUR_CODE = process.env.ANIMATEUR_CODE || '';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'sessions.json');

const app = express();
app.use(express.json({ limit: '300kb' }));
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));
const server = http.createServer(app);
const io = new Server(server);

let sessions = {};

// ---------------------------------------------------------------- persistance
function load() {
  try { if (fs.existsSync(DATA_FILE)) sessions = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) || {}; }
  catch (e) { console.error('Lecture des sessions impossible :', e.message); }
}
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      const limit = Date.now() - 120 * 864e5; // une partie se conserve 4 mois
      for (const [k, s] of Object.entries(sessions)) if (s.updatedAt < limit) delete sessions[k];
      fs.writeFileSync(DATA_FILE, JSON.stringify(sessions));
    } catch (e) { console.error('Sauvegarde impossible :', e.message); }
  }, 400);
}

// ---------------------------------------------------------------- utilitaires
const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const newCode = () => { let c; do { c = Array.from({ length: 5 }, () => ALPHA[crypto.randomInt(ALPHA.length)]).join(''); } while (sessions[c]); return c; };
const newId = () => crypto.randomBytes(12).toString('base64url');
const clean = (t, n) => String(t == null ? '' : t).replace(/[\u0000-\u0008\u000b-\u001f]/g, ' ').trim().slice(0, n);
const NOMS_AGENCES = ['Agence Nord', 'Agence Sud', 'Agence Est', 'Agence Ouest', 'Agence Centre', 'Agence Atlantique', 'Agence Méditerranée', 'Agence Alpes', 'Agence Rhône', 'Agence Loire'];

function sanitizeConfig(c = {}) {
  const nbPeriodes = Math.max(3, Math.min(6, +c.nbPeriodes || 5));
  const nbAgences = Math.max(1, Math.min(10, +c.nbAgences || 4));
  const prog = Array.isArray(c.programme) ? c.programme : [];
  const programme = Array.from({ length: nbPeriodes }, (_, i) => {
    const p = prog[i] || C.PROGRAMME_DEFAUT[i] || C.PROGRAMME_DEFAUT[0];
    return {
      entretien: C.ENTRETIENS.some(e => e.id === p.entretien) ? p.entretien : (p.entretien === 'aucun' ? 'aucun' : C.PROGRAMME_DEFAUT[i % 6].entretien),
      dilemme: C.DILEMMES.some(e => e.id === p.dilemme) ? p.dilemme : (p.dilemme === 'aucun' ? 'aucun' : C.PROGRAMME_DEFAUT[i % 6].dilemme),
    };
  });
  // handicap de Nicolas : période de survenue (0 = désactivé) ; ses scénarios ne sont joués qu'après
  const hp = c.handicapPeriode == null || c.handicapPeriode === '' ? Math.min(C.HANDICAP.periode, nbPeriodes) : Math.max(0, Math.min(nbPeriodes, +c.handicapPeriode || 0));
  const FALLBACK = { entretien: 'qvct-karim', dilemme: 'teletravail-laetitia' };
  programme.forEach((p, i) => {
    for (const k of ['entretien', 'dilemme']) {
      const list = k === 'entretien' ? C.ENTRETIENS : C.DILEMMES;
      const it = list.find(x => x.id === p[k]);
      if (it && it.handicap && (!hp || i + 1 < hp)) p[k] = FALLBACK[k];
    }
  });
  return { titre: clean(c.titre, 80) || 'New Colombus', campus: clean(c.campus, 60), groupe: clean(c.groupe, 60), nbAgences, nbPeriodes, programme, handicapPeriode: hp };
}

function createSession(config) {
  const cfg = sanitizeConfig(config);
  const code = newCode();
  const s = {
    code, token: newId(), createdAt: Date.now(), updatedAt: Date.now(), config: cfg,
    phase: 'lobby', periode: 0,
    agencies: Array.from({ length: cfg.nbAgences }, (_, i) => M.initialAgency(i + 1, NOMS_AGENCES[i] || 'Agence ' + (i + 1))),
    teams: {}, journal: [],
  };
  for (const a of s.agencies) { a.reporting = {}; a.valide = {}; a.brouillon = M.defaultDecision(a); }
  sessions[code] = s;
  log(s, `Partie « ${cfg.titre} » créée. Code : ${code}.`);
  save();
  return s;
}
function log(s, text) { s.journal.push({ t: Date.now(), periode: s.periode, text }); if (s.journal.length > 400) s.journal.shift(); }

// ---------------------------------------------------------------- vues
const scenarioPublic = id => { const e = C.ENTRETIENS.find(x => x.id === id); if (!e) return null; const p = C.COLLABS.find(c => c.id === e.collab); return { id: e.id, theme: e.theme, collab: e.collab, collabNom: p && p.nom, manager: e.manager }; };
const dilemmePublic = id => { const d = C.DILEMMES.find(x => x.id === id); if (!d) return null; return { id: d.id, titre: d.titre, texte: d.texte, options: d.options.map(o => ({ id: o.id, label: o.label })) }; };

function classement(s) {
  return s.agencies.map(a => {
    const h = a.history.at(-1);
    return { id: a.id, name: a.name, equipe: (s.teams[a.id] || {}).nomEquipe || '', ca: h ? h.ca : 116480, partMarche: h ? h.partMarche : Math.round(1000 / (2 * s.agencies.length)) / 10, satisfaction: h ? h.satisfaction : 64, barometre: h ? h.barometre : 51.2, engagement: h ? h.engagement : 57.8, score: h ? h.score : null };
  }).sort((x, y) => ((y.score && y.score.total) || 0) - ((x.score && x.score.total) || 0));
}

function agencyFull(s, a) {
  const p = s.periode;
  const prog = s.config.programme[p - 1];
  const dec = a.decisions[p] || a.brouillon;
  return {
    id: a.id, name: a.name, equipe: (s.teams[a.id] || {}).nomEquipe || '', connectes: (s.teams[a.id] || {}).online || 0,
    periode0: M.periode0(M.initialAgency(a.id, a.name), s.agencies.length), history: a.history,
    brouillon: dec, valide: !!a.valide[p], budget: M.budgetInfo(a, dec),
    etat: { handicap: M.handicapActif(a) ? { depuis: a.handicap.depuis, annonce: C.HANDICAP.annonce, nouveau: a.handicap.depuis === s.periode } : null, clients: a.clients, niveauIA: a.niveauIA, gouvernance: a.gouvernance, maitriseIA: a.maitriseIA, coop: a.coop, pending: { budget: a.pending.budget, heuresManager: a.pending.heuresManager } },
    collabs: a.collabs.filter(c => c.present).map(c => ({ id: c.id, base: c.base, nom: c.nom, role: c.role, recrue: !!c.recrue, pasEncore: !!c.pasEncore })),
    dilemme: prog && prog.dilemme !== 'aucun' ? dilemmePublic(prog.dilemme) : null,
    choixDilemme: a.dilemmes[p] ? a.dilemmes[p].option : null,
    dilemmesPasses: Object.fromEntries(Object.entries(a.dilemmes).map(([k, v]) => [k, { ...v, ...(a.history[k - 1] && a.history[k - 1].dilemme ? { logique: a.history[k - 1].dilemme.logique } : {}) }])),
    scenario: prog && prog.entretien !== 'aucun' ? scenarioPublic(prog.entretien) : null,
    entretien: a.entretiens[p] || null, entretiens: a.entretiens,
    script: prog && scripte(prog.entretien) ? { ouverture: D.DIALOGUES[prog.entretien].ouverture, vue: a.entretiens[p] && a.entretiens[p].termine ? null : D.etapeVue(prog.entretien, a.entretiens[p] ? (a.entretiens[p].choix || []).length : 0) } : null,
    objectifs: a.objectifs, reporting: a.reporting,
  };
}

function common(s) {
  return { code: s.code, config: s.config, phase: s.phase, periode: s.periode, ia: IA.enabled(), maxEchanges: IA.MAX_ECHANGES, classement: s.phase === 'lobby' || (s.phase === 'periode' && s.periode === 1) ? null : classement(s), serverNow: Date.now() };
}
const teamView = (s, a) => ({ ...common(s), role: 'team', agence: agencyFull(s, a) });
const adminView = s => ({ ...common(s), role: 'admin', token: s.token, classement: classement(s), agences: s.agencies.map(a => agencyFull(s, a)), journal: s.journal.slice(-60), catalogue: catalogue() });
function catalogue() {
  return { entretiens: C.ENTRETIENS.map(e => ({ id: e.id, theme: e.theme, collab: e.collab, brouillon: !!e.brouillon })), dilemmes: C.DILEMMES.map(d => ({ id: d.id, titre: d.titre, brouillon: !!d.brouillon })), defaut: C.PROGRAMME_DEFAUT };
}

function broadcast(s) {
  s.updatedAt = Date.now();
  io.to('a:' + s.code).emit('state', adminView(s));
  for (const a of s.agencies) io.to('t:' + s.code + ':' + a.id).emit('state', teamView(s, a));
  save();
}

// ---------------------------------------------------------------- actions animateur
function adminAction(s, d) {
  const act = d.action;
  if (act === 'open') {
    if (!(s.phase === 'lobby' || s.phase === 'resultats')) throw new Error('Impossible d\'ouvrir une période maintenant.');
    if (s.periode >= s.config.nbPeriodes) throw new Error('Toutes les périodes ont été jouées.');
    s.periode += 1; s.phase = 'periode';
    if (s.config.handicapPeriode && s.periode === s.config.handicapPeriode) {
      for (const a of s.agencies) a.handicap = { id: C.HANDICAP.collab, depuis: s.periode, amenagement: 'aucun' };
      log(s, 'Événement : retour d\'arrêt de Nicolas avec restrictions médicales.');
    }
    for (const a of s.agencies) { a.brouillon = M.sanitizeDecision(a.decisions[s.periode - 1] || a.brouillon, a); a.valide[s.periode] = false; }
    log(s, `Période ${s.periode} ouverte.`);
  } else if (act === 'close') {
    if (s.phase !== 'periode') throw new Error('Aucune période en cours.');
    for (const a of s.agencies) {
      if (!a.decisions[s.periode]) a.decisions[s.periode] = M.sanitizeDecision(a.brouillon, a);
      const prog = s.config.programme[s.periode - 1];
      if (prog.dilemme !== 'aucun' && !a.dilemmes[s.periode]) a.dilemmes[s.periode] = { dilemme: prog.dilemme, option: null, auto: true };
    }
    // un dilemme sans réponse est un report de décision : on applique l'option « b » si elle existe
    for (const a of s.agencies) { const x = a.dilemmes[s.periode]; if (x && !x.option) x.option = 'b'; }
    M.computePeriod(s.agencies, s.periode);
    s.phase = s.periode >= s.config.nbPeriodes ? 'fin' : 'resultats';
    log(s, `Période ${s.periode} calculée.`);
  } else if (act === 'reopen') {
    // revenir en saisie sur la période en cours (avant calcul)
    if (s.phase !== 'periode') throw new Error('Rien à rouvrir.');
    for (const a of s.agencies) a.valide[s.periode] = false;
  } else if (act === 'note') {
    const a = s.agencies.find(x => x.id === +d.agence); const p = +d.periode;
    const prog = s.config.programme[p - 1];
    if (a && !a.entretiens[p] && prog && prog.entretien !== 'aucun' && s.phase === 'periode' && p === s.periode) {
      // entretien joué en classe par l'animateur : il n'y a pas de transcription, seulement la note
      a.entretiens[p] = { scenario: prog.entretien, transcript: [], note: null, termine: true, enClasse: true };
    }
    if (!a || !a.entretiens[p]) throw new Error('Entretien introuvable.');
    if (a.history.length >= p) throw new Error('La période est déjà calculée.');
    const n = d.note === '' || d.note == null ? null : Math.max(0, Math.min(20, +d.note));
    a.entretiens[p].noteAnimateur = n;
    if (a.entretiens[p].note == null && n != null) a.entretiens[p].note = n;
  } else if (act === 'programme') {
    if (s.phase !== 'lobby') throw new Error('Le programme se règle avant la première période.');
    const cfg = sanitizeConfig({ ...s.config, ...d.config });
    if (cfg.nbAgences !== s.agencies.length) {
      s.agencies = Array.from({ length: cfg.nbAgences }, (_, i) => s.agencies[i] || Object.assign(M.initialAgency(i + 1, NOMS_AGENCES[i] || 'Agence ' + (i + 1)), { reporting: {}, valide: {} }));
      for (const a of s.agencies) a.brouillon = a.brouillon || M.defaultDecision(a);
    }
    s.config = cfg;
  } else if (act === 'rename') {
    const a = s.agencies.find(x => x.id === +d.agence); if (a) a.name = clean(d.name, 40) || a.name;
  } else throw new Error('Action inconnue.');
}

// ---------------------------------------------------------------- actions équipe
function teamCtx(data) {
  const s = sessions[clean(data.code, 6).toUpperCase()];
  if (!s) throw new Error('Partie introuvable.');
  const id = Object.keys(s.teams).find(k => s.teams[k].token === data.teamToken);
  if (!id) throw new Error('Équipe non reconnue.');
  return { s, a: s.agencies.find(x => x.id === +id) };
}
const editable = (s, a) => { if (s.phase !== 'periode') throw new Error('La période n\'est pas ouverte.'); if (a.valide[s.periode]) throw new Error('Décisions déjà validées.'); };

async function entretienSay(s, a, text) {
  const p = s.periode, prog = s.config.programme[p - 1];
  const sc = C.ENTRETIENS.find(x => x.id === prog.entretien);
  if (!sc) throw new Error('Pas d\'entretien prévu pour cette période.');
  const ent = a.entretiens[p] = a.entretiens[p] || { scenario: sc.id, transcript: [], note: null, termine: false };
  if (ent.termine) throw new Error('Entretien terminé.');
  if (ent.enCours) throw new Error('Le collaborateur est en train de répondre.');
  const nbManager = ent.transcript.filter(m => m.from === 'manager').length;
  if (nbManager >= IA.MAX_ECHANGES) throw new Error('Nombre maximal d\'échanges atteint : concluez l\'entretien.');
  ent.transcript.push({ from: 'manager', text: clean(text, 1500), t: Date.now() });
  if (!IA.enabled()) { broadcast(s); return; }
  ent.enCours = true; broadcast(s);
  try {
    const c = a.collabs.find(x => (x.id === sc.collab || x.base === sc.collab) && x.present);
    const r = await IA.reply(sc, c, ent.transcript);
    ent.transcript.push({ from: 'collab', text: r, t: Date.now() });
  } catch (e) {
    ent.transcript.pop();
    throw new Error('Le collaborateur n\'a pas pu répondre (' + e.message + '). Réessayez.');
  } finally { ent.enCours = false; broadcast(s); }
}

function entretienChoix(s, a, optId) {
  const p = s.periode, prog = s.config.programme[p - 1];
  if (!prog || !scripte(prog.entretien)) throw new Error('Pas d\'entretien scripté pour cette période.');
  const d = D.DIALOGUES[prog.entretien];
  const ent = a.entretiens[p] = a.entretiens[p] || { scenario: prog.entretien, transcript: [{ from: 'collab', text: d.ouverture, t: Date.now() }], choix: [], note: null, termine: false, scripte: true };
  if (ent.termine) throw new Error('Entretien terminé.');
  const n = ent.choix.length, et = d.etapes[n], i = +optId;
  if (!et || !(i >= 0 && i < et.options.length)) throw new Error('Réplique inconnue.');
  ent.choix.push(i);
  ent.transcript.push({ from: 'manager', text: et.options[i].text, t: Date.now() });
  ent.transcript.push({ from: 'collab', text: et.options[i].reponse, t: Date.now() });
  const suiv = d.etapes[n + 1];
  if (suiv && suiv.relance) ent.transcript.push({ from: 'collab', text: suiv.relance, t: Date.now() });
  if (ent.choix.length >= d.etapes.length) {
    ent.termine = true;
    const ev = D.evaluer(prog.entretien, ent.choix, C.GRILLE);
    Object.assign(ent, { note: ev.note, evaluation: ev });
  }
  broadcast(s);
}

async function entretienEnd(s, a) {
  const p = s.periode, ent = a.entretiens[p];
  if (!ent || !ent.transcript.length) throw new Error('Aucun entretien à conclure.');
  if (ent.termine) return;
  ent.termine = true;
  if (!IA.enabled()) { broadcast(s); return; }
  ent.enCours = true; broadcast(s);
  try {
    const ev = await IA.evaluate(C.ENTRETIENS.find(x => x.id === ent.scenario), ent.transcript);
    Object.assign(ent, { note: ev.note, evaluation: ev });
  } catch (e) { ent.erreurEval = e.message; }
  finally { ent.enCours = false; broadcast(s); }
}

// ---------------------------------------------------------------- sockets
io.on('connection', socket => {
  const ok = (cb, x) => typeof cb === 'function' && cb({ ok: true, ...x });
  const ko = (cb, e) => typeof cb === 'function' && cb({ ok: false, error: e.message || String(e) });
  let teamRef = null;

  socket.on('admin:create', (data, cb) => {
    try {
      if (ANIMATEUR_CODE && (data || {}).animateurCode !== ANIMATEUR_CODE) throw new Error('Code animateur incorrect.');
      const s = createSession((data || {}).config); socket.join('a:' + s.code); ok(cb, { code: s.code, token: s.token }); broadcast(s);
    } catch (e) { ko(cb, e); }
  });
  socket.on('admin:join', (data, cb) => {
    const s = sessions[clean((data || {}).code, 6).toUpperCase()];
    if (!s || s.token !== data.token) return ko(cb, new Error('Partie introuvable ou accès refusé.'));
    socket.join('a:' + s.code); ok(cb); socket.emit('state', adminView(s));
  });
  socket.on('admin:action', (data, cb) => {
    const s = sessions[clean((data || {}).code, 6).toUpperCase()];
    if (!s || s.token !== data.token) return ko(cb, new Error('Accès refusé.'));
    try { adminAction(s, data); ok(cb); broadcast(s); } catch (e) { ko(cb, e); }
  });

  socket.on('lobby:info', (data, cb) => {
    const s = sessions[clean((data || {}).code, 6).toUpperCase()];
    if (!s) return ko(cb, new Error('Code inconnu.'));
    ok(cb, { titre: s.config.titre, campus: s.config.campus, agences: s.agencies.map(a => ({ id: a.id, name: a.name, prise: !!s.teams[a.id], equipe: (s.teams[a.id] || {}).nomEquipe || '' })) });
  });
  socket.on('team:join', (data, cb) => {
    try {
      const s = sessions[clean(data.code, 6).toUpperCase()]; if (!s) throw new Error('Code inconnu.');
      const a = s.agencies.find(x => x.id === +data.agence); if (!a) throw new Error('Agence inconnue.');
      let t = s.teams[a.id];
      if (t && t.token !== data.teamToken) {
        // rejoindre une agence déjà prise : il faut son code d'équipe
        if (clean(data.codeEquipe, 8).toUpperCase() !== t.codeEquipe) throw new Error('Cette agence est déjà dirigée par une équipe. Demandez-lui son code d\'équipe.');
      }
      if (!t) { t = s.teams[a.id] = { token: newId(), codeEquipe: Array.from({ length: 4 }, () => ALPHA[crypto.randomInt(ALPHA.length)]).join(''), nomEquipe: clean(data.nomEquipe, 40) || a.name, online: 0 }; log(s, `${t.nomEquipe} prend la direction de ${a.name}.`); }
      teamRef = { code: s.code, id: a.id }; t.online++;
      socket.join('t:' + s.code + ':' + a.id); ok(cb, { teamToken: t.token, codeEquipe: t.codeEquipe }); broadcast(s);
    } catch (e) { ko(cb, e); }
  });
  socket.on('team:resume', (data, cb) => {
    try {
      const { s, a } = teamCtx(data); const t = s.teams[a.id];
      teamRef = { code: s.code, id: a.id }; t.online++;
      socket.join('t:' + s.code + ':' + a.id); ok(cb, { codeEquipe: t.codeEquipe }); broadcast(s);
    } catch (e) { ko(cb, e); }
  });
  socket.on('team:draft', (data, cb) => {
    try { const { s, a } = teamCtx(data); editable(s, a); a.brouillon = M.sanitizeDecision(data.decision, a); ok(cb, { budget: M.budgetInfo(a, a.brouillon) }); broadcast(s); } catch (e) { ko(cb, e); }
  });
  socket.on('team:validate', (data, cb) => {
    try {
      const { s, a } = teamCtx(data); editable(s, a);
      const d = M.sanitizeDecision(data.decision || a.brouillon, a); const b = M.budgetInfo(a, d);
      if (!b.ok) throw new Error(b.solde < 0 ? `Budget dépassé de ${-b.solde} UM.` : `Planning du manager dépassé de ${-b.soldeHeures} h.`);
      const prog = s.config.programme[s.periode - 1];
      if (prog.dilemme !== 'aucun' && !(a.dilemmes[s.periode] && a.dilemmes[s.periode].option)) throw new Error('Tranchez d\'abord le dilemme de la période.');
      a.brouillon = d; a.decisions[s.periode] = d; a.valide[s.periode] = true;
      log(s, `${a.name} a validé ses décisions.`); ok(cb); broadcast(s);
    } catch (e) { ko(cb, e); }
  });
  socket.on('team:unvalidate', (data, cb) => {
    try { const { s, a } = teamCtx(data); if (s.phase !== 'periode') throw new Error('Trop tard.'); a.valide[s.periode] = false; delete a.decisions[s.periode]; ok(cb); broadcast(s); } catch (e) { ko(cb, e); }
  });
  socket.on('team:dilemme', (data, cb) => {
    try {
      const { s, a } = teamCtx(data); editable(s, a);
      const prog = s.config.programme[s.periode - 1]; const dil = C.DILEMMES.find(x => x.id === prog.dilemme);
      if (!dil || !dil.options.some(o => o.id === data.option)) throw new Error('Option inconnue.');
      if (a.dilemmes[s.periode] && a.dilemmes[s.periode].option) throw new Error('Le dilemme est déjà tranché.');
      a.dilemmes[s.periode] = { dilemme: dil.id, option: data.option, justification: clean(data.justification, 600) };
      ok(cb); broadcast(s);
    } catch (e) { ko(cb, e); }
  });
  socket.on('team:objectifs', (data, cb) => {
    try {
      const { s, a } = teamCtx(data); if (s.periode > 1 && s.phase !== 'lobby') throw new Error('Le contrat d\'objectifs se signe avant la fin de la période 1.');
      const o = data.objectifs || {};
      a.objectifs = { ca: Math.max(0, +o.ca || 0), satisfaction: Math.max(0, Math.min(100, +o.satisfaction || 0)), barometre: Math.max(0, Math.min(100, +o.barometre || 0)), engagement: Math.max(0, Math.min(100, +o.engagement || 0)), strategie: clean(o.strategie, 1500) };
      ok(cb); broadcast(s);
    } catch (e) { ko(cb, e); }
  });
  socket.on('team:reporting', (data, cb) => {
    try {
      const { s, a } = teamCtx(data); const p = +data.periode;
      if (!(p >= 1 && p <= s.periode)) throw new Error('Période invalide.');
      const r = a.reporting[p] = a.reporting[p] || {};
      for (const k of ['choix', 'attendus', 'analyse']) if (data[k] != null) r[k] = clean(data[k], 3000);
      ok(cb); broadcast(s);
    } catch (e) { ko(cb, e); }
  });
  socket.on('team:entretien:say', async (data, cb) => {
    try { const { s, a } = teamCtx(data); editable(s, a); await entretienSay(s, a, data.text); ok(cb); } catch (e) { ko(cb, e); }
  });
  socket.on('team:entretien:choix', (data, cb) => {
    try { const { s, a } = teamCtx(data); editable(s, a); entretienChoix(s, a, data.option); ok(cb); } catch (e) { ko(cb, e); }
  });
  socket.on('team:entretien:end', async (data, cb) => {
    try { const { s, a } = teamCtx(data); editable(s, a); await entretienEnd(s, a); ok(cb); } catch (e) { ko(cb, e); }
  });

  socket.on('disconnect', () => {
    if (!teamRef) return; const s = sessions[teamRef.code]; if (!s) return;
    const t = s.teams[teamRef.id]; if (t) t.online = Math.max(0, t.online - 1); broadcast(s);
  });
});

// ---------------------------------------------------------------- API et exports
app.get('/api/health', (req, res) => res.json({ ok: true, sessions: Object.keys(sessions).length, ia: IA.enabled() }));
app.get('/api/catalogue', (req, res) => res.json({ ...catalogue(), amenagements: C.AMENAGEMENTS, handicap: C.HANDICAP, collabs: C.COLLABS, leviers: C.LEVIERS, gouvernances: C.GOUVERNANCES, services: C.SERVICES, grille: C.GRILLE, params: M.PARAMS, animateurCodeRequis: !!ANIMATEUR_CODE }));
function auth(req, res) {
  const s = sessions[String(req.params.code || '').toUpperCase()];
  if (!s || s.token !== req.query.token) { res.status(403).json({ error: 'Accès refusé' }); return null; }
  return s;
}

// Briefs complets des entretiens (directeur et collaborateur), réservés à l'animateur
app.get('/api/sessions/:code/briefs', (req, res) => {
  const s = auth(req, res); if (!s) return;
  res.json({ grille: C.GRILLE, collabs: C.COLLABS, programme: s.config.programme, entretiens: C.ENTRETIENS.map(e => ({ id: e.id, theme: e.theme, collab: e.collab, brouillon: !!e.brouillon, handicap: !!e.handicap, vigilance: e.vigilance || '', manager: e.manager, collaborateur: e.collaborateur })) });
});

app.get('/api/sessions/:code/export.xlsx', async (req, res) => {
  const s = auth(req, res); if (!s) return;
  const wb = new ExcelJS.Workbook(); wb.creator = 'New Colombus';
  const head = (ws, cols) => { ws.columns = cols; ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }; ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D2236' } }; };
  // synthèse
  const syn = wb.addWorksheet('Classement');
  head(syn, [{ header: 'Rang', key: 'rang', width: 6 }, { header: 'Agence', key: 'name', width: 22 }, { header: 'Équipe', key: 'equipe', width: 24 }, { header: 'Score total', key: 'total', width: 12 }, { header: 'Score économique', key: 'eco', width: 16 }, { header: 'Score social', key: 'social', width: 13 }, { header: 'CA (UM)', key: 'ca', width: 12 }, { header: 'Croissance CA (%)', key: 'croissance', width: 16 }, { header: 'Part de marché (%)', key: 'partMarche', width: 16 }, { header: 'Satisfaction', key: 'satisfaction', width: 12 }, { header: 'Baromètre QVCT', key: 'barometre', width: 15 }, { header: 'Engagement', key: 'engagement', width: 12 }]);
  classement(s).forEach((c, i) => syn.addRow({ rang: i + 1, ...c, total: c.score && c.score.total, eco: c.score && c.score.eco, social: c.score && c.score.social, croissance: c.score && c.score.croissance }));
  // une feuille par agence
  for (const a of s.agencies) {
    const ws = wb.addWorksheet(a.name.slice(0, 28));
    const rows = [M.periode0(M.initialAgency(a.id, a.name), s.agencies.length), ...a.history];
    const ind = [
      ['CA total (UM)', r => r.ca], ['CA TPE', r => r.caTPE], ['CA PME', r => r.caPME], ['Clients', r => r.clients], ['Nouveaux clients', r => r.nouveaux], ['Clients perdus', r => r.perdus], ['Taux de chute (%)', r => r.tauxChute], ['Contrats par client', r => r.cpc], ['Part de marché (%)', r => r.partMarche],
      ['Satisfaction client', r => r.satisfaction], ['Taux de réalisation (%)', r => r.realisation], ['Charge administrative (%)', r => r.chargeAdm], ['Charge commerciale (%)', r => r.chargeCom],
      ['Baromètre QVCT', r => r.barometre], ['QVCT · charge', r => r.qvct.charge], ['QVCT · sens', r => r.qvct.sens], ['QVCT · reconnaissance', r => r.qvct.reconnaissance], ['QVCT · autonomie', r => r.qvct.autonomie], ['QVCT · relations', r => r.qvct.relations],
      ['Engagement', r => r.engagement], ['Énergie', r => r.energie], ['Confiance', r => r.confiance], ['Compétences', r => r.competences], ['Coopération', r => r.cooperation], ['Absentéisme (%)', r => r.absenteisme], ['Départs', r => (r.departs || []).join(', ')],
      ['Niveau du copilote IA', r => r.niveauIA], ['Aménagement du poste de Nicolas', r => r.amenagement ? C.AMENAGEMENTS[r.amenagement].label : ''], ['Maîtrise de l\'IA', r => r.maitriseIA], ['Gouvernance', r => r.gouvernance], ['Score total', r => r.score && r.score.total],
    ];
    head(ws, [{ header: 'Indicateur', key: 'k', width: 28 }, ...rows.map(r => ({ header: 'P' + r.periode, key: 'p' + r.periode, width: 11 }))]);
    for (const [label, f] of ind) { const o = { k: label }; rows.forEach(r => { try { o['p' + r.periode] = f(r); } catch { o['p' + r.periode] = ''; } }); ws.addRow(o); }
    ws.addRow({});
    ws.addRow({ k: 'Dilemmes' }).font = { bold: true };
    for (const [p, x] of Object.entries(a.dilemmes)) { const dil = C.DILEMMES.find(d => d.id === x.dilemme); const opt = dil && dil.options.find(o => o.id === x.option); ws.addRow({ k: 'P' + p + ' · ' + (dil ? dil.titre : ''), p1: opt ? opt.label + ' — ' + opt.logique : '' }); }
    ws.addRow({ k: 'Entretiens' }).font = { bold: true };
    for (const [p, e] of Object.entries(a.entretiens)) { const sc = C.ENTRETIENS.find(x => x.id === e.scenario); ws.addRow({ k: 'P' + p + ' · ' + (sc ? sc.theme : ''), p1: e.noteAnimateur != null ? e.noteAnimateur : e.note, p2: e.evaluation ? e.evaluation.pointsForts + ' / ' + e.evaluation.axesProgres : '' }); }
  }
  // entretiens complets
  const ent = wb.addWorksheet('Entretiens');
  head(ent, [{ header: 'Agence', key: 'a', width: 20 }, { header: 'Période', key: 'p', width: 8 }, { header: 'Thème', key: 'th', width: 28 }, { header: 'Note /20', key: 'n', width: 9 }, { header: 'Transcription', key: 't', width: 120 }]);
  for (const a of s.agencies) for (const [p, e] of Object.entries(a.entretiens)) {
    const sc = C.ENTRETIENS.find(x => x.id === e.scenario);
    ent.addRow({ a: a.name, p: +p, th: sc && sc.theme, n: e.noteAnimateur != null ? e.noteAnimateur : e.note, t: e.transcript.map(m => (m.from === 'manager' ? 'Directeur : ' : (sc ? C.COLLABS.find(c => c.id === sc.collab).nom : 'Collaborateur') + ' : ') + m.text).join('\n') }).alignment = { wrapText: true, vertical: 'top' };
  }
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="NewColombus_${s.code}.xlsx"`);
  await wb.xlsx.write(res); res.end();
});

load();
server.listen(PORT, () => console.log(`New Colombus prêt sur http://localhost:${PORT} (IA ${IA.enabled() ? 'activée' : 'non configurée'})`));
