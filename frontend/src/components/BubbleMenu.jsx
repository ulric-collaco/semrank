import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

const menuItems = [
  { id: 'home', label: 'home', icon: '🏠' },
  { id: 'leaderboard', label: 'leaderboard', icon: '🏆' },
  { id: 'compare', label: 'compare', icon: '⚖️' },
  { id: 'game', label: 'game', icon: '🎮' },
  { id: 'about', label: 'about', icon: 'ℹ️' },
]

export default function BubbleMenu({ isOpen, onNavigate, currentPage }) {
  const overlayRef = useRef(null)
  const bubblesRef = useRef([])

  useEffect(() => {
    if (isOpen) {
      // Animate overlay in
      gsap.to(overlayRef.current, {
        opacity: 1,
        pointerEvents: 'auto',
        duration: 0.3,
        ease: 'power2.out',
      })

      // Staggered bubble animation with back.out easing
      gsap.fromTo(
        bubblesRef.current,
        {
          scale: 0,
          opacity: 0,
        },
        {
          scale: 1,
          opacity: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: 'back.out(1.5)',
        }
      )
    } else {
      // Animate out
      gsap.to(overlayRef.current, {
        opacity: 0,
        pointerEvents: 'none',
        duration: 0.3,
        ease: 'power2.in',
      })

      gsap.to(bubblesRef.current, {
        scale: 0,
        opacity: 0,
        duration: 0.2,
        stagger: 0.03,
        ease: 'power2.in',
      })
    }
  }, [isOpen])

  const handleBubbleClick = (page) => {
    // Quick feedback animation
    const bubble = bubblesRef.current[menuItems.findIndex((item) => item.id === page)]
    gsap.to(bubble, {
      scale: 0.9,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut',
      onComplete: () => {
        onNavigate(page)
      },
    })
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-ink/20 backdrop-blur-md z-40 opacity-0 pointer-events-none flex items-center justify-center"
      onClick={() => onNavigate(currentPage)} // Close on overlay click
    >
      <div
        className="flex flex-col gap-6 items-center"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking bubbles
      >
        {menuItems.map((item, index) => (
          <button
            key={item.id}
            ref={(el) => (bubblesRef.current[index] = el)}
            onClick={() => handleBubbleClick(item.id)}
            className={`
              w-48 h-48 rounded-full shadow-bubble-hover
              flex flex-col items-center justify-center gap-3
              transition-all duration-300
              hover:scale-110 active:scale-95
              ${currentPage === item.id ? 'bg-accent' : 'bg-bubble'}
            `}
            aria-label={item.label}
          >
            <span className="text-5xl" role="img" aria-label={item.label}>
              {item.icon}
            </span>
            <span className="text-ink font-medium text-xl lowercase">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
