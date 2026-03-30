import Papa from 'papaparse'
import { parse, format, min, max, isValid } from 'date-fns'

const COLUMN_MAP = {
  'Date': 'date',
  'Day': 'day',
  'Total kcal': 'total_kcal',
  'Kcal movement': 'kcal_movement',
  'Assumption BMR': 'assumption_bmr',
  'Realistic rounding': 'realistic_rounding',
  'Total caloric intake': 'total_caloric_intake',
  'Carbs (g)': 'carbs_g',
  'Proteins (g)': 'proteins_g',
  'Fats (g)': 'fats_g',
  'Exercise type': 'exercise_type',
  'Deficit': 'deficit',
  'Weight (kg)': 'weight_kg',
  'Energy/Mood (1-10)': 'energy_mood',
}

function parseDate(raw) {
  if (!raw) return null
  const str = String(raw).trim()
  // Try YYYY-MM-DD
  let d = parse(str, 'yyyy-MM-dd', new Date())
  if (isValid(d)) return format(d, 'yyyy-MM-dd')
  // Try M/D/YY
  d = parse(str, 'M/d/yy', new Date())
  if (isValid(d)) return format(d, 'yyyy-MM-dd')
  // Try M/D/YYYY
  d = parse(str, 'M/d/yyyy', new Date())
  if (isValid(d)) return format(d, 'yyyy-MM-dd')
  return null
}

function computeWeekLabel(rows) {
  const dates = rows
    .map((r) => r.date)
    .filter(Boolean)
    .map((d) => new Date(d + 'T00:00:00'))
    .filter(isValid)
  if (dates.length === 0) return 'Unknown Week'
  const minDate = min(dates)
  const maxDate = max(dates)
  return `${format(minDate, 'MMM d')}-${format(maxDate, 'd, yyyy')}`
}

export function parseCSV(file) {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors = []
        const rows = results.data.map((raw, idx) => {
          const row = {}
          for (const [csvCol, dbCol] of Object.entries(COLUMN_MAP)) {
            const val = raw[csvCol]
            if (dbCol === 'date') {
              row[dbCol] = parseDate(val)
              if (!row[dbCol]) {
                errors.push(`Row ${idx + 1}: invalid date "${val}"`)
              }
            } else if (val === undefined || val === null || val === '') {
              row[dbCol] = null
            } else {
              row[dbCol] = val
            }
          }
          return row
        })

        const validRows = rows.filter((r) => r.date !== null)
        const weekLabel = computeWeekLabel(validRows)
        validRows.forEach((r) => (r.week_label = weekLabel))

        resolve({ data: validRows, errors, weekLabel })
      },
      error: (err) => {
        resolve({ data: [], errors: [err.message], weekLabel: null })
      },
    })
  })
}
