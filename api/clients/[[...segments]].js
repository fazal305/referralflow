import { sql, query } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'

const ALLOWED_FIELDS = [
  'name',
  'company',
  'email',
  'phone',
  'relationship_status',
  'satisfaction',
  'referral_eligible',
  'preferred_contact_method',
  'notes',
  'last_contact_at',
]

function randomCode(name) {
  const slugPart = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5) || 'REF'
  const random = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `FAZ-${slugPart}-${random}`
}

async function listClients(req, res) {
  const search = (req.query.search || '').trim()
  const clients = search
    ? await sql`
        select c.*,
          coalesce(json_agg(distinct jsonb_build_object('id', rc.id, 'code', rc.code, 'is_active', rc.is_active)) filter (where rc.id is not null), '[]') as referral_codes,
          coalesce(json_agg(distinct jsonb_build_object('id', p.id, 'name', p.name, 'status', p.status)) filter (where p.id is not null), '[]') as projects
        from clients c
        left join referral_codes rc on rc.client_id = c.id
        left join projects p on p.client_id = c.id
        where c.name ilike ${'%' + search + '%'} or c.company ilike ${'%' + search + '%'}
        group by c.id
        order by c.created_at desc
      `
    : await sql`
        select c.*,
          coalesce(json_agg(distinct jsonb_build_object('id', rc.id, 'code', rc.code, 'is_active', rc.is_active)) filter (where rc.id is not null), '[]') as referral_codes,
          coalesce(json_agg(distinct jsonb_build_object('id', p.id, 'name', p.name, 'status', p.status)) filter (where p.id is not null), '[]') as projects
        from clients c
        left join referral_codes rc on rc.client_id = c.id
        left join projects p on p.client_id = c.id
        group by c.id
        order by c.created_at desc
      `
  res.status(200).json(clients)
}

async function createClient(req, res) {
  const { name, company, email, phone, preferred_contact_method, notes } = req.body || {}
  if (!name || !name.trim()) {
    res.status(400).json({ error: 'Client name is required.' })
    return
  }
  const [client] = await sql`
    insert into clients (name, company, email, phone, preferred_contact_method, notes)
    values (${name.trim()}, ${company || null}, ${email || null}, ${phone || null}, ${preferred_contact_method || null}, ${notes || null})
    returning *
  `
  res.status(201).json(client)
}

async function getClient(req, res, id) {
  const [client] = await sql`select * from clients where id = ${id}`
  if (!client) {
    res.status(404).json({ error: 'Client not found.' })
    return
  }
  const referralCodes = await sql`select id, code, is_active from referral_codes where client_id = ${id}`
  const projects = await sql`select * from projects where client_id = ${id} order by created_at desc`
  const referrals = await sql`
    select id, lead_name, stage, potential_value, actual_value, created_at
    from referrals where referrer_client_id = ${id}
    order by created_at desc
  `
  res.status(200).json({ ...client, referral_codes: referralCodes, projects, referrals })
}

async function updateClient(req, res, id) {
  const updates = Object.entries(req.body || {}).filter(([key]) => ALLOWED_FIELDS.includes(key))
  if (updates.length === 0) {
    res.status(400).json({ error: 'No valid fields to update.' })
    return
  }
  const setClauses = updates.map(([key], i) => `${key} = $${i + 2}`).join(', ')
  const values = updates.map(([, value]) => value)
  const rows = await query(
    `update clients set ${setClauses}, updated_at = now() where id = $1 returning *`,
    [id, ...values],
  )
  if (!rows[0]) {
    res.status(404).json({ error: 'Client not found.' })
    return
  }
  res.status(200).json(rows[0])
}

async function deleteClient(req, res, id) {
  await sql`delete from clients where id = ${id}`
  res.status(204).end()
}

async function ensureReferralCode(req, res, id) {
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

async function handler(req, res) {
  const segments = [].concat(req.query.segments || [])
  const [id, action] = segments

  if (!id) {
    if (req.method === 'GET') return listClients(req, res)
    if (req.method === 'POST') return createClient(req, res)
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  if (id && action === 'referral-code') {
    if (req.method === 'POST') return ensureReferralCode(req, res, id)
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  if (id && !action) {
    if (req.method === 'GET') return getClient(req, res, id)
    if (req.method === 'PATCH') return updateClient(req, res, id)
    if (req.method === 'DELETE') return deleteClient(req, res, id)
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  res.status(404).json({ error: 'Not found.' })
}

export default requireAuth(handler)
