import { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import LoadingScreen from './components/LoadingScreen'

const BubbleMenu = lazy(() => import('./components/BubbleMenu'))
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

  // ── Cinematic intro state ──────────────────────────
  // Only play once per browser session
  const [showIntro, setShowIntro] = useState(() => {
    return !sessionStorage.getItem('semrank_intro_seen')
  })
  const [introRevealed, setIntroRevealed] = useState(!showIntro)
  const [logoVisible, setLogoVisible] = useState(!showIntro)

  // Fires at ~1.5 s — overlay is still fading but content can start appearing
  const handleReveal = useCallback(() => {
    sessionStorage.setItem('semrank_intro_seen', '1')
    setIntroRevealed(true)

    // Schedule logo reveal for the merge moment (approx 950ms after reveal)
    // Reveal is at 1.5s. Merge fade happens at 2.45s-2.65s.
    setTimeout(() => {
      setLogoVisible(true)
    }, 950)
  }, [])

  // Fires at ~2.65 s — overlay fully gone, safe to unmount
  const handleIntroDone = useCallback(() => {
    setShowIntro(false)
  }, [])

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
      {/* ── Cinematic Intro Overlay ────────────────── */}
      {showIntro && (
        <LoadingScreen
          onReveal={handleReveal}
          onComplete={handleIntroDone}
        />
      )}

      {/* ── PixelSnow Background ──────────────────── */}
      <div
        className="fixed inset-0 z-0"
        style={{
          pointerEvents: 'none',
          opacity: introRevealed ? 1 : 0,
          transition: introRevealed ? 'opacity 0.9s ease-out' : 'none',
        }}
      >
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
      <div
        style={{
          opacity: introRevealed ? 1 : 0,
          transition: introRevealed ? 'opacity 0.6s ease-out 0.25s' : 'none',
        }}
      >
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
            hideLogo={!logoVisible}
          />
        </Suspense>
      </div>

      {/* ── Page Content ──────────────────────────── */}
      <main
        className="relative z-10"
        style={{
          opacity: introRevealed ? 1 : 0,
          transform: introRevealed ? 'none' : 'translateY(30px)',
          transition: introRevealed
            ? 'opacity 0.7s ease-out 0.4s, transform 0.7s ease-out 0.4s'
            : 'none',
        }}
      >
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
