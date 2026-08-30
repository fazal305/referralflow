import bcrypt from 'bcryptjs'
import { createSessionCookie } from '../_lib/auth.js'

export default async function handler(req, res) {
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
