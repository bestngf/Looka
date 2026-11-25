import { MessageCircle } from 'lucide-react'
import { fetchOwnerPhone } from '../../services/bookings'
import { whatsappLink } from './format'
import { useLoad } from './useLoad'

// Visible seulement pour une réservation payée (le parent le vérifie).
export default function WhatsAppButton({ ownerId, numero }) {
  const { data: phone, loading, error, reload } = useLoad(() => fetchOwnerPhone(ownerId), [ownerId])
  if (loading) return <p className="bk-note">Recherche du contact…</p>
  if (error) {
    return (
      <p className="bk-note">
        Contact indisponible pour le moment. <button type="button" className="bk-link" onClick={reload}>Réessayer</button>
      </p>
    )
  }
  const lien = whatsappLink(phone, `Bonjour, je vous écris au sujet de la réservation ${numero || ''} sur LOKAA.`)
  if (!lien) return <p className="bk-note">Le propriétaire n'a pas encore donné son numéro WhatsApp.</p>
  return (
    <a className="btn btn-green btn-block" href={lien} target="_blank" rel="noopener noreferrer">
      <MessageCircle size={18} aria-hidden="true" /> Écrire au propriétaire sur WhatsApp
    </a>
  )
}
