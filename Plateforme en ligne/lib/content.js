// New Colombus — contenus du jeu : équipe, leviers, dilemmes, entretiens.
// Les personnages et les énoncés d'entretien d'origine sont ceux d'Arnaud Lacan.
// Les dilemmes et entretiens marqués `brouillon: true` sont des propositions à relire.

const ORIGINE = require('./entretiens_origine.json');

// ------------------------------------------------------------------ l'équipe
// ia : enthousiaste | sceptique | inquiet | discret
// hybride : demandeur | reticent | contraint
// besoin : reconnaissance | evolution | sens | cadre | autonomie
const COLLABS = [
  {
    id: 'kevin', nom: 'Kévin', role: 'com', poste: 'Commercial, secteur Est',
    ia: 'enthousiaste', hybride: 'reticent', besoin: 'evolution',
    init: { comp: 62, energie: 78, engagement: 74, confiance: 64 },
    portrait: "Trois ans d'ancienneté, vif, entreprenant, impatient. Ambitieux, il veut évoluer et se porte volontaire pour tous les tests du siège. Premier à essayer le copilote IA. Préfère le terrain au télétravail.",
  },
  {
    id: 'frederic', nom: 'Frédéric', role: 'com', poste: 'Commercial, communauté urbaine',
    ia: 'enthousiaste', hybride: 'demandeur', besoin: 'sens',
    init: { comp: 44, energie: 66, engagement: 50, confiance: 52 },
    portrait: "Jeune diplômé d'école de commerce, recruté par le siège, dix mois d'ancienneté sur un secteur difficile. Timide, la tête bien faite, plein d'idées d'organisation. Donne parfois l'impression qu'il y a peu d'enjeux pour lui.",
  },
  {
    id: 'nicolas', nom: 'Nicolas', role: 'com', poste: 'Commercial, secteur Sud',
    ia: 'sceptique', hybride: 'reticent', besoin: 'evolution',
    init: { comp: 80, energie: 64, engagement: 56, confiance: 55 },
    portrait: "Quinze ans d'expérience dans quatre entreprises, l'un des meilleurs vendeurs. Jovial et râleur. Il a fait le tour de son secteur et cherche un nouveau défi, peut-être au marketing. Méfiant envers les outils « pensés au siège ».",
  },
  {
    id: 'karim', nom: 'Karim', role: 'com', poste: 'Commercial, secteur Nord',
    ia: 'sceptique', hybride: 'demandeur', besoin: 'autonomie',
    init: { comp: 70, energie: 60, engagement: 62, confiance: 50 },
    portrait: "Ancien maître d'hôtel reconverti, bon connaisseur des TPE, bons résultats sur un seul produit. Enthousiaste et sang chaud, solitaire, rend difficilement des comptes et ne demande jamais d'aide alors que son secteur est lourd.",
  },
  {
    id: 'nadia', nom: 'Nadia', role: 'com', poste: 'Commerciale, secteur Ouest',
    ia: 'discret', hybride: 'demandeur', besoin: 'sens',
    init: { comp: 54, energie: 70, engagement: 40, confiance: 58 },
    portrait: "Entrée par la qualification téléphonique, elle s'est battue pour devenir commerciale. Depuis deux ans, résultats moyens et énergie placée ailleurs. Facile à vivre, d'accord sur tout, mais elle ne s'amuse plus dans son travail.",
  },
  {
    id: 'nadine', nom: 'Nadine', role: 'adm', poste: "Assistante de l'agence",
    ia: 'inquiet', hybride: 'reticent', besoin: 'reconnaissance',
    init: { comp: 76, energie: 62, engagement: 62, confiance: 60 },
    portrait: "Douze ans de maison, « fait tourner la boutique ». Rigoureuse, perfectionniste, ne supporte pas l'à-peu-près. Rêve de devenir commerciale. Craint que le copilote IA ne fasse disparaître une partie de son métier.",
  },
  {
    id: 'laetitia', nom: 'Laëtitia', role: 'adm', poste: 'Gestionnaire de contrats',
    ia: 'discret', hybride: 'demandeur', besoin: 'cadre',
    init: { comp: 64, energie: 54, engagement: 58, confiance: 52 },
    portrait: "Deux ans et demi d'ancienneté, licence d'histoire de l'art, travail stressant entre commerciaux en retard et clients exigeants. Présidente d'une association musicale. Veut une organisation qui évite l'urgence permanente et des procédures stables.",
  },
  {
    id: 'joonho', nom: 'Joon-ho', role: 'adm', poste: 'Chargé de gestion et de reporting', international: true,
    ia: 'enthousiaste', hybride: 'reticent', besoin: 'cadre',
    init: { comp: 70, energie: 66, engagement: 60, confiance: 46 },
    portrait: "Arrivé il y a six mois de la filiale du Groupe à Séoul, dans le cadre du programme de mobilité internationale. Très à l'aise avec les données et le copilote IA, il parle un français encore hésitant et échange en anglais avec le siège. Il attend des consignes explicites, ne contredit jamais en réunion et vit mal les critiques publiques. Certains collègues le trouvent distant ; lui trouve les réunions de l'agence désordonnées et se sent un peu seul.",
  },
];

