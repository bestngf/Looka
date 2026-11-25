import { useState } from 'react';
import { X } from 'lucide-react';
import { usePhotosLocales } from '../hooks/usePhotosLocales';
import { messageErreur } from '../utils/errors';
import { reduireImage } from '../utils/image';
import { fcfa } from '../utils/format';
import {
  cloturer,
  enregistrerControle,
  remettre,
  televerserPhotosControle,
} from '../ownerApi';
import PhotoPicker from './PhotoPicker';

const MAX_PHOTOS_CONTROLE = 2;

// Contrôle d'état : une note + 2 photos maximum, avant la remise ou après le retour.
export default function InspectionSheet({ reservation, etape, onClose, onDone }) {
  const retour = etape === 'after_return';
  const caution = Number(reservation.deposit_total) || 0;

  const photos = usePhotosLocales(MAX_PHOTOS_CONTROLE);
  const [note, setNote] = useState('');
  const [retenueActive, setRetenueActive] = useState(false);
  const [montant, setMontant] = useState('');
  const [motif, setMotif] = useState('');
  const [erreurs, setErreurs] = useState({});
  const [erreurGlobale, setErreurGlobale] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const [controleEnregistre, setControleEnregistre] = useState(false);

  function valider() {
    const e = {};
    if (note.trim().length < 3) e.note = 'Décris en quelques mots l’état du matériel.';
    if (retour && retenueActive) {
      const m = Number(montant);
      if (!m || m < 1) e.montant = 'Indique le montant de la retenue en FCFA.';
      else if (m > caution) e.montant = 'La retenue ne peut pas dépasser la caution (' + fcfa(caution) + ').';
      if (motif.trim().length < 3) e.motif = 'Explique pourquoi tu demandes une retenue.';
    }
    return e;
  }

  async function valideLeControle() {
    setErreurGlobale(null);
    const e = valider();
    setErreurs(e);
    if (Object.keys(e).length > 0) return;

    const retenue = retour && retenueActive ? Number(montant) : 0;
    setEnCours(true);
    try {
      if (!controleEnregistre) {
        const blobs = [];
        for (const p of photos.photos) blobs.push(await reduireImage(p.fichier));
        const urls = blobs.length ? await televerserPhotosControle(reservation.id, blobs) : [];
        // Le motif de la retenue est gardé dans la note du contrôle (la fonction de la base ne prend que le montant).
        const texteNote =
          note.trim() +
          (retenue > 0 ? '\nRetenue demandée : ' + fcfa(retenue) + '. Motif : ' + motif.trim() : '');
        await enregistrerControle({
          bookingId: reservation.id,
          stage: etape,
          note: texteNote,
          photoUrls: urls,
        });
        setControleEnregistre(true);
      }
      if (retour) {
        await cloturer(reservation.id, retenue);
        onDone(
          retenue > 0
            ? 'Retour enregistré. L’équipe LOKAA va trancher pour la retenue.'
            : 'Retour enregistré. La location est terminée.'
        );
      } else {
        await remettre(reservation.id);
        onDone('Matériel remis. La location est en cours.');
      }
    } catch (err) {
      setErreurGlobale(
        messageErreur(
          err,
          controleEnregistre
            ? 'Le contrôle est enregistré, mais la suite a échoué. Réessaie.'
            : 'Le contrôle n’a pas pu être enregistré. Réessaie.'
        )
      );
    } finally {
      setEnCours(false);
    }
  }

  return (
    <div className="ow-voile" role="dialog" aria-modal="true" aria-labelledby="ow-feuille-titre">
      <div className="ow-feuille">
        <div className="ow-feuille-tete">
          <h2 id="ow-feuille-titre">{retour ? 'Retour du matériel' : 'Remise du matériel'}</h2>
          <button type="button" className="ow-btn-icone" onClick={onClose} disabled={enCours} aria-label="Fermer">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <p className="ow-aide">
          Réservation {reservation.booking_number}. Note l’état du matériel et prends jusqu’à 2 photos :
          cela protège toi et ton client.
        </p>

        <label className="ow-champ">
          <span>{retour ? 'État au retour' : 'État à la remise'}</span>
          <textarea
            className="ow-input"
            rows={3}
            value={note}
            disabled={enCours || controleEnregistre}
            onChange={(e) => setNote(e.target.value)}
          />
          {erreurs.note && <small className="ow-erreur-champ">{erreurs.note}</small>}
        </label>

        <PhotoPicker
          nouvelles={photos.photos}
          onAjouter={photos.ajouter}
          onRetirerNouvelle={photos.retirer}
          max={MAX_PHOTOS_CONTROLE}
          desactive={enCours || controleEnregistre}
          erreur={photos.erreur}
        />

        {retour && (
          <fieldset className="ow-groupe">
            <legend>Caution</legend>
            <p className="ow-aide">Caution de cette location : {fcfa(caution)}.</p>
            <label className="ow-case">
              <input
                type="checkbox"
                checked={retenueActive}
                disabled={enCours || controleEnregistre}
                onChange={(e) => setRetenueActive(e.target.checked)}
              />
              <span>Je demande une retenue sur la caution</span>
            </label>
            {retenueActive && (
              <>
                <label className="ow-champ">
                  <span>Montant de la retenue (FCFA)</span>
                  <input
                    className="ow-input"
                    inputMode="numeric"
                    value={montant}
                    disabled={enCours || controleEnregistre}
                    onChange={(e) => setMontant(e.target.value.replace(/\D/g, ''))}
                  />
                  {erreurs.montant && <small className="ow-erreur-champ">{erreurs.montant}</small>}
                </label>
                <label className="ow-champ">
                  <span>Motif</span>
                  <textarea
                    className="ow-input"
                    rows={2}
                    value={motif}
                    disabled={enCours || controleEnregistre}
                    onChange={(e) => setMotif(e.target.value)}
                  />
                  {erreurs.motif && <small className="ow-erreur-champ">{erreurs.motif}</small>}
                </label>
                <p className="ow-aide">
                  Une retenue ouvre un litige : c’est l’équipe LOKAA qui tranche, pas toi.
                </p>
              </>
            )}
          </fieldset>
        )}

        {erreurGlobale && (
          <div className="ow-alerte ow-alerte-erreur" role="alert">
            {erreurGlobale}
          </div>
        )}

        <div className="ow-actions-bas">
          <button type="button" className="ow-btn ow-btn-contour" onClick={onClose} disabled={enCours}>
            Annuler
          </button>
          <button type="button" className="ow-btn ow-btn-principal" onClick={valideLeControle} disabled={enCours}>
            {enCours
              ? 'Enregistrement…'
              : retour
              ? 'Valider le retour'
              : 'Valider la remise'}
          </button>
        </div>
      </div>
    </div>
  );
}
