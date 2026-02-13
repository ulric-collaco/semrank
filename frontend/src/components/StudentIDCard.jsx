
import React, { useState } from 'react';
import { User } from 'lucide-react';
import { formatClassName } from '../utils/format';

export default function StudentIDCard({ student, loading, error, onClose }) {
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
                            <span className="text-sm font-bold text-white leading-none">{sub.total_marks}</span>
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
                                <span className="text-xs font-bold text-white leading-none">{sub.total_marks}</span>
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
                                <h1 className="text-base md:text-2xl lg:text-3xl font-bold text-white leading-tight tracking-tight break-words text-left flex-shrink min-w-0 md:pr-0 w-full">{student.name}</h1>

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
                                </div>
                            </div>

                            {/* Desktop ONLY: Ranks and Top Subjects (stacked in right col) */}
                            <div className="hidden md:flex flex-col gap-2 mt-2">
                                {ranksContent}
                                {topSubjectsContent}
                            </div>
                        </div>
                    </div>

                    {/* Mobile ONLY: Ranks and Top Subjects (stacked below photo, full width) */}
                    <div className="md:hidden flex flex-col gap-2 mt-2">
                        {ranksContent}
                        {topSubjectsContent}
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

                        {/* Shared bar graph */}
                        {activeSubject && (
                            <div key={activeSubject.subject_name} className="bg-white/[0.02] rounded-lg border border-white/5 p-3 md:p-4">
                                <div className="flex justify-between items-center mb-4 md:mb-6">
                                    <h4 className="text-lg font-bold text-slate-200">{activeSubject.subject_name}</h4>
                                    <div className="flex gap-3 md:gap-4">
                                        <div className="text-right">
                                            <span className="text-[9px] uppercase font-bold text-slate-600 block">Total</span>
                                            <span className="text-sm font-bold text-white">{activeSubject.total_marks || 0}</span>
                                        </div>
                                        {activeSubject.rank && (
                                            <div className="text-right pl-3 md:pl-4 border-l border-white/5">
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
