# 📋 Cahier des Charges Final

## Assos 2.0 — Plateforme SaaS de gestion associative, tontines et mutuelles adaptée au contexte africain

---

## Préambule

Ce document constitue la spécification fonctionnelle finale du projet **assos 2.0 V2**. Il consolide l'analyse du système existant (Laravel 12), les préconisations d'architecture pour la réécriture (NestJS / Next.js), et les adaptations nécessaires pour un déploiement pertinent dans le contexte associatif africain. Il est volontairement **purement fonctionnel** : aucun extrait de code, schéma technique ou détail d'implémentation n'y figure — uniquement ce que le système doit faire, pour qui, et selon quelles règles métier.

---

## 1. Contexte et enjeux du projet

assos 2.0 est une solution de gestion administrative, comptable et financière destinée aux associations communautaires, mutuelles d'épargne/crédit, tontines et organisations à but non lucratif. La version existante, bâtie sur Laravel, doit être entièrement réécrite dans une stack moderne (backend NestJS, frontend Next.js) tout en corrigeant un biais de conception hérité de la première version : le système a été pensé pour **un** modèle de gestion associative, alors que les pratiques varient fortement d'un pays, d'une région, voire d'un quartier à l'autre en Afrique.

L'objectif de cette réécriture n'est donc pas seulement technique — c'est l'occasion de faire de assos 2.0 une plateforme réellement adaptée à la diversité des pratiques financières communautaires africaines, tout en conservant la rigueur comptable et la traçabilité qui font la force du système actuel.

---

## 2. Vision produit et principes directeurs

1. **Rigueur financière avant tout** : chaque mouvement d'argent est tracé, horodaté et non modifiable a posteriori.
2. **Une association, un espace propre** : chaque association dispose de son identité et de son lien d'accès dédié, plutôt que de se fondre dans une interface générique.
3. **Le terrain avant la technologie** : aucune fonctionnalité financière ne doit supposer une connexion permanente, un compte bancaire, un smartphone récent ou la maîtrise du français écrit.
4. **La tontine n'est pas un seul mécanisme** : le système doit refléter la diversité réelle des pratiques (ordre fixe, enchères, tirage au sort, parts multiples, épargne solidaire) plutôt que d'en imposer une seule.
5. **Sortie sans verrou** : une association qui quitte la plateforme doit pouvoir repartir avec l'intégralité de ses données et documents officiels.

---

## 3. Architecture générale du système (vue fonctionnelle)

### 3.1 Modèle SaaS multi-tenant

Le système fonctionne selon un modèle multi-locataire fondé sur l'entité **Association**. Chaque association constitue un périmètre strictement cloisonné : ses membres, ses caisses, ses tontines, ses rapports et ses documents ne sont visibles que par les personnes qui lui appartiennent. Un même utilisateur peut appartenir à plusieurs associations et naviguer de l'une à l'autre depuis son espace personnel.

### 3.2 Un lien dédié par association

Chaque association dispose d'un espace accessible via une adresse qui lui est propre, de la forme **nomassociation.assos.cm** (ou tout autre domaine choisi). Cette adresse :

- donne à l'association une identité visible et mémorisable (elle peut la partager à ses membres, l'afficher sur ses documents officiels) ;
- reste distincte de l'espace vitrine et du backoffice plateforme, ainsi que de quelques adresses réservées au fonctionnement interne du site (espace d'administration, API, support) qui ne peuvent pas être choisies comme nom d'association ;
- pourra évoluer, pour les associations qui le souhaitent, vers un nom de domaine entièrement personnalisé (ex. `caisse.assos 2.0-locale.org`) dans une phase ultérieure du projet, réservée aux formules d'abonnement les plus complètes.

