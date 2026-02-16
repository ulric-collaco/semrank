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

// Get students with pre-computed CGPA and attendance from STUDENT_LEADERBOARD
async function getStudentLeaderboardData(db, classFilter = 'all') {
  let query = `
    SELECT 
      s.student_id,
      s.roll_no,
      s.enrollment_id,
      s.name,
      s.dob,
      s.class,
      s.class_id,
      sl.cgpa,
      sl.overall_attendance as attendance,
      sl.rank_cgpa_college,
      sl.rank_cgpa_class,
      sl.rank_attendance_college,
      sl.rank_attendance_class
    FROM STUDENT s
    JOIN STUDENT_LEADERBOARD sl ON s.student_id = sl.student_id
  `;

  if (classFilter !== 'all') {
    query += ` WHERE s.class = ?`;
  }

  const results = classFilter === 'all'
    ? await db.prepare(query).all()
    : await db.prepare(query).bind(classFilter).all();

  return results.results || [];
}

// Get student with all details including subjects and marks (for single student lookup)
// Calculate SGPI Analysis breakdown
async function getStudentSGPIAnalysis(db, prn) {
  // Dynamically build the Double Minor subjects set from DB subject codes
  // 25DM* = Double Minor (Emerging Areas) subjects — always excluded from SGPI
  const droppableQuery = `SELECT subject_name FROM SUBJECT WHERE subject_code LIKE '25DM%'`;
  const droppableResult = await db.prepare(droppableQuery).all();
  const DM_SUBJECTS = new Set(
    (droppableResult.results || []).map(s => s.subject_name.toUpperCase())
  );

  // Get all marks for this student
  const marksQuery = `SELECT subject, marks, exam_type FROM marks WHERE prn = ?`;
  const marksResult = await db.prepare(marksQuery).bind(prn).all();
  const marks = marksResult.results || [];

  // Get subject credits and max marks
  const subjectsQuery = `SELECT subject_name, credits, maxMarks FROM SUBJECT`;
  const subjectsResult = await db.prepare(subjectsQuery).all();
  const subjectInfo = {};
  subjectsResult.results.forEach(s => {
    subjectInfo[s.subject_name.toUpperCase()] = {
      credits: s.credits,
      maxMarks: s.maxMarks || 100
    };
  });

  // Group marks by subject to get total
  const subjectTotals = {};
  marks.forEach(m => {
    const subName = m.subject.toUpperCase();
    if (!subjectTotals[subName]) {
      subjectTotals[subName] = 0;
    }
    subjectTotals[subName] += (m.marks || 0);
  });

  const breakdown = [];
  const dropped = [];
  let totalWeightedPoints = 0;
  let totalCredits = 0;

  for (const [subName, totalMarks] of Object.entries(subjectTotals)) {
    const info = subjectInfo[subName] || { credits: 2, maxMarks: 100 };
    const credits = info.credits;
    const maxMarks = info.maxMarks;

    // Double Minor (DM) subjects are always excluded from SGPI
    if (DM_SUBJECTS.has(subName)) {
      dropped.push({
        subject: subName,
        credits: credits,
        reason: "Double Minor subject — not counted in SGPI"
      });
      continue;
    }

    // Calculate Percentage for Grading
    // Marks are converted to percentage (out of 100) before grading
    const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;

    let gp = 0;
    if (percentage >= 85) gp = 10;
    else if (percentage >= 80) gp = 9;
    else if (percentage >= 70) gp = 8;
    else if (percentage >= 60) gp = 7;
    else if (percentage >= 50) gp = 6;
    else if (percentage >= 45) gp = 5;
    else if (percentage >= 40) gp = 4;
    else gp = 0;

    // Fail check: if marks < 40%
    // The previous logic was `totalMarks < 40`. Now it's `percentage < 40`.
    // Validated: 33.5/50 = 67% -> GP 7. Correct.

    totalWeightedPoints += (gp * credits);
    totalCredits += credits;

    breakdown.push({
      subject: subName,
      marks: totalMarks,
      normalizedMarks: parseFloat(percentage.toFixed(2)), // percentage
      maxMarks: maxMarks,
      credits: credits,
      gradePoint: gp,
      weightedPoint: gp * credits
    });
  }

  const sgpi = totalCredits > 0 ? (totalWeightedPoints / totalCredits) : 0;

  return {
    prn,
    sgpi: parseFloat(sgpi.toFixed(2)),
    totalWeightedPoints,
    totalCredits,
    breakdown,
    dropped
  };
}

