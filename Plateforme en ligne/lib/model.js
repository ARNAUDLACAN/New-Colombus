// New Colombus — moteur de simulation.
// Principe : les décisions agissent d'abord sur l'état de l'équipe (compétences, énergie,
// engagement, confiance, coopération), qui produit ensuite les résultats économiques et sociaux.
// Tous les coefficients sont regroupés dans PARAMS pour pouvoir être calibrés.

const C = require('./content');

const PARAMS = {
  budgetPeriode: 1000,        // UM disponibles par période
  heuresManager: 150,
  heuresCollab: 140,
  valeurContrat: { tpe: 100, pme: 170 },
  marche: { tpe: 19, pme: 5 },  // nouveaux clients par agence et par période quand toutes les agences jouent la référence
  licenceIA: 60,              // UM par niveau et par période
  coutRituels: 40, heuresRituels: 8,
  coutRecrutement: 150,
  heuresParContrat: { bronze: 0.2175, argent: 0.2655, or: 0.3255 }, // calibré pour 3 administratifs
};

const clamp = (x, a = 0, b = 100) => Math.max(a, Math.min(b, x));
const eff = (h, ref) => 1 - Math.exp(-Math.max(0, h) / ref);
const mean = a => (a.length ? a.reduce((s, x) => s + x, 0) / a.length : 0);
const r1 = x => Math.round(x * 10) / 10;

// ------------------------------------------------------------------ état initial
function initialAgency(id, name) {
  return {
    id, name,
    clients: { tpe: 280, pme: 70 },
    cpc: { tpe: 2.8, pme: 3.2 },
    satisfaction: 64,
    coop: 52,
    maitriseIA: 15,
    niveauIA: 0,
    gouvernance: 'directif',
    collabs: C.COLLABS.map(c => ({ id: c.id, nom: c.nom, role: c.role, ...c.init, abs: 0.03, bas: 0, present: true, recrue: false })),
    pending: { formation: 0, budget: 0, heuresManager: 0, collab: [], licenceOfferte: 0 },
    history: [],         // résultats de chaque période
    decisions: {},       // décisions par période
    dilemmes: {},        // choix par période
    entretiens: {},      // entretiens par période
    objectifs: null,     // contrat d'objectifs
  };
}

function defaultDecision(a) {
  const d = {
    etape: 'equilibre', partTPE: 70, service: 'argent',
    budget: { prospection: 250, fidelisation: 150, formation: 100, qvct: 50, accompagnementIA: 0 },
    heures: {}, teletravail: 0, heuresSup: 0, transfert: 0, rituels: false,
    niveauIA: a ? a.niveauIA : 0, gouvernance: a ? a.gouvernance : 'directif',
    amenagement: a && a.handicap && a.handicap.amenagement ? a.handicap.amenagement : 'aucun',
  };
  for (const l of C.LEVIERS) d.heures[l.id] = 15;
  return d;
}

function sanitizeDecision(raw, a) {
  const d = defaultDecision(a);
  if (!raw || typeof raw !== 'object') return d;
  if (['prospecter', 'developper', 'fideliser', 'equilibre'].includes(raw.etape)) d.etape = raw.etape;
  d.partTPE = clamp(Math.round(+raw.partTPE || 0), 0, 100);
  if (C.SERVICES[raw.service]) d.service = raw.service;
  for (const k of Object.keys(d.budget)) d.budget[k] = clamp(Math.round(+((raw.budget || {})[k]) || 0), 0, 2000);
  for (const l of C.LEVIERS) d.heures[l.id] = clamp(Math.round(+((raw.heures || {})[l.id]) || 0), 0, 150);
  d.teletravail = [0, 1, 2].includes(+raw.teletravail) ? +raw.teletravail : 0;
  d.heuresSup = [0, 5, 10].includes(+raw.heuresSup) ? +raw.heuresSup : 0;
  d.transfert = clamp(Math.round(+raw.transfert || 0), 0, 140);
  d.rituels = !!raw.rituels;
  d.niveauIA = clamp(Math.round(+raw.niveauIA || 0), 0, 3);
  if (C.GOUVERNANCES[raw.gouvernance]) d.gouvernance = raw.gouvernance;
  if (C.AMENAGEMENTS[raw.amenagement]) d.amenagement = raw.amenagement;
  return d;
}