Le choix du nom (identifiant unique de l'association) est fait à la création et vérifié en temps réel pour garantir sa disponibilité et sa conformité (longueur, caractères autorisés, absence de termes réservés ou injurieux).

### 3.3 Deux niveaux d'accès

- **Niveau Plateforme** : supervision globale de toutes les associations hébergées, des abonnements et de la santé commerciale du service.
- **Niveau Association** : gestion quotidienne au sein d'une association donnée (membres, finances, tontines, vie associative).

---

## 4. Matrice des rôles et permissions

### Niveau Plateforme

| Rôle                     | Responsabilités                                                                                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Super Administrateur** | Supervision de toutes les associations et utilisateurs, gestion des abonnements SaaS, validation/suspension d'associations, accès aux journaux d'audit globaux, configuration des paramètres système |
| **Co-Administrateur**    | Droits de modération et d'assistance délégués par le Super Administrateur                                                                                                                            |

### Niveau Association

| Rôle           | Responsabilités                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Président**  | Responsable légal de l'association : validation des prêts, des retraits de caisse, clôture des exercices, décisions de redistribution des bénéfices, gestion des membres |
| **Trésorier**  | Responsable financier : dépôts, retraits, virements inter-caisses, remboursements de prêts, collecte des cotisations, rapprochement bancaire                             |
| **Secrétaire** | Responsable administratif : inscriptions, présences aux réunions, journal des activités, rédaction des rapports, enregistrement des aides accordées                      |
| **Censeur**    | Responsable de la discipline et de l'ordre en réunion : application du règlement intérieur, saisie des amendes de retard, de tenue ou de trouble de séance en direct     |
| **Membre**     | Accède à son espace personnel : portefeuille virtuel, historique de cotisations, demandes de prêt, votes, épargnes                                                       |

Un membre peut simultanément cumuler le rôle de **chef de tontine**, **trésorier de tontine** ou **censeur** avec son rôle associatif. Ces rôles de tontine/discipline sont gérés séparément.

Dans le cadre des tontines, un **bureau de tontine** dédié (chef de tontine, trésorier de tontine) peut être désigné parmi les membres, distinct du bureau général de l'association — utile pour les associations qui hébergent plusieurs tontines en parallèle avec des animateurs différents.

---

## 5. Spécification fonctionnelle par module

### 5.1 Authentification, comptes & invitations

Chaque utilisateur crée un compte personnel unique, qu'il peut ensuite rattacher à une ou plusieurs associations.

#### Création de compte et connexion

- L'inscription requiert un email (ou un numéro de téléphone mobile en alternative, pour les membres sans adresse email) et un mot de passe respectant une complexité minimale définie par la plateforme.
- Un utilisateur qui n'appartient plus à aucune association conserve son compte en état dormant ; il ne peut pas être supprimé automatiquement mais peut demander la suppression manuelle de son compte via les paramètres. Ses données financières historiques au sein des associations qu'il a quittées sont conservées dans leur périmètre respectif.

#### Récupération de mot de passe

- La réinitialisation se déclenche depuis l'écran de connexion, via l'email ou le numéro de téléphone enregistré.
- Un lien de réinitialisation (email) ou un code OTP à 6 chiffres (SMS) est envoyé. Ce lien/code est valide **30 minutes** ; au-delà, il est invalidé et un nouveau doit être demandé.
- Après réinitialisation réussie, toutes les sessions actives du compte sont révoquées.

#### Gestion de session

- Une session reste active **30 jours** sur un appareil de confiance. Sur un appareil non marqué comme fiable, la session expire après **8 heures** d'inactivité.
- Un utilisateur peut consulter et révoquer individuellement ses sessions actives depuis ses paramètres de sécurité.
- En cas de connexion depuis un nouvel appareil non reconnu, une vérification supplémentaire par email ou SMS est proposée.

#### Authentification à deux facteurs (2FA)

La 2FA est optionnelle pour les membres, mais **recommandée** pour tous les rôles bureau (Président, Trésorier, Secrétaire). Les mécanismes supportés sont :

- **TOTP** (Google Authenticator, Authy, etc.) — méthode principale ;
- **Code OTP par SMS** — méthode alternative pour les utilisateurs sans smartphone compatible TOTP ;
- **Code OTP par email** — méthode de secours.

Un seul mécanisme 2FA actif par compte à la fois. Des codes de secours à usage unique (8 codes) sont générés à l'activation de la 2FA et doivent être conservés par l'utilisateur.

#### Invitations

- L'inscription à une association se fait soit par une demande d'adhésion soumise à validation du bureau, soit par un lien d'invitation sécurisé à usage unique transmis par un membre existant.
- Un lien d'invitation est valide **7 jours** à compter de sa génération. Au-delà, il est invalidé. Un nouveau lien peut être régénéré.
- Une invitation acceptée ne peut pas être réutilisée (usage unique strict). Si l'utilisateur invité ne finalise pas son inscription dans les 7 jours, l'invitation expire silencieusement ; le bureau peut en émettre une nouvelle.

---

### 5.2 Gestion des associations & des membres

Le bureau configure les informations générales de l'association (nom, identifiant/lien dédié, logo, devise, taux d'intérêt d'épargne, seuils d'alerte), gère la liste des membres (fiche individuelle, statut d'activité, historique), traite les demandes d'adhésion en attente, et peut exporter l'ensemble des données de l'association à tout moment — y compris après résiliation d'un abonnement, afin de garantir qu'aucune association ne se retrouve prisonnière de la plateforme.

#### Statuts d'un membre

| Statut       | Description                                                                                                                                                                                                                                                      |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Actif**    | Membre en règle, accès complet à ses droits                                                                                                                                                                                                                      |
| **Suspendu** | Accès restreint à la lecture seule de son espace personnel ; ne peut plus demander de prêt, participer à une tontine ou voter jusqu'à la levée de la suspension                                                                                                  |
| **Radié**    | Accès révoqué. Ses données financières historiques (cotisations, remboursements, prêts) sont conservées dans les archives de l'association. Ses dettes en cours (prêt non soldé, cotisations impayées) restent actives et sont gérées directement par le bureau. |

La radiation d'un membre ne solde pas automatiquement ses dettes : le bureau décide explicitement de leur traitement (report sur un garant, abandon de créance documenté, poursuite du recouvrement).

#### Droit d'adhésion (Frais d'entrée)

À son inscription, un membre peut être soumis à un **Droit d'adhésion** (frais d'entrée forfaitaires uniques configurés par l'association). Ce montant est distinct des cotisations récurrentes ou d'épargne et crédite la caisse principale dès sa validation.

#### Représentant local par procuration (Diaspora)

Un membre vivant à distance ou à l'étranger (diaspora) peut désigner sur sa fiche individuelle un **représentant local par procuration** (mandataire). Ce représentant est habilité à assister aux réunions physiques en son nom, émarger le registre de présence et percevoir les secours ou aides physiques accordés en nature par l'association.

#### Attestation d'appartenance et de régularité (PDF)

Tout membre actif à jour de ses cotisations et obligations peut générer instantanément depuis son profil une **Attestation officielle de membre en règle** au format PDF sécurisé (avec QR Code de vérification), attestant de son ancienneté et de sa régularité financière pour ses démarches administratives, bancaires ou de visa.

---

### 5.3 Trésorerie & système multi-caisses

Chaque association dispose de plusieurs caisses, réparties selon six types : caisse principale, épargne collective, épargne individuelle, épargne thématique (projets spécifiques), **banque scolaire (épargne et prêts scolaires saisonniers)**, caisse de secours / deuil, caisse des tontines. Chaque caisse peut recevoir des dépôts, des retraits contrôlés et des ajustements administratifs motivés. Un virement entre deux caisses de la même association obéit à une règle stricte : la caisse source et la caisse destination doivent être différentes et actives, le montant doit être positif, le solde source doit être suffisant, et l'opération complète (débit + crédit + journalisation) est indivisible — si une étape échoue, aucune n'est appliquée, afin qu'aucun montant ne soit jamais perdu ou dupliqué.

La **Banque Scolaire** constitue une sous-caisse spécifique ouverte généralement toute l'annee mais se libere(casse en septembre) : les membres y épargnent pour préparer la rentrée scolaire, et des prêts scolaires à taux préférentiel (définis par l'association) peuvent y être octroyés entre septembre et octobre, remboursables sur le premier trimestre du cycle suivant.

Un système de **budgets prévisionnels** permet de plafonner les dépenses par caisse et par catégorie sur une période donnée, avec alerte visuelle à l'approche du plafond. Un module de **rapprochement bancaire** compare le solde théorique du système au relevé bancaire réel et permet un ajustement de régularisation en cas d'écart — pour les caisses qui disposent effectivement d'un compte bancaire ; les caisses purement en espèces (fréquentes dans les groupes informels) disposent d'un rapprochement équivalent fondé sur un comptage physique plutôt qu'un relevé bancaire.

Chaque mois, un calcul automatique des intérêts d'épargne est exécuté sur les caisses concernées, au prorata du solde de chaque caisse (et, pour l'épargne individuelle, du solde de chaque membre), avec une **simulation préalable** possible avant application réelle.

#### Reçu de cotisation numéroté (PDF)

Pour chaque versement ou dépôt validé (cotisation, tontine, épargne, remboursement), le système génère automatiquement un **Reçu de paiement imprimable au format PDF** doté d'une **numérotation séquentielle propre à l'association** (façon carnet de reçus souche) comportant la date, l'identité du membre, le nom de la caisse, le montant, la signature numérique du Trésorier et un code QR de vérification.

---

### 5.4 Prêts et remboursements

Un membre formule une demande de prêt, que le bureau valide ou rejette.

#### Workflow de validation

