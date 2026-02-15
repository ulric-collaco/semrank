import { useEffect, useState } from 'react';
import Navbar4 from '../components/landing4/Navbar4';
import Hero4 from '../components/landing4/Hero4';
import Leaderboard4 from '../components/landing4/Leaderboard4';
import Footer4 from '../components/landing4/Footer4';
import InsightCard from '../components/landing4/InsightCard';
import { leaderboardAPI, studentAPI } from '../utils/api';
import { Swords, BarChart3, TrendingUp, AlertTriangle } from 'lucide-react';

export default function LandingPage4() {
    const [topStudents, setTopStudents] = useState([]);
    const [sortBy, setSortBy] = useState('sgpa');

    // Insight Data States
    const [rivalryData, setRivalryData] = useState(null);
    const [rankDistData, setRankDistData] = useState(null);
    const [gpaBoosterData, setGpaBoosterData] = useState(null);
    const [bunkStatsData, setBunkStatsData] = useState(null);

    useEffect(() => {
        async function fetchData() {
            try {
                // Parallel Fetching for speed
                const [leaderboardData, subjectStats, classRankings] = await Promise.all([
                    sortBy === 'sgpa' ? leaderboardAPI.getTopBySGPA(50, 'all') : leaderboardAPI.getTopByAttendance(50, 'all'),
                    studentAPI.getSubjectStats ? studentAPI.getSubjectStats() : Promise.resolve([]), // Fallback if API missing
                    leaderboardAPI.getClassRankings ? leaderboardAPI.getClassRankings() : Promise.resolve([])
                ]);

                setTopStudents(leaderboardData.slice(0, 6));

                // --- 1. Rivalry Mode ---
                if (leaderboardData.length >= 2) {
                    const randomIdx = Math.floor(Math.random() * (leaderboardData.length - 2));
                    setRivalryData([leaderboardData[randomIdx], leaderboardData[randomIdx + 1]]);
                }

                // --- 2. Rank Distribution (Static from DB - Full Batch) ---
                setRankDistData([
                    { name: '9+', value: 30 },
                    { name: '8-9', value: 112 },
                    { name: '7-8', value: 80 },
                    { name: '<7', value: 25 },
                ]);

                // --- 3. GPA Booster (Static from DB) ---
                // Subject with highest average marks: DATA STRUCTURES (~134)
                setGpaBoosterData({
                    value: 'DATA STRUC',
                    label: 'AVG: 134',
                    subtext: 'HIGHEST SCORES'
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
        <div className="min-h-screen bg-white text-black font-sans box-border selection:bg-[#ffde00]">
            <Navbar4 />
            <Hero4 />

            {/* Marquee Separator */}
            <div className="bg-black text-white overflow-hidden py-3 border-y-4 border-black items-center flex">
                <div className="whitespace-nowrap animate-marquee text-2xl font-mono font-bold px-4">
                    DATA DRIVEN • NO EXCUSES • PURE PERFORMANCE • DATA DRIVEN • NO EXCUSES • PURE PERFORMANCE •
                </div>
                <div className="whitespace-nowrap animate-marquee text-2xl font-mono font-bold px-4" aria-hidden="true">
                    DATA DRIVEN • NO EXCUSES • PURE PERFORMANCE • DATA DRIVEN • NO EXCUSES • PURE PERFORMANCE •
                </div>
            </div>

            <Leaderboard4 data={topStudents} sortBy={sortBy} setSortBy={setSortBy} />

            {/* Daily Intel Section - Insights */}
            <section className="py-12 px-6 max-w-7xl mx-auto">
                <h2 className="text-4xl md:text-5xl font-black uppercase mb-8 text-center italic transform -rotate-1">
                    Daily Intel
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Insight 1: Rivalry */}
                    <InsightCard
                        title="Rivalry"
                        subtitle="MATCHUP OF THE DAY"
                        type="rivalry"
                        data={rivalryData}
                        icon={Swords}
                        accentColor="#ff0000"
                    />

                    {/* Insight 2: Rank Distribution */}
                    <InsightCard
                        title="The Curve"
                        subtitle="BATCH PERFORMANCE"
                        type="chart"
                        data={rankDistData}
                        icon={BarChart3}
                        accentColor="#00ffff"
                    />

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
            <Footer4 />
        </div>
    );
}