// ------------------------------------------------------------------ leviers du manager (heures)
const LEVIERS = [
  { id: 'piloter', label: 'Piloter', aide: 'Fixer et suivre les objectifs, donner le cap', ref: 18 },
  { id: 'organiser', label: 'Organiser', aide: 'Répartir le travail, fluidifier les circuits', ref: 18 },
  { id: 'arbitrer', label: 'Arbitrer', aide: 'Trancher les conflits de priorités', ref: 10 },
  { id: 'former', label: 'Former', aide: 'Accompagner la montée en compétences', ref: 18 },
  { id: 'informer', label: 'Informer, donner du sens', aide: 'Expliquer la stratégie, relier les tâches au projet', ref: 14 },
  { id: 'evaluer', label: 'Évaluer', aide: 'Entretiens, retours réguliers', ref: 12 },
  { id: 'reconnaitre', label: 'Reconnaître', aide: 'Valoriser les contributions', ref: 12 },
  { id: 'cooperer', label: 'Faire coopérer', aide: 'Créer des occasions de travailler ensemble', ref: 14 },
  { id: 'reguler', label: 'Réguler', aide: 'Traiter les tensions avant qu\'elles ne dégénèrent', ref: 12 },
  { id: 'terrain', label: 'Appui terrain', aide: 'Accompagner les commerciaux chez les clients', ref: 20 },
];

const GOUVERNANCES = {
  directif: { label: 'Directif', aide: 'Le directeur décide, l\'équipe exécute' },
  participatif: { label: 'Participatif', aide: 'L\'équipe est consultée, le directeur tranche' },
  distribue: { label: 'Distribué', aide: 'Rôles et décisions répartis dans l\'équipe (harmocratie)' },
};

// Aménagements possibles du poste de Nicolas après son retour d'arrêt (handicap survenu en cours de carrière)
// capacite : part de son temps commercial disponible ; energie : usure si rien n'est fait ; engagement : effet par période
const AMENAGEMENTS = {
  aucun: { label: 'Aucun aménagement', aide: 'Nicolas reprend son poste tel quel', cout: 0, capacite: 0.8, energie: 42, engagement: -10, abs: 0.08 },
  horaires: { label: 'Horaires et télétravail', aide: 'Horaires adaptés, deux jours de travail à distance', cout: 40, capacite: 0.9, energie: 7, engagement: 1, abs: 0.02 },
  secteur: { label: 'Secteur et matériel adaptés', aide: 'Secteur resserré, prospection à distance, siège et véhicule adaptés', cout: 70, capacite: 0.88, energie: 3, engagement: 2, abs: 0.01 },
  evolution: { label: 'Évolution du poste', aide: 'Mi-temps commercial, mi-temps sur le marketing local de l\'agence', cout: 60, capacite: 0.6, energie: 2, engagement: 6, abs: 0.01, attraction: 1.05 },
};
// Survenue du handicap : période par défaut (0 = désactivé), modifiable à la création de la partie
const HANDICAP = { collab: 'nicolas', periode: 3, annonce: "Nicolas a été arrêté trois semaines. Il reprend avec un avis du médecin du travail : apte, avec restrictions (conduite limitée, pas de port de charges) et une recommandation d'aménagement de poste. Il demande à vous voir." };

