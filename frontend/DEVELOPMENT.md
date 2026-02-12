# SemRank Development Notes

## 🎯 Current Status

✅ Frontend architecture complete
✅ Component library built
✅ Motion system with GSAP implemented
✅ Mock data integrated
⏳ Backend API pending
⏳ Real database integration pending

## 🔄 Next Steps

### 1. Backend Development
- [ ] Set up Cloudflare D1 database
- [ ] Create Cloudflare Worker API endpoints
- [ ] Implement CGPA calculation logic
- [ ] Build ranking computation system
- [ ] Add cron job for data updates (9:30 AM/PM IST)

### 2. Frontend Integration
- [ ] Replace mock data with API calls
- [ ] Add error handling for API failures
- [ ] Implement loading states
- [ ] Add search functionality with real data
- [ ] Create student detail modal/page

### 3. Additional Features
- [ ] Birthday section on homepage
- [ ] Student photo integration
- [ ] Subject-wise rankings
- [ ] Weird/Fun rankings section
- [ ] Class facts and statistics
- [ ] Deep linking to student profiles

### 4. Performance Optimization
- [ ] Implement virtualization for large lists
- [ ] Add service worker for offline support
- [ ] Optimize bundle size
- [ ] Image lazy loading
- [ ] CDN integration for assets

### 5. Deployment
- [ ] Configure environment variables
- [ ] Set up Cloudflare Pages
- [ ] Configure custom domain
- [ ] Add analytics
- [ ] Set up error monitoring

## 🎨 Design Tokens Reference

### Colors
```js
background: '#fef6e4'    // Warm cream
ink: '#001858'           // Deep navy
body: '#172c66'          // Navy blue
bubble: '#f3d2c1'        // Soft peach
bubbleSecondary: '#8bd3dd' // Sky blue
accent: '#f582ae'        // Rose pink
```

### Animation Timing
- Hover scale: 1.06 (300ms)
- Active scale: 0.94 (immediate)
- Bubble entrance: back.out(1.5)
- Stagger delay: 0.05s - 0.08s

### Border Radius
- bubble: 2rem
- bubble-lg: 3rem

## 🔧 Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=https://your-api.workers.dev/api
VITE_CLOUDFLARE_D1_ID=your-d1-database-id
```

- ATTENDANCE (percentage per subject)
- SUBJECT (code, name, type)

### Derived Data (Computed by Cron)
- Student CGPA
- Class rankings
- College rankings
- Subject-wise ranks
- Attendance ranks

## 🎮 Game Logic

### Difficulty Levels
- **Easy** (Rounds 1-5): Gap > 1.0 CGPA or > 20% attendance
- **Medium** (Rounds 6-10): Gap > 0.5 CGPA or > 10% attendance
- **Hard** (Rounds 11+): Any gap

### Scoring
- 1 point per correct guess
- No penalties for wrong answers
- Session-based (no global leaderboard)

## 📱 Responsive Breakpoints

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

All bubbles and grids adjust fluidly across breakpoints.

## 🐛 Known Issues

- [ ] None yet (clean slate!)

## 💡 Future Ideas

- Dark mode toggle
- Animated confetti on game wins
- Student achievement badges
- Weekly/monthly trend graphs
- Export rankings as images
- Shareable student cards
- Comparison history

---

**Last Updated:** February 10, 2026