async function getStudentDetails(db, studentId) {
  // Get student basic info with CGPA and attendance from leaderboard
  const studentQuery = `
    SELECT 
      s.student_id,
      s.roll_no,
      s.enrollment_id,
      s.name,
      s.dob,
      s.class,
      s.class_id,
      sl.cgpa,
      sl.overall_attendance as attendance,
      sl.total_marks,
      sl.rank_cgpa_college,
      sl.rank_cgpa_class,
      sl.rank_attendance_college,
      sl.rank_attendance_class
    FROM STUDENT s
    JOIN STUDENT_LEADERBOARD sl ON s.student_id = sl.student_id
    WHERE s.student_id = ?
  `;

  const student = await db.prepare(studentQuery).bind(studentId).first();

  if (!student) return null;

  // Get subject details with marks and ranks
  const subjectsQuery = `
    SELECT 
      sub.subject_id,
      sub.subject_code,
      sub.subject_name,
      sub.is_open_elective,
      sub.maxMarks,
      m.mse,
      m.th_ise1,
      m.th_ise2,
      m.ese,
      m.pr_ise1,
      m.pr_ise2,
      (COALESCE(m.mse, 0) + COALESCE(m.th_ise1, 0) + COALESCE(m.th_ise2, 0) + 
       COALESCE(m.ese, 0) + COALESCE(m.pr_ise1, 0) + COALESCE(m.pr_ise2, 0)) as total_marks,
      ssl.rank_subject_class as rank
    FROM STUDENT_SUBJECT ss
    JOIN SUBJECT sub ON ss.subject_id = sub.subject_id
    LEFT JOIN MARKS_backup m ON ss.ss_id = m.ss_id
    LEFT JOIN STUDENT_SUBJECT_LEADERBOARD ssl ON ss.student_id = ssl.student_id 
      AND ss.subject_id = ssl.subject_id
    WHERE ss.student_id = ?
  `;

  const subjectsResult = await db.prepare(subjectsQuery).bind(studentId).all();

  const subjects = subjectsResult.results.map(sub => ({
    subject_id: sub.subject_id,
    subject_code: sub.subject_code,
    subject_name: sub.subject_name,
    is_open_elective: Boolean(sub.is_open_elective),
    maxMarks: sub.maxMarks || 100,
    mse: sub.mse,
    th_ise1: sub.th_ise1,
    th_ise2: sub.th_ise2,
    ese: sub.ese,
    pr_ise1: sub.pr_ise1,
    pr_ise2: sub.pr_ise2,
    total_marks: sub.total_marks,
    rank: sub.rank
  }));

  return {
    ...student,
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
      //Batch fetch all students with CGPA and attendance from leaderboard
      const students = await getStudentLeaderboardData(db, 'all');

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

    // GET /api/students/id/:studentId/analysis - Get SGPI analysis breakdown
    if (path.match(/^\/api\/students\/id\/\d+\/analysis$/) && method === 'GET') {
      const studentId = path.split('/')[4];

      const student = await db
        .prepare('SELECT prn FROM STUDENT WHERE student_id = ?')
        .bind(parseInt(studentId))
        .first();

      if (!student) {
        return errorResponse('Student not found', 404);
      }

      const analysis = await getStudentSGPIAnalysis(db, student.prn);
      return jsonResponse(analysis);
    }

    // GET /api/students/search?q=query - Search students by name or roll
    if (path === '/api/students/search' && method === 'GET') {
      const query = url.searchParams.get('q') || '';

      // Get all students from leaderboard
      const allStudents = await getStudentLeaderboardData(db, 'all');

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

      // Get students from pre-computed leaderboard
      const students = await getStudentLeaderboardData(db, classFilter);

      // Sort by appropriate rank (college or class)
      const rankKey = classFilter === 'all' ? 'rank_cgpa_college' : 'rank_cgpa_class';
      students.sort((a, b) => a[rankKey] - b[rankKey]);

      // Add rank field and limit results
      const topStudents = students.slice(0, limit).map(s => ({
        ...s,
        rank: s[rankKey]
      }));

      return jsonResponse(topStudents);
    }

    // GET /api/leaderboard/attendance - Top students by attendance
    if (path === '/api/leaderboard/attendance' && method === 'GET') {
      const limit = parseInt(url.searchParams.get('limit') || '10');
      const classFilter = url.searchParams.get('class') || 'all';

      // Get students from pre-computed leaderboard
      const students = await getStudentLeaderboardData(db, classFilter);

      // Sort by appropriate rank (college or class)
      const rankKey = classFilter === 'all' ? 'rank_attendance_college' : 'rank_attendance_class';
      students.sort((a, b) => a[rankKey] - b[rankKey]);

      // Add rank field and limit results
      const topStudents = students.slice(0, limit).map(s => ({
        ...s,
        rank: s[rankKey]
      }));

      return jsonResponse(topStudents);
    }

    // GET /api/leaderboard/classes - Class rankings
    if (path === '/api/leaderboard/classes' && method === 'GET') {
      // Query pre-computed class leaderboard
      const query = `
        SELECT 
          c.class_name,
          cl.avg_cgpa,
          cl.avg_attendance,
          cl.total_students,
          cl.rank_avg_cgpa,
          cl.rank_avg_attendance
        FROM CLASS_LEADERBOARD cl
        JOIN CLASS c ON cl.class_id = c.class_id
        ORDER BY cl.rank_avg_cgpa
      `;

      const results = await db.prepare(query).all();

      // For each class, get top student info
      const classStats = await Promise.all(
        results.results.map(async (classData) => {
          // Get top student for this class
          const topStudent = await db
            .prepare(`
              SELECT s.roll_no, s.name, sl.cgpa
              FROM STUDENT s
              JOIN STUDENT_LEADERBOARD sl ON s.student_id = sl.student_id
              WHERE s.class = ?
              ORDER BY sl.rank_cgpa_class
              LIMIT 1
            `)
            .bind(classData.class_name)
            .first();

          return {
            class_name: classData.class_name,
            student_count: classData.total_students,
            avg_cgpa: parseFloat(classData.avg_cgpa.toFixed(2)),
            avg_attendance: parseFloat(classData.avg_attendance.toFixed(1)),
            rank_cgpa: classData.rank_avg_cgpa,
            rank_attendance: classData.rank_avg_attendance,
            top_student: topStudent ? {
              roll_no: topStudent.roll_no,
              name: topStudent.name,
              cgpa: topStudent.cgpa
            } : null
          };
        })
      );

      return jsonResponse(classStats);
    }

    // GET /api/birthdays/today - Get today's birthdays
    if (path === '/api/birthdays/today' && method === 'GET') {
      const today = new Date();
      const day = String(today.getDate()).padStart(2, '0');
      const month = String(today.getMonth() + 1).padStart(2, '0');

      // Get all students from leaderboard
      const allStudents = await getStudentLeaderboardData(db, 'all');

      // Filter by birthday
      const birthdayStudents = allStudents.filter(student => {
        if (!student.dob) return false;
        const parts = student.dob.split('/');
        return parts[0] === day && parts[1] === month;
      });

      return jsonResponse(birthdayStudents);
    }

    // GET /api/game/random-pair - Get two random students for game
    if (path === '/api/game/random-pair' && method === 'GET') {
      const classFilter = url.searchParams.get('class') || 'all';

      // Get all students from leaderboard (filtered by class if provided)
      const allStudents = await getStudentLeaderboardData(db, classFilter);

      if (allStudents.length < 2) {
        return errorResponse('Not enough students for game', 400);
      }

      // Pick 2 random students in memory
      const shuffled = allStudents.sort(() => Math.random() - 0.5);
      const pair = shuffled.slice(0, 2);

      return jsonResponse(pair);
    }

    // GET /api/game/random-pair-subject - Get two random students with subject marks
    if (path === '/api/game/random-pair-subject' && method === 'GET') {
      // Get a random subject
      const subjects = await db
        .prepare('SELECT subject_id, subject_name, subject_code FROM SUBJECT')
        .all();

      if (subjects.results.length === 0) {
        return errorResponse('No subjects available', 404);
      }

      const randomSubject = subjects.results[Math.floor(Math.random() * subjects.results.length)];

      // Get all students who have marks in this subject
      const studentsWithMarks = await db
        .prepare(`
          SELECT 
            s.student_id,
            s.name,
            s.roll_no,
            s.enrollment_id,
            c.class_name as class,
            ss.total_marks as totalMarks,
            ssl.rank_subject_class as rank
          FROM STUDENT s
          JOIN CLASS c ON s.class_id = c.class_id
          JOIN STUDENT_SUBJECT ss ON s.student_id = ss.student_id
          LEFT JOIN STUDENT_SUBJECT_LEADERBOARD ssl ON ss.student_id = ssl.student_id 
            AND ss.subject_id = ssl.subject_id
          WHERE ss.subject_id = ?
          ORDER BY RANDOM()
          LIMIT 50
        `)
        .bind(randomSubject.subject_id)
        .all();

      if (studentsWithMarks.results.length < 2) {
        return errorResponse('Not enough students for this subject', 400);
      }

      // Pick 2 random students
      const pair = studentsWithMarks.results.slice(0, 2);

      return jsonResponse({
        subject: {
          id: randomSubject.subject_id,
          name: randomSubject.subject_name,
          code: randomSubject.subject_code
        },
        students: pair
      });
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

      const normalizedSubName = subject.subject_name.replace(/\s+/g, ' ').trim();

      // Get students from pre-computed subject leaderboard
      // MODIFIED: Fetch students for ALL subjects with the SAME NORMALIZED NAME (handles split subject codes & spacing issues)
      // Joined STUDENT_SUBJECT (ss) to get attendance_percentage
      let query = `
        SELECT 
          s.student_id,
          s.roll_no,
          s.enrollment_id,
          s.name,
          s.class,
          ssl.subject_total,
          ssl.rank_subject_college,
          ssl.rank_subject_class,
          ss.attendance_percentage,
          m.mse, m.th_ise1, m.th_ise2, m.ese, m.pr_ise1, m.pr_ise2
        FROM STUDENT_SUBJECT_LEADERBOARD ssl
        JOIN STUDENT s ON ssl.student_id = s.student_id
        JOIN SUBJECT sub ON ssl.subject_id = sub.subject_id
        JOIN STUDENT_SUBJECT ss ON ssl.student_id = ss.student_id AND ssl.subject_id = ss.subject_id
        LEFT JOIN MARKS_backup m ON ssl.ss_id = m.ss_id
        WHERE REPLACE(sub.subject_name, '  ', ' ') = ?
      `;

      if (classFilter !== 'all') {
        query += ` AND s.class = ?`;
      }

      const students = classFilter === 'all'
        ? await db.prepare(query).bind(normalizedSubName).all()
        : await db.prepare(query).bind(normalizedSubName, classFilter).all();

      // Sort & Rank Logic
      const sortBy = url.searchParams.get('sortBy') || 'marks'; // 'marks' or 'attendance'

      let sorted;
      if (sortBy === 'attendance') {
        // Sort by attendance_percentage DESC, then subject_total DESC
        sorted = students.results.sort((a, b) => {
          const attA = parseFloat(a.attendance_percentage || 0);
          const attB = parseFloat(b.attendance_percentage || 0);
          if (attA !== attB) return attB - attA;
          return b.subject_total - a.subject_total;
        });
      } else {
        // Sort by marks (descending)
        sorted = students.results.sort((a, b) => b.subject_total - a.subject_total);
      }

      // slice AFTER sorting and ranking
      let currentRank = 0;
      let lastValue = -1; // Value tracking for ranking (marks or attendance)

      const rankedStudents = sorted.map((student, index) => {
        // Determine value to rank by
        const value = sortBy === 'attendance' ? parseFloat(student.attendance_percentage || 0) : student.subject_total;

        if (value !== lastValue) {
          currentRank = index + 1;
          lastValue = value;
        }
        return {
          ...student,
          calculated_rank: currentRank
        };
      }).slice(0, limit);

      // Format response
      const formattedStudents = rankedStudents.map(student => ({
        student_id: student.student_id,
        roll_no: student.roll_no,
        enrollment_id: student.enrollment_id,
        name: student.name,
        class: student.class,
        subject_code: subjectCode,
        subject_name: subject.subject_name,
        rank: student.calculated_rank,
        attendance_percentage: student.attendance_percentage, // Return attendance
        marks: {
          mse: student.mse,
          th_ise1: student.th_ise1,
          th_ise2: student.th_ise2,
          ese: student.ese,
          pr_ise1: student.pr_ise1,
          pr_ise2: student.pr_ise2,
          total: student.subject_total
        }
      }));

      return jsonResponse({
        subject_code: subjectCode,
        subject_name: subject.subject_name,
        class_filter: classFilter,
        students: formattedStudents
      });
      // GET /api/stats/distribution - Batch CGPA distribution
      if (path === '/api/stats/distribution' && method === 'GET') {
        const query = `
        SELECT 
          SUM(CASE WHEN cgpa >= 9.5 THEN 1 ELSE 0 END) as "9.5+",
          SUM(CASE WHEN cgpa >= 9.0 AND cgpa < 9.5 THEN 1 ELSE 0 END) as "9.0-9.5",
          SUM(CASE WHEN cgpa >= 8.5 AND cgpa < 9.0 THEN 1 ELSE 0 END) as "8.5-9.0",
          SUM(CASE WHEN cgpa >= 8.0 AND cgpa < 8.5 THEN 1 ELSE 0 END) as "8.0-8.5",
          SUM(CASE WHEN cgpa >= 7.5 AND cgpa < 8.0 THEN 1 ELSE 0 END) as "7.5-8.0",
          SUM(CASE WHEN cgpa >= 7.0 AND cgpa < 7.5 THEN 1 ELSE 0 END) as "7.0-7.5",
          SUM(CASE WHEN cgpa >= 6.0 AND cgpa < 7.0 THEN 1 ELSE 0 END) as "6.0-7.0",
          SUM(CASE WHEN cgpa < 6.0 THEN 1 ELSE 0 END) as "<6.0"
        FROM STUDENT_LEADERBOARD
      `;

        try {
          const result = await db.prepare(query).first();

          // Transform to array format expected by frontend
          // Order: Low -> High for Bell Curve
          const distribution = [
            { name: '<6.0', value: result['<6.0'] || 0 },
            { name: '6.0-7.0', value: result['6.0-7.0'] || 0 },
            { name: '7.0-7.5', value: result['7.0-7.5'] || 0 },
            { name: '7.5-8.0', value: result['7.5-8.0'] || 0 },
            { name: '8.0-8.5', value: result['8.0-8.5'] || 0 },
            { name: '8.5-9.0', value: result['8.5-9.0'] || 0 },
            { name: '9.0-9.5', value: result['9.0-9.5'] || 0 },
            { name: '9.5+', value: result['9.5+'] || 0 }
          ];

          return jsonResponse(distribution);
        } catch (error) {
          return errorResponse(`Database error: ${error.message}`, 500);
        }
      }

      // GET /api/stats/subjects - Subject-wise statistics
      if (path === '/api/stats/subjects' && method === 'GET') {
        const classFilter = url.searchParams.get('class') || 'all';

        // Optimized query: Aggregate stats directly from STUDENT_SUBJECT_LEADERBOARD
        // Groups by normalized subject name to handle duplicates/spaces
        let query = `
        SELECT 
          REPLACE(sub.subject_name, '  ', ' ') as subject_name,
          MAX(sub.subject_code) as subject_code,
          COUNT(*) as enrollment_count,
          AVG(ssl.subject_total) as avg_marks,
          AVG(
            CASE 
              WHEN (ssl.subject_total * 100.0 / COALESCE(sub.maxMarks, 100)) >= 85 THEN 10
              WHEN (ssl.subject_total * 100.0 / COALESCE(sub.maxMarks, 100)) >= 80 THEN 9
              WHEN (ssl.subject_total * 100.0 / COALESCE(sub.maxMarks, 100)) >= 70 THEN 8
              WHEN (ssl.subject_total * 100.0 / COALESCE(sub.maxMarks, 100)) >= 60 THEN 7
              WHEN (ssl.subject_total * 100.0 / COALESCE(sub.maxMarks, 100)) >= 50 THEN 6
              WHEN (ssl.subject_total * 100.0 / COALESCE(sub.maxMarks, 100)) >= 45 THEN 5
              WHEN (ssl.subject_total * 100.0 / COALESCE(sub.maxMarks, 100)) >= 40 THEN 4
              ELSE 0
            END
          ) as avg_gp,
          MAX(ssl.subject_total) as max_marks,
          MIN(ssl.subject_total) as min_marks
        FROM STUDENT_SUBJECT_LEADERBOARD ssl
        JOIN SUBJECT sub ON ssl.subject_id = sub.subject_id
        JOIN STUDENT s ON ssl.student_id = s.student_id
      `;

        if (classFilter !== 'all') {
          query += ` WHERE s.class = ?`;
        }

        query += ` GROUP BY REPLACE(sub.subject_name, '  ', ' ') ORDER BY avg_marks DESC`;

        try {
          const results = classFilter === 'all'
            ? await db.prepare(query).all()
            : await db.prepare(query).bind(classFilter).all();

          const subjects = (results.results || []).map(row => ({
            subject_code: row.subject_code,
            subject_name: row.subject_name,
            enrollment_count: row.enrollment_count,
            avg_marks: parseFloat(row.avg_marks.toFixed(2)),
            avg_gp: parseFloat((row.avg_gp || 0).toFixed(2)),
            max_marks: row.max_marks || 0,
            min_marks: row.min_marks || 0,
            top_student: null // Optimization: Skip expensive top student lookup for list view
          }));

          return jsonResponse({
            class_filter: classFilter,
            subjects
          });
        } catch (error) {
          return errorResponse(`Database error: ${error.message}`, 500);
        }
      }

      // GET /api/stats/class/:className - Detailed class statistics
      if (path.match(/^\/api\/stats\/class\/[^\/]+$/) && method === 'GET') {
        const className = decodeURIComponent(path.split('/').pop());

        // 1. Basic Class Info
        const classInfo = await db.prepare(`
        SELECT 
          c.class_name,
          cl.avg_cgpa,
          cl.avg_attendance,
          cl.total_students,
          cl.rank_avg_cgpa
        FROM CLASS_LEADERBOARD cl
        JOIN CLASS c ON cl.class_id = c.class_id
        WHERE c.class_name = ?
      `).bind(className).first();

        if (!classInfo) {
          return errorResponse('Class not found', 404);
        }

        // 2. Academic Weapon (Topper)
        const topper = await db.prepare(`
        SELECT s.name, s.roll_no, sl.cgpa
        FROM STUDENT s
        JOIN STUDENT_LEADERBOARD sl ON s.student_id = sl.student_id
        WHERE s.class = ?
        ORDER BY sl.cgpa DESC
        LIMIT 1
      `).bind(className).first();

        // 3. Subject Stats (Mass Bunk, Einstein, Nightmare)
        // 3. Subject Metrics (Grouped by Normalized Name for consistency)
        const subjectMetrics = await db.prepare(`
        SELECT 
          REPLACE(MAX(sub.subject_name), '  ', ' ') as subject_name,
          MAX(sub.subject_code) as subject_code,
          AVG(ssl.subject_total) as avg_marks,
          AVG(ssl.attendance) as avg_attendance,
          MAX(sub.maxMarks) as max_marks
        FROM STUDENT_SUBJECT_LEADERBOARD ssl
        JOIN SUBJECT sub ON ssl.subject_id = sub.subject_id
        JOIN CLASS c ON ssl.class_id = c.class_id
        WHERE c.class_name = ?
        GROUP BY REPLACE(sub.subject_name, '  ', ' ')
      `).bind(className).all();

        // Find 'Mass Bunk' (Lowest Avg Attendance) -- Include all subjects, even DM
        const validAttendanceSubjects = subjectMetrics.results
          .filter(s => s.avg_attendance > 0);

        const massBunkSubject = validAttendanceSubjects.length > 0
          ? validAttendanceSubjects.sort((a, b) => a.avg_attendance - b.avg_attendance)[0]
          : null;

        const massBunk = massBunkSubject ? {
          subject: massBunkSubject.subject_name,
          value: Math.round(massBunkSubject.avg_attendance) + '%'
        } : { subject: 'N/A', value: '-' };

        // Find 'Einstein' & 'Nightmare' (Exclude Double Minor '25DM' & Non-Graded)
        // Double Minors are excluded from SGPI, so they shouldn't count as "Nightmare" for grades
        const gradedSubjects = subjectMetrics.results
          .filter(s => s.avg_marks > 0 && !s.subject_code.startsWith('25DM'));

        // Einstein: Highest % Marks
        const einsteinSubject = gradedSubjects.length > 0
          ? [...gradedSubjects].sort((a, b) => (b.avg_marks / b.max_marks) - (a.avg_marks / a.max_marks))[0]
          : null;

        const einstein = einsteinSubject ? {
          subject: einsteinSubject.subject_name,
          value: einsteinSubject.avg_marks.toFixed(1) + ' / ' + einsteinSubject.max_marks
        } : { subject: 'N/A', value: '-' };

        // Nightmare: Lowest % Marks
        const nightmareSubject = gradedSubjects.length > 0
          ? [...gradedSubjects].sort((a, b) => (a.avg_marks / a.max_marks) - (b.avg_marks / b.max_marks))[0]
          : null;

        const nightmare = nightmareSubject ? {
          subject: nightmareSubject.subject_name,
          value: nightmareSubject.avg_marks.toFixed(1) + ' / ' + nightmareSubject.max_marks
        } : { subject: 'N/A', value: '-' };

        // 4. Granular Bell Curve (SGPI Distribution - 0.5 steps)
        const sgpiDistribution = await db.prepare(`
        SELECT 
          CAST(cgpa * 2 AS INTEGER) / 2.0 as bucket,
        COUNT(*) as count
        FROM STUDENT_LEADERBOARD sl
        JOIN STUDENT s ON sl.student_id = s.student_id
        WHERE s.class = ?
        GROUP BY bucket
        ORDER BY bucket DESC
        `).bind(className).all();

        // Normalize to show full range even if empty
        const bellCurve = [];
        for (let i = 10; i >= 0; i -= 0.5) {
          const bucket = sgpiDistribution.results.find(b => Math.abs(b.bucket - i) < 0.01);
          bellCurve.push({
            name: i.toFixed(1),
            value: bucket ? bucket.count : 0
          });
        }

        // 6. On The Edge (< 75%)
        const onEdge = await db.prepare(`
        SELECT COUNT(*) as count
        FROM STUDENT s
        JOIN STUDENT_LEADERBOARD sl ON s.student_id = sl.student_id
        WHERE s.class = ? AND sl.overall_attendance < 75
        `).bind(className).first();

        // 5. Raw student data for precise highlighting on frontend
        const students = await db.prepare(`
        SELECT s.roll_no, sl.cgpa, s.name
        FROM STUDENT s
        JOIN STUDENT_LEADERBOARD sl ON s.student_id = sl.student_id
        WHERE s.class = ?
        `).bind(className).all();

        return jsonResponse({
          info: classInfo,
          topper,
          insights: {
            massBunk,
            einstein,
            nightmare,
            onEdge: onEdge.count
          },
          bellCurve,
          students: students.results
        });
      }



      // GET /api/students/rank/:rollNo - Get student rank
      if (path.match(/^\/api\/students\/rank\/\d+$/) && method === 'GET') {
        const rollNo = parseInt(path.split('/').pop());

        // Get student from leaderboard with pre-computed ranks
        const student = await db
          .prepare(`
          SELECT 
            s.student_id,
        s.roll_no,
        s.enrollment_id,
        s.name,
        s.dob,
        s.class,
        s.class_id,
        sl.cgpa,
        sl.overall_attendance as attendance,
        sl.rank_cgpa_college,
        sl.rank_cgpa_class,
        sl.rank_attendance_college,
        sl.rank_attendance_class
          FROM STUDENT s
          JOIN STUDENT_LEADERBOARD sl ON s.student_id = sl.student_id
          WHERE s.roll_no = ?
        `)
          .bind(rollNo)
          .first();

        if (!student) {
          return errorResponse('Student not found', 404);
        }

        // Get total counts
        const totals = await db
          .prepare(`
          SELECT 
            COUNT(*) as total_students,
        SUM(CASE WHEN s.class = ? THEN 1 ELSE 0 END) as total_in_class
          FROM STUDENT s
        `)
          .bind(student.class)
          .first();

        return jsonResponse({
          ...student,
          ranks: {
            overall: student.rank_cgpa_college,
            in_class: student.rank_cgpa_class,
            total_students: totals.total_students,
            total_in_class: totals.total_in_class
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
            'GET /api/game/random-pair-subject': 'Get random pair with subject marks for game',
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
