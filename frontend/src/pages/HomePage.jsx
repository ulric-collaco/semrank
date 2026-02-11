import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { leaderboardAPI, birthdayAPI } from '../utils/api'
import StudentBubble from '../components/StudentBubble'
import ClassStatsSection from '../components/ClassStatsSection'

export default function HomePage() {
  const [topStudents, setTopStudents] = useState([])
  const [quickLeaderboard, setQuickLeaderboard] = useState([])
  const [birthdays, setBirthdays] = useState([])
  const [sortMetric, setSortMetric] = useState('cgpa') // 'cgpa' or 'attendance'
  const [loading, setLoading] = useState(true)

  const heroRef = useRef(null)
  const top3Ref = useRef(null)
  const quickLeaderRef = useRef(null)

  useEffect(() => {
    // Entrance animations
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
        leaderboardAPI.getTopByCGPA(3, 'all'),
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
        ? await leaderboardAPI.getTopByCGPA(5, 'all')
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
        <h1 className="text-7xl md:text-9xl font-bold text-ink mb-4">
          🎓 SemRank
        </h1>
        <p className="text-2xl md:text-3xl text-body mb-8">
          Rankings that move. Academics that inspire.
        </p>

        {/* Top 3 Preview */}
        {!loading && topStudents.length > 0 && (
          <div ref={top3Ref} className="flex flex-col md:flex-row gap-6 justify-center items-center mt-12">
            {topStudents.map((student, index) => (
              <div
                key={student.student_id}
                className={`bubble p-6 rounded-bubble-lg ${
                  index === 0 ? 'md:scale-110 bg-accent' : 'bg-bubble'
                } hover:scale-105 transition-transform duration-300 cursor-pointer`}
              >
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto bg-bubbleSecondary rounded-full flex items-center justify-center text-4xl mb-3">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                  <h3 className="font-bold text-lg text-ink mb-1">{student.name}</h3>
                  <p className="text-sm text-body mb-2">Roll: {student.roll_no}</p>
                  <div className="text-2xl font-bold text-ink">{student.cgpa}</div>
                  <p className="text-xs text-body">CGPA</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Leaderboard */}
      <div ref={quickLeaderRef} className="max-w-4xl mx-auto mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-ink">📊 Quick Leaderboard</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setSortMetric('cgpa')}
              className={`px-4 py-2 rounded-bubble font-medium transition-all ${
                sortMetric === 'cgpa'
                  ? 'bg-accent text-ink shadow-bubble-hover'
                  : 'bubble hover:shadow-bubble-hover'
              }`}
            >
              CGPA
            </button>
            <button
              onClick={() => setSortMetric('attendance')}
              className={`px-4 py-2 rounded-bubble font-medium transition-all ${
                sortMetric === 'attendance'
                  ? 'bg-accent text-ink shadow-bubble-hover'
                  : 'bubble hover:shadow-bubble-hover'
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
              className="bubble p-4 rounded-bubble flex items-center gap-4 hover:shadow-bubble-hover transition-all"
            >
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center font-bold text-ink">
                #{index + 1}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-ink">{student.name}</h3>
                <p className="text-sm text-body">{student.class}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-ink">
                  {sortMetric === 'cgpa' ? student.cgpa : `${student.attendance}%`}
                </div>
                <p className="text-xs text-body">{sortMetric === 'cgpa' ? 'CGPA' : 'Attendance'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Birthday Spotlight */}
      {birthdays.length > 0 && (
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-ink mb-6">🎉 Today's Birthdays</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {birthdays.map((student) => (
              <div
                key={student.student_id}
                className="bubble p-6 rounded-bubble-lg text-center hover:scale-105 transition-transform"
              >
                <div className="text-5xl mb-3">🎂</div>
                <h3 className="font-bold text-ink mb-1">{student.name}</h3>
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
                   shadow-bubble hover:shadow-bubble-hover hover:scale-105
                   active:scale-95 transition-all duration-300"
        >
          📊 View Full Leaderboard
        </a>
        <a
          href="#compare"
          className="px-8 py-4 bubble text-ink rounded-bubble font-semibold text-lg text-center
                   shadow-bubble hover:shadow-bubble-hover hover:scale-105
                   active:scale-95 transition-all duration-300"
        >
          ⚖️ Compare Students
        </a>
        <a
          href="#game"
          className="px-8 py-4 bubble text-ink rounded-bubble font-semibold text-lg text-center
                   shadow-bubble hover:shadow-bubble-hover hover:scale-105
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
    </div>
  )
}