// Handicap survenu en cours de carrière (maintien dans l'emploi)
const handicapActif = a => !!(a.handicap && a.collabs.some(c => c.id === a.handicap.id && c.present));
const estConcerne = (a, c) => handicapActif(a) && c.id === a.handicap.id;

// Contraintes : budget et planning équilibrés
function budgetInfo(a, d) {
  const clientsTot = a.clients.tpe + a.clients.pme;
  const fixes = {
    service: Math.round(C.SERVICES[d.service].cout * clientsTot),
    licenceIA: Math.max(0, d.niveauIA - (a.pending.licenceOfferte || 0)) * PARAMS.licenceIA,
    rituels: d.rituels ? PARAMS.coutRituels : 0,
    recrutement: a.collabs.filter(c => c.recrue === 'arrivee').length * PARAMS.coutRecrutement,
    amenagement: handicapActif(a) ? C.AMENAGEMENTS[d.amenagement].cout : 0,
  };
  const disponible = PARAMS.budgetPeriode + (a.pending.budget || 0);
  const variable = Object.values(d.budget).reduce((s, x) => s + x, 0);
  const totalFixes = Object.values(fixes).reduce((s, x) => s + x, 0);
  const heuresDispo = PARAMS.heuresManager + (a.pending.heuresManager || 0);
  const heuresUtilisees = Object.values(d.heures).reduce((s, x) => s + x, 0) + (d.rituels ? PARAMS.heuresRituels : 0);
  return {
    disponible, fixes, totalFixes, variable, solde: disponible - totalFixes - variable,
    heuresDispo, heuresUtilisees, soldeHeures: heuresDispo - heuresUtilisees,
    ok: disponible - totalFixes - variable >= 0 && heuresDispo - heuresUtilisees >= 0,
  };
}

// ------------------------------------------------------------------ effets de dilemmes
function applyDelta(c, delta) {
  if (!c || !delta) return;
  for (const k of ['comp', 'energie', 'engagement', 'confiance']) if (delta[k]) c[k] = clamp(c[k] + delta[k]);
}

function applyDilemme(a, dilemmeId, optionId, ctx) {
  const dil = C.DILEMMES.find(x => x.id === dilemmeId);
  const opt = dil && dil.options.find(o => o.id === optionId);
  if (!opt) return null;
  const e = opt.effets;
  const pres = a.collabs.filter(c => c.present);
  const notes = [];
  let seuilOk = true;
  if (e.seuilConfiance) seuilOk = mean(pres.map(c => c.confiance)) >= e.seuilConfiance;
  if (e.seuilConfianceCible) { const c0 = pres.find(c => c.id === e.cible); seuilOk = !!c0 && c0.confiance >= e.seuilConfianceCible; }
  const k = seuilOk ? 1 : -0.6;
  if (e.equipe) {
    for (const c of pres) applyDelta(c, { energie: (e.equipe.energie || 0) * k, engagement: (e.equipe.engagement || 0) * k, confiance: (e.equipe.confiance || 0) * k, comp: e.equipe.comp || 0 });
    if (e.equipe.coop) a.coop = clamp(a.coop + e.equipe.coop * k);
  }
  if (!seuilOk) notes.push(e.seuilConfianceCible ? 'La confiance du collaborateur concerné était trop faible : il a vécu la démarche comme une exposition.' : 'La confiance était trop faible : la décision collective a tourné à la confusion.');
  const find = id => a.collabs.find(c => c.id === id && c.present);
  if (e.cible && e.collab) applyDelta(find(e.cible), Object.fromEntries(Object.entries(e.collab).map(([kk, v]) => [kk, v > 0 ? v * k : v])));
  if (e.autre) applyDelta(find(e.autre.id), e.autre);
  if (e.cible && e.differe) a.pending.collab.push({ id: e.cible, delta: e.differe });
  if (!e.cible && e.differe && e.differe.budget) a.pending.budget += e.differe.budget;
  if (e.budget) a.pending.budget += e.budget;
  if (e.heuresManager) a.pending.heuresManager += e.heuresManager;
  if (e.satisfaction) a.satisfaction = clamp(a.satisfaction + e.satisfaction);
  if (e.clients) { a.clients.tpe = Math.round(a.clients.tpe * (1 + e.clients)); a.clients.pme = Math.round(a.clients.pme * (1 + e.clients)); }
  if (e.ia) { a.niveauIA = Math.max(a.niveauIA, e.ia); if (e.ia === 3) a.pending.licenceOfferte = 3; }
  if (e.maitriseIA) a.maitriseIA = clamp(a.maitriseIA + e.maitriseIA);
  const byIa = t => pres.filter(c => C.COLLABS.find(x => x.id === c.id)?.ia === t);
  if (e.inquiets) for (const c of byIa('inquiet')) applyDelta(c, e.inquiets);
  if (e.enthousiastes) for (const c of byIa('enthousiaste')) applyDelta(c, e.enthousiastes);
  if (e.demandeurs) for (const c of pres.filter(c => ['demandeur', 'contraint'].includes(C.COLLABS.find(x => x.id === c.id)?.hybride))) applyDelta(c, e.demandeurs);
  if (e.top && ctx && ctx.top) for (const id of ctx.top) applyDelta(find(id), e.top);
  if (e.depart) { const c = find(e.depart); if (c) { depart(a, c, 'mobilité interne'); notes.push(`${c.nom} quitte l'agence pour une mobilité interne.`); } }
  return { titre: dil.titre, option: opt.label, logique: opt.logique, notes };
}

