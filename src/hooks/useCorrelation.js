import { useMemo } from 'react'
import { pearsonCorrelation, linearRegression } from '../utils/statisticsHelpers'
import { formatDateLabel } from '../utils/dateHelpers'

export function useCorrelation(dataPoints, metricA, metricB) {
  return useMemo(() => {
    if (!dataPoints || dataPoints.length < 2 || !metricA || !metricB) {
      return { chartData: [], pearsonR: null, regressionA: null, regressionB: null }
    }

    const valid = dataPoints.filter(
      (r) => r[metricA] != null && r[metricB] != null
    )

    if (valid.length < 2) {
      return { chartData: [], pearsonR: null, regressionA: null, regressionB: null }
    }

    const xs = valid.map((_, i) => i)
    const ysA = valid.map((r) => Number(r[metricA]))
    const ysB = valid.map((r) => Number(r[metricB]))

    const pearsonR = pearsonCorrelation(ysA, ysB)
    const regressionA = linearRegression(xs, ysA)
    const regressionB = linearRegression(xs, ysB)

    const chartData = valid.map((r, i) => ({
      date: formatDateLabel(r.date),
      [metricA]: Number(r[metricA]),
      [metricB]: Number(r[metricB]),
      trendA: regressionA.slope * i + regressionA.intercept,
      trendB: regressionB.slope * i + regressionB.intercept,
    }))

    return { chartData, pearsonR, regressionA, regressionB }
  }, [dataPoints, metricA, metricB])
}
