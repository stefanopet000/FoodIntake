import { avg } from './statisticsHelpers'
import { isWeekend } from './dateHelpers'

function computeStats(allData) {
  if (!allData || allData.length === 0) return null

  const totalDays = allData.length
  const daysInDeficit = allData.filter((r) => (r.adj_deficit ?? r.raw_deficit ?? 0) > 0).length
  const avgDeficit = avg(allData.map((r) => r.adj_deficit ?? r.raw_deficit))
  const avgIntake = avg(allData.map((r) => r.total_caloric_intake))

  const totalCarbs = avg(allData.map((r) => r.carbs_g))
  const totalProtein = avg(allData.map((r) => r.proteins_g))
  const totalFats = avg(allData.map((r) => r.fats_g))
  const totalMacroG = (totalCarbs ?? 0) + (totalProtein ?? 0) + (totalFats ?? 0)
  const carbsPct = totalMacroG > 0 ? ((totalCarbs ?? 0) / totalMacroG) * 100 : 0
  const proteinPct = totalMacroG > 0 ? ((totalProtein ?? 0) / totalMacroG) * 100 : 0
  const fatsPct = totalMacroG > 0 ? ((totalFats ?? 0) / totalMacroG) * 100 : 0

  const exerciseDays = allData.filter(
    (r) => r.exercise_type && r.exercise_type.toLowerCase() !== 'rest'
  ).length
  const exerciseDaysPerWeek = totalDays >= 7 ? (exerciseDays / totalDays) * 7 : exerciseDays
  const uniqueExerciseTypes = new Set(
    allData
      .map((r) => r.exercise_type)
      .filter((e) => e && e.toLowerCase() !== 'rest')
  ).size

  const weekendRows = allData.filter((r) => isWeekend(r.day))
  const weekdayRows = allData.filter((r) => !isWeekend(r.day))
  const weekendAvgDeficit = avg(weekendRows.map((r) => r.adj_deficit ?? r.raw_deficit))
  const weekdayAvgDeficit = avg(weekdayRows.map((r) => r.adj_deficit ?? r.raw_deficit))

  const avgBMRGap = null // realistic_rounding column removed

  // Longest consecutive deficit streak
  let longestStreak = 0, currentStreak = 0
  for (const r of allData) {
    if ((r.adj_deficit ?? r.raw_deficit ?? 0) <= 0) {
      currentStreak++
      longestStreak = Math.max(longestStreak, currentStreak)
    } else {
      currentStreak = 0
    }
  }

  return {
    totalDays,
    daysInDeficit,
    avgDeficit,
    avgIntake,
    carbsPct,
    proteinPct,
    fatsPct,
    exerciseDaysPerWeek,
    uniqueExerciseTypes,
    totalExerciseDays: exerciseDays,
    weekendAvgDeficit,
    weekdayAvgDeficit,
    avgBMRGap,
    longestStreak,
    totalCarbs,
    totalProtein,
    totalFats,
  }
}

