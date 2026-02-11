import { useState, useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { studentAPI } from '../utils/api'

export default function ComparePage() {
  const [students, setStudents] = useState([])
  const [student1, setStudent1] = useState(null)
  const [student2, setStudent2] = useState(null)
  const [metric, setMetric] = useState('cgpa')
  const [searchTerm1, setSearchTerm1] = useState('')
  const [searchTerm2, setSearchTerm2] = useState('')
  
  const bubble1Ref = useRef(null)
  const bubble2Ref = useRef(null)

  // Load all students on mount
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await studentAPI.getAllStudents()
        setStudents(data)
      } catch (error) {
        console.error('Error fetching students:', error)
      }
    }
    
    fetchStudents()
  }, [])

  useEffect(() => {
    if (student1 && student2) {
      // Animate comparison
      const winner =
        metric === 'cgpa'
          ? student1.cgpa > student2.cgpa ? bubble1Ref : bubble2Ref
          : student1.attendance > student2.attendance ? bubble1Ref : bubble2Ref

      gsap.to(winner.current, {
        scale: 1.1,
        duration: 0.5,
        ease: 'back.out(1.5)',
        yoyo: true,
        repeat: 1,
      })
    }
  }, [student1, student2, metric])

  const handleSearch1 = (query) => {
    setSearchTerm1(query)
    const found = students.find(
      (s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.roll_no.toString().includes(query)
    )
    if (found) setStudent1(found)
  }

  const handleSearch2 = (query) => {
    setSearchTerm2(query)
    const found = students.find(
      (s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.roll_no.toString().includes(query)
    )
    if (found) setStudent2(found)
  }

  const getWinner = () => {
    if (!student1 || !student2) return null
    if (metric === 'cgpa') {
      return student1.cgpa > student2.cgpa ? student1 : student2
    }
    return student1.attendance > student2.attendance ? student1 : student2
  }

  const winner = getWinner()

  return (
    <div className="min-h-screen px-6 py-20">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-ink mb-4">⚖️ Compare</h1>
          <p className="text-body text-lg">Compare two students side-by-side</p>
        </div>

        {/* Metric Selector */}
        <div className="flex gap-3 justify-center mb-12">
          <button
            onClick={() => setMetric('cgpa')}
            className={`px-6 py-3 rounded-bubble font-medium transition-all duration-300
              ${
                metric === 'cgpa'
                  ? 'bg-accent text-ink shadow-bubble-hover scale-105'
                  : 'bubble hover:scale-105'
              }`}
          >
            CGPA
          </button>
          <button
            onClick={() => setMetric('attendance')}
            className={`px-6 py-3 rounded-bubble font-medium transition-all duration-300
              ${
                metric === 'attendance'
                  ? 'bg-accent text-ink shadow-bubble-hover scale-105'
                  : 'bubble hover:scale-105'
              }`}
          >
            Attendance
          </button>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Student 1 */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search by name or roll no..."
              value={searchTerm1}
              onChange={(e) => handleSearch1(e.target.value)}
              className="w-full px-6 py-4 bubble rounded-bubble text-ink placeholder-body/50
                       focus:outline-none focus:shadow-bubble-hover transition-shadow"
            />
            {student1 && (
              <div
                ref={bubble1Ref}
                className={`p-8 rounded-bubble-lg shadow-bubble transition-all duration-300
                  ${winner === student1 ? 'bg-accent' : 'bubble'}`}
              >
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 mx-auto bg-bubbleSecondary rounded-full flex items-center justify-center text-5xl">
                    👤
                  </div>
                  <h3 className="text-2xl font-bold text-ink">{student1.name}</h3>
                  <p className="text-body">Roll: {student1.roll_no}</p>
                  <p className="text-body">Class: {student1.class}</p>
                  <div className="pt-4 border-t border-ink/10">
                    <p className="text-3xl font-bold text-ink">
                      {metric === 'cgpa' ? student1.cgpa : `${student1.attendance}%`}
                    </p>
                    <p className="text-body text-sm">
                      {metric === 'cgpa' ? 'CGPA' : 'Attendance'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Student 2 */}
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Search by name or roll no..."
              value={searchTerm2}
              onChange={(e) => handleSearch2(e.target.value)}
              className="w-full px-6 py-4 bubble rounded-bubble text-ink placeholder-body/50
                       focus:outline-none focus:shadow-bubble-hover transition-shadow"
            />
            {student2 && (
              <div
                ref={bubble2Ref}
                className={`p-8 rounded-bubble-lg shadow-bubble transition-all duration-300
                  ${winner === student2 ? 'bg-accent' : 'bubble'}`}
              >
                <div className="text-center space-y-4">
                  <div className="w-32 h-32 mx-auto bg-bubbleSecondary rounded-full flex items-center justify-center text-5xl">
                    👤
                  </div>
                  <h3 className="text-2xl font-bold text-ink">{student2.name}</h3>
                  <p className="text-body">Roll: {student2.roll_no}</p>
                  <p className="text-body">Class: {student2.class}</p>
                  <div className="pt-4 border-t border-ink/10">
                    <p className="text-3xl font-bold text-ink">
                      {metric === 'cgpa' ? student2.cgpa : `${student2.attendance}%`}
                    </p>
                    <p className="text-body text-sm">
                      {metric === 'cgpa' ? 'CGPA' : 'Attendance'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Winner Announcement */}
        {winner && (
          <div className="text-center mt-12">
            <p className="text-2xl font-semibold text-ink">
              🎉 {winner.name} has higher {metric === 'cgpa' ? 'CGPA' : 'attendance'}!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
