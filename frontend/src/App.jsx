
import { useState, useEffect, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoadingScreen from './components/LoadingScreen'
import Grainient from './components/Grainient'

const BubbleMenu = lazy(() => import('./components/BubbleMenu'))
const PageTransition = lazy(() => import('./components/PageTransition'))
const HomePage = lazy(() => import('./pages/HomePage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const ComparePage = lazy(() => import('./pages/ComparePage'))
const GamePage = lazy(() => import('./pages/GamePage'))

const LandingPage2 = lazy(() => import('./pages/LandingPage2'))

const LandingPage4 = lazy(() => import('./pages/LandingPage4'))
const LeaderboardPage4 = lazy(() => import('./pages/LeaderboardPage4'))
const ComparePage4 = lazy(() => import('./pages/ComparePage4'))
const GamePage4 = lazy(() => import('./pages/GamePage4'))

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

function getPageFromHash() {
  const raw = window.location.hash.slice(1) || 'home';
  return raw.split('?')[0] || 'home';
}

function MainApp() {
  const [currentPage, setCurrentPage] = useState(getPageFromHash)

  // Initialize loading state based on session - play only once per session
  const [showLoader, setShowLoader] = useState(() => {
    return !sessionStorage.getItem('semrank_loaded')
  })

  // Content remains blurred until loader finishes + delay, OR instant valid if session visited
  const [isBlurred, setIsBlurred] = useState(() => {
    return !sessionStorage.getItem('semrank_loaded')
  })

  useEffect(() => {
    const handleHashChange = () => setCurrentPage(getPageFromHash());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLoadingSequenceComplete = () => {
    // 1. Loader finished fading out visually
    setShowLoader(false)
    sessionStorage.setItem('semrank_loaded', '1')

    // 2. Start unblurring immediately
    setIsBlurred(false)
  }

  const renderPage = () => {
    let page
    switch (currentPage) {
      case 'home': page = <HomePage />; break
      case 'leaderboard': page = <LeaderboardPage />; break
      case 'compare': page = <ComparePage />; break
      case 'game': page = <GamePage />; break
      default: page = <HomePage />
    }
    return <PageTransition key={currentPage}>{page}</PageTransition>
  }

  const contentStyle = {
    filter: isBlurred ? 'blur(15px)' : 'none',
    transition: 'filter 1.5s ease-out',
    opacity: isBlurred ? 0.9 : 1,
  }

  // Prevent scroll if loader is active or content is blurred
  const containerClass = isBlurred
    ? "h-screen w-screen overflow-hidden relative overscroll-none"
    : "min-h-screen w-full relative overflow-x-hidden"

  return (
    <div className={containerClass}>
      {showLoader && (
        <LoadingScreen
          onComplete={handleLoadingSequenceComplete}
        />
      )}

      <div style={contentStyle} className="relative z-0 min-h-screen transition-all duration-1000 pointer-events-none">
        <div className="fixed inset-0 z-0 bg-black pointer-events-auto">
          <Grainient
            color1="#f582ae"
            color2="#03033f"
            color3="#56005c"
            blendSoftness={0.21}
            warpAmplitude={80}
            warpStrength={4}
            colorBalance={0.09}
            timeSpeed={1.85}
            warpSpeed={1.1}
            warpFrequency={3.7}
            grainAmount={0.1}
            grainScale={2}
            contrast={1.5}
            gamma={1}
            saturation={1}
            centerX={0}
            centerY={0}
            zoom={0.9}
          />
        </div>

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

        <main className="relative z-10 w-full">
          <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-xl text-body">Loading...</div>
            </div>
          }>
            {renderPage()}
          </Suspense>
        </main>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>

        <Routes>
          <Route path="/2" element={<LandingPage2 />} />
          <Route path="/4" element={<LandingPage4 />} />
          <Route path="/4/leaderboard" element={<LeaderboardPage4 />} />
          <Route path="/4/compare" element={<ComparePage4 />} />
          <Route path="/4/game" element={<GamePage4 />} />
          <Route path="/*" element={<MainApp />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App
