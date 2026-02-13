
import React, { useState } from 'react';
import { User } from 'lucide-react';
import { formatClassName } from '../utils/format';

export default function StudentIDCard({ student, loading, error, onClose }) {
    // Setup state for tabs
    const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);

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
                <button
                    onClick={onClose}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-lg text-xs font-medium transition-colors"
                >
                    Close
                </button>
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
    const activeSubject = subjects[selectedSubjectIndex];

    // Calculate max marks for the chart scaling
    const getMaxMark = () => {
        if (!activeSubject) return 25;
        const marks = [
            activeSubject.ese || 0,
            activeSubject.mse || 0,
            activeSubject.pr_ise1 || 0,
            activeSubject.pr_ise2 || 0,
            activeSubject.th_ise1 || 0,
            activeSubject.th_ise2 || 0
        ];
        return Math.max(...marks, 25);
    };

    const maxMark = getMaxMark();

    // Helper to render bars
    const BarBox = ({ label, value }) => (
        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-[32px]">
            <div className="w-full bg-white/5 rounded-t-md h-24 md:h-28 relative flex items-end justify-center pb-0 overflow-hidden border border-white/5">
                <div
                    className="w-full mx-1 rounded-t-[2px] transition-all duration-500 ease-out flex items-end justify-center pb-1 bg-indigo-500/80 backdrop-blur-sm"
                    style={{ height: `${(value / maxMark) * 100}%` }}
                >
                    <span className="text-white/90 text-[10px] font-semibold">{value}</span>
                </div>
            </div>
            <div className="text-center w-full">
                <span className="text-[9px] uppercase font-bold text-slate-500 block truncate w-full">{label}</span>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-[950px] mx-auto bg-slate-900/60 backdrop-blur-3xl border border-white/10 shadow-2xl shadow-black/40 rounded-[16px] overflow-hidden font-sans text-slate-200 relative">

            {/* Scroll container for whole card content */}
            <div className="max-h-[85vh] overflow-y-auto no-scrollbar md:max-h-none md:overflow-y-visible">
                <style>{`
            .no-scrollbar::-webkit-scrollbar {
                display: none;
            }
            .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
            }

            /* Styled thin scrollbar for horizontal tabs (use site accent/pink) */
            .tabs-scrollbar {
                scrollbar-width: thin;
                /* thumb color then track color */
                scrollbar-color: rgba(245,130,174,0.95) rgba(255,255,255,0.03);
            }
            .tabs-scrollbar::-webkit-scrollbar {
                height: 8px;
            }
            .tabs-scrollbar::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.03);
                border-radius: 9999px;
                margin: 6px 0;
            }
            .tabs-scrollbar::-webkit-scrollbar-thumb {
                background: linear-gradient(90deg, rgba(245,130,174,0.95), rgba(245,130,174,0.75));
                border-radius: 9999px;
            }
            .tabs-scrollbar::-webkit-scrollbar-thumb:hover {
                background: linear-gradient(90deg, rgba(245,130,174,1), rgba(245,130,174,0.9));
            }
        `}</style>

                {/* Header / Close button */}
                {onClose && (
                    <div className="flex justify-end p-3 pb-0 md:hidden">
                        <button
                            onClick={onClose}
                            className="w-6 h-6 flex items-center justify-center bg-white/5 rounded-full text-slate-400 hover:bg-white/10 transition-colors border border-white/5"
                        >
                            ×
                        </button>
                    </div>
                )}

                <div className="p-4 md:p-5 flex flex-col md:flex-row gap-4 md:gap-5 items-start">

                    {/* Left: Avatar Only */}
                    <div className="flex-shrink-0 mx-auto md:mx-0">
                        <div className="relative group">
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full -z-10 group-hover:bg-indigo-500/30 transition-all duration-500"></div>

                            <div className="w-32 h-32 md:w-48 md:h-48 bg-white/5 rounded-2xl overflow-hidden border border-white/10 shadow-lg flex items-center justify-center relative backdrop-blur-sm">
                                {student.roll_no ? (
                                    <img
                                        src={`/student_faces/${student.roll_no}.png`}
                                        alt={student.name}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            e.target.style.display = 'none';
                                            e.target.nextSibling.style.display = 'flex';
                                        }}
                                    />
                                ) : null}
                                <div className="hidden w-full h-full flex-col items-center justify-center text-slate-500">
                                    <User className="w-8 h-8 opacity-60" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Main Content */}
                    <div className="flex-grow w-full flex flex-col gap-2">

                        {/* Header: Name + Roll/Class + Stats */}
                        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-2 md:gap-0">

                            {/* Name + Roll/Class */}
                            <div className="text-center md:text-left mb-1 md:mb-0 flex-grow pr-2">
                                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white leading-tight tracking-tight break-words">
                                    {student.name}
                                </h1>
                                <div className="flex items-center justify-center md:justify-start gap-3 text-xs font-medium text-slate-400/80 mt-1">
                                    <div className="flex items-center gap-1.5">
                                        <span className="uppercase text-[9px] tracking-wider opacity-70 font-semibold">Roll</span>
                                        <span className="font-mono text-slate-300">{student.roll_no}</span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="uppercase text-[9px] tracking-wider opacity-70 font-semibold">Class</span>
                                        <span className="text-slate-300">{formatClassName(student.class)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Cards - Compact */}
                            <div className="flex justify-end gap-2 flex-nowrap flex-shrink-0">
                                {/* SGPA Card */}
                                <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 min-w-fit flex flex-col justify-center items-center gap-0 relative overflow-hidden group hover:bg-white/[0.08] transition-all">
                                    <span className="text-[7px] uppercase tracking-wide text-slate-400 font-medium z-10 leading-none whitespace-nowrap mb-0.5">Sem SGPA</span>
                                    <div className="flex items-baseline gap-1 z-10">
                                        <span className="text-lg md:text-xl font-bold text-white tracking-tight leading-none">
                                            {formatFloat(student.cgpa, 2)}
                                        </span>
                                        <span className="text-slate-500 text-[7px] font-semibold whitespace-nowrap">/ 10</span>
                                    </div>
                                    <div className="absolute -right-3 -bottom-3 w-6 h-6 bg-emerald-500/10 rounded-full blur-md group-hover:bg-emerald-500/20 transition-all"></div>
                                </div>

                                {/* Attendance Card */}
                                <div className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 min-w-fit flex flex-col justify-center items-center gap-0 relative overflow-hidden group hover:bg-white/[0.08] transition-all">
                                    <span className="text-[7px] uppercase tracking-wide text-slate-400 font-medium z-10 leading-none whitespace-nowrap mb-0.5">Attendance</span>
                                    <div className="flex items-baseline gap-1 z-10">
                                        <span className="text-lg md:text-xl font-bold text-white tracking-tight leading-none">
                                            {formatFloat(student.attendance, 1)}
                                        </span>
                                        <span className="text-slate-500 text-[7px] font-semibold whitespace-nowrap">%</span>
                                    </div>
                                    <div className="absolute -right-3 -bottom-3 w-6 h-6 bg-blue-500/10 rounded-full blur-md group-hover:bg-blue-500/20 transition-all"></div>
                                </div>
                            </div>
                        </div>

                        {/* Ranks Pills - Compact */}
                        <div className="flex flex-wrap gap-1.5 w-full">
                            {[
                                { label: 'Col. Rank', val: student.rank_cgpa_college },
                                { label: 'Cls. Rank', val: student.rank_cgpa_class },
                                { label: 'Col. Att.', val: student.rank_attendance_college },
                                { label: 'Cls. Att.', val: student.rank_attendance_class }
                            ].map((rank, idx) => (
                                rank.val && (
                                    <div key={idx} className="flex-1 min-w-[80px] py-1 px-2 bg-white/5 border border-white/10 rounded-md flex items-center justify-between gap-1 hover:bg-white/10 transition-colors">
                                        <span className="text-[7px] uppercase tracking-wider text-slate-400 font-medium whitespace-nowrap">{rank.label}</span>
                                        <span className="font-mono text-xs font-bold text-white">#{rank.val}</span>
                                    </div>
                                )
                            ))}
                        </div>

                        {/* Top Subjects Grid - Compact */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {topSubjects.map((sub, idx) => (
                                <div key={idx} className="flex items-center justify-between p-2 rounded-md bg-white/5 border border-white/5 hover:bg-white/10 transition-colors h-auto min-h-[44px]">
                                    <div className="flex flex-col justify-center min-w-0 pr-2">
                                        <span className="text-[8px] uppercase tracking-wider text-slate-500 font-bold mb-0 leading-none">Subject</span>
                                        <span className="text-[11px] font-medium text-slate-200 truncate leading-tight mt-0.5" title={sub.subject_name}>
                                            {sub.subject_name}
                                        </span>
                                    </div>
                                    <div className="flex flex-col items-end justify-center pl-2 border-l border-white/10">
                                        <span className="text-sm font-bold text-white leading-none">{sub.total_marks}</span>
                                        <span className={`text-[8px] font-bold mt-0.5 ${sub.rank <= 3 ? 'text-amber-400' : 'text-slate-500'}`}>
                                            #{sub.rank || '-'}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

                {/* Full Width Subject Performance Section (Bar Graphs) */}
                {subjects.length > 0 && (
                    <div className="border-t border-white/5 mt-2 bg-black/20 p-4 md:p-6">
                        {/* Compact Tabs - Full Width */}
                        <div
                            ref={tabsRef => { /* placeholder for ref assignment via inline callback */ }}
                            className="flex gap-2 tabs-scrollbar overflow-x-auto w-full mb-4 pb-1"
                            onWheel={(e) => {
                                // allow vertical wheel to scroll horizontally when over tabs
                                const el = e.currentTarget
                                if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
                                    el.scrollLeft += e.deltaY
                                    e.preventDefault()
                                }
                            }}
                        >
                            {subjects.map((subj, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedSubjectIndex(idx)}
                                    className={`px-4 py-2 rounded-md text-sm md:text-base font-medium whitespace-nowrap transition-all border shrink-0 ${selectedSubjectIndex === idx
                                        ? 'bg-white/10 text-white border-white/10'
                                        : 'bg-transparent text-slate-500 border-transparent hover:bg-white/5 hover:text-slate-300'
                                        }`}
                                >
                                    {subj.subject_name}
                                </button>
                            ))}
                        </div>

                        {/* Active Subject Chart */}
                        {activeSubject && (
                            <div className="bg-white/[0.02] rounded-lg border border-white/5 p-4">

                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-200">{activeSubject.subject_name}</h4>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-right">
                                            <span className="text-[9px] uppercase font-bold text-slate-600 block">Total</span>
                                            <span className="text-sm font-bold text-white">{activeSubject.total_marks || 0}</span>
                                        </div>
                                        {activeSubject.rank && (
                                            <div className="text-right pl-4 border-l border-white/5">
                                                <span className="text-[9px] uppercase font-bold text-slate-600 block">Rank</span>
                                                <span className="text-sm font-bold text-indigo-400">#{activeSubject.rank}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-end gap-1.5 h-28 w-full">
                                    <BarBox label="MSE" value={activeSubject.mse || 0} />
                                    <BarBox label="ESE" value={activeSubject.ese || 0} />
                                    <BarBox label="T1" value={activeSubject.th_ise1 || 0} />
                                    <BarBox label="T2" value={activeSubject.th_ise2 || 0} />
                                    <BarBox label="P1" value={activeSubject.pr_ise1 || 0} />
                                    <BarBox label="P2" value={activeSubject.pr_ise2 || 0} />
                                </div>

                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
