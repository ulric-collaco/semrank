import { useState, useEffect } from 'react'

// Mock student data generator
const generateMockStudents = () => {
  const names = [
    'Aarav Sharma', 'Ananya Patel', 'Arjun Kumar', 'Diya Singh', 'Ishaan Gupta',
    'Kavya Reddy', 'Krishna Iyer', 'Meera Joshi', 'Rohan Verma', 'Saanvi Agarwal',
    'Aditya Nair', 'Priya Desai', 'Vivaan Shah', 'Anaya Mehta', 'Ayaan Khan',
    'Riya Kapoor', 'Vihaan Rao', 'Aadhya Menon', 'Advait Pandey', 'Navya Khanna',
    'Arnav Mishra', 'Kiara Saxena', 'Dhruv Malhotra', 'Isha Bansal', 'Kabir Bose',
    'Myra Chopra', 'Reyansh Dutta', 'Shanaya Das', 'Shaurya Ghosh', 'Zara Sinha',
  ]
  
  const classes = ['COMPS_A', 'COMPS_B', 'COMPS_C']
  
  return names.map((name, index) => ({
    roll_no: 10578 + index,
    enrollment_id: `EN2024${(10578 + index).toString()}`,
    name: name,
    class: classes[index % 3],
    cgpa: parseFloat((7.0 + Math.random() * 2.5).toFixed(2)),
    attendance: parseFloat((70 + Math.random() * 30).toFixed(1)),
    dob: `200${5 + (index % 3)}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
  }))
}

export function useMockStudents() {
  const [students, setStudents] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading delay
    setTimeout(() => {
      setStudents(generateMockStudents())
      setIsLoading(false)
    }, 500)
  }, [])

  return { students, isLoading }
}