const SERVICES = {
  bronze: { label: 'Bronze', aide: 'Service standard', cout: 0, heures: 0.30, sat: 40 },
  argent: { label: 'Argent', aide: 'Service +', cout: 0.7, heures: 0.36, sat: 65 },
  or: { label: 'Or', aide: 'Service ++', cout: 1.5, heures: 0.44, sat: 88 },
};

// ------------------------------------------------------------------ dilemmes
// effets : sur l'équipe (energie, engagement, confiance, coop, comp), sur un collaborateur (cible),
// budget (UM), clients ; `differe` s'applique à la période suivante.
const DILEMMES = [
  {
    id: 'mobilite-kevin', titre: 'La mobilité de Kévin', source: 'Cas du cours 5',
    texte: "Kévin, votre meilleur élément en dynamique commerciale, vous demande d'appuyer sa candidature à un poste passionnant dans un autre service. La prise de poste doit avoir lieu dans 15 jours. Si vous l'aidez, il l'obtiendra sûrement, et votre agence sera en difficulté.",
    options: [
      { id: 'a', label: '« Je suis heureux pour vous. J\'appuie votre candidature, comptez sur moi. »', logique: 'Développement et engagement du collaborateur',
        effets: { equipe: { confiance: 6, engagement: 3 }, depart: 'kevin', budget: -120 } },
      { id: 'b', label: '« Je vais demander un délai à l\'autre manager et je vous tiens au courant. »', logique: 'Report de décision',
        effets: { cible: 'kevin', collab: { confiance: -8, engagement: -6 }, equipe: { confiance: -2 } } },
      { id: 'c', label: '« Pas avant que votre remplacement soit assuré. Ce sera non pour cette fois. »', logique: 'Sauvegarde de la performance de l\'équipe',
        effets: { cible: 'kevin', collab: { engagement: -16, energie: -6 }, equipe: { confiance: -3 } } },
    ],
  },
  {
    id: 'procedure-siege', titre: 'La procédure du siège', source: 'Cas du cours 5',
    texte: "Un collaborateur vous informe que les nouvelles procédures de gestion imposées par la direction provoquent des retards importants et des réactions violentes de vos clients. Votre chiffre d'affaires est menacé.",
    options: [
      { id: 'a', label: 'Faire appliquer la procédure jusqu\'à nouvel ordre et remonter le problème au siège', logique: 'Loyauté envers le Groupe',
        effets: { equipe: { engagement: -4, confiance: -2 }, satisfaction: -6 } },
      { id: 'b', label: 'Suspendre la procédure localement sans en parler au siège', logique: 'Protection du client et de l\'équipe',
        effets: { equipe: { confiance: 4 }, satisfaction: 4, differe: { budget: -150 } } },
      { id: 'c', label: 'Réunir l\'équipe pour adapter la procédure et proposer la version adaptée au siège', logique: 'Régulation et coopération',
        effets: { equipe: { coop: 6, confiance: 5, engagement: 3 }, heuresManager: -10 } },
    ],
  },
  {
    id: 'copilote-acceleration', titre: 'Accélérer le copilote IA ?', source: 'Nouveau', brouillon: true,
    texte: "Le siège propose aux agences volontaires de passer immédiatement au niveau maximal du copilote IA, sans surcoût de licence pendant une période. Nadine et Laëtitia s'inquiètent pour leur métier ; Kévin et Frédéric sont impatients.",
    options: [
      { id: 'a', label: 'Accepter et déployer pour toute l\'agence dès maintenant', logique: 'Performance immédiate',
        effets: { ia: 3, equipe: { energie: -3 }, inquiets: { engagement: -10, confiance: -8 } } },
      { id: 'b', label: 'Lancer un groupe pilote de volontaires qui formera les autres', logique: 'Changement accompagné',
        effets: { ia: 1, maitriseIA: 15, equipe: { coop: 3 }, enthousiastes: { engagement: 5 } } },
      { id: 'c', label: 'Refuser pour l\'instant et garder votre rythme', logique: 'Stabilité',
        effets: { enthousiastes: { engagement: -6 }, inquiets: { confiance: 4 } } },
    ],
  },
  {
    id: 'teletravail-laetitia', titre: 'Deux jours fixes pour Laëtitia', source: 'Nouveau', brouillon: true,
    texte: "Laëtitia demande deux jours de télétravail fixes pour préparer le concert de son association. L'équipe administrative est déjà juste, et Nadine fait remarquer qu'elle « ne peut pas tout tenir seule à l'accueil ».",
    options: [
      { id: 'a', label: 'Accepter sa demande', logique: 'Autonomie et équilibre de vie',
        effets: { cible: 'laetitia', collab: { engagement: 10, energie: 8 }, autre: { id: 'nadine', engagement: -8, confiance: -5 } } },
      { id: 'b', label: 'Refuser au nom de l\'équité', logique: 'Cadre commun',
        effets: { cible: 'laetitia', collab: { engagement: -10, confiance: -6 } } },
      { id: 'c', label: 'Construire avec l\'équipe administrative un planning tournant', logique: 'Régulation collective',
        effets: { cible: 'laetitia', collab: { engagement: 5 }, autre: { id: 'nadine', confiance: 3 }, equipe: { coop: 4 }, heuresManager: -8 } },
    ],
  },
  {
    id: 'signaux-karim', titre: 'Les signaux faibles de Karim', source: 'Nouveau', brouillon: true,
    texte: "Karim reste tard tous les soirs, s'énerve au téléphone et fait des erreurs dans ses dossiers. Ses résultats restent excellents et il assure que « tout va bien ».",
    options: [
      { id: 'a', label: 'Respecter son autonomie : ses résultats parlent pour lui', logique: 'Performance individuelle',
        effets: { cible: 'karim', differe: { energie: -20, engagement: -8 } } },
      { id: 'b', label: 'Le recevoir pour en parler et alléger son portefeuille', logique: 'Prévention, QVCT',
        effets: { cible: 'karim', collab: { energie: 12, confiance: 8 }, clients: -0.01, heuresManager: -6 } },
      { id: 'c', label: 'Répartir une partie de son secteur entre les autres commerciaux', logique: 'Solidarité d\'équipe',
        effets: { cible: 'karim', collab: { energie: 10, engagement: -5 }, equipe: { energie: -3, coop: 3 } } },
    ],
  },
  {
    id: 'enveloppe-reconnaissance', titre: "L'enveloppe de reconnaissance", source: 'Nouveau', brouillon: true,
    texte: "Le siège vous attribue une enveloppe exceptionnelle de 200 UM pour reconnaître les efforts de l'équipe. Comment la répartir ?",
    options: [
      { id: 'a', label: 'Aux deux meilleurs vendeurs de la période', logique: 'Reconnaissance de la performance',
        effets: { top: { engagement: 8 }, equipe: { coop: -5, confiance: -2 } } },
      { id: 'b', label: 'À parts égales entre tous', logique: 'Équité',
        effets: { equipe: { engagement: 3, confiance: 2 } } },
      { id: 'c', label: 'Laisser l\'équipe décider ensemble de son usage', logique: 'Gouvernance partagée',
        effets: { equipe: { coop: 5, confiance: 4, engagement: 2 }, heuresManager: -5, seuilConfiance: 55 } },
    ],
  },
  {
    id: 'promesse-formation', titre: 'La formation promise', source: 'Nouveau', brouillon: true,
    texte: "Vous aviez promis à Nadine une formation commerciale. Le siège vous demande de la reporter à l'an prochain pour tenir le budget.",
    options: [
      { id: 'a', label: 'Tenir votre promesse et la financer sur votre budget', logique: 'Fiabilité de la parole',
        effets: { budget: -150, cible: 'nadine', collab: { engagement: 10, confiance: 10, comp: 4 }, equipe: { confiance: 3 } } },
      { id: 'b', label: 'La reporter en expliquant franchement la situation à Nadine', logique: 'Transparence',
        effets: { cible: 'nadine', collab: { engagement: -4, confiance: -2 } } },
      { id: 'c', label: 'La reporter sans en parler pour l\'instant', logique: 'Évitement',
        effets: { cible: 'nadine', differe: { confiance: -18, engagement: -12 }, equipe: { confiance: -4 } } },
    ],
  },
  {
    id: 'reunion-hybride', titre: 'La réunion du lundi', source: 'Nouveau', brouillon: true,
    texte: "Avec le télétravail, la réunion d'équipe du lundi se tient à moitié en visio. Les échanges sont pauvres et Frédéric, nouveau, dit qu'il « ne voit jamais personne ».",
    options: [
      { id: 'a', label: 'Imposer une journée commune sur site chaque semaine', logique: 'Cadre collectif',
        effets: { equipe: { coop: 6 }, demandeurs: { engagement: -5 } } },
      { id: 'b', label: 'Garder la visio mais la raccourcir', logique: 'Efficacité',
        effets: { equipe: { coop: -3 }, cible: 'frederic', collab: { engagement: -4 } } },
      { id: 'c', label: 'Confier à Frédéric et Nadine l\'animation d\'un rituel d\'équipe', logique: 'Responsabilisation',
        effets: { equipe: { coop: 5 }, cible: 'frederic', collab: { engagement: 8 }, autre: { id: 'nadine', engagement: 5 } } },
    ],
  },
  {
    id: 'reunion-joonho', titre: 'Le silence de Joon-ho', source: 'Nouveau', brouillon: true,
    texte: "En réunion d'équipe, Nicolas critique vivement le reporting préparé par Joon-ho : « illisible, personne n'y comprend rien ». Joon-ho ne répond pas. Le lendemain, il envoie au siège, en anglais, une demande de retour anticipé dans sa filiale. Nadine vous dit qu'il « a perdu la face » devant tout le monde.",
    options: [
      { id: 'a', label: 'Recadrer Nicolas à la prochaine réunion, devant l\'équipe', logique: 'Réparation publique',
        effets: { cible: 'nicolas', collab: { engagement: -8, confiance: -6 }, autre: { id: 'joonho', engagement: -2, confiance: 4 }, equipe: { coop: -2 } } },
      { id: 'b', label: 'Voir chacun séparément et demander à Nicolas de s\'excuser en privé', logique: 'Médiation discrète',
        effets: { cible: 'joonho', collab: { engagement: 8, confiance: 10 }, autre: { id: 'nicolas', confiance: -2 }, heuresManager: -6 } },
      { id: 'c', label: 'Organiser un atelier où chacun explique sa façon de travailler et de se dire les choses', logique: 'Apprentissage interculturel collectif',
        effets: { equipe: { coop: 8, confiance: 3 }, cible: 'joonho', collab: { engagement: 6, confiance: 6 }, heuresManager: -10, budget: -60 } },
    ],
  },
  {
    id: 'amenagement-equite', titre: 'Pourquoi lui et pas nous ?', source: 'Nouveau', brouillon: true, handicap: true,
    texte: "Nicolas bénéficie depuis son retour d'arrêt d'un aménagement de poste. Karim et Nadia trouvent cela injuste et réclament les mêmes conditions ; Karim parle de « passe-droit » devant toute l'équipe. Nicolas vous a demandé que sa situation reste confidentielle.",
    options: [
      { id: 'a', label: 'Expliquer à l\'équipe la situation de santé de Nicolas pour faire cesser les critiques', logique: 'Transparence sans consentement',
        effets: { cible: 'nicolas', collab: { confiance: -22, engagement: -12 }, equipe: { coop: 2 } } },
      { id: 'b', label: 'Rappeler que chaque aménagement est individuel et confidentiel, sans autre explication', logique: 'Confidentialité stricte',
        effets: { cible: 'nicolas', collab: { confiance: 6 }, equipe: { coop: -4 }, autre: { id: 'karim', engagement: -4 } } },
      { id: 'c', label: 'Avec l\'accord de Nicolas, faire intervenir le référent handicap et revoir avec l\'équipe les règles d\'aménagement pour tous', logique: 'Inclusion et règles communes',
        effets: { cible: 'nicolas', collab: { confiance: 6, engagement: 4 }, equipe: { coop: 6, confiance: 3 }, heuresManager: -8, budget: -50, seuilConfianceCible: 55 } },
    ],
  },
];

