import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { DataProvider } from './context/DataContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import CaloricIntake from './pages/CaloricIntake'
import CaloriesBurned from './pages/CaloriesBurned'
import BMR from './pages/BMR'
import Macros from './pages/Macros'
import Exercise from './pages/Exercise'
import DeficitSurplus from './pages/DeficitSurplus'
import Correlation from './pages/Correlation'
import Analysis from './pages/Analysis'
import AIAnalysis from './pages/AIAnalysis'
import Upload from './pages/Upload'
import FoodLog from './pages/FoodLog'

export default function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="intake" element={<CaloricIntake />} />
            <Route path="burned" element={<CaloriesBurned />} />
            <Route path="bmr" element={<BMR />} />
            <Route path="macros" element={<Macros />} />
            <Route path="exercise" element={<Exercise />} />
            <Route path="deficit" element={<DeficitSurplus />} />
            <Route path="correlation" element={<Correlation />} />
            <Route path="analysis" element={<Analysis />} />
            <Route path="ai-analysis" element={<AIAnalysis />} />
            <Route path="upload" element={<Upload />} />
            <Route path="food-log" element={<FoodLog />} />
          </Route>
        </Routes>
      </DataProvider>
    </BrowserRouter>
  )
}
