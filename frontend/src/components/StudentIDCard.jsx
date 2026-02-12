
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
            <div className="max-h-[85vh] overflow-y-auto no-scrollbar">
                <style>{`
            .no-scrollbar::-webkit-scrollbar {
                display: none;
            }
            .no-scrollbar {
                -ms-overflow-style: none;
                scrollbar-width: none;
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

                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6">

                    {/* Left Column: Profile (Takes 4 cols) */}
                    <div className="md:col-span-4 flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                        <div className="relative">
                            {/* Subtle radial glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-indigo-500/20 blur-2xl rounded-full -z-10"></div>

                            <div className="w-24 h-24 md:w-[100px] md:h-[100px] bg-white/5 rounded-[16px] overflow-hidden border border-white/10 flex items-center justify-center relative shadow-md shadow-black/20">
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
                                <div className="hidden w-full h-full flex-col items-center justify-center text-slate-600">
                                    <User className="w-8 h-8 opacity-50" />
                                </div>
                            </div>
                        </div>

                        <div className="w-full space-y-2">
                            <h1 className="text-lg md:text-xl font-semibold text-white leading-tight">
                                {student.name}
                            </h1>

                            <div className="space-y-1.5 text-xs text-slate-400">
                                <div className="flex justify-between md:flex-col md:items-start border-b border-white/5 pb-1.5 md:border-0 md:pb-0">
                                    <span className="text-[10px] uppercase tracking-wide opacity-50 font-medium">Roll No</span>
                                    <span className="font-mono text-slate-300">{student.roll_no}</span>
                                </div>
                                <div className="flex justify-between md:flex-col md:items-start">
                                    <span className="text-[10px] uppercase tracking-wide opacity-50 font-medium">Class</span>
                                    <span className="text-slate-300">{formatClassName(student.class)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Stats & Data (Takes 8 cols) */}
                    <div className="md:col-span-8 flex flex-col gap-5">

                        {/* Row 1: Metrics */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* SGPA Card */}
                            <div className="bg-white/5 border border-white/5 rounded-lg p-3 md:p-4 backdrop-blur-md flex flex-col justify-between hover:bg-white/[0.07] transition-colors">
                                <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Sem SGPA</span>
                                <div className="mt-1 text-white flex items-baseline">
                                    <span className="text-2xl md:text-3xl font-bold tracking-tight">
                                        {formatFloat(student.cgpa, 2)}
                                    </span>
                                    <span className="text-slate-500 text-xs ml-1.5 font-medium">/ 10</span>
                                </div>
                            </div>

                            {/* Attendance Card */}
                            <div className="bg-white/5 border border-white/5 rounded-lg p-3 md:p-4 backdrop-blur-md flex flex-col justify-between hover:bg-white/[0.07] transition-colors">
                                <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">Attendance</span>
                                <div className="mt-1 text-white flex items-baseline">
                                    <span className="text-2xl md:text-3xl font-semibold tracking-tight">
                                        {formatFloat(student.attendance, 1)}
                                    </span>
                                    <span className="text-slate-500 text-sm ml-1">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Row 2: Ranks */}
                        <div>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'College Rank', val: student.rank_cgpa_college },
                                    { label: 'Class Rank', val: student.rank_cgpa_class },
                                    { label: 'College Att.', val: student.rank_attendance_college },
                                    { label: 'Class Att.', val: student.rank_attendance_class }
                                ].map((rank, idx) => (
                                    rank.val && (
                                        <div key={idx} className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 flex items-center gap-1.5 hover:bg-white/10 transition-colors">
                                            <span className="opacity-50 text-[9px] uppercase tracking-wider">{rank.label}</span>
                                            <span className="font-mono font-semibold text-white">#{rank.val}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        {/* Row 3: Top Subjects Grid (Compact) */}
                        <div>
                            <span className="text-[10px] uppercase tracking-wide text-slate-500 font-semibold mb-2 block pl-0.5">Top Subjects</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {topSubjects.map((sub, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 rounded-md hover:bg-white/5 border border-transparent hover:border-white/5 transition-colors">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-medium text-slate-200 truncate">{sub.subject_name}</span>

                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-white/80">{sub.total_marks}</span>
                                            <span className={`text-[10px] font-bold w-6 text-right ${sub.rank <= 3 ? 'text-amber-400' : 'text-slate-600'}`}>
                                                #{sub.rank || '-'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Full Width Subject Performance Section (Bar Graphs) */}
                {subjects.length > 0 && (
                    <div className="border-t border-white/5 mt-2 bg-black/20 p-4 md:p-6">
                        {/* Compact Tabs - Full Width */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar w-full mb-4 pb-1">
                            {subjects.map((subj, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedSubjectIndex(idx)}
                                    className={`px-3 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap transition-all border shrink-0 ${selectedSubjectIndex === idx
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
