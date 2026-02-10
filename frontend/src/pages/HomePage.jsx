import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

export default function HomePage({ onNavigate }) {
  const titleRef = useRef(null)
  const taglineRef = useRef(null)
  const ctaRef = useRef(null)

  useEffect(() => {
    // Entrance animations
    const tl = gsap.timeline()

    tl.fromTo(
      titleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: 'back.out(1.5)' }
    )
      .fromTo(
        taglineRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' },
        '-=0.4'
      )
      .fromTo(
        ctaRef.current,
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' },
        '-=0.3'
      )
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <h1
          ref={titleRef}
          className="text-7xl md:text-9xl font-bold text-ink tracking-tight"
        >
          🎈 SemRank
        </h1>

        <p
          ref={taglineRef}
          className="text-2xl md:text-3xl text-body font-medium"
        >
          Rankings that move.
        </p>

        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <button
            onClick={() => onNavigate('leaderboard')}
            className="px-8 py-4 bg-accent text-ink rounded-bubble font-semibold text-lg
                     shadow-bubble hover:shadow-bubble-hover hover:scale-105
                     active:scale-95 transition-all duration-300"
          >
            View Leaderboard
          </button>

          <button
            onClick={() => onNavigate('game')}
            className="px-8 py-4 bubble text-ink rounded-bubble font-semibold text-lg
                     shadow-bubble hover:shadow-bubble-hover hover:scale-105
                     active:scale-95 transition-all duration-300"
          >
            Play Game
          </button>
        </div>

        {/* Tagline */}
        <p className="text-body/70 text-sm pt-12">
          Playful rankings for serious semesters.
        </p>
      </div>
    </div>
  )
}