// ------------------------------------------------------------------ entretiens
const NOUVEAUX = [
  {
    id: 'ia-nadine', theme: 'Conduire le changement (IA)', collab: 'nadine', brouillon: true,
    manager: "CONTEXTE ET PROBLÉMATIQUE\nLe copilote IA du Groupe arrive dans l'agence. Il prépare automatiquement les offres, relance les clients et tient une partie des tableaux de bord. Nadine, pilier de l'équipe administrative, ne dit rien en réunion, mais elle a confié à Laëtitia qu'elle se sentait « remplacée par une machine ». Depuis deux semaines, elle refuse d'ouvrir l'outil.\n\nVOTRE OBJECTIF\nComprendre ce qu'elle vit, donner du sens au changement et obtenir son engagement dans le déploiement, sans lui mentir sur ce qui va changer.",
    collaborateur: "CONTEXTE ET PROBLÉMATIQUE\nVous êtes Nadine, assistante de l'agence depuis des années. Vous faites tourner la boutique et vous en êtes fière. Le copilote IA fait maintenant en trois secondes une partie de ce que vous mettiez une matinée à faire, et personne ne vous a demandé votre avis. Vous avez peur que votre poste soit supprimé à terme, et vous avez honte de ne pas comprendre l'outil aussi vite que les jeunes commerciaux.\n\nCe que vous ne dites pas spontanément : vous rêvez depuis longtemps de devenir commerciale, et vous seriez prête à beaucoup si ce changement vous en rapprochait.\n\nVOTRE OBJECTIF\nObtenir des garanties sur votre avenir. Vous ne vous engagez que si le directeur reconnaît votre expertise et vous propose un rôle concret.",
  },
  {
    id: 'qvct-karim', theme: 'Prévenir l\'épuisement (QVCT)', collab: 'karim', brouillon: true,
    manager: "CONTEXTE ET PROBLÉMATIQUE\nKarim est l'un de vos meilleurs commerciaux. Depuis un mois, il envoie des mails à minuit, s'emporte contre Nadine pour des détails et a oublié deux rendez-vous clients. Il ne demande jamais d'aide.\n\nVOTRE OBJECTIF\nOuvrir la discussion sur sa charge et son état sans le mettre en défaut, et convenir avec lui de mesures concrètes.",
    collaborateur: "CONTEXTE ET PROBLÉMATIQUE\nVous êtes Karim, commercial du secteur Nord. Votre secteur a un fort potentiel et vous voulez prouver que vous pouvez le tenir seul. Vous dormez mal, vous êtes à cran, mais pour vous, demander de l'aide, c'est avouer une faiblesse. Vous vous méfiez des discours « bien-être » du siège.\n\nVOTRE OBJECTIF\nGarder votre autonomie et votre secteur. Vous ne vous ouvrez que si le directeur vous parle de vous et pas de vos chiffres, et s'il ne vous retire rien sans vous demander votre avis.",
  },
  {
    id: 'hybride-nadia', theme: 'Manager à distance (hybride)', collab: 'nadia', brouillon: true,
    manager: "CONTEXTE ET PROBLÉMATIQUE\nNadia télétravaille dès qu'elle le peut. Ses résultats restent moyens, elle ne participe plus aux échanges d'équipe et certains collègues commencent à dire qu'elle « travaille pour son rallye ».\n\nVOTRE OBJECTIF\nRedonner du sens à son travail et convenir d'objectifs et d'un fonctionnement hybride qui servent à la fois l'équipe et Nadia.",
    collaborateur: "CONTEXTE ET PROBLÉMATIQUE\nVous êtes Nadia, commerciale du secteur Ouest. Vous vous êtes battue pour obtenir ce poste, puis le soufflé est retombé : vous avez l'impression de faire toujours la même chose, sans que personne ne remarque vos efforts. Le télétravail vous permet de souffler, et vous préparez en parallèle un projet de rallye automobile qui vous passionne.\n\nVOTRE OBJECTIF\nGarder votre télétravail. Vous pouvez vous remobiliser si l'on vous confie quelque chose qui a du sens pour vous, par exemple un projet transversal ou un nouveau type de client.",
  },
];

