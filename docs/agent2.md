# LISEZMOI — Agent 2 : Catalogue (LOKAA)

## Ce que contient le zip
- `src/features/catalogue/` : api.js, constants.js, format.js, useAsync.js, composants (cartes, filtres, carrousel, disponibilité, états) et `catalogue.css`
- `src/pages/HomePage.jsx`, `CataloguePage.jsx`, `ListingDetailsPage.jsx`

Aucun fichier d'un autre agent. Fusion par simple copie.

## Ce qui marche (écrit, non lancé)
- **Accueil `/`** : bannière LOKAA avec recherche, catégories, 4 dernières annonces.
- **Liste `/annonces`** : recherche par mot-clé (titre + description), filtres (ville, prix max par jour, catégorie, livraison possible), tri au choix (récentes / prix croissant), 1 annonce par ligne, bouton « Voir plus » (10 par page). Les filtres sont dans l'adresse (`?q=&ville=&max=&cat=&liv=1&tri=prix`).
- **Fiche `/annonces/:id`** : carrousel de photos, prix, caution, livraison, prix dégressifs, description, note du propriétaire (`lokaa_proprietaire_public`), vérification de disponibilité (`lokaa_check_availability`), bouton « Réserver ».
- Chaque écran a 3 états : chargement, erreur avec « Réessayer », vide. Seules les annonces `published` sont montrées. Visiteur non connecté : il voit tout ; la connexion est demandée au clic sur « Réserver ».

## À savoir pour les autres agents
- **Agent 1** : j'importe `{ supabase }` depuis `src/lib/supabase.js`. Le chemin de connexion est `LOGIN_PATH = '/connexion'` dans `src/features/catalogue/constants.js` (à changer si ta route est différente). Je passe `state: { from }` à la navigation pour revenir après connexion.
- **Agent 3** : « Réserver » envoie vers `/reserver/:id?debut=AAAA-MM-JJ&fin=AAAA-MM-JJ&qte=N` (les 3 paramètres seulement si des dates ont été choisies). Pour la vérification j'envoie `p_start_at = <debut>T00:00:00Z` et `p_end_at = <fin>T00:00:00Z`. Utilise la même convention.
- Les photos : `media_url` peut être une URL complète ou un chemin du bucket `lokaa-photos` ; les deux sont gérés.

## Hypothèses à vérifier (je n'ai rien inventé, mais ces colonnes ne sont pas dans la liste)
- `lokaa_categories.id` existe (utilisé pour filtrer par `category_id`).
- `lokaa_listings.created_at` existe pour « les plus récentes ». Sinon la liste s'affiche quand même, sans tri par date.
- Les valeurs de `lokaa_listing_media.media_type` : j'affiche les lignes vides ou commençant par `image` / `photo`.
- `lokaa_categories.icon` : nom d'icône (tent, truck, hammer, camera…) ou emoji ; sinon icône « colis ».

## Ce qui reste / idées
- **Champ « couleur »** : demandé en filtre, mais aucun champ couleur dans la base. La recherche par mot-clé couvre le titre et la description. Un champ `color` serait utile à l'avenir (décision du responsable base).
- Pas de calendrier visuel de disponibilité (seulement la vérification sur dates choisies).
- Non testé dans un navigateur (pas de réseau dans mon environnement).

## Comment tester
1. Copier `src/` dans le projet de l'agent 1 (routes `/`, `/annonces`, `/annonces/:id` branchées sur mes 3 pages).
2. Lancer `npm run dev` et ouvrir sur téléphone.
3. Vérifier : catégories visibles, recherche, filtres, « Voir plus », fiche, disponibilité, « Réserver » (déconnecté → page de connexion).
