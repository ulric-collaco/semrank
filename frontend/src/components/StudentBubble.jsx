import { useRef, useEffect } from 'react'
import { gsap } from 'gsap'
import { formatClassName } from '../utils/format'

export default function StudentBubble({ student, rank, onStudentClick }) {
  const bubbleRef = useRef(null)

  useEffect(() => {
    // Entrance animation
    gsap.fromTo(
      bubbleRef.current,
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.5)' }
    )
  }, [])

  const handleHover = () => {
    gsap.to(bubbleRef.current, {
      scale: 1.06,
      boxShadow: '0 12px 32px rgba(0, 24, 88, 0.15)',
      duration: 0.3,
      ease: 'power2.out',
    })
  }

  const handleHoverExit = () => {
    gsap.to(bubbleRef.current, {
      scale: 1,
      boxShadow: '0 8px 24px rgba(0, 24, 88, 0.1)',
      duration: 0.3,
      ease: 'power2.out',
    })
  }

  const handleClick = () => {
    if (onStudentClick) {
      onStudentClick(student.roll_no)
    } else {
      // Fallback to navigation if no onClick provided
      const identifier = student.roll_no || student.enrollment_id
      window.location.hash = `#student?id=${identifier}`
    }
  }

  // Get student photo path - photos are in student_faces folder by roll number
  const getPhotoPath = () => {
    if (!student.roll_no) return null
    try {
      // Photos are stored as student_faces/{roll_no}.png
      return `/student_faces/${student.roll_no}.png`
    } catch {
      return null
    }
  }

  const photoPath = getPhotoPath()

  return (
    <div
      ref={bubbleRef}
      onMouseEnter={handleHover}
      onMouseLeave={handleHoverExit}
      onClick={handleClick}
      className="bubble p-6 rounded-bubble-lg shadow-bubble cursor-pointer relative"
      style={{ opacity: 0 }}
    >
      {/* Rank Badge */}
      <div className="absolute -top-3 -right-3 w-12 h-12 bg-accent rounded-full flex items-center justify-center shadow-bubble">
        <span className="text-ink font-bold text-lg">#{rank}</span>
      </div>

      <div className="text-center space-y-3">
        {/* Photo */}
        <div className="w-24 h-24 mx-auto bg-bubbleSecondary rounded-full flex items-center justify-center text-4xl relative overflow-hidden">
          {photoPath ? (
            <img
              src={photoPath}
              alt={student.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none'
                e.target.nextSibling.style.display = 'flex'
              }}
            />
          ) : null}
          <div className={photoPath ? 'hidden' : 'flex'} style={{ fontSize: '3rem' }}>
            👤
          </div>
          {/* Attendance Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="#172c66"
              strokeWidth="3"
              opacity="0.1"
            />
            <circle
              cx="50%"
              cy="50%"
              r="45%"
              fill="none"
              stroke="#f582ae"
              strokeWidth="3"
              strokeDasharray={`${student.attendance * 2.83} 283`}
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Name */}
        <h3 className="text-lg font-display font-bold text-ink truncate">{student.name}</h3>

        {/* Roll Number */}
        <p className="text-sm text-body">Roll: {student.roll_no}</p>

        {/* Stats */}
        <div className="pt-3 border-t border-ink/10 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-body">SGPA:</span>
            <span className="text-base font-semibold text-ink">{student.cgpa}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-body">Attendance:</span>
            <span className="text-base font-semibold text-ink">{student.attendance}%</span>
          </div>
        </div>

        {/* Class Badge */}
        <div className="pt-2">
          <span className="inline-block px-3 py-1 bg-bubbleSecondary rounded-full text-xs font-medium text-ink">
            {formatClassName(student.class)}
          </span>
        </div>
      </div>
    </div>
  )
}
