import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { leaderboardAPI, birthdayAPI } from '../utils/api'
import { formatClassName } from '../utils/format'
import StudentBubble from '../components/StudentBubble'
import ClassStatsSection from '../components/ClassStatsSection'
import StudentModal from '../components/StudentModal'
import SearchInput from '../components/SearchInput'

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

  // Animate hero immediately on mount
  useEffect(() => {
    if (heroRef.current) {
      gsap.fromTo(
        heroRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.5)' }
      )
    }
  }, [])

  useEffect(() => {
    // Animate cards + leaderboard once data loads — only play once
    if (!hasAnimated.current && topStudents.length > 0) {
      hasAnimated.current = true
      const tl = gsap.timeline()
      tl.fromTo(
        top3Ref.current?.children || [],
        { scale: 0, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.5)' }
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
    <div className="min-h-screen px-6 pt-32 md:pt-48 pb-12">
      {/* Hero Section */}
      <div ref={heroRef} className="max-w-6xl mx-auto text-center mb-16 md:mb-24" style={{ opacity: 0 }}>
        <h1 className="text-[60px] md:text-[84px] lg:text-[100px] font-display text-ink mb-6 md:mb-12 leading-none tracking-tight">
          SemRank
        </h1>


        {/* Top 3 Preview */}
        {!loading && topStudents.length > 0 && (
          <>
            <style>{`
              .top3-name {
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
                word-break: break-word;
              }
            `}</style>
            <div ref={top3Ref} className="flex flex-row flex-nowrap justify-center items-end gap-3 md:gap-8 mt-0 py-2 md:py-4 w-full px-2">
              {/** Render in visual order: show 2,1,3 so rank 1 is centered */}
              {(() => {
                const order = topStudents.length >= 3 ? [1, 0, 2] : topStudents.map((_, i) => i)
                return order.map((idx) => {
                  const student = topStudents[idx]
                  if (!student) return null

                  // Original rank for styling (0=1st, 1=2nd, 2=3rd)
                  const origIdx = idx
                  // Rank 1 is taller/higher
                  const isFirst = origIdx === 0

                  // Position classes - center is elevated
                  const posClasses = isFirst
                    ? '-translate-y-3 md:-translate-y-8 z-10'
                    : 'translate-y-0 z-0'

                  // Border colors based on rank
                  const borderClass = origIdx === 0
                    ? 'ring-2 md:ring-4 ring-yellow-400/80' // gold for #1
                    : origIdx === 1
                      ? 'ring-2 md:ring-4 ring-slate-300/60' // silver
                      : 'ring-2 md:ring-4 ring-amber-600/40' // bronze

                  return (
                    <div
                      key={student.student_id}
                      className={`bubble p-2 rounded-xl md:rounded-bubble-lg flex-1 md:flex-none min-w-0 max-w-[32%] md:max-w-none md:w-56 ${posClasses} ${borderClass} bg-bubble transition-transform duration-300 ease-in-out cursor-pointer flex flex-col justify-between min-h-[160px] md:min-h-[340px]`}
                      onClick={() => setSelectedStudentRoll(student.roll_no)}
                    >
                      <div className="text-center w-full">
                        <div className="w-16 h-20 md:w-40 md:h-52 mx-auto mb-2 md:mb-4 relative bg-bubbleSecondary rounded-lg md:rounded-2xl overflow-hidden shadow-sm aspect-[3/4]">
                          {student.student_id ? (
                            <img
                              src={`/student_faces/${student.roll_no}.png`}
                              alt={student.name}
                              width={160}
                              height={208}
                              loading="lazy"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = 'none'
                                e.target.nextSibling.style.display = 'flex'
                              }}
                            />
                          ) : null}
                          <div className="w-full h-full hidden items-center justify-center text-lg md:text-3xl">👤</div>
                        </div>
                        <h3 className="text-xs md:text-lg font-display font-bold text-ink leading-tight mb-1 top3-name px-0.5">
                          {student.name}
                        </h3>
                        <p className="text-[9px] md:text-[10px] text-body truncate opacity-80">Roll: {student.roll_no}</p>
                      </div>

                      <div className="text-center mt-1 md:mt-2">
                        <div className="text-lg md:text-3xl font-bold text-ink leading-none">
                          {student.cgpa}
                        </div>
                        <div className="text-[7px] md:text-[10px] font-bold text-body uppercase tracking-wider mt-0.5">SGPA</div>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>
          </>
        )}
      </div>


      {/* Search Input */}
      <div className="flex justify-center w-full px-4 mb-8 z-20 relative">
        <SearchInput onSelectStudent={setSelectedStudentRoll} />
      </div>

      {/* Quick Leaderboard */}
      <div ref={quickLeaderRef} className="max-w-4xl mx-auto mb-16" style={{ opacity: 0 }}>
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
                        width={48}
                        height={48}
                        loading="lazy"
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
