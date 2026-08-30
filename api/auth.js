import bcrypt from 'bcryptjs'
import { createSessionCookie, clearSessionCookie, getSession } from './_lib/auth.js'

async function login(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }
  const { email, password } = req.body || {}
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH

  if (!adminEmail || !adminPasswordHash) {
    res.status(500).json({ error: 'Admin credentials are not configured on the server.' })
    return
  }
  if (
    typeof email !== 'string' ||
    typeof password !== 'string' ||
    email.trim().toLowerCase() !== adminEmail.trim().toLowerCase()
  ) {
    res.status(401).json({ error: 'Invalid email or password.' })
    return
  }
  const valid = await bcrypt.compare(password, adminPasswordHash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid email or password.' })
    return
  }
  const cookie = await createSessionCookie(adminEmail)
  res.setHeader('Set-Cookie', cookie)
  res.status(200).json({ email: adminEmail })
}

async function logout(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }
  res.setHeader('Set-Cookie', clearSessionCookie())
  res.status(200).json({ ok: true })
}

async function session(req, res) {
  const sess = await getSession(req)
  if (!sess) {
    res.status(401).json({ authenticated: false })
    return
  }
  res.status(200).json({ authenticated: true, email: sess.email })
}

export default async function handler(req, res) {
  const segments = String(req.query.match || '').split('/').filter(Boolean)
  const [action] = segments

  if (action === 'login') return login(req, res)
  if (action === 'logout') return logout(req, res)
  if (action === 'session') return session(req, res)

  res.status(404).json({ error: 'Not found.' })
}
