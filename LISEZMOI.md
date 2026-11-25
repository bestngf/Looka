# LOKAA : projet unique (agents 1 à 5 fusionnés)

Location de matériel au Togo. React + Vite, JavaScript. Tout en français, prix en FCFA.

## Ce qu'il y a dedans
- Agent 1 : base, connexion pseudo + code, menu, identité NGF, application installable
- Agent 2 : accueil, catalogue, fiche annonce
- Agent 3 : réservation, espace client, annulation, avis, WhatsApp
- Agent 4 : espace propriétaire (annonces, photos, prix dégressifs, remise/retour, revenus)
- Agent 5 : espace transporteur (`/transport`) et espace équipe LOKAA (`/equipe`)
- Les notes de chaque agent sont dans `docs/`.

## Correctifs faits à la fusion
- Livraison : l'écran demandait des frais à 0, ce qui rendait la livraison impossible. Il envoie maintenant une demande de livraison ; la base fixe le prix (1 500 FCFA minimum).
- Une demande de livraison crée l'aller (livraison) et le retour (récupération).
- Les livraisons n'apparaissent aux transporteurs qu'une fois la réservation payée, et sont annulées si la réservation l'est.
- Le lien « Équipe LOKAA » du menu n'apparaît que pour les administrateurs.

## Mettre en ligne (téléphone)
Ce projet doit être « construit » avant de s'afficher. Le plus simple : mettre ce dossier dans le dépôt GitHub du projet, puis relier ce dépôt à Netlify. Le fichier `netlify.toml` contient déjà tout (installation, construction, redirection des pages). Aucune variable à saisir : la configuration publique est dans `src/config.js`.

## Important
- **Ce projet n'a jamais été lancé dans un navigateur** : l'espace où il a été écrit n'a pas accès aux paquets (`npm install` impossible). Chaque fichier a été vérifié (il compile), et le déroulement côté base de données a été testé en vrai (réservation, livraison, paiement, remise, retour, versements). Au premier lancement, il peut rester de petites erreurs d'affichage : note-les et renvoie-les.
- **Paiement mobile pas encore branché** : le bouton « Payer » est grisé. Il sera activé quand la fonction `lokaa-pay` existera (voir `src/services/payment.js`).
- **Récupération du code par e-mail** : marche après l'ajout de la clé Brevo dans Supabase (secrets `BREVO_API_KEY` et `BREVO_SENDER`).
- Le compte équipe LOKAA est celui des administrateurs NGF existants.

## Tester sur ton téléphone
1. Créer 3 comptes : un client, un propriétaire, un transporteur.
2. Propriétaire : créer une annonce avec photos, « Envoyer en validation ».
3. Équipe (compte admin NGF) : `/equipe` → Annonces → Publier.
4. Client : trouver l'annonce, réserver (avec livraison).
5. Le paiement est grisé : pour tester la suite, le responsable peut confirmer le paiement côté base.
