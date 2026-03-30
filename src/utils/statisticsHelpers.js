export function pearsonCorrelation(xs, ys) {
  const n = xs.length
  if (n < 2) return null

  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n

  let num = 0, denomX = 0, denomY = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    num += dx * dy
    denomX += dx * dx
    denomY += dy * dy
  }

  const denom = Math.sqrt(denomX * denomY)
  if (denom === 0) return 0
  return num / denom
}

export function linearRegression(xs, ys) {
  const n = xs.length
  if (n < 2) return { slope: 0, intercept: 0 }

  const meanX = xs.reduce((a, b) => a + b, 0) / n
  const meanY = ys.reduce((a, b) => a + b, 0) / n

  let num = 0, denom = 0
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY)
    denom += (xs[i] - meanX) ** 2
  }

  const slope = denom === 0 ? 0 : num / denom
  const intercept = meanY - slope * meanX
  return { slope, intercept }
}

export function interpretCorrelation(r) {
  if (r == null) return { label: 'Not enough data', color: 'text-slate-400', description: '' }
  const abs = Math.abs(r)
  const direction = r > 0 ? 'positive' : 'negative'
  const dirText = r > 0
    ? 'When one metric rises, the other tends to rise too.'
    : 'When one metric rises, the other tends to fall.'

  if (abs >= 0.7) return {
    label: 'Strong correlation',
    color: 'text-emerald-400',
    description: `Strong ${direction} relationship (r = ${r.toFixed(2)}). ${dirText}`,
  }
  if (abs >= 0.4) return {
    label: 'Moderate correlation',
    color: 'text-amber-400',
    description: `Moderate ${direction} relationship (r = ${r.toFixed(2)}). ${dirText}`,
  }
  return {
    label: 'Weak / no correlation',
    color: 'text-slate-400',
    description: `Weak relationship (r = ${r.toFixed(2)}). The two metrics don't appear strongly linked.`,
  }
}

export function avg(arr) {
  const nums = arr.filter((v) => v != null && !isNaN(v))
  if (nums.length === 0) return null
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

export function sum(arr) {
  return arr.filter((v) => v != null && !isNaN(v)).reduce((a, b) => a + b, 0)
}
