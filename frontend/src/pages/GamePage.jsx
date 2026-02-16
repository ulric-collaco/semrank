import React, { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { gameAPI } from '../utils/api'
import Navbar from '../components/Navbar'
import { ArrowUp, ArrowDown, Trophy, XCircle, RotateCcw, Loader2, ArrowLeft } from 'lucide-react'

export default function GamePage() {
    // --- State ---
    const [gameState, setGameState] = useState('menu') // menu, loading, playing, correct, wrong
    const [studentQueue, setStudentQueue] = useState([]) // Array of student objects
    const [currentMetric, setCurrentMetric] = useState('cgpa') // 'cgpa' or 'attendance'
    const [score, setScore] = useState(0)
    const [highScore, setHighScore] = useState(parseInt(localStorage.getItem('semrank_highscore') || '0'))

    // Game Mode State: 'all' or specific class name
    const [selectedClass, setSelectedClass] = useState('all')

    // --- Refs ---
    const p1Ref = useRef(null)
    const p2Ref = useRef(null)
    const vsRef = useRef(null)
    const containerRef = useRef(null)

    // --- Helpers ---
    const getRandomMetric = () => Math.floor(Math.random() * 2) === 0 ? 'cgpa' : 'attendance'

    // --- API & Info ---
    const fetchMoreStudents = useCallback(async (count = 3, classFilter = 'all') => {
        try {
            const newStudents = []
            for (let i = 0; i < count; i++) {
                // Fetch random pair -> flatten to single students
                // NOW PASSING CLASS FILTER
                const pair = await gameAPI.getRandomPair(classFilter)
                if (pair && pair.length === 2) {
                    newStudents.push(pair[0], pair[1])
                }
            }
            return newStudents
        } catch (e) {
            console.error("Failed to fetch students", e)
            return []
        }
    }, [])

    // --- Start Game ---
    const startGame = async (mode = 'all') => {
        setSelectedClass(mode)
        setGameState('loading')
        setScore(0)

        // Initial Fetch with selected mode
        const students = await fetchMoreStudents(3, mode)
        setStudentQueue(students)
        setCurrentMetric(getRandomMetric())
        setGameState('playing')
    }

    // --- Refill Queue ---
    useEffect(() => {
        if (gameState === 'playing' && studentQueue.length < 5) {
            fetchMoreStudents(2, selectedClass).then(newStudents => {
                setStudentQueue(prev => [...prev, ...newStudents])
            })
        }
    }, [studentQueue.length, gameState, fetchMoreStudents, selectedClass])

    // --- Gameplay ---
    const handleGuess = (guess) => {
        if (gameState !== 'playing' || studentQueue.length < 2) return

        const p1 = studentQueue[0]
        const p2 = studentQueue[1]

        const v1 = currentMetric === 'cgpa' ? (p1.cgpa || 0) : (p1.attendance || 0)
        const v2 = currentMetric === 'cgpa' ? (p2.cgpa || 0) : (p2.attendance || 0)

        // Equal is correct
        const isHigher = v2 >= v1
        const isLower = v2 <= v1
        const isCorrect = (guess === 'higher' && isHigher) || (guess === 'lower' && isLower)

        if (isCorrect) {
            handleWin()
        } else {
            handleLoss()
        }
    }

    const handleWin = () => {
        setGameState('correct')
        const newScore = score + 1
        setScore(newScore)
        if (newScore > highScore) {
            setHighScore(newScore)
            localStorage.setItem('semrank_highscore', newScore.toString())
        }

        // Win Animation: Green Flash on P2
        gsap.to(p2Ref.current, { backgroundColor: '#22c55e', duration: 0.15, yoyo: true, repeat: 1 })

        setTimeout(() => advanceRound(), 800)
    }

    const handleLoss = () => {
        setGameState('wrong')
        // Loss Animation: Red Shake on P2
        gsap.to(p2Ref.current, { x: 10, backgroundColor: '#ef4444', duration: 0.08, yoyo: true, repeat: 5 })
    }

    const advanceRound = () => {
        const isMobile = window.innerWidth <= 768
        const tl = gsap.timeline({
            onComplete: () => {
                // Shift Queue: P1 leaves, P2 becomes new P1
                setStudentQueue(prev => {
                    const next = prev.slice(1) // Remove old P1
                    return next
                })

                // Randomize Metric
                const nextMetric = getRandomMetric()
                setCurrentMetric(nextMetric)

                setGameState('playing')

                // RESET ANIMATION STATE (Instant Snap)
                gsap.set(p1Ref.current, { x: 0, y: 0, opacity: 1, clearProps: 'all' })

                // P2 enters from 'off screen'
                gsap.fromTo(p2Ref.current,
                    {
                        x: isMobile ? 0 : '100%',
                        y: isMobile ? '100%' : 0,
                        opacity: 0
                    },
                    {
                        x: 0,
                        y: 0,
                        opacity: 1,
                        duration: 0.5,
                        ease: 'power3.out',
                        clearProps: 'all'
                    }
                )

                // Subtle pop on P1 to indicate it settled?
                gsap.from(p1Ref.current, { scale: 0.98, duration: 0.2 })
            }
        })

        // Animate Out Transition
        if (isMobile) {
            // Mobile: P1 leaves Top (-100%). P2 leaves Top (-100%) to become P1.
            tl.to(p1Ref.current, { y: '-100%', opacity: 0.5, duration: 0.4 }, 0)
            tl.to(p2Ref.current, { y: '-100%', duration: 0.4, ease: 'power2.inOut' }, 0)
        } else {
            // Desktop: P1 Left, P2 Right.
            // P1 moves Left (-100%). P2 moves Left (-100%) to take P1's place.
            tl.to(p1Ref.current, { x: '-100%', opacity: 0.5, duration: 0.4 }, 0)
            tl.to(p2Ref.current, { x: '-100%', duration: 0.4, ease: 'power2.inOut' }, 0)
        }
    }

    const resetGame = async () => {
        // Keeps the same mode
        startGame(selectedClass)
    }

    const goToMenu = () => {
        setGameState('menu')
        setStudentQueue([])
        setScore(0)
    }

    // --- Render: Menu ---
    if (gameState === 'menu') {
        const secondaryModes = [
            { id: 'MECH', label: 'Mechanical' },
            { id: 'COMPS_A', label: 'COMPS A' },
            { id: 'COMPS_B', label: 'COMPS B' },
            { id: 'COMPS_C', label: 'COMPS C' },
        ]

        return (
            <div className="h-screen w-full bg-black flex flex-col items-center justify-center font-sans tracking-tight">
                <Navbar />
                <div className="flex-1 w-full max-w-4xl px-4 md:px-6 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500 pb-20">
                    <h1 className="text-4xl md:text-7xl font-black text-white uppercase text-center mb-2 tracking-tighter leading-none">
                        HIGHER <span className="text-[#00ffff]">OR</span> LOWER
                    </h1>
                    <p className="text-gray-400 text-base md:text-xl mb-8 md:mb-12 font-bold tracking-widest uppercase opacity-80">Select Context</p>

                    <div className="w-full flex flex-col gap-4 max-w-3xl">
                        {/* Primary Mode: Everyone */}
                        <button
                            onClick={() => startGame('all')}
                            className="group relative overflow-hidden bg-[#00ffff] border-4 border-[#00ffff] p-6 md:p-8 text-left transition-all hover:scale-[1.02] hover:shadow-[0px_0px_30px_rgba(0,255,255,0.4)] flex items-center justify-between"
                        >
                            <div>
                                <div className="font-black text-3xl md:text-6xl text-black uppercase tracking-tighter leading-none group-hover:drop-shadow-sm transition-all">EVERYONE</div>
                            </div>
                            <ArrowUp className="w-10 h-10 md:w-16 md:h-16 text-black rotate-45 opacity-60 group-hover:opacity-100 transition-all transform group-hover:translate-x-2 group-hover:-translate-y-2 stroke-[3]" />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                            {secondaryModes.map(mode => (
                                <button
                                    key={mode.id}
                                    onClick={() => startGame(mode.id)}
                                    className="group relative overflow-hidden bg-neutral-900 border-2 border-neutral-700 hover:border-white p-5 text-left transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_white] flex items-center justify-between"
                                >
                                    <div className="font-black text-xl md:text-2xl text-white uppercase group-hover:text-white transition-colors">{mode.label}</div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowUp className="w-5 h-5 text-white rotate-45" />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // --- Render: Loading ---
    if (gameState === 'loading' || studentQueue.length < 2) {
        return (
            <div className="h-screen w-full bg-black flex flex-col items-center justify-center text-[#00ffff] font-mono gap-4">
                <Loader2 className="w-12 h-12 animate-spin" />
                <div className="text-xl font-black uppercase tracking-widest">Constructing Arena...</div>
                <div className="text-sm font-bold text-gray-500">FILTER: {selectedClass === 'all' ? 'EVERYONE' : selectedClass}</div>
            </div>
        )
    }

    const p1 = studentQueue[0]
    const p2 = studentQueue[1]

    // Values
    const p1Value = currentMetric === 'cgpa' ? p1.cgpa : `${p1.attendance}%`
    const p2Value = currentMetric === 'cgpa' ? p2.cgpa : `${p2.attendance}%`
    const metricLabel = currentMetric === 'cgpa' ? 'SGPA' : 'ATTENDANCE'

    // P2 Background: Dark Mode (bg-neutral-950) by default
    let p2Bg = 'bg-neutral-950'
    if (gameState === 'correct') p2Bg = 'bg-green-500'
    if (gameState === 'wrong') p2Bg = 'bg-red-600'

    return (
        <div className="h-screen w-screen bg-black text-black font-sans overflow-hidden flex flex-col box-border">
            <Navbar />

            <div ref={containerRef} className="flex-1 relative flex flex-col md:flex-row overflow-hidden w-full h-full">

                {/* --- Player 1 (Top/Left - LIGHT THEME) --- */}
                <div
                    ref={p1Ref}
                    className="flex-1 bg-white relative flex flex-col items-center justify-center p-6 border-b-4 md:border-b-0 md:border-r-4 border-black z-20 w-full"
                >
                    <div className="flex flex-col items-center text-center z-10 w-full max-w-md">
                        <div className="w-24 h-24 md:w-32 md:h-32 border-4 border-black rounded-full overflow-hidden mb-4 bg-gray-200 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex-shrink-0 relative flex items-center justify-center">
                            <span className="text-4xl md:text-5xl font-black text-gray-400">{p1.name.charAt(0)}</span>
                            <img src={`/student_faces/${p1.roll_no}.png`} className="absolute inset-0 w-full h-full object-cover" onError={e => e.target.style.display = 'none'} alt="P1" />
                        </div>
                        {/* P1 Name: Full Name, wrap allowed */}
                        <h2 className="text-2xl md:text-3xl font-black uppercase leading-tight mb-2 w-full">{p1.name}</h2>
                        <div className="font-bold bg-black text-white px-3 py-1 text-sm md:text-base mb-6">{p1.class}</div>

                        <div className="flex flex-col items-center">
                            <div className="text-6xl md:text-8xl font-black tracking-tighter" style={{ WebkitTextStroke: '2px black' }}>
                                {p1Value}
                            </div>
                            <div className={`font-black opacity-80 uppercase tracking-[0.2em] text-lg md:text-2xl mt-2 drop-shadow-md`}>
                                {metricLabel}
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- VS Badge --- */}
                <div
                    ref={vsRef}
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
                    style={{ marginLeft: 0, marginTop: 0 }}
                >
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-[#ffde00] border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce">
                        <span className="font-black text-2xl md:text-3xl">VS</span>
                    </div>
                </div>

                {/* --- Player 2 (Bottom/Right - DARK THEME) --- */}
                <div
                    ref={p2Ref}
                    className={`flex-1 relative flex flex-col items-center justify-center p-6 transition-colors duration-300 z-10 w-full ${p2Bg}`}
                >
                    {/* Game Over Overlay */}
                    {gameState === 'wrong' && (
                        <div className="absolute inset-0 bg-red-600/95 z-50 flex flex-col items-center justify-center animate-in fade-in duration-200 p-4 text-center">
                            <XCircle className="w-20 h-20 text-white mb-4 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" />
                            <div className="text-4xl md:text-6xl font-black text-white uppercase mb-2 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">GAME OVER</div>

                            {/* Stats Breakdown */}
                            <div className="bg-black/20 p-4 rounded-lg border-2 border-white/50 mb-6 w-full max-w-sm backdrop-blur-sm">
                                <div className="flex justify-between items-center text-white mb-2">
                                    <span className="font-bold uppercase opacity-80 truncate mr-2 max-w-[60%] text-left">{p1.name}</span>
                                    <span className="font-mono font-black">{p1Value}</span>
                                </div>
                                <div className="w-full h-0.5 bg-white/30 my-2"></div>
                                <div className="flex justify-between items-center text-white">
                                    <span className="font-bold uppercase opacity-80 truncate mr-2 max-w-[60%] text-left">{p2.name}</span>
                                    <span className="font-mono font-black text-[#ffde00] text-xl">{p2Value}</span>
                                </div>
                                <div className="text-center font-black text-white uppercase mt-4 text-xs tracking-widest opacity-70">
                                    {metricLabel} Comparison
                                </div>
                            </div>

                            <div className="text-2xl font-bold text-white mb-6">SCORE: {score}</div>

                            <div className="flex flex-col md:flex-row gap-4 w-full justify-center">
                                <button onClick={resetGame} className="bg-white text-black border-4 border-black px-8 py-4 font-black text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer flex-1 md:flex-none">
                                    <RotateCcw size={24} /> TRY AGAIN
                                </button>
                                <button onClick={goToMenu} className="bg-black text-white border-4 border-white px-8 py-4 font-black text-xl shadow-[8px_8px_0px_0px_#ffffff] hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer flex-1 md:flex-none">
                                    <ArrowLeft size={24} /> CHANGE MODE
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col items-center text-center z-10 w-full h-full justify-center max-w-md">
                        <div className="w-24 h-24 md:w-32 md:h-32 border-4 border-white/20 rounded-full overflow-hidden mb-4 bg-neutral-800 shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] flex-shrink-0 relative flex items-center justify-center">
                            <span className="text-4xl md:text-5xl font-black text-white/20">{p2.name.charAt(0)}</span>
                            <img src={`/student_faces/${p2.roll_no}.png`} className="absolute inset-0 w-full h-full object-cover" onError={e => e.target.style.display = 'none'} alt="P2" />
                        </div>
                        {/* P2 Name: White Text, Full Name */}
                        <h2 className="text-2xl md:text-3xl font-black uppercase leading-tight mb-2 text-white w-full drop-shadow-md">{p2.name}</h2>
                        {/* P2 Class: White BG, Black Text (Inverted) */}
                        <div className="font-bold bg-white text-black px-3 py-1 text-sm md:text-base mb-8 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-transparent">{p2.class}</div>

                        {gameState === 'playing' ? (
                            <div className="flex flex-col gap-4 w-full max-w-sm px-4">
                                <button
                                    onClick={() => handleGuess('higher')}
                                    className="bg-[#00ffff] border-4 border-black p-4 md:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-2 transition-all flex items-center justify-center gap-2 group w-full"
                                >
                                    <ArrowUp className="w-6 h-6 md:w-8 md:h-8 stroke-[3] group-hover:-translate-y-1 transition-transform" />
                                    <span className="font-black text-xl md:text-2xl uppercase tracking-wider">Higher</span>
                                </button>
                                <button
                                    onClick={() => handleGuess('lower')}
                                    className="bg-[#ff69b4] border-4 border-black p-4 md:p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:shadow-none active:translate-y-2 transition-all flex items-center justify-center gap-2 group w-full"
                                >
                                    <ArrowDown className="w-6 h-6 md:w-8 md:h-8 stroke-[3] group-hover:translate-y-1 transition-transform" />
                                    <span className="font-black text-xl md:text-2xl uppercase tracking-wider">Lower</span>
                                </button>
                                <div className="text-center font-bold text-sm mt-2 opacity-60 uppercase tracking-widest hidden md:block text-white/50">
                                    Than {p1.name}'s {metricLabel}
                                </div>
                            </div>
                        ) : (
                            // Result View
                            <div className="flex flex-col items-center animate-in zoom-in spin-in-3 duration-500">
                                <div className="text-6xl md:text-8xl font-black tracking-tighter text-white drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" style={{ WebkitTextStroke: '2px black' }}>
                                    {p2Value}
                                </div>
                                <div className="font-black text-white uppercase tracking-[0.2em] text-lg md:text-2xl mt-2 drop-shadow-md">
                                    {metricLabel}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Score HUD */}
                <div className="absolute top-4 right-4 z-[60] flex flex-col items-end gap-2 pointer-events-none">
                    <div className="bg-black text-[#00ffff] border-2 border-white px-3 py-1 font-black text-xl uppercase shadow-lg transform rotate-2">
                        Streak: {score}
                    </div>
                    <div className="bg-white text-black border-2 border-black px-2 py-0.5 font-bold text-xs uppercase shadow-md -rotate-1 flex items-center gap-1">
                        <Trophy size={12} /> High: {highScore}
                    </div>
                </div>

            </div>
        </div>
    )
}
