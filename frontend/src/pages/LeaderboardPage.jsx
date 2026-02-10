import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import StudentBubble from '../components/StudentBubble'
import { useMockStudents } from '../hooks/useMockStudents'

export default function LeaderboardPage() {
  const { students, isLoading } = useMockStudents()
  const [sortBy, setSortBy] = useState('cgpa')
  const [filterClass, setFilterClass] = useState('all')
  const [sortedStudents, setSortedStudents] = useState([])
  const gridRef = useRef(null)

  useEffect(() => {
    if (students.length === 0) return

    // Sort and filter students
    let filtered = [...students]

    if (filterClass !== 'all') {
      filtered = filtered.filter((s) => s.class === filterClass)
    }

    filtered.sort((a, b) => {
      if (sortBy === 'cgpa') return b.cgpa - a.cgpa
      if (sortBy === 'attendance') return b.attendance - a.attendance
      return 0
    })

    // Limit to top 10
    filtered = filtered.slice(0, 10)

    setSortedStudents(filtered)

    // Animate reshuffle
    if (gridRef.current) {
      gsap.fromTo(
        gridRef.current.children,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(1.3)' }
      )
    }
  }, [students, sortBy, filterClass])

  const classes = ['all', 'COMPS_A', 'COMPS_B', 'COMPS_C']

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-body">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-ink mb-4">🏆 Leaderboard</h1>
          <p className="text-body text-lg">Top 10 students by performance</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          {/* Sort Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('cgpa')}
              className={`px-6 py-3 rounded-bubble font-medium transition-all duration-300
                ${
                  sortBy === 'cgpa'
                    ? 'bg-accent text-ink shadow-bubble-hover scale-105'
                    : 'bubble hover:scale-105'
                }`}
            >
              CGPA ↓
            </button>
            <button
              onClick={() => setSortBy('attendance')}
              className={`px-6 py-3 rounded-bubble font-medium transition-all duration-300
                ${
                  sortBy === 'attendance'
                    ? 'bg-accent text-ink shadow-bubble-hover scale-105'
                    : 'bubble hover:scale-105'
                }`}
            >
              Attendance ↓
            </button>
          </div>

          {/* Class Filter */}
          <div className="flex gap-2">
            {classes.map((cls) => (
              <button
                key={cls}
                onClick={() => setFilterClass(cls)}
                className={`px-4 py-3 rounded-bubble font-medium transition-all duration-300
                  ${
                    filterClass === cls
                      ? 'bg-bubbleSecondary text-ink shadow-bubble-hover scale-105'
                      : 'bubble hover:scale-105'
                  }`}
              >
                {cls === 'all' ? 'All' : cls}
              </button>
            ))}
          </div>
        </div>

        {/* Student Grid */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
        >
          {sortedStudents.map((student, index) => (
            <StudentBubble key={student.roll_no} student={student} rank={index + 1} />
          ))}
        </div>
      </div>
    </div>
  )
}
