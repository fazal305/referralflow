import { sql } from './_lib/db.js'
import { requireAuth } from './_lib/auth.js'

async function getSettings(req, res) {
  const [settings] = await sql`select * from reward_settings where id = true`
  res.status(200).json(settings)
}

async function saveSettings(req, res) {
  const { reward_type, reward_value, trigger } = req.body || {}
  const [settings] = await sql`
    update reward_settings
    set reward_type = ${reward_type || 'none'}, reward_value = ${reward_value || null}, trigger = ${trigger || 'won'}, updated_at = now()
    where id = true
    returning *
  `
  res.status(200).json(settings)
}

async function createReward(req, res) {
  const { referral_id, reward_type, reward_value, trigger, status } = req.body || {}
  if (!referral_id || !reward_value) {
    res.status(400).json({ error: 'referral_id and reward_value are required.' })
    return
  }
  const [reward] = await sql`
    insert into referral_rewards (referral_id, reward_type, reward_value, trigger, status)
    values (${referral_id}, ${reward_type || 'custom'}, ${reward_value}, ${trigger || 'manual'}, ${status || 'earned'})
    returning *
  `
  await sql`
    insert into referral_events (referral_id, event_type, description)
    values (${referral_id}, 'reward_created', ${'Reward logged: ' + reward_value})
  `
  res.status(201).json(reward)
}

async function handler(req, res) {
  const segments = String(req.query.match || '').split('/').filter(Boolean)
  const [first] = segments

  if (first === 'settings') {
    if (req.method === 'GET') return getSettings(req, res)
    if (req.method === 'PUT') return saveSettings(req, res)
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  if (!first) {
    if (req.method === 'POST') return createReward(req, res)
    res.status(405).json({ error: 'Method not allowed.' })
    return
  }

  res.status(404).json({ error: 'Not found.' })
}

export default requireAuth(handler)
