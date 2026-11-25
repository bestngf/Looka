import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Button, Field, Input } from '../components/ui/ui'
import { useAuth } from '../features/auth/AuthContext'
import { login, cleanUsername } from '../features/auth/authApi'
import '../features/auth/auth.css'

export default function LoginPage() {
  const { session } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (session) return <Navigate to="/" replace />

  async function submit(e) {
    e.preventDefault()
    setError(''); setBusy(true)
    try { await login(cleanUsername(username), code); navigate('/') }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return (
    <div className="auth-wrap">
      <h1>Se connecter</h1>
      <p className="lead">Entre ton identifiant et ton code secret.</p>
      <form onSubmit={submit}>
        <Field label="Identifiant"><Input value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" autoComplete="username" required /></Field>
        <Field label="Code secret"><Input type="password" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="current-password" required /></Field>
        {error && <p className="msg-error" role="alert">{error}</p>}
        <Button block disabled={busy}>{busy ? 'Connexion…' : 'Se connecter'}</Button>
      </form>
      <div className="auth-links">
        <Link to="/code-oublie">J'ai oublié mon code</Link>
        <Link to="/inscription">Créer un compte</Link>
      </div>
    </div>
  )
}
