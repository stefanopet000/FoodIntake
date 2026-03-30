import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { fetchAllData, fetchWeekLabels } from '../services/dataService'

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

  return (
    <DataContext.Provider
      value={{
        allData,
        weekLabels,
        selectedWeek,
        setSelectedWeek,
        filteredData,
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
