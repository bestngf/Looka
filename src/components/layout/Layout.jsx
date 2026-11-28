import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Menu, X, Home, Search, CalendarCheck, Package, Truck, ShieldCheck, User, LogIn, LogOut, Palette } from 'lucide-react'
import { useAuth } from '../../features/auth/AuthContext'
import { supabase } from '../../lib/supabase'
import './layout.css'

export default function Layout() {
  const [open, setOpen] = useState(false)
  const { session, profile, signOut } = useAuth()
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const [admin, setAdmin] = useState(false)
  useEffect(() => {
    let vivant = true
    if (!session) { setAdmin(false); return undefined }
    supabase.rpc('ngf_is_admin').then(({ data }) => vivant && setAdmin(data === true), () => vivant && setAdmin(false))
    return () => { vivant = false }
  }, [session])

  const type = profile?.account_type
  const links = [
    { to: '/', label: 'Accueil', icon: Home, end: true },
    { to: '/annonces', label: 'Trouver du matériel', icon: Search },
    ...(session ? [{ to: '/mes-reservations', label: 'Mes réservations', icon: CalendarCheck }] : []),
    ...(session && type === 'owner' ? [{ to: '/proprietaire', label: 'Espace propriétaire', icon: Package }] : []),
    ...(session && type === 'transporter' ? [{ to: '/transport', label: 'Espace transporteur', icon: Truck }] : []),
    ...(session && admin ? [{ to: '/equipe', label: 'Équipe LOKAA', icon: ShieldCheck }] : []),
    ...(session ? [{ to: '/profil', label: 'Mon profil', icon: User }] : [{ to: '/connexion', label: 'Se connecter', icon: LogIn }]),
  ]

  return (
    <>
      <header className="top">
        <div className="top-row">
          <Link to="/" className="brand">LOKAA</Link>
          <button className="icon-btn" aria-label="Ouvrir le menu" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu size={24} />
          </button>
        </div>
        <div className="kente" />
      </header>
      {open && (
        <>
          <div className="scrim" onClick={() => setOpen(false)} />
          <nav className="drawer" aria-label="Menu principal">
            <div className="drawer-head">
              <strong className="brand">LOKAA</strong>
              <button className="icon-btn" aria-label="Fermer le menu" onClick={() => setOpen(false)}><X size={24} /></button>
            </div>
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon size={22} aria-hidden="true" /> {label}
              </NavLink>
            ))}
            <button className="nav-link" onClick={() => { setOpen(false); window.NGFTheme && window.NGFTheme.open() }}>
              <Palette size={22} aria-hidden="true" /> Apparence
            </button>
            {session && (
              <button className="nav-link" onClick={async () => { await signOut(); navigate('/') }}>
                <LogOut size={22} aria-hidden="true" /> Se déconnecter
              </button>
            )}
          </nav>
        </>
      )}
      <main><Outlet /></main>
    </>
  )
}
