import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import StudentBubble from '../components/StudentBubble'
import { leaderboardAPI, statsAPI } from '../utils/api'
import { formatClassName } from '../utils/format'
import StudentModal from '../components/StudentModal'
import { Filter, ChevronDown, BookOpen, Trophy, Users, Calculator } from 'lucide-react'

export default function LeaderboardPage() {
  const [students, setStudents] = useState([])
  const [subjectList, setSubjectList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudentRoll, setSelectedStudentRoll] = useState(null)

  // Primary Mode: 'cgpa', 'attendance', 'subject'
  const [activeMode, setActiveMode] = useState('cgpa')

  // Filters
  const [filterClass, setFilterClass] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('')

  // Constants
  const LIMIT = 1000 // Always fetch all (or a high limit)
  const classes = ['all', 'COMPS_A', 'COMPS_B', 'COMPS_C', 'MECH']

  const gridRef = useRef(null)

  // Initial Data Fetch & Mode Changes
  useEffect(() => {
    fetchLeaderboardData()
  }, [activeMode, filterClass, selectedSubject])

  // Fetch Subject List when entering Subject mode
  useEffect(() => {
    if (activeMode === 'subject' && subjectList.length === 0) {
      fetchSubjects()
    }
  }, [activeMode])

  const fetchLeaderboardData = async () => {
    setIsLoading(true)
    try {
      let data = []

      if (activeMode === 'subject') {
        if (selectedSubject) {
          // Fetch Subject Leaderboard
          const response = await leaderboardAPI.getTopBySubject(selectedSubject, LIMIT, filterClass)
          data = response.students || []
        } else {
          // Waiting for subject selection
          data = []
        }
      } else if (activeMode === 'attendance') {
        data = await leaderboardAPI.getTopByAttendance(LIMIT, filterClass)
      } else {
        // Default: SGPA
        data = await leaderboardAPI.getTopBySGPA(LIMIT, filterClass)
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
      const subs = response.subjects || []
      setSubjectList(subs)
      // Select first subject by default if none selected
      if (subs.length > 0 && !selectedSubject) {
        setSelectedSubject(subs[0].subject_code)
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
    }
  }

  // Animation when data changes
  useEffect(() => {
    if (!gridRef.current || isLoading) return

    gsap.fromTo(
      gridRef.current.children,
      { scale: 0.9, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, stagger: 0.03, ease: 'back.out(1.2)' }
    )
  }, [students, isLoading])

  // Get current active subject name
  const getActiveSubjectName = () => {
    const sub = subjectList.find(s => s.subject_code === selectedSubject)
    return sub ? sub.subject_name : 'Subject'
  }

  return (
    <div className="min-h-screen px-4 md:px-6 py-20 pb-32">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-display font-black text-ink mb-2 tracking-tight md:tracking-normal uppercase">
            Leaderboard
          </h1>
        
        </div>

        {/* Controls Container */}
        <div className="flex flex-col items-center gap-6 mb-12">

          {/* 1. Main Mode Toggles */}
          <div className="bg-slate-900/50 p-1.5 rounded-full border border-white/10 flex flex-wrap justify-center gap-1 backdrop-blur-md">
            <button
              onClick={() => setActiveMode('cgpa')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeMode === 'cgpa'
                ? 'bg-indigo-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Trophy className="w-4 h-4" />
              SGPA
            </button>
            <button
              onClick={() => setActiveMode('attendance')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeMode === 'attendance'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Users className="w-4 h-4" />
              Attendance
            </button>
            <button
              onClick={() => setActiveMode('subject')}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${activeMode === 'subject'
                ? 'bg-amber-500 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <BookOpen className="w-4 h-4" />
              Subject
            </button>
          </div>

          {/* 2. Secondary Filters (Class & Subject Selector) */}
          <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl">

            {/* Class Filter Toggle Group */}
            <div className="bg-slate-900/50 p-1.5 rounded-xl border border-white/10 flex flex-wrap justify-center gap-1 backdrop-blur-md">
              {classes.map(c => (
                <button
                  key={c}
                  onClick={() => setFilterClass(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${filterClass === c
                      ? 'bg-slate-700 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {c === 'all' ? 'All Classes' : formatClassName(c)}
                </button>
              ))}
            </div>

            {/* Subject Selector (Only in Subject Mode) */}
            {activeMode === 'subject' && (
              <div className="relative group flex-grow md:flex-grow-0">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="appearance-none bg-slate-800/80 border border-white/10 text-amber-200 pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 hover:bg-slate-800 transition-colors w-full md:min-w-[240px] max-w-full truncate"
                >
                  {subjectList.map(sub => (
                    <option key={sub.subject_code} value={sub.subject_code}>
                      {sub.subject_name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400 pointer-events-none" />
              </div>
            )}
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="text-slate-500 animate-pulse text-sm">Loading rankings...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-white/5">
            <p className="text-slate-400">No students found for this criteria.</p>
          </div>
        ) : (
          <div
            ref={gridRef}
            className="grid grid-cols-1 gap-3 pb-20"
          >
            {/* Header Row */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-5">Student</div>
              <div className="col-span-3 text-right">
                {activeMode === 'subject' ? 'Marks / 100' : activeMode === 'attendance' ? 'Attendance' : 'SGPI'}
              </div>
              <div className="col-span-3 text-right">Class</div>
            </div>

            {students.map((student, index) => {
              // Determine what value to show on the right based on mode
              let primaryValue = ''
              let primaryLabel = ''
              let accentColor = ''

              if (activeMode === 'subject') {
                primaryValue = student.marks?.total ?? 'N/A'
                primaryLabel = 'Marks'
                accentColor = 'text-amber-400'
              } else if (activeMode === 'attendance') {
                primaryValue = `${parseFloat(student.attendance || 0).toFixed(1)}%`
                primaryLabel = 'Attendance'
                accentColor = 'text-emerald-400'
              } else {
                primaryValue = parseFloat(student.cgpa || 0).toFixed(2)
                primaryLabel = 'SGPI'
                accentColor = 'text-indigo-400'
              }

              // Determine Rank
              const rank = student.rank || (index + 1)
              const isTop3 = rank <= 3

              return (
                <div
                  key={student.student_id}
                  onClick={() => setSelectedStudentRoll(student.roll_no)}
                  className="group relative bg-slate-900/40 hover:bg-slate-800/60 border border-white/5 hover:border-white/10 rounded-xl p-4 md:px-6 md:py-4 transition-all cursor-pointer flex flex-col md:grid md:grid-cols-12 gap-3 items-start md:items-center"
                >
                  {/* Mobile Rank Badge */}
                  <div className="absolute top-4 right-4 md:hidden">
                    <div className={`
                                        w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                                        ${isTop3 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}
                                     `}>
                      #{rank}
                    </div>
                  </div>

                  {/* Desktop Rank */}
                  <div className="hidden md:flex col-span-1 justify-center">
                    <div className={`
                                        w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                                        ${isTop3 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-400 border border-slate-700'}
                                    `}>
                      {rank}
                    </div>
                  </div>

                  {/* Student Info */}
                  <div className="col-span-12 md:col-span-5 flex items-center gap-4">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800 overflow-hidden border border-white/10 flex-shrink-0">
                      <img
                        src={`/student_faces/${student.roll_no}.png`}
                        alt={student.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                      <div className="hidden w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">
                        <span className="text-xs">IMG</span>
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-200 truncate pr-8 md:pr-0">{student.name}</h3>
                      <p className="text-xs text-slate-500 font-mono">{student.roll_no}</p>
                    </div>
                  </div>

                  {/* Primary Stat (Value) */}
                  <div className="col-span-6 md:col-span-3 flex md:justify-end items-center gap-2 md:gap-0">
                    <span className="md:hidden text-xs text-slate-500 uppercase font-bold mr-2">{primaryLabel}:</span>
                    <span className={`text-xl font-bold font-mono ${accentColor}`}>
                      {primaryValue}
                    </span>
                  </div>

                  {/* Class */}
                  <div className="col-span-6 md:col-span-3 flex md:justify-end items-center">
                    <span className="md:hidden text-xs text-slate-500 uppercase font-bold mr-2">Class:</span>
                    <span className="text-slate-400 text-sm font-medium px-2 py-1 bg-white/5 rounded-md border border-white/5">
                      {formatClassName(student.class)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Student Detail Modal */}
      {selectedStudentRoll && (
        <StudentModal
          rollNo={selectedStudentRoll}
          onClose={() => setSelectedStudentRoll(null)}
        />
      )}
    </div>
  )
}
