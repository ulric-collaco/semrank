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
  const bypassCache = options.bypassCache || false;
  const isInternalSWR = options._internalSWR || false;

  // 1. Check Cache for GET requests (Stale-While-Revalidate Pattern)
  if (isGet && !bypassCache && !isInternalSWR && API_CACHE.has(cacheKey)) {
    const { data, timestamp } = API_CACHE.get(cacheKey);
    const age = Date.now() - timestamp;

    if (age < CACHE_TTL) {
      return data; // Fresh
    } else if (age < CACHE_TTL * 2) {
      // Stale: Return immediately but fetch fresh in background
      fetchWithRetry(url, { ...options, _internalSWR: true }).catch(() => { });
      return data;
    }
  }

  const separator = url.includes('?') ? '&' : '?'
  const bypassCacheParam = bypassCache ? `${separator}_t=${Date.now()}` : ''
  const backendRelativeUrl = `${url}${bypassCacheParam}`
  const fullUrl = `${API_BASE_URL}${backendRelativeUrl}`

  // Generate HMAC Signature
  const API_SECRET = import.meta.env.VITE_API_SECRET || 'meowmeowwhatdiduguess';
  const reqTimestamp = Math.floor(Date.now() / 1000).toString();

  const encoder = new TextEncoder();
  const dataToSign = encoder.encode(`${backendRelativeUrl}:${reqTimestamp}`);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(API_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, dataToSign);
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-timestamp': reqTimestamp,
      'x-signature': signatureHex,
      ...(options.headers || {})
    },
    signal: options.signal || AbortSignal.timeout(10000), // 10s timeout
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
        // No logging for background SWR retries
        if (!isInternalSWR) console.log(`API retry ${attempt + 1}/${MAX_RETRIES} after ${delay}ms: ${url}`)
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
    const params = new URLSearchParams({ class: classFilter })
    return fetchWithRetry(`/game/random-pair?${params}`, { bypassCache: true })
  },
  getRandomPairWithSubject: () => fetchWithRetry('/game/random-pair-subject', { bypassCache: true }),
}

export default { fetchWithRetry }
