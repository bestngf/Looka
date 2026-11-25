import { useState } from 'react';
import { ArrowLeft, MapPin, Save, Send } from 'lucide-react';
import { useChargement } from '../hooks/useChargement';
import { usePhotosLocales } from '../hooks/usePhotosLocales';
import { messageErreur } from '../utils/errors';
import { reduireImage } from '../utils/image';
import { ETATS_MATERIEL } from '../utils/format';
import {
  enregistrerAnnonce,
  envoyerEnValidation,
  fetchAnnonce,
  remplacerPrixDegressifs,
  supprimerPhoto,
  televerserPhoto,
} from '../../../services/listings';
import { Chargement, ErreurEtat } from './Etats';
import PhotoPicker from './PhotoPicker';
import PrixDegressifs from './PrixDegressifs';

const MAX_PHOTOS = 5;

// Charge l'annonce à modifier (si besoin) puis affiche le formulaire.
export default function ListingForm({ id, categories, onClose, onSaved }) {
  const charge = useChargement(() => (id ? fetchAnnonce(id) : Promise.resolve(null)), [id]);

  if (charge.chargement) return <Chargement lignes={2} />;
  if (charge.erreur) return <ErreurEtat message={charge.erreur} onRetry={charge.reessayer} />;
  return <Corps initial={charge.donnees} categories={categories} onClose={onClose} onSaved={onSaved} />;
}

function texte(v) {
  return v === null || v === undefined ? '' : String(v);
}

