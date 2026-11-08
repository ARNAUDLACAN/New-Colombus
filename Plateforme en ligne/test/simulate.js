// Test de calibrage : 4 stratégies types sur 6 périodes
const M = require('../lib/model');
const strat = {
  'Équilibré': () => ({}),
  'Pression': () => ({ heuresSup: 10, service: 'or', budget: { prospection: 450, fidelisation: 50, formation: 0, qvct: 0, accompagnementIA: 0 }, niveauIA: 3, heures: { piloter: 40, organiser: 10, arbitrer: 10, former: 0, informer: 0, evaluer: 20, reconnaitre: 0, cooperer: 0, reguler: 0, terrain: 70 }, etape: 'prospecter' }),
  'Humain': () => ({ teletravail: 1, rituels: true, gouvernance: 'participatif', budget: { prospection: 150, fidelisation: 150, formation: 200, qvct: 150, accompagnementIA: 100 }, niveauIA: 1, heures: { piloter: 15, organiser: 15, arbitrer: 8, former: 20, informer: 18, evaluer: 12, reconnaitre: 15, cooperer: 15, reguler: 12, terrain: 12 } }),
  'Distribué tôt': () => ({ gouvernance: 'distribue', teletravail: 2, niveauIA: 2 }),
};
const ags = Object.keys(strat).map((n, i) => M.initialAgency(i + 1, n));
for (let p = 1; p <= 6; p++) {
  for (const a of ags) { const raw = Object.assign(M.defaultDecision(a), strat[a.name]()); a.decisions[p] = M.sanitizeDecision(raw, a); }
  const out = M.computePeriod(ags, p);
  console.log('--- P' + p);
  for (const [i, r] of out.entries()) console.log(ags[i].name.padEnd(14), 'CA', r.ca, 'PdM', r.partMarche, 'sat', r.satisfaction, 'réal', r.realisation, 'chAdm', r.chargeAdm, 'QVCT', r.barometre, 'eng', r.engagement, 'én', r.energie, 'conf', r.confiance, 'coop', r.cooperation, 'abs', r.absenteisme, 'dép', r.departs.join(','), 'budget', r.budget.solde, 'score', JSON.stringify(r.score));
}
