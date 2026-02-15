
import React, { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { gameAPI } from '../utils/api'
import Navbar4 from '../components/landing4/Navbar4'
import Footer4 from '../components/landing4/Footer4'

export default function GamePage4() {
    const [gameState, setGameState] = useState('ready') // ready, playing, correct, wrong
    const [score, setScore] = useState(0)
    const [round, setRound] = useState(0)
    const [student1, setStudent1] = useState(null)
    const [student2, setStudent2] = useState(null)
    const [metric, setMetric] = useState('cgpa') // cgpa, attendance, or subject
    const [currentSubject, setCurrentSubject] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    const student2Ref = useRef(null)

    useEffect(() => {
        if (gameState === 'ready') startNewRound()
    }, [])

    useEffect(() => {
        if (gameState !== 'ready') resetGame()
    }, [metric])

    const startNewRound = async () => {
        setIsLoading(true)
        try {
            if (metric === 'subject') {
                const data = await gameAPI.getRandomPairWithSubject()
                setStudent1(data.students[0])
                setStudent2(data.students[1])
                setCurrentSubject(data.subject)
            } else {
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
            s1Value = student1.totalMarks || 0
            s2Value = student2.totalMarks || 0
        } else {
            s1Value = metric === 'cgpa' ? student1.cgpa : student1.attendance
            s2Value = metric === 'cgpa' ? student2.cgpa : student2.attendance
        }

        const isCorrect =
            (guess === 'higher' && s2Value > s1Value) ||
            (guess === 'lower' && s2Value < s1Value)

        if (isCorrect) {
            setScore(score + 1)
            setRound(round + 1)
            setGameState('correct')

            gsap.to(student2Ref.current, {
                scale: 1.1,
                border: '8px solid #00ffff',
                duration: 0.2,
                yoyo: true,
                repeat: 1
            })

            setTimeout(() => startNewRound(), 1500)
        } else {
            setGameState('wrong')
            gsap.to(student2Ref.current, {
                rotation: 5,
                border: '8px solid #ff0000',
                duration: 0.1,
                yoyo: true,
                repeat: 5
            })
            setTimeout(() => resetGame(), 2000)
        }
    }

    const resetGame = () => {
        setScore(0)
        setRound(0)
        setGameState('ready')
        startNewRound()
    }

    if (isLoading && !student1) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center font-mono w-full max-w-full overflow-hidden">
                <div className="text-xl md:text-2xl font-black uppercase flex flex-col items-center gap-4">
                    <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-black border-t-[#00ffff] rounded-full animate-spin"></div>
                    LOADING MATCH...
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white text-black font-mono selection:bg-[#ff69b4] overflow-x-hidden w-full max-w-full">
            <Navbar4 />

            <div className="w-full max-w-5xl mx-auto px-4 py-8 md:px-6 md:py-12">
                <header className="text-center mb-8 md:mb-12">
                    <h1 className="text-4xl md:text-7xl font-black uppercase mb-4 text-[#ff69b4] drop-shadow-[2px_2px_0px_#000] md:drop-shadow-[4px_4px_0px_#000] leading-none break-words hyphens-auto">
                        HIGHER <span className="text-black">OR</span> LOWER
                    </h1>
                    <p className="font-bold text-sm md:text-xl uppercase bg-[#00ffff] inline-block border-2 border-black px-4 py-1 max-w-[90vw] truncate">
                        GUESS THE STATS • STREAK: {score}
                    </p>
                </header>

                {/* Metric Selector */}
                <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 md:mb-12">
                    {['cgpa', 'attendance', 'subject'].map(m => (
                        <button
                            key={m}
                            onClick={() => setMetric(m)}
                            disabled={gameState === 'playing' && m !== metric}
                            className={`
                        px-4 py-2 md:px-6 md:py-3 border-4 border-black font-black uppercase transition-all text-xs md:text-base
                        ${metric === m
                                    ? 'bg-black text-[#ffde00] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                    : 'bg-white hover:bg-gray-100'
                                }
                        ${gameState === 'playing' ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                        >
                            {m}
                        </button>
                    ))}
                </div>

                {/* Game Arena */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch relative">
                    {/* VS Badge */}
                    <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-20 h-20 bg-[#ffde00] border-4 border-black rounded-full items-center justify-center font-black text-2xl shadow-[4px_4px_0px_0px_#000]">
                        VS
                    </div>

                    {/* Mobile VS Badge */}
                    <div className="md:hidden flex justify-center -my-6 z-10 relative">
                        <div className="w-12 h-12 bg-[#ffde00] border-4 border-black rounded-full flex items-center justify-center font-black text-lg shadow-[2px_2px_0px_0px_#000]">
                            VS
                        </div>
                    </div>

                    {/* Left Card (Known) */}
                    {student1 && (
                        <div className="bg-white border-4 border-black p-4 md:p-8 shadow-[4px_4px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000] flex flex-col items-center text-center w-full">
                            <div className="w-24 h-24 md:w-32 md:h-32 border-4 border-black rounded-full overflow-hidden mb-4 md:mb-6 bg-gray-200">
                                <img src={`/student_faces/${student1.roll_no}.png`} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black uppercase leading-none mb-2 break-words max-w-full">{student1.name}</h2>
                            <p className="font-bold bg-black text-white px-2 mb-4 md:mb-6 text-sm max-w-full truncate">{student1.class}</p>

                            <div className="mt-auto w-full border-t-4 border-black pt-4 md:pt-6">
                                <div className="text-4xl md:text-6xl font-black">{metric === 'cgpa' ? student1.cgpa : metric === 'attendance' ? `${student1.attendance}%` : student1.totalMarks}</div>
                                <div className="font-bold uppercase tracking-widest text-[#ff69b4] text-xs md:text-base">
                                    {metric === 'cgpa' ? 'SGPA' : metric === 'attendance' ? 'ATTENDANCE' : 'MARKS'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Right Card (Unknown) */}
                    {student2 && (
                        <div ref={student2Ref} className="bg-white border-4 border-black p-4 md:p-8 shadow-[4px_4px_0px_0px_#000] md:shadow-[8px_8px_0px_0px_#000] flex flex-col items-center text-center relative border-box w-full">
                            <div className="w-24 h-24 md:w-32 md:h-32 border-4 border-black rounded-full overflow-hidden mb-4 md:mb-6 bg-gray-200">
                                <img src={`/student_faces/${student2.roll_no}.png`} className="w-full h-full object-cover" onError={e => e.target.style.display = 'none'} />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black uppercase leading-none mb-2 break-words max-w-full">{student2.name}</h2>
                            <p className="font-bold bg-black text-white px-2 mb-4 md:mb-6 text-sm max-w-full truncate">{student2.class}</p>

                            <div className="mt-auto w-full border-t-4 border-black pt-4 md:pt-6 min-h-[100px] md:min-h-[120px] flex flex-col justify-end">
                                {gameState === 'playing' ? (
                                    <div className="grid grid-cols-2 gap-2 md:gap-4 w-full">
                                        <button
                                            onClick={() => handleGuess('higher')}
                                            className="bg-[#00ffff] border-4 border-black py-3 md:py-4 font-black uppercase hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-1 transition-all text-sm md:text-base"
                                        >
                                            Higher ▲
                                        </button>
                                        <button
                                            onClick={() => handleGuess('lower')}
                                            className="bg-[#ff69b4] border-4 border-black py-3 md:py-4 font-black uppercase hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-1 transition-all text-sm md:text-base"
                                        >
                                            Lower ▼
                                        </button>
                                    </div>
                                ) : (
                                    <div className="animate-bounce">
                                        <div className="text-4xl md:text-6xl font-black">
                                            {metric === 'cgpa' ? student2.cgpa : metric === 'attendance' ? `${student2.attendance}%` : student2.totalMarks}
                                        </div>
                                        <div className="font-bold uppercase tracking-widest text-[#00ffff] text-xs md:text-base">
                                            {metric === 'cgpa' ? 'SGPA' : metric === 'attendance' ? 'ATTENDANCE' : 'MARKS'}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Overlay Feedback */}
                            {gameState === 'correct' && (
                                <div className="absolute inset-0 bg-green-500/90 flex items-center justify-center z-20 font-black text-white text-3xl md:text-5xl uppercase tracking-tighter">
                                    WIN
                                </div>
                            )}
                            {gameState === 'wrong' && (
                                <div className="absolute inset-0 bg-red-600/90 flex flex-col items-center justify-center z-20 font-black text-white uppercase tracking-tighter">
                                    <div className="text-3xl md:text-5xl">GAME OVER</div>
                                    <button onClick={resetGame} className="mt-4 bg-white text-black border-4 border-black px-6 py-2 text-lg md:text-xl hover:scale-105">RETRY</button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <Footer4 />
        </div>
    )
}