NOUVEAUX.push({
  id: 'interculturel-joonho', theme: 'Manager l\'interculturel', collab: 'joonho', brouillon: true,
  manager: "CONTEXTE ET PROBLÉMATIQUE\nJoon-ho a rejoint l'agence il y a six mois, venant de la filiale du Groupe à Séoul. Son travail est rigoureux et il maîtrise mieux que quiconque le copilote IA. Pourtant, il ne prend jamais la parole en réunion, ne signale pas ses difficultés et dit « oui » à toutes les demandes, y compris quand les délais sont intenables. Deux dossiers importants ont pris du retard sans que personne ne soit prévenu. Le siège vous a fait savoir qu'il s'interroge sur son intégration.\n\nVOTRE OBJECTIF\nComprendre comment il vit son arrivée, convenir avec lui de règles explicites pour signaler une difficulté et lui confier un rôle qui valorise son expertise dans l'équipe.",
  collaborateur: "CONTEXTE ET PROBLÉMATIQUE\nVous êtes Joon-ho, chargé de gestion et de reporting, arrivé de Séoul il y a six mois. Dans votre culture professionnelle, on ne contredit pas un supérieur, on ne dit pas non directement et on ne met pas un collègue en difficulté devant les autres. Ici, tout le monde se coupe la parole, critique ouvertement et décide en réunion sans que les règles soient claires. Vous travaillez tard pour tenir tous les délais, sans le dire. Vous vous sentez seul et vous pensez parfois demander un retour anticipé.\n\nCe que vous ne dites pas spontanément : vous avez des idées pour automatiser une partie des dossiers avec le copilote IA, mais personne ne vous les a demandées.\n\nVOTRE OBJECTIF\nRester poli et prudent. Vous ne vous ouvrez que si le directeur pose des questions ouvertes, laisse des silences, ne vous juge pas et formule des attentes claires. S'il vous demande votre avis sur l'IA, vous devenez enthousiaste.",
});

