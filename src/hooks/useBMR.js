import { useState, useEffect } from 'react'

const STORAGE_KEY = 'fit_bmr_profile'

export function mifflinStJeor({ sex, weight, height, age }) {
  // weight in kg, height in cm, age in years
  const base = 10 * weight + 6.25 * height - 5 * age
  return Math.round(sex === 'male' ? base + 5 : base - 161)
}

const DEFAULT_PROFILE = { sex: 'male', weight: '', height: '', age: '' }

export function useBMR() {
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : DEFAULT_PROFILE
    } catch {
      return DEFAULT_PROFILE
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
  }, [profile])

  const isComplete =
    profile.weight && profile.height && profile.age &&
    !isNaN(Number(profile.weight)) && !isNaN(Number(profile.height)) && !isNaN(Number(profile.age))

  const calculatedBMR = isComplete
    ? mifflinStJeor({
        sex: profile.sex,
        weight: Number(profile.weight),
        height: Number(profile.height),
        age: Number(profile.age),
      })
    : null

  function updateProfile(field, value) {
    setProfile((p) => ({ ...p, [field]: value }))
  }

  return { profile, updateProfile, calculatedBMR, isComplete }
}
