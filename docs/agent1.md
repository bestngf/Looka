# LISEZMOI – Agent 1 : Base (LOKAA)

## Ce qui est fait
- Projet React + Vite (JavaScript), React Router, Lucide React. Tout en français.
- Routes : `/`, `/annonces`, `/annonces/:id`, `/reserver/:id`, `/mes-reservations`, `/proprietaire`, `/transport`, `/equipe`, plus `/connexion`, `/inscription`, `/code-oublie`, `/profil`.
- Les pages des agents 2 à 5 sont **détectées toute seules** dans `src/pages/` (HomePage, CataloguePage, ListingDetailsPage, BookingPage, CustomerDashboard, OwnerDashboard, TransportPage, TeamPage). Tant qu'un fichier manque, l'écran « Bientôt disponible » s'affiche. Après la fusion des zips, rien à modifier dans `App.jsx`.
- Les routes réservées aux connectés (`/reserver`, `/mes-reservations`, `/proprietaire`, `/transport`, `/equipe`, `/profil`) renvoient vers la connexion. Le contrôle du rôle (propriétaire, transporteur, équipe) reste à faire dans chaque page : la base décide.
- Connexion : inscription en 2 étapes (vérification de l'identifiant avec `check_only`), connexion, code oublié (message « La récupération par e-mail n'est pas encore activée » si `mail_non_configure`), profil (via `lokaa_mon_profil`), changement de code. L'e-mail fabriqué n'est jamais affiché. Après connexion : retour à l'accueil.
- Identité NGF : noir et or, clair/sombre automatique, vert profond + terracotta, bandeau kente fin, lancement animé « NGF » → « New Generation Form » à chaque ouverture.
- PWA : manifest, icône « LK » dessinée (`public/icon.svg`), service worker (app gardée en cache, appels à la base jamais gardés).
- Menu ☰ en haut (tiroir). Le lien « Équipe LOKAA » est visible pour tout connecté ; la page elle-même doit réserver l'accès aux admins.

## Pour les autres agents
- Composants : `src/components/ui/ui.jsx` → `Button` (variant `gold|green|surface`, prop `to`), `Card`, `Loading`, `Skeleton`, `ErrorState({message,onRetry})`, `EmptyState({title,text,action})`, `Field`, `Input`.
- Connexion : `useAuth()` depuis `src/features/auth/AuthContext.jsx` → `{ session, user, profile, profileStatus, refreshProfile, signOut }` (`profile.account_type` = customer | owner | transporter).
- Base : `import { supabase } from '../lib/supabase'`. Config publique : `src/config.js` (`PHOTOS_BUCKET`, etc.).
- Couleurs : variables CSS de `src/styles/tokens.css` (`--gold`, `--green`, `--terra`, `--surface`, `--line`, `--radius`…). Classe `.page` pour un écran standard.

## Ce qui reste / à savoir
- **Je n'ai pas pu lancer `npm install` ni `npm run build`** (pas d'internet dans mon espace). Le code est relu mais **pas testé en vrai** : fais `npm install` puis `npm run dev`.
- Icône : seulement en SVG. Certains iPhone préfèrent un PNG 180×180 pour l'écran d'accueil : à ajouter plus tard si besoin.
- Règles de l'identifiant (3 à 30 signes : minuscules, chiffres, `.` `_` `-`) choisies par moi pour que l'e-mail fabriqué reste valable. À confirmer avec le serveur.
- Le texte d'erreur de `lokaa-signup` n'est pas connu : je détecte « identifiant pris » avec quelques mots clés, sinon message général.
- Le type de compte envoyé à `lokaa_mon_profil` (`p_type`) est `customer`, `owner` ou `transporter`.

## Comment tester
1. `npm install` puis `npm run dev`, ouvrir l'adresse sur le téléphone.
2. Voir le lancement animé, ouvrir le menu ☰, créer un compte (2 étapes), se déconnecter, se reconnecter.
3. Tester « code oublié » : le message d'activation doit s'afficher tant que le mail n'est pas configuré.
4. Mode avion après un premier chargement (version `npm run build` + `npm run preview`) : l'app doit s'ouvrir.

## Relecture finale (ta liste)
Aucun champ ou table inventé · aucun paiement · aucune clé secrète (seule la clé publique anon, dans `src/config.js`) · textes en français · états chargement / erreur avec « Réessayer » / vide présents (profil, pages à venir) · style NGF.
