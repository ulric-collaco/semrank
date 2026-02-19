import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import InsightCard from '../components/InsightCard';
import { statsAPI } from '../utils/api';
import {
    Users,
    Trophy,
    TrendingUp,
    AlertTriangle,
    Ghost,
    Search,
    BarChart3,
    ArrowLeft,
    ChevronDown,
    GraduationCap
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    CartesianGrid,
    ReferenceLine
} from 'recharts';

import { CLASSES } from '../utils/constants';

export default function ClassStatsPage() {
    // State
    const [selectedClass, setSelectedClass] = useState(null);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [rollHighlight, setRollHighlight] = useState('');
    const [highlightedStudent, setHighlightedStudent] = useState(null);

    // Use name from constant for display
    const classes = CLASSES.map(c => ({
        id: c.id,
        name: c.name
    }));

    // Load Stats when class is selected
    useEffect(() => {
        if (!selectedClass) return;

        async function loadStats() {
            setLoading(true);
            try {
                // Determine ID based on selected name or object logic
                // Actually selectedClass state holds the ID in standard patterns, but here user might have used strings.
                // Let's ensure selectedClass stores the ID (COMPS_A).
                const data = await statsAPI.getClassStats(selectedClass);
                setStats(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadStats();
    }, [selectedClass]);

    // Handle Roll Number Highlighting
    useEffect(() => {
        if (!rollHighlight || !stats?.students) {
            setHighlightedStudent(null);
            return;
        }
        const student = stats.students.find(s => s.roll_no.toString() === rollHighlight);
        setHighlightedStudent(student);
    }, [rollHighlight, stats]);

    const chartData = useMemo(() => {
        if (!stats?.bellCurve) return [];
        return stats.bellCurve;
    }, [stats]);

    const highlightBucket = useMemo(() => {
        if (!highlightedStudent) return null;
        // Bucket is 0.5 steps, name is fixed at 1 decimal
        return (Math.floor(highlightedStudent.cgpa * 2) / 2).toFixed(1);
    }, [highlightedStudent]);


    // --- View 1: Class Selection Interstitial (Mobile First) ---
    if (!selectedClass) {
        return (
            <div className="min-h-screen bg-white text-black font-sans box-border flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
                    <div className="max-w-2xl w-full">
                        <div className="text-center mb-12">
                            <div className="inline-block bg-[#ffde00] p-4 border-4 border-black shadow-[8px_8px_0_0_#000] mb-6 rotate-3 hover:rotate-0 transition-transform duration-300">
                                <GraduationCap size={48} className="text-black" strokeWidth={2.5} />
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2 leading-none">
                                Select Batch
                            </h1>
                            <p className="text-black font-bold uppercase tracking-widest text-xs md:text-sm bg-[#00ffff] inline-block px-2 py-1 border-2 border-black shadow-[4px_4px_0_0_#000]">
                                View Detailed Statistics
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 md:gap-4 w-full">
                            {classes.map((c, index) => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedClass(c.id)}
                                    className="w-full bg-white text-black border-4 border-black py-3 md:py-4 px-2 md:px-6 text-xs sm:text-sm md:text-2xl font-black uppercase tracking-normal md:tracking-wider relative group overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:translate-x-1 hover:shadow-[6px_6px_0_0_#000] active:translate-y-0 active:translate-x-0 active:shadow-none flex items-center justify-between whitespace-nowrap"
                                    style={{
                                        animationDelay: `${index * 100}ms`
                                    }}
                                >
                                    <span className="relative z-10 flex w-full justify-between items-center group-hover:text-black transition-colors gap-1">
                                        <span className="truncate">{c.name}</span>
                                        <span className="bg-black text-white p-1 md:p-1.5 border-2 border-transparent group-hover:bg-[#ffde00] group-hover:text-black group-hover:border-black transition-all duration-200 transform group-hover:rotate-45 shrink-0">
                                            <ArrowLeft className="rotate-180 w-3 h-3 md:w-5 md:h-5" strokeWidth={3} />
                                        </span>
                                    </span>
                                </button>
                            ))}
                        </div>

                        <p className="text-center mt-12 font-bold uppercase text-xs opacity-50 tracking-widest">
                            SemRank Analytics
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // --- View 2: Dashboard Loading State ---
    if (loading && !stats) {
        const displayClass = classes.find(c => c.id === selectedClass)?.name || selectedClass;
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-6">
                <div className="w-16 h-16 border-8 border-black border-t-[#ffde00] rounded-full animate-spin"></div>
                <div className="font-black text-4xl uppercase animate-pulse">
                    Analyzing {displayClass}...
                </div>
            </div>
        );
    }

    // --- View 3: Dashboard ---
    const displayClass = classes.find(c => c.id === selectedClass)?.name || selectedClass;

    return (
        <div className="min-h-screen bg-white text-black font-sans box-border selection:bg-[#ffde00]">
            <Navbar />

            {/* Class Selector Header */}
            <div className="bg-black text-white py-4 px-6 sticky top-[64px] z-40 border-b-4 border-black flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">
                        {displayClass} Insights
                    </h1>
                    <button
                        onClick={() => setSelectedClass(null)}
                        className="text-xs font-bold uppercase bg-[#333] hover:bg-[#ffde00] hover:text-black px-3 py-1 transition-colors rounded-sm"
                    >
                        Change Class
                    </button>
                </div>

                {stats && (
                    <div className="flex items-center gap-6">
                        <div className="hidden md:block">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">AVG SGPI</p>
                            <p className="text-xl font-black text-[#00ffff]">{stats.info.avg_cgpa.toFixed(2)}</p>
                        </div>
                        <div className="hidden md:block">
                            <p className="text-[10px] font-bold text-gray-400 uppercase">Class Rank</p>
                            <p className="text-xl font-black text-[#ffde00]">#{stats.info.rank_avg_cgpa}</p>
                        </div>
                    </div>
                )}
            </div>

            <main className="max-w-7xl mx-auto py-12 px-6">

                {/* Hero Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                    {/* Academic Weapon */}
                    <div className="col-span-1 md:col-span-2 bg-white border-4 border-black p-8 relative overflow-hidden group shadow-[8px_8px_0_0_#000] hover:shadow-[12px_12px_0_0_#000] transition-shadow">
                        <div className="absolute -right-8 -bottom-8 text-black/5 rotate-[-15deg] group-hover:rotate-0 transition-transform duration-500">
                            <Trophy size={200} />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-4">
                                <Trophy className="text-[#ffde00]" size={24} />
                                <span className="font-black uppercase tracking-widest text-sm">Class Topper</span>
                            </div>
                            <h2 className="text-4xl md:text-6xl font-black uppercase mb-2 break-words">
                                {stats?.topper?.name || 'N/A'}
                            </h2>
                            <div className="flex items-center gap-4">
                                <span className="bg-black text-white px-3 py-1 font-bold text-lg">
                                    SGPI: {stats?.topper?.cgpa.toFixed(2)}
                                </span>
                                <span className="border-2 border-black px-3 py-1 font-bold text-lg italic">
                                    Roll: {stats?.topper?.roll_no}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Stats Column */}
                    <div className="flex flex-col gap-6">
                        <div className="flex-1 bg-[#ffde00] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] rotate-1 hover:rotate-0 transition-transform">
                            <div className="flex items-center gap-2 mb-2 font-black uppercase text-xs">
                                <Users size={16} /> Total Students
                            </div>
                            <p className="text-4xl font-black">{stats?.info.total_students}</p>
                        </div>
                        <div className="flex-1 bg-[#00ffff] border-4 border-black p-6 shadow-[8px_8px_0_0_#000] -rotate-1 hover:rotate-0 transition-transform">
                            <div className="flex items-center gap-2 mb-2 font-black uppercase text-xs">
                                <AlertTriangle size={16} /> Attendance Issues
                            </div>
                            <p className="text-4xl font-black">{stats?.insights.onEdge} <span className="text-base uppercase">Below 75%</span></p>
                        </div>
                    </div>
                </div>

                {/* Bell Curve Section */}
                <section className="mb-20">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
                        <div>
                            <h3 className="text-3xl md:text-4xl font-black uppercase mb-2">The SGPI Curve</h3>
                            <p className="text-gray-600 font-bold uppercase text-sm tracking-widest">Global Batch Distribution (0.5 Step Granularity)</p>
                        </div>

                        {/* Roll Number Search */}
                        <div className="w-full md:w-auto">
                            <label className="block text-[10px] font-black uppercase mb-1 ml-1 text-gray-500">Highlight Your Rank</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="ENTER ROLL NO"
                                    value={rollHighlight}
                                    onChange={(e) => setRollHighlight(e.target.value)}
                                    className="w-full md:w-64 bg-white border-4 border-black p-3 font-black placeholder:text-gray-300 focus:outline-none focus:shadow-[4px_4px_0_0_#000] transition-all uppercase"
                                />
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-black" size={20} />
                            </div>
                            {highlightedStudent && (
                                <div className="mt-2 text-xs font-black uppercase flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="w-2 h-2 bg-[#ff0000] rounded-full" />
                                    {highlightedStudent.name}: {highlightedStudent.cgpa.toFixed(2)} SGPI
                                </div>
                            )}
                        </div>
                    </div>

                    {chartData.length > 0 ? (
                        <div className="h-[400px] w-full bg-white border-4 border-black p-4 md:p-8 shadow-[12px_12px_0_0_#000] relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>

                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                    <XAxis
                                        dataKey="name"
                                        fontFamily="monospace"
                                        fontWeight="bold"
                                        fontSize={12}
                                        tick={{ fill: '#000' }}
                                    />
                                    <YAxis
                                        fontFamily="monospace"
                                        fontWeight="bold"
                                        fontSize={12}
                                        tick={{ fill: '#000' }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#f3f4f6', opacity: 0.5 }}
                                        contentStyle={{
                                            backgroundColor: '#fff',
                                            border: '4px solid black',
                                            borderRadius: '0',
                                            boxShadow: '8px 8px 0 0 #000',
                                            fontFamily: 'sans-serif',
                                            fontWeight: '900',
                                            textTransform: 'uppercase'
                                        }}
                                    />
                                    <Bar dataKey="value" stroke="#000" strokeWidth={3}>
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.name === highlightBucket ? '#ff0000' : '#00ffff'}
                                                className="transition-all duration-300"
                                            />
                                        ))}
                                    </Bar>
                                    {highlightBucket && (
                                        <ReferenceLine
                                            x={highlightBucket}
                                            stroke="#ff0000"
                                            strokeWidth={4}
                                            strokeDasharray="8 8"
                                            label={{ position: 'top', value: 'YOU', fill: '#ff0000', fontWeight: '900', fontSize: 14 }}
                                        />
                                    )}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-[400px] w-full bg-white border-4 border-black flex items-center justify-center font-black uppercase text-xl shadow-[12px_12px_0_0_#000]">
                            No Data Available
                        </div>
                    )}
                </section>

                {/* Insight Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <InsightCard
                        title="Mass Bunk"
                        subtitle="Lowest Attendance"
                        type="stat"
                        data={{
                            value: stats?.insights.massBunk?.subject || 'N/A',
                            label: stats?.insights.massBunk?.value || '0%',
                            subtext: 'High Probability'
                        }}
                        icon={Ghost}
                        accentColor="#ffde00"
                    />
                    <InsightCard
                        title="Einstein"
                        subtitle="Easiest 10 Pointer"
                        type="stat"
                        data={{
                            value: stats?.insights.einstein?.subject || 'N/A',
                            label: stats?.insights.einstein?.value || '0',
                            subtext: 'Avg Marks'
                        }}
                        icon={TrendingUp}
                        accentColor="#00ff00"
                    />
                    <InsightCard
                        title="The Nightmare"
                        subtitle="Hardest Subject"
                        type="stat"
                        data={{
                            value: stats?.insights.nightmare?.subject || 'N/A',
                            label: stats?.insights.nightmare?.value || '0',
                            subtext: 'Avg Marks'
                        }}
                        icon={AlertTriangle}
                        accentColor="#ff0000"
                    />
                </div>

            </main>
            <Footer />
        </div>
    );
}
