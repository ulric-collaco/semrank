import { useState, useEffect, Suspense, lazy } from 'react'
import LoadingScreen from './components/LoadingScreen'

const BubbleMenu = lazy(() => import('./components/BubbleMenu'))
const PageTransition = lazy(() => import('./components/PageTransition'))
const PixelSnow = lazy(() => import('./components/PixelSnow'))
const HomePage = lazy(() => import('./pages/HomePage'))
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'))
const ComparePage = lazy(() => import('./pages/ComparePage'))
const GamePage = lazy(() => import('./pages/GamePage'))


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

function App() {
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

      <div style={contentStyle} className="relative z-0 min-h-screen transition-all duration-1000">
        <div className="fixed inset-0 z-0" style={{ pointerEvents: 'none' }}>
          {/* Only render complex snow effect on desktop to prevent mobile lag */}
          <Suspense fallback={null}>
            {typeof window !== 'undefined' && window.innerWidth > 768 && (
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
                style={{ width: '100%', height: '100vh' }}
              />
            )}
          </Suspense>
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

export default App
