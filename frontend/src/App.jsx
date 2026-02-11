import { useState, useEffect } from 'react'
import BubbleMenu from './components/BubbleMenu'
import HomePage from './pages/HomePage'
import LeaderboardPage from './pages/LeaderboardPage'
import ComparePage from './pages/ComparePage'
import GamePage from './pages/GamePage'
import AboutPage from './pages/AboutPage'
import StudentDetailPage from './pages/StudentDetailPage'

const menuItems = [
  {
    label: 'home',
    href: '#home',
    ariaLabel: 'Home',
    rotation: -8,
    hoverStyles: { bgColor: '#f582ae', textColor: '#ffffff' }
  },
  {
    label: 'leaderboard',
    href: '#leaderboard',
    ariaLabel: 'Leaderboard',
    rotation: 8,
    hoverStyles: { bgColor: '#001858', textColor: '#ffffff' }
  },
  {
    label: 'compare',
    href: '#compare',
    ariaLabel: 'Compare Students',
    rotation: -8,
    hoverStyles: { bgColor: '#fef6e4', textColor: '#001858' }
  },
  {
    label: 'game',
    href: '#game',
    ariaLabel: 'Higher/Lower Game',
    rotation: 8,
    hoverStyles: { bgColor: '#8bd3dd', textColor: '#001858' }
  },
  {
    label: 'about',
    href: '#about',
    ariaLabel: 'About',
    rotation: -8,
    hoverStyles: { bgColor: '#172c66', textColor: '#ffffff' }
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
      case 'about':
        return <AboutPage />
      case 'student':
        return <StudentDetailPage />
      default:
        return <HomePage />
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Bubble Menu Navigation */}
      <BubbleMenu
        logo={<span style={{ fontWeight: 700, fontSize: '1.5rem', color: '#001858' }}>SemRank</span>}
        items={menuItems}
        menuAriaLabel="Toggle navigation"
        menuBg="#fef6e4"
        menuContentColor="#001858"
        useFixedPosition={true}
        animationEase="back.out(1.5)"
        animationDuration={0.5}
        staggerDelay={0.18}
      />

      {/* Page Content */}
      <main className="relative z-0">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
