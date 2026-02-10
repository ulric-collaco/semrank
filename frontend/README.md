# 🎈 SemRank

**Tagline:** Rankings that move.

A playful, motion-first academic ranking website that visualizes semester performance across students, subjects, and classes.

## 🎯 Product Vision

SemRank transforms traditional academic data (marks, CGPA, attendance) into:

- 🏆 **Interactive Leaderboards** - Top 10 students with organic, bubble-based layouts
- ⚖️ **Student Comparisons** - Side-by-side performance analysis
- 🎮 **Higher/Lower Game** - Guess student rankings in a fun, adaptive game
- 📊 **Class Insights** - Performance statistics across divisions
- 🎨 **Personal Profiles** - ID card-style student views

## 🎨 Design Language

SemRank uses the **Happy Hues #17** color palette for a soft, playful aesthetic:

- **Background:** `#fef6e4` (Warm cream)
- **Primary Ink:** `#001858` (Deep navy)
- **Body Text:** `#172c66` (Navy blue)
- **Main Bubble:** `#f3d2c1` (Soft peach)
- **Secondary Bubble:** `#8bd3dd` (Sky blue)
- **Accent:** `#f582ae` (Rose pink)

### Motion Principles

- All interactions use GSAP for smooth, bouncy animations
- Hover: `scale(1.06)` with `back.out(1.5)` easing
- Active: `scale(0.94)` for tactile feedback
- Sorting: Physical reshuffle with staggered animations
- Reduced motion support included

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── BubbleMenu.jsx        # Navigation overlay
│   │   └── StudentBubble.jsx     # Student card component
│   ├── pages/
│   │   ├── HomePage.jsx          # Landing page
│   │   ├── LeaderboardPage.jsx   # Top 10 rankings
│   │   ├── ComparePage.jsx       # Compare two students
│   │   ├── GamePage.jsx          # Higher/Lower game
│   │   └── AboutPage.jsx         # About SemRank
│   ├── hooks/
│   │   └── useMockStudents.js    # Mock data (replace with API)
│   ├── App.jsx                   # Main app component
│   ├── main.jsx                  # Entry point
│   └── index.css                 # Global styles + Tailwind
├── index.html
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## 🎮 Features

### 1. BubbleMenu Navigation
- Signature overlay navigation with 5 floating bubbles
- GSAP `back.out(1.5)` staggered entrance
- Items: home, leaderboard, compare, game, about

### 2. Leaderboard
- Top 10 students in organic grid layout
- Sort by CGPA or Attendance
- Filter by class (COMPS_A, COMPS_B, COMPS_C)
- Animated reshuffles on sort/filter changes

### 3. Compare Page
- Search two students by name or roll number
- Compare by CGPA or Attendance
- Winner bubble grows and pulses
- Real-time visual feedback

### 4. Higher/Lower Game
- Guess if next student has higher/lower metric
- Choose CGPA or Attendance mode
- Score tracking
- Bounce animation on correct guess
- Drop animation on wrong guess

### 5. Student Bubbles
- Circular photo placeholder
- Attendance ring (SVG progress circle)
- CGPA and Attendance display
- Rank badge
- Class badge
- Hover scale with shadow deepening

## 🔧 Tech Stack

- **React 18** - UI library
- **Vite** - Build tool
- **Tailwind CSS** - Utility-first styling
- **GSAP** - Animation library
- **Axios** - HTTP client (for future API integration)

## 🌐 Data Integration (Future)

Currently uses mock data. To integrate with backend:

1. Replace `useMockStudents` hook with API calls
2. Connect to Cloudflare D1 database
3. Implement GitHub Actions cron for data updates
4. Add search functionality with real student data

## 📐 Accessibility

- ✅ Keyboard navigation support
- ✅ ARIA labels on interactive elements
- ✅ Reduced motion support (`prefers-reduced-motion`)
- ✅ High contrast color ratios
- ✅ Semantic HTML structure

## 🎯 Core Principles

1. **Playful-first, not ERP-first** - Academic data should be fun
2. **Derived data is king** - Precomputed, cached, fast
3. **Discoverability over completeness** - Show what matters
4. **No infinite scrolling tables** - Top 10 only
5. **Ranks should feel alive** - Motion as feedback

## 📝 License

This is a college project and is not affiliated with any official academic system.

---

**SemRank 2026** - Playful rankings for serious semesters
