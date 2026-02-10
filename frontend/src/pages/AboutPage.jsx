export default function AboutPage() {
  return (
    <div className="min-h-screen px-6 py-20">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-ink mb-4">ℹ️ About</h1>
          <p className="text-body text-lg">What is SemRank?</p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <div className="bubble p-8 rounded-bubble-lg shadow-bubble">
            <h2 className="text-2xl font-bold text-ink mb-4">🎈 Our Mission</h2>
            <p className="text-body leading-relaxed">
              SemRank is not about pressure. It's about visibility, curiosity, and fun —
              turning semester data into something students actually want to explore.
            </p>
          </div>

          <div className="bubble p-8 rounded-bubble-lg shadow-bubble">
            <h2 className="text-2xl font-bold text-ink mb-4">✨ What We Do</h2>
            <p className="text-body leading-relaxed mb-4">
              SemRank transforms traditional academic data (marks, CGPA, attendance) into:
            </p>
            <ul className="list-disc list-inside space-y-2 text-body">
              <li>Interactive leaderboards with motion</li>
              <li>Side-by-side student comparisons</li>
              <li>Playful ranking games</li>
              <li>Class insights and statistics</li>
              <li>Personal performance profiles</li>
            </ul>
          </div>

          <div className="bubble p-8 rounded-bubble-lg shadow-bubble">
            <h2 className="text-2xl font-bold text-ink mb-4">🎯 Design Principles</h2>
            <ul className="space-y-2 text-body">
              <li><strong>Playful-first:</strong> Academic data doesn't have to be boring</li>
              <li><strong>Motion matters:</strong> Rankings that feel alive</li>
              <li><strong>Transparent:</strong> All data is visible and straightforward</li>
              <li><strong>Fast:</strong> No waiting, everything precomputed</li>
            </ul>
          </div>

          <div className="bubble p-8 rounded-bubble-lg shadow-bubble">
            <h2 className="text-2xl font-bold text-ink mb-4">⚠️ Important Note</h2>
            <p className="text-body leading-relaxed">
              SemRank is explicitly a <strong>fun project</strong>, not an official academic system.
              All rankings and data visualizations are meant to be engaging and playful.
              This is not meant to create pressure or competition, but to make semester data
              more accessible and interesting.
            </p>
          </div>

          <div className="text-center pt-8">
            <p className="text-body/70 italic">
              "Rankings that move" — SemRank 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
