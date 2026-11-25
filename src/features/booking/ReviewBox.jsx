import { useState } from 'react'
import { Star } from 'lucide-react'
import { Button, Skeleton } from '../../components/ui/ui'
import { erreurFr, fetchMyReview, submitReview } from '../../services/bookings'
import { useLoad } from './useLoad'

function Stars({ value, onChange, lecture }) {
  return (
    <div className="bk-stars" role={lecture ? 'img' : 'radiogroup'} aria-label={`Note : ${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={lecture}
          className={n <= value ? 'on' : ''}
          onClick={() => onChange && onChange(n)}
          aria-label={`${n} sur 5`}
          role={lecture ? undefined : 'radio'}
          aria-checked={lecture ? undefined : n === value}
        >
          <Star size={28} fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}

export default function ReviewBox({ booking, userId }) {
  const { data: avis, loading, error, reload } = useLoad(() => fetchMyReview(booking.id, userId), [booking.id, userId])
  const [note, setNote] = useState(0)
  const [comment, setComment] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')

  async function envoyer() {
    if (!note) return setErreur('Choisis une note de 1 à 5 étoiles.')
    setEnvoi(true)
    setErreur('')
    try {
      await submitReview({ bookingId: booking.id, reviewerId: userId, revieweeId: booking.owner_id, rating: note, comment: comment.trim() })
      reload()
    } catch (e) {
      setErreur(erreurFr(e, "Ton avis n'a pas pu être envoyé. Réessaie dans un instant."))
    }
    setEnvoi(false)
  }

  if (loading) return <Skeleton height={80} />
  if (error) {
    return (
      <p className="bk-note">
        Impossible de charger ton avis. <button type="button" className="bk-link" onClick={reload}>Réessayer</button>
      </p>
    )
  }
  if (avis) {
    return (
      <div>
        <h3>Ton avis</h3>
        <Stars value={Number(avis.rating) || 0} lecture />
        {avis.comment && <p className="bk-quote">{avis.comment}</p>}
        <p className="bk-note">Merci d'avoir donné ton avis.</p>
      </div>
    )
  }
  return (
    <div>
      <h3>Comment s'est passée la location ?</h3>
      <Stars value={note} onChange={setNote} />
      <label className="field">
        <span>Ton commentaire (facultatif)</span>
        <textarea className="input bk-textarea" rows={3} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} />
      </label>
      {erreur && <p className="msg-error" role="alert">{erreur}</p>}
      <Button variant="gold" block onClick={envoyer} disabled={envoi}>{envoi ? 'Envoi…' : 'Envoyer mon avis'}</Button>
    </div>
  )
}
