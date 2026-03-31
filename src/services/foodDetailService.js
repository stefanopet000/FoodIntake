import { supabase } from './supabaseClient'

export async function fetchFoodDetailByDate(date) {
  const { data, error } = await supabase
    .from('food_intake_detail')
    .select('*')
    .eq('date', date)
    .order('entry_id')
  if (error) throw error
  return data ?? []
}

export async function fetchFoodDetailRange(startDate, endDate) {
  const { data, error } = await supabase
    .from('food_intake_detail')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')
    .order('entry_id')
  if (error) throw error
  return data ?? []
}

export async function upsertFoodEntries(entries) {
  const { data, error } = await supabase
    .from('food_intake_detail')
    .upsert(entries, { onConflict: 'entry_id' })
    .select()
  if (error) throw error
  return data
}

// Delete all entries for a specific date + meal combination
export async function deleteMealEntries(date, mealType) {
  const { error } = await supabase
    .from('food_intake_detail')
    .delete()
    .eq('date', date)
    .eq('meal_type', mealType)
  if (error) throw error
}

export async function deleteFoodEntry(entryId) {
  const { error } = await supabase
    .from('food_intake_detail')
    .delete()
    .eq('entry_id', entryId)
  if (error) throw error
}

// Returns conflicts grouped by date+meal_type.
// A conflict is any date+meal_type combination in incoming entries
// that already has rows in the database.
export async function findMealConflicts(entries) {
  const pairs = [
    ...new Map(entries.map((e) => [`${e.date}__${e.meal_type}`, { date: e.date, meal_type: e.meal_type }])).values(),
  ]

  const conflicts = []
  for (const { date, meal_type } of pairs) {
    const { data, error } = await supabase
      .from('food_intake_detail')
      .select('*')
      .eq('date', date)
      .eq('meal_type', meal_type)
    if (error) throw error
    if (data && data.length > 0) {
      conflicts.push({
        date,
        meal_type,
        existing: data,
        incoming: entries.filter((e) => e.date === date && e.meal_type === meal_type),
      })
    }
  }
  return conflicts
}
