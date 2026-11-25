# LISEZMOI — Agent 4 : Propriétaire (C)

## Ce que contient ce zip (mes dossiers seulement)
- `src/pages/OwnerDashboard.jsx` : page de l'espace propriétaire (route `/proprietaire`, export par défaut).
- `src/services/listings.js` : annonces, photos, prix dégressifs, pause, envoi en validation.
- `src/features/owner/` : écrans, hooks, utilitaires, `owner.css` (style propre à la zone), `ownerApi.js` (réservations, contrôles, versements, profil).

Pour fusionner : copier le contenu du zip dans le projet. Aucun fichier d'un autre agent n'est inclus.

## Ce qui est fait
- **Annonces** : créer, modifier, mettre en pause / remettre en ligne, « Envoyer en validation » (statut `pending_review`). Une nouvelle annonce commence en brouillon.
- **Photos** : 5 maximum par annonce, réduites sur le téléphone avant l'envoi (jpeg/png/webp, 5 Mo max), envoyées dans `lokaa-photos` au chemin `<user_id>/<listing_id>/<fichier>`.
- **Prix dégressifs** : jusqu'à 4 (à partir de N jours, prix plus bas que le prix de base).
- **Localisation** : ville, précisions d'adresse et bouton « Utiliser ma position » (facultatif).
- **Calendrier** : réservations classées par mois (« À venir et en cours » / « Historique »).
- **Remise** : contrôle d'état (note + 2 photos) enregistré avant `lokaa_remettre`.
- **Retour** : contrôle d'état « after_return » enregistré avant `lokaa_cloturer`. Retenue possible (montant ≤ caution + motif obligatoire) : l'écran dit que l'équipe LOKAA tranche.
- **Revenus** : « À venir » et « Déjà versé » depuis `lokaa_payouts`, plus le net des locations en cours (valeur de la base).
- WhatsApp vers le client depuis une réservation confirmée, en cours ou terminée.
- Tous les écrans ont 3 états (chargement, erreur avec « Réessayer », vide). Tout est en français et en FCFA.

## Ce qui reste / limites
- **Je n'ai pas pu lancer le projet** : pas d'accès réseau pour installer React/Vite dans mon espace. Le code est relu à la main, mais **pas testé dans un navigateur**. À tester en premier.
- Annuler une réservation côté propriétaire (`lokaa_annuler`) : non fait, ce n'était pas dans ma liste.
- Pas de modification des photos d'un contrôle après coup.

## À vérifier avec le responsable (je n'ai pas inventé, j'ai supposé)
1. `src/lib/supabase.js` (agent 1) doit exporter `supabase` (nommé ou par défaut).
2. Routes de l'agent 1 : `/proprietaire` (ma page), `/connexion` et `/profil` (liens affichés si non connecté / profil vide). Adapter si les noms diffèrent.
3. `lokaa_listing_media.media_type` : j'envoie `'image'`.
4. `lokaa_payouts.status` : seul `'paid'` est compté « versé ». Les autres valeurs sont « à venir ».
5. `lokaa_inspections` : écriture directe avec `booking_id`, `inspection_stage`, `condition_notes`, `photo_urls` (tableau). Si la base exige d'autres champs ou refuse l'écriture, un message d'erreur clair s'affiche.
6. Pause d'annonce et envoi en validation : changement direct de `status`. Si les droits de la base le refusent, message d'erreur clair.
7. Le motif d'une retenue est écrit dans la note du contrôle « after_return » (`lokaa_cloturer` ne prend que le montant).
8. Photos des contrôles : chemin `<user_id>/controles-<booking_id>/<fichier>` dans `lokaa-photos`.
9. Les lignes de `lokaa_booking_items` sont lues avec un champ `listing_id` pour afficher le titre. S'il n'existe pas, l'écran affiche « Réservation <numéro> ».
10. Numéro WhatsApp à 8 chiffres : j'ajoute l'indicatif Togo 228.

## Comment tester
1. Se connecter avec un compte propriétaire (ou cliquer « Devenir propriétaire » depuis un compte client).
2. Aller sur `/proprietaire` : créer une annonce avec 1 à 5 photos, un prix dégressif, puis « Envoyer en validation ».
3. Onglet Annonces : tester Modifier et Mettre en pause.
4. Onglet Réservations : avec une réservation `confirmed`, « Remettre le matériel » ; puis, en `ongoing`, « Récupérer le matériel », avec et sans retenue.
5. Onglet Revenus : vérifier « À venir » et « Déjà versé ».
6. Couper le réseau : chaque écran doit afficher l'erreur avec « Réessayer ».
