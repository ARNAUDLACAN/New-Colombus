// New Colombus — entretiens scriptés (mode sans IA).
// Chaque entretien : une réplique d'ouverture du collaborateur, puis 5 étapes.
// À chaque étape, l'équipe choisit une réplique parmi 3 ; chaque réplique note
// les critères de la grille visés par l'étape (0 à 5) et déclenche la réponse du
// collaborateur. « relance » : réplique du collaborateur ajoutée avant les choix.
// Modifiez librement les textes et les notes : la structure doit rester la même.

const o = (text, notes, reponse) => ({ text, notes, reponse });

const DIALOGUES = {
  'objectifs-nicolas': {
    ouverture: "Bonjour. Vous vouliez me voir ? J'imagine que c'est pour les objectifs… Allez-y, je suis assis, c'est déjà ça.",
    etapes: [
      { criteres: ['clarte', 'ecoute'], options: [
        o("Bonjour Nicolas, merci d'être venu. Je voudrais faire le point sur ton année, entendre ton regard sur ton secteur, puis construire avec toi tes objectifs, notamment pour le lancement du contrat D. Ça te va ?", [5, 4], "Ça me va. Pour une fois qu'on me demande mon regard… Je vous préviens, il n'est pas tendre."),
        o("J'ai tes objectifs de l'an prochain sous les yeux : 12 500 en A, 4 200 en B, 7 000 en C, et le contrat D en priorité. On en parle ?", [3, 1], "Ah. Donc c'est déjà décidé. Vous voulez que je signe où ?"),
        o("Alors, comment ça va ? On fait un petit tour d'horizon, rien de formel.", [1, 3], "Ça va, ça va… Mais vous ne m'avez pas fait venir pour la météo. Qu'est-ce qu'il y a ?"),
      ] },
      { criteres: ['ecoute', 'reconnaissance'], options: [
        o("En A, tu es au-dessus de l'objectif trois ans de suite, +522 cette année. En B et C, c'est plus juste. Comment tu l'expliques, toi ?", [5, 5], "Merci de le voir. B et C, je vais être franc : ils sont deux fois moins bons que le A et on me demande de les vendre pareil. Sur le terrain, ça ne passe pas."),
        o("Tu es bon en A, mais ton secteur est facile. En B et C tu es en dessous : il va falloir te reprendre.", [1, 1], "Facile ? Venez faire ma tournée une semaine. Je suis à quarante unités près sur six mille, et vous me parlez de me reprendre ?"),
        o("Bravo pour ton année, tu es l'un de nos meilleurs, vraiment. Je compte sur toi.", [2, 3], "Merci… C'est gentil, mais ça ne me dit pas ce que vous attendez de moi."),
      ] },
      { criteres: ['sens', 'reconnaissance'], options: [
        o("Le siège lance le contrat D : service haut de gamme, 15 % plus cher que le marché. Pour l'ouvrir, j'ai besoin d'un vendeur que les clients écoutent : toi. Qu'est-ce qu'il te faudrait pour en faire ton défi de l'année ?", [5, 5], "Un défi… Vous savez que je tourne un peu en rond sur mon secteur. Si on me laisse construire l'argumentaire avec les clients, et pas avec le marketing, là, je peux m'y mettre."),
        o("Le contrat D est la priorité du siège et, pour être transparent, une partie de mon bonus en dépend. J'ai besoin que tu suives.", [2, 1], "Ah, voilà. C'est votre bonus. Et moi, qu'est-ce que j'y gagne, à vendre un contrat 15 % plus cher que la concurrence ?"),
        o("Il y a un nouveau contrat, le D. On va tous devoir le vendre, c'est comme ça.", [1, 2], "« C'est comme ça. » Comme pour le B et le C il y a dix ans. On connaît la chanson."),
      ] },
      { criteres: ['objections'], relance: "Et puis 7 000 en C, c'est une blague ? Je n'ai jamais dépassé 6 600.", options: [
        o("Tu me dis que B et C sont moins bons que le A : je l'entends, et je remonterai ton analyse au siège, chiffres à l'appui. En attendant, on garde B à 4 000 et on fixe C à 6 300 plutôt que 7 000. C'est réaliste pour toi ?", [5], "Là, on discute. Si vous portez vraiment le sujet au siège, je peux tenir 6 300. Pas 7 000, on est d'accord."),
        o("Les objectifs viennent du siège, je n'ai aucune marge : 12 500, 4 200, 7 000.", [1], "Alors pourquoi on se parle ? Envoyez-moi un mail, ce sera plus rapide."),
        o("D'accord, je baisse tout de 10 %, ça te va ? On ne va pas se fâcher.", [2], "Bon… Si vous le dites. Mais je ne suis pas sûr que ça règle quoi que ce soit."),
      ] },
      { criteres: ['engagement', 'clarte'], options: [
        o("Je te propose : 12 500 en A, 4 000 en B, 6 300 en C, et tu pilotes le lancement du D sur le Sud, objectif 300 contrats, en testant ton argumentaire auprès de tes meilleurs clients. Un point chaque mois, et on parle sérieusement de ton évolution, marketing compris, d'ici juin. On est d'accord ?", [5, 5], "On est d'accord. Et je note pour juin : je ne vous lâcherai pas là-dessus."),
        o("Bon, fais au mieux sur le D, et on verra en fin d'année.", [1, 1], "« Au mieux »… D'accord. On verra en fin d'année, comme vous dites."),
        o("Je t'envoie le récapitulatif par mail et tu me dis si ça te va.", [2, 3], "Envoyez. Je regarderai… quand j'aurai le temps."),
      ] },
    ],
  },

  'reactivite-laetitia': {
    ouverture: "Bonjour… Vous vouliez me voir ? Tant mieux, j'avais justement des choses à vous dire.",
    etapes: [
      { criteres: ['clarte', 'ecoute'], options: [
        o("Bonjour Laëtitia, merci. Les commerciaux m'ont parlé des délais des offres et je voudrais comprendre avec toi ce qui se passe, sans chercher de coupable. Mais d'abord : tu voulais me dire quelque chose ?", [5, 5], "Oui. Je suis épuisée. Les offres arrivent la veille pour le lendemain, le téléphone n'arrête pas, le siège réclame des compléments… Tout se fait dans l'urgence."),
        o("Les commerciaux se plaignent : on a perdu des affaires à cause des délais des offres. Il faut que ça change.", [3, 1], "Ah, c'est de ma faute maintenant ? Vous savez quand ils me les donnent, leurs pré-offres ?"),
        o("Ça va ? Rien de grave, je voulais juste prendre des nouvelles.", [1, 3], "Si vous voulez vraiment savoir… non, ça ne va pas trop."),
      ] },
      { criteres: ['ecoute', 'reconnaissance'], options: [
        o("Raconte-moi une journée type : qu'est-ce qui arrive, à quel moment, et qu'est-ce qui te bloque ?", [5, 4], "Une offre, au calme, c'est dix minutes. Mais je ne suis jamais au calme. Ils les ont depuis trois jours et me les donnent à 17 h. Nadine vit exactement la même chose."),
        o("Je sais que c'est dur pour tout le monde. Les commerciaux aussi sont sous pression.", [2, 2], "Je ne dis pas le contraire. Mais c'est toujours nous qui absorbons."),
        o("Dix minutes par offre, ce n'est quand même pas sorcier.", [0, 0], "Dix minutes sans être interrompue. Vous voulez essayer à ma place ?"),
      ] },
      { criteres: ['sens', 'reconnaissance'], options: [
        o("Ton travail est le dernier maillon avant le client : si l'offre part tard, c'est toute l'agence qui perd. Tu tiens ce maillon depuis deux ans et demi sans qu'on t'ait beaucoup aidée. Je veux que ça change.", [5, 5], "C'est la première fois qu'on me dit que ça compte. Moi, ce que je veux, c'est arrêter de vivre dans l'urgence."),
        o("On est en retard sur l'objectif commercial et le siège me met la pression : il faut rattraper.", [2, 1], "Le siège, le siège… Et ma santé, elle compte pour qui ?"),
        o("C'est un passage difficile, ça va se tasser.", [1, 2], "Ça fait deux ans que ça doit se tasser."),
      ] },
      { criteres: ['objections'], relance: "Il faut que vous disiez aux commerciaux d'anticiper. Fermement.", options: [
        o("Tu as raison, l'anticipation relève aussi de moi. Je pose une règle avec l'équipe : pré-offre transmise 48 h avant, sauf urgence que je valide. En retour, j'ai besoin que tu traites ces urgences-là dans la journée. Qu'est-ce que tu en penses ?", [5], "48 h, ça changerait tout. Pour les vraies urgences, d'accord, si elles restent rares."),
        o("Je ne peux pas contraindre les commerciaux, ce sont eux qui ramènent le chiffre.", [1], "Donc rien ne change. Très bien, je continuerai à faire de mon mieux… jusqu'à quand, je ne sais pas."),
        o("Je vais leur en parler, promis.", [2], "Vous leur en avez déjà parlé l'an dernier."),
      ] },
      { criteres: ['engagement', 'clarte'], options: [
        o("On résume : règle des 48 h présentée en réunion lundi, deux plages de deux heures sans téléphone par jour pour toi et Nadine, et cette semaine tu traites en priorité les offres en attente. On fait le point dans un mois avec les délais réels. D'accord ?", [5, 5], "D'accord. Et je suivrai les délais de mon côté, vous aurez les chiffres."),
        o("Bon, essaie d'être plus rapide, et on verra.", [0, 1], "Je vais essayer. Comme d'habitude."),
        o("Je réfléchis à une solution et je reviens vers toi.", [2, 2], "D'accord… J'attends de voir."),
      ] },
    ],
  },

  'ia-nadine': {
    ouverture: "Bonjour. Si c'est pour le copilote, je sais déjà ce que vous allez me dire.",
    etapes: [
      { criteres: ['clarte', 'ecoute'], options: [
        o("Bonjour Nadine. Oui, je voudrais parler du copilote, mais surtout t'écouter : je sais que tu ne l'utilises pas et je voudrais comprendre ce que tu en penses, sans jugement.", [5, 5], "Ce que j'en pense… Qu'il fait en trois secondes ce que je fais en une matinée. Et que personne ne m'a demandé mon avis."),
        o("Nadine, le copilote est obligatoire depuis deux semaines et tu ne l'as toujours pas ouvert.", [3, 0], "Je sais. Je n'ai pas eu le temps. Il faut bien que quelqu'un fasse tourner la boutique."),
        o("Tu sais, le copilote, c'est génial, tu vas voir, tout le monde l'adore !", [1, 1], "Tout le monde, oui. Les jeunes surtout."),
      ] },
      { criteres: ['ecoute', 'reconnaissance'], options: [
        o("Qu'est-ce qui t'inquiète le plus, concrètement ?", [5, 3], "Que mon poste disparaisse. Et… j'ai un peu honte de ne pas comprendre aussi vite que les autres."),
        o("Ne t'inquiète pas, personne ne va perdre son poste.", [1, 2], "Vous pouvez me le garantir ? Vous, peut-être. Le siège ?"),
        o("Tu fais tourner l'agence depuis douze ans : personne ne connaît nos dossiers comme toi. C'est justement pour ça que j'ai besoin de toi sur ce sujet.", [3, 5], "C'est gentil. Mais si la machine fait mon travail, à quoi je sers ?"),
      ] },
      { criteres: ['sens', 'reconnaissance'], options: [
        o("Je ne vais pas te mentir : une partie de tes tâches va être automatisée. Mais l'outil se trompe, et toi tu sais vérifier. Et il libère du temps. Qu'est-ce que tu aimerais faire de ce temps ?", [5, 4], "… Pour être franche, j'ai toujours rêvé d'être commerciale. Je connais tous les clients au téléphone."),
        o("Le Groupe a décidé, c'est l'avenir, on n'a pas le choix.", [1, 1], "Alors je n'ai rien à dire. Je ferai ce qu'on me demande."),
        o("L'outil va te faire gagner du temps, tu seras moins stressée.", [3, 2], "Moins stressée… ou moins utile."),
      ] },
      { criteres: ['objections'], relance: "Et si je n'y arrive pas, avec cet outil ?", options: [
        o("Tu seras formée, à ton rythme, avec Joon-ho qui le maîtrise bien. Et je te propose d'être la référente qualité du copilote : c'est toi qui valides ce qu'il produit. En parallèle, on construit ton projet commercial, par exemple en accompagnant Kévin chez des clients.", [5], "Référente… et des rendez-vous clients ? Là, vous me parlez."),
        o("Tout le monde y arrive, il n'y a pas de raison.", [1], "Merci pour la confiance."),
        o("Si c'est trop compliqué, tu continueras comme avant pour certains dossiers.", [2], "Comme avant… jusqu'à ce qu'on n'ait plus besoin de moi."),
      ] },
      { criteres: ['engagement', 'clarte'], options: [
        o("On s'engage : deux demi-journées de formation ce mois-ci, tu deviens référente qualité du copilote, et on inscrit dans ton entretien annuel un parcours vers un poste commercial, avec un premier binôme client avant l'été. Point dans trois semaines. Ça te va ?", [5, 5], "Ça me va. J'ouvrirai l'outil dès demain. Et je compte sur vous pour l'été."),
        o("Je compte sur toi pour t'y mettre dès lundi.", [1, 2], "Lundi. Bien."),
        o("On en reparle quand tu auras testé.", [2, 1], "D'accord. On en reparlera."),
      ] },
    ],
  },

  'maintien-nicolas': {
    ouverture: "Me revoilà ! Pas encore bon pour la retraite, rassurez-vous. Alors, on m'a gardé mon bureau ?",
    etapes: [
      { criteres: ['clarte', 'ecoute'], options: [
        o("Content de te revoir, Nicolas. Je voulais qu'on organise ta reprise ensemble, à partir de l'avis du médecin du travail et de ce dont toi tu as besoin. Ce qu'on se dit reste entre nous.", [5, 5], "Entre nous… C'est important, ça. Je n'ai pas envie que toute l'agence en parle."),
        o("Alors, qu'est-ce que tu as eu exactement ? On s'est tous inquiétés.", [1, 0], "Ce que j'ai eu, c'est mon affaire. Le médecin du travail a dit que j'étais apte. Ça ne suffit pas ?"),
        o("Mon pauvre, ça a dû être dur. Ne t'en fais pas, on va te ménager.", [2, 1], "Me ménager ? Je ne suis pas en sucre. Je ne veux pas qu'on me plaigne."),
      ] },
      { criteres: ['ecoute', 'reconnaissance'], options: [
        o("Le médecin parle de conduite limitée et de pas de port de charges. Concrètement, dans ton quotidien, qu'est-ce qui te poserait problème ?", [5, 4], "La route, surtout. Mon secteur, c'est 400 kilomètres par semaine. Et les mallettes de documentation, je les oublie."),
        o("Le plus simple, c'est que je redistribue tes gros clients aux autres pendant un temps.", [1, 0], "Mes clients ? Quinze ans de travail ? Vous me mettez au placard, en fait."),
        o("Tu es l'un de nos meilleurs, ton expérience nous est précieuse.", [2, 4], "C'est gentil. Mais avec la route, je ne sais pas comment je vais tenir."),
      ] },
      { criteres: ['sens', 'reconnaissance'], options: [
        o("Avant ton arrêt, tu m'avais parlé du marketing. Ta connaissance du terrain, personne ne l'a. Est-ce qu'on ne pourrait pas en faire quelque chose ?", [5, 5], "Vous vous en souvenez ? Oui… le marketing local. Les campagnes du siège ne collent jamais au terrain. Je pourrais aider."),
        o("Il faut que tu restes sur ton secteur, on n'a personne pour te remplacer.", [1, 1], "Donc je fais comme avant, avec mon dos en moins. Super."),
        o("On verra plus tard pour ton évolution, d'abord ta reprise.", [2, 2], "Plus tard… J'ai l'impression que c'est toujours plus tard."),
      ] },
      { criteres: ['objections'], relance: "Et l'équipe ? Ils vont se demander pourquoi j'ai un régime de faveur.", options: [
        o("L'équipe saura que ton organisation évolue, pas pourquoi. Je ne dirai rien de ta situation et, si des questions viennent, je les prends. Un aménagement, ce n'est pas une faveur : c'est la loi, et c'est du bon sens.", [5], "D'accord. Si vous tenez ça, moi je tiens le reste."),
        o("On leur expliquera que tu as un problème de santé, ils comprendront.", [0], "Non. Je vous l'ai dit : je ne veux pas que ça se sache."),
        o("Ne t'occupe pas de l'équipe.", [2], "Facile à dire. C'est moi qui vais les croiser à la machine à café."),
      ] },
      { criteres: ['engagement', 'clarte'], options: [
        o("Je te propose : tes rendez-vous regroupés pour limiter la route à deux jours par semaine, de la visio quand le client l'accepte, un véhicule adapté, et une mission marketing local un jour par semaine. On fait valider avec le médecin du travail, et point dans un mois. D'accord ?", [5, 5], "D'accord. Et merci… de ne pas avoir décidé à ma place."),
        o("On fera au cas par cas, tu me diras quand ça ne va pas.", [1, 1], "Je vous dirai… si j'ose."),
        o("Je vois avec les RH et je te tiens au courant.", [2, 2], "Avec les RH… D'accord. Mais parlez-m'en avant de décider quoi que ce soit."),
      ] },
    ],
  },

  'interculturel-joonho': {
    ouverture: "Bonjour, monsieur. Vous vouliez me voir ? Je suis désolé si j'ai fait une erreur.",
    etapes: [
      { criteres: ['clarte', 'ecoute'], options: [
        o("Bonjour Joon-ho, merci d'être venu. Tu n'as fait aucune erreur. Je voudrais savoir comment se passent tes six premiers mois ici, et qu'on se mette d'accord sur une façon de travailler qui te convienne.", [5, 5], "Merci. Tout va bien, je crois. Je fais mon travail."),
        o("Deux dossiers ont pris du retard et personne n'a été prévenu. Le siège s'interroge.", [3, 0], "Je suis désolé. C'est ma faute. Je vais travailler plus."),
        o("Alors, la France, ça te plaît ? La cuisine, tout ça ?", [1, 2], "Oui, c'est très bien. Merci."),
      ] },
      { criteres: ['ecoute', 'reconnaissance'], options: [
        o("« Tout va bien », d'accord… S'il y avait une seule chose à changer dans ton quotidien ici, ce serait laquelle ? Prends ton temps.", [5, 3], "… Les réunions. Tout le monde parle en même temps. Je ne sais pas quand je peux parler. Et je ne veux pas contredire."),
        o("Tu devrais prendre plus la parole en réunion, ici c'est comme ça.", [1, 1], "Oui. Je vais essayer."),
        o("Ton travail est rigoureux, et sur le copilote tu es le meilleur de l'agence.", [2, 5], "Merci… Je ne savais pas que vous l'aviez remarqué."),
      ] },
      { criteres: ['sens', 'reconnaissance'], options: [
        o("Ton expertise sur le copilote pourrait aider toute l'agence. Tu as des idées là-dessus ?", [5, 5], "Oui ! Beaucoup. On pourrait automatiser une partie des dossiers de reporting. J'ai fait des essais, mais personne ne me les a demandés."),
        o("Le siège attend que tu t'intègres mieux, c'est important pour ta suite.", [1, 1], "Je comprends. Je pensais… peut-être rentrer plus tôt à Séoul."),
        o("Ici, on est une équipe, on se dit les choses franchement.", [2, 2], "Oui. Je comprends. C'est différent de chez moi."),
      ] },
      { criteres: ['objections'], relance: "Mais si je dis non à une demande… ce n'est pas poli.", options: [
        o("Je comprends que ce ne soit pas naturel. On peut convenir d'une règle simple : si un délai te paraît difficile, tu me l'écris en message privé, dans la journée. Ce ne sera jamais un reproche, c'est une information dont j'ai besoin.", [5], "Par écrit, en privé… Oui, ça, je peux le faire."),
        o("Ici, il faut savoir dire non, c'est tout.", [1], "… Oui."),
        o("Ne t'inquiète pas, je vérifierai moi-même tes délais.", [2], "D'accord. Merci."),
      ] },
      { criteres: ['engagement', 'clarte'], options: [
        o("On s'accorde : un message privé dès qu'un délai coince, un point de quinze minutes tous les deux chaque lundi, et tu présentes tes idées d'automatisation au comité d'agence du mois prochain ; je te donnerai la parole en premier. D'accord ?", [5, 5], "D'accord. Je vais préparer une présentation très claire. Merci de m'avoir demandé."),
        o("Bon, fais un effort pour communiquer, et ça ira.", [1, 1], "Oui, monsieur. Je vais faire un effort."),
        o("Je compte sur toi pour me prévenir à l'avenir.", [2, 3], "Oui… je vais essayer."),
      ] },
    ],
  },

  'hybride-nadia': {
    ouverture: "Bonjour ! Vous vouliez me voir ? Pas de souci, je suis là.",
    etapes: [
      { criteres: ['clarte', 'ecoute'], options: [
        o("Bonjour Nadia, merci. Je voudrais faire le point avec toi sur ton travail, sur la façon dont tu le vis et sur notre organisation hybride. Ce n'est pas un procès : je veux comprendre.", [5, 5], "D'accord… Franchement, ça va. Je fais mes chiffres, à peu près."),
        o("On dit dans l'équipe que tu travailles pour ton rallye. Il faut qu'on en parle.", [2, 0], "Ah. C'est ce qu'on dit ? Sympa. Je fais mon travail, je ne vois pas le problème."),
        o("Le télétravail, ça se passe bien ? Tu en profites ?", [1, 2], "Oui, très bien. Ça me permet de souffler."),
      ] },
      { criteres: ['ecoute', 'reconnaissance'], options: [
        o("« À peu près »… Qu'est-ce qui a changé pour toi depuis que tu as obtenu ce poste ?", [5, 3], "… Je me suis battue pour devenir commerciale. Et maintenant, je fais toujours la même chose. Personne ne remarque rien, alors j'ai mis mon énergie ailleurs."),
        o("Tes résultats sont moyens depuis deux ans, il va falloir remonter.", [1, 1], "Moyens, mais dans les objectifs. Qu'est-ce que vous voulez de plus ?"),
        o("Je n'ai pas oublié ton parcours : passer de la qualification téléphonique au poste de commerciale, peu de gens l'ont fait.", [3, 5], "C'est vrai que ça m'a coûté. Mais depuis… je m'ennuie un peu, pour être honnête."),
      ] },
      { criteres: ['sens', 'reconnaissance'], options: [
        o("Ton rallye, c'est un projet que tu mènes de A à Z : partenaires, budget, logistique. Ces compétences-là, on en manque. Un projet de ce type, à l'agence, ça te parlerait ?", [5, 5], "Un projet à moi ? Par exemple prospecter un nouveau type de clients… les associations sportives, je connais bien ce milieu."),
        o("Le rallye, c'est ta vie privée, mais ça ne doit pas empiéter sur le travail.", [2, 1], "Ça n'empiète pas. Mais si c'est ce que vous pensez…"),
        o("Il faut que tu te remotives, l'agence a besoin de toi.", [1, 2], "Oui… Mais me remotiver pour quoi ?"),
      ] },
      { criteres: ['objections'], relance: "Par contre, mon télétravail, je ne le lâche pas.", options: [
        o("Je ne te demande pas d'y renoncer. Je te propose deux jours de télétravail fixes, et deux temps sur site où l'équipe a besoin de toi : la réunion du lundi et une matinée de prospection en binôme. Ça te paraît jouable ?", [5], "Deux jours fixes, la réunion du lundi… Oui, c'est jouable."),
        o("On supprime le télétravail pour tout le monde, comme ça c'est réglé.", [0], "Pour tout le monde ? À cause de moi ? Merci pour l'ambiance."),
        o("Garde ton télétravail, on fera sans toi pour les réunions.", [2], "Ah… D'accord. Si vous voulez."),
      ] },
      { criteres: ['engagement', 'clarte'], options: [
        o("On s'engage : tu lances la prospection des associations sportives du secteur Ouest, objectif dix rendez-vous ce trimestre ; deux jours de télétravail fixes, présence le lundi, et un point toutes les deux semaines. Tu présentes le projet à l'équipe. D'accord ?", [5, 5], "D'accord ! Ça fait longtemps que je n'avais pas eu envie de m'y mettre."),
        o("Bon, on se revoit si ça ne s'améliore pas.", [1, 1], "Très bien. On se reverra, alors."),
        o("Fais-moi une proposition par mail.", [2, 3], "OK. Je vais y réfléchir."),
      ] },
    ],
  },
};

