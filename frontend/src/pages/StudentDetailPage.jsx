import { useState, useEffect } from 'react'
import { studentAPI } from '../utils/api'
import StudentIDCard from '../components/StudentIDCard'

export default function StudentDetailPage() {
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Get identifier from URL hash query parameter
    const urlParams = new URLSearchParams(window.location.hash.split('?')[1])
    const identifier = urlParams.get('id')

    if (identifier) {
      fetchStudentDetails(identifier)
    } else {
      setError('No student identifier provided')
      setLoading(false)
    }
  }, [])

  const fetchStudentDetails = async (identifier) => {
    setLoading(true)
    setError(null)
    try {
      // Try to fetch by roll number first, then enrollment ID
      let data
      if (identifier.startsWith('2') && identifier.length > 5) {
        // Likely enrollment ID
        data = await studentAPI.getStudentByEnrollment(identifier)
      } else {
        // Likely roll number
        data = await studentAPI.getStudentByRoll(identifier)
      }
      setStudent(data)
    } catch (err) {
      console.error('Error fetching student:', err)
      setError('Student not found')
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    window.location.hash = '#home'
  }

  return (
    <div className="min-h-screen px-4 py-8 md:py-12 flex items-center justify-center">
      <div className="w-full max-w-[950px]">
        {/* Helper back button outside the card (optional, or rely on card close) */}
        {!loading && !error && (
          <button
            onClick={goBack}
            className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            <span>←</span>
            <span>Back to Home</span>
          </button>
        )}

        <StudentIDCard
          student={student}
          loading={loading}
          error={error}
          onClose={goBack}
        />
      </div>
    </div>
  )
}
