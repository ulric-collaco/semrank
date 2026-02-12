import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import './LoadingScreen.css'

/**
 * Cinematic intro overlay.
 *
 * The "SemRank" text scales in from 3.5×, then physically flies to the
 * navbar logo position and merges with it — instead of just fading out.
 *
 * Props
 * ─────
 * onReveal   – fires at ~1.5 s when the title finishes scaling
 * onComplete – fires when the text has reached the header, overlay is gone
 */
export default function LoadingScreen({ onReveal, onComplete }) {
    const overlayRef = useRef(null)
    const textRef = useRef(null)
    const glowRef = useRef(null)
    const radialRef = useRef(null)

    useEffect(() => {
        const overlay = overlayRef.current
        const text = textRef.current
        const glow = glowRef.current
        const radial = radialRef.current
        if (!overlay || !text || !glow) return

        /* ── initial state ─────────────────────────────── */
        gsap.set(text, {
            scale: 3.5,
            opacity: 0,
            letterSpacing: '0.5em',
            filter: 'blur(20px)',
        })
        gsap.set(glow, { opacity: 0, scale: 1.6 })
        gsap.set(radial, { opacity: 0 })

        /* ── master timeline ───────────────────────────── */
        const tl = gsap.timeline()

        /* ─── Phase 1 — Title intro  (0 → 1.5 s) ──────── */
        tl.to(text, {
            scale: 1,
            opacity: 1,
            letterSpacing: '0.02em',
            filter: 'blur(0px)',
            duration: 1.5,
            ease: 'power4.out',
        }, 0)

        /* Glow blooms in behind the text */
        tl.to(glow, {
            opacity: 1,
            scale: 1,
            duration: 1.0,
            ease: 'power2.out',
        }, 0.25)

        /* Radial background subtly appears */
        tl.to(radial, {
            opacity: 1,
            duration: 0.8,
            ease: 'power2.out',
        }, 0.4)

        /* Glow softens as title settles */
        tl.to(glow, {
            opacity: 0.35,
            scale: 1.05,
            duration: 0.5,
            ease: 'power2.inOut',
        }, 1.2)

        /* ── signal: content can start fading in ───────── */
        tl.call(() => onReveal?.(), null, 1.5)

        /* ─── Phase 2 — Text flies to navbar logo ──────── */

        // Calculate the navbar logo position:
        // BubbleMenu is fixed, top: 2em, padding: 0 2em, logo-bubble is left-aligned
        // Logo bubble: height ~56px (desktop) or ~48px, padding 0 16px
        // The logo text inside is at ~ left: 2em + 16px, top: 2em + half-height
        // We need to move our centered text to that position

        // The text is currently centered in the viewport (50%, 50%)
        // Target: roughly top-left corner where the navbar logo lives
        const vw = window.innerWidth
        const vh = window.innerHeight
        const isMobile = vw < 768
        const bubbleSize = isMobile ? 48 : 56

        // Logo bubble center position (from CSS):
        // left: 2em (32px) + padding-left (16px) + half of logo text width (~60px)
        // top: 2em (32px) + half of bubble height
        const targetX = 32 + 16 + 60   // ~108px from left
        const targetY = 32 + bubbleSize / 2  // ~60px from top

        // Current position is center of viewport
        const currentX = vw / 2
        const currentY = vh / 2

        // Delta to move (from center to logo position)
        const deltaX = targetX - currentX
        const deltaY = targetY - currentY

        // Scale ratio: navbar logo is 1.5rem (~24px), our text is clamp(2.2rem, 6vw, 4.5rem)
        // Compute actual rendered size
        const textRect = text.getBoundingClientRect()
        const currentFontSize = textRect.height
        const targetFontSize = 24 // 1.5rem
        const targetScale = targetFontSize / currentFontSize

        // Kill the glow and radial as the text starts flying
        tl.to([glow, radial], {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.in',
        }, 1.65)

        // Fly the text to the navbar logo position AND change color to pink
        tl.to(text, {
            x: deltaX,
            y: deltaY,
            scale: targetScale,
            color: '#f582ae', // Match the navbar logo color
            letterSpacing: '0em',
            duration: 0.85,
            ease: 'power3.inOut',
        }, 1.7)

        // Fade out the black overlay as text is flying
        tl.to(overlay, {
            backgroundColor: 'transparent',
            duration: 0.7,
            ease: 'power2.out',
        }, 1.85)

        // Final: fade the text out right as it merges with the logo
        // Slight delay to ensure it lands first
        tl.to(text, {
            opacity: 0,
            duration: 0.2,
            ease: 'power2.in',
        }, 2.45)

        // Make overlay fully transparent & non-interactive
        tl.set(overlay, { opacity: 0 }, 2.6)

        /* ── signal: safe to unmount ────────────────────── */
        tl.call(() => onComplete?.(), null, 2.65)

        return () => tl.kill()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div ref={overlayRef} className="loading-screen" aria-hidden="true">
            <div className="loading-screen__content">
                <div ref={glowRef} className="loading-screen__glow" />
                <div ref={radialRef} className="loading-screen__radial" />
                <h1 ref={textRef} className="loading-screen__title">
                    SemRank
                </h1>
            </div>
        </div>
    )
}
