
import React, { useState } from 'react';
import { User, ChevronDown, ChevronUp } from 'lucide-react';

export default function StudentIDCard({ student, loading, error, onClose }) {
    // Setup state for tabs
    const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);

    if (loading) {
        return (
            <div className="w-full max-w-[1100px] bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
            </div>
        );
    }

    if (error || !student) {
        return (
            <div className="w-full max-w-[1100px] bg-white rounded-2xl border border-slate-200 p-8 text-center min-h-[200px] flex flex-col items-center justify-center gap-4">
                <p className="text-slate-600 font-medium">{error || "Student details not available."}</p>
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors"
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
        ? [...student.subjects].sort((a, b) => (a.rank || 999) - (b.rank || 999)).slice(0, 5)
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
        // Default to at least 25 or the max found
        return Math.max(...marks, 25);
    };

    const maxMark = getMaxMark();

    // Helper to render bars
    const BarBox = ({ label, value, colorClass }) => (
        <div className="flex flex-col items-center gap-2 flex-1 min-w-[50px]">
            <div className="w-full bg-slate-100 rounded-t-lg h-32 md:h-40 relative flex items-end justify-center pb-0 overflow-hidden">
                <div
                    className={`w-full mx-2 rounded-t-md transition-all duration-500 ease-out flex items-end justify-center pb-2 ${colorClass}`}
                    style={{ height: `${(value / maxMark) * 100}%` }}
                >
                    <span className="text-white text-xs font-bold">{value}</span>
                </div>
            </div>
            <div className="text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">{label}</span>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-[1100px] mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-sans text-slate-800">

            {/* Scroll container for whole card content if needed on small screens */}
            <div className="max-h-[90vh] overflow-y-auto custom-scrollbar">

                {/* Header / Close button */}
                {onClose && (
                    <div className="flex justify-end p-4 pb-0 md:hidden">
                        <button
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200"
                        >
                            ×
                        </button>
                    </div>
                )}

                <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Column 1: Profile & Identity */}
                    <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-4">
                        <div className="w-32 h-32 md:w-full md:h-auto md:aspect-square max-w-[200px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex items-center justify-center relative">
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
                            <div className="hidden w-full h-full flex-col items-center justify-center text-slate-300">
                                <User className="w-12 h-12" />
                            </div>
                        </div>

                        <div className="w-full">
                            <h1 className="text-[22px] md:text-[26px] font-semibold text-slate-900 leading-tight mb-2">
                                {student.name}
                            </h1>
                            <div className="space-y-1">
                                <div className="flex justify-between md:justify-start md:gap-4 border-b border-dashed border-slate-200 pb-1 mb-1">
                                    <span className="text-[12px] uppercase tracking-wide text-slate-500 font-medium">Roll No</span>
                                    <span className="font-mono text-sm font-medium text-slate-700">{student.roll_no}</span>
                                </div>
                                <div className="flex justify-between md:justify-start md:gap-4 border-b border-dashed border-slate-200 pb-1 mb-1">
                                    <span className="text-[12px] uppercase tracking-wide text-slate-500 font-medium">Class</span>
                                    <span className="text-sm font-medium text-slate-700">{student.class}</span>
                                </div>
                                <div className="flex justify-between md:justify-start md:gap-4">
                                    <span className="text-[12px] uppercase tracking-wide text-slate-500 font-medium">Enrollment</span>
                                    <span className="font-mono text-xs text-slate-600">{student.enrollment_id}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 2 & 3: Stats */}
                    <div className="md:col-span-2 flex flex-col gap-6">

                        {/* Top Row: SGPA & Attendance Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between h-full relative overflow-hidden group hover:border-slate-300 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="text-6xl">📊</span>
                                </div>
                                <span className="text-[12px] uppercase tracking-wide text-slate-500 font-bold">Sem SGPA</span>
                                <div className="mt-2 text-slate-900">
                                    <span className="text-[32px] md:text-[40px] font-bold tracking-tight">
                                        {formatFloat(student.cgpa, 2)}
                                    </span>
                                    <span className="text-slate-400 text-sm ml-1">/ 10</span>
                                </div>
                            </div>

                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between h-full relative overflow-hidden group hover:border-slate-300 transition-colors">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <span className="text-6xl">📅</span>
                                </div>
                                <span className="text-[12px] uppercase tracking-wide text-slate-500 font-bold">Attendance</span>
                                <div className="mt-2 text-slate-900">
                                    <span className="text-[26px] md:text-[32px] font-semibold tracking-tight">
                                        {formatFloat(student.attendance, 1)}
                                    </span>
                                    <span className="text-slate-500 text-lg ml-0.5">%</span>
                                </div>
                            </div>
                        </div>

                        {/* Ranking Section */}
                        <div>
                            <span className="text-[12px] uppercase tracking-wide text-slate-500 font-semibold mb-3 block">
                                Rankings
                            </span>
                            <div className="flex flex-wrap gap-2 md:gap-3">
                                {[
                                    { label: 'College Rank', val: student.rank_cgpa_college, color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
                                    { label: 'Class Rank', val: student.rank_cgpa_class, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                                    { label: 'College Att.', val: student.rank_attendance_college, color: 'bg-teal-50 text-teal-700 border-teal-100' },
                                    { label: 'Class Att.', val: student.rank_attendance_class, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' }
                                ].map((rank, idx) => (
                                    rank.val && (
                                        <div key={idx} className={`px-3 py-1.5 rounded-md border ${rank.color} text-sm font-medium flex items-center gap-2`}>
                                            <span className="opacity-70 text-xs uppercase tracking-wider">{rank.label}</span>
                                            <span className="font-bold">#{rank.val}</span>
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                        {/* Simple Top Subjects List (Preserving summary view) */}
                        <div className="pt-2">
                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                                <span className="text-[12px] uppercase tracking-wide text-slate-500 font-semibold">Top Subjects</span>
                                <span className="text-[10px] uppercase text-slate-400 font-medium">Rank</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {topSubjects.slice(0, 4).map((sub, idx) => ( // Show top 4 to save space
                                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-semibold text-slate-800 truncate pr-2" title={sub.subject_name}>{sub.subject_name}</span>
                                            <span className="text-[10px] text-slate-500 font-mono">{sub.subject_code}</span>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-xs font-bold text-slate-700">{sub.total_marks}</span>
                                            {sub.rank <= 3 && <span className="text-[10px] text-amber-600 font-bold">#{sub.rank}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>

                {/* Full Width Subject Performance Section (Bar Graphs) */}
                {subjects.length > 0 && (
                    <div className="border-t border-slate-200 mt-2 bg-slate-50/50 p-6 md:p-8">
                        <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2">
                            <span>📊</span> Subject Performance
                        </h3>

                        {/* Horizontal Scrollable Tabs */}
                        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 custom-scrollbar">
                            {subjects.map((subj, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedSubjectIndex(idx)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border ${selectedSubjectIndex === idx
                                            ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                >
                                    {subj.subject_code}
                                </button>
                            ))}
                        </div>

                        {/* Active Subject Chart */}
                        {activeSubject && (
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">

                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-100 pb-4">
                                    <div>
                                        <h4 className="text-xl font-bold text-slate-800">{activeSubject.subject_name}</h4>
                                        <p className="text-sm text-slate-500 mt-1">Code: {activeSubject.subject_code}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="text-right">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                                            <span className="text-2xl font-bold text-slate-900">{activeSubject.total_marks || 0}</span>
                                        </div>
                                        {activeSubject.rank && (
                                            <div className="text-right pl-4 border-l border-slate-100">
                                                <span className="text-[10px] uppercase font-bold text-slate-400 block">Rank</span>
                                                <span className="text-2xl font-bold text-indigo-600">#{activeSubject.rank}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-between items-end gap-2 h-48 w-full">
                                    <BarBox label="MSE" value={activeSubject.mse || 0} colorClass="bg-indigo-500" />
                                    <BarBox label="ESE" value={activeSubject.ese || 0} colorClass="bg-blue-500" />
                                    <BarBox label="TH-ISE1" value={activeSubject.th_ise1 || 0} colorClass="bg-sky-500" />
                                    <BarBox label="TH-ISE2" value={activeSubject.th_ise2 || 0} colorClass="bg-cyan-500" />
                                    <BarBox label="PR-ISE1" value={activeSubject.pr_ise1 || 0} colorClass="bg-teal-500" />
                                    <BarBox label="PR-ISE2" value={activeSubject.pr_ise2 || 0} colorClass="bg-emerald-500" />
                                </div>

                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
}
