// Base API URL - update this when backend is ready
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://semrank-api.collacou.workers.dev/api'

// Retry config — handles Cloudflare Worker cold starts
const MAX_RETRIES = 3
const RETRY_DELAY_BASE = 1000 // 1s, doubles each retry

// Simple In-Memory Cache
const API_CACHE = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchWithRetry(url, options = {}) {
  const isGet = !options.method || options.method === 'GET';
  const cacheKey = url;

  // Check Cache for GET requests
  if (isGet && API_CACHE.has(cacheKey)) {
    const { data, timestamp } = API_CACHE.get(cacheKey);
    if (Date.now() - timestamp < CACHE_TTL) {
      // Return cached data if fresh
      return data;
    } else {
      API_CACHE.delete(cacheKey);
    }
  }

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
      const data = await response.json()

      // Cache successful GET responses
      if (isGet) {
        API_CACHE.set(cacheKey, { data, timestamp: Date.now() });
      }

      return data
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
  getClassStats: (className) => fetchWithRetry(`/stats/class/${encodeURIComponent(className)}`),
  getBatchDistribution: () => fetchWithRetry('/stats/distribution'),
}

export const birthdayAPI = {
  getTodaysBirthdays: () => fetchWithRetry('/birthdays/today'),
}

export const gameAPI = {
  getRandomPair: (classFilter = 'all') => {
    // Force fresh fetch by appending timestamp and specific cache-bust param
    const params = new URLSearchParams({ class: classFilter, _t: Date.now() })
    // We can also pass a fetch option to ignore internal cache if implemented, 
    // but the fetchWithRetry function uses the URL as cache key. 
    // Since we are appending a unique timestamp to params, the URL is unique every call.
    // fetchWithRetry ALREADY appends _t, but let's be explicit and ensure it's not cached in memory.
    // The current fetchWithRetry implementation caches based on 'url' argument BEFORE _t is appended internally.
    // So we need to append a unique string to the 'url' argument itself to bypass the Map cache.
    return fetchWithRetry(`/game/random-pair?${params}`)
  },
  getRandomPairWithSubject: () => fetchWithRetry(`/game/random-pair-subject?_t=${Date.now()}`),
}

export default { fetchWithRetry }
