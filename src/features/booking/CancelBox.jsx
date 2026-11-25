import { useState } from 'react'
import { Button, Input, Field } from '../../components/ui/ui'
import { annulerReservation, erreurFr } from '../../services/bookings'

export default function CancelBox({ booking, payee, onDone }) {
  const [ouvert, setOuvert] = useState(false)
  const [motif, setMotif] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  async function confirmer() {
    setEnvoi(true)
    setErreur('')
    try {
      await annulerReservation({ bookingId: booking.id, motif: motif.trim() })
      onDone()
    } catch (e) {
      setErreur(erreurFr(e, "Impossible d'annuler pour le moment. Réessaie dans un instant."))
      setEnvoi(false)
    }
  }

  if (!ouvert) {
    return (
      <Button variant="surface" block onClick={() => setOuvert(true)}>
        Annuler la réservation
      </Button>
    )
  }
  return (
    <div className="bk-cancel" role="group" aria-label="Annuler la réservation">
      <h3>Annuler cette réservation ?</h3>
      {payee ? (
        <p className="bk-note">
          Si tu annules au moins 2 jours avant le début, tu es remboursé en entier. Après, c'est LOKAA qui calcule ton remboursement.
        </p>
      ) : (
        <p className="bk-note">Tu n'as encore rien payé : il n'y a rien à rembourser.</p>
      )}
      <Field label="Motif (facultatif)">
        <Input value={motif} onChange={(e) => setMotif(e.target.value)} maxLength={200} placeholder="Ex. : mes dates ont changé" />
      </Field>
      {erreur && <p className="msg-error" role="alert">{erreur}</p>}
      <div className="bk-row">
        <Button variant="green" onClick={confirmer} disabled={envoi}>{envoi ? 'Annulation…' : 'Oui, annuler'}</Button>
        <Button variant="surface" onClick={() => setOuvert(false)} disabled={envoi}>Non, garder</Button>
      </div>
    </div>
  )
}
