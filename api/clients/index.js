import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'

async function handler(req, res) {
  if (req.method === 'GET') {
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
    return
  }

  if (req.method === 'POST') {
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
    return
  }

  res.status(405).json({ error: 'Method not allowed.' })
}

export default requireAuth(handler)
