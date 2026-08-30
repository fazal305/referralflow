import { sql } from '../_lib/db.js'
import { requireAuth } from '../_lib/auth.js'

async function handler(req, res) {
  if (req.method === 'GET') {
    const { stage, search } = req.query
    const rows = await sql`
      select r.*,
        rc.code as referral_code, rc.client_id as referral_code_client_id,
        rcc.name as referral_code_client_name,
        refc.id as referrer_client_id_check, refc.name as referrer_client_name
      from referrals r
      left join referral_codes rc on rc.id = r.referral_code_id
      left join clients rcc on rcc.id = rc.client_id
      left join clients refc on refc.id = r.referrer_client_id
      where (${stage || null}::text is null or r.stage = ${stage || null})
        and (
          ${search || null}::text is null
          or r.lead_name ilike ${'%' + (search || '') + '%'}
          or r.referrer_name ilike ${'%' + (search || '') + '%'}
        )
      order by r.last_activity_at desc
    `
    const referrals = rows.map((r) => ({
      ...r,
      referral_codes: r.referral_code
        ? { code: r.referral_code, client_id: r.referral_code_client_id, clients: { name: r.referral_code_client_name } }
        : null,
      referrer_client: r.referrer_client_id_check
        ? { id: r.referrer_client_id_check, name: r.referrer_client_name }
        : null,
    }))
    res.status(200).json(referrals)
    return
  }

  if (req.method === 'POST') {
    const { referrer_client_id, lead_name, lead_email, lead_phone, lead_need, potential_value, notes } =
      req.body || {}
    if (!lead_name || !lead_name.trim()) {
      res.status(400).json({ error: 'Lead name is required.' })
      return
    }
    const [referral] = await sql`
      insert into referrals (referrer_client_id, lead_name, lead_email, lead_phone, lead_need, potential_value, notes, source)
      values (${referrer_client_id || null}, ${lead_name.trim()}, ${lead_email || null}, ${lead_phone || null}, ${lead_need || null}, ${potential_value || null}, ${notes || null}, 'manual')
      returning *
    `
    await sql`
      insert into referral_events (referral_id, event_type, description)
      values (${referral.id}, 'submitted', 'Referral created manually')
    `
    res.status(201).json(referral)
    return
  }

  res.status(405).json({ error: 'Method not allowed.' })
}

export default requireAuth(handler)