// Ordre d'affichage des options : mélangé de façon stable selon le scénario et l'étape,
// pour que la bonne réponse ne soit pas toujours à la même place.
function ordre(id, etape) {
  let h = 7; for (const ch of id + ':' + etape) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const perms = [[0, 1, 2], [1, 2, 0], [2, 0, 1], [1, 0, 2], [2, 1, 0], [0, 2, 1]];
  return perms[h % perms.length];
}

const has = id => !!DIALOGUES[id];

// Vue publique de l'étape en cours (sans les notes)
function etapeVue(id, n) {
  const d = DIALOGUES[id]; if (!d || n >= d.etapes.length) return null;
  return { etape: n + 1, total: d.etapes.length, options: ordre(id, n).map(i => ({ id: i, text: d.etapes[n].options[i].text })) };
}

function evaluer(id, choix, grille) {
  const d = DIALOGUES[id];
  const acc = {}; const best = [], worst = [];
  choix.forEach((i, n) => {
    const et = d.etapes[n], op = et.options[i];
    et.criteres.forEach((c, k) => (acc[c] = acc[c] || []).push(op.notes[k]));
    const moy = op.notes.reduce((s, x) => s + x, 0) / op.notes.length;
    best.push([moy, op.text]); worst.push([moy, op.text]);
  });
  const criteres = Object.fromEntries(grille.map(g => [g.id, acc[g.id] ? Math.round(acc[g.id].reduce((s, x) => s + x, 0) / acc[g.id].length * 10) / 10 : 2.5]));
  const vals = grille.map(g => criteres[g.id]);
  const note = Math.round(vals.reduce((s, x) => s + x, 0) / (5 * vals.length) * 20 * 10) / 10;
  const tri = [...grille].sort((a, b) => criteres[b.id] - criteres[a.id]);
  const forts = tri.filter(g => criteres[g.id] >= 3.5).slice(0, 2);
  const faibles = tri.slice().reverse().filter(g => criteres[g.id] < 4).slice(0, 2);
  const low = l => l.charAt(0).toLowerCase() + l.slice(1);
  const pointsForts = forts.length ? forts.map(g => `${g.label} : ${low(g.aide)}.`).join(' ') : "Peu de points d'appui dans cet entretien : reprenez la grille avant le prochain.";
  const axesProgres = faibles.length ? faibles.map(g => `${g.label} : ${low(g.aide)}.`).join(' ') : 'Entretien très maîtrisé : gardez cette qualité d\'écoute et de conclusion.';
  best.sort((a, b) => b[0] - a[0]); worst.sort((a, b) => a[0] - b[0]);
  const phraseCle = note >= 12 ? best[0][1] : worst[0][1];
  return { note, criteres, pointsForts, axesProgres, phraseCle, scripte: true };
}

module.exports = { DIALOGUES, has, etapeVue, evaluer };
