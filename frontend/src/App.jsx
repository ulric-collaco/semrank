import { useState } from 'react'
import BubbleMenu from './components/BubbleMenu'
import HomePage from './pages/HomePage'
import LeaderboardPage from './pages/LeaderboardPage'
import ComparePage from './pages/ComparePage'
import GamePage from './pages/GamePage'
import AboutPage from './pages/AboutPage'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleNavigate = (page) => {
    setCurrentPage(page)
    setIsMenuOpen(false)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />
      case 'leaderboard':
        return <LeaderboardPage />
      case 'compare':
        return <ComparePage />
      case 'game':
        return <GamePage />
      case 'about':
        return <AboutPage />
      default:
        return <HomePage onNavigate={handleNavigate} />
    }
  }

  return (
    <div className="min-h-screen relative">
      {/* Menu Toggle Button */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        className="fixed top-6 right-6 z-50 w-14 h-14 bubble bubble-hover bubble-active flex items-center justify-center"
        aria-label="Toggle menu"
      >
        <svg
          className="w-6 h-6 text-ink"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isMenuOpen ? (
            <path d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Bubble Menu */}
      <BubbleMenu
        isOpen={isMenuOpen}
        onNavigate={handleNavigate}
        currentPage={currentPage}
      />

      {/* Page Content */}
      <main className="relative z-0">
        {renderPage()}
      </main>
    </div>
  )
}

export default App