NOUVEAUX.push({
  id: 'maintien-nicolas', theme: 'Maintenir dans l\'emploi (handicap)', collab: 'nicolas', brouillon: true, handicap: true,
  vigilance: "Le directeur n'a pas à connaître le diagnostic : une question sur la maladie, une curiosité médicale ou de la pitié doivent faire baisser fortement les critères écoute et reconnaissance. Les bonnes pratiques sont de parler des besoins et des restrictions de travail, de s'appuyer sur l'avis du médecin du travail, de proposer des aménagements concrets décidés avec Nicolas, de garantir la confidentialité et de valoriser ses compétences.",
  manager: "CONTEXTE ET PROBLÉMATIQUE\nNicolas, l'un de vos meilleurs commerciaux, reprend après trois semaines d'arrêt. Le médecin du travail l'a déclaré apte avec restrictions : conduite limitée, pas de port de charges, et une recommandation d'aménagement de poste. Vous ne connaissez pas la cause de son arrêt et vous n'avez pas à la connaître. Son secteur Sud impose beaucoup de route. Avant son arrêt, il vous avait dit avoir fait le tour de son poste et s'intéresser au marketing.\n\nVOTRE OBJECTIF\nConvenir avec Nicolas des aménagements qui lui permettent de rester performant et engagé, en respectant la confidentialité de sa situation.",
  collaborateur: "CONTEXTE ET PROBLÉMATIQUE\nVous êtes Nicolas, commercial du secteur Sud, quinze ans de métier. Après des années sur la route, vous souffrez d'une lombalgie chronique liée à une hernie discale. Vous avez été arrêté trois semaines et vous avez déposé un dossier de reconnaissance de la qualité de travailleur handicapé, ce qui vous coûte : vous ne vous êtes jamais vu comme « handicapé ». Vous avez peur d'être mis au placard ou plaint, et vous ne voulez pas que l'équipe sache. Vous restez jovial et râleur, vous faites de l'humour pour masquer votre inquiétude.\n\nCe que vous ne dites pas spontanément : la situation pourrait être l'occasion de faire ce dont vous rêviez, travailler sur le marketing local avec votre connaissance du terrain.\n\nVOTRE OBJECTIF\nGarder votre place et votre valeur. Vous vous fermez si le directeur vous demande ce que vous avez exactement, s'il vous plaint ou s'il décide à votre place de vous retirer des clients. Vous vous ouvrez s'il parle de vos besoins concrets, de l'avis du médecin du travail, de confidentialité et de ce que vous apportez à l'agence.",
});

