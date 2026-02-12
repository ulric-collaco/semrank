import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { gameAPI } from '../utils/api'

export default function GamePage() {
  const [gameState, setGameState] = useState('ready') // ready, playing, correct, wrong
  const [score, setScore] = useState(0)
  const [round, setRound] = useState(0)
  const [student1, setStudent1] = useState(null)
  const [student2, setStudent2] = useState(null)
  const [metric, setMetric] = useState('sgpa') // sgpa, attendance, or subject
  const [currentSubject, setCurrentSubject] = useState(null) // For subject mode
  const [difficulty, setDifficulty] = useState('easy')
  const [isLoading, setIsLoading] = useState(true)
  
  const student2Ref = useRef(null)

  useEffect(() => {
    if (gameState === 'ready') {
      startNewRound()
    }
  }, [])

  // Reset game when metric changes
  useEffect(() => {
    if (gameState !== 'ready') {
      resetGame()
    }
  }, [metric])

  const startNewRound = async () => {
    setIsLoading(true)
    try {
      if (metric === 'subject') {
        // For subject mode, get students with subject data
        const data = await gameAPI.getRandomPairWithSubject()
        setStudent1(data.students[0])
        setStudent2(data.students[1])
        setCurrentSubject(data.subject)
      } else {
        // For SGPA/Attendance modes
        const pair = await gameAPI.getRandomPair()
        setStudent1(pair[0])
        setStudent2(pair[1])
      }
      setGameState('playing')
    } catch (error) {
      console.error('Error fetching random pair:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuess = (guess) => {
    if (gameState !== 'playing') return

    let s1Value, s2Value
    
    if (metric === 'subject') {
      // For subject mode, compare total marks in the subject
      s1Value = student1.totalMarks || 0
      s2Value = student2.totalMarks || 0
    } else {
      s1Value = metric === 'sgpa' ? student1.sgpa : student1.attendance
      s2Value = metric === 'sgpa' ? student2.sgpa : student2.attendance  
    }

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
            Guess if the next student has higher or lower {
              metric === 'sgpa' ? 'SGPA' : 
              metric === 'attendance' ? 'attendance' :
              currentSubject ? `marks in ${currentSubject.name}` : 'subject marks'
            }
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
          <button
            onClick={() => setMetric('subject')}
            disabled={gameState === 'playing'}
            className={`px-6 py-3 rounded-bubble font-medium transition-all duration-300
              ${
                metric === 'subject'
                  ? 'bg-accent text-ink shadow-bubble-hover'
                  : 'bubble hover:scale-105'
              }
              ${gameState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Subject
          </button>
        </div>

        {/* Game Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Student 1 (Known) */}
          <div className="bubble p-8 rounded-bubble-lg shadow-bubble">
            <div className="text-center space-y-4">
              <div className="w-32 h-32 mx-auto bg-bubbleSecondary rounded-full flex items-center justify-center text-5xl overflow-hidden">
                {student1.roll_no ? (
                  <img 
                    src={`/student_faces/${student1.roll_no}.png`}
                    alt={student1.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div className={student1.roll_no ? 'hidden' : 'flex'} style={{ fontSize: '3rem' }}>
                  👤
                </div>
              </div>
              <h3 className="text-2xl font-bold text-ink">{student1.name}</h3>
              <p className="text-body">Class: {student1.class}</p>
              <div className="pt-4 border-t border-ink/10">
                <p className="text-4xl font-bold text-ink">
                  {metric === 'sgpa' 
                    ? student1.sgpa 
                    : metric === 'attendance'
                    ? `${student1.attendance}%`
                    : student1.totalMarks || 0
                  }
                </p>
                <p className="text-body text-sm">
                  {metric === 'sgpa' 
                    ? 'SGPA' 
                    : metric === 'attendance'
                    ? 'Attendance'
                    : currentSubject ? `${currentSubject.name} Marks` : 'Subject Marks'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Student 2 (Unknown until guess) */}
          <div ref={student2Ref} className="space-y-4">
            <div className="bubble p-8 rounded-bubble-lg shadow-bubble">
              <div className="text-center space-y-4">
                <div className="w-32 h-32 mx-auto bg-bubbleSecondary rounded-full flex items-center justify-center text-5xl overflow-hidden">
                  {student2.roll_no ? (
                    <img 
                      src={`/student_faces/${student2.roll_no}.png`}
                      alt={student2.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div className={student2.roll_no ? 'hidden' : 'flex'} style={{ fontSize: '3rem' }}>
                    👤
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-ink">{student2.name}</h3>
                <p className="text-body">Class: {student2.class}</p>
                <div className="pt-4 border-t border-ink/10">
                  {gameState === 'playing' ? (
                    <p className="text-4xl font-bold text-ink">?</p>
                  ) : (
                    <p className="text-4xl font-bold text-ink">
                      {metric === 'sgpa' 
                        ? student2.sgpa 
                        : metric === 'attendance'
                        ? `${student2.attendance}%`
                        : student2.totalMarks || 0
                      }
                    </p>
                  )}
                  <p className="text-body text-sm">
                    {metric === 'sgpa' 
                      ? 'SGPA' 
                      : metric === 'attendance'
                      ? 'Attendance'
                      : currentSubject ? `${currentSubject.name} Marks` : 'Subject Marks'
                    }
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
