import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { leaderboardAPI, birthdayAPI } from '../utils/api'
import { formatClassName } from '../utils/format'
import StudentBubble from '../components/StudentBubble'
import ClassStatsSection from '../components/ClassStatsSection'
import StudentModal from '../components/StudentModal'

export default function HomePage() {
  const [topStudents, setTopStudents] = useState([])
  const [quickLeaderboard, setQuickLeaderboard] = useState([])
  const [birthdays, setBirthdays] = useState([])
  const [sortMetric, setSortMetric] = useState('cgpa') // 'cgpa' or 'attendance'
  const [loading, setLoading] = useState(true)
  const [selectedStudentRoll, setSelectedStudentRoll] = useState(null)

  const heroRef = useRef(null)
  const top3Ref = useRef(null)
  const quickLeaderRef = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    // Entrance animations - only play once on mount
    if (!hasAnimated.current && topStudents.length > 0) {
      hasAnimated.current = true
      const tl = gsap.timeline()
      tl.fromTo(
        heroRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.5)' }
      )
        .fromTo(
          top3Ref.current?.children || [],
          { scale: 0, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.5)' },
          '-=0.3'
        )
        .fromTo(
          quickLeaderRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
          '-=0.2'
        )
    }
  }, [topStudents])

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchQuickLeaderboard()
  }, [sortMetric])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [topData, birthdayData] = await Promise.all([
        leaderboardAPI.getTopBySGPA(3, 'all'),
        birthdayAPI.getTodaysBirthdays().catch(() => [])
      ])
      setTopStudents(topData)
      setBirthdays(birthdayData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuickLeaderboard = async () => {
    try {
      const data = sortMetric === 'cgpa'
        ? await leaderboardAPI.getTopBySGPA(5, 'all')
        : await leaderboardAPI.getTopByAttendance(5, 'all')
      setQuickLeaderboard(data)
    } catch (error) {
      console.error('Error fetching quick leaderboard:', error)
    }
  }

  return (
    <div className="min-h-screen px-6 py-20">
      {/* Hero Section */}
      <div ref={heroRef} className="max-w-6xl mx-auto text-center mb-16">
        <h1 className="text-[60px] md:text-[84px] lg:text-[100px] font-display text-ink mb-4 leading-none tracking-tight">
          SemRank
        </h1>


        {/* Top 3 Preview */}
        {!loading && topStudents.length > 0 && (
          <div ref={top3Ref} className="flex flex-col md:flex-row gap-6 justify-center items-center mt-12">
            {topStudents.map((student, index) => (
              <div
                key={student.student_id}
                className={`bubble p-6 rounded-bubble-lg ${index === 0 ? 'md:scale-110 border-accent/50 hover:md:scale-[1.12]' : 'hover:scale-105'} 
                  bg-bubble transition-transform duration-300 ease-in-out cursor-pointer`}
                onClick={() => setSelectedStudentRoll(student.roll_no)}
              >
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-bubbleSecondary rounded-2xl flex items-center justify-center text-4xl mb-3 relative overflow-hidden">
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
                    <div className={student.roll_no ? 'hidden absolute inset-0 bg-bubbleSecondary' : 'absolute inset-0 bg-bubbleSecondary flex items-center justify-center'}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  </div>
                  <h3 className="font-display font-bold text-[18px] md:text-[20px] text-ink mb-1">{student.name}</h3>
                  <p className="text-sm text-body mb-2">Roll: {student.roll_no}</p>
                  <div className="text-[28px] md:text-[36px] font-bold text-ink tabular-nums">{student.cgpa}</div>
                  <p className="text-xs text-body uppercase tracking-wide">SGPA</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Leaderboard */}
      <div ref={quickLeaderRef} className="max-w-4xl mx-auto mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[22px] md:text-[28px] font-display text-ink">📊 Quick Leaderboard</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSortMetric('cgpa')}
              className={`px-4 py-2 rounded-bubble font-medium transition-all ${sortMetric === 'cgpa'
                ? 'bg-accent text-ink'
                : 'bubble bubble-hover'
                }`}
            >
              SGPA
            </button>
            <button
              onClick={() => setSortMetric('attendance')}
              className={`px-4 py-2 rounded-bubble font-medium transition-all ${sortMetric === 'attendance'
                ? 'bg-accent text-ink'
                : 'bubble bubble-hover'
                }`}
            >
              Attendance
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {quickLeaderboard.map((student, index) => (
            <div
              key={student.student_id}
              className="bubble bubble-hover p-4 rounded-bubble flex items-center gap-4 transition-all cursor-pointer"
              onClick={() => setSelectedStudentRoll(student.roll_no)}
            >
              <div className="relative flex items-center">
                <div className="absolute -left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 bg-accent rounded-full flex items-center justify-center font-bold text-ink">
                  #{index + 1}
                </div>
                <div className="w-12 h-12 bg-bubbleSecondary rounded-full overflow-hidden flex items-center justify-center">
                  {student.roll_no ? (
                    <>
                      <img
                        src={`/student_faces/${student.roll_no}.png`}
                        alt={student.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                      />
                      <div className="hidden absolute inset-0 bg-bubbleSecondary flex items-center justify-center text-sm text-ink">🙂</div>
                    </>
                  ) : (
                    <div className="text-sm text-ink">?</div>
                  )}
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold text-ink">{student.name}</h3>
                <p className="text-sm text-body">{formatClassName(student.class)}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-ink">
                  {sortMetric === 'cgpa' ? student.cgpa : `${student.attendance}%`}
                </div>
                <p className="text-xs text-body">{sortMetric === 'cgpa' ? 'SGPA' : 'Attendance'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Birthday Spotlight */}
      {birthdays.length > 0 && (
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-display font-bold text-ink mb-6">🎉 Today's Birthdays</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {birthdays.map((student) => (
              <div
                key={student.student_id}
                className="bubble p-6 rounded-bubble-lg text-center hover:scale-105 transition-transform"
              >
                <div className="text-5xl mb-3">🎂</div>
                <h3 className="font-display font-bold text-ink mb-1">{student.name}</h3>
                <p className="text-body">{student.class}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Class Fun Stats */}
      <div className="max-w-5xl mx-auto mb-12">
        <ClassStatsSection />
      </div>

      {/* Quick Access Buttons */}
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="#leaderboard"
          className="px-8 py-4 bg-accent text-ink rounded-bubble font-semibold text-lg text-center
                   hover:scale-105
                   active:scale-95 transition-all duration-300"
        >
          📊 View Full Leaderboard
        </a>
        <a
          href="#compare"
          className="px-8 py-4 bubble bubble-hover text-ink rounded-bubble font-semibold text-lg text-center
                   hover:scale-105
                   active:scale-95 transition-all duration-300"
        >
          ⚖️ Compare Students
        </a>
        <a
          href="#game"
          className="px-8 py-4 bubble bubble-hover text-ink rounded-bubble font-semibold text-lg text-center
                   hover:scale-105
                   active:scale-95 transition-all duration-300"
        >
          🎮 Play Higher/Lower
        </a>
      </div>

      {/* Class Fun Stats Section */}
      <div className="max-w-5xl mx-auto mt-16">
        <ClassStatsSection />
      </div>

      {/* Footer Tagline */}
      <p className="text-center text-body/70 text-sm mt-16">
        Playful rankings for serious semesters.
      </p>

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
