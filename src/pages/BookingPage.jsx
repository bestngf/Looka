import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, ImageOff } from 'lucide-react'
import { Button, Card, EmptyState, ErrorState, Loading } from '../components/ui/ui'
import { useAuth } from '../features/auth/AuthContext'
import BookingDetail from '../features/booking/BookingDetail'
import BookingForm from '../features/booking/BookingForm'
import { formatFcfa } from '../features/booking/format'
import { useLoad } from '../features/booking/useLoad'
import {
  createBooking, demanderLivraison, erreurFr, fetchBookingFull, fetchListingForBooking,
} from '../services/bookings'
import '../features/booking/booking.css'

export default function BookingPage() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const { user, profileStatus } = useAuth()
  const { data: listing, loading, error, reload } = useLoad(() => fetchListingForBooking(id), [id])
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState('')
  const [created, setCreated] = useState(null) // { booking, livraison: {pickup, dest} | null, livraisonErreur }
  const [relance, setRelance] = useState(false)

  if (loading) return <Loading lines={3} />
  if (error) return <ErrorState message="Impossible de charger l'annonce. Vérifie ton réseau." onRetry={reload} />
  if (!listing) {
    return (
      <EmptyState
        title="Annonce introuvable"
        text="Cette annonce n'existe pas ou n'est plus disponible."
        action={<Button to="/annonces" variant="green">Voir les annonces</Button>}
      />
    )
  }
  if (user && listing.owner_id === user.id) {
    return (
      <EmptyState
        title="C'est ton annonce"
        text="Tu ne peux pas réserver ton propre matériel."
        action={<Button to="/proprietaire" variant="green">Mon espace propriétaire</Button>}
      />
    )
  }
  if (profileStatus === 'empty') {
    return (
      <EmptyState
        title="Complète ton profil"
        text="Ajoute ton nom, ton téléphone et ta ville avant de réserver."
        action={<Button to="/profil" variant="green">Mon profil</Button>}
      />
    )
  }

  async function reserver({ debut, fin, qte, livraison, adresse }) {
    setEnvoi(true)
    setErreur('')
    try {
      const { id: bookingId, brut } = await createBooking({ listingId: listing.id, quantite: qte, debut, fin, fraisLivraison: livraison ? 1 : 0 })
      let booking = null
      try {
        booking = await fetchBookingFull(bookingId)
      } catch {
        /* on garde la réponse de la base ci-dessous */
      }
      if (!booking) booking = { id: bookingId, ...brut, start_at: brut.start_at || `${debut}T00:00:00Z`, end_at: brut.end_at || `${fin}T00:00:00Z`, _title: listing.title, _cover: listing.cover, _qty: qte }
      else booking = { ...booking, _title: booking._title === 'Location de matériel' ? listing.title : booking._title }
      const demande = livraison ? { pickup: listing.address_details || listing.city || '', dest: adresse } : null
      let livraisonErreur = ''
      if (demande) {
        try {
          await demanderLivraison({ bookingId, ...demande })
        } catch (e) {
          livraisonErreur = erreurFr(e, "La livraison n'a pas pu être demandée.")
        }
      }
      setCreated({ booking, demande, livraisonErreur })
      window.scrollTo?.(0, 0)
    } catch (e) {
      setErreur(erreurFr(e, 'La réservation a échoué. Vérifie les dates et réessaie.'))
    }
    setEnvoi(false)
  }

  async function relancerLivraison() {
    setRelance(true)
    try {
      await demanderLivraison({ bookingId: created.booking.id, ...created.demande })
      setCreated((c) => ({ ...c, livraisonErreur: '' }))
    } catch (e) {
      setCreated((c) => ({ ...c, livraisonErreur: erreurFr(e, "La livraison n'a pas pu être demandée.") }))
    }
    setRelance(false)
  }

  async function relire() {
    try {
      const b = await fetchBookingFull(created.booking.id)
      if (b) setCreated((c) => ({ ...c, booking: { ...b, _title: b._title === 'Location de matériel' ? listing.title : b._title } }))
    } catch {
      /* on garde l'affichage actuel */
    }
  }

  if (created) {
    return (
      <div className="page bk">
        <div className="bk-gold-line" />
        <p className="msg-ok"><CheckCircle2 size={18} aria-hidden="true" /> Réservation créée</p>
        <BookingDetail booking={created.booking} onChanged={relire} />
        {created.livraisonErreur && (
          <Card>
            <p className="msg-error" role="alert">{created.livraisonErreur}</p>
            <Button variant="green" onClick={relancerLivraison} disabled={relance}>{relance ? 'Envoi…' : 'Réessayer la livraison'}</Button>
          </Card>
        )}
        <Button to="/mes-reservations" variant="surface" block>Voir toutes mes réservations</Button>
      </div>
    )
  }

  return (
    <div className="page bk">
      <Link to={`/annonces/${listing.id}`} className="bk-back"><ArrowLeft size={18} aria-hidden="true" /> Retour à l'annonce</Link>
      <h1>Réserver</h1>
      <div className="bk-gold-line" />
      <Card className="bk-listing">
        {listing.cover ? <img src={listing.cover} alt="" /> : <div className="bk-ph"><ImageOff size={24} aria-hidden="true" /></div>}
        <div>
          <h2>{listing.title}</h2>
          <p>{listing.city} · {formatFcfa(listing.price_per_day)} / jour</p>
          {Number(listing.deposit_amount) > 0 && <p>Caution : {formatFcfa(listing.deposit_amount)}</p>}
        </div>
      </Card>
      <BookingForm
        listing={listing}
        initial={{ debut: sp.get('debut') || '', fin: sp.get('fin') || '', qte: sp.get('qte') || 1 }}
        envoi={envoi}
        erreur={erreur}
        onSubmit={reserver}
      />
    </div>
  )
}
