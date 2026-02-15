import { useEffect, useState } from 'react';
import Navbar4 from '../components/landing4/Navbar4';
import Hero4 from '../components/landing4/Hero4';
import Leaderboard4 from '../components/landing4/Leaderboard4';
import Footer4 from '../components/landing4/Footer4';
import InsightCard from '../components/landing4/InsightCard';
import StudentModal4 from '../components/landing4/StudentModal4';
import { leaderboardAPI, studentAPI, birthdayAPI } from '../utils/api';
import { Swords, BarChart3, TrendingUp, AlertTriangle, Cake } from 'lucide-react';

export default function LandingPage4() {
    const [topStudents, setTopStudents] = useState([]);
    const [sortBy, setSortBy] = useState('sgpa');
    const [selectedStudentRoll, setSelectedStudentRoll] = useState(null);

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
                    // Seeded Random based on Date string
                    const today = new Date().toDateString(); // "Mon Feb 16 2026"
                    let hash = 0;
                    for (let i = 0; i < today.length; i++) hash = today.charCodeAt(i) + ((hash << 5) - hash);

                    // Pick index deterministically
                    const safeLimit = leaderboardData.length - 2;
                    const dailyIndex = Math.abs(hash) % safeLimit;

                    setRivalryData([leaderboardData[dailyIndex], leaderboardData[dailyIndex + 1]]);
                }

                // --- 2. Rank Distribution (Refined Bell Curve - Static DB Data) ---
                setRankDistData([
                    { name: '9.5+', value: 9 },
                    { name: '9.0', value: 21 },
                    { name: '8.5', value: 40 },
                    { name: '8.0', value: 72 },
                    { name: '7.5', value: 52 },
                    { name: '7.0', value: 28 },
                    { name: '6-7', value: 16 },
                    { name: '<6', value: 9 },
                ]);

                // --- 3. GPA Booster (Static from DB - Highest Grade Pointer) ---
                // Subject with highest GP (10.0): ESSENTIAL COMPUTING SKILLS...
                setGpaBoosterData({
                    value: 'CEP',
                    label: 'GP: 10.0',
                    subtext: 'EASIEST 10 POINTER'
                });

                // --- 4. Class Bunk Stats (Static from DB) ---
                // Class with lowest attendance: COMPS A (70.28%)
                setBunkStatsData({
                    value: 'COMPS A',
                    label: '70% AVG',
                    subtext: 'HIGHEST BUNK RATE'
                });


            } catch (e) {
                console.error(e);
            }
        }
        fetchData();
    }, [sortBy]);

    return (
        <div className="min-h-screen bg-white text-black font-sans box-border selection:bg-[#ffde00] overflow-x-hidden">
            <Navbar4 />
            <div className="relative z-50">
                <Hero4 />
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

            <Leaderboard4 data={topStudents} sortBy={sortBy} setSortBy={setSortBy} />

            {/* Daily Intel Section - Insights */}
            <section className="py-12 px-6 max-w-7xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-black uppercase mb-8 text-center italic transform -rotate-1">
                    Daily Intel
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
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
                            data={rankDistData}
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

                    {/* Insight 5: Birthday Spotlight (Conditional) */}
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
                </div>
            </section>

            {selectedStudentRoll && (
                <StudentModal4
                    rollNo={selectedStudentRoll}
                    onClose={() => setSelectedStudentRoll(null)}
                />
            )}

            <Footer4 />
        </div>
    );
}
