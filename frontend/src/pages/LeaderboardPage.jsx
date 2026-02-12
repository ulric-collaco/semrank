import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import StudentBubble from '../components/StudentBubble'
import { leaderboardAPI, statsAPI } from '../utils/api'
import StudentModal from '../components/StudentModal'

export default function LeaderboardPage() {
  const [activeTab, setActiveTab] = useState('student') // 'student' or 'class'
  const [students, setStudents] = useState([])
  const [classRankings, setClassRankings] = useState([])
  const [subjectList, setSubjectList] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudentRoll, setSelectedStudentRoll] = useState(null)
  
  // Student leaderboard filters
  const [sortBy, setSortBy] = useState('cgpa') // 'cgpa', 'attendance', or 'subject'
  const [filterClass, setFilterClass] = useState('all')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [limit, setLimit] = useState(10) // 10, 50, or 'all'
  
  const gridRef = useRef(null)
  const tabsRef = useRef(null)

  const classes = ['all', 'COMPS_A', 'COMPS_B', 'COMPS_C', 'MECH']

  // Fetch student leaderboard
  useEffect(() => {
    if (activeTab === 'student') {
      fetchStudentLeaderboard()
    }
  }, [activeTab, sortBy, filterClass, limit, selectedSubject])

  // Fetch class leaderboard
  useEffect(() => {
    if (activeTab === 'class') {
      fetchClassLeaderboard()
    }
  }, [activeTab])

  // Fetch subject list for subject mode
  useEffect(() => {
    if (sortBy === 'subject') {
      fetchSubjects()
    }
  }, [sortBy])

  const fetchStudentLeaderboard = async () => {
    setIsLoading(true)
    try {
      let data
      const fetchLimit = limit === 'all' ? 1000 : limit

      if (sortBy === 'subject' && selectedSubject) {
        const response = await leaderboardAPI.getTopBySubject(selectedSubject, fetchLimit, filterClass)
        data = response.students || []
      } else if (sortBy === 'cgpa') {
        data = await leaderboardAPI.getTopBySGPA(fetchLimit, filterClass)
      } else {
        data = await leaderboardAPI.getTopByAttendance(fetchLimit, filterClass)
      }
      setStudents(data)
    } catch (error) {
      console.error('Failed to fetch students:', error)
      setStudents([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchClassLeaderboard = async () => {
    setIsLoading(true)
    try {
      const data = await leaderboardAPI.getClassRankings()
      setClassRankings(data)
    } catch (error) {
      console.error('Failed to fetch class rankings:', error)
      setClassRankings([])
    } finally {
      setIsLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      const response = await statsAPI.getSubjectStats('all')
      setSubjectList(response.subjects || [])
      if (response.subjects && response.subjects.length > 0 && !selectedSubject) {
        setSelectedSubject(response.subjects[0].subject_code)
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
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(1.3)' }
    )
  }, [students, classRankings, isLoading])

  const handleSearchStudent = () => {
    // Navigate to search/student detail view (to be implemented)
    window.location.hash = '#search'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-body">Loading leaderboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen px-6 py-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-brand font-bold text-ink mb-4">🏆 Leaderboard</h1>
        </div>

        {/* Tabs */}
        <div ref={tabsRef} className="flex gap-4 justify-center mb-8">
          <button
            onClick={() => setActiveTab('student')}
            className={`px-8 py-4 rounded-bubble font-semibold text-lg transition-all ${
              activeTab === 'student'
                ? 'bg-accent text-ink shadow-bubble-hover scale-105'
                : 'bubble hover:scale-105'
            }`}
          >
            📚 Student Leaderboard
          </button>
          <button
            onClick={() => setActiveTab('class')}
            className={`px-8 py-4 rounded-bubble font-semibold text-lg transition-all ${
              activeTab === 'class'
                ? 'bg-accent text-ink shadow-bubble-hover scale-105'
                : 'bubble hover:scale-105'
            }`}
          >
            🎓 Class Rankings
          </button>
        </div>

        {/* Student Leaderboard Tab */}
        {activeTab === 'student' && (
          <>
            {/* Filters */}
            <div className="space-y-4 mb-8">
              {/* Sort Options */}
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  onClick={() => setSortBy('cgpa')}
                  className={`px-6 py-3 rounded-bubble font-medium transition-all ${
                    sortBy === 'cgpa'
                      ? 'bg-accent text-ink shadow-bubble-hover scale-105'
                      : 'bubble hover:scale-105'
                  }`}
                >
                  📊 SGPA
                </button>
                <button
                  onClick={() => setSortBy('attendance')}
                  className={`px-6 py-3 rounded-bubble font-medium transition-all ${
                    sortBy === 'attendance'
                      ? 'bg-accent text-ink shadow-bubble-hover scale-105'
                      : 'bubble hover:scale-105'
                  }`}
                >
                  📅 Attendance
                </button>
                <button
                  onClick={() => setSortBy('subject')}
                  className={`px-6 py-3 rounded-bubble font-medium transition-all ${
                    sortBy === 'subject'
                      ? 'bg-accent text-ink shadow-bubble-hover scale-105'
                      : 'bubble hover:scale-105'
                  }`}
                >
                  📖 Subject
                </button>
              </div>

              {/* Subject Selector (when subject mode) */}
              {sortBy === 'subject' && subjectList.length > 0 && (
                <div className="flex justify-center">
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="px-6 py-3 bubble rounded-bubble font-medium"
                  >
                    {subjectList.map((subject) => (
                      <option key={subject.subject_code} value={subject.subject_code}>
                        {subject.subject_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Class Filter */}
              <div className="flex flex-wrap gap-2 justify-center">
                {classes.map((cls) => (
                  <button
                    key={cls}
                    onClick={() => setFilterClass(cls)}
                    className={`px-4 py-2 rounded-bubble text-sm font-medium transition-all ${
                      filterClass === cls
                        ? 'bg-bubbleSecondary text-ink shadow-bubble-hover scale-105'
                        : 'bubble hover:scale-105'
                    }`}
                  >
                    {cls === 'all' ? 'All Classes' : cls}
                  </button>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex gap-2 justify-center">
                <button
                  onClick={() => setLimit(10)}
                  className={`px-4 py-2 rounded-bubble text-sm font-medium transition-all ${
                    limit === 10 ? 'bg-bubbleSecondary  text-ink' : 'bubble hover:scale-105'
                  }`}
                >
                  Top 10
                </button>
                <button
                  onClick={() => setLimit(50)}
                  className={`px-4 py-2 rounded-bubble text-sm font-medium transition-all ${
                    limit === 50 ? 'bg-bubbleSecondary text-ink' : 'bubble hover:scale-105'
                  }`}
                >
                  Top 50
                </button>
                <button
                  onClick={() => setLimit('all')}
                  className={`px-4 py-2 rounded-bubble text-sm font-medium transition-all ${
                    limit === 'all' ? 'bg-bubbleSecondary text-ink' : 'bubble hover:scale-105'
                  }`}
                >
                  All
                </button>
              </div>
            </div>

            {/* Student Grid */}
            <div
              ref={gridRef}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6"
            >
              {students.map((student, index) => (
                <StudentBubble
                  key={student.student_id || student.roll_no}
                  student={student}
                  rank={student.rank || index + 1}
                  onStudentClick={(rollNo) => setSelectedStudentRoll(rollNo)}
                />
              ))}
            </div>

            {students.length === 0 && (
              <div className="text-center text-body py-12">
                No students found with the selected filters.
              </div>
            )}
          </>
        )}

        {/* Class Leaderboard Tab */}
        {activeTab === 'class' && (
          <div ref={gridRef} className="max-w-4xl mx-auto space-y-4">
            {classRankings.map((classData, index) => (
              <div
                key={classData.class_name}
                className="bubble p-6 rounded-bubble-lg hover:shadow-bubble-hover transition-all"
              >
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center font-bold text-2xl text-ink">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-brand font-bold text-ink mb-2">{classData.class_name}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-body">Avg SGPA</p>
                        <p className="text-xl font-bold text-ink">{classData.avg_cgpa}</p>
                      </div>
                      <div>
                        <p className="text-body">Avg Attendance</p>
                        <p className="text-xl font-bold text-ink">{classData.avg_attendance}%</p>
                      </div>
                      <div>
                        <p className="text-body">Students</p>
                        <p className="text-xl font-bold text-ink">{classData.student_count}</p>
                      </div>
                      {classData.top_student && (
                        <div>
                          <p className="text-body">Top Student</p>
                          <p className="text-base font-semibold text-ink">
                            {classData.top_student.name}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Student Modal */}
      {selectedStudentRoll && (
        <StudentModal 
          rollNo={selectedStudentRoll} 
          onClose={() => setSelectedStudentRoll(null)} 
        />
      )}
    </div>
  )
}