- La validation d'un prêt requiert l'approbation **collégiale du bureau** : Président + Trésorier doivent tous deux approuver. En cas d'absence prolongée d'un membre du bureau, le Président peut activer un mode de validation unitaire (signature unique) pour une durée limitée, journalisée dans l'audit.
- Une demande de prêt doit recevoir une décision (approbation ou rejet motivé) dans un délai maximum de **7 jours calendaires** à compter de sa soumission. Au-delà, la demande passe automatiquement en état "en attente de décision urgente" et une alerte est envoyée au bureau.
- Le rejet doit être accompagné d'un motif écrit, visible par le demandeur.

#### Conditions et garanties

- Pour tenir compte des pratiques locales, une demande de prêt peut s'appuyer sur une **caution solidaire** — un autre membre qui se porte garant — en complément ou à la place d'une garantie matérielle.
- Si le garant se rétracte **après** l'approbation du prêt mais **avant** le versement, le prêt est suspendu et renvoyé en validation bureau. Si la rétractation survient **après** le versement, le garant reste solidaire du solde restant dû ; cette solidarité est consignée dans le contrat de prêt et dans le journal d'audit.
- Le taux d'intérêt appliqué reste configurable dans les limites définies par l'association elle-même. Les prêts de **Banque Scolaire** peuvent bénéficier d'un barème de taux allégé.

#### Versement et suivi

- Une fois approuvé, le prêt est versé dans le portefeuille du membre ou directement en caisse, selon le choix du trésorier.
- Un **échéancier de remboursement** est généré automatiquement à la date de versement, détaillant chaque mensualité (capital + intérêts).
- Le **remboursement partiel** est accepté : le système recalcule le capital restant dû, met à jour l'échéancier et recalcule les intérêts futurs sur le nouveau solde. Un versement inférieur à la mensualité minimale ne couvre pas l'échéance et déclenche le calcul de pénalité sur le reliquat.

#### Relance sociale informelle et calcul des pénalités de retard

- **Étape de relance informelle tracée** : Avant toute application automatique de pénalité ou de suspension, le Trésorier peut consigner une relance sociale préalable (ex: appel téléphonique, message direct WhatsApp). Si la situation est régularisée lors de cette étape de médiation, le bureau peut accorder un report sans pénalité.
- Les pénalités d'échéance non réglée s'appliquent après l'expiration du délai de grâce (par défaut : 3 jours calendaires) ou l'échec de la relance informelle.
- La formule est : **pénalité = solde en retard × taux journalier de pénalité**. Le taux journalier est configuré par l'association (par défaut : 0,1 % par jour). Les pénalités s'accumulent (intérêts simples, non capitalisés) jusqu'au règlement complet de l'échéance en retard.

#### Décès ou départ forcé d'un emprunteur

- En cas de décès, le solde restant est signalé au bureau pour décision collégiale : abandon de créance (documenté), appel au garant solidaire, ou recouvrement auprès des ayants droit selon les statuts de l'association. Aucune action automatique n'est déclenchée.
- En cas de radiation, les règles de la section 5.2 s'appliquent (cf. statut « Radié »).

---

### 5.5 Tontines — fonctionnement adapté au contexte africain

La tontine est le cœur du produit, et sa modélisation doit refléter la diversité réelle des pratiques observées sur le continent plutôt qu'un seul mécanisme. Le terme lui-même varie selon les régions (tontine, njangi, susu, ekub...) ; l'association peut donner à sa tontine le nom local qu'elle utilise habituellement.

**Types de fonctionnement pris en charge :**

- **Tontine à ordre fixe** : l'ordre de passage des membres est déterminé une fois pour toutes au démarrage du cycle. Chaque séance, tous les participants cotisent le même montant, et un seul membre — celui dont c'est le tour — reçoit l'intégralité de la cagnotte collectée.

