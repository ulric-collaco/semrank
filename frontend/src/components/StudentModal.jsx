import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { studentAPI } from '../utils/api'
import StudentIDCard from './StudentIDCard'

export default function StudentModal({ rollNo, onClose }) {
    const [student, setStudent] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const modalRef = useRef(null)
    const contentRef = useRef(null)
    const isClosing = useRef(false)

    useEffect(() => {
        if (rollNo) {
            fetchStudentDetails(rollNo)
        }
    }, [rollNo])

    const handleClose = useCallback(() => {
        if (isClosing.current) return
        isClosing.current = true
        if (contentRef.current && modalRef.current) {
            gsap.to(contentRef.current, {
                scale: 0.8,
                opacity: 0,
                rotation: -5,
                duration: 0.2,
                ease: 'power2.in'
            })
            gsap.to(modalRef.current, {
                opacity: 0,
                duration: 0.2,
                delay: 0.1,
                onComplete: () => {
                    isClosing.current = false
                    onClose()
                }
            })
        } else {
            isClosing.current = false
            onClose()
        }
    }, [onClose])

    useEffect(() => {
        const onPointerDown = (e) => {
            if (!contentRef.current) return
            if (!contentRef.current.contains(e.target)) {
                handleClose()
            }
        }

        document.addEventListener('pointerdown', onPointerDown, { capture: true })
        return () => document.removeEventListener('pointerdown', onPointerDown, { capture: true })
    }, [handleClose])

    // Animation Effect - Runs once on mount
    useEffect(() => {
        let ctx = gsap.context(() => {
            if (modalRef.current && contentRef.current) {
                gsap.fromTo(
                    modalRef.current,
                    { opacity: 0 },
                    { opacity: 1, duration: 0.2 }
                )
                gsap.fromTo(
                    contentRef.current,
                    { scale: 0.8, opacity: 0, y: 100, rotation: 10 },
                    { scale: 1, opacity: 1, y: 0, rotation: 0, duration: 0.4, ease: 'back.out(1.7)' }
                )
            }
        }, modalRef) // Scope to modalRef

        return () => ctx.revert() // Cleanup GSAP on unmount
    }, [])

    // Event Listeners Effect - Updates if handleClose changes
    useEffect(() => {
        document.body.style.overflow = 'hidden'

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

    return createPortal(
        <div
            ref={modalRef}
            className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-[#ffde00]/90 backdrop-blur-sm"
            onClick={handleClose}
        >
            <div
                ref={contentRef}
                className="w-full max-w-[1000px] outline-none"
                onClick={(e) => e.stopPropagation()}
            >
                <StudentIDCard
                    student={student}
                    loading={loading}
                    error={error}
                    onClose={handleClose}
                />
            </div>
        </div>,
        document.body
    )
}
