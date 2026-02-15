import { useState } from 'react';
import { User, Calculator, Info, ChevronRight, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatClassName } from '../utils/format';
import { studentAPI } from '../utils/api';

export default function StudentIDCard({ student, loading, error, onClose }) {
    const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
    const [analysisData, setAnalysisData] = useState(null);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleAnalyze = async () => {
        if (analysisData) {
            setShowAnalysis(true);
            return;
        }
        setIsAnalyzing(true);
        try {
            const data = await studentAPI.getSGPIAnalysis(student.student_id);
            setAnalysisData(data);
            setShowAnalysis(true);
        } catch (err) {
            console.error("Analysis failed:", err);
            alert("Could not load calculation breakdown.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-[950px] bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 flex items-center justify-center min-h-[300px]">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="w-full max-w-[950px] bg-slate-900/60 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 text-center min-h-[200px] flex flex-col items-center justify-center gap-3">
                <p className="text-slate-400 font-medium text-sm">{error || "Student details not available."}</p>
                <button onClick={onClose} className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-lg text-xs font-medium transition-colors">Close</button>
            </div>
        );
    }

    const formatFloat = (num, decimals) => {
        if (num === null || num === undefined) return 'N/A';
        const val = parseFloat(num);
        return isNaN(val) ? 'N/A' : val.toFixed(decimals);
    };

    const topSubjects = student.subjects
        ? [...student.subjects].sort((a, b) => (a.rank || 999) - (b.rank || 999)).slice(0, 4)
        : [];

    const subjects = student.subjects || [];
    const activeSubject = selectedSubjectIndex !== null ? subjects[selectedSubjectIndex] : null;

    const getMaxMark = () => {
        if (!activeSubject) return 25;
        const marks = [activeSubject.ese || 0, activeSubject.mse || 0, activeSubject.pr_ise1 || 0, activeSubject.pr_ise2 || 0, activeSubject.th_ise1 || 0, activeSubject.th_ise2 || 0];
        return Math.max(...marks, 25);
    };
    const maxMark = getMaxMark();

    const BarBox = ({ label, value }) => (
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-[32px]">
            <div className="w-full bg-white/5 rounded-t-md h-24 md:h-28 relative flex items-end justify-center pb-0 overflow-hidden border border-white/5">
                <div className="w-full mx-1 rounded-t-[2px] animate-bar-grow flex items-end justify-center pb-1 bg-indigo-500/80 backdrop-blur-sm" style={{ height: `${(value / maxMark) * 100}%` }}>
                    <span className="text-white/90 text-[10px] font-semibold">{value}</span>
                </div>
            </div>
            <div className="text-center w-full">
                <span className="text-[9px] uppercase font-bold text-slate-500 block truncate w-full">{label}</span>
            </div>
        </div>
    );



    const ViewRechartsBarChart = ({ activeSubject, maxMarks }) => {
        const data = [
            { name: 'MSE', value: activeSubject.mse || 0, fill: '#6366f1' }, // Indigo 500
            { name: 'ESE', value: activeSubject.ese || 0, fill: '#8b5cf6' }, // Violet 500
            { name: 'T1', value: activeSubject.th_ise1 || 0, fill: '#ec4899' }, // Pink 500
            { name: 'T2', value: activeSubject.th_ise2 || 0, fill: '#ec4899' },
            { name: 'P1', value: activeSubject.pr_ise1 || 0, fill: '#14b8a6' }, // Teal 500
            { name: 'P2', value: activeSubject.pr_ise2 || 0, fill: '#14b8a6' },
        ];

        const chartConfig = {
            value: {
                label: "Marks",
                color: "hsl(var(--primary))",
            },
        };

        return (
            <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                <BarChart data={data} margin={{ top: 20, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        domain={[0, maxMarks]}
                    />
                    <ChartTooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        content={<ChartTooltipContent hideLabel />}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} fillOpacity={0.8} />
                        ))}
                        <LabelList dataKey="value" position="top" fill="#cbd5e1" fontSize={10} fontWeight={600} formatter={(val) => val > 0 ? val : ''} />
                    </Bar>
                </BarChart>
            </ChartContainer>
        );
    };

    const shortName = (name) => {
        if (!name) return '';
        let s = name.replace(/\s*-\s*Theory/gi, '').replace(/\s*-\s*Practical/gi, ' (P)').replace(/\s*\(Theory\)/gi, '').replace(/\s*\(Practical\)/gi, ' (P)');
        return s.length > 18 ? s.substring(0, 16) + '…' : s;
    };

    const ranksContent = (
        <div className="grid grid-cols-2 md:flex md:flex-wrap gap-1.5 w-full">
            {[
                { label: 'College Rank', val: student.rank_cgpa_college },
                { label: 'Class Rank', val: student.rank_cgpa_class },
                { label: 'College Attendance', val: student.rank_attendance_college },
                { label: 'Class Attendance', val: student.rank_attendance_class }
            ].map((rank, idx) => (
                rank.val && (
                    <div key={idx} className="py-1 px-2 md:px-2.5 bg-white/5 border border-white/10 rounded-md flex items-center justify-between gap-1 md:gap-2 hover:bg-white/10 transition-colors md:flex-1 md:min-w-[120px]">
                        <span className="text-[7px] md:text-[8px] uppercase tracking-wider text-slate-400 font-medium whitespace-nowrap">{rank.label}</span>
                        <span className={`font-mono text-[11px] md:text-xs font-bold ${rank.val === 1 ? 'text-amber-400 font-extrabold shadow-amber-500/20' : 'text-white'}`}>#{rank.val}</span>
                    </div>
                )
            ))}
        </div>
    );

    const topSubjectsContent = (
        <>
            {/* Top Subjects — DESKTOP: original horizontal rectangles */}
            <div className="hidden sm:grid grid-cols-2 gap-1.5">
                {topSubjects.map((sub, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-white/5 border border-white/5 hover:bg-white/10 transition-colors h-auto min-h-[44px]">
                        <div className="flex flex-col justify-center min-w-0 pr-2">
                            <span className="text-sm font-medium text-slate-200 truncate leading-tight mt-0.5" title={sub.subject_name}>{sub.subject_name}</span>
                        </div>
                        <div className="flex flex-col items-end justify-center pl-2 border-l border-white/10">
                            <span className="text-sm font-bold text-white leading-none">
                                {sub.total_marks}
                                <span className="text-[10px] text-slate-500 font-medium ml-0.5">/{sub.maxMarks || 100}</span>
                            </span>
                            <span className={`text-[8px] font-bold mt-0.5 ${sub.rank <= 3 ? 'text-amber-400' : 'text-slate-500'}`}>#{sub.rank || '-'}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Top Subjects — MOBILE: horizontal rectangles like rank pills */}
            {topSubjects.length > 0 && (
                <div className="grid grid-cols-2 gap-1.5 w-full sm:hidden">
                    {topSubjects.map((sub, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors h-auto min-h-[40px]">
                            <div className="flex flex-col justify-center min-w-0 pr-1.5">
                                <span className="text-[6px] uppercase tracking-wider text-slate-500 font-bold mb-0.5 leading-none">Best #{idx + 1}</span>
                                <span className="text-[10px] font-medium text-slate-200 truncate leading-tight" title={sub.subject_name}>{shortName(sub.subject_name)}</span>
                            </div>
                            <div className="flex flex-col items-end justify-center pl-1.5 border-l border-white/10 shrink-0">
                                <span className="text-xs font-bold text-white leading-none">
                                    {sub.total_marks}
                                    <span className="text-[9px] text-slate-500 font-medium ml-0.5">/{sub.maxMarks || 100}</span>
                                </span>
                                <span className={`text-[7px] font-bold mt-0.5 ${sub.rank <= 3 ? 'text-amber-400' : 'text-slate-500'}`}>#{sub.rank || '-'}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </>
    );

    return (
        <div className="w-full max-w-[950px] mx-auto bg-slate-900/60 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black/40 rounded-[16px] overflow-hidden font-sans text-slate-200 relative">
            <div className="max-h-[85vh] overflow-y-auto no-scrollbar md:max-h-none md:overflow-y-visible">
                <style>{`
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                    .tabs-scrollbar { scrollbar-width: auto; scrollbar-color: rgba(245,130,174,0.95) rgba(255,255,255,0.06); }
                    .tabs-scrollbar::-webkit-scrollbar { height: 14px; }
                    .tabs-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.06); border-radius: 9999px; margin: 0 4px; }
                    .tabs-scrollbar::-webkit-scrollbar-thumb { background: linear-gradient(90deg, rgba(245,130,174,0.95), rgba(245,130,174,0.75)); border-radius: 9999px; border: 2px solid transparent; background-clip: padding-box; }
                    @media (min-width: 768px) {
                        .tabs-scrollbar { scrollbar-width: thin; }
                        .tabs-scrollbar::-webkit-scrollbar { height: 8px; }
                        .tabs-scrollbar::-webkit-scrollbar-track { margin: 6px 0; }
                        .tabs-scrollbar::-webkit-scrollbar-thumb { border: 0; background-clip: unset; }
                    }
                `}</style>

                {/* Close — mobile: absolute z-100 so burger can't cover it; desktop: original position */}
                {onClose && (
                    <button onClick={onClose} className="absolute top-3 right-3 z-[100] w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-slate-300 hover:text-white transition-colors border border-white/10 text-lg backdrop-blur-sm md:hidden" aria-label="Close">×</button>
                )}

                {/* Main content wrapper */}
                <div className="p-4 md:p-5">
                    {/* Top Row: Avatar + Info */}
                    <div className="flex flex-row gap-3 md:gap-5 items-start">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full -z-10 group-hover:bg-indigo-500/30 transition-all duration-500"></div>
                                <div className="w-24 h-24 md:w-48 md:h-48 bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-lg flex items-center justify-center relative backdrop-blur-sm">
                                    {student.roll_no ? (
                                        <img src={`/student_faces/${student.roll_no}.png`} alt={student.name} width={192} height={192} loading="lazy" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                                    ) : null}
                                    <div className="hidden w-full h-full flex-col items-center justify-center text-slate-500"><User className="w-8 h-8 opacity-60" /></div>
                                </div>
                            </div>
                        </div>

                        {/* Right side content */}
                        <div className="flex-grow min-w-0 w-full flex flex-col gap-2">
                            {/* Header: stacked on mobile, inline row on desktop (original) */}
                            <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-2 md:gap-3">
                                <div className="flex items-center gap-2 min-w-0 w-full md:w-auto">
                                    <h1 className="text-base md:text-2xl lg:text-3xl font-bold text-white leading-tight tracking-tight break-words text-left flex-shrink min-w-0">{student.name}</h1>
                                </div>

                                {/* Mobile Layout: Grid for meta info and stats to fill space below name */}
                                <div className="md:hidden grid grid-cols-2 gap-2 w-full">
                                    {/* Roll & Class - Left Col */}
                                    <div className="flex flex-col gap-1.5 justify-center">
                                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 w-full">
                                            <span className="uppercase text-[7px] tracking-wider text-slate-500 font-semibold min-w-[30px]">Roll</span>
                                            <span className="font-mono text-xs text-slate-300">{student.roll_no}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-md px-2 py-1.5 w-full">
                                            <span className="uppercase text-[7px] tracking-wider text-slate-500 font-semibold min-w-[30px]">Class</span>
                                            <span className="text-xs text-slate-300">{formatClassName(student.class)}</span>
                                        </div>
                                    </div>

                                    {/* Stats - Right Col */}
                                    <div className="flex flex-col gap-1.5">
                                        <div className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 flex items-center justify-between relative overflow-hidden h-full group">
                                            <span className="text-[7px] uppercase tracking-wide text-slate-400 font-medium z-10 leading-none">SGPA</span>
                                            <div className="flex items-baseline gap-0.5 z-10">
                                                <span className="text-lg font-bold text-white tracking-tight leading-none">{formatFloat(student.cgpa, 2)}</span>
                                                <span className="text-slate-500 text-[8px] font-semibold whitespace-nowrap">/10</span>
                                            </div>
                                            <div className="absolute -right-3 -bottom-3 w-8 h-8 bg-emerald-500/10 rounded-full blur-md"></div>
                                        </div>
                                        <div className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 flex items-center justify-between relative overflow-hidden h-full group">
                                            <span className="text-[7px] uppercase tracking-wide text-slate-400 font-medium z-10 leading-none">Att.</span>
                                            <div className="flex items-baseline gap-0.5 z-10">
                                                <span className="text-lg font-bold text-white tracking-tight leading-none">{formatFloat(student.attendance, 1)}</span>
                                                <span className="text-slate-500 text-[8px] font-semibold whitespace-nowrap">%</span>
                                            </div>
                                            <div className="absolute -right-3 -bottom-3 w-8 h-8 bg-blue-500/10 rounded-full blur-md"></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop Layout: Original inline stack */}
                                <div className="hidden md:flex flex-col gap-1 flex-shrink-0">
                                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-md px-2 py-0.5">
                                        <span className="uppercase text-[8px] tracking-wider text-slate-500 font-semibold">Roll</span>
                                        <span className="font-mono text-xs text-slate-300">{student.roll_no}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-md px-2 py-0.5">
                                        <span className="uppercase text-[8px] tracking-wider text-slate-500 font-semibold">Class</span>
                                        <span className="text-xs text-slate-300">{formatClassName(student.class)}</span>
                                    </div>
                                </div>

                                {/* Desktop Stats */}
                                <div className="hidden md:flex gap-2 flex-nowrap flex-shrink-0">
                                    <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 min-w-fit flex flex-col justify-center items-center gap-0 relative overflow-hidden group hover:bg-white/[0.08] transition-all">
                                        <span className="text-[7px] uppercase tracking-wide text-slate-400 font-medium z-10 leading-none whitespace-nowrap mb-0.5">Sem SGPA</span>
                                        <div className="flex items-baseline gap-1 z-10">
                                            <span className="text-xl font-bold text-white tracking-tight leading-none">{formatFloat(student.cgpa, 2)}</span>
                                            <span className="text-slate-500 text-[7px] font-semibold whitespace-nowrap">/ 10</span>
                                        </div>
                                        <div className="absolute -right-3 -bottom-3 w-6 h-6 bg-emerald-500/10 rounded-full blur-md group-hover:bg-emerald-500/20 transition-all"></div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 min-w-fit flex flex-col justify-center items-center gap-0 relative overflow-hidden group hover:bg-white/[0.08] transition-all">
                                        <span className="text-[7px] uppercase tracking-wide text-slate-400 font-medium z-10 leading-none whitespace-nowrap mb-0.5">Attendance</span>
                                        <div className="flex items-baseline gap-1 z-10">
                                            <span className="text-xl font-bold text-white tracking-tight leading-none">{formatFloat(student.attendance, 1)}</span>
                                            <span className="text-slate-500 text-[7px] font-semibold whitespace-nowrap">%</span>
                                        </div>
                                        <div className="absolute -right-3 -bottom-3 w-6 h-6 bg-blue-500/10 rounded-full blur-md group-hover:bg-blue-500/20 transition-all"></div>
                                    </div>
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={isAnalyzing}
                                        className="bg-indigo-500/20 border border-indigo-500/30 rounded-lg px-2.5 py-1 min-w-fit flex flex-col justify-center items-center gap-0 relative overflow-hidden group hover:bg-indigo-500/30 transition-all disabled:opacity-50"
                                    >
                                        <span className="text-[7px] uppercase tracking-wide text-indigo-300 font-medium z-10 leading-none mb-0.5">Calculation</span>
                                        <div className="flex items-center gap-1 z-10">
                                            <Calculator className={`w-3.5 h-3.5 text-indigo-400 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                                            <span className="text-[10px] font-bold text-white uppercase tracking-tight">Analyze</span>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* Desktop ONLY: Ranks and Top Subjects (stacked in right col) */}
                            <div className="hidden md:flex flex-col gap-2 mt-2">
                                {ranksContent}
                                {topSubjectsContent}
                            </div>
                        </div>
                    </div>

                    {/* Mobile ONLY: Ranks, Top Subjects, and Analyze button */}
                    <div className="md:hidden flex flex-col gap-2 mt-2">
                        {ranksContent}
                        {topSubjectsContent}
                        <button
                            onClick={handleAnalyze}
                            disabled={isAnalyzing}
                            className="w-full py-2.5 bg-indigo-500/15 border border-indigo-500/25 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-500/25 transition-all disabled:opacity-50 mt-1"
                        >
                            <Calculator className={`w-4 h-4 text-indigo-400 ${isAnalyzing ? 'animate-pulse' : ''}`} />
                            <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">{isAnalyzing ? 'Loading...' : 'SGPI Analysis'}</span>
                        </button>
                    </div>
                </div>

                {/* Subject Performance Section */}
                {subjects.length > 0 && (
                    <div className="border-t border-white/5 mt-2 bg-black/20 p-3 md:p-6">
                        <style>{`
                            @keyframes growBar {
                                from { height: 0%; }
                            }
                            .animate-bar-grow {
                                animation: growBar 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                            }
                        `}</style>

                        {/* DESKTOP: Original horizontal scrolling tabs */}
                        <div className="hidden md:flex gap-2 tabs-scrollbar overflow-x-auto w-full mb-4 pb-1" onWheel={(e) => { const el = e.currentTarget; if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { el.scrollLeft += e.deltaY; e.preventDefault(); } }}>
                            {subjects.map((subj, idx) => (
                                <button key={idx} onClick={() => setSelectedSubjectIndex(idx)} className={`px-4 py-2 rounded-md text-base font-medium whitespace-nowrap transition-all border shrink-0 ${selectedSubjectIndex === idx ? 'bg-white/10 text-white border-white/10' : 'bg-transparent text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300'}`}>{subj.subject_name}</button>
                            ))}
                        </div>

                        {/* MOBILE: Scrolling tabs — taller than desktop */}
                        <div className="flex md:hidden gap-2 tabs-scrollbar overflow-x-auto w-full mb-4 pb-1" onWheel={(e) => { const el = e.currentTarget; if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { el.scrollLeft += e.deltaY; e.preventDefault(); } }}>
                            {subjects.map((subj, idx) => (
                                <button key={idx} onClick={() => setSelectedSubjectIndex(idx)} className={`px-4 py-3 rounded-md text-sm font-medium whitespace-nowrap transition-all border shrink-0 ${selectedSubjectIndex === idx ? 'bg-white/10 text-white border-white/10' : 'bg-transparent text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300'}`}>{shortName(subj.subject_name)}</button>
                            ))}
                        </div>

                        {/* Shared bar graph - Recharts Implementation */}
                        {activeSubject && (
                            <div key={activeSubject.subject_name} className="bg-white/[0.02] rounded-lg border border-white/5 p-3 md:p-4">
                                <div className="flex justify-between items-center mb-0 md:mb-2">
                                    <h4 className="text-lg font-bold text-slate-200">{activeSubject.subject_name}</h4>
                                    <div className="flex gap-3 md:gap-4">
                                        <div className="text-right">
                                            <span className="text-[9px] uppercase font-bold text-slate-600 block">Total</span>
                                            <span className="text-sm font-bold text-white">
                                                {activeSubject.total_marks || 0}
                                                <span className="text-[10px] text-slate-500 font-medium ml-1">/{activeSubject.maxMarks || 100}</span>
                                            </span>
                                        </div>
                                        {activeSubject.rank && (
                                            <div className="text-right pl-3 md:pl-4 border-l border-white/5">
                                                <span className="text-[9px] uppercase font-bold text-slate-600 block">Rank</span>
                                                <span className="text-sm font-bold text-indigo-400">#{activeSubject.rank}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="h-48 w-full">
                                    <ViewRechartsBarChart
                                        activeSubject={activeSubject}
                                        maxMarks={maxMark}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SGPI Analysis Overlay */}
            {showAnalysis && analysisData && (
                <div className="absolute inset-0 z-[110] bg-slate-950/90 backdrop-blur-xl p-4 md:p-8 overflow-y-auto no-scrollbar animate-in fade-in zoom-in duration-300">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2 min-w-0">
                                        <Calculator className="w-5 h-5 md:w-6 md:h-6 text-indigo-400 flex-shrink-0" />
                                        <span className="truncate">SGPI Calculation Analysis</span>
                                    </h3>
                                    <button onClick={() => setShowAnalysis(false)} className="w-9 h-9 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-slate-400 border border-white/10 transition-colors flex-shrink-0 md:hidden">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-slate-400 text-sm mt-1">
                                    According to <span className="text-indigo-300 font-semibold">Section 16.2</span> — Calculation of SGPI and CGPI
                                </p>
                                <a href="https://frcrce.ac.in/wp-content/uploads/2025/11/Academic_Rule_Book_FrCRCE_2024_25.pdf" target="_blank" rel="noopener noreferrer" className="text-[10px] text-slate-500 hover:text-indigo-400 transition-colors mt-0.5 inline-block">
                                    Fr. CRCE Academic Rule Book 2024-25, Page 53 ↗
                                </a>
                            </div>

                            <div className="flex items-start gap-2">
                                {/* Double Minor Subjects (excluded from SGPI) */}
                                {analysisData.dropped && analysisData.dropped.length > 0 && (
                                    <div className="bg-orange-500/5 border border-orange-500/10 rounded-xl p-3 md:max-w-[280px] flex-shrink-0">
                                        <p className="text-[10px] font-bold text-orange-400/80 uppercase tracking-wider mb-1.5">
                                            ⚠ Double Minor — Not in SGPI
                                        </p>
                                        <div className="space-y-1.5">
                                            {analysisData.dropped.map((d, idx) => (
                                                <div key={idx} className="flex items-center justify-between gap-2">
                                                    <p className="text-slate-300 text-xs font-medium truncate">{d.subject}</p>
                                                    <span className="px-1.5 py-0.5 bg-orange-500/20 rounded text-[8px] font-bold text-orange-300 uppercase flex-shrink-0">Excluded</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <button onClick={() => setShowAnalysis(false)} className="w-10 h-10 hidden md:flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-slate-400 border border-white/10 transition-colors flex-shrink-0">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Final SGPI</span>
                                <span className="text-3xl font-display font-bold text-emerald-400">{analysisData.sgpi}</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Σ Cᵢ × GPᵢ</span>
                                <span className="text-3xl font-display font-bold text-indigo-400">{analysisData.totalWeightedPoints}</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 col-span-2 md:col-span-1">
                                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Σ Cᵢ</span>
                                <span className="text-3xl font-display font-bold text-blue-400">{analysisData.totalCredits}</span>
                            </div>
                        </div>

                        {/* Main Formula */}
                        <div className="bg-black/40 border border-white/5 rounded-xl p-5 mb-8 text-center">
                            <p className="text-slate-400 text-[10px] uppercase font-bold mb-4 tracking-widest">Applied Formula (Section 16.2)</p>
                            <div className="text-lg md:text-2xl font-mono text-white inline-flex items-center gap-3">
                                <span className="italic">SGPI</span>
                                <span>=</span>
                                <div className="flex flex-col items-center">
                                    <span className="border-b border-white/30 pb-1 px-2 text-sm md:text-lg">
                                        <span className="text-slate-400">Σ</span> Cᵢ <span className="text-slate-400">×</span> GPᵢ
                                    </span>
                                    <span className="pt-1 px-2 text-sm md:text-lg">
                                        <span className="text-slate-400">Σ</span> Cᵢ
                                    </span>
                                </div>
                                <span>=</span>
                                <div className="flex flex-col items-center">
                                    <span className="border-b border-white/20 pb-1 text-indigo-300">{analysisData.totalWeightedPoints}</span>
                                    <span className="pt-1 text-blue-300">{analysisData.totalCredits}</span>
                                </div>
                                <span className="text-emerald-400 font-bold">= {analysisData.sgpi}</span>
                            </div>
                            <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1 text-[11px] text-slate-500">
                                <span><span className="text-slate-400 font-medium">n</span> = Number of papers in the semester</span>
                                <span><span className="text-slate-400 font-medium">Cᵢ</span> = Credit for iᵗʰ subject</span>
                                <span><span className="text-slate-400 font-medium">GPᵢ</span> = Grade Points obtained in the iᵗʰ subject</span>
                            </div>
                        </div>

                        {/* Breakdown Table */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                                <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                                Subject-wise Breakdown
                            </h4>
                            <div className="border border-white/10 rounded-xl overflow-hidden overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white/5 text-slate-500 font-bold text-[10px] uppercase">
                                        <tr>
                                            <th className="px-4 py-3">Subject</th>
                                            <th className="px-4 py-3 text-center">Marks</th>
                                            <th className="px-4 py-3 text-center">Grade Point $(G_i)$</th>
                                            <th className="px-4 py-3 text-center">Credits $(C_i)$</th>
                                            <th className="px-4 py-3 text-right">Weighted $(C_i \times G_i)$</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {analysisData.breakdown.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-4 py-3 font-medium text-slate-200">{row.subject}</td>
                                                <td className="px-4 py-3 text-center text-slate-300">{row.marks}</td>
                                                <td className={`px-4 py-3 text-center font-bold ${row.gradePoint === 0 ? 'text-red-400' : 'text-white'}`}>
                                                    {row.gradePoint}
                                                </td>
                                                <td className="px-4 py-3 text-center text-slate-400">{row.credits}</td>
                                                <td className="px-4 py-3 text-right font-mono font-bold text-indigo-300">{row.weightedPoint}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>


                        <div className="mt-12 text-center pb-8">
                            <button
                                onClick={() => setShowAnalysis(false)}
                                className="px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-bold transition-all"
                            >
                                Back to Profile
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
