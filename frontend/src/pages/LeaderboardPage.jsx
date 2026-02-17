import React, { useState, useEffect, useRef, lazy, Suspense } from 'react'
import { gsap } from 'gsap'
import { leaderboardAPI, statsAPI } from '../utils/api'
import { formatClassName } from '../utils/format'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ChevronDown from 'lucide-react/dist/esm/icons/chevron-down'
import Crown from 'lucide-react/dist/esm/icons/crown'
import OptimizedImage from '../components/common/OptimizedImage'

const StudentModal = lazy(() => import('../components/StudentModal'));

// Simple Neo-Brutalist Toggle
const ToggleButton = ({ options, active, onChange }) => {
    return (
        <div className="flex border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full md:w-auto overflow-hidden">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`
                        flex-1 md:flex-none px-2 md:px-6 py-3 min-h-[44px] font-bold uppercase font-mono transition-colors text-xs md:text-base truncate flex items-center justify-center
                        ${active === opt.value
                            ? 'bg-black text-[#ffde00]'
                            : 'bg-white text-black hover:bg-gray-100'
                        }
                    `}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}

import { CLASSES } from '../utils/constants'

// ... existing imports

export default function LeaderboardPage() {
    const [students, setStudents] = useState([])
    const [subjectList, setSubjectList] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedStudentRoll, setSelectedStudentRoll] = useState(null)

    // State
    const [viewScope, setViewScope] = useState('overall')
    const [metric, setMetric] = useState('marks')
    const [filterClass, setFilterClass] = useState('all')
    const [selectedSubject, setSelectedSubject] = useState('')

    const LIMIT = 1000
    // Derive classes list for filter (prepend 'all')
    const classes = ['all', ...CLASSES.map(c => c.id)]
    const gridRef = useRef(null)

    const [subjectCodeMap, setSubjectCodeMap] = useState({})

    useEffect(() => {
        fetchLeaderboardData()
    }, [viewScope, metric, filterClass, selectedSubject, subjectCodeMap])

    useEffect(() => {
        if (viewScope === 'subject' && subjectList.length === 0) {
            fetchSubjects()
        }
    }, [viewScope])

    const fetchLeaderboardData = async () => {
        setIsLoading(true)
        try {
            let data = []
            if (viewScope === 'subject') {
                if (selectedSubject) {
                    // Get all codes associated with this subject (handling duplicates like "Community Engagement  Project" vs "Community Engagement Project")
                    const codesToFetch = subjectCodeMap[selectedSubject] || [selectedSubject]

                    // Fetch all variations in parallel
                    const responses = await Promise.all(
                        codesToFetch.map(code =>
                            leaderboardAPI.getTopBySubject(code, LIMIT, filterClass, metric)
                                .catch(err => {
                                    console.warn(`Failed to fetch for code ${code}`, err)
                                    return { students: [] }
                                })
                        )
                    )

                    // Merge results
                    const allStudents = responses.flatMap(r => r.students || [])

                    // Deduplicate by student_id
                    const uniqueStudents = Array.from(
                        new Map(allStudents.map(s => [s.student_id, s])).values()
                    )

                    data = uniqueStudents
                }
            } else {
                if (metric === 'attendance') {
                    data = await leaderboardAPI.getTopByAttendance(LIMIT, filterClass)
                } else {
                    data = await leaderboardAPI.getTopBySGPA(LIMIT, filterClass)
                }
            }
            setStudents(data)
        } catch (error) {
            console.error('Failed to fetch leaderboard:', error)
            setStudents([])
        } finally {
            setIsLoading(false)
        }
    }

    const fetchSubjects = async () => {
        try {
            const response = await statsAPI.getSubjectStats('all')
            const rawSubs = response.subjects || []

            // Deduplicate and Map Codes
            const uniqueMap = {}
            const codeMapping = {}

            rawSubs.forEach(sub => {
                // Normalize name: trim and reduce multiple spaces to single space
                const normalizedName = sub.subject_name.trim().replace(/\s+/g, ' ')

                if (!uniqueMap[normalizedName]) {
                    uniqueMap[normalizedName] = {
                        ...sub,
                        subject_name: normalizedName // Use clean name
                    }
                    // Initialize mapping with this code
                    codeMapping[sub.subject_code] = [sub.subject_code]
                } else {
                    // Found a duplicate! Add this code to the existing entry's mapping
                    const existingCode = uniqueMap[normalizedName].subject_code
                    if (!codeMapping[existingCode].includes(sub.subject_code)) {
                        codeMapping[existingCode].push(sub.subject_code)
                    }
                }
            })

            const dedupedSubs = Object.values(uniqueMap).sort((a, b) => a.subject_name.localeCompare(b.subject_name))

            setSubjectList(dedupedSubs)
            setSubjectCodeMap(codeMapping)

            if (dedupedSubs.length > 0 && !selectedSubject) {
                setSelectedSubject(dedupedSubs[0].subject_code)
            }
        } catch (error) {
            console.error('Failed to fetch subjects:', error)
        }
    }

    useEffect(() => {
        if (!gridRef.current || isLoading) return
        gsap.fromTo(
            gridRef.current.children,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.3, stagger: 0.03, ease: 'power2.out' }
        )
    }, [students, isLoading])

    return (
        <div className="min-h-screen bg-white text-black font-mono selection:bg-[#00ffff] overflow-x-hidden w-full max-w-full">
            <Navbar />

            <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 py-8 md:py-12 md:px-6">

                {/* Header */}
                <div className="text-center mb-8 md:mb-12">
                    <h1 className="text-5xl sm:text-6xl md:text-8xl font-black uppercase tracking-tighter mb-4 shadow-black drop-shadow-lg leading-none break-words hyphens-auto text-black">
                        HALL OF <span className="text-[#00ffff] inline-block transform -skew-x-6" style={{ textShadow: '4px 4px 0px #000', WebkitTextStroke: '2px black' }}>FAME</span>
                    </h1>
                    <p className="bg-[#ffde00] inline-block border-2 border-black px-2 md:px-4 py-1 font-bold transform -rotate-2 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-xs md:text-base max-w-[90vw] truncate">
                        {viewScope === 'overall' ? 'SEMESTER DOMINANCE' : 'SUBJECT SPECIALISTS'}
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col items-center gap-4 md:gap-6 mb-8 md:mb-16 w-full">
                    <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 md:gap-4 w-full md:w-auto">
                        <ToggleButton
                            options={[{ label: 'OVERALL', value: 'overall' }, { label: 'SUBJECT', value: 'subject' }]}
                            active={viewScope}
                            onChange={(v) => { setViewScope(v); if (v === 'overall') setMetric('marks'); }}
                        />
                        <ToggleButton
                            options={[
                                { label: viewScope === 'overall' ? 'SGPA' : 'MARKS', value: 'marks' },
                                { label: 'ATTENDANCE', value: 'attendance' }
                            ]}
                            active={metric}
                            onChange={setMetric}
                        />
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 md:gap-4 w-full max-w-4xl">
                        {/* Class Filter */}
                        <div className="border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-wrap w-full md:w-auto">
                            {classes.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setFilterClass(c)}
                                    className={`flex-1 md:flex-none px-3 md:px-4 py-3 min-h-[44px] text-xs md:text-sm font-bold uppercase transition-colors whitespace-nowrap flex items-center justify-center
                                        ${filterClass === c ? 'bg-black text-white' : 'hover:bg-gray-200'}
                                    `}
                                >
                                    {c === 'all' ? 'ALL' : formatClassName(c)}
                                </button>
                            ))}
                        </div>

                        {/* Subject Select */}
                        {viewScope === 'subject' && (
                            <div className="relative border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white w-full md:w-auto md:min-w-[250px]">
                                <select
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                    className="w-full h-full p-3 min-h-[44px] bg-transparent font-bold uppercase appearance-none cursor-pointer focus:outline-none text-xs md:text-base truncate pr-10"
                                >
                                    {subjectList.map(s => (
                                        <option key={s.subject_code} value={s.subject_code} className="font-mono">
                                            {s.subject_name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none border-2 border-black bg-[#ffde00] rounded-full p-0.5" />
                            </div>
                        )}
                    </div>
                </div>

                {/* List */}
                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="h-12 w-12 border-4 border-black border-t-[#ff69b4] rounded-full animate-spin"></div>
                    </div>
                ) : students.length === 0 ? (
                    <div className="text-center py-10 md:py-20 font-bold text-lg md:text-xl border-4 border-dashed border-gray-300 mx-4">
                        NO DATA FOUND. THE ARCHIVES ARE INCOMPLETE.
                    </div>
                ) : (
                    <div ref={gridRef} className="grid grid-cols-1 gap-3 md:gap-4 max-w-5xl mx-auto w-full">
                        {/* Header Row - Hidden on Mobile */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-6 font-black uppercase text-sm border-b-4 border-black pb-2">
                            <div className="col-span-1 text-center">Rank</div>
                            <div className="col-span-1"></div>
                            <div className="col-span-6">Student</div>
                            <div className="col-span-2 text-right">Score</div>
                            <div className="col-span-2 text-right">Class</div>
                        </div>

                        {students.map((student, index) => {
                            const rank = student.rank || (index + 1);
                            const isTop3 = rank <= 3;

                            let displayValue = '';
                            if (metric === 'attendance') {
                                displayValue = `${parseFloat((viewScope === 'subject' ? student.attendance_percentage : student.attendance) || 0).toFixed(1)}%`;
                            } else if (viewScope === 'subject') {
                                displayValue = parseFloat(student.marks?.total ?? 0).toFixed(2);
                            } else {
                                displayValue = parseFloat(student.cgpa || 0).toFixed(2);
                            }

                            return (
                                <div
                                    key={student.student_id}
                                    onClick={() => setSelectedStudentRoll(student.roll_no)}
                                    className={`
                                        group relative grid grid-cols-12 gap-2 md:gap-4 items-center p-3 md:p-4 border-4 border-black transition-transform cursor-pointer w-full
                                        ${isTop3 ? 'bg-[#ffde00] hover:translate-x-1 hover:translate-y-1 hover:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]' : 'bg-white hover:bg-gray-50'}
                                    `}
                                >
                                    {/* Mobile: Rank + Name + Score Layout */}
                                    <div className="col-span-2 md:col-span-1 flex justify-center">
                                        <div className={`
                                            w-8 h-8 md:w-10 md:h-10 flex items-center justify-center font-black text-sm md:text-lg border-2 border-black
                                            ${rank === 1 ? 'bg-[#ff69b4] text-black' : rank === 2 ? 'bg-gray-300' : rank === 3 ? 'bg-orange-400' : 'bg-white'}
                                         `}>
                                            {rank === 1 ? <Crown className="w-4 h-4 md:w-6 md:h-6" /> : rank}
                                        </div>
                                    </div>

                                    <div className="hidden md:block col-span-1">
                                        <div className="w-10 h-10 md:w-12 md:h-12 border-2 border-black overflow-hidden bg-gray-200">
                                            <OptimizedImage
                                                src={`/student_faces/${student.roll_no}.png`}
                                                alt=""
                                                className="w-full h-full object-cover transition-all"
                                                width={48}
                                                height={48}
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-7 md:col-span-6 overflow-hidden pr-2">
                                        {/* Mobile: Name on top, Class/Roll below */}
                                        <div className="font-bold text-xs sm:text-sm md:text-lg uppercase truncate leading-tight">{student.name}</div>
                                        <div className="flex gap-2 mt-1 items-center">
                                            <div className="text-[10px] md:text-xs font-mono bg-black text-white inline-block px-1">{student.roll_no}</div>
                                            <div className="md:hidden text-[9px] font-bold border border-black px-1 bg-white truncate max-w-[80px]">
                                                {formatClassName(student.class)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-span-3 md:col-span-2 text-right">
                                        <div className="font-black text-base sm:text-lg md:text-2xl">{displayValue}</div>
                                        <div className="text-[8px] md:text-[10px] uppercase font-bold tracking-widest">{metric === 'attendance' ? 'ATT' : 'SCORE'}</div>
                                    </div>

                                    <div className="hidden md:block col-span-2 text-right">
                                        <span className="font-bold border-2 border-black px-2 py-1 bg-white text-xs">
                                            {formatClassName(student.class)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedStudentRoll && (
                <Suspense fallback={null}>
                    <StudentModal
                        rollNo={selectedStudentRoll}
                        onClose={() => setSelectedStudentRoll(null)}
                    />
                </Suspense>
            )}

            <Footer />
        </div>
    )
}