function depart(a, c, motif) {
  c.present = false; c.motif = motif;
  // un remplaçant arrive à la période suivante
  const base = C.COLLABS.find(x => x.id === c.id);
  a.collabs.push({ id: c.id + '-r' + (a.history.length + 1), base: c.id, nom: 'Recrue (poste de ' + c.nom + ')', role: c.role, comp: 38, energie: 80, engagement: 66, confiance: 50, abs: 0.02, bas: 0, present: true, recrue: 'arrivee', pasEncore: true, traits: base });
}

const traitsOf = c => C.COLLABS.find(x => x.id === (c.base || c.id)) || {};

// ------------------------------------------------------------------ entretien → effets
function applyEntretien(a, ent) {
  if (!ent || ent.note == null) return null;
  const sc = C.ENTRETIENS.find(x => x.id === ent.scenario);
  if (!sc) return null;
  const s = ent.noteAnimateur != null ? ent.noteAnimateur : ent.note;
  const c = a.collabs.find(x => (x.id === sc.collab || x.base === sc.collab) && x.present);
  if (!c) return { note: s, effet: 'Collaborateur absent' };
  applyDelta(c, { engagement: (s - 10) * 1.6, confiance: (s - 10) * 1.4, comp: /compétences/i.test(sc.theme) ? Math.max(0, s - 10) * 0.6 : 0 });
  for (const o of a.collabs.filter(x => x.present && x !== c)) applyDelta(o, { confiance: (s - 10) * 0.3 });
  return { note: s, collab: c.nom };
}

