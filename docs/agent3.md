# LISEZMOI — Agent 3 : Réservation (LOKAA)

## Ce que contient le zip
- `src/features/booking/` : composants (formulaire, récapitulatif, décompte/paiement, annulation, avis, WhatsApp, cartes), `format.js`, `useLoad.js`, `booking.css`
- `src/pages/BookingPage.jsx` (route `/reserver/:id`) et `src/pages/CustomerDashboard.jsx` (route `/mes-reservations`)
- `src/services/bookings.js` et `src/services/payment.js`

Aucun fichier d'un autre agent. Fusion par simple copie. Aucune modification de `App.jsx` : l'agent 1 détecte les pages tout seul.

## Ce qui marche
- **Réserver** : reprend `?debut=&fin=&qte=` de l'agent 2 (même convention `AAAA-MM-JJ` + `T00:00:00Z`). Vérifie la disponibilité tout seul (`lokaa_check_availability`), affiche ce que la base renvoie, puis `lokaa_create_booking`.
- **Livraison** : case « Je veux être livré » (seulement si l'annonce l'autorise) + adresse obligatoire. Frais envoyés = 0. Après la création : `lokaa_demander_livraison` (départ = adresse de l'annonce, arrivée = adresse saisie). Si ça échoue, bouton « Réessayer la livraison ».
- **Après la création** : on reste sur la même page. Récapitulatif (montants lus dans la base, jamais recalculés), décompte des 15 minutes (`expires_at`), bouton « Payer » désactivé avec « Paiement mobile bientôt disponible ». À zéro : « Expirée ».
- **Mes réservations** : 4 onglets (À venir / En cours / Terminées / Annulées) avec compteurs. Une réservation « en attente » dont le délai est passé est rangée dans Annulées avec la pastille « Expirée ». Le détail s'ouvre avec `?r=<id>` (le bouton retour du téléphone marche).
- **Annulation** : `lokaa_annuler`, avec motif facultatif et rappel de la règle (remboursement complet si ≥ 2 jours avant le début). La base décide. Le statut affiché est relu depuis la base.
- **Avis** : sur une réservation terminée, note 1 à 5 + commentaire, écrit dans `lokaa_reviews`. Un seul avis par réservation (si déjà donné, on l'affiche).
- **WhatsApp** : seulement si le statut (donné par la base) est confirmed / ongoing / completed. Numéro lu dans `lokaa_profiles.phone` du propriétaire ; un numéro à 8 chiffres reçoit l'indicatif 228.
- 3 états partout : chargement, erreur avec « Réessayer », vide. Messages en français simple, prix en FCFA.

## Paiement (à brancher par le responsable)
Tout est dans `src/services/payment.js` : la fonction `payerReservation()` renvoie l'erreur « non activé », et `PAIEMENT_ACTIF = false` garde le bouton désactivé. Quand `lokaa-pay` existe : écrire l'appel dans cette fonction, passer `PAIEMENT_ACTIF` à `true`. Le passage à « confirmed » vient de la base, jamais de l'écran (relire la réservation après paiement).

## Hypothèses à vérifier (je n'ai rien inventé, mais ces points ne sont pas dans la liste)
- `lokaa_bookings.id` existe (utilisé pour `p_booking`). Lecture avec `select('*')` car les colonnes « ... » ne sont pas détaillées.
- `lokaa_booking_items` a `booking_id`, `listing_id` et une quantité (`quantity`, sinon `qty`). Sans ça, le titre affiché est « Location de matériel » (rien ne casse).
- Le client peut lire `lokaa_profiles.phone` du propriétaire et écrire dans `lokaa_reviews`. Sinon : « Le propriétaire n'a pas encore donné son numéro » / message d'erreur français à l'envoi de l'avis.
- `p_pickup` / `p_dest` de `lokaa_demander_livraison` sont envoyés en texte. Si la base attend autre chose (ex. JSON), un seul endroit à changer : `demanderLivraison` dans `src/services/bookings.js`.
- `lokaa_annuler` : `p_motif` envoyé à `null` si vide.
- La réponse de `lokaa_create_booking` contient `booking_id` (sinon `id`).

## Pour toi / les autres agents
- Agent 4 / 5 : rien à toucher. Agent 2 : « Réserver » arrive bien chez moi avec ses 3 paramètres.
- Je n'ai pas copié `formatFcfa` de l'agent 2 : j'ai le mien dans `features/booking/format.js`.

## Comment tester
1. Fusionner : copier `src/` dans le projet de l'agent 1 (+ agent 2), puis `npm install` et `npm run dev`.
2. Se connecter, ouvrir une annonce, choisir des dates, « Réserver ». Vérifier : décompte, « Payer » grisé, annulation.
3. `/mes-reservations` : onglets, détail, avis sur une location terminée, WhatsApp sur une réservation payée.

## Ce que j'ai vraiment testé
`npm install` est impossible chez moi (pas d'internet). J'ai donc compilé mon code avec esbuild et l'ai fait tourner dans un vrai navigateur (taille téléphone, clair et sombre) contre une **fausse base en mémoire**, hors du zip. 21 vérifications OK : disponibilité, paramètres envoyés à la base, livraison, décompte, « Payer » désactivé, annulation, onglets, expiré, WhatsApp, avis, erreurs en français, aucune erreur console. **Pas testé contre la vraie base** : à faire sur ton téléphone.

## Relecture finale (ta liste)
Aucune table inventée (que celles de la liste) · changements de statut uniquement par `supabase.rpc` (seule écriture directe : l'avis dans `lokaa_reviews`) · aucun paiement simulé · aucun secret · tout en français · prix en FCFA · 3 états présents · style NGF (variables de `tokens.css`).
