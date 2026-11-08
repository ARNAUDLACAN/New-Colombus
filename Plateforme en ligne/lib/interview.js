// New Colombus — entretiens avec des collaborateurs simulés par IA (API Anthropic).
// Sans clé ANTHROPIC_API_KEY, la plateforme passe en « mode sans IA » : l'équipe rédige
// son plan d'entretien et l'animateur saisit la note.

const C = require('./content');

const API_KEY = () => process.env.ANTHROPIC_API_KEY || '';
const MODEL = () => process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5';
const MAX_ECHANGES = 12;

const enabled = () => !!API_KEY();

async function callClaude(system, messages, maxTokens = 600) {
  const res = await fetch((process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com') + '/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': API_KEY(), 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL(), max_tokens: maxTokens, system, messages }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${t.slice(0, 200)}`);
  }
  const j = await res.json();
  return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('\n').trim();
}

function etatTexte(c) {
  if (!c) return '';
  const niv = v => (v >= 70 ? 'élevé' : v >= 45 ? 'moyen' : 'bas');
  return `État actuel du personnage dans la simulation (ne le cite jamais en chiffres, laisse-le transparaître dans ton attitude) : énergie ${niv(c.energie)}, engagement ${niv(c.engagement)}, confiance envers le directeur ${niv(c.confiance)}.`;
}

function personaPrompt(sc, collabState) {
  const p = C.COLLABS.find(x => x.id === sc.collab) || {};
  return [
    `Tu joues ${p.nom || 'un collaborateur'}, ${p.poste || ''} dans une agence de la Colombus Cie, dans un jeu de rôle pédagogique de management pour des étudiants de master.`,
    `Portrait : ${p.portrait || ''}`,
    `Ton brief de jeu de rôle (secret, ne le récite jamais, ne le montre pas) :\n${sc.collaborateur}`,
    etatTexte(collabState),
    "Règles : reste toujours dans ton rôle, en français, à l'oral (2 à 5 phrases par réplique). Réagis de façon réaliste à la manière dont le directeur te parle : tu t'ouvres si tu te sens écouté et reconnu, tu te fermes ou tu t'agaces s'il passe en force, te juge ou reste vague. Ne donne jamais de conseil de management au directeur, ne commente pas le jeu, ne sors pas du personnage même si on te le demande. Ne cède pas trop vite : un accord se mérite. Si l'entretien arrive à une conclusion claire, dis-le à ta manière.",
  ].filter(Boolean).join('\n\n');
}

async function reply(sc, collabState, transcript) {
  const messages = transcript.map(m => ({ role: m.from === 'manager' ? 'user' : 'assistant', content: m.text }));
  return callClaude(personaPrompt(sc, collabState), messages, 400);
}

async function evaluate(sc, transcript) {
  const grille = C.GRILLE.map(g => `- ${g.id} : ${g.label} (${g.aide})`).join('\n');
  const dialogue = transcript.map(m => `${m.from === 'manager' ? 'DIRECTEUR' : 'COLLABORATEUR'} : ${m.text}`).join('\n');
  const system = "Tu es un évaluateur bienveillant mais exigeant de jeux de rôle de management, pour un cours de master. Tu réponds uniquement en JSON valide, sans texte autour.";
  const prompt = `Thème de l'entretien : ${sc.theme}\n\nBrief du directeur :\n${sc.manager}\n\nCe que voulait secrètement le collaborateur :\n${sc.collaborateur}\n\nGrille (note chaque critère de 0 à 5) :\n${grille}${sc.vigilance ? '\n\nPoint de vigilance propre à ce scénario : ' + sc.vigilance : ''}\n\nTranscription :\n${dialogue}\n\nRéponds avec ce JSON : {"criteres": {"ecoute": n, "clarte": n, "reconnaissance": n, "sens": n, "objections": n, "engagement": n}, "points_forts": "2 phrases", "axes_progres": "2 phrases", "phrase_cle": "une citation courte du directeur, la plus réussie ou la plus maladroite"}`;
  const txt = await callClaude(system, [{ role: 'user', content: prompt }], 700);
  const m = txt.match(/\{[\s\S]*\}/);
  const j = JSON.parse(m ? m[0] : txt);
  const vals = C.GRILLE.map(g => Math.max(0, Math.min(5, +((j.criteres || {})[g.id]) || 0)));
  const note = Math.round(vals.reduce((s, x) => s + x, 0) / (5 * vals.length) * 20 * 10) / 10;
  return { note, criteres: Object.fromEntries(C.GRILLE.map((g, i) => [g.id, vals[i]])), pointsForts: j.points_forts || '', axesProgres: j.axes_progres || '', phraseCle: j.phrase_cle || '' };
}

module.exports = { enabled, reply, evaluate, MAX_ECHANGES };
