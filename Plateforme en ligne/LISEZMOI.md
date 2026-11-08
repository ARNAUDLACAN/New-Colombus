# New Colombus — plateforme en ligne

Serious game de management d'agence pour le cours « Les clés pour une équipe engagée et performante ».
Version 1, novembre 2026.

## Lancer une partie sur votre Mac

1. Double-cliquez sur « Lancer sur mon Mac.command » (la première fois, Node.js doit être installé : https://nodejs.org, version LTS).
2. L'espace animateur s'ouvre : créez la partie (campus, nombre d'agences, nombre de périodes, programme des entretiens et dilemmes).
3. Les équipes vont sur l'adresse affichée et saisissent le code de la partie. Une équipe peut se connecter sur plusieurs appareils avec son code d'équipe.
4. Déroulé : ouvrir la période → les équipes tranchent le dilemme, mènent l'entretien et valident leurs décisions → clôturer et calculer → débrief avec l'écran de projection.
5. Export Excel complet (résultats par période, dilemmes, transcriptions d'entretiens) depuis l'espace animateur.

## Mise en ligne (Render, comme ALDNM)

Même procédure que pour ALDNM : déposer ce dossier sur GitHub, créer un service web sur Render à partir de render.yaml, puis renseigner les variables :

- ANIMATEUR_CODE : code demandé pour créer une partie (recommandé).
- ANTHROPIC_API_KEY : clé de l'API Anthropic pour les entretiens avec les collaborateurs simulés. Sans clé, le jeu passe en mode scripté : pour les entretiens qui ont un dialogue écrit (lib/dialogues.js), l'équipe choisit ses répliques en 5 étapes et la note est calculée automatiquement ; pour les autres, l'équipe rédige un plan d'entretien et l'animateur saisit la note.
- ANTHROPIC_MODEL (facultatif) : modèle utilisé, par défaut claude-sonnet-4-5.

Attention : sur l'offre gratuite de Render, le disque n'est pas conservé lors d'un redémarrage. Pour garder les parties d'une séance à l'autre sur plusieurs semaines, ajoutez un disque persistant et pointez la variable DATA_DIR dessus.

## Où modifier les contenus

- lib/content.js : personnages, leviers, dilemmes, nouveaux entretiens, programme par défaut, grille d'évaluation. Les éléments marqués « brouillon: true » sont des propositions à relire.
- lib/dialogues.js : entretiens scriptés (mode sans IA) — répliques au choix, réponses du collaborateur et notes par critère de la grille. Rédigés pour les 6 entretiens du programme par défaut.
- lib/entretiens_origine.json : vos énoncés de jeux de rôles d'origine (brief directeur et brief collaborateur).
- lib/model.js : moteur de simulation ; tous les coefficients de calibrage sont regroupés dans PARAMS et dans la fonction computePeriod.
- test/simulate.js : simule quatre stratégies types sur six périodes (commande : npm test) pour vérifier le calibrage.
