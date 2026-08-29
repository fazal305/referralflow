import { supabase } from './supabaseClient'

export async function listReferrals({ stage, search } = {}) {
  let query = supabase
    .from('referrals')
    .select(
      '*, referral_codes(code, client_id, clients(name)), referrer_client:clients!referrer_client_id(id, name)',
    )
    .order('last_activity_at', { ascending: false })

  if (stage) query = query.eq('stage', stage)
  if (search) {
    query = query.or(
      `lead_name.ilike.%${search}%,referrer_name.ilike.%${search}%`,
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getReferral(id) {
  const { data, error } = await supabase
    .from('referrals')
    .select(
      '*, referral_codes(code, client_id, clients(id, name)), referrer_client:clients!referrer_client_id(id, name), referral_events(*), referral_rewards(*)',
    )
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createReferral(payload) {
  const { data: userData } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('referrals')
    .insert({ ...payload, owner_id: userData.user.id, source: 'manual' })
    .select()
    .single()
  if (error) throw error

  await logEvent(data.id, 'submitted', 'Referral created manually')
  return data
}

export async function updateReferralStage(id, stage) {
  const { data, error } = await supabase
    .from('referrals')
    .update({ stage, last_activity_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  await logEvent(id, 'stage_changed', `Stage moved to "${stage}"`)
  return data
}

export async function updateReferral(id, payload) {
  const { data, error } = await supabase
    .from('referrals')
    .update({ ...payload, last_activity_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function logEvent(referralId, eventType, description) {
  const { data: userData } = await supabase.auth.getUser()
  const { error } = await supabase.from('referral_events').insert({
    owner_id: userData.user.id,
    referral_id: referralId,
    event_type: eventType,
    description,
  })
  if (error) throw error
}
