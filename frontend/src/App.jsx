import { useState, useEffect, Suspense, lazy } from 'react'
import LoadingScreen from './components/LoadingScreen'

const BubbleMenu = lazy(() => import('./components/BubbleMenu'))
// ... (rest imports)

function App() {
  const [currentPage, setCurrentPage] = useState(getPageFromHash)
  const [isLoading, setIsLoading] = useState(true)
  const [showLoader, setShowLoader] = useState(true)

  // Handle hash navigation
  useEffect(() => {
    const handleHashChange = () => setCurrentPage(getPageFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleReveal = () => {
    setIsLoading(false) // Triggers blur removal
  }

  const handleLoadingComplete = () => {
    setShowLoader(false) // Unmounts loader
  }

  const renderPage = () => {
    // ... switch ...
  }

  // Blur style for the main app content
  const contentStyle = {
    filter: isLoading ? 'blur(15px)' : 'none',
    transition: 'filter 1.5s ease-out',
    opacity: isLoading ? 0.8 : 1, // Slight dim too
  }

  return (
    <div className="min-h-screen relative">
      {showLoader && (
        <LoadingScreen
          onReveal={handleReveal}
          onComplete={handleLoadingComplete}
        />
      )}

      {/* Main App Content Wrapper with Blur Effect */}
      <div style={contentStyle} className="relative z-0 min-h-screen transition-all duration-1000">

        {/* ── PixelSnow Background ──────────────────── */}
        <div className="fixed inset-0 z-0" style={{ pointerEvents: 'none' }}>
          {/* ... PixelSnow ... */}
        </div>

        {/* ── Bubble Menu Navigation ────────────────── */}
        <div>
          {/* ... BubbleMenu ... */}
        </div>

        {/* ── Page Content ──────────────────────────── */}
        <main className="relative z-10">
          {/* ... Page Content ... */}
        </main>
      </div>
    </div>
  )
}
const PageTransition = lazy(() => import('./components/PageTransition'))
const PixelSnow = lazy(() => import('./components/PixelSnow'))
const HomePage = lazy(() => import('./pages/HomePage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const ComparePage = lazy(() => import('./pages/ComparePage'))
const GamePage = lazy(() => import('./pages/GamePage'))
const StudentDetailPage = lazy(() => import('./pages/StudentDetailPage'))

const menuItems = [
  {
    label: 'home',
    href: '#home',
    ariaLabel: 'Home',
    rotation: -8,
    hoverStyles: { bgColor: '#f582ae', textColor: '#0a0a0f' }
  },
  {
    label: 'leaderboard',
    href: '#leaderboard',
    ariaLabel: 'Leaderboard',
    rotation: 8,
    hoverStyles: { bgColor: '#8b5cf6', textColor: '#ffffff' }
  },
  {
    label: 'compare',
    href: '#compare',
    ariaLabel: 'Compare Students',
    rotation: -8,
    hoverStyles: { bgColor: '#3b82f6', textColor: '#ffffff' }
  },
  {
    label: 'game',
    href: '#game',
    ariaLabel: 'Higher/Lower Game',
    rotation: 8,
    hoverStyles: { bgColor: '#06b6d4', textColor: '#0a0a0f' }
  }
];

// Parse the hash once, synchronously, so the very first render picks the right page
function getPageFromHash() {
  const raw = window.location.hash.slice(1) || 'home';
  // Strip query params (?id=…) so "student?id=123" → "student"
  return raw.split('?')[0] || 'home';
}

function App() {
  const [currentPage, setCurrentPage] = useState(getPageFromHash)

  // Handle hash navigation
  useEffect(() => {
    const handleHashChange = () => setCurrentPage(getPageFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderPage = () => {
    let page
    switch (currentPage) {
      case 'home':
        page = <HomePage />
        break
      case 'leaderboard':
        page = <LeaderboardPage />
        break
      case 'compare':
        page = <ComparePage />
        break
      case 'game':
        page = <GamePage />
        break
      case 'student':
        page = <StudentDetailPage />
        break
      default:
        page = <HomePage />
    }
    return <PageTransition key={currentPage}>{page}</PageTransition>
  }

  return (
    <div className="min-h-screen relative">
      {/* ── PixelSnow Background ──────────────────── */}
      <div className="fixed inset-0 z-0" style={{ pointerEvents: 'none' }}>
        <Suspense fallback={null}>
          <PixelSnow
            color="#ffffff"
            flakeSize={0.01}
            minFlakeSize={1.25}
            pixelResolution={200}
            speed={1.25}
            density={0.3}
            direction={125}
            brightness={1}
            depthFade={8}
            farPlane={20}
            gamma={0.4545}
            variant="square"
            style={{ width: '100vw', height: '100vh' }}
          />
        </Suspense>
      </div>

      {/* ── Bubble Menu Navigation ────────────────── */}
      <div>
        <Suspense fallback={null}>
          <BubbleMenu
            logo={<span className="font-display" style={{ fontSize: '1.5rem', color: '#f582ae' }}>SemRank</span>}
            items={menuItems}
            menuAriaLabel="Toggle navigation"
            menuBg="#1a1a2e"
            menuContentColor="#f582ae"
            useFixedPosition={true}
            animationEase="back.out(1.5)"
            animationDuration={0.5}
            staggerDelay={0.18}
            currentPage={currentPage}
          />
        </Suspense>
      </div>

      {/* ── Page Content ──────────────────────────── */}
      <main className="relative z-10">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-xl text-body">Loading...</div>
          </div>
        }>
          {renderPage()}
        </Suspense>
      </main>
    </div>
  )
}

export default App
