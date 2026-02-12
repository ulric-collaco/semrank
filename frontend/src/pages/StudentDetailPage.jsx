import { useState, useEffect } from 'react'
import { studentAPI } from '../utils/api'

export default function StudentDetailPage() {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedSubject, setSelectedSubject] = useState(0)

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
      badges.push({ emoji: '🏆', label: 'Top 10 in College', color: 'bg-yellow-500/20 text-yellow-800 border border-yellow-500/30' })
    }
    
    // Attendance King badge (>95%)
    if (student.attendance && parseFloat(student.attendance) >= 95) {
      badges.push({ emoji: '👑', label: 'Attendance King', color: 'bg-blue-500/20 text-blue-800 border border-blue-500/30' })
    }
    
    // Subject Topper badge (if rank 1 in any subject)
    if (student.subjects && student.subjects.some(s => s.rank === 1)) {
      badges.push({ emoji: '🎓', label: 'Subject Topper', color: 'bg-purple-500/20 text-purple-800 border border-purple-500/30' })
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
  const photoPath = student.roll_no ? `/student_faces/${student.roll_no}.png` : null
  
  // Get current subject for detailed view
  const currentSubject = student.subjects && student.subjects[selectedSubject]
  
  // Calculate max mark for chart scaling
  const getMaxMark = () => {
    if (!currentSubject) return 25
    const marks = [
      currentSubject.ese || 0,
      currentSubject.mse || 0,
      currentSubject.pr_ise1 || 0,
      currentSubject.pr_ise2 || 0,
      currentSubject.th_ise1 || 0,
      currentSubject.th_ise2 || 0
    ]
    return Math.max(...marks, 25)
  }
  
  const maxMark = getMaxMark()

  return (
    <div className="min-h-screen px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-body hover:text-ink transition-colors text-lg"
        >
          <span>←</span>
          <span>Back</span>
        </button>

        {/* ID Card Style Header */}
        <div className="bubble p-8 rounded-bubble-lg shadow-bubble">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left: Photo & Identity */}
            <div className="flex flex-col items-center gap-4 lg:w-64 flex-shrink-0">
              {/* Profile Picture */}
              <div className="w-48 h-48 bg-bubbleSecondary rounded-2xl flex items-center justify-center overflow-hidden border-4 border-accent/40 shadow-lg">
                {photoPath ? (
                  <img 
                    src={photoPath} 
                    alt={student.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none'
                      e.target.nextSibling.style.display = 'flex'
                    }}
                  />
                ) : null}
                <div className={photoPath ? 'hidden' : 'flex text-8xl'}>👤</div>
              </div>
              
              {/* Basic Info */}
              <div className="text-center space-y-2 w-full">
                <h1 className="text-2xl font-bold text-ink">{student.name}</h1>
                <div className="space-y-1 text-body text-sm">
                  <p className="font-mono font-semibold text-ink text-lg">{student.roll_no}</p>
                  <p className="text-xs">{student.enrollment_id}</p>
                  <p className="font-medium">{student.class}</p>
                </div>
              </div>
            </div>

            {/* Right: Stats Grid */}
            <div className="flex-1 space-y-6">
              {/* Top Row: SGPA and Attendance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-pink-500/30 to-purple-500/30 p-6 rounded-2xl border border-pink-500/40">
                  <div className="text-5xl font-bold text-ink mb-1">{student.sgpa || 'N/A'}</div>
                  <div className="text-body text-sm uppercase tracking-wide">SGPA</div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/30 to-cyan-500/30 p-6 rounded-2xl border border-blue-500/40">
                  <div className="text-5xl font-bold text-ink mb-1">{student.attendance || 'N/A'}%</div>
                  <div className="text-body text-sm uppercase tracking-wide">Attendance</div>
                </div>
              </div>

              {/* Rankings Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-bubbleSecondary/50 p-4 rounded-xl text-center border border-pink-500/20">
                  <div className="text-2xl font-bold text-pink-700">#{student.rank_cgpa_college || 'N/A'}</div>
                  <div className="text-xs text-body mt-1">College SGPA</div>
                </div>
                <div className="bg-bubbleSecondary/50 p-4 rounded-xl text-center border border-purple-500/20">
                  <div className="text-2xl font-bold text-purple-700">#{student.rank_cgpa_class || 'N/A'}</div>
                  <div className="text-xs text-body mt-1">Class SGPA</div>
                </div>
                <div className="bg-bubbleSecondary/50 p-4 rounded-xl text-center border border-blue-500/20">
                  <div className="text-2xl font-bold text-blue-700">#{student.rank_attendance_college || 'N/A'}</div>
                  <div className="text-xs text-body mt-1">College Attend.</div>
                </div>
                <div className="bg-bubbleSecondary/50 p-4 rounded-xl text-center border border-cyan-500/20">
                  <div className="text-2xl font-bold text-cyan-700">#{student.rank_attendance_class || 'N/A'}</div>
                  <div className="text-xs text-body mt-1">Class Attend.</div>
                </div>
              </div>

              {/* Badges */}
              {badges.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge, idx) => (
                    <span
                      key={idx}
                      className={`px-4 py-2 ${badge.color} rounded-full text-sm font-medium flex items-center gap-2`}
                    >
                      <span className="text-lg">{badge.emoji}</span>
                      <span>{badge.label}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Subject-wise Performance */}
        {student.subjects && student.subjects.length > 0 && (
          <div className="bubble p-6 rounded-bubble-lg shadow-bubble">
            {/* Last Updated */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-ink">📊 Subject Performance</h2>
              <p className="text-sm text-body">Last updated: {new Date(student.updated_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>

            {/* Subject Tabs */}
            <div className="flex flex-wrap gap-2 mb-6 overflow-x-auto pb-2">
              {student.subjects.map((subject, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedSubject(idx)}
                  className={`px-4 py-2 rounded-full font-medium transition-all whitespace-nowrap
                    ${selectedSubject === idx 
                      ? 'bg-accent text-ink shadow-lg scale-105' 
                      : 'bg-bubbleSecondary/50 text-body hover:bg-bubbleSecondary hover:scale-102'
                    }`}
                >
                  {subject.subject_name}
                </button>
              ))}
            </div>

            {/* Current Subject Details */}
            {currentSubject && (
              <div className="space-y-6">
                {/* Bar Chart */}
                <div className="space-y-4">
                  <div className="grid grid-cols-6 gap-4">
                    {/* ESE */}
                    <div className="space-y-2">
                      <div className="h-48 bg-bubbleSecondary/30 rounded-t-lg flex flex-col justify-end p-2">
                        <div 
                          className="bg-gradient-to-t from-pink-500 to-pink-400 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                          style={{ height: `${((currentSubject.ese || 0) / maxMark) * 100}%` }}
                        >
                          <span className="text-white font-bold text-lg">{currentSubject.ese || 0}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-body text-sm">ESE</div>
                        <div className="text-2xl font-bold text-ink">{currentSubject.ese || 0}</div>
                      </div>
                    </div>

                    {/* MSE */}
                    <div className="space-y-2">
                      <div className="h-48 bg-bubbleSecondary/30 rounded-t-lg flex flex-col justify-end p-2">
                        <div 
                          className="bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                          style={{ height: `${((currentSubject.mse || 0) / maxMark) * 100}%` }}
                        >
                          <span className="text-white font-bold text-lg">{currentSubject.mse || 0}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-body text-sm">MSE</div>
                        <div className="text-2xl font-bold text-ink">{currentSubject.mse || 0}</div>
                      </div>
                    </div>

                    {/* PR-ISE1 */}
                    <div className="space-y-2">
                      <div className="h-48 bg-bubbleSecondary/30 rounded-t-lg flex flex-col justify-end p-2">
                        <div 
                          className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                          style={{ height: `${((currentSubject.pr_ise1 || 0) / maxMark) * 100}%` }}
                        >
                          <span className="text-white font-bold text-lg">{currentSubject.pr_ise1 || 0}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-body text-sm">PR-ISE1</div>
                        <div className="text-2xl font-bold text-ink">{currentSubject.pr_ise1 || 0}</div>
                      </div>
                    </div>

                    {/* PR-ISE2 */}
                    <div className="space-y-2">
                      <div className="h-48 bg-bubbleSecondary/30 rounded-t-lg flex flex-col justify-end p-2">
                        <div 
                          className="bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                          style={{ height: `${((currentSubject.pr_ise2 || 0) / maxMark) * 100}%` }}
                        >
                          <span className="text-white font-bold text-lg">{currentSubject.pr_ise2 || 0}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-body text-sm">PR-ISE2</div>
                        <div className="text-2xl font-bold text-ink">{currentSubject.pr_ise2 || 0}</div>
                      </div>
                    </div>

                    {/* TH-ISE1 */}
                    <div className="space-y-2">
                      <div className="h-48 bg-bubbleSecondary/30 rounded-t-lg flex flex-col justify-end p-2">
                        <div 
                          className="bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                          style={{ height: `${((currentSubject.th_ise1 || 0) / maxMark) * 100}%` }}
                        >
                          <span className="text-white font-bold text-lg">{currentSubject.th_ise1 || 0}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-body text-sm">TH-ISE1</div>
                        <div className="text-2xl font-bold text-ink">{currentSubject.th_ise1 || 0}</div>
                      </div>
                    </div>

                    {/* TH-ISE2 */}
                    <div className="space-y-2">
                      <div className="h-48 bg-bubbleSecondary/30 rounded-t-lg flex flex-col justify-end p-2">
                        <div 
                          className="bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                          style={{ height: `${((currentSubject.th_ise2 || 0) / maxMark) * 100}%` }}
                        >
                          <span className="text-gray-900 font-bold text-lg">{currentSubject.th_ise2 || 0}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-body text-sm">TH-ISE2</div>
                        <div className="text-2xl font-bold text-ink">{currentSubject.th_ise2 || 0}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Marks Banner */}
                <div className="bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-blue-500/30 p-6 rounded-2xl border border-accent/40 flex justify-between items-center">
                  <span className="text-2xl font-bold text-ink">Total Marks</span>
                  <span className="text-5xl font-bold text-ink">{currentSubject.total_marks || 0}</span>
                </div>

                {/* Subject Rank */}
                <div className="flex justify-center">
                  <div className="bg-bubbleSecondary/50 px-8 py-4 rounded-2xl border border-accent/30">
                    <span className="text-body text-sm uppercase tracking-wide mr-3">Class Rank:</span>
                    <span className="text-3xl font-bold text-accent">#{currentSubject.rank || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* All Subjects Table */}
        {student.subjects && student.subjects.length > 0 && (
          <div className="bubble p-6 rounded-bubble-lg shadow-bubble">
            <h2 className="text-2xl font-bold text-ink mb-4">📋 Complete Marksheet</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-accent/30">
                    <th className="text-left py-3 px-2 text-ink font-bold">Subject</th>
                    <th className="text-center py-3 px-2 text-body font-semibold">MSE</th>
                    <th className="text-center py-3 px-2 text-body font-semibold">TH ISE1</th>
                    <th className="text-center py-3 px-2 text-body font-semibold">TH ISE2</th>
                    <th className="text-center py-3 px-2 text-body font-semibold">ESE</th>
                    <th className="text-center py-3 px-2 text-body font-semibold">PR ISE1</th>
                    <th className="text-center py-3 px-2 text-body font-semibold">PR ISE2</th>
                    <th className="text-center py-3 px-2 text-ink font-bold">Total</th>
                    <th className="text-center py-3 px-2 text-ink font-bold">Rank</th>
                  </tr>
                </thead>
                <tbody>
                  {student.subjects.map((subject, idx) => (
                    <tr 
                      key={idx} 
                      className={`border-b border-ink/5 hover:bg-bubbleSecondary/30 transition-all cursor-pointer
                        ${selectedSubject === idx ? 'bg-accent/10' : ''}`}
                      onClick={() => setSelectedSubject(idx)}
                    >
                      <td className="py-3 px-2 font-medium text-ink">{subject.subject_name}</td>
                      <td className="text-center py-3 px-2 text-body">{subject.mse || '-'}</td>
                      <td className="text-center py-3 px-2 text-body">{subject.th_ise1 || '-'}</td>
                      <td className="text-center py-3 px-2 text-body">{subject.th_ise2 || '-'}</td>
                      <td className="text-center py-3 px-2 text-body">{subject.ese || '-'}</td>
                      <td className="text-center py-3 px-2 text-body">{subject.pr_ise1 || '-'}</td>
                      <td className="text-center py-3 px-2 text-body">{subject.pr_ise2 || '-'}</td>
                      <td className="text-center py-3 px-2 font-bold text-ink text-lg">{subject.total_marks || '-'}</td>
                      <td className="text-center py-3 px-2">
                        <span className="px-3 py-1 bg-accent/20 rounded-full text-sm font-bold text-ink">
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
