import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Leaderboard from '../components/Leaderboard';
import Footer from '../components/Footer';
import InsightCard from '../components/InsightCard';
import StudentModal from '../components/StudentModal';
import { leaderboardAPI, studentAPI, birthdayAPI, statsAPI } from '../utils/api';
import { formatClassName } from '../utils/format';
import { Swords, BarChart3, TrendingUp, AlertTriangle, Cake, Shield, Trophy, Zap } from 'lucide-react';

export default function LandingPage() {
    const [topStudents, setTopStudents] = useState([]);
    const [sortBy, setSortBy] = useState('sgpa');
    const [isMobile, setIsMobile] = useState(false);
    const [selectedStudentRoll, setSelectedStudentRoll] = useState(null);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Insight Data States
    const [rivalryData, setRivalryData] = useState(null);
    const [rankDistData, setRankDistData] = useState(null);
    const [gpaBoosterData, setGpaBoosterData] = useState(null);
    const [bunkStatsData, setBunkStatsData] = useState(null);
    const [birthdays, setBirthdays] = useState([]);
    const [carryDiffData, setCarryDiffData] = useState(null);
    const [carryDiffLabel, setCarryDiffLabel] = useState('1V63 DIFF');
    const [classWarData, setClassWarData] = useState(null);
    const [attGradesData, setAttGradesData] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // Parallel Fetching for speed
                const [leaderboardData, subjectStats, classRankings, birthdayData, distributionData, extraSgpaData] = await Promise.all([
                    sortBy === 'sgpa' ? leaderboardAPI.getTopBySGPA(50, 'all') : leaderboardAPI.getTopByAttendance(50, 'all'),
                    statsAPI.getSubjectStats('all'), // Correct API call
                    leaderboardAPI.getClassRankings(),
                    birthdayAPI.getTodaysBirthdays ? birthdayAPI.getTodaysBirthdays().catch(() => []) : Promise.resolve([]),
                    statsAPI.getBatchDistribution().catch(() => []), /* New Distribution Endpoint */
                    sortBy !== 'sgpa' ? leaderboardAPI.getTopBySGPA(50, 'all') : Promise.resolve(null)
                ]);

                setTopStudents(leaderboardData.slice(0, 6)); // Keep top 6 for main board
                setBirthdays(birthdayData || []);

                // --- 1. Rivalry Mode (Seeded Daily Matchup - STRICTLY SGPA) ---
                const rivalrySource = sortBy === 'sgpa' ? leaderboardData : extraSgpaData;

                if (rivalrySource && rivalrySource.length >= 2) {
                    const today = new Date().toDateString();
                    let hash = 0;
                    for (let i = 0; i < today.length; i++) hash = today.charCodeAt(i) + ((hash << 5) - hash);
                    const dailyIndex = Math.abs(hash) % (rivalrySource.length - 2);
                    setRivalryData([rivalrySource[dailyIndex], rivalrySource[dailyIndex + 1]]);
                }

                // --- 2. Rank Distribution (Real DB Data) ---
                if (distributionData && distributionData.length > 0) {
                    setRankDistData({
                        simple: distributionData,
                        detailed: distributionData
                    });
                }

                // --- 3. GPA Booster (Best Subject) ---
                if (subjectStats && subjectStats.subjects?.length > 0) {
                    const subjects = subjectStats.subjects || [];
                    const sortedSubjects = [...subjects].sort((a, b) => {
                        const gpA = parseFloat(a.avg_gp || a.avg_gpa || 0);
                        const gpB = parseFloat(b.avg_gp || b.avg_gpa || 0);
                        return gpB - gpA;
                    });
                    const easiest = sortedSubjects[0];

                    setGpaBoosterData({
                        value: easiest.subject_name.split(' ')[0], // Short name
                        label: `AVG GP: ${parseFloat(easiest.avg_gp || easiest.avg_gpa || 0).toFixed(2)}`,
                        subtext: 'EASIEST 10 POINTER'
                    });
                }

                // --- 4. Bunk Lords (Worst Attendance Class) ---
                if (classRankings && classRankings.length > 0) {
                    const bunkLordClass = [...classRankings].sort((a, b) => a.avg_attendance - b.avg_attendance)[0];

                    setBunkStatsData({
                        value: formatClassName(bunkLordClass.class_name),
                        label: `${bunkLordClass.avg_attendance}%`,
                        subtext: 'LOWEST ATTENDANCE'
                    });
                }

                // --- 5. Carry Diff (Class whose topper carries hardest — with photo) ---
                if (classRankings && classRankings.length > 0) {
                    let maxDiff = 0;
                    let carryClass = null;
                    classRankings.forEach(c => {
                        if (c.top_student) {
                            const diff = parseFloat(c.top_student.cgpa) - parseFloat(c.avg_cgpa);
                            if (diff > maxDiff) {
                                maxDiff = diff;
                                carryClass = c;
                            }
                        }
                    });

                    if (carryClass && carryClass.top_student) {
                        setCarryDiffLabel('1V63 DIFF');
                        setCarryDiffData([{
                            id: carryClass.top_student.roll_no,
                            label: carryClass.top_student.name,
                            value: '',
                            image: `/student_faces/${carryClass.top_student.roll_no}.png`,
                            subtext: (
                                <div className="flex flex-col items-center gap-1 mt-1">
                                    <span className="font-black text-white bg-black px-2 py-0.5 text-lg -rotate-2 shadow-[2px_2px_0px_rgba(0,0,0,0.2)]">
                                        SGPA {parseFloat(carryClass.top_student.cgpa).toFixed(2)}
                                    </span>
                                    <span className="font-bold text-xs bg-[#ffde00] px-1.5 py-0.5 border border-black rotate-1 shadow-[1px_1px_0px_black]">
                                        +{maxDiff.toFixed(2)} DIFF
                                    </span>
                                </div>
                            )
                        }]);
                    }
                }

                // --- 6. Class War (Most students in top 50) ---
                if (leaderboardData && leaderboardData.length > 0) {
                    const classCounts = {};
                    leaderboardData.forEach(s => {
                        const cls = s.class || 'Unknown';
                        classCounts[cls] = (classCounts[cls] || 0) + 1;
                    });
                    const sorted = Object.entries(classCounts).sort((a, b) => b[1] - a[1]);
                    const [topClass, topCount] = sorted[0];

                    setClassWarData({
                        value: formatClassName(topClass),
                        label: 'TOP CLASS RN',
                        subtext: `${topCount} IN TOP 50`
                    });
                }

                // --- 7. Attendance ≠ Grades (High SGPA + Low Attendance, daily rotation) ---
                if (leaderboardData && leaderboardData.length >= 10) {
                    // From top 20 SGPA students, find those with worst attendance
                    const top20 = [...leaderboardData]
                        .sort((a, b) => parseFloat(b.cgpa) - parseFloat(a.cgpa))
                        .slice(0, 20);
                    const byLowestAtt = [...top20].sort((a, b) => parseFloat(a.attendance) - parseFloat(b.attendance));
                    const pool = byLowestAtt.slice(0, 5);

                    // Daily rotation using date seed
                    const todayStr = new Date().toDateString();
                    let attHash = 0;
                    for (let i = 0; i < todayStr.length; i++) attHash = todayStr.charCodeAt(i) + ((attHash << 3) - attHash);
                    const pick = pool[Math.abs(attHash) % pool.length];

                    if (pick) {
                        setAttGradesData([{
                            id: pick.roll_no,
                            label: pick.name,
                            value: '',
                            image: `/student_faces/${pick.roll_no}.png`,
                            subtext: `SGPA ${pick.cgpa} • ATT ${parseFloat(pick.attendance).toFixed(0)}%`
                        }]);
                    }
                }


            } catch (e) {
                console.error(e);
            }
        }
        fetchData();
    }, [sortBy]);

    return (
        <div className="min-h-screen bg-white text-black font-sans box-border selection:bg-[#ffde00] overflow-x-hidden">
            <Navbar />
            <div className="relative z-50">
                <Hero />
            </div>

            {/* Marquee Separator */}
            <div className="bg-black text-white overflow-hidden py-3 border-y-4 border-black items-center flex relative z-10">
                <div className="whitespace-nowrap animate-marquee-reverse text-2xl font-mono font-bold px-4">
                    DATA DRIVEN • NO EXCUSES • PURE PERFORMANCE • DATA DRIVEN • NO EXCUSES • PURE PERFORMANCE •
                </div>
                <div className="whitespace-nowrap animate-marquee-reverse text-2xl font-mono font-bold px-4" aria-hidden="true">
                    DATA DRIVEN • NO EXCUSES • PURE PERFORMANCE • DATA DRIVEN • NO EXCUSES • PURE PERFORMANCE •
                </div>
            </div>

            <Leaderboard data={topStudents} sortBy={sortBy} setSortBy={setSortBy} />

            {/* Daily Intel Section - Insights */}
            <section className="py-12 px-6 max-w-7xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-black uppercase mb-8 text-center italic transform -rotate-1">
                    Daily Intel
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
                    {/* Insight 0: Birthday Spotlight (Conditional - Top Priority) */}
                    {birthdays.length > 0 && (
                        <InsightCard
                            title="Cake Day"
                            subtitle="TODAY'S LEGENDS"
                            type="list"
                            data={birthdays.map(s => ({
                                id: s.roll_no,
                                label: s.name,
                                value: '🎂',
                                image: s.roll_no ? `/student_faces/${s.roll_no}.png` : null,
                                subtext: s.class
                            }))}
                            onStudentClick={setSelectedStudentRoll}
                            icon={Cake}
                            accentColor="#ff69b4"
                        />
                    )}

                    {/* Insight 1: Rivalry */}
                    <InsightCard
                        title="Rivalry"
                        subtitle="MATCHUP OF THE DAY"
                        type="rivalry"
                        data={rivalryData}
                        icon={Swords}
                        accentColor="#ff0000"
                        onStudentClick={setSelectedStudentRoll}
                    />

                    {/* Insight 2: Rank Distribution (Spans 2 columns for detail) */}
                    <div className="md:col-span-2">
                        <InsightCard
                            title="The Curve"
                            subtitle="BATCH PERFORMANCE"
                            type="chart"
                            data={rankDistData ? (isMobile ? rankDistData.simple : rankDistData.detailed) : null}
                            icon={BarChart3}
                            accentColor="#00ffff"
                            showXAxis={!isMobile}
                        />
                    </div>

                    {/* Insight 3: GPA Booster */}
                    <InsightCard
                        title="GPA Booster"
                        subtitle="FREE MARKS"
                        type="stat"
                        data={gpaBoosterData}
                        icon={TrendingUp}
                        accentColor="#00ff00"
                    />

                    {/* Insight 4: Bunk Stats */}
                    <InsightCard
                        title="Bunk Lords"
                        subtitle="CLASS ATTENDANCE"
                        type="stat"
                        data={bunkStatsData}
                        icon={AlertTriangle}
                        accentColor="#ffde00"
                    />

                    {/* Insight 5: Carry Diff (with topper photo, clickable) */}
                    <InsightCard
                        title="Carry Diff"
                        subtitle={carryDiffLabel}
                        type="list"
                        data={carryDiffData}
                        onStudentClick={setSelectedStudentRoll}
                        icon={Shield}
                        accentColor="#9333ea"
                    />

                    {/* Insight 6: Class War */}
                    <InsightCard
                        title="Class War"
                        subtitle="TOP 50 DOMINATION"
                        type="stat"
                        data={classWarData}
                        icon={Trophy}
                        accentColor="#ffde00"
                    />

                    {/* Insight 7: Attendance ≠ Grades (daily rotation, clickable) */}
                    <InsightCard
                        title="ATT ≠ GPA"
                        subtitle="BODY ABSENT, MIND PRESENT"
                        type="list"
                        data={attGradesData}
                        onStudentClick={setSelectedStudentRoll}
                        icon={Zap}
                        accentColor="#ff4500"
                    />


                </div>
            </section>

            {selectedStudentRoll && (
                <StudentModal
                    rollNo={selectedStudentRoll}
                    onClose={() => setSelectedStudentRoll(null)}
                />
            )}

            <Footer />
        </div>
    );
}
