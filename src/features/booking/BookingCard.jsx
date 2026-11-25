import { Calendar, ChevronRight, Package } from 'lucide-react'
import StatusBadge from './StatusBadge'
import { effectiveStatus, formatDateCourte, formatFcfa } from './format'

export default function BookingCard({ booking, onOpen }) {
  const statut = effectiveStatus(booking)
  return (
    <button type="button" className="bk-card" onClick={onOpen}>
      <div className="bk-card__img">
        {booking._cover ? <img src={booking._cover} alt="" loading="lazy" /> : <Package size={26} aria-hidden="true" />}
      </div>
      <div className="bk-card__body">
        <strong>{booking._title}</strong>
        <span className="bk-meta"><Calendar size={14} aria-hidden="true" /> {formatDateCourte(booking.start_at)} → {formatDateCourte(booking.end_at)}</span>
        <span className="bk-card__foot">
          <StatusBadge status={statut} />
          <span className="bk-price">{formatFcfa(booking.total_amount)}</span>
        </span>
      </div>
      <ChevronRight size={20} aria-hidden="true" />
    </button>
  )
}
