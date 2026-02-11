/**
 * SemRank API - Cloudflare Worker
 * Provides REST API endpoints for student ranking system
 */

// CORS headers for all responses
function getCorsHeaders(origin) {
  const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    'https://c5c5-115-69-246-236.ngrok-free.app'
  ];
  
  const originAllowed = allowedOrigins.includes(origin) || origin?.includes('.ngrok');
  
  return {
    'Access-Control-Allow-Origin': originAllowed ? origin : '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// Handle CORS preflight requests
function handleOptions(request) {
  const origin = request.headers.get('Origin');
  return new Response(null, {
    headers: getCorsHeaders(origin),
  });
}

// JSON response helper
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}

// Error response helper
function errorResponse(message, status = 500) {
  return jsonResponse({ error: message }, status);
}

// Calculate grade pointer (0-10) from marks
function calculatePointer(marks, maxMarks) {
  const ten = maxMarks * 0.85;
  const nine = maxMarks * 0.8;
  const eight = maxMarks * 0.7;
  const seven = maxMarks * 0.6;
  const six = maxMarks * 0.5;
  const five = maxMarks * 0.45;
  const four = maxMarks * 0.4;

  if (marks >= ten) return 10;
  if (marks >= nine) return 9;
  if (marks >= eight) return 8;
  if (marks >= seven) return 7;
  if (marks >= six) return 6;
  if (marks >= five) return 5;
  if (marks >= four) return 4;
  return 0;
}

// Batch calculate CGPA for multiple students - SINGLE QUERY
// Formula: SGPA = (Σ(Credits × Grade Point)) / Σ(Credits)
async function getStudentCGPAs(db, classFilter = 'all') {
  // Step 1: Get all marks with student info in ONE query
  let query = `
    SELECT 
      s.student_id,
      s.roll_no,
      s.enrollment_id,
      s.prn,
      s.name,
      s.dob,
      s.class,
      s.class_id,
      m.subject,
      SUM(m.marks) as total_marks
    FROM STUDENT s
    LEFT JOIN marks m ON s.prn = m.prn
  `;
  
  if (classFilter !== 'all') {
    query += ` WHERE s.class = ?`;
  }
  
  query += ` GROUP BY s.student_id, s.roll_no, s.enrollment_id, s.prn, s.name, s.dob, s.class, s.class_id, m.subject`;
  
  const results = classFilter === 'all' 
    ? await db.prepare(query).all()
    : await db.prepare(query).bind(classFilter).all();
  
  // Step 2: Process in-memory - group by student
  const studentMap = {};
  results.results.forEach(row => {
    if (!studentMap[row.student_id]) {
      studentMap[row.student_id] = {
        student_id: row.student_id,
        roll_no: row.roll_no,
        enrollment_id: row.enrollment_id,
        prn: row.prn,
        name: row.name,
        dob: row.dob,
        class: row.class,
        class_id: row.class_id,
        subjects: []
      };
    }
    if (row.subject && row.total_marks !== null) {
      studentMap[row.student_id].subjects.push({
        subject: row.subject,
        total_marks: row.total_marks
      });
    }
  });
  
  // Step 3: Calculate CGPA for each student
  const DEFAULT_CREDITS = 3;
  const DEFAULT_MAX_MARKS = 150;
  
  const students = Object.values(studentMap).map(student => {
    let totalCreditPoints = 0;
    let totalCredits = 0;
    
    student.subjects.forEach(sub => {
      const pointer = calculatePointer(sub.total_marks, DEFAULT_MAX_MARKS);
      totalCreditPoints += pointer * DEFAULT_CREDITS;
      totalCredits += DEFAULT_CREDITS;
    });
    
    const cgpa = totalCredits > 0 ? totalCreditPoints / totalCredits : 0;
    
    return {
      student_id: student.student_id,
      roll_no: student.roll_no,
      enrollment_id: student.enrollment_id,
      prn: student.prn,
      name: student.name,
      dob: student.dob,
      class: student.class,
      class_id: student.class_id,
      cgpa: parseFloat(cgpa.toFixed(2))
    };
  });
  
  return students;
}

// Batch get attendance for all students - SINGLE QUERY
async function getAttendanceData(db) {
  const query = `
    SELECT 
      ss.student_id,
      AVG(a.attendance_percentage) as avg_attendance
    FROM STUDENT_SUBJECT ss
    LEFT JOIN ATTENDANCE a ON ss.ss_id = a.ss_id
    GROUP BY ss.student_id
  `;
  
  const results = await db.prepare(query).all();
  
  const attendanceMap = {};
  results.results.forEach(row => {
    attendanceMap[row.student_id] = parseFloat((row.avg_attendance || 0).toFixed(1));
  });
  
  return attendanceMap;
}

