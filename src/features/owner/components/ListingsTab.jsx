import { useState } from 'react';
import { Package, Pause, Pencil, Play, Plus, Send } from 'lucide-react';
import { useChargement } from '../hooks/useChargement';
import { messageErreur } from '../utils/errors';
import { LIBELLES_ANNONCE, fcfa } from '../utils/format';
import {
  changerPause,
  envoyerEnValidation,
  fetchCategories,
  fetchMesAnnonces,
} from '../../../services/listings';
import { Chargement, ErreurEtat, Pastille, VideEtat } from './Etats';
import ListingForm from './ListingForm';

const TONS = {
  draft: 'neutre',
  pending_review: 'terracotta',
  published: 'vert',
  paused: 'neutre',
  rejected: 'danger',
};

export default function ListingsTab() {
  const [mode, setMode] = useState(null); // null = liste ; { id } = formulaire
  const [info, setInfo] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [erreurAction, setErreurAction] = useState(null);

  const charge = useChargement(async () => {
    const [annonces, categories] = await Promise.all([fetchMesAnnonces(), fetchCategories()]);
    return { annonces, categories };
  });

  async function agir(id, fonction, succes) {
    setErreurAction(null);
    setInfo(null);
    setActionId(id);
    try {
      await fonction();
      setInfo(succes);
      charge.reessayer();
    } catch (err) {
      setErreurAction(
        messageErreur(err, 'Cette action n’a pas pu être faite. Réessaie dans un instant.')
      );
    } finally {
      setActionId(null);
    }
  }

  if (mode) {
    if (charge.chargement) return <Chargement lignes={2} />;
    if (charge.erreur) return <ErreurEtat message={charge.erreur} onRetry={charge.reessayer} />;
    return (
      <ListingForm
        id={mode.id}
        categories={charge.donnees.categories}
        onClose={() => setMode(null)}
        onSaved={(message) => {
          setInfo(message);
          setMode(null);
          charge.reessayer();
        }}
      />
    );
  }

  if (charge.chargement) return <Chargement />;
  if (charge.erreur) return <ErreurEtat message={charge.erreur} onRetry={charge.reessayer} />;

  const { annonces } = charge.donnees;

  return (
    <section>
      <div className="ow-entete-section">
        <h2 className="ow-titre-section">Mes annonces</h2>
        <button type="button" className="ow-btn ow-btn-principal" onClick={() => setMode({ id: null })}>
          <Plus size={18} aria-hidden="true" /> Nouvelle annonce
        </button>
      </div>

      {info && (
        <div className="ow-alerte ow-alerte-ok" role="status">
          {info}
        </div>
      )}
      {erreurAction && (
        <div className="ow-alerte ow-alerte-erreur" role="alert">
          {erreurAction}
        </div>
      )}

      {annonces.length === 0 ? (
        <VideEtat
          icone={Package}
          titre="Tu n’as pas encore d’annonce"
          texte="Ajoute ton premier matériel à louer, avec des photos et un prix par jour."
        >
          <button type="button" className="ow-btn ow-btn-principal" onClick={() => setMode({ id: null })}>
            <Plus size={18} aria-hidden="true" /> Créer une annonce
          </button>
        </VideEtat>
      ) : (
        <ul className="ow-pile ow-liste">
          {annonces.map((a) => {
            const occupe = actionId === a.id;
            const photo = a.medias[0];
            return (
              <li className="ow-carte ow-annonce" key={a.id}>
                <div className="ow-annonce-photo">
                  {photo ? (
                    <img src={photo.media_url} alt={'Photo de ' + a.title} loading="lazy" />
                  ) : (
                    <Package size={28} aria-hidden="true" />
                  )}
                </div>
                <div className="ow-annonce-corps">
                  <div className="ow-annonce-tete">
                    <h3>{a.title}</h3>
                    <Pastille ton={TONS[a.status] || 'neutre'}>
                      {LIBELLES_ANNONCE[a.status] || 'Statut inconnu'}
                    </Pastille>
                  </div>
                  <p className="ow-prix">{fcfa(a.price_per_day)} par jour</p>
                  <p className="ow-meta">
                    {a.city} • {a.quantity_total} exemplaire{a.quantity_total > 1 ? 's' : ''}
                  </p>
                  {a.status === 'rejected' && a.moderation_note && (
                    <p className="ow-note-refus">Motif du refus : {a.moderation_note}</p>
                  )}
                  <div className="ow-annonce-actions">
                    <button
                      type="button"
                      className="ow-btn ow-btn-contour ow-btn-petit"
                      disabled={occupe}
                      onClick={() => setMode({ id: a.id })}
                    >
                      <Pencil size={16} aria-hidden="true" /> Modifier
                    </button>
                    {(a.status === 'published' || a.status === 'paused') && (
                      <button
                        type="button"
                        className="ow-btn ow-btn-contour ow-btn-petit"
                        disabled={occupe}
                        onClick={() =>
                          agir(
                            a.id,
                            () => changerPause(a.id, a.status === 'published'),
                            a.status === 'published' ? 'Annonce mise en pause.' : 'Annonce de nouveau en ligne.'
                          )
                        }
                      >
                        {a.status === 'published' ? (
                          <>
                            <Pause size={16} aria-hidden="true" /> Mettre en pause
                          </>
                        ) : (
                          <>
                            <Play size={16} aria-hidden="true" /> Remettre en ligne
                          </>
                        )}
                      </button>
                    )}
                    {(a.status === 'draft' || a.status === 'rejected') && (
                      <button
                        type="button"
                        className="ow-btn ow-btn-principal ow-btn-petit"
                        disabled={occupe}
                        onClick={() => {
                          if (a.medias.length < 1) {
                            setInfo(null);
                            setErreurAction('Ajoute au moins une photo avant l’envoi en validation.');
                            return;
                          }
                          agir(
                            a.id,
                            () => envoyerEnValidation(a.id),
                            'Annonce envoyée à l’équipe LOKAA pour validation.'
                          );
                        }}
                      >
                        <Send size={16} aria-hidden="true" /> Envoyer en validation
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
