import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Field, Input } from '../components/ui/ui'
import { forgotCode, cleanUsername } from '../features/auth/authApi'
import '../features/auth/auth.css'

export default function ForgotCodePage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError(''); setBusy(true)
    try { await forgotCode(cleanUsername(username), email.trim()); setDone(true) }
    catch (err) { setError(err.message) }
    finally { setBusy(false) }
  }
  return (
    <div className="auth-wrap">
      <h1>Code oublié</h1>
      {done ? (
        <p className="msg-ok" role="status">Demande envoyée. Regarde ta boîte e-mail.</p>
      ) : (
        <>
          <p className="lead">Entre ton identifiant et l'e-mail de secours donné à l'inscription.</p>
          <form onSubmit={submit}>
            <Field label="Identifiant"><Input value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" required /></Field>
            <Field label="E-mail de secours"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></Field>
            {error && <p className="msg-error" role="alert">{error}</p>}
            <Button block disabled={busy}>{busy ? 'Envoi…' : 'Envoyer la demande'}</Button>
          </form>
        </>
      )}
      <div className="auth-links"><Link to="/connexion">Retour à la connexion</Link></div>
    </div>
  )
}
