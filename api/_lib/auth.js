import { SignJWT, jwtVerify } from 'jose'

const COOKIE_NAME = 'referralflow_session'
const SESSION_DAYS = 7

function getSecret() {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET is not configured.')
  return new TextEncoder().encode(secret)
}

export async function createSessionCookie(email) {
  const token = await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret())

  const isProd = process.env.VERCEL_ENV === 'production'
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_DAYS * 24 * 60 * 60}; SameSite=Lax${isProd ? '; Secure' : ''}`
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`
}

function parseCookies(header) {
  const out = {}
  if (!header) return out
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=')
    if (idx === -1) return
    out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim())
  })
  return out
}

export async function getSession(req) {
  const cookies = parseCookies(req.headers.cookie)
  const token = cookies[COOKIE_NAME]
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}

// Wraps a handler so it 401s without a valid session cookie.
export function requireAuth(handler) {
  return async (req, res) => {
    const session = await getSession(req)
    if (!session) {
      res.status(401).json({ error: 'Not authenticated.' })
      return
    }
    return handler(req, res, session)
  }
}
