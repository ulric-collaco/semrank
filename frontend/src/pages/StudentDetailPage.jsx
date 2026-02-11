import { useState, useEffect } from 'react'
import { studentAPI } from '../utils/api'

export default function StudentDetailPage() {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get identifier from URL hash query parameter
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1])
    const identifier = urlParams.get('id')
    
    if (identifier) {
      fetchStudentDetails(identifier)
    } else {
      setError('No student identifier provided')
      setLoading(false)
    }
  }, [])

  const fetchStudentDetails = async (identifier) => {
    setLoading(true)
    setError(null)
    try {
      // Try to fetch by roll number first, then enrollment ID
      let data
      if (identifier.startsWith('2') && identifier.length > 5) {
        // Likely enrollment ID
        data = await studentAPI.getStudentByEnrollment(identifier)
      } else {
        // Likely roll number
        data = await studentAPI.getStudentByRoll(identifier)
      }
      setStudent(data)
    } catch (err) {
      console.error('Error fetching student:', err)
      setError('Student not found')
    } finally {
      setLoading(false)
    }
  }

  const getBadges = () => {
    if (!student) return []
    const badges = []
    
    // Top 10 badge
    if (student.rank_cgpa_college && student.rank_cgpa_college <= 10) {
      badges.push({ emoji: '🏆', label: 'Top 10 in College', color: 'bg-yellow-100 text-yellow-800' })
    }
    
    // Attendance King badge (>95%)
    if (student.attendance && parseFloat(student.attendance) >= 95) {
      badges.push({ emoji: '👑', label: 'Attendance King', color: 'bg-blue-100 text-blue-800' })
    }
    
    // Subject Topper badge (if rank 1 in any subject)
    if (student.subjects && student.subjects.some(s => s.rank === 1)) {
      badges.push({ emoji: '🎓', label: 'Subject Topper', color: 'bg-purple-100 text-purple-800' })
    }
    
    return badges
  }

  const goBack = () => {
    window.location.hash = '#home'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-body">Loading student details...</div>
      </div>
    )
  }

  if (error || !student) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-4">
          <p className="text-2xl text-ink font-bold">❌ {error || 'Student not found'}</p>
          <button
            onClick={goBack}
            className="px-6 py-3 bg-accent text-ink rounded-bubble font-semibold
                     shadow-bubble hover:shadow-bubble-hover hover:scale-105
                     active:scale-95 transition-all duration-300"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  const badges = getBadges()

  return (
    <div className="min-h-screen px-6 py-20">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Back Button */}
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-body hover:text-ink transition-colors"
        >
          <span>←</span>
          <span>Back</span>
        </button>

        {/* Identity Section */}
        <div className="bubble p-8 rounded-bubble-lg shadow-bubble">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Profile Picture */}
            <div className="w-32 h-32 bg-bubbleSecondary rounded-full flex items-center justify-center text-6xl flex-shrink-0">
              👤
            </div>

            {/* Identity Info */}
            <div className="flex-1 text-center md:text-left space-y-3">
              <h1 className="text-4xl font-bold text-ink">{student.name}</h1>
              <div className="space-y-2 text-body">
                <p><span className="font-semibold">Roll No:</span> {student.roll_no}</p>
                <p><span className="font-semibold">Enrollment ID:</span> {student.enrollment_id}</p>
                <p><span className="font-semibold">Class:</span> {student.class}</p>
              </div>

              {/* Badges */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-center md:justify-start pt-3">
                  {badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className={`px-3 py-1 ${badge.color} rounded-full text-sm font-medium flex items-center gap-1`}
                    >
                      <span>{badge.emoji}</span>
                      <span>{badge.label}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Academic Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* CGPA */}
          <div className="bubble p-6 rounded-bubble-lg shadow-bubble text-center">
            <div className="text-5xl font-bold text-ink mb-2">{student.cgpa || 'N/A'}</div>
            <div className="text-body text-sm uppercase tracking-wide">CGPA</div>
          </div>

          {/* Attendance */}
          <div className="bubble p-6 rounded-bubble-lg shadow-bubble text-center">
            <div className="text-5xl font-bold text-ink mb-2">{student.attendance || 'N/A'}%</div>
            <div className="text-body text-sm uppercase tracking-wide">Attendance</div>
          </div>

          {/* Total Marks */}
          <div className="bubble p-6 rounded-bubble-lg shadow-bubble text-center">
            <div className="text-5xl font-bold text-ink mb-2">{student.total_marks || 'N/A'}</div>
            <div className="text-body text-sm uppercase tracking-wide">Total Marks</div>
          </div>
        </div>

        {/* Rankings Card */}
        <div className="bubble p-6 rounded-bubble-lg shadow-bubble">
          <h2 className="text-2xl font-bold text-ink mb-4">🏆 Rankings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center md:text-left">
              <div className="text-3xl font-bold text-ink">#{student.rank_cgpa_college || 'N/A'}</div>
              <div className="text-body">College Rank (CGPA)</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-3xl font-bold text-ink">#{student.rank_cgpa_class || 'N/A'}</div>
              <div className="text-body">Class Rank (CGPA)</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-3xl font-bold text-ink">#{student.rank_attendance_college || 'N/A'}</div>
              <div className="text-body">College Rank (Attendance)</div>
            </div>
            <div className="text-center md:text-left">
              <div className="text-3xl font-bold text-ink">#{student.rank_attendance_class || 'N/A'}</div>
              <div className="text-body">Class Rank (Attendance)</div>
            </div>
          </div>
        </div>

        {/* Subject Breakdown */}
        {student.subjects && student.subjects.length > 0 && (
          <div className="bubble p-6 rounded-bubble-lg shadow-bubble">
            <h2 className="text-2xl font-bold text-ink mb-4">📚 Subject Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ink/10">
                    <th className="text-left py-3 px-2 text-body font-semibold">Subject</th>
                    <th className="text-center py-3 px-2 text-body font-semibold">MSE</th>
                    <th className="text-center py-3 px-2 text-body font-semibold">TH ISE1</th>
                    <th className="text-center py-3 px-2 text-body font-semibold">TH ISE2</th>
                    <th className="text-center py-3 px-2 text-body font-semibold">ESE</th>
                    <th className="text-center py-3 px-2 text-body font-semibold">PR ISE1</th>
                    <th className="text-center py-3 px-2 text-body font-semibold">PR ISE2</th>
                    <th className="text-center py-3 px-2 text-ink font-bold">Total</th>
                    <th className="text-center py-3 px-2 text-body font-semibold">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {student.subjects.map((subject, idx) => (
                    <tr key={idx} className="border-b border-ink/5 hover:bg-bubbleSecondary/30 transition-colors">
                      <td className="py-3 px-2 font-medium text-ink">{subject.subject_name}</td>
                      <td className="text-center py-3 px-2 text-body">{subject.mse || '-'}</td>
                      <td className="text-center py-3 px-2 text-body">{subject.th_ise1 || '-'}</td>
                      <td className="text-center py-3 px-2 text-body">{subject.th_ise2 || '-'}</td>
                      <td className="text-center py-3 px-2 text-body">{subject.ese || '-'}</td>
                      <td className="text-center py-3 px-2 text-body">{subject.pr_ise1 || '-'}</td>
                      <td className="text-center py-3 px-2 text-body">{subject.pr_ise2 || '-'}</td>
                      <td className="text-center py-3 px-2 font-bold text-ink">{subject.total_marks || '-'}</td>
                      <td className="text-center py-3 px-2">
                        <span className="px-2 py-1 bg-bubbleSecondary rounded-full text-sm font-medium text-ink">
                          #{subject.rank || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