- **Tontine à enchères** : à chaque tour, les membres intéressés à recevoir la cagnotte plus tôt que prévu proposent une décote (une somme qu'ils acceptent de ne pas recevoir). Le membre offrant la décote la plus élevée remporte le tour ; le montant de sa décote est redistribué aux autres participants du cycle, ce qui rend la tontine avantageuse pour tout le monde et pas seulement pour celui qui reçoit en premier. C'est le mode de fonctionnement le plus répandu dans les tontines urbaines de type « njangi ».
  - **Enchères ex-aequo** : si deux membres ou plus proposent la même décote maximale, le bénéficiaire du tour est désigné par tirage au sort parmi les ex-aequo. Ce tirage est effectué par le système de manière transparente et son résultat est journalisé.

- **Tontine à tirage au sort** : l'ordre de passage n'est pas fixé à l'avance ; à chaque tour, le bénéficiaire est déterminé par un tirage aléatoire, généralement effectué publiquement pendant la réunion, pour préserver la confiance du groupe.

- **Tontine à parts multiples** : un même membre peut détenir plusieurs parts au sein d'un même cycle (par exemple deux ou trois parts), ce qui multiplie d'autant sa cotisation due à chaque séance. Pour chaque part détenue, le membre a droit à un tour de réception distinct. Après avoir reçu un premier tour, le membre continue de cotiser normalement pour ses parts restantes jusqu'à ce que chacune ait reçu son tour. L'ordre des tours multiples d'un même membre est déterminé comme pour les autres membres (ordre fixe, enchère ou tirage) selon le type de tontine.

- **Tontine sociale / mutuelle** : forme sans rotation individuelle, où les cotisations alimentent un fonds collectif utilisé pour des besoins communs ou des secours ponctuels plutôt que redistribué à tour de rôle. Cette forme reste distincte, dans l'usage, du Fonds de Secours de l'association (5.7), mais partage la même logique de solidarité.

**Règles communes à tous les types :**

- Une tontine est créée avec un montant de cotisation (fixe ou négociable selon le type), une fréquence de collecte (hebdomadaire, mensuelle...) et une taille de groupe.
- **Taille minimale** : une tontine ne peut démarrer que si le nombre de participants inscrit atteint le seuil minimal défini à la création (par défaut : 3 membres). Si ce seuil n'est pas atteint à la date de démarrage prévue, la tontine passe en état « en attente » pour une durée de grâce de 7 jours. Passé ce délai, le bureau peut reporter la date de démarrage ou annuler la tontine. Une annulation avant le premier tour rembourse les éventuelles cotisations anticipées.
- Chaque séance de cotisation est enregistrée individuellement ; un retard de paiement déclenche une pénalité calculée automatiquement selon une règle propre à la tontine (montant fixe ou pourcentage), après un délai de grâce éventuel.
- **Report de séance** : le bureau peut reporter une séance à une nouvelle date (jour férié, absence massive, force majeure). Un report ne décale pas l'ordre des tours ; il repousse uniquement la date de collecte. L'historique des reports est consigné.
- Un membre qui quitte le groupe **avant d'avoir reçu son tour** voit ses cotisations déjà versées remboursées (déduction faite des pénalités dues le cas échéant) et sa place transmise à un remplaçant désigné par le bureau. Ce remplaçant reprend le rang du partant dans l'ordre de passage.
- Un membre qui quitte le groupe **après avoir reçu son tour** reste redevable de ses cotisations futures jusqu'à la fin du cycle ; le bureau peut désigner un remplaçant qui reprend à la fois les obligations de paiement et le rang restant.
- **Simulateur de tontine avant engagement** : Un outil interactif de simulation est mis à disposition des membres avant de rejoindre une tontine (notamment à enchères). Il permet de modéliser les scénarios de décote, les cagnottes attendues et les redistributions de fin de tour afin que chaque membre comprenne exactement ses engagements et retours financiers potentiels avant le démarrage du cycle.
- La remise de la cagnotte au bénéficiaire du tour est une action distincte, validée par le bureau, qui clôture officiellement ce tour.
- À la clôture complète d'un cycle, un relevé récapitulatif est généré pour chaque membre (cotisations versées, tours reçus, pénalités appliquées), et le groupe peut immédiatement enchaîner sur un nouveau cycle — pratique courante qui évite de recréer la tontine à chaque fois.
- Un membre peut participer simultanément à plusieurs tontines différentes au sein de la même association.
- Pour renforcer la confiance, un **mode réunion en direct** permet de projeter en temps réel l'état des cotisations et le résultat du tour (tirage, enchère ou passage) pendant la séance elle-même, reproduisant la transparence du tour de table traditionnel plutôt que de la remplacer par une simple notification. Ce mode est lancé et terminé exclusivement par le chef de tontine ou, en son absence, par le Président. En cas d'erreur de saisie détectée pendant la séance (avant clôture du tour), le chef de tontine ou le censeur peut annuler et ressaisir l'opération ; toute correction est journalisée avec le motif.

---

### 5.6 Sanctions disciplinaires

Le bureau (et particulièrement le **Censeur** pendant les réunions) peut appliquer des sanctions financières aux membres (retards répétés, absences non justifiées, téléphonie/trouble de séance, non-respect de la tenue officielle, manquements au règlement), avec un barème modulable propre à chaque association plutôt qu'un montant unique imposé par le système. Le règlement de la sanction est suivi jusqu'à son solde.

#### Processus d'application

1. Le Censeur ou un membre du bureau initie la sanction en sélectionnant le membre concerné, le motif (liste configurable par l'association) et le montant. La sanction est journalisée et ajoutée au compte du membre.
2. Le membre sanctionné reçoit une notification détaillée (motif, montant, délai de paiement).
3. Le délai de paiement est configurable par l'association (par défaut : **15 jours calendaires** à compter de la notification ou lors de la réunion suivante).

#### Contestation

- Un membre peut contester une sanction dans un délai de **5 jours** à compter de sa notification, en soumettant une explication écrite via son espace personnel.
- La contestation est traitée par le bureau (Président + Secrétaire) dans un délai de **7 jours**. Le bureau peut confirmer, modifier ou annuler la sanction. La décision est définitive et journalisée.

#### Blocage en cas de non-paiement

- Passé le délai de paiement sans règlement ni contestation en cours, le membre passe automatiquement en état **suspendu** : accès restreint à la lecture seule, impossibilité de demander un prêt, de participer à une enchère de tontine ou de voter jusqu'au règlement complet de la sanction.

---

### 5.7 Aides, secours, fonds d'urgence & Souscriptions exceptionnelles

Un membre en difficulté ou célébrant un événement de vie reçoit un soutien financier selon les règles du règlement intérieur et des mécanismes de solidarité communautaire.

- **Fonds de secours permanent** : alimenté par des cotisations récurrentes, il permet de verser des secours immédiats sans attendre une réunion.
- **Caisse de deuil avec barème préconfiguré** : l'association définit un barème fixe selon le degré de parenté de la personne décédée (membre, conjoint, enfant, parent direct). Dès l'annonce du sinistre, l'appel de fonds est automatiquement émis sur le compte de chaque membre actif avec une échéance très courte (**48 à 72 heures**, avant les obsèques). Les relances sur ces cotisations de deuil sont traitées en **priorité absolue** par le système de notification.
- **Souscriptions exceptionnelles multi-motifs** : distinct des cotisations ordinaires, le bureau ou un membre peut lancer une collecte ponctuelle pour une cause spécifique (naissance, mariage, deuil, sinistre tel qu'un incendie/inondation, ou projet solidaire). Chaque souscription dispose :
  - d'un motif explicite et d'un montant cible à atteindre ;
  - d'une date limite de collecte ;
  - d'une **barre de progression en temps réel** visible par l'ensemble des membres ;
  - du suivi transparent de la liste des contributaires et des montants versés.

---

### 5.8 Redistribution des bénéfices & Processus de "Cassation"

En fin d'exercice, les bénéfices réalisés par l'association (intérêts des prêts, amendes de sanctions, produits divers nets des frais de fonctionnement) sont répartis entre les membres au prorata de la **valeur temporelle et du volume de leur épargne** (concept du _Temps x Épargne_ / _Mois-Épargne_).

#### Le Processus de "Cassation" (Clôture & Réouverture d'Exercice)

Dans la tradition associative camerounaise et africaine, la **"Cassation"** marque la clôture annuelle. Le système propose un assistant guidé de Cassation :

1. **Recensement des produits et charges** : consolidation des intérêts perçus, amendes du Censeur et dépenses administratives.
2. **Déduction des frais de Réception / Fête de Cassation** : possibilité de déduire un montant forfaitaire ou au prorata pour le financement de la cérémonie de fin d'année avant le calcul de la masse bénéficiaire.
3. **Paiement ou Report à Nouveau** : possibilité pour le bureau de décider d'une part de bénéfice à conserver en "Report à Nouveau" (réserve de roulement) pour démarrer l'exercice suivant.
4. **Calcul automatique par Mois-Épargne** et génération des bordereaux individuels de paiement.
5. **Clôture de l'exercice et initialisation du nouveau cycle** avec transfert optionnel des reliquats ou réactivation des comptes membres.

#### Principe du calcul : Le modèle des Mois-Épargne par Unité de Base

Dans la pratique des tontines et mutuelles africaines, une somme déposée en début d'exercice a permis à la caisse d'accorder des prêts et de générer des intérêts pendant toute l'année, alors qu'une somme déposée un mois avant la clôture n'a presque pas contribué aux gains. Le système applique donc une pondération par l'ancienneté du dépôt basée sur une **Unité de Base** (ex. tranches de 5 000 FCFA, 10 000 FCFA ou 50 000 FCFA selon le type d'épargne).

#### Étapes de calcul de la redistribution

1. **Détermination des Unités de Base ($U$) et du Nombre de Mois ($M$) par versement :**
   Pour chaque versement d'épargne d'un membre effectué à une date donnée dans l'exercice :
   - **Nombre de mois d'ancienneté ($M$)** = Nombre de mois écoulés entre la date du versement et la date de clôture de l'exercice (`endDate`).
   - **Montant de base ($B$)** = Seuil unitaire configurable par l'association (par défaut : 5 000 FCFA pour l'épargne mensuelle/scolaire, 10 000 FCFA pour l'épargne trimestrielle, 50 000 FCFA pour l'épargne annuelle).
   - **Nombre d'Unités de Base ($U$)** = $\lfloor \text{Montant du versement} / B \rfloor$ (division entière).

2. **Calcul des Mois-Épargne individuels ($ME_{\text{membre}}$) :**
   Pour chaque versement d'un membre, on calcule son apport temporel : $\text{Mois-Épargne du versement} = U \times M$.
   Le total des Mois-Épargne d'un membre sur l'exercice est la somme de ses versements :
   $$ME_{\text{membre}} = \sum (U_i \times M_i)$$

3. **Calcul du total des Mois-Épargne de l'association ($ME_{\text{total}}$) :**
   $$ME_{\text{total}} = \sum ME_{\text{membre}} \quad \text{pour tous les membres éligibles}$$

4. **Calcul du Coefficient de Gain Mensuel ($C_{\text{mensuel}}$) :**
   $$C_{\text{mensuel}} = \frac{\text{Bénéfice Net Redistribuable}}{ME_{\text{total}}}$$

5. **Calcul de la Part de Bénéfice par membre ($P_{\text{membre}}$) :**
   $$P_{\text{membre}} = ME_{\text{membre}} \times C_{\text{mensuel}}$$
   Le montant total reversé au membre est égal à **son épargne totale accumulée + sa part de bénéfice ($P_{\text{membre}}$)**.

#### Règles de gestion complémentaires

- **Bénéfice net redistribuable** = Total des intérêts de prêts perçus + Amendes/Sanctions encaissées - Dépenses de fonctionnement et frais de fête de cassation (valeur minimale : 0 FCFA).
- **Montants de base ajustables** : Le bureau peut ajuster les montants de base (5 000, 10 000, 50 000 FCFA) avant de lancer la simulation et le recalcul.
- **Ajustement manuel & arrondi** : Le bureau peut prévisualiser et ajuster manuellement les parts attribuées avant validation finale.
- **Absence de bénéfice / Déficit** : Si le bénéfice net est nul ou négatif, aucune distribution d'intérêts n'est effectuée. Seul le solde de l'épargne est restitué ou conservé selon la décision d'assemblée générale.
- **Procès-Verbal et traçabilité** : Un procès-verbal officiel au format PDF (détaillant par membre l'épargne versée, les unités de base, les mois-épargne accomplis et la part de bénéfice attribuée) est généré automatiquement et conservé dans l'historique comptable.

---

### 5.9 Rapports financiers, Registre Officiel & analyse assistée par IA

L'association peut générer des rapports financiers périodiques (mensuel, trimestriel, annuel) consolidant recettes, dépenses, solde net, état des caisses et volume de prêts en cours.

#### Registre Officiel & Conformité Réglementaire (Loi 90/053 & COBAC)

Pour répondre aux exigences administratives (contrôle de sous-préfecture/préfecture selon la loi n° 90/053 au Cameroun) et prévenir la requalification bancaire (COBAC) :

- **Registre Officiel de la Réunion** : Génération d'un document récapitulatif officiel après chaque réunion (présences, cotisations levées, amendes perçues par le Censeur, prêts accordés, PV de séance signé par le Secrétaire et le Président).
- **Indicateurs de Seuil Épargne/Crédit (Alerte COBAC)** : Suivi automatique du volume global d'encours de crédit par rapport au fonds propre de l'association pour éviter tout dépassement réglementaire critique.

#### Accès au module IA

- L'analyse IA peut être déclenchée par le **Président** ou le **Trésorier** uniquement.
- Les recommandations produites sont **strictement consultatives** : elles n'entraînent aucune action automatique sur les caisses, les prêts ou les membres. Toute action reste sous la seule responsabilité du bureau.

#### Portée de l'analyse

Un module d'analyse assistée par intelligence artificielle produit, à la demande, un diagnostic de santé financière, une identification des risques de trésorerie et des recommandations pour le bureau — cette analyse doit tenir compte du statut légal et du pays de l'association, un seuil de trésorerie « sain » n'étant pas le même pour une petite tontine de quinze membres que pour une coopérative de plusieurs centaines d'adhérents.

#### Traitement des données & conformité

- Les données financières transmises au moteur IA sont **anonymisées** (noms et identifiants des membres supprimés, montants agrégés) avant envoi à tout service tiers.
- Le traitement peut être effectué par un fournisseur IA externe (ex. API LLM) ; dans ce cas, aucune donnée personnelle nominative n'est transmise hors du périmètre de la plateforme.
- L'association est informée de ce traitement dans les conditions générales d'utilisation. Elle peut désactiver le module IA depuis ses paramètres.

---

### 5.10 Portefeuille virtuel & paiements Mobile Money

Chaque membre dispose d'un portefeuille personnel qu'il peut recharger via Mobile Money ou carte bancaire, utiliser pour payer directement ses cotisations de tontine, ou depuis lequel il peut demander un retrait vers son compte Mobile Money personnel.

#### Limites de transaction

| Opération            | Minimum                 | Maximum par transaction | Maximum par jour |
| -------------------- | ----------------------- | ----------------------- | ---------------- |
| Dépôt Mobile Money   | 500 XAF (ou équivalent) | 1 000 000 XAF           | 2 000 000 XAF    |
| Retrait Mobile Money | 1 000 XAF               | 500 000 XAF             | 1 000 000 XAF    |
| Dépôt carte bancaire | 1 000 XAF               | 2 000 000 XAF           | 5 000 000 XAF    |

Ces seuils sont configurables par le Super Administrateur selon les contraintes des opérateurs et la réglementation en vigueur.

#### Frais de transaction

- Les frais opérateurs Mobile Money (prélevés par l'opérateur tiers) sont **à la charge du membre** qui initie l'opération. Ces frais sont affichés clairement avant confirmation.
- La plateforme ne prélève pas de frais additionnels sur les transactions en phase initiale. Une évolution tarifaire est possible dans les formules d'abonnement avancées.

#### Fonds en attente et gestion des erreurs

- Dès qu'un paiement est initié, le montant est marqué **en attente** dans le portefeuille du membre. Il n'est crédité (ou débité) qu'après réception de la confirmation du fournisseur de paiement.
- Si la confirmation n'arrive pas dans un délai de **10 minutes**, la transaction passe en état « timeout » et le montant en attente est libéré. Un message d'erreur est affiché au membre.
- En cas de **désynchronisation** entre la confirmation opérateur et le webhook (ex. webhook reçu mais transaction déjà expirée côté plateforme, ou webhook absent malgré succès opérateur) : la transaction est marquée « anomalie » et placée en file de réconciliation manuelle, avec alerte au Super Administrateur. Aucun crédit ni débit définitif n'est appliqué avant résolution.
- En cas d'**échec après débit effectif** côté opérateur : le membre contacte le support plateforme qui initie le remboursement via le fournisseur de paiement. Le délai de remboursement dépend de l'opérateur (généralement 24 à 72 h).

#### Délai des retraits

- Les retraits vers Mobile Money sont traités en **temps réel** pour les opérateurs qui supportent le virement instantané, et dans un délai maximum de **24 heures ouvrées** pour les autres.
- Un dépôt en espèces, validé manuellement par le trésorier, reste possible pour les membres sans accès au Mobile Money.

#### Couverture multi-opérateurs & Intégration Locale

Pour couvrir l'ensemble des opérateurs utilisés (notamment **MTN Mobile Money Cameroun** et **Orange Money Cameroun**, ainsi que Wave, Airtel Money, M-Pesa...), le système s'appuie sur une passerelle multi-opérateurs intégrant nativement des agrégateurs locaux certifiés en Afrique centrale et de l'ouest (ex: **Mesomb**, **Campay**, **CinetPay**, **TouchPay**). L'intégration permet à la fois les dépôts direct USSD (Push Notification MoMo/OM) et les paiements automatiques de cotisations.

---

### 5.11 Projets et activités associatives

Un tableau de suivi des projets et tâches associatives (type Kanban) permet au bureau de créer des projets, d'assigner des tâches aux membres et de suivre leur avancement.

---

### 5.12 Événements, réunions et présences

Chaque événement ou réunion génère un support d'émargement dématérialisé (QR Code) permettant aux membres de signaler leur présence en la scannant. Une saisie manuelle par le secrétaire reste disponible en secours pour les réunions organisées sans accès réseau.

### 5.13 Sondages, Élections & Assemblée Générale (AG)

Le bureau peut organiser des consultations, des scrutins électoraux et des Assemblées Générales formelles.

- **Sondages et Élections** : consultations à choix multiples avec vote à bulletin secret ou public ; chaque membre actif ne peut voter qu'une seule fois.
- **Module Assemblée Générale (AG) structuré** : pour se conformer aux obligations statutaires et légales (loi de 1990), le module permet d'organiser une AG complète :
  - Définition de l'ordre du jour et convocation des membres ;
  - Calcul et vérification automatique du **quorum** (présences réelles + procurations valides des membres absents/diaspora) ;
  - Soumission et vote des **résolutions une à une** (vote à la majorité simple ou qualifiée) ;
  - Génération automatique du **Procès-Verbal officiel d'Assemblée Générale (PDF)** prêt pour archivage ou dépôt administratif.

---

### 5.14 Gestion documentaire & médias

L'association gère son logo et son identité visuelle, les photos de profil de ses membres, les pièces justificatives (preuves de paiement, pièces d'identité) et les documents officiels générés par le système (rapports, procès-verbaux, relevés). Ces pièces d'identité peuvent être de nature différente selon le pays du membre (carte nationale d'identité, passeport, récépissé...), sans que leur absence bloque l'inscription.

#### Limites de fichiers

| Type                                 | Taille maximale par fichier | Quota total par association                            |
| ------------------------------------ | --------------------------- | ------------------------------------------------------ |
| Logo, photos de profil               | 5 Mo                        | —                                                      |
| Pièces justificatives (images, PDF)  | 10 Mo                       | 2 Go (Essentiel) / 10 Go (Pro) / Illimité (Enterprise) |
| Documents générés (PDF rapports, PV) | — (générés par le système)  | Inclus dans le quota ci-dessus                         |

Les formats acceptés pour les pièces justificatives sont : JPEG, PNG, PDF. Tout autre format est rejeté avec un message explicite.

#### Durée de conservation

- Les pièces justificatives et documents officiels sont conservés **5 ans** à compter de la date de leur dépôt ou génération, conformément aux obligations comptables généralement applicables.
- Une association peut demander la suppression anticipée de pièces non liées à une opération financière (ex. photo de profil retirée par un membre). Les documents liés à des transactions financières ne peuvent pas être supprimés avant expiration du délai légal.

#### Confidentialité

- Les **pièces d'identité** des membres (CNI, passeport) sont accessibles uniquement au **Président** et au **Trésorier**. Le Secrétaire peut vérifier l'existence d'une pièce mais ne peut pas en consulter le contenu.
- Les **rapports financiers** et **procès-verbaux** sont accessibles à tous les membres de l'association (lecture seule).
- Les **preuves de paiement individuelles** sont accessibles au membre concerné, au Trésorier et au Président uniquement.

---

### 5.15 Notifications

Les membres et le bureau reçoivent des notifications relatives aux événements listés ci-dessous.

#### Événements déclencheurs

| Événement                                  | Destinataire                      | Canal              |
| ------------------------------------------ | --------------------------------- | ------------------ |
| Échéance de cotisation (J-3 et J du jour)  | Membre concerné                   | Push / Email / SMS |
| Cotisation reçue                           | Membre concerné + Trésorier       | Push / Email       |
| Résultat de tirage ou d'enchère de tontine | Tous les membres de la tontine    | Push / Email       |
| Validation ou rejet d'une demande de prêt  | Membre demandeur                  | Push / Email / SMS |
| Pénalité appliquée                         | Membre concerné                   | Push / Email / SMS |
| Sanction notifiée                          | Membre concerné                   | Push / Email / SMS |
| Réponse à contestation de sanction         | Membre concerné                   | Push / Email       |
| Aide / secours accordé                     | Membre bénéficiaire               | Push / Email       |
| Invitation à une réunion ou événement      | Tous les membres de l'association | Push / Email       |
| Annonce générale du bureau                 | Tous les membres                  | Push / Email       |
| Abonnement expirant dans 7 jours           | Président                         | Email              |
| Seuil budgétaire atteint (80 % et 100 %)   | Président + Trésorier             | Push / Email       |

#### Préférences et opt-out

- Chaque membre peut configurer ses préférences de notification par canal (Push, Email, SMS) depuis son profil. Il peut désactiver un canal pour une catégorie d'événement, sauf pour les notifications **réglementaires ou financières critiques** (pénalités, sanctions, décisions de prêt) qui restent obligatoires au minimum par email.
- Un membre sans adresse email reçoit obligatoirement les notifications critiques par SMS.

#### SMS : coûts et gestion des échecs

- Les notifications SMS sont consommées depuis le crédit SMS inclus dans la formule d'abonnement (voir §5.17). En cas de dépassement, les SMS supplémentaires sont facturés à la consommation ou désactivés selon la formule.
- En cas d'échec d'envoi SMS (numéro invalide, hors réseau), une nouvelle tentative est effectuée après 30 minutes, puis après 2 heures. Après 3 échecs consécutifs, la notification est marquée « non délivrable » et un avertissement est affiché au bureau pour correction du numéro.
- En cas d'adresse email invalide détectée (rebond), l'email est marqué invalide sur le profil membre et le bureau est alerté.

---

### 5.16 Backoffice plateforme (super-administration)

Un espace d'administration centralisé, distinct des espaces associatifs, permet à l'équipe plateforme de superviser l'ensemble des associations hébergées (indicateurs globaux, suspension/réactivation), de gérer les comptes utilisateurs, d'administrer les abonnements SaaS (y compris la souscription manuelle pour un paiement hors-ligne), de suivre des indicateurs commerciaux (taux de rétention, revenu récurrent, valeur des clients), de consulter les journaux d'audit de toutes les actions sensibles, et de configurer les paramètres globaux de la plateforme (mode maintenance, passerelles de paiement, mentions légales).

---

### 5.17 Abonnements SaaS et modèle tarifaire

#### Tableau des formules

| Fonctionnalité                                           | **Découverte** (Gratuit) | **Essentiel** | **Pro**                  | **Enterprise** |
| -------------------------------------------------------- | ------------------------ | ------------- | ------------------------ | -------------- |
| Nombre d'associations                                    | 1                        | 1             | 3                        | Illimité       |
| Nombre de membres par association                        | 20                       | 100           | 500                      | Illimité       |
| Tontines (types de base : fixe + tirage)                 | ✅                       | ✅            | ✅                       | ✅             |
| Tontines avancées (enchères, parts multiples, sociale)   | ❌                       | ✅            | ✅                       | ✅             |
| Prêts avancés (caution solidaire, remboursement partiel) | ❌                       | ✅            | ✅                       | ✅             |
| Votes et élections                                       | ❌                       | ❌            | ✅                       | ✅             |
| Analyse IA                                               | ❌                       | ❌            | ✅                       | ✅             |
| Notifications SMS incluses / mois                        | 0                        | 100           | 500                      | Illimité       |
| Stockage documents                                       | 500 Mo                   | 2 Go          | 10 Go                    | Illimité       |
| Export des données                                       | ✅                       | ✅            | ✅                       | ✅             |
| Support                                                  | Communauté               | Email (48 h)  | Email prioritaire (24 h) | Dédié (4 h)    |
| **Tarif mensuel**                                        | Gratuit                  | 9 900 XAF     | 24 900 XAF               | Sur devis      |
| **Tarif annuel** (réduction ~2 mois)                     | Gratuit                  | 99 000 XAF    | 249 000 XAF              | Sur devis      |

#### Période d'essai

- Les formules Essentiel et Pro bénéficient d'une **période d'essai gratuite de 30 jours**, sans carte bancaire requise.
- À l'issue de la période d'essai sans souscription, l'association bascule automatiquement sur la formule Découverte (avec ses limites). Aucune donnée n'est supprimée dans l'immédiat.

#### Comportement après expiration d'un abonnement payant

1. **J+0 (expiration)** : l'association passe en **mode lecture seule** — consultation de toutes les données, mais aucune nouvelle opération financière, saisie de cotisation ou validation de prêt n'est possible.
2. **J+7** : une alerte rappelle que l'export des données est disponible et toujours possible.
3. **J+30** : si aucun renouvellement, l'association passe en **mode archivé** — accès réservé à l'export uniquement. Les données sont conservées 90 jours supplémentaires.
4. **J+120** : les données sont supprimées définitivement, après un dernier email d'avertissement envoyé 15 jours avant.

L'export des données reste disponible **à tout moment**, y compris en mode archivé, sans restriction.

#### Politique d'annulation

- Un abonnement annuel peut être annulé à tout moment. Le remboursement au prorata des mois non consommés est effectué si l'annulation intervient dans les **14 jours** suivant le renouvellement (droit de rétractation). Au-delà, aucun remboursement n'est accordé, mais l'accès reste actif jusqu'à la fin de la période payée.

---

### 5.18 Accès API & intégrations tierces

#### Authentification API

- L'accès à l'API se fait via des **clés API** (paires clé publique / clé secrète) générées par l'association depuis son backoffice, avec une portée de droits configurable (lecture seule, lecture-écriture sur certains modules).
- Les clés API n'ont pas de durée d'expiration par défaut mais peuvent être révoquées à tout moment.
- Pour les intégrations plus complexes nécessitant un accès délégué au nom d'un utilisateur, un flux **OAuth 2.0 (Authorization Code)** est supporté.

#### Versioning

- L'API est versionnée dès la première mise en production : toutes les routes sont préfixées par `/api/v1/`.
- Avant le retrait d'une version, un préavis de **6 mois** est communiqué aux intégrateurs.

#### Rate limiting

- Par défaut : **1 000 requêtes par heure** par clé API (toutes routes confondues).
- Les endpoints de webhooks entrants (notifications de paiement) sont exemptés du rate limiting général mais soumis à une validation de signature.

#### Sécurité des webhooks de paiement

- Les webhooks entrants des fournisseurs de paiement sont exposés sur des endpoints dédiés, non protégés par la session web.
- Chaque payload de webhook est validé par une **signature HMAC-SHA256** : la plateforme compare le hash calculé du corps de la requête (avec la clé secrète partagée avec le fournisseur) à la signature transmise dans l'en-tête HTTP. Tout webhook dont la signature ne correspond pas est rejeté avec un code HTTP 401 et journalisé.

#### Cloisonnement multi-tenant

- Toute requête API est strictly limitée au périmètre de l'association propriétaire de la clé API. Il est techniquement impossible d'accéder aux données d'une autre association, même avec une clé valide.

---

### 5.19 Gestion du patrimoine matériel & location d'équipements

Dans le contexte associatif africain et camerounais, l'acquisition de patrimoine matériel commun (tentes, bâches, chaises, groupe électrogène, sonorisation, vaisselle, matériel de réception) constitue une source autonome de revenus via sa location aux membres ou à des tiers externes.

#### Fonctionnalités du module Patrimoine :

- **Inventaire et fiches équipements** : enregistrement des biens (désignation, quantité, état : neuf, bon état, à réparer, hors service, valeur d'acquisition).
- **Gestion des réservations et locations** : planning de réservation par date, attribution à un membre ou un tiers externe, suivi des acomptes et solde de location.
- **Facturation et recettes** : génération du bon de sortie/reçu de location, et enregistrement automatique des revenus locatifs crédités directement dans la Caisse Principale ou une caisse dédiée.
- **Suivi de la maintenance** : journalisation des dépenses d'entretien et de réparation du matériel débitées sur la caisse concernée.

---

## 6. Adaptations spécifiques au contexte africain

| Enjeu                       | Réalité terrain                                                                                                      | Réponse fonctionnelle attendue                                                                                                                                                                                                                                                                                                                                                                                     |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Devises & change**        | Membres de la diaspora cotisant dans une autre devise que l'association                                              | Conversion et fixation du taux de change au moment précis de chaque paiement en devise étrangère                                                                                                                                                                                                                                                                                                                   |
| **Connectivité**            | Zones rurales en réseau instable ou coupures fréquentes                                                              | Consultation et saisie de cotisations, présences aux réunions et enregistrement d'aides possibles hors-ligne, synchronisées dès le retour du réseau                                                                                                                                                                                                                                                                |
| **Paiement mobile**         | Diversité des opérateurs Mobile Money selon les pays                                                                 | Couverture multi-opérateurs et multi-pays plutôt qu'un partenaire unique                                                                                                                                                                                                                                                                                                                                           |
| **Identité**                | Types de pièces d'identité différents selon le pays, non-possession fréquente d'une pièce à jour                     | Inscription non bloquée par l'absence de pièce justificative, types de pièce adaptables                                                                                                                                                                                                                                                                                                                            |
| **Cadre réglementaire**     | Encadrement de la collecte d'épargne/crédit variable selon les zones économiques et le statut légal de l'association | Statut légal déclaratif par association, avec seuils d'alerte à l'approche d'obligations réglementaires                                                                                                                                                                                                                                                                                                            |
| **Confiance sociale**       | La confiance repose sur la visibilité collective en réunion, pas seulement sur une validation numérique individuelle | Mode réunion en direct et co-validation des opérations sensibles par plusieurs membres du bureau                                                                                                                                                                                                                                                                                                                   |
| **Alphabétisation & accès** | Membres actifs sans smartphone ou peu à l'aise avec une interface écrite                                             | Notifications par SMS, saisie par le bureau au nom d'un membre sans accès direct                                                                                                                                                                                                                                                                                                                                   |
| **Langues**                 | Cohabitation du français, de l'anglais et de langues locales, parfois dans un même pays                              | Interface disponible en **français et en anglais** dès le lancement initial. La langue est choisie individuellement par chaque utilisateur depuis ses préférences. Les documents officiels générés (rapports, PV, relevés) sont produits dans la langue configurée par l'association (choix du bureau). D'autres langues (dont des langues locales africaines) pourront être ajoutées dans des phases ultérieures. |
| **Portabilité**             | Méfiance envers la dématérialisation, crainte de perdre l'accès aux données                                          | Export complet garanti à tout moment, y compris après résiliation                                                                                                                                                                                                                                                                                                                                                  |

#### Périmètre du mode hors-ligne

Le mode hors-ligne permet les opérations suivantes sans connexion réseau :

- **Consultation** : historique des cotisations, solde du portefeuille, état des caisses (dernière synchronisation), liste des membres, tontines actives.
- **Saisie** : enregistrement de cotisations (tontine et association), marquage de présences à une réunion, enregistrement d'une aide accordée.

Les opérations suivantes **nécessitent une connexion** (données critiques à cohérence immédiate) :

- Validation ou versement d'un prêt ;
- Virement inter-caisses ;
- Vote ou élection ;
- Paiement Mobile Money ou retrait.

**Conflits de synchronisation** : si deux saisies contradictoires ont été effectuées hors-ligne sur deux appareils différents (ex. même cotisation saisie deux fois par deux membres du bureau), le système applique la règle **« premier synchronisé, premier appliqué »**. La seconde saisie est signalée comme doublon potentiel et soumise à validation manuelle du Trésorier avant application.

---

## 7. Exigences non-fonctionnelles

- **Sécurité** : authentification renforcée, chiffrement des données sensibles (AES-256 au repos, TLS 1.2+ en transit), traçabilité intégrale de toute opération financière.
- **Disponibilité** : service accessible en continu, avec dégradation progressive plutôt que rupture totale en cas de problème réseau côté utilisateur. Objectif de disponibilité : 99,5 % hors maintenance planifiée.
- **Protection des données personnelles** : collecte limitée au strict nécessaire, conservation encadrée (cf. §5.14), droit à l'export et à la suppression conforme aux réglementations applicables (RGPD pour les membres européens/diaspora, législations nationales africaines pour les autres).
- **Accessibilité** : interface utilisable sur connexion bas débit (< 512 kbps) et sur des terminaux d'entrée de gamme (écrans 4 pouces, Android 8+).
- **Auditabilité** : toute action sensible (financière ou administrative) reste consultable dans un journal non modifiable. Le journal est exportable par le Super Administrateur (niveau plateforme) et, pour les actions propres à l'association, par le Président.
- **Performance** : les pages principales (tableau de bord, liste des cotisations) doivent s'afficher en moins de 3 secondes sur connexion 3G standard.

---

## 8. Feuille de route de mise en œuvre

### Définition du MVP (Produit Minimum Viable)

Le MVP correspond à la **Phase 2 complétée** : il doit être suffisant pour qu'une association réelle puisse gérer ses membres, ses caisses, ses cotisations et une tontine à ordre fixe en production. Toute fonctionnalité au-delà de ce périmètre est un enrichissement post-MVP.

### Phases et critères de complétion

| Phase                                      | Contenu                                                                                                               | Critère de complétion                                                                                                                                      |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Cadrage & migration**                 | Migration des données existantes vers la nouvelle architecture, mise en place des environnements (dev, staging, prod) | Données de l'association pilote migrées et vérifiées sans perte ; environnements opérationnels                                                             |
| **2. Cœur transactionnel (MVP)**           | Caisses, virements, prêts (workflow complet), tontine à ordre fixe et à tirage                                        | Tous les flux financiers validés sur données réelles par l'association pilote ; zéro anomalie comptable en recette                                         |
| **3. Sous-domaines & espaces associatifs** | Accès par sous-domaine, identité associative, gestion des membres et invitations                                      | Création autonome d'une association depuis le site vitrine ; lien dédié fonctionnel                                                                        |
| **4. Paiements Mobile Money**              | Intégration multi-opérateurs, portefeuille virtuel, webhooks sécurisés                                                | Paiement de bout en bout testé sur au moins 2 opérateurs (Orange Money + MTN MoMo) ; réconciliation des erreurs validée                                    |
| **5. Modules complémentaires**             | Tontines avancées (enchères, parts multiples), vie associative, rapports, IA, backoffice plateforme, abonnements SaaS | Toutes les fonctionnalités Pro livrées et testées ; tableau de bord backoffice opérationnel                                                                |
| **6. Recette & hardening**                 | Tests de charge, tests de pénétration, recette complète de tous les flux financiers et cas d'usage tontines africains | Tests de charge : 500 utilisateurs simultanés sans dégradation ; test de pénétration sans vulnérabilité critique ; recette signée par l'association pilote |

### Critères transversaux de qualité

- Couverture de tests automatisés ≥ 80 % sur les modules financiers (caisses, prêts, tontines).
- Aucune vulnérabilité de sévérité « Haute » ou « Critique » ouverte en production.
- Documentation API (OpenAPI/Swagger) à jour et publiée dès la Phase 3.