// Rank students with tiebreaker
function rankStudents(students, sortKey = 'cgpa') {
  students.sort((a, b) => {
    if (b[sortKey] !== a[sortKey]) {
      return b[sortKey] - a[sortKey];
    }
    return a.roll_no - b.roll_no; // Tiebreaker: lower roll_no wins
  });
  
  students.forEach((student, index) => {
    student.rank = index + 1;
  });
  
  return students;
}

// Get student with all details including subjects and marks (for single student lookup)
async function getStudentDetails(db, studentId) {
  // Get student basic info with marks in one query
  const query = `
    SELECT 
      s.student_id,
      s.roll_no,
      s.enrollment_id,
      s.name,
      s.dob,
      s.class,
      s.class_id,
      s.prn,
      m.subject,
      m.exam_type,
      m.marks
    FROM STUDENT s
    LEFT JOIN marks m ON s.prn = m.prn
    WHERE s.student_id = ?
  `;
  
  const results = await db.prepare(query).bind(studentId).all();
  
  if (!results.results || results.results.length === 0) return null;
  
  const firstRow = results.results[0];
  const student = {
    student_id: firstRow.student_id,
    roll_no: firstRow.roll_no,
    enrollment_id: firstRow.enrollment_id,
    name: firstRow.name,
    dob: firstRow.dob,
    class: firstRow.class,
    class_id: firstRow.class_id
  };
  
  // Get attendance
  const attendanceData = await db
    .prepare(`
      SELECT AVG(a.attendance_percentage) as avg_attendance
      FROM ATTENDANCE a
      JOIN STUDENT_SUBJECT ss ON a.ss_id = ss.ss_id
      WHERE ss.student_id = ?
    `)
    .bind(studentId)
    .first();
  
  // Group marks by subject and exam_type
  const subjectMap = {};
  results.results.forEach(row => {
    if (row.subject && row.exam_type && row.marks !== null) {
      if (!subjectMap[row.subject]) {
        subjectMap[row.subject] = {
          subject_name: row.subject,
          marks: {},
          total: 0
        };
      }
      subjectMap[row.subject].marks[row.exam_type.toLowerCase()] = row.marks;
      subjectMap[row.subject].total += row.marks;
    }
  });
  
  const subjects = Object.values(subjectMap).map((sub, idx) => ({
    subject_id: idx + 1,
    subject_code: `SUB${idx + 1}`,
    subject_name: sub.subject_name,
    is_open_elective: false,
    marks: {
      ...sub.marks,
      total: sub.total
    }
  }));
  
  // Calculate CGPA
  const DEFAULT_CREDITS = 3;
  const DEFAULT_MAX_MARKS = 150;
  let totalCreditPoints = 0;
  let totalCredits = 0;
  
  Object.values(subjectMap).forEach(sub => {
    const pointer = calculatePointer(sub.total, DEFAULT_MAX_MARKS);
    totalCreditPoints += pointer * DEFAULT_CREDITS;
    totalCredits += DEFAULT_CREDITS;
  });
  
  const cgpa = totalCredits > 0 ? totalCreditPoints / totalCredits : 0;
  const attendance = attendanceData?.avg_attendance || 0;
  
  return {
    ...student,
    cgpa: parseFloat(cgpa.toFixed(2)),
    attendance: parseFloat(attendance.toFixed(1)),
    subjects
  };
}

