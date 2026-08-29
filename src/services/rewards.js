import { supabase } from './supabaseClient'

export async function getRewardSettings() {
  const { data: userData } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('reward_settings')
    .select('*')
    .eq('owner_id', userData.user.id)
    .maybeSingle()
  if (error) throw error
  return (
    data || {
      owner_id: userData.user.id,
      reward_type: 'none',
      reward_value: null,
      trigger: 'won',
    }
  )
}

export async function saveRewardSettings(payload) {
  const { data: userData } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('reward_settings')
    .upsert({
      ...payload,
      owner_id: userData.user.id,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listRewardsForReferral(referralId) {
  const { data, error } = await supabase
    .from('referral_rewards')
    .select('*')
    .eq('referral_id', referralId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createReward(payload) {
  const { data: userData } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('referral_rewards')
    .insert({ ...payload, owner_id: userData.user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateReward(id, payload) {
  const { data, error } = await supabase
    .from('referral_rewards')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}
