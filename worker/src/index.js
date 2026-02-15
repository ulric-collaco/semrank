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
      // Get all students from leaderboard
      const allStudents = await getStudentLeaderboardData(db, 'all');

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

      // Get students from pre-computed subject leaderboard
      // MODIFIED: Fetch students for ALL subjects with the SAME NAME (handles split subject codes like Kannada)
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
        WHERE sub.subject_name = (SELECT subject_name FROM SUBJECT WHERE subject_code = ?)
      `;

      if (classFilter !== 'all') {
        query += ` AND s.class = ?`;
      }

      const students = classFilter === 'all'
        ? await db.prepare(query).bind(subjectCode).all()
        : await db.prepare(query).bind(subjectCode, classFilter).all();

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
    }

    // GET /api/stats/subjects - Subject-wise statistics
    if (path === '/api/stats/subjects' && method === 'GET') {
      const classFilter = url.searchParams.get('class') || 'all';

      // Query pre-computed subject-class leaderboard
      let query = `
        SELECT 
          sub.subject_id,
          sub.subject_code,
          sub.subject_name,
          scl.avg_subject_marks,
          scl.rank_in_subject,
          c.class_name
        FROM SUBJECT sub
        JOIN SUBJECT_CLASS_LEADERBOARD scl ON sub.subject_id = scl.subject_id
        JOIN CLASS c ON scl.class_id = c.class_id
      `;

      if (classFilter !== 'all') {
        query += ` WHERE c.class_name = ?`;
      }

      query += ` ORDER BY scl.rank_in_subject`;

      const results = classFilter === 'all'
        ? await db.prepare(query).all()
        : await db.prepare(query).bind(classFilter).all();

      // Group by subject NAME to merge duplicate codes (e.g. Kannada for different branches)
      const subjectMap = {};
      results.results.forEach(row => {
        const subName = row.subject_name;
        if (!subjectMap[subName]) {
          subjectMap[subName] = {
            subject_code: row.subject_code, // Keep one code as reference
            subject_name: row.subject_name,
            classes: []
          };
        }
        subjectMap[subName].classes.push({
          class_name: row.class_name,
          avg_marks: parseFloat(row.avg_subject_marks.toFixed(2)),
          rank: row.rank_in_subject
        });
      });

      // For each subject, get enrollment count and top student
      const subjectStats = await Promise.all(
        Object.values(subjectMap).map(async (subject) => {
          // Get enrollment count and top student using NAME
          let studentQuery = `
            SELECT 
              COUNT(*) as enrollment_count,
              MAX(ssl.subject_total) as max_marks,
              MIN(ssl.subject_total) as min_marks
            FROM STUDENT_SUBJECT_LEADERBOARD ssl
            JOIN SUBJECT sub ON ssl.subject_id = sub.subject_id
            WHERE sub.subject_name = ?
          `;

          if (classFilter !== 'all') {
            studentQuery += ` AND ssl.class_id = (SELECT class_id FROM CLASS WHERE class_name = ?)`;
          }

          const stats = classFilter === 'all'
            ? await db.prepare(studentQuery).bind(subject.subject_name).first()
            : await db.prepare(studentQuery).bind(subject.subject_name, classFilter).first();

          // Get top student
          let topStudentQuery = `
            SELECT s.name, s.class, ssl.subject_total
            FROM STUDENT_SUBJECT_LEADERBOARD ssl
            JOIN STUDENT s ON ssl.student_id = s.student_id
            JOIN SUBJECT sub ON ssl.subject_id = sub.subject_id
            WHERE sub.subject_name = ?
          `;

          if (classFilter !== 'all') {
            topStudentQuery += ` AND s.class = ?`;
          }

          topStudentQuery += ` ORDER BY ssl.rank_subject_college LIMIT 1`;

          const topStudent = classFilter === 'all'
            ? await db.prepare(topStudentQuery).bind(subject.subject_name).first()
            : await db.prepare(topStudentQuery).bind(subject.subject_name, classFilter).first();

          // Calculate average across all classes for this subject
          const avgMarks = subject.classes.reduce((sum, c) => sum + c.avg_marks, 0) / subject.classes.length;

          return {
            subject_code: subject.subject_code,
            subject_name: subject.subject_name,
            enrollment_count: stats.enrollment_count,
            avg_marks: parseFloat(avgMarks.toFixed(2)),
            max_marks: stats.max_marks || 0,
            min_marks: stats.min_marks || 0,
            top_student: topStudent ? {
              name: topStudent.name,
              class: topStudent.class,
              marks: topStudent.subject_total
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
