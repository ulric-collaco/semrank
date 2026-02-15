
import { useEffect, useState } from 'react';
import Navbar2 from '../components/landing2/Navbar2';
import Hero2 from '../components/landing2/Hero2';
import Leaderboard2 from '../components/landing2/Leaderboard2';
import Footer2 from '../components/landing2/Footer2';
import { leaderboardAPI } from '../utils/api';

export default function LandingPage2() {
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
        <div className="min-h-screen bg-black text-white font-mono selection:bg-green-500 selection:text-black">
            <Navbar2 />
            <Hero2 />

            {/* Cyber Grid Section */}
            <section className="py-20 border-y border-green-900/30 bg-[#020202]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="p-1 border border-green-500/30 inline-block">
                                <h3 className="bg-green-500/10 px-4 py-1 text-green-400 text-sm font-bold uppercase tracking-widest">
                                    Neural Analytics
                                </h3>
                            </div>
                            <h2 className="text-4xl md:text-5xl font-bold uppercase tracking-tighter text-white">
                                Precision Metrics<br />
                                <span className="text-green-500">Zero Latency</span>
                            </h2>
                            <p className="text-green-400/60 leading-relaxed text-lg border-l border-green-500/30 pl-4">
                                Our advanced algorithms process student performance vectors in real-time, delivering actionable intelligence for academic superiority.
                            </p>
                        </div>

                        {/* Visual Data Element */}
                        <div className="grid grid-cols-2 gap-2 p-2 border border-green-500/20 bg-green-500/5">
                            {[85, 92, 78, 95].map((val, i) => (
                                <div key={i} className="aspect-video bg-black/50 border border-green-500/10 relative p-4 flex flex-col justify-between group hover:bg-green-500/10 transition-colors">
                                    <div className="text-[10px] text-green-500/50 uppercase">Metric_0{i + 1}</div>
                                    <div className="w-full h-1 bg-green-900/30 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" style={{ width: `${val}%` }}></div>
                                    </div>
                                    <div className="self-end text-xl font-bold text-green-400">{val}%</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            <Leaderboard2 data={topStudents} />
            <Footer2 />
        </div>
    );
}
