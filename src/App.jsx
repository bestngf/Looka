import { lazy, Suspense, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './features/auth/AuthContext'
import Layout from './components/layout/Layout'
import Splash from './components/layout/Splash'
import { Loading, EmptyState } from './components/ui/ui'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotCodePage from './pages/ForgotCodePage'
import ProfilePage from './pages/ProfilePage'

// Les pages des agents 2 à 5 sont détectées automatiquement dans src/pages/.
// Si une page n'existe pas encore, un écran « bientôt disponible » s'affiche.
const modules = import.meta.glob('./pages/*.jsx')
const Soon = () => <EmptyState title="Bientôt disponible" text="Cette partie de LOKAA arrive très vite." />
const page = (name) =>
  lazy(() => {
    const load = modules[`./pages/${name}.jsx`]
    return load ? load() : Promise.resolve({ default: Soon })
  })

const HomePage = page('HomePage')
const CataloguePage = page('CataloguePage')
const ListingDetailsPage = page('ListingDetailsPage')
const BookingPage = page('BookingPage')
const CustomerDashboard = page('CustomerDashboard')
const OwnerDashboard = page('OwnerDashboard')
const TransportPage = page('TransportPage')
const TeamPage = page('TeamPage')

function RequireAuth({ children }) {
  const { session } = useAuth()
  if (session === undefined) return <Loading />
  if (!session) return <Navigate to="/connexion" replace />
  return children
}

export default function App() {
  const [splash, setSplash] = useState(true)
  return (
    <AuthProvider>
      {splash && <Splash onDone={() => setSplash(false)} />}
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/annonces" element={<CataloguePage />} />
            <Route path="/annonces/:id" element={<ListingDetailsPage />} />
            <Route path="/reserver/:id" element={<RequireAuth><BookingPage /></RequireAuth>} />
            <Route path="/mes-reservations" element={<RequireAuth><CustomerDashboard /></RequireAuth>} />
            <Route path="/proprietaire" element={<RequireAuth><OwnerDashboard /></RequireAuth>} />
            <Route path="/transport" element={<RequireAuth><TransportPage /></RequireAuth>} />
            <Route path="/equipe" element={<RequireAuth><TeamPage /></RequireAuth>} />
            <Route path="/connexion" element={<LoginPage />} />
            <Route path="/inscription" element={<RegisterPage />} />
            <Route path="/code-oublie" element={<ForgotCodePage />} />
            <Route path="/profil" element={<RequireAuth><ProfilePage /></RequireAuth>} />
            <Route path="*" element={<EmptyState title="Page introuvable" text="Cette adresse n'existe pas." />} />
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}
