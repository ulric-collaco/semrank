import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { gameAPI } from '../utils/api'

export default function GamePage() {
  const [gameState, setGameState] = useState('ready') // ready, playing, correct, wrong
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [student1, setStudent1] = useState(null)
  const [student2, setStudent2] = useState(null)
  const [metric, setMetric] = useState('cgpa')
  const [difficulty, setDifficulty] = useState('easy')
  const [isLoading, setIsLoading] = useState(true)
  
  const student2Ref = useRef(null)

  useEffect(() => {
    if (gameState === 'ready') {
      startNewRound()
    }
  }, [])

  const startNewRound = async () => {
    setIsLoading(true)
    try {
      const pair = await gameAPI.getRandomPair()
      setStudent1(pair[0])
      setStudent2(pair[1])
      setGameState('playing')
    } catch (error) {
      console.error('Error fetching random pair:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuess = (guess) => {
    if (gameState !== 'playing') return

    const s1Value = metric === 'cgpa' ? student1.cgpa : student1.attendance
    const s2Value = metric === 'cgpa' ? student2.cgpa : student2.attendance

    const isCorrect =
      (guess === 'higher' && s2Value > s1Value) ||
      (guess === 'lower' && s2Value < s1Value)

    if (isCorrect) {
      setScore(score + 1)
      setRound(round + 1)
      setGameState('correct')

      // Bounce animation
      gsap.to(student2Ref.current, {
        y: -20,
        duration: 0.3,
        ease: 'back.out(2)',
        yoyo: true,
        repeat: 1,
      })

      setTimeout(() => {
        startNewRound()
      }, 1500)
    } else {
      setGameState('wrong')

      // Drop animation
      gsap.to(student2Ref.current, {
        y: 10,
        opacity: 0.5,
        duration: 0.3,
        ease: 'power2.in',
      })

      setTimeout(() => {
        resetGame()
      }, 2000)
    }
  }

  const resetGame = () => {
    setScore(0)
    setRound(0)
    setGameState('ready')
    gsap.set(student2Ref.current, { y: 0, opacity: 1 })
    startNewRound()
  }

  if (isLoading || !student1 || !student2) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-body">Loading game...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-ink mb-4">🎮 Higher or Lower</h1>
          <p className="text-body text-lg mb-4">
            Guess if the next student has higher or lower {metric}
          </p>

          {/* Score */}
          <div className="flex gap-4 justify-center items-center">
            <div className="px-6 py-2 bg-bubbleSecondary rounded-bubble">
              <span className="font-bold text-ink">Score: {score}</span>
            </div>
            <div className="px-6 py-2 bubble rounded-bubble">
              <span className="font-medium text-ink">Round: {round + 1}</span>
            </div>
          </div>
        </div>

        {/* Metric Selector */}
        <div className="flex gap-3 justify-center mb-8">
          <button
            onClick={() => setMetric('cgpa')}
            disabled={gameState === 'playing'}
            className={`px-6 py-3 rounded-bubble font-medium transition-all duration-300
              ${
                metric === 'cgpa'
                  ? 'bg-accent text-ink shadow-bubble-hover'
                  : 'bubble hover:scale-105'
              }
              ${gameState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            CGPA
          </button>
          <button
            onClick={() => setMetric('attendance')}
            disabled={gameState === 'playing'}
            className={`px-6 py-3 rounded-bubble font-medium transition-all duration-300
              ${
                metric === 'attendance'
                  ? 'bg-accent text-ink shadow-bubble-hover'
                  : 'bubble hover:scale-105'
              }
              ${gameState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Attendance
          </button>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Student 1 (Known) */}
          <div className="bubble p-8 rounded-bubble-lg shadow-bubble">
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto bg-bubbleSecondary rounded-full flex items-center justify-center text-5xl">
                👤
              </div>
              <h3 className="text-2xl font-bold text-ink">{student1.name}</h3>
              <p className="text-body">Class: {student1.class}</p>
              <div className="pt-4 border-t border-ink/10">
                <p className="text-4xl font-bold text-ink">
                  {metric === 'cgpa' ? student1.cgpa : `${student1.attendance}%`}
                </p>
                <p className="text-body text-sm">
                  {metric === 'cgpa' ? 'CGPA' : 'Attendance'}
                </p>
              </div>
            </div>
          </div>

          {/* Student 2 (Unknown until guess) */}
          <div ref={student2Ref} className="space-y-4">
            <div className="bubble p-8 rounded-bubble-lg shadow-bubble">
              <div className="text-center space-y-4">
                <div className="w-32 h-32 mx-auto bg-bubbleSecondary rounded-full flex items-center justify-center text-5xl">
                  👤
                </div>
                <h3 className="text-2xl font-bold text-ink">{student2.name}</h3>
                <p className="text-body">Class: {student2.class}</p>
                <div className="pt-4 border-t border-ink/10">
                  {gameState === 'playing' ? (
                    <p className="text-4xl font-bold text-ink">?</p>
                  ) : (
                    <p className="text-4xl font-bold text-ink">
                      {metric === 'cgpa' ? student2.cgpa : `${student2.attendance}%`}
                    </p>
                  )}
                  <p className="text-body text-sm">
                    {metric === 'cgpa' ? 'CGPA' : 'Attendance'}
                  </p>
                </div>
              </div>
            </div>

            {/* Guess Buttons */}
            {gameState === 'playing' && (
              <div className="flex gap-4">
                <button
                  onClick={() => handleGuess('higher')}
                  className="flex-1 px-6 py-4 bg-accent text-ink rounded-bubble font-semibold
                           shadow-bubble hover:shadow-bubble-hover hover:scale-105
                           active:scale-95 transition-all duration-300"
                >
                  Higher ↑
                </button>
                <button
                  onClick={() => handleGuess('lower')}
                  className="flex-1 px-6 py-4 bg-accent text-ink rounded-bubble font-semibold
                           shadow-bubble hover:shadow-bubble-hover hover:scale-105
                           active:scale-95 transition-all duration-300"
                >
                  Lower ↓
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feedback */}
        {gameState === 'correct' && (
          <div className="text-center mt-8">
            <p className="text-2xl font-bold text-accent">✅ Correct!</p>
          </div>
        )}
        {gameState === 'wrong' && (
          <div className="text-center mt-8 space-y-4">
            <p className="text-2xl font-bold text-ink">❌ Wrong!</p>
            <p className="text-lg text-body">Final Score: {score}</p>
            <button
              onClick={resetGame}
              className="px-8 py-4 bg-accent text-ink rounded-bubble font-semibold
                       shadow-bubble hover:shadow-bubble-hover hover:scale-105
                       active:scale-95 transition-all duration-300"
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
