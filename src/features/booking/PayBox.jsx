import { useState } from 'react'
import { Clock, Smartphone } from 'lucide-react'
import { Button } from '../../components/ui/ui'
import { payerReservation, PAIEMENT_ACTIF } from '../../services/payment'
import { formatDecompte, formatFcfa, msRestant } from './format'
import { useNow } from './useLoad'

// Décompte des 15 minutes + bouton « Payer ». Le paiement n'est pas encore activé côté serveur.
export default function PayBox({ booking }) {
  const now = useNow(true)
  const [erreur, setErreur] = useState('')
  const reste = msRestant(booking.expires_at, now)

  async function payer() {
    setErreur('')
    try {
      await payerReservation({ bookingId: booking.id })
    } catch (e) {
      setErreur(e?.message || "Le paiement mobile n'est pas encore activé.")
    }
  }

  return (
    <div className="bk-pay">
      {reste !== null && (
        <p className="bk-countdown" role="timer" aria-live="off">
          <Clock size={18} aria-hidden="true" />
          Il te reste <strong>{formatDecompte(reste)}</strong> pour payer
        </p>
      )}
      <Button variant="gold" block disabled={!PAIEMENT_ACTIF} onClick={payer}>
        <Smartphone size={18} aria-hidden="true" /> Payer {formatFcfa(booking.total_amount)}
      </Button>
      {!PAIEMENT_ACTIF && <p className="bk-note">Paiement mobile bientôt disponible</p>}
      {erreur && <p className="msg-error" role="alert">{erreur}</p>}
    </div>
  )
}
