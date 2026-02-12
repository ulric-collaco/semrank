import { useState, useEffect } from 'react'
import BubbleMenu from './components/BubbleMenu'
import PixelSnow from './components/PixelSnow'
import HomePage from './pages/HomePage'
import LeaderboardPage from './pages/LeaderboardPage'
import ComparePage from './pages/ComparePage'
import GamePage from './pages/GamePage'
import StudentDetailPage from './pages/StudentDetailPage'

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

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  // Handle hash navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1) || 'home';
      setCurrentPage(hash);
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />
      case 'leaderboard':
        return <LeaderboardPage />
      case 'compare':
        return <ComparePage />
      case 'game':
        return <GamePage />
      case 'student':
        return <StudentDetailPage />
      default:
        return <HomePage />
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* PixelSnow Background */}
      <div className="fixed inset-0 z-0">
        <PixelSnow
          color="#a78bfa"
          flakeSize={0.01}
          minFlakeSize={1.25}
          pixelResolution={200}
          speed={1.25}
          density={0.35}
          direction={125}
          brightness={1.2}
          depthFade={8}
          farPlane={20}
          gamma={0.4545}
          variant="snowflake"
        />
      </div>

      {/* Bubble Menu Navigation */}
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
      />

      {/* Page Content */}
      <main className="relative z-10">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