export function generateTips(allData) {
  const s = computeStats(allData)
  if (!s) return []

  const tips = []

  // R1 – Deficit Consistency
  const deficitPct = (s.daysInDeficit / s.totalDays) * 100
  if (deficitPct >= 80) {
    tips.push({
      id: 'r1-good',
      severity: 'success',
      icon: '✅',
      title: 'Strong Deficit Consistency',
      detail: `You maintained a caloric deficit on ${deficitPct.toFixed(0)}% of tracked days. Consistency is the strongest predictor of fat-loss progress.`,
    })
  } else if (deficitPct < 50) {
    tips.push({
      id: 'r1-bad',
      severity: 'danger',
      icon: '⚠️',
      title: 'Frequent Surplus Days',
      detail: `More than half your tracked days were at a caloric surplus (${(100 - deficitPct).toFixed(0)}%). Consider reducing portion sizes or increasing movement on rest days.`,
    })
  }

  // R2 – Deficit Depth
  if (s.avgDeficit != null) {
    if (s.avgDeficit < -1000) {
      tips.push({
        id: 'r2-aggressive',
        severity: 'warning',
        icon: '⚡',
        title: 'Deficit May Be Too Aggressive',
        detail: `An average deficit of ${Math.abs(s.avgDeficit).toFixed(0)} kcal/day risks muscle loss and fatigue. Target 300–750 kcal/day for sustainable fat loss.`,
      })
    } else if (s.avgDeficit >= -750 && s.avgDeficit <= -300) {
      tips.push({
        id: 'r2-optimal',
        severity: 'success',
        icon: '🎯',
        title: 'Optimal Deficit Range',
        detail: `Your average deficit of ${Math.abs(s.avgDeficit).toFixed(0)} kcal/day is in the sustainable 300–750 kcal range, supporting ~0.3–0.7 kg fat loss per week.`,
      })
    }
  }

  // R3 – Protein
  if (s.proteinPct < 20) {
    tips.push({
      id: 'r3-low-protein',
      severity: 'warning',
      icon: '🥩',
      title: 'Low Protein Ratio',
      detail: `Protein is only ${s.proteinPct.toFixed(0)}% of your macros. Aim for 25–30% to preserve lean muscle during a deficit. Target ~1.6–2 g per kg of bodyweight.`,
    })
  } else if (s.proteinPct >= 25) {
    tips.push({
      id: 'r3-good-protein',
      severity: 'success',
      icon: '💪',
      title: 'Good Protein Intake',
      detail: `Protein is ${s.proteinPct.toFixed(0)}% of your macros — good for muscle retention and satiety during your deficit.`,
    })
  }

  // R4 – Carbs
  if (s.carbsPct > 60) {
    tips.push({
      id: 'r4-high-carbs',
      severity: 'info',
      icon: '🌾',
      title: 'High Carbohydrate Intake',
      detail: `Carbs are ${s.carbsPct.toFixed(0)}% of your macros. Consider swapping some refined carbs for protein to improve satiety and body composition.`,
    })
  }

  // R5 – Fat Floor
  if (s.fatsPct < 15) {
    tips.push({
      id: 'r5-low-fat',
      severity: 'warning',
      icon: '🫒',
      title: 'Very Low Fat Intake',
      detail: `Fats are only ${s.fatsPct.toFixed(0)}% of your macros. Below ~0.5 g/kg can impair hormone production and fat-soluble vitamin absorption.`,
    })
  }

  // R6 – Exercise Frequency
  if (s.exerciseDaysPerWeek >= 4) {
    tips.push({
      id: 'r6-active',
      severity: 'success',
      icon: '🏃',
      title: 'High Exercise Frequency',
      detail: `You exercise ~${s.exerciseDaysPerWeek.toFixed(0)} days/week. Great for caloric burn — ensure adequate recovery between sessions.`,
    })
  } else if (s.exerciseDaysPerWeek <= 1) {
    tips.push({
      id: 'r6-inactive',
      severity: 'warning',
      icon: '🛋️',
      title: 'Low Exercise Frequency',
      detail: `Only ~${s.exerciseDaysPerWeek.toFixed(0)} exercise day(s) logged per week. Even 2–3 moderate sessions significantly improve deficit quality and muscle retention.`,
    })
  }

  // R7 – Exercise Variety
  if (s.uniqueExerciseTypes === 1 && s.totalExerciseDays >= 3) {
    tips.push({
      id: 'r7-variety',
      severity: 'info',
      icon: '🔄',
      title: 'Limited Exercise Variety',
      detail: `All your exercise is one type. Mixing resistance training and cardio improves body composition and prevents adaptation plateaus.`,
    })
  }

  // R8 – Weekend Surplus
  if (s.weekendAvgDeficit != null && s.weekdayAvgDeficit != null) {
    if (s.weekendAvgDeficit > 0 && s.weekdayAvgDeficit < 0) {
      tips.push({
        id: 'r8-weekend',
        severity: 'warning',
        icon: '📅',
        title: 'Weekend Surplus Pattern',
        detail: `Your weekdays show a solid deficit but weekends trend to surplus. A single weekend binge can erase 2–3 days of weekday work. Consider a planned refeed approach.`,
      })
    }
  }

  // R9 – BMR Gap
  if (s.avgBMRGap != null && s.avgBMRGap > 200) {
    tips.push({
      id: 'r9-bmr-gap',
      severity: 'info',
      icon: '🧬',
      title: 'Significant BMR Adjustment',
      detail: `Your assumption BMR is ~${s.avgBMRGap.toFixed(0)} kcal higher than your realistic estimate. Your actual expenditure may be lower than standard formulas predict — useful for calibrating targets.`,
    })
  }

  // R10 – Streak
  if (s.longestStreak >= 5) {
    tips.push({
      id: 'r10-streak',
      severity: 'success',
      icon: '🔥',
      title: `Deficit Streak: ${s.longestStreak} Days`,
      detail: `Your longest streak of consecutive deficit days is ${s.longestStreak}. Streaks build habits — keep the momentum going.`,
    })
  }

  return tips
}
