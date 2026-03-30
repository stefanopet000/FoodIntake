import { useMemo } from 'react'
import { useData } from '../context/DataContext'
import { weeklyAverages } from '../utils/chartHelpers'

export function useWeeklyStats() {
  const { allData } = useData()
  return useMemo(() => weeklyAverages(allData), [allData])
}
