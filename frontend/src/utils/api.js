import axios from 'axios'

// Base API URL - update this when backend is ready
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// API endpoints for future integration

export const studentAPI = {
  // Get all students with rankings
  getAllStudents: async () => {
    const response = await api.get('/students')
    return response.data
  },

  // Get student by roll number
  getStudentByRoll: async (rollNo) => {
    const response = await api.get(`/students/roll/${rollNo}`)
    return response.data
  },

  // Get student by enrollment ID
  getStudentByEnrollment: async (enrollmentId) => {
    const response = await api.get(`/students/enrollment/${enrollmentId}`)
    return response.data
  },

  // Search students by name
  searchStudents: async (query) => {
    const response = await api.get(`/students/search?q=${query}`)
    return response.data
  },
}

export const leaderboardAPI = {
  // Get top students by CGPA
  getTopByCGPA: async (limit = 10, classFilter = 'all') => {
    const response = await api.get(`/leaderboard/cgpa`, {
      params: { limit, class: classFilter },
    })
    return response.data
  },

  // Get top students by attendance
  getTopByAttendance: async (limit = 10, classFilter = 'all') => {
    const response = await api.get(`/leaderboard/attendance`, {
      params: { limit, class: classFilter },
    })
    return response.data
  },

  // Get class rankings
  getClassRankings: async () => {
    const response = await api.get(`/leaderboard/classes`)
    return response.data
  },
}

export const birthdayAPI = {
  // Get today's birthdays
  getTodaysBirthdays: async () => {
    const response = await api.get('/birthdays/today')
    return response.data
  },
}

export const gameAPI = {
  // Get two random students for game
  getRandomPair: async () => {
    const response = await api.get('/game/random-pair')
    return response.data
  },
}

export default api
