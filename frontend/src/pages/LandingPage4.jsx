
import { useEffect, useState } from 'react';
import Navbar4 from '../components/landing4/Navbar4';
import Hero4 from '../components/landing4/Hero4';
import Leaderboard4 from '../components/landing4/Leaderboard4';
import Footer4 from '../components/landing4/Footer4';
import { leaderboardAPI } from '../utils/api';

export default function LandingPage4() {
    const [topStudents, setTopStudents] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const data = await leaderboardAPI.getTopBySGPA(6, 'all');
                setTopStudents(data);
            } catch (e) {
                console.error(e);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="min-h-screen bg-white text-black font-sans box-border selection:bg-[#ffde00]">
            <Navbar4 />
            <Hero4 />

            {/* Marquee Separator */}
            <div className="bg-black text-white overflow-hidden py-3 border-y-4 border-black items-center flex">
                <div className="whitespace-nowrap animate-[marquee_10s_linear_infinite] text-2xl font-mono font-bold">
                    DATA DRIVEN • NO EXCUSES • PURE PERFORMANCE • DATA DRIVEN • NO EXCUSES • PURE PERFORMANCE •
                </div>
                <div className="whitespace-nowrap animate-[marquee_10s_linear_infinite] text-2xl font-mono font-bold" aria-hidden="true">
                    DATA DRIVEN • NO EXCUSES • PURE PERFORMANCE • DATA DRIVEN • NO EXCUSES • PURE PERFORMANCE •
                </div>
            </div>

            <Leaderboard4 data={topStudents} />
            <Footer4 />
        </div>
    );
}
