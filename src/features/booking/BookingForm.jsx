import { useEffect, useState } from 'react'
import { Check, Minus, Plus, X } from 'lucide-react'
import { Button, Field, Input, Skeleton } from '../../components/ui/ui'
import { checkAvailability } from '../../services/bookings'
import { formatFcfa, plural } from './format'

const aujourdhui = () => new Date().toISOString().slice(0, 10)

export default function BookingForm({ listing, initial, envoi, erreur, onSubmit }) {
  const [debut, setDebut] = useState(initial.debut || '')
  const [fin, setFin] = useState(initial.fin || '')
  const max = Math.max(1, Number(listing.quantity_total) || 1)
  const [qte, setQte] = useState(Math.min(max, Math.max(1, Number(initial.qte) || 1)))
  const [livraison, setLivraison] = useState(false)
  const [adresse, setAdresse] = useState('')
  const [dispo, setDispo] = useState({ loading: false, error: '', result: null })
  const [essai, setEssai] = useState(0)

  const today = aujourdhui()
  const datesOk = debut && fin && debut >= today && fin > debut
  let aide = ''
  if (debut && debut < today) aide = "La date de début ne peut pas être dans le passé."
  else if (debut && fin && fin <= debut) aide = 'La date de fin doit être après la date de début.'

  // Vérifie la disponibilité dès que les dates sont bonnes.
  useEffect(() => {
    if (!datesOk) {
      setDispo({ loading: false, error: '', result: null })
      return undefined
    }
    let vivant = true
    setDispo({ loading: true, error: '', result: null })
    checkAvailability({ listingId: listing.id, debut, fin, quantite: qte })
      .then((result) => vivant && setDispo({ loading: false, error: '', result }))
      .catch(() => vivant && setDispo({ loading: false, error: 'Impossible de vérifier la disponibilité. Vérifie ton réseau.', result: null }))
    return () => {
      vivant = false
    }
  }, [listing.id, debut, fin, qte, datesOk, essai])

  const r = dispo.result
  const adresseOk = !livraison || adresse.trim().length >= 5
  const pret = datesOk && r && r.available && adresseOk && !envoi

  return (
    <div>
      <section className="card">
        <h2>Tes dates</h2>
        <div className="bk-dates">
          <Field label="Du">
            <Input type="date" min={today} value={debut} onChange={(e) => setDebut(e.target.value)} />
          </Field>
          <Field label="Au">
            <Input type="date" min={debut || today} value={fin} onChange={(e) => setFin(e.target.value)} />
          </Field>
        </div>
        {aide && <p className="msg-error" role="alert">{aide}</p>}
        <div className="bk-qty">
          <span>Quantité</span>
          <button type="button" onClick={() => setQte(Math.max(1, qte - 1))} disabled={qte <= 1} aria-label="Moins"><Minus size={16} /></button>
          <strong>{qte}</strong>
          <button type="button" onClick={() => setQte(Math.min(max, qte + 1))} disabled={qte >= max} aria-label="Plus"><Plus size={16} /></button>
        </div>
      </section>

      {datesOk && (
        <section className="card" aria-live="polite">
          <h2>Disponibilité</h2>
          {dispo.loading && <Skeleton height={64} />}
          {dispo.error && (
            <div role="alert">
              <p className="msg-error">{dispo.error}</p>
              <Button variant="green" onClick={() => setEssai((n) => n + 1)}>Réessayer</Button>
            </div>
          )}
          {r && r.available && (
            <div>
              <p className="msg-ok"><Check size={16} aria-hidden="true" /> Disponible sur ces dates</p>
              <dl className="bk-amounts">
                <dt>Durée</dt><dd>{plural(r.days, 'jour', 'jours')}</dd>
                <dt>Prix par jour</dt><dd>{formatFcfa(r.price_per_day)}</dd>
                <dt>Location</dt><dd>{formatFcfa(r.rental_subtotal)}</dd>
                <dt>Caution</dt><dd>{formatFcfa(r.deposit_total)}</dd>
              </dl>
              <p className="bk-note">Le total exact est confirmé par LOKAA quand tu valides la réservation.</p>
            </div>
          )}
          {r && !r.available && (
            <p className="msg-error" role="alert">
              <X size={16} aria-hidden="true" /> Pas disponible sur ces dates.
              {Number(r.quantity_available) > 0 ? ` Il reste ${plural(r.quantity_available, 'unité', 'unités')}.` : ''}
            </p>
          )}
        </section>
      )}

      {listing.delivery_available && (
        <section className="card">
          <h2>Livraison</h2>
          <label className="bk-check">
            <input type="checkbox" checked={livraison} onChange={(e) => setLivraison(e.target.checked)} />
            <span>Je veux être livré</span>
          </label>
          {livraison && (
            <>
              <Field label="Adresse de livraison" hint="Quartier, rue, repère connu. Frais de livraison : 0 FCFA pour l'instant.">
                <Input value={adresse} onChange={(e) => setAdresse(e.target.value)} maxLength={200} placeholder="Ex. : Agoè, derrière le marché" />
              </Field>
              {adresse.trim().length > 0 && adresse.trim().length < 5 && <p className="msg-error">Écris une adresse un peu plus précise.</p>}
            </>
          )}
        </section>
      )}

      {erreur && <p className="msg-error" role="alert">{erreur}</p>}
      <Button
        variant="gold"
        block
        disabled={!pret}
        onClick={() => onSubmit({ debut, fin, qte, livraison, adresse: adresse.trim() })}
      >
        {envoi ? 'Création en cours…' : 'Réserver'}
      </Button>
      <p className="bk-note">Tu auras 15 minutes pour payer après avoir réservé.</p>
    </div>
  )
}
