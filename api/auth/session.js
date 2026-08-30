import { getSession } from '../_lib/auth.js'

export default async function handler(req, res) {
  const session = await getSession(req)
  if (!session) {
    res.status(401).json({ authenticated: false })
    return
  }
  res.status(200).json({ authenticated: true, email: session.email })
}
