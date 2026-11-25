import { useState } from 'react';
import { CalendarDays, MessageCircle, PackageCheck, PackageOpen } from 'lucide-react';
import { useChargement } from '../hooks/useChargement';
import {
  LIBELLES_RESERVATION,
  cleMois,
  dateCourte,
  fcfa,
  heureCourte,
  lienWhatsApp,
  titreMois,
} from '../utils/format';
import { fetchReservations } from '../ownerApi';
import { Chargement, ErreurEtat, Pastille, VideEtat } from './Etats';
import InspectionSheet from './InspectionSheet';

const ACTIVES = ['pending', 'confirmed', 'ongoing'];
const TONS = {
  pending: 'terracotta',
  confirmed: 'vert',
  ongoing: 'vert',
  completed: 'neutre',
  cancelled: 'neutre',
  disputed: 'danger',
};

export default function BookingsTab() {
  const charge = useChargement(fetchReservations);
  const [filtre, setFiltre] = useState('actives');
  const [feuille, setFeuille] = useState(null); // { reservation, etape }
  const [info, setInfo] = useState(null);

  if (charge.chargement) return <Chargement />;
  if (charge.erreur) return <ErreurEtat message={charge.erreur} onRetry={charge.reessayer} />;

  const toutes = charge.donnees;
  const visibles = toutes.filter((r) =>
    filtre === 'actives' ? ACTIVES.includes(r.status) : !ACTIVES.includes(r.status)
  );

  // Calendrier : réservations classées par mois de départ.
  const mois = new Map();
  visibles.forEach((r) => {
    const cle = cleMois(r.start_at);
    if (!mois.has(cle)) mois.set(cle, []);
    mois.get(cle).push(r);
  });
  const cles = [...mois.keys()].sort();
  if (filtre !== 'actives') cles.reverse();

  return (
    <section>
      <h2 className="ow-titre-section">Calendrier des réservations</h2>

      <div className="ow-filtres" role="group" aria-label="Filtrer les réservations">
        <button
          type="button"
          className={'ow-filtre' + (filtre === 'actives' ? ' ow-filtre-actif' : '')}
          onClick={() => setFiltre('actives')}
        >
          À venir et en cours
        </button>
        <button
          type="button"
          className={'ow-filtre' + (filtre === 'historique' ? ' ow-filtre-actif' : '')}
          onClick={() => setFiltre('historique')}
        >
          Historique
        </button>
      </div>

      {info && (
        <div className="ow-alerte ow-alerte-ok" role="status">
          {info}
        </div>
      )}

      {visibles.length === 0 ? (
        <VideEtat
          icone={CalendarDays}
          titre={filtre === 'actives' ? 'Aucune réservation à venir' : 'Aucune réservation passée'}
          texte={
            filtre === 'actives'
              ? 'Quand un client réservera ton matériel, tu le verras ici.'
              : 'Les locations terminées ou annulées apparaîtront ici.'
          }
        />
      ) : (
        cles.map((cle) => (
          <div className="ow-mois" key={cle}>
            <h3 className="ow-mois-titre">{titreMois(cle)}</h3>
            <ul className="ow-pile ow-liste">
              {mois.get(cle).map((r) => {
                const whatsapp =
                  ['confirmed', 'ongoing', 'completed'].includes(r.status) && lienWhatsApp(r.clientTelephone);
                return (
                  <li className="ow-carte ow-resa" key={r.id}>
                    <div className="ow-resa-tete">
                      <div>
                        <h4>{r.titre || 'Réservation ' + r.booking_number}</h4>
                        <p className="ow-meta">
                          N° {r.booking_number}
                          {r.clientNom ? ' • ' + r.clientNom : ''}
                        </p>
                      </div>
                      <Pastille ton={TONS[r.status] || 'neutre'}>
                        {LIBELLES_RESERVATION[r.status] || 'Statut inconnu'}
                      </Pastille>
                    </div>
                    <p className="ow-dates">
                      Du {dateCourte(r.start_at)} au {dateCourte(r.end_at)}
                    </p>
                    <dl className="ow-montants">
                      <div>
                        <dt>Ton revenu net</dt>
                        <dd>{fcfa(r.owner_net)}</dd>
                      </div>
                      <div>
                        <dt>Caution</dt>
                        <dd>{fcfa(r.deposit_total)}</dd>
                      </div>
                      <div>
                        <dt>Commission LOKAA</dt>
                        <dd>{fcfa(r.commission_amount)}</dd>
                      </div>
                    </dl>

                    {r.status === 'pending' && (
                      <p className="ow-aide">
                        Le client doit payer
                        {r.expires_at ? ' avant ' + heureCourte(r.expires_at) : ' dans les 15 minutes'}. Sinon la
                        réservation expire.
                      </p>
                    )}
                    {r.status === 'disputed' && (
                      <p className="ow-aide">L’équipe LOKAA examine la retenue demandée. Tu seras informé de sa décision.</p>
                    )}

                    <div className="ow-annonce-actions">
                      {r.status === 'confirmed' && (
                        <button
                          type="button"
                          className="ow-btn ow-btn-principal ow-btn-petit"
                          onClick={() => setFeuille({ reservation: r, etape: 'before_handover' })}
                        >
                          <PackageOpen size={16} aria-hidden="true" /> Remettre le matériel
                        </button>
                      )}
                      {r.status === 'ongoing' && (
                        <button
                          type="button"
                          className="ow-btn ow-btn-principal ow-btn-petit"
                          onClick={() => setFeuille({ reservation: r, etape: 'after_return' })}
                        >
                          <PackageCheck size={16} aria-hidden="true" /> Récupérer le matériel
                        </button>
                      )}
                      {whatsapp && (
                        <a
                          className="ow-btn ow-btn-contour ow-btn-petit"
                          href={whatsapp}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle size={16} aria-hidden="true" /> WhatsApp
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))
      )}

      {feuille && (
        <InspectionSheet
          reservation={feuille.reservation}
          etape={feuille.etape}
          onClose={() => setFeuille(null)}
          onDone={(message) => {
            setFeuille(null);
            setInfo(message);
            charge.reessayer();
          }}
        />
      )}
    </section>
  );
}