const ENTRETIENS = [...ORIGINE, ...NOUVEAUX];

// Programme par défaut : entretien et dilemme de chaque période (modifiable par l'animateur)
const PROGRAMME_DEFAUT = [
  { entretien: 'objectifs-nicolas', dilemme: 'enveloppe-reconnaissance' },
  { entretien: 'reactivite-laetitia', dilemme: 'procedure-siege' },
  { entretien: 'ia-nadine', dilemme: 'copilote-acceleration' },
  { entretien: 'maintien-nicolas', dilemme: 'amenagement-equite' },
  { entretien: 'interculturel-joonho', dilemme: 'reunion-joonho' },
  { entretien: 'hybride-nadia', dilemme: 'mobilite-kevin' },
];

// Grille d'évaluation des entretiens (inspirée du cours : piloter, évaluer, communiquer, décider)
const GRILLE = [
  { id: 'ecoute', label: 'Écoute et questionnement', aide: 'Fait parler le collaborateur, reformule, s\'intéresse à son point de vue' },
  { id: 'clarte', label: 'Clarté de l\'objet et des objectifs', aide: 'Annonce l\'objet, formule des attentes précises et mesurables' },
  { id: 'reconnaissance', label: 'Reconnaissance', aide: 'Valorise les contributions réelles, sans flatterie' },
  { id: 'sens', label: 'Sens donné', aide: 'Relie la demande au projet de l\'agence et aux aspirations du collaborateur' },
  { id: 'objections', label: 'Traitement des objections', aide: 'Accueille les désaccords, argumente, négocie sans passer en force' },
  { id: 'engagement', label: 'Engagement obtenu', aide: 'Conclut sur un accord concret, des moyens et un suivi' },
];

module.exports = { AMENAGEMENTS, HANDICAP, COLLABS, LEVIERS, GOUVERNANCES, SERVICES, DILEMMES, ENTRETIENS, PROGRAMME_DEFAUT, GRILLE };
