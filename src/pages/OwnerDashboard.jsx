import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, LogIn, Package, Store, Wallet } from 'lucide-react';
import '../features/owner/owner.css';
import { useChargement } from '../features/owner/hooks/useChargement';
import { messageErreur } from '../features/owner/utils/errors';
import { devenirProprietaire, fetchMonProfil } from '../features/owner/ownerApi';
import { sessionUtilisateurId } from '../services/listings';
import { Chargement, ErreurEtat, VideEtat } from '../features/owner/components/Etats';
import ListingsTab from '../features/owner/components/ListingsTab';
import BookingsTab from '../features/owner/components/BookingsTab';
import RevenuTab from '../features/owner/components/RevenuTab';

const ONGLETS = [
  { cle: 'annonces', libelle: 'Annonces', Icone: Package },
  { cle: 'reservations', libelle: 'Réservations', Icone: CalendarDays },
  { cle: 'revenus', libelle: 'Revenus', Icone: Wallet },
];

export default function OwnerDashboard() {
  const [onglet, setOnglet] = useState('annonces');
  const [passage, setPassage] = useState({ enCours: false, erreur: null });

  const charge = useChargement(async () => {
    const uid = await sessionUtilisateurId();
    if (!uid) return { connecte: false, profil: null };
    return { connecte: true, profil: await fetchMonProfil() };
  });

  async function devenir(profil) {
    setPassage({ enCours: true, erreur: null });
    try {
      await devenirProprietaire(profil);
      setPassage({ enCours: false, erreur: null });
      charge.reessayer();
    } catch (err) {
      setPassage({
        enCours: false,
        erreur: messageErreur(err, 'Le changement de compte a échoué. Réessaie dans un instant.'),
      });
    }
  }

  let contenu;
  if (charge.chargement) {
    contenu = <Chargement />;
  } else if (charge.erreur) {
    contenu = <ErreurEtat message={charge.erreur} onRetry={charge.reessayer} />;
  } else if (!charge.donnees.connecte) {
    contenu = (
      <VideEtat
        icone={LogIn}
        titre="Connecte-toi pour continuer"
        texte="L’espace propriétaire est réservé aux personnes connectées."
      >
        <Link className="ow-btn ow-btn-principal" to="/connexion">
          Se connecter
        </Link>
      </VideEtat>
    );
  } else if (!charge.donnees.profil) {
    contenu = (
      <VideEtat
        icone={Store}
        titre="Complète ton profil d’abord"
        texte="Ton profil n’est pas encore rempli. Renseigne ton nom, ton téléphone et ta ville, puis reviens ici."
      >
        <Link className="ow-btn ow-btn-contour" to="/profil">
          Ouvrir mon profil
        </Link>
      </VideEtat>
    );
  } else if (charge.donnees.profil.account_type !== 'owner') {
    contenu = (
      <VideEtat
        icone={Store}
        titre="Loue ton matériel avec LOKAA"
        texte="Ton compte est un compte client. Passe en compte propriétaire pour publier des annonces."
      >
        {passage.erreur && (
          <div className="ow-alerte ow-alerte-erreur" role="alert">
            {passage.erreur}
          </div>
        )}
        <button
          type="button"
          className="ow-btn ow-btn-principal"
          disabled={passage.enCours}
          onClick={() => devenir(charge.donnees.profil)}
        >
          {passage.enCours ? 'Un instant…' : 'Devenir propriétaire'}
        </button>
      </VideEtat>
    );
  } else {
    contenu = (
      <>
        <nav className="ow-onglets" role="tablist" aria-label="Espace propriétaire">
          {ONGLETS.map(({ cle, libelle, Icone }) => (
            <button
              key={cle}
              type="button"
              role="tab"
              aria-selected={onglet === cle}
              className={'ow-onglet' + (onglet === cle ? ' ow-onglet-actif' : '')}
              onClick={() => setOnglet(cle)}
            >
              <Icone size={18} aria-hidden="true" />
              <span>{libelle}</span>
            </button>
          ))}
        </nav>
        <div role="tabpanel">
          {onglet === 'annonces' && <ListingsTab />}
          {onglet === 'reservations' && <BookingsTab />}
          {onglet === 'revenus' && <RevenuTab />}
        </div>
      </>
    );
  }

  return (
    <main className="ow">
      <header className="ow-entete">
        <h1>Espace propriétaire</h1>
        <p>Gère tes annonces, tes locations et tes revenus.</p>
      </header>
      <div className="ow-kente" aria-hidden="true" />
      <div className="ow-contenu">{contenu}</div>
    </main>
  );
}
