import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { setToken, setCachedUser } from './logic/auth'
import { getMe } from './logic/wca'

// WCA OAuth implicit flow returns the token in the URL fragment.
// HashRouter also uses the fragment for routing — they conflict.
// Intercept and consume the token BEFORE React renders, then rewrite
// the hash to a valid route so HashRouter never sees the raw token.
const rawHash = window.location.hash
if (rawHash.includes('access_token=') && !rawHash.startsWith('#/')) {
  const params = new URLSearchParams(rawHash.slice(1))
  const token = params.get('access_token')
  const expiresIn = params.get('expires_in')
  if (token && expiresIn) {
    setToken(token, parseInt(expiresIn, 10))
    window.history.replaceState(null, '', window.location.pathname + '#/competitions')
    getMe(token).then(setCachedUser).catch(() => {})
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
