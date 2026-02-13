# SemRank

A playful, motion-first academic ranking website that visualizes semester performance across students, subjects, and classes. SemRank allows you to explore student rankings, compare performance, and even play a higher/lower stat game.

## 🚀 Key Features

*   **Leaderboard**: View top performers with dynamic filtering by class and sorting by CGPA or attendance.
*   **Compare**: Head-to-head comparison of students with visual feedback on better stats.
*   **Game**: A "Higher/Lower" game to guess student stats.
*   **Student Profiles**: Detailed breakdown of student performance including attendance and grades.

## 🎓 SGPI Calculation Methodology

The **Semester Grade Performance Index (SGPI)** is calculated based on the Fr. Conceicao Rodrigues College of Engineering (Fr. CRCE) Academic Rule Book (R2024). It is a weighted average that accounts for the credit value of each course.

### 1. Credits & Grade Points
*   **Credits (C)**: Assigned based on workload (e.g., Theory = 3-4 credits, Lab = 1-2 credits).
*   **Grade Points (GP)**: Absolute grading system.
    *   **O** (≥ 85): 10 pts
    *   **A** (80-84.99): 9 pts
    *   **B** (70-79.99): 8 pts
    *   **C** (60-69.99): 7 pts
    *   **D** (50-59.99): 6 pts
    *   **E** (45-49.99): 5 pts
    *   **P** (40-44.99): 4 pts
    *   **F** (< 40): 0 pts

### 2. The Formula
```math
SGPI = \frac{\sum (C_i \times GP_i)}{\sum C_i}
```

Where:
*   `Ci` = Credits for course `i`
*   `GPi` = Grade Points earned in course `i`

### 3. Example Calculation
Imagine a student with the following results:

| Course | Type | Credits | Marks | Grade | Points | Weighted Points (C × GP) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Mathematics | Theory | 3 | 86 | O | 10 | 30 |
| Physics | Theory | 3 | 65 | C | 7 | 21 |
| Eng. Mechanics | Theory | 3 | 55 | D | 6 | 18 |
| Physics Lab | Practical | 1 | 75 | B | 8 | 8 |
| **Total** | | **10** | | | | **77** |

**Final SGPI** = 77 / 10 = **7.70**

### 4. Impact of Failure
If a student fails a course (Grade F), the Grade Point is considered **0**.
*   *Example*: Failing Physics would result in 0 points for that course.
*   New Total Points: 30 + 0 + 18 + 8 = 56
*   New SGPI: 56 / 10 = **5.60**

## 🛠 Tech Stack

**Frontend**:
*   React 18 + Vite
*   Tailwind CSS for styling
*   GSAP for animations
*   Axios for API requests

**Backend**:
*   Cloudflare Workers
*   Cloudflare D1 (Database)

## 📂 Project Structure

*   `frontend/`: React application source code.
*   `worker/`: Cloudflare Worker API logic and database interactions.
*   `data/`: Data processing scripts and raw data files.



### Prerequisites
*   Node.js 18+
*   npm
