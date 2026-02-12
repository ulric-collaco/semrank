import { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { studentAPI } from '../utils/api'

export default function StudentModal({ rollNo, onClose }) {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedSubject, setSelectedSubject] = useState(0)
  
  const modalRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    if (rollNo) {
      fetchStudentDetails(rollNo)
    }
  }, [rollNo])

  const handleClose = useCallback(() => {
    gsap.to(contentRef.current, {
      scale: 0.9,
      y: 50,
      opacity: 0,
      duration: 0.2,
    })
    gsap.to(modalRef.current, {
      opacity: 0,
      duration: 0.2,
      onComplete: onClose
    })
  }, [onClose])

  useEffect(() => {
    // Entrance animation
    if (modalRef.current && contentRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      )
      gsap.fromTo(
        contentRef.current,
        { scale: 0.9, y: 50, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.4, ease: 'back.out(1.5)' }
      )
    }

    // Disable body scroll
    document.body.style.overflow = 'hidden'
    
    // Handle ESC key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.body.style.overflow = 'auto'
      document.removeEventListener('keydown', handleEscape)
    }
  }, [handleClose])

  const fetchStudentDetails = async (roll) => {
    setLoading(true)
    try {
      const data = await studentAPI.getStudentByRoll(roll)
      setStudent(data)
    } catch (error) {
      console.error('Error fetching student:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTopRanks = () => {
    if (!student?.subjects) return []
    
    return student.subjects
      .filter(sub => sub.rank && sub.rank <= 3)
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 3)
  }

  const getMaxMark = () => {
    if (!student?.subjects || !student.subjects[selectedSubject]) return 25
    const currentSubject = student.subjects[selectedSubject]
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

  if (!rollNo) return null

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      onClick={handleClose}
    >
      <div
        ref={contentRef}
        className="bubble rounded-bubble-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 w-10 h-10 bg-bubbleSecondary rounded-full flex items-center justify-center hover:scale-110 transition-transform z-10"
        >
          <span className="text-2xl text-ink">×</span>
        </button>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent mb-4"></div>
            <div className="text-xl text-body">Loading student details...</div>
          </div>
        ) : student ? (
          <div className="p-8">
            {/* ID Card Header */}
            <div className="flex flex-col lg:flex-row gap-8 items-start mb-8">
              {/* Left: Photo & Basic Info */}
              <div className="flex flex-col items-center gap-4 lg:w-64 flex-shrink-0">
                {/* Profile Picture */}
                <div className="w-48 h-48 bg-bubbleSecondary rounded-2xl flex items-center justify-center overflow-hidden border-4 border-accent/40 shadow-lg">
                  {student.roll_no ? (
                    <img 
                      src={`/student_faces/${student.roll_no}.png`}
                      alt={student.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div className={student.roll_no ? 'hidden' : 'flex text-8xl'}>👤</div>
                </div>
                
                {/* Basic Info */}
                <div className="text-center space-y-2 w-full">
                  <h1 className="text-2xl font-brand font-bold text-ink">{student.name}</h1>
                  <div className="space-y-1 text-body text-sm">
                    <p className="font-mono font-semibold text-ink text-lg">{student.roll_no}</p>
                    <p className="text-xs">{student.enrollment_id}</p>
                    <p className="font-medium">{student.class}</p>
                  </div>
                </div>
              </div>

              {/* Right: Stats & Rankings */}
              <div className="flex-1 space-y-6">
                {/* SGPA and Attendance */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-pink-500/30 to-purple-500/30 p-6 rounded-2xl border border-pink-500/40">
                    <div className="text-5xl font-bold text-ink mb-1">{student.cgpa || 'N/A'}</div>
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

                {/* Top Ranks */}
                {getTopRanks().length > 0 && (
                  <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 p-4 rounded-2xl border border-yellow-500/30">
                    <h3 className="text-lg font-brand font-bold text-ink mb-2 flex items-center gap-2">
                      <span>🏆</span> Top Subject Ranks
                    </h3>
                    <div className="space-y-1">
                      {getTopRanks().map((subject) => (
                        <div key={subject.subject_id} className="text-sm text-ink">
                          <span className="font-bold">#{subject.rank}</span> in {subject.subject_name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subject Details */}
            {student.subjects && student.subjects.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-brand font-bold text-ink">📚 Subject Performance</h2>
                
                {/* Subject Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {student.subjects.map((subject, index) => (
                    <button
                      key={subject.subject_id}
                      onClick={() => setSelectedSubject(index)}
                      className={`px-4 py-2 rounded-bubble font-medium whitespace-nowrap transition-all ${
                        selectedSubject === index
                          ? 'bg-accent text-ink shadow-bubble-hover'
                          : 'bubble hover:scale-105'
                      }`}
                    >
                      {subject.subject_code}
                    </button>
                  ))}
                </div>

                {/* Selected Subject Details */}
                {student.subjects[selectedSubject] && (
                  <div className="bubble p-6 rounded-bubble-lg">
                    <div className="mb-4">
                      <h3 className="text-xl font-brand font-bold text-ink">{student.subjects[selectedSubject].subject_name}</h3>
                      {student.subjects[selectedSubject].rank && (
                        <p className="text-body">Rank: #{student.subjects[selectedSubject].rank}</p>
                      )}
                    </div>

                    {/* Bar Chart */}
                    <div className="grid grid-cols-6 gap-4 mb-6">
                      {/* ESE */}
                      <div className="space-y-2">
                        <div className="h-48 bg-bubbleSecondary/30 rounded-t-lg flex flex-col justify-end p-2">
                          <div 
                            className="bg-gradient-to-t from-pink-500 to-pink-400 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                            style={{ height: `${((student.subjects[selectedSubject].ese || 0) / getMaxMark()) * 100}%` }}
                          >
                            <span className="text-white font-bold text-lg">{student.subjects[selectedSubject].ese || 0}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-body text-sm">ESE</div>
                          <div className="text-2xl font-bold text-ink">{student.subjects[selectedSubject].ese || 0}</div>
                        </div>
                      </div>

                      {/* MSE */}
                      <div className="space-y-2">
                        <div className="h-48 bg-bubbleSecondary/30 rounded-t-lg flex flex-col justify-end p-2">
                          <div 
                            className="bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                            style={{ height: `${((student.subjects[selectedSubject].mse || 0) / getMaxMark()) * 100}%` }}
                          >
                            <span className="text-white font-bold text-lg">{student.subjects[selectedSubject].mse || 0}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-body text-sm">MSE</div>
                          <div className="text-2xl font-bold text-ink">{student.subjects[selectedSubject].mse || 0}</div>
                        </div>
                      </div>

                      {/* PR-ISE1 */}
                      <div className="space-y-2">
                        <div className="h-48 bg-bubbleSecondary/30 rounded-t-lg flex flex-col justify-end p-2">
                          <div 
                            className="bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                            style={{ height: `${((student.subjects[selectedSubject].pr_ise1 || 0) / getMaxMark()) * 100}%` }}
                          >
                            <span className="text-white font-bold text-lg">{student.subjects[selectedSubject].pr_ise1 || 0}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-body text-sm">PR-ISE1</div>
                          <div className="text-2xl font-bold text-ink">{student.subjects[selectedSubject].pr_ise1 || 0}</div>
                        </div>
                      </div>

                      {/* PR-ISE2 */}
                      <div className="space-y-2">
                        <div className="h-48 bg-bubbleSecondary/30 rounded-t-lg flex flex-col justify-end p-2">
                          <div 
                            className="bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                            style={{ height: `${((student.subjects[selectedSubject].pr_ise2 || 0) / getMaxMark()) * 100}%` }}
                          >
                            <span className="text-white font-bold text-lg">{student.subjects[selectedSubject].pr_ise2 || 0}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-body text-sm">PR-ISE2</div>
                          <div className="text-2xl font-bold text-ink">{student.subjects[selectedSubject].pr_ise2 || 0}</div>
                        </div>
                      </div>

                      {/* TH-ISE1 */}
                      <div className="space-y-2">
                        <div className="h-48 bg-bubbleSecondary/30 rounded-t-lg flex flex-col justify-end p-2">
                          <div 
                            className="bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                            style={{ height: `${((student.subjects[selectedSubject].th_ise1 || 0) / getMaxMark()) * 100}%` }}
                          >
                            <span className="text-white font-bold text-lg">{student.subjects[selectedSubject].th_ise1 || 0}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-body text-sm">TH-ISE1</div>
                          <div className="text-2xl font-bold text-ink">{student.subjects[selectedSubject].th_ise1 || 0}</div>
                        </div>
                      </div>

                      {/* TH-ISE2 */}
                      <div className="space-y-2">
                        <div className="h-48 bg-bubbleSecondary/30 rounded-t-lg flex flex-col justify-end p-2">
                          <div 
                            className="bg-gradient-to-t from-yellow-500 to-yellow-400 rounded-t-lg transition-all duration-500 flex items-end justify-center pb-2"
                            style={{ height: `${((student.subjects[selectedSubject].th_ise2 || 0) / getMaxMark()) * 100}%` }}
                          >
                            <span className="text-gray-900 font-bold text-lg">{student.subjects[selectedSubject].th_ise2 || 0}</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-body text-sm">TH-ISE2</div>
                          <div className="text-2xl font-bold text-ink">{student.subjects[selectedSubject].th_ise2 || 0}</div>
                        </div>
                      </div>
                    </div>

                    {/* Total Marks */}
                    <div className="bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-blue-500/30 p-6 rounded-2xl border border-accent/40 flex justify-between items-center">
                      <span className="text-2xl font-bold text-ink">Total Marks</span>
                      <span className="text-5xl font-bold text-ink">{student.subjects[selectedSubject].total_marks || 0}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 text-center">
            <p className="text-xl text-body">Student not found</p>
          </div>
        )}
      </div>
    </div>
  )
}
