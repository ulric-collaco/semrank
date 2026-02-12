import { useState, useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'
import { studentAPI } from '../utils/api'
import StudentIDCard from './StudentIDCard'

export default function StudentModal({ rollNo, onClose }) {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const modalRef = useRef(null)
  const contentRef = useRef(null)

  useEffect(() => {
    if (rollNo) {
      fetchStudentDetails(rollNo)
    }
  }, [rollNo])

  const handleClose = useCallback(() => {
    if (contentRef.current && modalRef.current) {
      gsap.to(contentRef.current, {
        scale: 0.95,
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in'
      })
      gsap.to(modalRef.current, {
        opacity: 0,
        duration: 0.2,
        delay: 0.1,
        onComplete: onClose
      })
    } else {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    // Entrance animation
    if (modalRef.current && contentRef.current) {
      gsap.fromTo(
        modalRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3 }
      )
      gsap.fromTo(
        contentRef.current,
        { scale: 0.95, opacity: 0, y: 20 },
        { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'out' } // Smoother, academic ease
      )
    }

    // Disable body scroll
    document.body.style.overflow = 'hidden'

    // Handle ESC key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleClose()
      }
    }

    document.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = 'auto'
      document.removeEventListener('keydown', handleEscape)
    }
  }, [handleClose])

  const fetchStudentDetails = async (roll) => {
    setLoading(true)
    try {
      const data = await studentAPI.getStudentByRoll(roll)
      setStudent(data)
    } catch (error) {
      console.error('Error fetching student:', error)
      setError("Failed to load student details")
    } finally {
      setLoading(false)
    }
  }

  if (!rollNo) return null

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        ref={contentRef}
        className="w-full max-w-[1100px] outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <StudentIDCard
          student={student}
          loading={loading}
          error={error}
          onClose={handleClose}
        />
      </div>
    </div>
  )
}