function capacites(a, d) {
  const P = PARAMS;
    const pres = a.collabs.filter(c => c.present && !c.pasEncore);
    const trustAvg = mean(pres.map(c => c.confiance));
    const amp = 0.75 + 0.5 * trustAvg / 100; // Homo credens : la confiance amplifie les leviers
    const e = {};
    for (const l of C.LEVIERS) e[l.id] = eff(d.heures[l.id] || 0, l.ref) * (l.id === 'terrain' ? 1 : amp);
    const gov = d.gouvernance;
    const govOk = gov !== 'distribue' || (trustAvg >= 60 && a.coop >= 55);
    const govMult = gov === 'distribue' ? (govOk ? 1.08 : 0.9) : gov === 'participatif' ? (trustAvg >= 45 ? 1.03 : 1.0) : 1.0;
    const trustMult = 0.85 + 0.3 * trustAvg / 100;
    const prod = c => (0.5 + 0.5 * c.comp / 100) * (0.65 + 0.35 * c.energie / 100) * (0.7 + 0.3 * c.engagement / 100) * govMult * trustMult;
    const ot = 1 + d.heuresSup / 100;
    const iaGain = d.niveauIA * (0.4 + 0.6 * a.maitriseIA / 100);
    const formHeures = d.budget.formation * 0.25;
    const coms = pres.filter(c => c.role === 'com'), adms = pres.filter(c => c.role === 'adm');
    const hRaw = c => P.heuresCollab * ot * (1 - c.abs) * (estConcerne(a, c) ? C.AMENAGEMENTS[d.amenagement].capacite : 1);
    const comRaw = coms.reduce((s, c) => s + hRaw(c), 0) - d.transfert - formHeures * 0.7;
    const ccom = coms.reduce((s, c) => s + hRaw(c) * prod(c), 0) * (1 + 0.06 * iaGain) - d.transfert * 0.75 - formHeures * 0.5 + (d.heures.terrain || 0) * 1.2;
    const cadm = (adms.reduce((s, c) => s + hRaw(c) * prod(c), 0) + d.transfert * 0.55 - formHeures * 0.2) * (1 + 0.12 * iaGain) * (0.9 + 0.2 * e.organiser);
    const clientsTot = a.clients.tpe + a.clients.pme;
    const contrats = a.clients.tpe * a.cpc.tpe + a.clients.pme * a.cpc.pme;
    const demAdm = contrats * P.heuresParContrat[d.service];
    const chargeAdm = demAdm / Math.max(1, cadm);
    const chargeCom = clientsTot * 1.5 / Math.max(1, comRaw);
    const realisation = clamp(cadm / demAdm, 0, 1);
    const parts = { prospecter: [0.6, 0.2, 0.2], developper: [0.2, 0.6, 0.2], fideliser: [0.2, 0.2, 0.6], equilibre: [0.34, 0.33, 0.33] }[d.etape];
    const s = d.partTPE / 100;
    const qual = { bronze: 0.9, argent: 1, or: 1.1 }[d.service];
    const attract = seg => {
      const sh = seg === 'tpe' ? s : 1 - s;
      return Math.pow(Math.max(1, ccom * parts[0] * sh + 3 * d.budget.prospection * sh), 1.1) * (0.8 + 0.4 * a.satisfaction / 100) * qual * (handicapActif(a) ? (C.AMENAGEMENTS[d.amenagement].attraction || 1) : 1);
    };
  return { pres, e, ccom, cadm, chargeAdm, chargeCom, realisation, parts, attract: { tpe: attract('tpe'), pme: attract('pme') }, trustAvg, govOk, gov };
}

