import { sql } from '../../_lib/db.js'
import { requireAuth } from '../../_lib/auth.js'

function randomCode(name) {
  const slugPart = (name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'REF')
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `FAZ-${slugPart}-${random}`
}

async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  const { id } = req.query
  const [client] = await sql`select name from clients where id = ${id}`
  if (!client) {
    res.status(404).json({ error: 'Client not found.' })
    return
  }

  const [existing] = await sql`select * from referral_codes where client_id = ${id}`
  if (existing) {
    res.status(200).json(existing)
    return
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = randomCode(client.name)
    try {
      const [created] = await sql`
        insert into referral_codes (client_id, code) values (${id}, ${code}) returning *
      `
      res.status(201).json(created)
      return
    } catch (err) {
      if (!String(err.message).includes('duplicate key')) throw err
    }
  }
  res.status(500).json({ error: 'Could not generate a unique referral code, try again.' })
}

export default requireAuth(handler)
