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
      emoji: '🏆',
      label: 'Best Class by SGPA',
      value: formatClassName(stats.bestSGPA?.class_name) || 'N/A',
      detail: stats.bestSGPA ? `${stats.bestSGPA.avg_cgpa} SGPA` : '',
    },
    {
      emoji: '👑',
      label: 'Best Attendance',
      value: formatClassName(stats.bestAttendance?.class_name) || 'N/A',
      detail: stats.bestAttendance ? `${stats.bestAttendance.avg_attendance}%` : '',
    },
    {
      emoji: '😴',
      label: 'Most Bunked Class',
      value: formatClassName(stats.mostBunked?.class_name) || 'N/A',
      detail: stats.mostBunked ? `${stats.mostBunked.avg_attendance}% attendance` : '',
    },
    {
      emoji: '📉',
      label: 'Worst Performing Subject',
      value: stats.worstSubject?.subject_name || 'N/A',
      detail: stats.worstSubject ? `${stats.worstSubject.avg_marks.toFixed(1)} avg marks` : '',
    }
  ]

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold text-ink mb-2">🎉 Fun Insights</h2>
        <p className="text-body">College stats you didn't know you needed!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {statCards.map((card, index) => (
          <div
            key={index}
            className="bubble p-6 rounded-bubble-lg border border-white/10 hover:border-accent/40
                       hover:scale-105 transition-transform duration-300 bg-bubble"
          >
            <div className="text-center space-y-3">
              <div className="text-5xl">{card.emoji}</div>
              <div>
                <p className="text-sm text-body font-semibold uppercase tracking-wide mb-1">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-ink">{card.value}</p>
                {card.detail && (
                  <p className="text-sm text-body mt-1">{card.detail}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