// ------------------------------------------------------------------ calcul d'une période (toutes les agences ensemble)
function computePeriod(agencies, periode) {
  const P = PARAMS;
  const N = agencies.length;
  const pre = agencies.map(a => {
    const d = a.decisions[periode] || defaultDecision(a);
    // décisions de transformation
    a.niveauIA = d.niveauIA; a.gouvernance = d.gouvernance;
    if (a.handicap) a.handicap.amenagement = d.amenagement;
    // effets différés en attente (dilemmes de la période précédente)
    for (const p of a.pending.collab) applyDelta(a.collabs.find(c => (c.id === p.id || c.base === p.id) && c.present), p.delta);
    a.pending.collab = [];
    // dilemme de la période
    const dil = a.dilemmes[periode];
    const top = a.history.length ? a.history.at(-1).topVendeurs : ['kevin', 'nicolas'];
    const dilRes = dil ? applyDilemme(a, dil.dilemme, dil.option, { top }) : null;
    const entRes = applyEntretien(a, a.entretiens[periode]);
    const bud = budgetInfo(a, d);
    const k = capacites(a, d);
    return { a, d, bud, dilRes, entRes, ...k };
  });

  // concurrents hors jeu : chaque agence fait face à une agence de référence (situation initiale, décisions par défaut)
  const ref = initialAgency(0, 'ref');
  const kr = capacites(ref, defaultDecision(ref));
  const tot = { tpe: kr.attract.tpe * N, pme: kr.attract.pme * N };
  for (const x of pre) { tot.tpe += x.attract.tpe; tot.pme += x.attract.pme; }

  const out = pre.map(x => {
    const { a, d, e, pres } = x;
    const P2 = PARAMS;
    const nouveaux = {}, perdus = {};
    for (const seg of ['tpe', 'pme']) {
      nouveaux[seg] = Math.round(P2.marche[seg] * 2 * N * x.attract[seg] / tot[seg]);
    }
    const fidEff = eff(x.ccom * x.parts[2] + 1.5 * d.budget.fidelisation, 300);
    const churn = clamp(0.16 - 0.11 * a.satisfaction / 100 - 0.05 * fidEff, 0.02, 0.3);
    const comCompAvg = mean(pres.filter(c => c.role === 'com').map(c => c.comp));
    const devEff = eff(x.ccom * x.parts[1] * comCompAvg / 100 * (0.7 + 0.3 * a.coop / 100), 220);
    for (const seg of ['tpe', 'pme']) {
      perdus[seg] = Math.round(a.clients[seg] * churn);
      a.clients[seg] = Math.max(0, a.clients[seg] - perdus[seg] + nouveaux[seg]);
      const target = 1.8 + 2.8 * devEff + (seg === 'pme' ? 0.4 : 0);
      a.cpc[seg] = clamp(0.6 * a.cpc[seg] + 0.4 * target, 1, 6);
    }
    const ca = { tpe: a.clients.tpe * a.cpc.tpe * PARAMS.valeurContrat.tpe, pme: a.clients.pme * a.cpc.pme * PARAMS.valeurContrat.pme };
    const caTot = ca.tpe + ca.pme;
    const engAvg0 = mean(pres.map(c => c.engagement));
    const dispo = clamp(60 * x.ccom / Math.max(1, a.clients.tpe + a.clients.pme));
    const satTarget = 0.35 * x.realisation * 100 + 0.25 * C.SERVICES[d.service].sat + 0.2 * engAvg0 + 0.2 * dispo;
    a.satisfaction = clamp(0.5 * a.satisfaction + 0.5 * satTarget);

    // --- évolution de l'équipe
    const qvctEff = eff(d.budget.qvct, 150);
    const formEff = eff(a.pending.formation || 0, 300); // formation de la période précédente
    a.pending.formation = d.budget.formation;
    a.maitriseIA = clamp(a.maitriseIA + 25 * eff(d.budget.accompagnementIA, 200) + 6 * e.former * (d.niveauIA > 0 ? 1 : 0) + (d.niveauIA > 0 ? 3 : 0) - 1);
    const govAuto = { directif: 0.3, participatif: 0.55, distribue: x.govOk ? 0.85 : 0.5 }[x.gov];
    const govCadre = { directif: 0.8, participatif: 0.6, distribue: x.govOk ? 0.5 : 0.25 }[x.gov];
    const govSens = { directif: 0.3, participatif: 0.6, distribue: x.govOk ? 0.8 : 0.4 }[x.gov];
    const dims = { charge: [], sens: [], reconnaissance: [], autonomie: [] };
    for (const c of pres) {
      const t = traitsOf(c);
      const charge = c.role === 'adm' ? x.chargeAdm : x.chargeCom * (t.id === 'karim' ? 1.15 : 1);
      const tele = t.hybride === 'demandeur' ? 4 * d.teletravail : t.hybride === 'contraint' ? 6 * d.teletravail : 0;
      const aiK = { inquiet: 6, sceptique: 3, discret: 1.5, enthousiaste: -2 }[t.ia] || 0;
      const aiAnx = d.niveauIA * (100 - a.maitriseIA) / 100 * aiK;
      const otPen = { 0: 0, 5: 8, 10: 18 }[d.heuresSup];
      const am = estConcerne(a, c) ? C.AMENAGEMENTS[d.amenagement] : null;
      const enTarget = 75 - 60 * Math.max(0, charge - 0.9) - otPen + tele + 15 * qvctEff + 6 * e.organiser + 4 * e.reguler - aiAnx - (am ? am.energie : 0);
      c.energie = clamp(c.energie + 0.45 * (enTarget - c.energie));
      const deskill = d.niveauIA >= 2 && a.maitriseIA < 50 ? 2 * d.niveauIA * (50 - a.maitriseIA) / 50 : 0;
      c.comp = clamp(c.comp + (14 * formEff + 6 * e.former) * (1 - c.comp / 110) - 1.5 - deskill);
      const v = {
        sens: 100 * (0.5 * e.informer + 0.3 * e.piloter + 0.2 * govSens),
        reconnaissance: 100 * (0.6 * e.reconnaitre + 0.4 * e.evaluer),
        autonomie: clamp(100 * govAuto + (['demandeur', 'contraint'].includes(t.hybride) ? 6 * d.teletravail : 0)),
        cadre: 100 * (0.5 * e.organiser + 0.3 * e.piloter + 0.2 * govCadre),
        evolution: 100 * (0.6 * e.former + 0.4 * e.evaluer),
      };
      const base = 0.6 * mean(Object.values(v)) + 0.4 * (v[t.besoin] ?? mean(Object.values(v)));
      const engTarget = 0.55 * base + 0.25 * c.energie + 0.2 * c.confiance - (t.ia === 'inquiet' ? aiAnx : 0) + (am ? am.engagement : 0);
      c.engagement = clamp(c.engagement + 0.4 * (engTarget - c.engagement));
      const trTarget = 30 + 25 * e.informer + 20 * e.reguler + 15 * e.reconnaitre + 10 * (x.gov === 'directif' ? 0.6 : 0.9);
      c.confiance = clamp(c.confiance + 0.3 * (trTarget - c.confiance));
      // absences et départs (effets différés)
      c.abs = 0.02 + 0.1 * Math.max(0, (45 - c.energie) / 45) + (am ? am.abs : 0);
      c.bas = c.engagement < 28 && c.energie < 38 ? c.bas + 1 : 0;
      dims.charge.push(clamp(100 - 120 * Math.max(0, charge - 0.8)));
      dims.sens.push(v.sens); dims.reconnaissance.push(v.reconnaissance); dims.autonomie.push(v.autonomie);
    }
    // interculturel : sans temps pour faire coopérer et réguler, la diversité de l'équipe crée des malentendus
    const intl = pres.some(c => traitsOf(c).international) ? 1 : 0;
    const frictionIntl = intl * 8 * (1 - (e.cooperer + e.reguler) / 2) - intl * (d.rituels ? 3 : 0);
    const coopTarget = 35 + 30 * e.cooperer + 15 * e.reguler + (d.rituels ? 12 : 0) - d.teletravail * (d.rituels ? 2 : 7) + (x.gov === 'distribue' ? (x.govOk ? 8 : -8) : 0) - frictionIntl;
    a.coop = clamp(a.coop + 0.4 * (coopTarget - a.coop));
    const departs = [];
    for (const c of pres) if (c.bas >= 2) { depart(a, c, 'démission'); departs.push(c.nom); }
    // les recrues de cette période deviennent opérationnelles
    for (const c of a.collabs) { if (c.recrue === 'arrivee' && !c.pasEncore) c.recrue = true; if (c.pasEncore) c.pasEncore = false; }
    // pénalités consommées
    a.pending.budget = 0; a.pending.heuresManager = 0; a.pending.licenceOfferte = 0;

    const actifs = a.collabs.filter(c => c.present);
    const qvct = {
      charge: mean(dims.charge), sens: mean(dims.sens), reconnaissance: mean(dims.reconnaissance), autonomie: mean(dims.autonomie), relations: a.coop,
    };
    const barometre = mean(Object.values(qvct));
    const vendeurs = actifs.filter(c => c.role === 'com').sort((p, q) => q.comp * q.engagement - p.comp * p.engagement).slice(0, 2).map(c => c.base || c.id);
    const res = {
      periode, ca: Math.round(caTot), caTPE: Math.round(ca.tpe), caPME: Math.round(ca.pme),
      clients: a.clients.tpe + a.clients.pme, clientsTPE: a.clients.tpe, clientsPME: a.clients.pme,
      nouveaux: nouveaux.tpe + nouveaux.pme, perdus: perdus.tpe + perdus.pme, tauxChute: r1(churn * 100),
      cpc: r1((a.cpc.tpe * a.clients.tpe + a.cpc.pme * a.clients.pme) / Math.max(1, a.clients.tpe + a.clients.pme)),
      satisfaction: r1(a.satisfaction), realisation: r1(x.realisation * 100),
      chargeAdm: r1(x.chargeAdm * 100), chargeCom: r1(x.chargeCom * 100),
      qvct: Object.fromEntries(Object.entries(qvct).map(([k, v]) => [k, r1(v)])), barometre: r1(barometre),
      engagement: r1(mean(actifs.map(c => c.engagement))), energie: r1(mean(actifs.map(c => c.energie))),
      confiance: r1(mean(actifs.map(c => c.confiance))), competences: r1(mean(actifs.map(c => c.comp))),
      cooperation: r1(a.coop), absenteisme: r1(mean(actifs.map(c => c.abs)) * 100), departs,
      maitriseIA: r1(a.maitriseIA), niveauIA: d.niveauIA, gouvernance: d.gouvernance, gouvernanceOk: x.govOk, amenagement: handicapActif(a) ? d.amenagement : null,
      budget: x.bud, dilemme: x.dilRes, entretien: x.entRes, topVendeurs: vendeurs,
      equipe: actifs.map(c => ({ id: c.id, nom: c.nom, role: c.role, comp: r1(c.comp), energie: r1(c.energie), engagement: r1(c.engagement), confiance: r1(c.confiance), abs: r1(c.abs * 100), recrue: !!c.recrue })),
    };
    a.history.push(res);
    return res;
  });

  // parts de marché (sur le CA total, concurrents hors jeu inclus)
  const caRef = 116480 * N;
  const caJeu = out.reduce((s, r) => s + r.ca, 0);
  for (const r of out) r.partMarche = r1(100 * r.ca / (caJeu + caRef));
  for (const r of out) r.score = score(agencies.find(a => a.history.includes(r)), r, N);
  return out;
}

