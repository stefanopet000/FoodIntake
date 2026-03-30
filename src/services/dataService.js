import { supabase } from './supabaseClient'

export async function fetchAllData() {
  const { data, error } = await supabase
    .from('food_intake')
    .select('*')
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchByWeek(weekLabel) {
  const { data, error } = await supabase
    .from('food_intake')
    .select('*')
    .eq('week_label', weekLabel)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchDateRange(start, end) {
  const { data, error } = await supabase
    .from('food_intake')
    .select('*')
    .gte('date', start)
    .lte('date', end)
    .order('date', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchWeekLabels() {
  const { data, error } = await supabase
    .from('food_intake')
    .select('week_label, date')
    .order('date', { ascending: true })
  if (error) throw error
  // deduplicate
  const seen = new Set()
  return data
    .filter((r) => {
      if (seen.has(r.week_label)) return false
      seen.add(r.week_label)
      return true
    })
    .map((r) => r.week_label)
}

export async function upsertRows(rows) {
  const { data, error } = await supabase
    .from('food_intake')
    .upsert(rows, { onConflict: 'date', ignoreDuplicates: false })
    .select()
  if (error) throw error
  return data
}