function Corps({ initial, categories, onClose, onSaved }) {
  const annonce = initial ? initial.annonce : null;

  const [idCourant, setIdCourant] = useState(annonce ? annonce.id : null);
  const [medias, setMedias] = useState(initial ? initial.medias : []);
  const [regles, setRegles] = useState(
    initial
      ? initial.regles.map((r) => ({
          minimum_days: texte(r.minimum_days),
          price_per_day: texte(r.price_per_day),
        }))
      : []
  );
  const [v, setV] = useState({
    title: texte(annonce && annonce.title),
    description: texte(annonce && annonce.description),
    category_id: texte(annonce && annonce.category_id),
    item_condition: (annonce && annonce.item_condition) || 'good',
    city: texte(annonce && annonce.city),
    address_details: texte(annonce && annonce.address_details),
    latitude: annonce && annonce.latitude != null ? annonce.latitude : null,
    longitude: annonce && annonce.longitude != null ? annonce.longitude : null,
    price_per_day: texte(annonce && annonce.price_per_day),
    quantity_total: texte(annonce ? annonce.quantity_total : 1),
    deposit_amount: texte(annonce ? annonce.deposit_amount : 0),
    delivery_available: Boolean(annonce && annonce.delivery_available),
  });
  const [erreurs, setErreurs] = useState({});
  const [erreurGlobale, setErreurGlobale] = useState(null);
  const [enCours, setEnCours] = useState(false);
  const [etape, setEtape] = useState('');
  const [gps, setGps] = useState({ enCours: false, message: null });

  const photosLocales = usePhotosLocales(MAX_PHOTOS - medias.length);

  const statut = annonce ? annonce.status : null;
  const peutEnvoyer = !statut || statut === 'draft' || statut === 'rejected';

  function changer(champ, valeur) {
    setV((x) => ({ ...x, [champ]: valeur }));
  }

  function chiffres(champ) {
    return (e) => changer(champ, e.target.value.replace(/\D/g, ''));
  }

  function utiliserPosition() {
    if (!navigator.geolocation) {
      setGps({ enCours: false, message: 'Ton téléphone ne peut pas trouver ta position. Tu peux continuer sans.' });
      return;
    }
    setGps({ enCours: true, message: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setV((x) => ({
          ...x,
          latitude: Number(pos.coords.latitude.toFixed(6)),
          longitude: Number(pos.coords.longitude.toFixed(6)),
        }));
        setGps({ enCours: false, message: 'Position trouvée.' });
      },
      (err) => {
        setGps({
          enCours: false,
          message:
            err && err.code === 1
              ? 'Tu as refusé l’accès à ta position. Tu peux continuer sans.'
              : 'Position introuvable pour le moment. Tu peux continuer sans.',
        });
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  function valider(envoyer) {
    const e = {};
    if (v.title.trim().length < 3) e.title = 'Donne un titre d’au moins 3 lettres.';
    if (!v.category_id) e.category_id = 'Choisis une catégorie.';
    if (!v.city.trim()) e.city = 'Indique la ville.';
    const prix = Number(v.price_per_day);
    if (!prix || prix < 1) e.price_per_day = 'Indique un prix par jour en FCFA.';
    const quantite = Number(v.quantity_total);
    if (!quantite || quantite < 1) e.quantity_total = 'Indique au moins 1 exemplaire.';
    if (v.deposit_amount === '') e.deposit_amount = 'Indique la caution (0 si aucune).';

    const remplies = regles.filter((r) => r.minimum_days !== '' || r.price_per_day !== '');
    const jours = new Set();
    for (const r of remplies) {
      const j = Number(r.minimum_days);
      const p = Number(r.price_per_day);
      if (!j || j < 2 || !p) {
        e.regles = 'Chaque prix dégressif a besoin d’un nombre de jours (2 ou plus) et d’un prix.';
        break;
      }
      if (jours.has(j)) {
        e.regles = 'Deux prix dégressifs ont le même nombre de jours.';
        break;
      }
      jours.add(j);
      if (prix && p >= prix) {
        e.regles = 'Un prix dégressif doit être plus bas que le prix par jour de base.';
        break;
      }
    }
    if (envoyer && medias.length + photosLocales.photos.length < 1) {
      e.photos = 'Ajoute au moins une photo pour envoyer l’annonce en validation.';
    }
    return e;
  }

  async function soumettre(envoyer) {
    setErreurGlobale(null);
    const e = valider(envoyer);
    setErreurs(e);
    if (Object.keys(e).length > 0) {
      setErreurGlobale('Certains champs sont à corriger (en rouge).');
      return;
    }

    const categorie = categories.find((c) => String(c.id) === v.category_id);
    const champs = {
      title: v.title.trim(),
      description: v.description.trim() || null,
      category_id: categorie ? categorie.id : v.category_id,
      item_condition: v.item_condition,
      city: v.city.trim(),
      address_details: v.address_details.trim() || null,
      latitude: v.latitude,
      longitude: v.longitude,
      price_per_day: Number(v.price_per_day),
      quantity_total: Number(v.quantity_total),
      deposit_amount: Number(v.deposit_amount),
      delivery_available: v.delivery_available,
    };
    const reglesPropres = regles
      .filter((r) => r.minimum_days !== '' && r.price_per_day !== '')
      .map((r) => ({ minimum_days: Number(r.minimum_days), price_per_day: Number(r.price_per_day) }));

    setEnCours(true);
    try {
      setEtape('Enregistrement de l’annonce…');
      const id = await enregistrerAnnonce(idCourant, champs);
      setIdCourant(id);

      setEtape('Enregistrement des prix dégressifs…');
      await remplacerPrixDegressifs(id, reglesPropres);

      let position = medias.reduce((max, m) => Math.max(max, m.position || 0), 0) + 1;
      const aEnvoyer = photosLocales.photos;
      for (let i = 0; i < aEnvoyer.length; i += 1) {
        setEtape('Envoi de la photo ' + (i + 1) + ' sur ' + aEnvoyer.length + '…');
        const blob = await reduireImage(aEnvoyer[i].fichier);
        const media = await televerserPhoto(id, blob, position);
        position += 1;
        setMedias((m) => [...m, media]);
        photosLocales.retirer(aEnvoyer[i].id);
      }

      if (envoyer && peutEnvoyer) {
        setEtape('Envoi à l’équipe LOKAA…');
        await envoyerEnValidation(id);
        onSaved('Annonce envoyée à l’équipe LOKAA pour validation.');
      } else {
        onSaved('Annonce enregistrée.');
      }
    } catch (err) {
      setErreurGlobale(
        messageErreur(err, 'L’enregistrement a échoué. Tes informations sont gardées, tu peux réessayer.')
      );
    } finally {
      setEnCours(false);
      setEtape('');
    }
  }

  async function retirerPhotoExistante(media) {
    setErreurGlobale(null);
    try {
      await supprimerPhoto(media);
      setMedias((m) => m.filter((x) => x.id !== media.id));
    } catch (err) {
      setErreurGlobale(messageErreur(err, 'Impossible de retirer cette photo. Réessaie.'));
    }
  }

  return (
    <form
      className="ow-form"
      onSubmit={(ev) => {
        ev.preventDefault();
        soumettre(peutEnvoyer);
      }}
      noValidate
    >
      <button type="button" className="ow-retour" onClick={onClose} disabled={enCours}>
        <ArrowLeft size={18} aria-hidden="true" /> Retour aux annonces
      </button>
      <h2 className="ow-titre-section">{annonce ? 'Modifier l’annonce' : 'Nouvelle annonce'}</h2>

      {statut === 'rejected' && (
        <div className="ow-alerte" role="status">
          <strong>Annonce refusée par l’équipe.</strong>
          <span>{annonce.moderation_note || 'Corrige-la puis renvoie-la en validation.'}</span>
        </div>
      )}

      <label className="ow-champ">
        <span>Titre</span>
        <input
          className="ow-input"
          value={v.title}
          maxLength={80}
          disabled={enCours}
          onChange={(e) => changer('title', e.target.value)}
        />
        {erreurs.title && <small className="ow-erreur-champ">{erreurs.title}</small>}
      </label>

      <label className="ow-champ">
        <span>Catégorie</span>
        <select
          className="ow-input"
          value={v.category_id}
          disabled={enCours}
          onChange={(e) => changer('category_id', e.target.value)}
        >
          <option value="">Choisis une catégorie</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
        {erreurs.category_id && <small className="ow-erreur-champ">{erreurs.category_id}</small>}
      </label>

      <label className="ow-champ">
        <span>État du matériel</span>
        <select
          className="ow-input"
          value={v.item_condition}
          disabled={enCours}
          onChange={(e) => changer('item_condition', e.target.value)}
        >
          {ETATS_MATERIEL.map((s) => (
            <option key={s.valeur} value={s.valeur}>
              {s.libelle}
            </option>
          ))}
        </select>
      </label>

      <label className="ow-champ">
        <span>Description (facultatif)</span>
        <textarea
          className="ow-input"
          rows={4}
          value={v.description}
          disabled={enCours}
          onChange={(e) => changer('description', e.target.value)}
        />
      </label>

      <fieldset className="ow-groupe">
        <legend>Où se trouve le matériel ?</legend>
        <label className="ow-champ">
          <span>Ville</span>
          <input
            className="ow-input"
            value={v.city}
            disabled={enCours}
            onChange={(e) => changer('city', e.target.value)}
          />
          {erreurs.city && <small className="ow-erreur-champ">{erreurs.city}</small>}
        </label>
        <label className="ow-champ">
          <span>Précisions sur l’adresse (facultatif)</span>
          <input
            className="ow-input"
            value={v.address_details}
            placeholder="Quartier, repère connu…"
            disabled={enCours}
            onChange={(e) => changer('address_details', e.target.value)}
          />
        </label>
        <div className="ow-gps">
          <button
            type="button"
            className="ow-btn ow-btn-contour"
            onClick={utiliserPosition}
            disabled={enCours || gps.enCours}
          >
            <MapPin size={18} aria-hidden="true" />
            {gps.enCours ? 'Recherche en cours…' : 'Utiliser ma position'}
          </button>
          {v.latitude !== null && v.longitude !== null && (
            <button
              type="button"
              className="ow-lien"
              onClick={() => setV((x) => ({ ...x, latitude: null, longitude: null }))}
              disabled={enCours}
            >
              Retirer la position
            </button>
          )}
        </div>
        {v.latitude !== null && v.longitude !== null && (
          <p className="ow-aide">Position enregistrée pour cette annonce.</p>
        )}
        {gps.message && <p className="ow-aide">{gps.message}</p>}
      </fieldset>

      <fieldset className="ow-groupe">
        <legend>Prix et quantité</legend>
        <label className="ow-champ">
          <span>Prix par jour (FCFA)</span>
          <input
            className="ow-input"
            inputMode="numeric"
            value={v.price_per_day}
            disabled={enCours}
            onChange={chiffres('price_per_day')}
          />
          {erreurs.price_per_day && <small className="ow-erreur-champ">{erreurs.price_per_day}</small>}
        </label>
        <label className="ow-champ">
          <span>Nombre d’exemplaires</span>
          <input
            className="ow-input"
            inputMode="numeric"
            value={v.quantity_total}
            disabled={enCours}
            onChange={chiffres('quantity_total')}
          />
          {erreurs.quantity_total && <small className="ow-erreur-champ">{erreurs.quantity_total}</small>}
        </label>
        <label className="ow-champ">
          <span>Caution (FCFA)</span>
          <input
            className="ow-input"
            inputMode="numeric"
            value={v.deposit_amount}
            disabled={enCours}
            onChange={chiffres('deposit_amount')}
          />
          {erreurs.deposit_amount && <small className="ow-erreur-champ">{erreurs.deposit_amount}</small>}
        </label>
        <label className="ow-case">
          <input
            type="checkbox"
            checked={v.delivery_available}
            disabled={enCours}
            onChange={(e) => changer('delivery_available', e.target.checked)}
          />
          <span>Je peux faire livrer le matériel</span>
        </label>
      </fieldset>

      <fieldset className="ow-groupe">
        <legend>Prix dégressifs</legend>
        <PrixDegressifs regles={regles} onChange={setRegles} desactive={enCours} erreur={erreurs.regles} />
      </fieldset>

      <fieldset className="ow-groupe">
        <legend>Photos</legend>
        <PhotoPicker
          existantes={medias}
          onRetirerExistante={retirerPhotoExistante}
          nouvelles={photosLocales.photos}
          onAjouter={photosLocales.ajouter}
          onRetirerNouvelle={photosLocales.retirer}
          max={MAX_PHOTOS}
          desactive={enCours}
          erreur={erreurs.photos || photosLocales.erreur}
        />
      </fieldset>

      {erreurGlobale && (
        <div className="ow-alerte ow-alerte-erreur" role="alert">
          {erreurGlobale}
        </div>
      )}
      {enCours && (
        <p className="ow-aide" aria-live="polite">
          {etape}
        </p>
      )}

      <div className="ow-actions-bas">
        {peutEnvoyer ? (
          <>
            <button type="button" className="ow-btn ow-btn-contour" disabled={enCours} onClick={() => soumettre(false)}>
              <Save size={18} aria-hidden="true" /> Enregistrer le brouillon
            </button>
            <button type="button" className="ow-btn ow-btn-principal" disabled={enCours} onClick={() => soumettre(true)}>
              <Send size={18} aria-hidden="true" /> Envoyer en validation
            </button>
          </>
        ) : (
          <button type="submit" className="ow-btn ow-btn-principal" disabled={enCours}>
            <Save size={18} aria-hidden="true" /> Enregistrer
          </button>
        )}
      </div>
    </form>
  );
}
