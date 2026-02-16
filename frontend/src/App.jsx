import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
// const HomePage = lazy(() => import('./pages/HomePage')) // Unused?
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const ComparePage = lazy(() => import('./pages/ComparePage'))
const GamePage = lazy(() => import('./pages/GamePage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const ClassStatsPage = lazy(() => import('./pages/ClassStatsPage'))

const LandingPage2 = lazy(() => import('./pages/LandingPage2'))



function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>

        <Routes>
          {/* V4 Pages as Default Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/classes" element={<ClassStatsPage />} />

          {/* Legacy V4 Routes (for backward compatibility during dev) */}
          <Route path="/4" element={<LandingPage />} />
          <Route path="/4/leaderboard" element={<LeaderboardPage />} />
          <Route path="/4/compare" element={<ComparePage />} />
          <Route path="/4/game" element={<GamePage />} />

          {/* Legacy V2 Route */}
          <Route path="/2" element={<LandingPage2 />} />

          {/* Fallback to Home */}
          <Route path="/*" element={<LandingPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App
