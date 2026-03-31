import Papa from 'papaparse'

// Columns match the CSV structure exactly — keys are CSV headers, values are DB columns
const COLUMNS = [
  'entry_id', 'date', 'meal_type', 'food_name_raw', 'food_name_normalized',
  'quantity', 'unit', 'grams_estimated', 'brand', 'preparation',
  'category_primary', 'category_secondary', 'kcal', 'protein_g', 'carbs_g',
  'fat_g', 'fiber_g', 'source_type', 'confidence', 'notes',
]

export function parseFoodDetailCSV(file) {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const errors = []
        const rows = results.data.map((raw, idx) => {
          const row = {}
          for (const col of COLUMNS) {
            const val = raw[col]
            row[col] = val === undefined || val === null || val === '' ? null : val
          }
          if (!row.entry_id) errors.push(`Row ${idx + 1}: missing entry_id`)
          if (!row.date)     errors.push(`Row ${idx + 1}: missing date`)
          if (!row.meal_type) errors.push(`Row ${idx + 1}: missing meal_type`)
          if (!row.food_name_raw) errors.push(`Row ${idx + 1}: missing food_name_raw`)
          return row
        })

        const validRows = rows.filter((r) => r.entry_id && r.date && r.meal_type && r.food_name_raw)
        resolve({ data: validRows, errors })
      },
      error: (err) => resolve({ data: [], errors: [err.message] }),
    })
  })
}
