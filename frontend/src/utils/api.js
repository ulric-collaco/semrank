// Base API URL - update this when backend is ready
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Retry config — handles Cloudflare Worker cold starts
const MAX_RETRIES = 3
const RETRY_DELAY_BASE = 1000 // 1s, doubles each retry

async function fetchWithRetry(url, options = {}) {
  const separator = url.includes('?') ? '&' : '?'
  const fullUrl = `${API_BASE_URL}${url}${separator}_t=${Date.now()}`
  const config = {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(10000), // 10s timeout
    ...options,
  }

  let lastError
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(fullUrl, config)
      if (!response.ok) {
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          throw new Error(`Server error: ${response.status}`)
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      return await response.json()
    } catch (error) {
      lastError = error
      if (attempt < MAX_RETRIES && (error.name === 'TypeError' || error.message.startsWith('Server error'))) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt)
        console.log(`API retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms: ${url}`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      } else if (attempt >= MAX_RETRIES) {
        break
      } else {
        throw error
      }
    }
  }
  throw lastError
}

// API endpoints

export const studentAPI = {
  getAllStudents: () => fetchWithRetry('/students'),
  getStudentByRoll: (rollNo) => fetchWithRetry(`/students/roll/${rollNo}`),
  getStudentByEnrollment: (enrollmentId) => fetchWithRetry(`/students/enrollment/${enrollmentId}`),
  searchStudents: (query) => fetchWithRetry(`/students/search?q=${query}`),
  getStudentRank: (rollNo) => fetchWithRetry(`/students/rank/${rollNo}`),
  getSGPIAnalysis: (studentId) => fetchWithRetry(`/students/id/${studentId}/analysis`),
}

export const leaderboardAPI = {
  getTopBySGPA: (limit = 10, classFilter = 'all') => {
    const params = new URLSearchParams({ limit, class: classFilter })
    return fetchWithRetry(`/leaderboard/cgpa?${params}`)
  },
  getTopByAttendance: (limit = 10, classFilter = 'all') => {
    const params = new URLSearchParams({ limit, class: classFilter })
    return fetchWithRetry(`/leaderboard/attendance?${params}`)
  },
  getClassRankings: () => fetchWithRetry('/leaderboard/classes'),
  getTopBySubject: (subjectCode, limit = 10, classFilter = 'all', sortBy = 'marks') => {
    const params = new URLSearchParams({ limit, class: classFilter, sortBy })
    return fetchWithRetry(`/leaderboard/subject/${subjectCode}?${params}`)
  },
}

export const statsAPI = {
  getSubjectStats: (classFilter = 'all') => {
    const params = new URLSearchParams({ class: classFilter })
    return fetchWithRetry(`/stats/subjects?${params}`)
  },
}

export const birthdayAPI = {
  getTodaysBirthdays: () => fetchWithRetry('/birthdays/today'),
}

export const gameAPI = {
  getRandomPair: () => fetchWithRetry('/game/random-pair'),
  getRandomPairWithSubject: () => fetchWithRetry('/game/random-pair-subject'),
}

export default { fetchWithRetry }
