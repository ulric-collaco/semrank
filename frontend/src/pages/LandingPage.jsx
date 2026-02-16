import { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Leaderboard from '../components/Leaderboard';
import Footer from '../components/Footer';
import InsightCard from '../components/InsightCard';
import StudentModal from '../components/StudentModal';
import { leaderboardAPI, studentAPI, birthdayAPI } from '../utils/api';
import { Swords, BarChart3, TrendingUp, AlertTriangle, Cake } from 'lucide-react';

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

    useEffect(() => {
        async function fetchData() {
            try {
                // Parallel Fetching for speed
                const [leaderboardData, subjectStats, classRankings, birthdayData] = await Promise.all([
                    sortBy === 'sgpa' ? leaderboardAPI.getTopBySGPA(50, 'all') : leaderboardAPI.getTopByAttendance(50, 'all'),
                    studentAPI.getSubjectStats ? studentAPI.getSubjectStats() : Promise.resolve([]),
                    leaderboardAPI.getClassRankings ? leaderboardAPI.getClassRankings() : Promise.resolve([]),
                    birthdayAPI.getTodaysBirthdays ? birthdayAPI.getTodaysBirthdays().catch(() => []) : Promise.resolve([])
                ]);

                setTopStudents(leaderboardData.slice(0, 6)); // Keep top 6 for main board
                setBirthdays(birthdayData || []);

                // --- 1. Rivalry Mode (Seeded Daily Matchup) ---
                if (leaderboardData.length >= 2) {
                    const today = new Date().toDateString();
                    let hash = 0;
                    for (let i = 0; i < today.length; i++) hash = today.charCodeAt(i) + ((hash << 5) - hash);
                    const dailyIndex = Math.abs(hash) % (leaderboardData.length - 2);
                    setRivalryData([leaderboardData[dailyIndex], leaderboardData[dailyIndex + 1]]);
                }

                // --- 2. Rank Distribution (Real DB Data) ---
                if (leaderboardData.length > 0) {
                    const buckets = {
                        '9.5+': 0, '9.0-9.5': 0, '8.5-9.0': 0, '8.0-8.5': 0,
                        '7.5-8.0': 0, '7.0-7.5': 0, '6.0-7.0': 0, '<6.0': 0
                    };
                    leaderboardData.forEach(s => {
                        const v = s.cgpa;
                        if (v >= 9.5) buckets['9.5+']++;
                        else if (v >= 9.0) buckets['9.0-9.5']++;
                        else if (v >= 8.5) buckets['8.5-9.0']++;
                        else if (v >= 8.0) buckets['8.0-8.5']++;
                        else if (v >= 7.5) buckets['7.5-8.0']++;
                        else if (v >= 7.0) buckets['7.0-7.5']++;
                        else if (v >= 6.0) buckets['6.0-7.0']++;
                        else buckets['<6.0']++;
                    });
                    setRankDistData({
                        simple: Object.entries(buckets).map(([name, value]) => ({ name, value })),
                        detailed: Object.entries(buckets).map(([name, value]) => ({ name, value }))
                    });
                }

                // --- 3. GPA Booster & Nightmare (Derived from Subject Stats) ---
                if (subjectStats && subjectStats.subjects?.length > 0) {
                    const sortedSubjects = [...subjectStats.subjects].sort((a, b) => b.avg_marks - a.avg_marks);
                    const easiest = sortedSubjects[0];
                    const hardest = sortedSubjects[sortedSubjects.length - 1];

                    setGpaBoosterData({
                        value: easiest.subject_name.split(' ')[0], // Short name
                        label: `AVG: ${easiest.avg_marks.toFixed(1)}`,
                        subtext: 'EASIEST 10 POINTER'
                    });

                    setBunkStatsData({
                        value: hardest.subject_name.split(' ')[0], // Short name
                        label: `AVG: ${hardest.avg_marks.toFixed(1)}`,
                        subtext: 'HIGHEST FAIL RATE'
                    });
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
