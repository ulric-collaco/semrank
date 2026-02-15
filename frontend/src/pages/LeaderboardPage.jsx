import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { leaderboardAPI, statsAPI } from '../utils/api'
import { formatClassName } from '../utils/format'
import StudentModal from '../components/StudentModal'
import ToggleSwitch from '../components/ToggleSwitch'
import { ChevronDown, BookOpen, Trophy, Users, GraduationCap, LayoutGrid } from 'lucide-react'

export default function LeaderboardPage() {
  const [students, setStudents] = useState([])
  const [subjectList, setSubjectList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudentRoll, setSelectedStudentRoll] = useState(null)

  // New State Model
  const [viewScope, setViewScope] = useState('overall') // 'overall' | 'subject'
  const [metric, setMetric] = useState('marks')         // 'marks' | 'attendance'

  // Filters
  const [filterClass, setFilterClass] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('')

  // Constants
  const LIMIT = 1000
  const classes = ['all', 'COMPS_A', 'COMPS_B', 'COMPS_C', 'MECH']

  const gridRef = useRef(null)

  // Fetch Data on Change
  useEffect(() => {
    fetchLeaderboardData()
  }, [viewScope, metric, filterClass, selectedSubject])

  // Fetch Subject List when entering Subject scope
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
          // Fetch Subject Leaderboard (Marks or Attendance)
          // metric 'marks' -> sortBy='marks', 'attendance' -> sortBy='attendance'
          const response = await leaderboardAPI.getTopBySubject(selectedSubject, LIMIT, filterClass, metric)
          data = response.students || []
        } else {
          data = [] // Waiting for subject
        }
      } else {
        // Overall Scope
        if (metric === 'attendance') {
          data = await leaderboardAPI.getTopByAttendance(LIMIT, filterClass)
        } else {
          // Default: SGPA (Marks)
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
      const subs = response.subjects || []
      setSubjectList(subs)
      // Select first subject by default
      if (subs.length > 0 && !selectedSubject) {
        setSelectedSubject(subs[0].subject_code)
      }
    } catch (error) {
      console.error('Failed to fetch subjects:', error)
    }
  }

  // Animation
  useEffect(() => {
    if (!gridRef.current || isLoading) return
    gsap.fromTo(
      gridRef.current.children,
      { scale: 0.95, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, stagger: 0.02, ease: 'power2.out' }
    )
  }, [students, isLoading])

  return (
    <div className="min-h-screen px-4 md:px-6 py-20 pb-32">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-display font-black text-ink mb-2 tracking-tight md:tracking-normal uppercase">
            Leaderboard
          </h1>
          <p className="text-slate-500 font-medium">
            {viewScope === 'overall' ? 'Semester Rankings' : 'Subject-wise Performance'}
          </p>
        </div>

        {/* Controls Container */}
        <div className="flex flex-col items-center gap-6 mb-10">

          {/* 1. Scope Toggle */}
          <div className="mb-2">
            <ToggleSwitch
              options={[
                { label: 'Overall', value: 'overall' },
                { label: 'Subject', value: 'subject' },
              ]}
              activeValue={viewScope}
              onChange={setViewScope}
            />
          </div>

          {/* 2. Metric Toggle */}
          <div className="mb-2">
            <ToggleSwitch
              options={[
                { label: viewScope === 'overall' ? 'SGPA' : 'Marks', value: 'marks' },
                { label: 'Attendance', value: 'attendance' },
              ]}
              activeValue={metric}
              onChange={setMetric}
            />
          </div>

          {/* 3. Filters (Class & Subject) */}
          <div className="flex flex-wrap justify-center gap-3 w-full max-w-2xl mt-2 z-10">

            {/* Class Filter */}
            <ToggleSwitch
              options={classes.map(c => ({
                label: c === 'all' ? 'All' : formatClassName(c),
                value: c
              }))}
              activeValue={filterClass}
              onChange={setFilterClass}
            />

            {/* Subject Selector */}
            {viewScope === 'subject' && (
              <div className="relative group flex-grow md:flex-grow-0 min-w-[200px]">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="appearance-none bg-slate-800/80 border border-white/10 text-amber-100 pl-4 pr-10 py-2.5 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 hover:bg-slate-800 transition-colors w-full cursor-pointer h-[42px]"
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

        {/* Data List */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="text-slate-500 animate-pulse text-sm">Loading rankings...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-white/5">
            <p className="text-slate-400">No students found.</p>
          </div>
        ) : (
          <div ref={gridRef} className="grid grid-cols-1 gap-3 pb-20">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <div className="col-span-1 text-center">Rank</div>
              <div className="col-span-5">Student</div>
              <div className="col-span-3 text-right">
                {metric === 'attendance' ? 'Attendance' : (viewScope === 'subject' ? 'Marks / 100' : 'SGPI')}
              </div>
              <div className="col-span-3 text-right">Class</div>
            </div>

            {/* Rows */}
            {students.map((student, index) => {
              // Determine Display Value
              let displayValue = ''
              let accentColor = ''

              if (metric === 'attendance') {
                const att = viewScope === 'subject' ? student.attendance_percentage : student.attendance
                displayValue = `${parseFloat(att || 0).toFixed(1)}%`
                accentColor = 'text-emerald-400'
              } else if (viewScope === 'subject') {
                displayValue = parseFloat(student.marks?.total ?? 0).toFixed(2)
                accentColor = 'text-amber-400'
              } else {
                displayValue = parseFloat(student.cgpa || 0).toFixed(2)
                accentColor = 'text-indigo-400'
              }

              const rank = student.rank || (index + 1)
              const isTop3 = rank <= 3

              // Top 3 specific styling for better visibility
              const cardBg = isTop3
                ? 'bg-slate-800/90 border-white/20 shadow-lg'
                : 'bg-slate-900/40 hover:bg-slate-800/60 border-white/5 hover:border-white/10'

              return (
                <div
                  key={student.student_id}
                  onClick={() => setSelectedStudentRoll(student.roll_no)}
                  className={`group relative ${cardBg} border rounded-xl p-4 md:px-6 md:py-4 transition-all cursor-pointer flex flex-col md:grid md:grid-cols-12 gap-3 items-start md:items-center`}
                >
                  {/* Rank Badge */}
                  <div className="absolute top-4 right-4 md:static md:col-span-1 md:flex md:justify-center">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shadow-sm
                      ${rank === 1 ? 'bg-yellow-500 text-yellow-950 border border-yellow-400' :
                        rank === 2 ? 'bg-slate-300 text-slate-800 border border-slate-200' :
                          rank === 3 ? 'bg-orange-400 text-orange-950 border border-orange-300' :
                            'bg-slate-800 text-slate-400 border border-slate-700'}
                    `}>
                      {rank}
                    </div>
                  </div>

                  {/* Student Details */}
                  <div className="col-span-12 md:col-span-5 flex items-center gap-4">
                    <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border flex-shrink-0 ${isTop3 ? 'border-white/30' : 'border-white/10 bg-slate-800'}`}>
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
                      <h3 className={`font-bold line-clamp-2 md:line-clamp-1 break-words leading-tight pr-8 md:pr-0 ${isTop3 ? 'text-white text-lg' : 'text-slate-200'}`}>{student.name}</h3>
                      <p className={`text-xs font-mono mt-0.5 ${isTop3 ? 'text-slate-300' : 'text-slate-500'}`}>{student.roll_no}</p>
                    </div>
                  </div>

                  {/* Statistic */}
                  <div className="col-span-6 md:col-span-3 flex md:justify-end items-center gap-2 md:gap-0">
                    <span className="md:hidden text-xs text-slate-500 uppercase font-bold mr-2">
                      {metric === 'attendance' ? 'Att:' : (viewScope === 'subject' ? 'Marks:' : 'SGPI:')}
                    </span>
                    <span className={`text-xl font-bold font-mono ${isTop3 ? 'text-white scale-110 origin-right' : accentColor}`}>
                      {displayValue}
                    </span>
                  </div>

                  {/* Class Badge */}
                  <div className="col-span-6 md:col-span-3 flex md:justify-end items-center">
                    <span className="md:hidden text-xs text-slate-500 uppercase font-bold mr-2">Class:</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-md border ${isTop3 ? 'bg-white/10 text-white border-white/20' : 'bg-white/5 text-slate-400 border-white/5'}`}>
                      {formatClassName(student.class)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selectedStudentRoll && (
        <StudentModal
          rollNo={selectedStudentRoll}
          onClose={() => setSelectedStudentRoll(null)}
        />
      )}
    </div>
  )
}
