import { Wallet } from 'lucide-react';
import { useChargement } from '../hooks/useChargement';
import { fcfa, heureCourte } from '../utils/format';
import { fetchReservations, fetchVersements } from '../ownerApi';
import { Chargement, ErreurEtat, Pastille, VideEtat } from './Etats';

// Seul le statut « paid » compte comme versé : on n'affiche jamais « versé » sans confirmation de la base.
// À vérifier avec le responsable : valeurs réelles de lokaa_payouts.status.
const STATUT_VERSE = 'paid';

export default function RevenuTab() {
  const charge = useChargement(async () => {
    const [versements, reservations] = await Promise.all([fetchVersements(), fetchReservations()]);
    return { versements, reservations };
  });

  if (charge.chargement) return <Chargement lignes={2} />;
  if (charge.erreur) return <ErreurEtat message={charge.erreur} onRetry={charge.reessayer} />;

  const { versements, reservations } = charge.donnees;
  const somme = (liste) => liste.reduce((t, x) => t + (Number(x.amount) || 0), 0);

  const verses = versements.filter((p) => p.status === STATUT_VERSE);
  const aVenir = versements.filter((p) => p.status !== STATUT_VERSE);
  const enCours = reservations
    .filter((r) => r.status === 'confirmed' || r.status === 'ongoing')
    .reduce((t, r) => t + (Number(r.owner_net) || 0), 0);
  const numeros = new Map(reservations.map((r) => [r.id, r.booking_number]));

  return (
    <section>
      <h2 className="ow-titre-section">Mes revenus</h2>

      <div className="ow-chiffres">
        <div className="ow-carte ow-chiffre">
          <span>À venir</span>
          <strong>{fcfa(somme(aVenir))}</strong>
        </div>
        <div className="ow-carte ow-chiffre ow-chiffre-or">
          <span>Déjà versé</span>
          <strong>{fcfa(somme(verses))}</strong>
        </div>
      </div>
      <p className="ow-aide">
        Locations en cours (revenu net calculé par LOKAA) : {fcfa(enCours)}. Ce montant n’est pas encore un
        versement.
      </p>

      {versements.length === 0 ? (
        <VideEtat
          icone={Wallet}
          titre="Aucun versement pour le moment"
          texte="Tes versements apparaîtront ici après tes locations terminées."
        />
      ) : (
        <ul className="ow-pile ow-liste">
          {versements.map((p) => (
            <li className="ow-carte ow-versement" key={p.id}>
              <div>
                <h3>{fcfa(p.amount)}</h3>
                <p className="ow-meta">
                  Réservation {numeros.get(p.booking_id) || ''}
                  {p.created_at ? ' • ' + heureCourte(p.created_at) : ''}
                </p>
              </div>
              <Pastille ton={p.status === STATUT_VERSE ? 'vert' : 'terracotta'}>
                {p.status === STATUT_VERSE ? 'Versé' : 'À venir'}
              </Pastille>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
