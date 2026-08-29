import { supabase } from './supabaseClient'

export async function listOpenTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, referrals(lead_name), clients(name)')
    .eq('is_done', false)
    .order('due_at', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export async function createTask(payload) {
  const { data: userData } = await supabase.auth.getUser()
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...payload, owner_id: userData.user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function completeTask(id) {
  const { error } = await supabase
    .from('tasks')
    .update({ is_done: true })
    .eq('id', id)
  if (error) throw error
}
