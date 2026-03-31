import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { fetchAllData, fetchWeekLabels } from '../services/dataService'
import { mifflinStJeor } from '../hooks/useBMR'

function readStoredBMR() {
  try {
    const stored = localStorage.getItem('fit_bmr_profile')
    if (!stored) return null
    const p = JSON.parse(stored)
    if (!p.weight || !p.height || !p.age) return null
    return mifflinStJeor({ sex: p.sex, weight: Number(p.weight), height: Number(p.height), age: Number(p.age) })
  } catch {
    return null
  }
}

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [allData, setAllData] = useState([])
  const [weekLabels, setWeekLabels] = useState([])
  const [selectedWeek, setSelectedWeek] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [data, labels] = await Promise.all([fetchAllData(), fetchWeekLabels()])
      setAllData(data)
      setWeekLabels(labels)
      if (!selectedWeek && labels.length > 0) {
        setSelectedWeek(labels[labels.length - 1])
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load()
  }, [load])

  const filteredData = selectedWeek
    ? allData.filter((r) => r.week_label === selectedWeek)
    : allData

  // Read BMR from localStorage each render so pages that call useData()
  // always get the latest value without needing a context re-render.
  const calculatedBMR = readStoredBMR()

  // Enrich each row with derived calorie fields.
  //
  // All deficit values are computed here — the CSV columns are not used.
  //
  //   raw_deficit      = total_kcal − total_caloric_intake   (Apple Watch raw, no correction)
  //
  // Apple Watch overestimates movement by ~20%. BMR stays fixed.
  // With BMR set (Mifflin-St Jeor):
  //   basic_movement   = total_kcal − kcal_movement − BMR    (raw NEAT)
  //   adj_movement     = kcal_movement × 0.8
  //   adj_neat         = basic_movement × 0.8
  //   adj_total_burned = BMR + adj_movement + adj_neat
  //                    = BMR × 0.2 + total_kcal × 0.8
  //
  // Without BMR set:
  //   adj_total_burned = total_kcal × 0.8   (flat 20% movement correction)
  //
  //   adj_deficit      = adj_total_burned − total_caloric_intake
  //
  // Expected gap (raw vs adj) = 0.2 × (kcal_movement + NEAT), i.e. 20% of
  // all movement calories. On a high-exercise day this is ~300–400 kcal — correct.
  function enrichRow(r) {
    const raw_deficit =
      r.total_kcal != null && r.total_caloric_intake != null
        ? r.total_kcal - r.total_caloric_intake
        : null

    if (calculatedBMR != null && r.total_kcal != null && r.kcal_movement != null) {
      const basic_movement   = Math.max(0, r.total_kcal - r.kcal_movement - calculatedBMR)
      const adj_movement     = Math.round(r.kcal_movement * 0.8)
      const adj_neat         = Math.round(basic_movement * 0.8)
      const adj_total_burned = calculatedBMR + adj_movement + adj_neat
      const adj_deficit      =
        r.total_caloric_intake != null ? adj_total_burned - r.total_caloric_intake : null
      return { ...r, raw_deficit, basic_movement, adj_movement, adj_neat, adj_total_burned, adj_deficit }
    }

    // No BMR set — flat 20% correction on total movement
    const adj_total_burned = r.total_kcal != null ? Math.round(r.total_kcal * 0.8) : null
    const adj_deficit =
      adj_total_burned != null && r.total_caloric_intake != null
        ? adj_total_burned - r.total_caloric_intake
        : null
    return { ...r, raw_deficit, adj_total_burned, adj_deficit }
  }

  return (
    <DataContext.Provider
      value={{
        allData: allData.map(enrichRow),
        weekLabels,
        selectedWeek,
        setSelectedWeek,
        filteredData: filteredData.map(enrichRow),
        calculatedBMR,
        isLoading,
        error,
        refetch: load,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