// Router
async function handleRequest(request, env) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;
  const origin = request.headers.get('Origin');
  
  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return handleOptions(request);
  }
  
  const db = env.DB;
  
  try {
    // GET /api/students - Get all students with rankings
    if (path === '/api/students' && method === 'GET') {
      //Batch fetch all students with CGPA
      const students = await getStudentCGPAs(db, 'all');
      const attendanceMap = await getAttendanceData(db);
      
      // Merge attendance data
      students.forEach(student => {
        student.attendance = attendanceMap[student.student_id] || 0;
      });
      
      // Sort by roll_no
      students.sort((a, b) => a.roll_no - b.roll_no);
      
      return jsonResponse(students);
    }
    
    // GET /api/students/roll/:rollNo - Get student by roll number
    if (path.match(/^\/api\/students\/roll\/\d+$/) && method === 'GET') {
      const rollNo = path.split('/').pop();
      
      const student = await db
        .prepare('SELECT student_id FROM STUDENT WHERE roll_no = ?')
        .bind(parseInt(rollNo))
        .first();
      
      if (!student) {
        return errorResponse('Student not found', 404);
      }
      
      const details = await getStudentDetails(db, student.student_id);
      return jsonResponse(details);
    }
    
    // GET /api/students/enrollment/:enrollmentId - Get student by enrollment ID
    if (path.match(/^\/api\/students\/enrollment\/[^\/]+$/) && method === 'GET') {
      const enrollmentId = decodeURIComponent(path.split('/').pop());
      
      const student = await db
        .prepare('SELECT student_id FROM STUDENT WHERE enrollment_id = ?')
        .bind(enrollmentId)
        .first();
      
      if (!student) {
        return errorResponse('Student not found', 404);
      }
      
      const details = await getStudentDetails(db, student.student_id);
      return jsonResponse(details);
    }
    
    // GET /api/students/search?q=query - Search students by name or roll
    if (path === '/api/students/search' && method === 'GET') {
      const query = url.searchParams.get('q') || '';
      
      // Get all students first (batch mode)
      const allStudents = await getStudentCGPAs(db, 'all');
      const attendanceMap = await getAttendanceData(db);
      
      // Merge attendance
      allStudents.forEach(student => {
        student.attendance = attendanceMap[student.student_id] || 0;
      });
      
      // Filter in memory
      const filtered = allStudents.filter(student => 
        student.name.toLowerCase().includes(query.toLowerCase()) ||
        student.roll_no.toString().includes(query)
      ).slice(0, 20);
      
      return jsonResponse(filtered);
    }
    
    // GET /api/leaderboard/cgpa - Top students by CGPA
    if (path === '/api/leaderboard/cgpa' && method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const classFilter = url.searchParams.get('class') || 'all';
      
      // Batch fetch all students with CGPA in 1-2 queries
      const students = await getStudentCGPAs(db, classFilter);
      const attendanceMap = await getAttendanceData(db);
      
      // Merge attendance data
      students.forEach(student => {
        student.attendance = attendanceMap[student.student_id] || 0;
      });
      
      // Sort and rank
      const ranked = rankStudents(students, 'cgpa');
      
      // Return top N
      return jsonResponse(ranked.slice(0, limit));
    }
    
    // GET /api/leaderboard/attendance - Top students by attendance
    if (path === '/api/leaderboard/attendance' && method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const classFilter = url.searchParams.get('class') || 'all';
      
      // Batch fetch all students with CGPA in 1-2 queries
      const students = await getStudentCGPAs(db, classFilter);
      const attendanceMap = await getAttendanceData(db);
      
      // Merge attendance data
      students.forEach(student => {
        student.attendance = attendanceMap[student.student_id] || 0;
      });
      
      // Sort and rank by attendance
      const ranked = rankStudents(students, 'attendance');
      
      // Return top N
      return jsonResponse(ranked.slice(0, limit));
    }
    
    // GET /api/leaderboard/classes - Class rankings
    if (path === '/api/leaderboard/classes' && method === 'GET') {
      // Get all students with CGPA in one batch
      const allStudents = await getStudentCGPAs(db, 'all');
      const attendanceMap = await getAttendanceData(db);
      
      // Merge attendance
      allStudents.forEach(student => {
        student.attendance = attendanceMap[student.student_id] || 0;
      });
      
      // Group by class
      const classesList = ['COMPS_A', 'COMPS_B', 'COMPS_C', 'MECH'];
      
      const classStats = classesList.map(className => {
        const classStudents = allStudents.filter(s => s.class === className);
        
        if (classStudents.length === 0) {
          return {
            class_name: className,
            student_count: 0,
            avg_cgpa: 0,
            max_cgpa: 0,
            min_cgpa: 0,
            avg_attendance: 0,
            max_attendance: 0,
            min_attendance: 0
          };
        }
        
        const cgpas = classStudents.map(s => s.cgpa || 0);
        const attendances = classStudents.map(s => s.attendance || 0);
        
        // Find top student
        const ranked = rankStudents([...classStudents], 'cgpa');
        const topStudent = ranked[0];
        
        return {
          class_name: className,
          student_count: classStudents.length,
          avg_cgpa: parseFloat((cgpas.reduce((a, b) => a + b, 0) / cgpas.length).toFixed(2)),
          max_cgpa: Math.max(...cgpas),
          min_cgpa: Math.min(...cgpas),
          avg_attendance: parseFloat((attendances.reduce((a, b) => a + b, 0) / attendances.length).toFixed(1)),
          max_attendance: Math.max(...attendances),
          min_attendance: Math.min(...attendances),
          top_student: topStudent ? {
            roll_no: topStudent.roll_no,
            name: topStudent.name,
            cgpa: topStudent.cgpa
          } : null
        };
      });
      
      return jsonResponse(classStats);
    }
    
    // GET /api/birthdays/today - Get today's birthdays
    if (path === '/api/birthdays/today' && method === 'GET') {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');
      
      // Get all students with CGPA
      const allStudents = await getStudentCGPAs(db, 'all');
      const attendanceMap = await getAttendanceData(db);
      
      // Merge attendance and filter by birthday
      const birthdayStudents = allStudents
        .filter(student => {
          if (!student.dob) return false;
          const parts = student.dob.split('/');
          return parts[0] === day && parts[1] === month;
        })
        .map(student => ({
          ...student,
          attendance: attendanceMap[student.student_id] || 0
        }));
      
      return jsonResponse(birthdayStudents);
    }
    
    // GET /api/game/random-pair - Get two random students for game
    if (path === '/api/game/random-pair' && method === 'GET') {
      // Get all students with CGPA
      const allStudents = await getStudentCGPAs(db, 'all');
      
      if (allStudents.length < 2) {
        return errorResponse('Not enough students for game', 400);
      }
      
      const attendanceMap = await getAttendanceData(db);
      
      // Pick 2 random students in memory
      const shuffled = allStudents.sort(() => Math.random() - 0.5);
      const pair = shuffled.slice(0, 2).map(student => ({
        ...student,
        attendance: attendanceMap[student.student_id] || 0
      }));
      
      return jsonResponse(pair);
    }
    
    // GET /api/leaderboard/subject/:subject_code - Top students by subject
    if (path.match(/^\/api\/leaderboard\/subject\/[^\/]+$/) && method === 'GET') {
      const subjectCode = decodeURIComponent(path.split('/').pop());
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const classFilter = url.searchParams.get('class') || 'all';
      
      // Get subject_id from subject_code
      const subject = await db
        .prepare('SELECT subject_id, subject_name FROM SUBJECT WHERE subject_code = ?')
        .bind(subjectCode)
        .first();
      
      if (!subject) {
        return errorResponse('Subject not found', 404);
      }
      
      // Get all students enrolled in this subject with their marks
      let query = `
        SELECT 
          s.student_id,
          s.roll_no,
          s.enrollment_id,
          s.name,
          s.class,
          m.mse, m.th_ise1, m.th_ise2, m.ese, m.pr_ise1, m.pr_ise2
        FROM STUDENT s
        JOIN STUDENT_SUBJECT ss ON s.student_id = ss.student_id
        LEFT JOIN MARKS m ON ss.ss_id = m.ss_id
        WHERE ss.subject_id = ?
      `;
      
      if (classFilter !== 'all') {
        query += ` AND s.class = '${classFilter}'`;
      }
      
      const students = await db
        .prepare(query)
        .bind(subject.subject_id)
        .all();
      
      // Calculate total marks for each student in this subject
      const studentsWithMarks = students.results.map(student => {
        const total = (student.mse || 0) + (student.th_ise1 || 0) + (student.th_ise2 || 0) + 
                     (student.ese || 0) + (student.pr_ise1 || 0) + (student.pr_ise2 || 0);
        return {
          student_id: student.student_id,
          roll_no: student.roll_no,
          enrollment_id: student.enrollment_id,
          name: student.name,
          class: student.class,
          subject_code: subjectCode,
          subject_name: subject.subject_name,
          marks: {
            mse: student.mse,
            th_ise1: student.th_ise1,
            th_ise2: student.th_ise2,
            ese: student.ese,
            pr_ise1: student.pr_ise1,
            pr_ise2: student.pr_ise2,
            total: total
          }
        };
      });
      
      // Sort by total marks and limit
      const sorted = studentsWithMarks
        .sort((a, b) => b.marks.total - a.marks.total)
        .slice(0, limit);
      
      return jsonResponse({
        subject_code: subjectCode,
        subject_name: subject.subject_name,
        class_filter: classFilter,
        students: sorted
      });
    }
    
    // GET /api/stats/subjects - Subject-wise statistics
    if (path === '/api/stats/subjects' && method === 'GET') {
      const classFilter = url.searchParams.get('class') || 'all';
      
      // Get all subjects
      const subjects = await db
        .prepare('SELECT subject_id, subject_code, subject_name FROM SUBJECT')
        .all();
      
      const subjectStats = await Promise.all(
        subjects.results.map(async (subject) => {
          let query = `
            SELECT 
              s.student_id,
              s.name,
              s.class,
              m.mse, m.th_ise1, m.th_ise2, m.ese, m.pr_ise1, m.pr_ise2
            FROM STUDENT s
            JOIN STUDENT_SUBJECT ss ON s.student_id = ss.student_id
            LEFT JOIN MARKS m ON ss.ss_id = m.ss_id
            WHERE ss.subject_id = ?
          `;
          
          if (classFilter !== 'all') {
            query += ` AND s.class = '${classFilter}'`;
          }
          
          const enrolledStudents = await db
            .prepare(query)
            .bind(subject.subject_id)
            .all();
          
          const marksData = enrolledStudents.results.map(student => {
            const total = (student.mse || 0) + (student.th_ise1 || 0) + (student.th_ise2 || 0) + 
                         (student.ese || 0) + (student.pr_ise1 || 0) + (student.pr_ise2 || 0);
            return {
              student_id: student.student_id,
              name: student.name,
              class: student.class,
              total: total
            };
          });
          
          if (marksData.length === 0) {
            return {
              subject_code: subject.subject_code,
              subject_name: subject.subject_name,
              enrollment_count: 0,
              avg_marks: 0,
              max_marks: 0,
              min_marks: 0,
              top_student: null
            };
          }
          
          const totals = marksData.map(m => m.total);
          const avgMarks = totals.reduce((a, b) => a + b, 0) / totals.length;
          const maxMarks = Math.max(...totals);
          const minMarks = Math.min(...totals);
          const topStudent = marksData.find(m => m.total === maxMarks);
          
          return {
            subject_code: subject.subject_code,
            subject_name: subject.subject_name,
            enrollment_count: marksData.length,
            avg_marks: parseFloat(avgMarks.toFixed(2)),
            max_marks: maxMarks,
            min_marks: minMarks,
            top_student: topStudent ? {
              name: topStudent.name,
              class: topStudent.class,
              marks: topStudent.total
            } : null
          };
        })
      );
      
      return jsonResponse({
        class_filter: classFilter,
        subjects: subjectStats
      });
    }
    
    // GET /api/students/rank/:rollNo - Get student rank
    if (path.match(/^\/api\/students\/rank\/\d+$/) && method === 'GET') {
      const rollNo = parseInt(path.split('/').pop());
      
      // Get all students with CGPA in batch
      const allStudents = await getStudentCGPAs(db, 'all');
      const attendanceMap = await getAttendanceData(db);
      
      // Merge attendance
      allStudents.forEach(student => {
        student.attendance = attendanceMap[student.student_id] || 0;
      });
      
      // Find the target student
      const studentDetails = allStudents.find(s => s.roll_no === rollNo);
      
      if (!studentDetails) {
        return errorResponse('Student not found', 404);
      }
      
      // Sort by CGPA with tiebreaker
      const ranked = rankStudents([...allStudents], 'cgpa');
      
      // Find overall rank
      const overallRank = ranked.findIndex(s => s.roll_no === rollNo) + 1;
      
      // Find class rank
      const classStudents = ranked.filter(s => s.class === studentDetails.class);
      const classRank = classStudents.findIndex(s => s.roll_no === rollNo) + 1;
      
      return jsonResponse({
        ...studentDetails,
        ranks: {
          overall: overallRank,
          in_class: classRank,
          total_students: ranked.length,
          total_in_class: classStudents.length
        }
      });
    }
    
    // Health check
    if (path === '/api/health' && method === 'GET') {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
    }
    
    // API documentation
    if (path === '/api' && method === 'GET') {
      return jsonResponse({
        name: 'SemRank API',
        version: '1.0.0',
        endpoints: {
          'GET /api/students': 'Get all students',
          'GET /api/students/roll/:rollNo': 'Get student by roll number',
          'GET /api/students/enrollment/:enrollmentId': 'Get student by enrollment ID',
          'GET /api/students/search?q=query': 'Search students by name or roll',
          'GET /api/students/rank/:rollNo': 'Get student rank (overall & in class)',
          'GET /api/leaderboard/cgpa?limit=10&class=all': 'Top students by CGPA',
          'GET /api/leaderboard/attendance?limit=10&class=all': 'Top students by attendance',
          'GET /api/leaderboard/classes': 'Class rankings',
          'GET /api/leaderboard/subject/:subject_code?limit=10&class=all': 'Top students by subject',
          'GET /api/stats/subjects?class=all': 'Subject-wise statistics (avg/max/min marks, top students)',
          'GET /api/birthdays/today': "Today's birthdays",
          'GET /api/game/random-pair': 'Get random pair for game',
          'GET /api/health': 'Health check',
        },
      });
    }
    
    return errorResponse('Not Found', 404);
  } catch (error) {
    console.error('Error:', error);
    return errorResponse(error.message || 'Internal Server Error', 500);
  }
}

export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  },
};
