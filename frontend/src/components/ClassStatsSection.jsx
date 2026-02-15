import { useState, useEffect } from 'react'
import { leaderboardAPI, statsAPI } from '../utils/api'
import { formatClassName } from '../utils/format'

export default function ClassStatsSection() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFunStats()
  }, [])

  const fetchFunStats = async () => {
    setLoading(true)
    try {
      // Fetch class rankings and subject stats in parallel
      const [classRankings, subjectStats] = await Promise.all([
        leaderboardAPI.getClassRankings(),
        statsAPI.getSubjectStats('all')
      ])

      // Calculate fun insights
      const insights = {
        bestSGPA: classRankings[0], // First in rankings
        bestAttendance: [...classRankings].sort((a, b) => b.avg_attendance - a.avg_attendance)[0],
        mostBunked: [...classRankings].sort((a, b) => a.avg_attendance - b.avg_attendance)[0],
        worstSubject: subjectStats.length > 0
          ? [...subjectStats].sort((a, b) => a.avg_marks - b.avg_marks)[0]
          : null
      }

      setStats(insights)
    } catch (error) {
      console.error('Error fetching fun stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bubble p-6 rounded-bubble-lg text-center border border-white/10">
        <div className="text-body">Loading fun stats...</div>
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    {
      emoji: '',
      label: 'Best Class by SGPA',
      value: formatClassName(stats.bestSGPA?.class_name) || 'N/A',
      detail: stats.bestSGPA ? `${stats.bestSGPA.avg_cgpa} SGPA` : '',
    },
    {
      emoji: '',
      label: 'Best Attendance',
      value: formatClassName(stats.bestAttendance?.class_name) || 'N/A',
      detail: stats.bestAttendance ? `${stats.bestAttendance.avg_attendance}%` : '',
    },
    {
      emoji: '',
      label: 'Most Bunked Class',
      value: formatClassName(stats.mostBunked?.class_name) || 'N/A',
      detail: stats.mostBunked ? `${stats.mostBunked.avg_attendance}% attendance` : '',
    },
    {
      emoji: '',
      label: 'Worst Performing Subject',
      value: stats.worstSubject?.subject_name || 'N/A',
      detail: stats.worstSubject ? `${stats.worstSubject.avg_marks.toFixed(1)} avg marks` : '',
    }
  ]

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center">
        <h2 className="text-3xl font-display font-black text-ink mb-6 drop-shadow-sm">
          Fun Insights
        </h2>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bubble p-6 rounded-bubble-lg hover:border-accent/40
                       hover:scale-105 transition-transform duration-300"
          >
            <div className={`text-center space-y-3 ${index === 0 ? 'text-accent' : 'text-ink'}`}>
              <div className="text-5xl drop-shadow-md">{card.emoji}</div>
              <div>
                <p className="text-xs md:text-sm text-body font-bold uppercase tracking-widest mb-2 opacity-80">
                  {card.label}
                </p>
                <p className="text-3xl font-display font-black leading-none text-ink drop-shadow-md">
                  {card.value}
                </p>
                {card.detail && (
                  <p className="text-sm font-medium text-body/80 mt-2 bg-white/5 inline-block px-3 py-1 rounded-full border border-white/5">
                    {card.detail}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
