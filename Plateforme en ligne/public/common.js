// New Colombus — fonctions partagées par toutes les vues
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const qs = k => new URLSearchParams(location.search).get(k);
const fmt = n => (n == null || isNaN(n) ? '–' : Math.round(n).toLocaleString('fr-FR'));
const fmt1 = n => (n == null || isNaN(n) ? '–' : (Math.round(n * 10) / 10).toLocaleString('fr-FR'));
const sgn = n => (n > 0 ? '+' : '') + fmt1(n);

const PHASES = { lobby: 'Embarquement', periode: 'Période en cours', resultats: 'Résultats', fin: 'Fin de partie' };
const COLORS = ['#ff6b4a', '#2ec4b6', '#f4b942', '#6cc5ff', '#c38bff', '#3ddc97', '#ff8fb1', '#a3e635', '#fb923c', '#94a3b8'];
const COLLAB_COLORS = { kevin: '#ff9a76', frederic: '#6cc5ff', nicolas: '#f4b942', karim: '#c38bff', nadia: '#ff8fb1', nadine: '#2ec4b6', laetitia: '#a3e635', joonho: '#fb923c' };
const ETAPES = { prospecter: 'Prospecter', developper: 'Développer', fideliser: 'Fidéliser', equilibre: 'Équilibrer' };

function toast(msg, err) {
  const t = document.createElement('div');
  t.className = 'toast' + (err ? ' err' : ''); t.textContent = msg;
  document.body.appendChild(t); setTimeout(() => t.remove(), err ? 4200 : 2400);
}
function emit(sock, ev, data) {
  return new Promise(res => sock.emit(ev, data, r => { if (!r || !r.ok) toast((r && r.error) || 'Erreur', true); res(r || { ok: false }); }));
}

function meter(label, v, color) {
  return `<div class="meter"><span>${esc(label)}</span><div class="bar" style="--c:${color || tone(v)}"><i style="width:${Math.max(0, Math.min(100, v || 0))}%"></i></div><b>${fmt(v)}</b></div>`;
}
const tone = v => (v >= 65 ? 'var(--pos)' : v >= 45 ? 'var(--gold)' : 'var(--neg)');

function kpi(label, val, delta, color, opts = {}) {
  const d = delta == null || isNaN(delta) ? '' : `<div class="delta ${delta > 0 === !opts.inverse ? 'pos' : delta === 0 ? 'muted' : 'neg'}">${sgn(delta)}${opts.unitDelta || ''} vs période préc.</div>`;
  return `<div class="kpi${opts.big ? ' big' : ''}" style="--c:${color || 'var(--coral)'}"><div class="lbl">${esc(label)}</div><div class="val">${val}</div>${d}</div>`;
}

// Graphique en lignes simple : series = [{name, color, values:[{x, y}]}]
function lineChart(series, opts = {}) {
  const W = opts.w || 640, H = opts.h || 240, L = 46, R = 14, T = 14, B = 28;
  const xs = series.flatMap(s => s.values.map(v => v.x)); const ys = series.flatMap(s => s.values.map(v => v.y)).filter(v => v != null);
  if (!xs.length) return '<p class="muted small">Pas encore de données.</p>';
  const x0 = Math.min(...xs), x1 = Math.max(...xs, x0 + 1);
  let y0 = opts.min != null ? opts.min : Math.min(...ys), y1 = opts.max != null ? opts.max : Math.max(...ys);
  if (y1 - y0 < 1e-9) { y0 -= 1; y1 += 1; }
  const pad = (y1 - y0) * 0.08; if (opts.min == null) y0 -= pad; if (opts.max == null) y1 += pad;
  const X = x => L + (x - x0) / (x1 - x0) * (W - L - R), Y = y => T + (1 - (y - y0) / (y1 - y0)) * (H - T - B);
  const ticks = 4; let g = '';
  for (let i = 0; i <= ticks; i++) { const v = y0 + (y1 - y0) * i / ticks; g += `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="rgba(255,255,255,.08)"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" font-size="11" fill="#8fa6bd">${opts.fmt ? opts.fmt(v) : fmt(v)}</text>`; }
  for (let x = x0; x <= x1; x++) g += `<text x="${X(x)}" y="${H - 8}" text-anchor="middle" font-size="11" fill="#8fa6bd">P${x}</text>`;
  const lines = series.map(s => {
    const pts = s.values.filter(v => v.y != null);
    const d = pts.map((v, i) => (i ? 'L' : 'M') + X(v.x).toFixed(1) + ' ' + Y(v.y).toFixed(1)).join(' ');
    return `<path d="${d}" fill="none" stroke="${s.color}" stroke-width="${s.bold ? 3.5 : 2.2}" stroke-linejoin="round" stroke-linecap="round" ${s.dash ? 'stroke-dasharray="5 5"' : ''}/>` + pts.map(v => `<circle cx="${X(v.x)}" cy="${Y(v.y)}" r="${s.bold ? 4.5 : 3}" fill="${s.color}"><title>${esc(s.name)} · P${v.x} : ${fmt1(v.y)}</title></circle>`).join('');
  }).join('');
  const legend = opts.legend === false ? '' : `<div class="legend">${series.map(s => `<span><i style="background:${s.color}"></i>${esc(s.name)}</span>`).join('')}</div>`;
  return `<div class="chart"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.title || 'graphique')}">${g}${lines}</svg>${legend}</div>`;
}

const compassSVG = `<svg class="compass" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/><circle cx="50" cy="50" r="36" fill="none" stroke="rgba(255,107,74,.35)" stroke-width="1" stroke-dasharray="2 4"/><path d="M50 8 L58 50 L50 92 L42 50 Z" fill="#ff6b4a"/><path d="M8 50 L50 42 L92 50 L50 58 Z" fill="rgba(255,255,255,.55)"/><circle cx="50" cy="50" r="5" fill="#07121f" stroke="#fff" stroke-width="2"/></svg>`;
const brandHTML = sub => `<div class="brand"><svg width="30" height="30" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="6"/><path d="M50 10 L60 50 L50 90 L40 50 Z" fill="#ff6b4a"/></svg><div>New <b>Colombus</b><small>${esc(sub || 'Serious game de management')}</small></div></div>`;
