import React, { useState, useEffect, useRef, useCallback } from 'react'
import { gameAPI } from '../utils/api'
import Navbar from '../components/Navbar'
import { ArrowUp, ArrowDown, Trophy, XCircle, RotateCcw, Loader2, ArrowLeft } from 'lucide-react'
import { formatClassName } from '../utils/format'
import OptimizedImage from '../components/common/OptimizedImage'
import { motion, LayoutGroup } from 'framer-motion'
import { CLASSES } from '../utils/constants'

// Animation variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
}

export default function GamePage() {
    // --- State ---
    const [gameState, setGameState] = useState('menu'); // menu, loading, playing, wrong
    const [studentQueue, setStudentQueue] = useState([]); // Array of student objects
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [selectedClass, setSelectedClass] = useState('all');
    const [currentMetric, setCurrentMetric] = useState('cgpa'); // cgpa, attendance
    const [loadingMore, setLoadingMore] = useState(false);
    const [recentRolls, setRecentRolls] = useState([]); // Track history to prevent immediate repeats

    // --- Effects ---
    useEffect(() => {
        const stored = localStorage.getItem('semrank_highscore');
        if (stored) setHighScore(parseInt(stored));
    }, []);

    useEffect(() => {
        if (score > highScore) {
            setHighScore(score);
            localStorage.setItem('semrank_highscore', score.toString());
        }
    }, [score, highScore]);

    // Keep queue populated
    useEffect(() => {
        if (gameState === 'playing' && studentQueue.length < 5 && !loadingMore) {
            fetchMoreStudents();
        }
    }, [studentQueue.length, gameState, loadingMore]);

    const addToHistory = (rollNo) => {
        setRecentRolls(prev => {
            const newHistory = [...prev, rollNo];
            if (newHistory.length > 50) newHistory.shift(); // Keep last 50
            return newHistory;
        });
    }

    // --- Logic ---
    const fetchMoreStudents = useCallback(async () => {
        setLoadingMore(true);
        try {
            let attempts = 0;
            let foundNew = false;

            // We need to add strictly 1 person to the end of the queue to maintain the chain.
            // But gameAPI.getRandomPair returns 2.
            while (attempts < 5 && !foundNew) {
                const pair = await gameAPI.getRandomPair(selectedClass);

                if (pair && pair.length === 2) {
                    // Check candidates against current queue AND recent history
                    const validCandidates = pair.filter(p => {
                        const inQueue = studentQueue.some(q => q.roll_no === p.roll_no);
                        const inHistory = recentRolls.includes(p.roll_no);
                        return !inQueue && !inHistory;
                    });

                    if (validCandidates.length > 0) {
                        // We found at least one valid new person.
                        // Add them to the queue and history.
                        const nextStudent = validCandidates[0];

                        setStudentQueue(prev => {
                            // Double check inside setter to be safe against async race conditions
                            if (prev.some(q => q.roll_no === nextStudent.roll_no)) return prev;
                            return [...prev, nextStudent];
                        });
                        addToHistory(nextStudent.roll_no);
                        foundNew = true;
                    }
                }
                attempts++;
            }

            if (!foundNew) {
                console.warn("Could not find new unique student after attempts");
                // Fallback: If we really can't find one (e.g. small class size), just take one from a fresh pair 
                // but at least ensure it's not the IMMEDIATE last person.
                const fallbackPair = await gameAPI.getRandomPair(selectedClass);
                if (fallbackPair && fallbackPair.length > 0) {
                    const lastStudent = studentQueue[studentQueue.length - 1];
                    const fallbackBuilder = fallbackPair.filter(p => !lastStudent || p.roll_no !== lastStudent.roll_no);
                    if (fallbackBuilder.length > 0) {
                        setStudentQueue(prev => [...prev, fallbackBuilder[0]]);
                    }
                }
            }

        } catch (e) {
            console.error("Bg Fetch Error", e);
        } finally {
            setLoadingMore(false);
        }
    }, [selectedClass, studentQueue, recentRolls]);


    const startGame = async (context) => {  // Added async keyword
        setSelectedClass(context);
        const metrics = ['cgpa', 'attendance'];
        setCurrentMetric(metrics[Math.floor(Math.random() * metrics.length)]);
        setScore(0);
        setGameState('loading');
        setRecentRolls([]);

        try {
            // Initial fetch needs 2 people to start a chain.
            // We define Initial History immediately to block them from showing up in the next fetch.
            const pair = await gameAPI.getRandomPair(context); // Changed 'mode' to 'context'
            if (pair && pair.length === 2) {
                const p1 = pair[0];
                const p2 = pair[1];

                let initialQueue = [p1, p2];
                let initialHistory = [p1.roll_no, p2.roll_no];

                // Set initial state
                setStudentQueue(initialQueue);
                setRecentRolls(initialHistory);
                setGameState('playing');

                // Immediately trigger background fetch to build up buffer to 3-5
                // The useEffect will catch "queue < 5" and call fetchMoreStudents automatically.
            } else {
                throw new Error("Failed to init");
            }
        } catch (e) {
            console.error(e);
            alert("Failed to start game. Try again.");
            setGameState('menu');
        }
    };

    const handleGuess = (guess) => {
        if (gameState !== 'playing' || studentQueue.length < 2) return;

        const p1 = studentQueue[0];
        const p2 = studentQueue[1];

        const v1 = currentMetric === 'cgpa' ? p1.cgpa : p1.attendance;
        const v2 = currentMetric === 'cgpa' ? p2.cgpa : p2.attendance;

        let isCorrect = false;
        if (guess === 'higher') isCorrect = v2 >= v1;
        if (guess === 'lower') isCorrect = v2 <= v1;

        if (isCorrect) {
            // Visual Reveal Phase ONLY for correct answers
            setGameState('revealing');

            setTimeout(() => {
                setScore(s => s + 1);
                setStudentQueue(prev => prev.slice(1));

                // Randomize metric for next round
                const metrics = ['cgpa', 'attendance'];
                setCurrentMetric(metrics[Math.floor(Math.random() * metrics.length)]);

                setGameState('playing');
            }, 700);
        } else {
            // Immediate Game Over for wrong answers
            setGameState('wrong');
        }
    };

    const resetGame = () => {
        startGame(selectedClass);
    };

    const goToMenu = () => {
        setGameState('menu');
        setStudentQueue([]);
        setScore(0);
    };

    // --- RENDER HELPERS ---
    const p1 = studentQueue[0];
    const p2 = studentQueue[1];
    const metricLabel = currentMetric === 'cgpa' ? 'SGPA' : 'ATTENDANCE';

    // --- MENU ---
    if (gameState === 'menu') {
        const secondaryModes = CLASSES.map(c => ({ id: c.id, label: c.label }));

        return (
            <div className="h-screen w-full bg-white flex flex-col items-center justify-center font-sans tracking-tight text-black overflow-hidden relative">
                <Navbar />
                <motion.div
                    initial="hidden" animate="visible" variants={containerVariants}
                    className="flex-1 w-full max-w-4xl px-4 md:px-6 flex flex-col items-center justify-center pb-4 pt-16 md:pt-0"
                >
                    <motion.h1 className="text-4xl md:text-7xl font-black text-black uppercase text-center mb-8 md:mb-16 tracking-tighter leading-none z-10">
                        HIGHER <span className="text-[#ffde00] px-2 bg-black">OR</span> LOWER
                    </motion.h1>

                    <div className="w-full grid grid-cols-2 gap-3 max-w-3xl z-10 overflow-y-auto flex-1 md:flex-none p-4 scrollbar-hide pb-10 overflow-x-hidden content-start">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => startGame('all')}
                            className="col-span-2 bg-[#ffde00] border-4 border-black py-6 px-6 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between shrink-0 group hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                        >
                            <div className="font-black text-2xl md:text-5xl text-black uppercase tracking-tighter leading-none">EVERYONE</div>
                            <ArrowUp className="w-8 h-8 md:w-12 md:h-12 text-black rotate-45 stroke-[3] group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                        </motion.button>

                        {secondaryModes.map(mode => (
                            <motion.button
                                key={mode.id}
                                whileHover={{ y: -4 }}
                                onClick={() => startGame(mode.id)}
                                className="bg-white border-4 border-black py-4 px-4 text-left shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between col-span-1 group hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                                <div className="font-black text-lg md:text-xl text-black uppercase leading-tight">{mode.label}</div>
                                <ArrowUp className="w-5 h-5 md:w-6 md:h-6 text-black rotate-45 stroke-[3] group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        ))}
                    </div>
                </motion.div>
            </div>
        )
    }

    if (gameState === 'loading' || !p1 || !p2) {
        return (
            <div className="h-screen w-full bg-white flex flex-col items-center justify-center text-black font-mono gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-black" />
                <div className="text-xl font-black uppercase tracking-widest">Constructing Arena...</div>
            </div>
        )
    }

    const p1Value = currentMetric === 'cgpa' ? p1.cgpa : p1.attendance;
    const p2Value = currentMetric === 'cgpa' ? p2.cgpa : p2.attendance;

    // --- MAIN GAME ---
    return (
        <div className="fixed inset-0 w-full h-full bg-white text-black font-sans overflow-hidden flex flex-col">
            <Navbar />

            {/* Match Container */}
            <div className="flex-1 w-full max-w-6xl mx-auto flex flex-col md:flex-row items-stretch justify-center p-1 md:p-4 gap-1 md:gap-8 overflow-hidden relative">
                <LayoutGroup>

                    {/* STREAK BAR (Mobile: Top Strip, Desktop: Floating) */}
                    <div className="w-full flex justify-end md:absolute md:top-4 md:right-4 md:w-auto md:z-[60] mb-1 md:mb-0 pointer-events-none">
                        <div className="bg-[#ffde00] text-black border-2 border-black px-2 py-0.5 md:px-3 md:py-1 font-black text-sm md:text-xl uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transform md:rotate-2">
                            Streak: {score}
                        </div>
                    </div>

                    {/* PLAYER 1 CARD */}
                    <motion.div
                        layout
                        key={p1.roll_no}
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 120, damping: 20, mass: 1.5 }}
                        className="relative flex-1 w-full md:w-1/2 bg-white border-2 md:border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col min-h-0"
                    >
                        {/* Image Section - Scale to fit */}
                        <div className="relative flex-1 bg-gray-100 border-b-2 md:border-b-4 border-black overflow-hidden flex items-end justify-center min-h-0">
                            <OptimizedImage
                                src={`/student_faces/${p1.roll_no}.png`}
                                className="w-full h-full object-contain object-bottom p-1 md:p-2"
                                fallback={<div className="w-full h-full flex items-center justify-center"><span className="text-6xl font-black text-neutral-300">{p1.name.charAt(0)}</span></div>}
                                alt="P1"
                            />
                            <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-[#ffde00] text-black font-bold px-1.5 py-0.5 md:px-2 md:py-1 border-2 border-black text-[10px] md:text-xs shadow-sm">
                                #{p1.roll_no}
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="flex flex-col items-center text-center bg-white text-black justify-between shrink-0 z-10 p-2 md:p-4 pb-3 md:pb-4 gap-1 md:gap-0">
                            <div className="w-full">
                                <h2 className="text-xl md:text-3xl font-black uppercase leading-none line-clamp-1 md:line-clamp-2 md:leading-tight">{p1.name}</h2>
                                <div className="text-sm md:text-base font-black uppercase mt-0.5 md:mt-1">{formatClassName(p1.class)}</div>
                            </div>

                            <div className="flex flex-col items-center justify-center w-full pt-1 md:pt-2 border-t-2 border-dashed border-black mt-1">
                                <span className="font-bold text-xs md:text-sm uppercase opacity-70 mb-0.5">{metricLabel}</span>
                                <div className="text-5xl md:text-7xl font-black tracking-tighter text-black leading-none">
                                    {currentMetric === 'attendance' ? `${p1Value}%` : p1Value}
                                </div>
                            </div>
                        </div>
                    </motion.div>


                    {/* VS Badge - Positioned on right for mobile to avoid text overlap, Center for desktop */}
                    <div className="z-50 absolute right-4 top-1/2 -translate-y-1/2 md:left-1/2 md:right-auto md:-translate-x-1/2 pointer-events-none">
                        <div className="bg-[#ffde00] text-black border-2 md:border-4 border-black font-black text-sm md:text-xl px-2 py-1 md:px-4 md:py-2 transform -skew-x-12 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                            VS
                        </div>
                    </div>


                    {/* PLAYER 2 CARD */}
                    <motion.div
                        layout
                        key={p2.roll_no}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 20, mass: 1.5 }}
                        className="relative flex-1 w-full md:w-1/2 bg-white border-2 md:border-4 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col min-h-0"
                    >
                        {/* Image Section */}
                        <div className="relative flex-1 bg-gray-100 border-b-2 md:border-b-4 border-black overflow-hidden flex items-end justify-center min-h-0">
                            <OptimizedImage
                                src={`/student_faces/${p2.roll_no}.png`}
                                className="w-full h-full object-contain object-bottom p-1 md:p-2"
                                fallback={<div className="w-full h-full flex items-center justify-center"><span className="text-6xl font-black text-neutral-300">{p2.name.charAt(0)}</span></div>}
                                alt="P2"
                            />
                            <div className="absolute top-1 right-1 md:top-2 md:right-2 bg-white text-black font-bold px-1.5 py-0.5 md:px-2 md:py-1 border-2 border-black text-[10px] md:text-xs shadow-sm">
                                #{p2.roll_no}
                            </div>
                        </div>

                        {/* Content Section */}
                        <div className="flex flex-col items-center text-center bg-white text-black justify-between shrink-0 z-10 p-2 md:p-4 pt-4 md:pt-4 gap-2 md:gap-0 pr-2 md:pr-4">
                            <div className="w-full">
                                <h2 className="text-xl md:text-3xl font-black uppercase leading-none line-clamp-1 md:line-clamp-2 md:leading-tight">{p2.name}</h2>
                                <div className="text-sm md:text-base font-black uppercase mt-0.5 md:mt-1">{formatClassName(p2.class)}</div>
                            </div>

                            {gameState === 'playing' ? (
                                <div className="w-full grid grid-cols-2 gap-2 mt-auto">
                                    <button
                                        onClick={() => handleGuess('higher')}
                                        className="bg-[#00ffff] border-2 md:border-4 border-black p-1 hover:-translate-y-1 hover:shadow-[2px_2px_0px_black] active:translate-y-0 active:shadow-none transition-all flex flex-col items-center justify-center gap-0.5 h-14 md:h-20"
                                    >
                                        <ArrowUp className="w-6 h-6 md:w-8 md:h-8 stroke-[3]" />
                                        <span className="font-black text-sm md:text-lg uppercase leading-none text-black">High</span>
                                    </button>
                                    <button
                                        onClick={() => handleGuess('lower')}
                                        className="bg-[#ff69b4] border-2 md:border-4 border-black p-1 hover:-translate-y-1 hover:shadow-[2px_2px_0px_black] active:translate-y-0 active:shadow-none transition-all flex flex-col items-center justify-center gap-0.5 h-14 md:h-20"
                                    >
                                        <ArrowDown className="w-6 h-6 md:w-8 md:h-8 stroke-[3]" />
                                        <span className="font-black text-sm md:text-lg uppercase leading-none text-black">Low</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center w-full pt-1 md:pt-2 border-t-2 border-dashed border-black animate-in zoom-in duration-300 mt-1">
                                    <span className="font-bold text-xs md:text-sm uppercase opacity-70 mb-0.5">{metricLabel}</span>
                                    <div className="text-5xl md:text-7xl font-black tracking-tighter text-black leading-none">
                                        {currentMetric === 'attendance' ? `${p2Value}%` : p2Value}
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </LayoutGroup>
            </div>

            {/* Game Over Overlays */}
            {gameState === 'wrong' && (
                <div className="fixed inset-0 z-[100] bg-white/90 backdrop-blur-sm flex flex-col animate-in fade-in duration-300 overflow-y-auto">
                    <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[600px]">
                        <XCircle className="w-20 h-20 text-red-500 mb-6 drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]" strokeWidth={2} />
                        <h2 className="text-6xl md:text-8xl font-black text-black uppercase italic text-center leading-none mb-2 drop-shadow-[2px_2px_0px_rgba(0,0,0,0.1)]">GAME OVER</h2>
                        <div className="text-2xl md:text-4xl font-bold text-black mb-8 font-mono">SCORE: {score}</div>

                        <div className="bg-white border-4 border-black p-6 rounded-none w-full max-w-sm mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col items-center gap-2">
                            <span className="font-bold uppercase opacity-60 text-sm tracking-widest text-center text-black">{p2.name}'s {metricLabel}</span>
                            <span className="font-black text-black text-4xl">
                                {currentMetric === 'attendance' ? `${p2Value}%` : p2Value}
                            </span>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 w-full max-w-sm">
                            <button onClick={resetGame} className="flex-1 bg-[#ffde00] text-black border-4 border-black py-4 font-black text-xl hover:translate-y-[-4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none">
                                <RotateCcw size={24} /> RETRY
                            </button>
                            <button onClick={goToMenu} className="flex-1 bg-white text-black border-4 border-black py-4 font-black text-xl hover:translate-y-[-4px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-none">
                                <ArrowLeft size={24} /> EXIT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
