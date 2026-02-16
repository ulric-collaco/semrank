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
        mostBunked: [...classRankings].sort((a, b) => a.avg_attendance - b.avg_attendance)[0],
        bestSubject: subjectStats.length > 0
          ? [...subjectStats].sort((a, b) => b.avg_marks - a.avg_marks)[0]
          : null,
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
      emoji: '🤓',
      label: 'Academic Weapon',
      value: formatClassName(stats.bestSGPA?.class_name) || 'N/A',
      detail: stats.bestSGPA ? `${stats.bestSGPA.avg_cgpa} SGPA` : '',
    },
    {
      emoji: '🏃',
      label: 'Bunk Lords',
      value: formatClassName(stats.mostBunked?.class_name) || 'N/A',
      detail: stats.mostBunked ? `${stats.mostBunked.avg_attendance}% attendance` : '',
    },
    {
      emoji: '🚀',
      label: 'GPA Booster',
      value: stats.bestSubject?.subject_name || 'N/A',
      detail: stats.bestSubject ? `${stats.bestSubject.avg_marks.toFixed(1)} avg marks` : '',
    },
    {
      emoji: '💀',
      label: 'Nightmare Fuel',
      value: stats.worstSubject?.subject_name || 'N/A',
      detail: stats.worstSubject ? `${stats.worstSubject.avg_marks.toFixed(1)} avg marks` : '',
    }
  ]

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="text-center">
        <h2 className="text-3xl font-display font-black text-ink mb-6 drop-shadow-sm">
          Class Wars
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
            <div className={`text-center space-y-3 px-2 ${index === 0 ? 'text-accent' : 'text-ink'}`}>
              <div className="text-5xl drop-shadow-md">{card.emoji}</div>
              <div className="overflow-hidden">
                <p className="text-xs md:text-sm text-body font-bold uppercase tracking-widest mb-2 opacity-80 truncate">
                  {card.label}
                </p>
                <div className="h-16 flex items-center justify-center">
                  <p className="text-2xl md:text-3xl font-display font-black leading-tight text-ink drop-shadow-md line-clamp-2">
                    {card.value}
                  </p>
                </div>
                {card.detail && (
                  <p className="text-sm font-medium text-body/80 mt-2 bg-white/5 inline-block px-3 py-1 rounded-full border border-white/5 truncate max-w-full">
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
