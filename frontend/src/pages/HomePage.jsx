import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { leaderboardAPI, birthdayAPI } from '../utils/api'
import { formatClassName } from '../utils/format'
import StudentBubble from '../components/StudentBubble'
import ClassStatsSection from '../components/ClassStatsSection'
import StudentModal from '../components/StudentModal'
import SearchInput from '../components/SearchInput'
import ToggleSwitch from '../components/ToggleSwitch'

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

      // Animate Quick Leaderboard
      tl.fromTo(
        quickLeaderRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
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
    <div className="min-h-screen px-6 pt-12 md:pt-16 pb-12">
      {/* Hero Section */}
      <div ref={heroRef} className="max-w-6xl mx-auto text-center mb-8 md:mb-12" style={{ opacity: 0 }}>
        <h1 className="text-[48px] md:text-[72px] lg:text-[90px] font-display text-ink mb-8 md:mb-12 leading-none tracking-tight drop-shadow-xl">
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
                    ? 'ring-2 md:ring-4 ring-yellow-400/80 shadow-[0_0_30px_-5px_rgba(250,204,21,0.3)]' // gold for #1
                    : origIdx === 1
                      ? 'ring-2 md:ring-4 ring-slate-300/60 shadow-[0_0_20px_-5px_rgba(203,213,225,0.2)]' // silver
                      : 'ring-2 md:ring-4 ring-orange-400/60 shadow-[0_0_20px_-5px_rgba(251,146,60,0.2)]' // bronze

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
                          <div className="w-full h-full hidden items-center justify-center text-lg md:text-3xl"></div>
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
      <div ref={quickLeaderRef} className="max-w-6xl mx-auto mb-16" style={{ opacity: 0 }}>
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => window.location.hash = '#leaderboard'}
            className="text-[28px] md:text-[36px] font-display font-black text-ink hover:text-accent transition-colors duration-300 bg-transparent border-none cursor-pointer focus:outline-none p-0 drop-shadow-sm"
          >
            Leaderboard
          </button>
          <ToggleSwitch
            options={[
              { label: 'SGPA', value: 'cgpa' },
              { label: 'Attendance', value: 'attendance' },
            ]}
            activeValue={sortMetric}
            onChange={setSortMetric}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickLeaderboard.map((student, index) => (
            <div
              key={student.student_id}
              className="group relative bg-white/5 border border-white/10 hover:bg-white/10 hover:border-accent/30 p-3 rounded-2xl flex items-center gap-4 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-accent/10"
              onClick={() => setSelectedStudentRoll(student.roll_no)}
            >
              {/* Rank Badge - Integrated nicely */}
              <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 bg-accent/20 rounded-xl border border-accent/20 group-hover:bg-accent/40 transition-colors">
                <span className="text-xl font-display font-black text-accent drop-shadow-sm">#{index + 1}</span>
              </div>

              {/* Face - Rectangle shaped as requested */}
              <div className="relative w-14 h-16 bg-bubbleSecondary rounded-lg overflow-hidden border border-white/10 shadow-inner flex-shrink-0">
                {student.roll_no ? (
                  <>
                    <img
                      src={`/student_faces/${student.roll_no}.png`}
                      alt={student.name}
                      width={56}
                      height={64}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <div className="hidden absolute inset-0 bg-bubbleSecondary flex items-center justify-center text-xs text-ink">IMG</div>
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-xs text-ink">?</div>
                )}
              </div>

              {/* Name & Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="font-display font-bold text-ink text-lg leading-tight truncate pr-2 group-hover:text-accent transition-colors">
                  {student.name}
                </h3>
                <p className="text-xs text-body font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="opacity-70">Class:</span>
                  <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] tracking-wide uppercase">{formatClassName(student.class)}</span>
                </p>
              </div>

              {/* Score - Right Aligned */}
              <div className="text-right pr-2">
                <div className="text-2xl font-black text-white leading-none tracking-tight drop-shadow-md">
                  {sortMetric === 'cgpa' ? student.cgpa : `${student.attendance}%`}
                </div>
                <div className="text-[9px] font-bold text-accent uppercase tracking-wider mt-0.5 opacity-80">
                  {sortMetric === 'cgpa' ? 'SGPA' : 'Attendance'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Birthday Spotlight */}
      {birthdays.length > 0 && (
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-display font-bold text-ink mb-6">Today's Birthdays</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {birthdays.map((student) => (
              <div
                key={student.student_id}
                className="bubble p-6 rounded-bubble-lg text-center hover:scale-105 transition-transform"
              >
                <div className="text-5xl mb-3"></div>
                <h3 className="font-display font-bold text-ink mb-1">{student.name}</h3>
                <p className="text-body">{student.class}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Class Fun Stats */}
      <div className="max-w-6xl mx-auto mb-12">
        <ClassStatsSection />
      </div>

      {/* Quick Access Buttons */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 justify-center">
        <a
          href="#leaderboard"
          className="px-8 py-4 bg-violet-600/80 hover:bg-violet-500 border border-violet-400/30 backdrop-blur-sm text-white rounded-bubble font-semibold text-lg text-center
                   hover:scale-105 shadow-lg shadow-violet-500/20
                   active:scale-95 transition-all duration-300"
        >
          View Full Leaderboard
        </a>
        <a
          href="#compare"
          className="px-8 py-4 bg-blue-600/80 hover:bg-blue-500 border border-blue-400/30 backdrop-blur-sm text-white rounded-bubble font-semibold text-lg text-center
                   hover:scale-105 shadow-lg shadow-blue-500/20
                   active:scale-95 transition-all duration-300"
        >
          Compare Students
        </a>
        <a
          href="#game"
          className="px-8 py-4 bg-cyan-600/80 hover:bg-cyan-500 border border-cyan-400/30 backdrop-blur-sm text-white rounded-bubble font-semibold text-lg text-center
                   hover:scale-105 shadow-lg shadow-cyan-500/20
                   active:scale-95 transition-all duration-300"
        >
          Play Higher/Lower
        </a>
      </div>




      {/* Footer */}
      <footer className="mt-24 pb-12 text-center font-sans">
        <div className="inline-block p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md shadow-2xl hover:bg-white/10 transition-colors duration-300 max-w-lg w-full mx-auto">

          <div className="mb-6">
            <p className="text-body text-sm uppercase tracking-widest font-bold mb-2 opacity-60">Created By</p>
            <a
              href="https://ulriccollaco.me"
              target="_blank"
              rel="noopener noreferrer"
              className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-accent to-purple-400 hover:to-white transition-all duration-300 drop-shadow-sm block"
            >
              Ulric Collaco
            </a>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-sm text-body/70 border-t border-white/5 pt-6 mt-2">

            <p className="flex items-center gap-1">
              <span>Inspired by</span>
              <a
                href="https://whereyoustand.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-accent transition-colors font-semibold"
              >
                Where You Stand
              </a>
            </p>

            <span className="hidden md:inline text-white/10">•</span>

            <p className="flex items-center gap-1">
              <span>By</span>
              <a
                href="https://www.romeirofernandes.tech"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-accent transition-colors font-semibold"
              >
                Romeiro Fernandes
              </a>
            </p>

            <span className="hidden md:inline text-white/10">•</span>

            <a
              href="https://github.com/romeirofernandes/whereyoustand"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 hover:text-white transition-all group border border-white/5"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5 text-yellow-400 group-hover:scale-110 transition-transform fill-yellow-400/20"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              <span>Star Repo</span>
            </a>
          </div>
        </div>
      </footer>

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
