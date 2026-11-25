import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button, EmptyState, ErrorState, Loading } from '../components/ui/ui'
import { useAuth } from '../features/auth/AuthContext'
import BookingCard from '../features/booking/BookingCard'
import BookingDetail from '../features/booking/BookingDetail'
import { TABS, tabOf } from '../features/booking/format'
import { useLoad } from '../features/booking/useLoad'
import { fetchMyBookings } from '../services/bookings'
import '../features/booking/booking.css'

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [sp, setSp] = useSearchParams()
  const { data, loading, error, reload } = useLoad(() => (user ? fetchMyBookings(user.id) : Promise.resolve(null)), [user?.id])
  const ouverte = sp.get('r')
  const tab = TABS.some((t) => t.id === sp.get('onglet')) ? sp.get('onglet') : 'avenir'

  const groupes = useMemo(() => {
    const g = { avenir: [], encours: [], terminees: [], annulees: [] }
    for (const b of data || []) g[tabOf(b)].push(b)
    return g
  }, [data])

  if (!user || (loading && !data)) return <Loading lines={3} />
  if (error) return <ErrorState message="Impossible de charger tes réservations. Vérifie ton réseau." onRetry={reload} />

  if (ouverte) {
    const b = (data || []).find((x) => String(x.id) === ouverte)
    const retour = () => setSp({ onglet: b ? tabOf(b) : tab })
    return (
      <div className="page bk">
        <button type="button" className="bk-back" onClick={retour}>
          <ArrowLeft size={18} aria-hidden="true" /> Mes réservations
        </button>
        {b ? (
          <BookingDetail key={b.id} booking={b} onChanged={reload} />
        ) : (
          <EmptyState title="Réservation introuvable" text="Elle n'existe pas ou n'est pas à ton nom." action={<Button variant="green" onClick={retour}>Retour</Button>} />
        )}
      </div>
    )
  }

  const liste = groupes[tab]
  return (
    <div className="page bk">
      <h1>Mes réservations</h1>
      <div className="bk-gold-line" />
      <div className="bk-tabs" role="tablist" aria-label="Filtrer mes réservations">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" className="bk-tab" aria-selected={t.id === tab} onClick={() => setSp({ onglet: t.id })}>
            {t.label} <small>({groupes[t.id].length})</small>
          </button>
        ))}
      </div>
      {liste.length === 0 ? (
        <EmptyState
          title="Rien dans cet onglet"
          text={tab === 'avenir' ? "Tu n'as pas de réservation à venir." : 'Aucune réservation ici pour le moment.'}
          action={<Button to="/annonces" variant="green">Voir les annonces</Button>}
        />
      ) : (
        <div className="bk-list">
          {liste.map((b) => (
            <BookingCard key={b.id} booking={b} onOpen={() => setSp({ r: String(b.id), onglet: tab })} />
          ))}
        </div>
      )}
    </div>
  )
}
