
import React from 'react';
import { User } from 'lucide-react';

export default function StudentIDCard({ student, loading, error, onClose }) {
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

    // Helper to format float safely
    const formatFloat = (num, decimals) => {
        if (num === null || num === undefined) return 'N/A';
        const val = parseFloat(num);
        return isNaN(val) ? 'N/A' : val.toFixed(decimals);
    };

    // Get Top Subjects (Rank <= 3 or top sorted)
    const topSubjects = student.subjects
        ? [...student.subjects].sort((a, b) => (a.rank || 999) - (b.rank || 999)).slice(0, 5)
        : [];

    return (
        <div className="w-full max-w-[1100px] mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden font-inter text-slate-800">
            {/* Header / Close button container for mobile/desktop flexibility */}
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
                    {/* Profile Image */}
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

                {/* Column 2 & 3: Stats (SGPA & Attendance) */}
                {/* On desktop, these take col-span-2, but we split them into a sub-grid or just strict cols? 
            User said "Grid 3 columns... Right: SGPA card + Attendance card".
            Let's make SGPA col 2 and Attendance col 3.
        */}
                <div className="md:col-span-2 flex flex-col gap-6">

                    {/* Top Row: SGPA & Attendance Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                        {/* SGPA Card */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between h-full relative overflow-hidden group">
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

                        {/* Attendance Card */}
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between h-full relative overflow-hidden group">
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

                    {/* Subject Performance List */}
                    <div className="pt-2">
                        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                            <span className="text-[12px] uppercase tracking-wide text-slate-500 font-semibold">Top Subjects</span>
                            <span className="text-[10px] uppercase text-slate-400 font-medium">Rank</span>
                        </div>

                        <div className="space-y-2">
                            {topSubjects.length > 0 ? (
                                topSubjects.map((sub, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-800 line-clamp-1">{sub.subject_name}</span>
                                            <span className="text-[10px] text-slate-400 font-mono">{sub.subject_code}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-semibold text-slate-700">
                                                {sub.total_marks}<span className="text-slate-400 text-xs font-normal">/100</span>
                                            </span>
                                            <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-bold ${sub.rank <= 3 ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                #{sub.rank || '-'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-slate-400 italic py-2">No subject data available</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
