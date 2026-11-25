import { useEffect } from 'react'
import { Calendar, Package, Truck, User } from 'lucide-react'
import { Card } from '../../components/ui/ui'
import { useAuth } from '../auth/AuthContext'
import { fetchDeliveries, fetchOwnerPublic } from '../../services/bookings'
import CancelBox from './CancelBox'
import PayBox from './PayBox'
import ReviewBox from './ReviewBox'
import StatusBadge from './StatusBadge'
import WhatsAppButton from './WhatsAppButton'
import { DELIVERY_LABELS, PAYEES, effectiveStatus, formatDate, formatFcfa, nbJours, plural } from './format'
import { useLoad, useNow } from './useLoad'

const Ligne = ({ label, value, fort }) =>
  value === null || value === undefined ? null : (
    <>
      <dt className={fort ? 'bk-strong' : ''}>{label}</dt>
      <dd className={fort ? 'bk-strong' : ''}>{value}</dd>
    </>
  )

// Récapitulatif d'une réservation : montants donnés par la base (jamais recalculés).
export default function BookingDetail({ booking, onChanged }) {
  const { user } = useAuth()
  const now = useNow(booking.status === 'pending')
  const statut = effectiveStatus(booking, now)
  const payee = PAYEES.includes(statut)
  const proprio = useLoad(() => fetchOwnerPublic(booking.owner_id), [booking.owner_id])
  const livraisons = useLoad(() => fetchDeliveries(booking.id), [booking.id, booking.status])

  // Quand le délai de 15 minutes se termine, on relit la base (elle seule décide du statut).
  useEffect(() => {
    if (booking.status === 'pending' && statut === 'expired') onChanged && onChanged()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statut])

  const jours = nbJours(booking.start_at, booking.end_at)
  const nom = proprio.data?.nom

  return (
    <Card className="bk-detail">
      <div className="bk-head">
        <div>
          <p className="bk-num">Réservation {booking.booking_number || ''}</p>
          <h2>{booking._title}</h2>
        </div>
        <StatusBadge status={statut} />
      </div>

      <ul className="bk-facts">
        <li><Calendar size={18} aria-hidden="true" /> Du {formatDate(booking.start_at)} au {formatDate(booking.end_at)}{jours ? ` (${plural(jours, 'jour', 'jours')})` : ''}</li>
        {booking._qty && <li><Package size={18} aria-hidden="true" /> {plural(booking._qty, 'article', 'articles')}</li>}
        {nom && <li><User size={18} aria-hidden="true" /> Propriétaire : {nom}</li>}
        {livraisons.data?.map((d) => (
          <li key={d.id}><Truck size={18} aria-hidden="true" /> {DELIVERY_LABELS[d.status] || 'Livraison'}</li>
        ))}
      </ul>

      <dl className="bk-amounts">
        <Ligne label="Location" value={booking.subtotal != null ? formatFcfa(booking.subtotal) : null} />
        <Ligne label="Livraison" value={booking.delivery_fee != null ? formatFcfa(booking.delivery_fee) : null} />
        <Ligne label="Caution" value={booking.deposit_total != null ? formatFcfa(booking.deposit_total) : null} />
        <Ligne label="Total" value={formatFcfa(booking.total_amount)} fort />
      </dl>

      {statut === 'pending' && <PayBox booking={booking} />}
      {statut === 'expired' && (
        <p className="bk-note" role="status">
          Le délai de 15 minutes est passé : cette réservation a expiré. Tu peux refaire une réservation depuis l'annonce.
        </p>
      )}

      {payee && (
        <div className="bk-block">
          <WhatsAppButton ownerId={booking.owner_id} numero={booking.booking_number} />
        </div>
      )}

      {statut === 'completed' && user && (
        <div className="bk-block">
          <ReviewBox booking={booking} userId={user.id} />
        </div>
      )}

      {(statut === 'pending' || statut === 'confirmed') && (
        <div className="bk-block">
          <CancelBox booking={booking} payee={statut === 'confirmed'} onDone={onChanged} />
        </div>
      )}
    </Card>
  )
}