// Classement multicritère : moitié performance économique, moitié performance sociale
function score(a, r, N) {
  const partRef = 100 / (2 * N); // part de marché de départ
  const ca0 = 116480;
  const croissance = (r.ca - ca0) / ca0 * 100;
  const eco = 0.5 * clamp((croissance + 10) / 30 * 100) + 0.25 * r.satisfaction + 0.25 * clamp(r.partMarche / partRef * 50);
  const departs = a.history.reduce((s, h) => s + h.departs.length, 0);
  const social = 0.4 * r.barometre + 0.4 * r.engagement + 0.2 * clamp(100 - 30 * departs);
  return { eco: r1(eco), social: r1(social), total: r1((eco + social) / 2), croissance: r1(croissance) };
}

// Situation de départ (période 0) pour affichage
function periode0(a, N = 2) {
  const ca = { tpe: a.clients.tpe * a.cpc.tpe * PARAMS.valeurContrat.tpe, pme: a.clients.pme * a.cpc.pme * PARAMS.valeurContrat.pme };
  return {
    periode: 0, ca: Math.round(ca.tpe + ca.pme), caTPE: Math.round(ca.tpe), caPME: Math.round(ca.pme),
    clients: a.clients.tpe + a.clients.pme, clientsTPE: a.clients.tpe, clientsPME: a.clients.pme, nouveaux: 24, perdus: 27, tauxChute: 7.7,
    cpc: 2.9, satisfaction: 64, realisation: 99, chargeAdm: 101, chargeCom: 75,
    qvct: { charge: 70, sens: 52, reconnaissance: 50, autonomie: 32, relations: 52 }, barometre: 51.2,
    engagement: r1(mean(a.collabs.map(c => c.engagement))), energie: r1(mean(a.collabs.map(c => c.energie))), confiance: r1(mean(a.collabs.map(c => c.confiance))), competences: r1(mean(a.collabs.map(c => c.comp))), cooperation: 52, absenteisme: 3, departs: [], partMarche: r1(100 / (2 * N)),
    maitriseIA: 15, niveauIA: 0, gouvernance: 'directif',
    equipe: a.collabs.map(c => ({ id: c.id, nom: c.nom, role: c.role, comp: c.comp, energie: c.energie, engagement: c.engagement, confiance: c.confiance, abs: 3 })),
  };
}

module.exports = { handicapActif, PARAMS, initialAgency, defaultDecision, sanitizeDecision, budgetInfo, computePeriod, periode0 };
