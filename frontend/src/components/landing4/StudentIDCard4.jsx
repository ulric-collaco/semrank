
import React, { useState } from 'react';
import { User, Calculator, X, Trophy } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatClassName } from '../../utils/format';
import { studentAPI } from '../../utils/api';

export default function StudentIDCard4({ student, loading, error, onClose }) {
    // Move hooks to top level, before any conditional returns
    const [selectedSubjectIndex, setSelectedSubjectIndex] = useState(0);
    const [analysisData, setAnalysisData] = useState(null);
    const [showAnalysis, setShowAnalysis] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Initial Loading State
    if (loading) {
        return (
            <div className="w-full max-w-[900px] mx-auto bg-white border-4 border-black p-8 flex flex-col items-center justify-center min-h-[400px] gap-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-[60] relative">
                <div className="animate-spin h-12 w-12 border-4 border-black border-t-[#ff69b4] rounded-full"></div>
                <div className="font-black text-xl uppercase animate-pulse">LOADING DATA...</div>
            </div>
        );
    }

    // Error State
    if (error || !student) {
        return (
            <div className="w-full max-w-[900px] mx-auto bg-white border-4 border-black p-8 text-center min-h-[300px] flex flex-col items-center justify-center gap-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-[60] relative">
                <p className="font-bold text-xl uppercase">{error || "Student details not available."}</p>
                <button onClick={onClose} className="px-6 py-3 bg-black text-white hover:bg-[#ff0000] font-black uppercase border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none">Close</button>
            </div>
        );
    }

    const formatFloat = (num, decimals) => {
        if (num === null || num === undefined) return 'N/A';
        const val = parseFloat(num);
        return isNaN(val) ? 'N/A' : val.toFixed(decimals);
    };

    // Calculate derived values safely
    const subjects = student && student.subjects ? student.subjects : [];
    const activeSubject = subjects[selectedSubjectIndex] || (subjects.length > 0 ? subjects[0] : null);

    const topSubjects = student && student.subjects
        ? [...student.subjects]
            .filter(a => !['Sensor', 'Constitution', 'Environmental'].some(term => a.subject_name.includes(term)))
            .sort((a, b) => (a.rank || 999) - (b.rank || 999))
            .slice(0, 4)
        : [];

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

    const ViewRechartsBarChart = ({ activeSubject, maxMarks }) => {
        const data = [
            { name: 'MSE', value: activeSubject.mse || 0 },
            { name: 'ESE', value: activeSubject.ese || 0 },
            { name: 'T1', value: activeSubject.th_ise1 || 0 },
            { name: 'T2', value: activeSubject.th_ise2 || 0 },
            { name: 'P1', value: activeSubject.pr_ise1 || 0 },
            { name: 'P2', value: activeSubject.pr_ise2 || 0 },
        ];

        // Ensure maxMarks is reasonable (at least 20 to avoid huge bars for small marks)
        const safeMaxMarks = Math.max(maxMarks, 50);

        return (
            <div style={{ width: '100%', height: '100%', minHeight: '200px' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000" strokeOpacity={0.1} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#000', fontSize: 10, fontWeight: 900, fontFamily: 'monospace' }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#000', fontSize: 10, fontWeight: 700, fontFamily: 'monospace' }}
                            domain={[0, safeMaxMarks]}
                            allowDecimals={false}
                        />
                        <Bar dataKey="value" fill="#000" stroke="#000" strokeWidth={2} radius={[0, 0, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ff69b4' : '#00ffff'} />
                            ))}
                            <LabelList
                                dataKey="value"
                                position="top"
                                fill="#000"
                                fontSize={10}
                                fontWeight={900}
                                formatter={(val) => val > 0 ? val : ''}
                            />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <div className="w-full max-w-[1000px] mx-auto bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] font-mono text-black relative z-[60] max-h-[85vh] overflow-y-auto md:max-h-[90vh]">

            {/* Header Section */}
            <div className="bg-[#ffde00] border-b-4 border-black p-4 md:p-6 flex justify-between items-start">
                <div className="flex gap-4 md:gap-6 items-center">
                    <div className="w-24 h-24 md:w-32 md:h-32 border-4 border-black bg-white shrink-0 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {student.roll_no ? (
                            <img src={`/student_faces/${student.roll_no}.png`} alt={student.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                        ) : <div className="w-full h-full flex items-center justify-center"><User size={40} /></div>}
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-5xl font-black uppercase text-black leading-[0.85] mb-2">{student.name}</h1>
                        <div className="flex flex-wrap gap-2">
                            <span className="bg-black text-white px-2 py-1 font-bold text-xs md:text-sm uppercase">Roll: {student.roll_no}</span>
                            <span className="bg-white border-2 border-black px-2 py-1 font-bold text-xs md:text-sm uppercase">{formatClassName(student.class)}</span>
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="bg-white border-4 border-black p-1 md:p-2 hover:bg-[#ff0000] hover:text-white transition-colors shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none">
                    <X size={24} strokeWidth={3} />
                </button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 border-b-4 border-black">
                <div className="p-4 border-r-4 border-black bg-[#ff69b4] flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-black uppercase">SEMESTER SGPA</span>
                    <span className="text-4xl md:text-5xl font-black">{formatFloat(student.cgpa, 2)}</span>
                </div>
                <div className="p-4 border-r-0 md:border-r-4 border-black bg-[#00ffff] flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-black uppercase">ATTENDANCE</span>
                    <span className="text-4xl md:text-5xl font-black">{formatFloat(student.attendance, 1)}%</span>
                </div>
                <div className="p-4 border-r-4 border-t-4 md:border-t-0 border-black bg-white flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-bold uppercase text-gray-500">CLASS RANK</span>
                    <div className="flex items-center gap-2">
                        <Trophy size={20} />
                        <span className="text-3xl font-black">#{student.rank_cgpa_class}</span>
                    </div>
                </div>
                <div className="p-4 border-t-4 md:border-t-0 border-black bg-white flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-100 transition-colors group" onClick={handleAnalyze}>
                    <span className="text-xs font-bold uppercase text-gray-500 group-hover:text-black">Analysis</span>
                    <div className="flex items-center gap-2">
                        <Calculator size={24} className="group-hover:scale-110 transition-transform" />
                        <span className="text-xl font-black underline decoration-2 underline-offset-4">VIEW</span>
                    </div>
                </div>
            </div>

            {/* Top Subjects */}
            <div className="p-4 md:p-6 bg-white">
                <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                    <span className="bg-black text-[#ffde00] px-2">TOP PERFORMING SUBJECTS</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {topSubjects.map((sub, idx) => (
                        <div key={idx} className="border-4 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex justify-between items-center bg-white hover:bg-[#ffde00] transition-colors">
                            <div>
                                <div className="text-xs font-bold text-gray-500">#{idx + 1}</div>
                                <div className="font-black text-sm md:text-lg uppercase truncate max-w-[150px]">{sub.subject_name}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black">{sub.total_marks}</div>
                                <div className="text-xs font-bold">/{sub.maxMarks || 50}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Subject Performance Section */}
            {subjects.length > 0 && (
                <div className="p-4 md:p-6 bg-[#f0f0f0] border-t-4 border-black">
                    <h3 className="text-xl font-black uppercase mb-4 flex items-center gap-2">
                        <span className="bg-black text-[#00ffff] px-2">SUBJECT PERFORMANCE</span>
                    </h3>

                    {/* Scrolling Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-4 mb-2 custom-scrollbar">
                        {subjects.map((sub, idx) => (
                            <button
                                key={idx}
                                onClick={() => setSelectedSubjectIndex(idx)}
                                className={`
                                    px-4 py-2 font-bold uppercase border-2 border-black whitespace-nowrap transition-all
                                    ${selectedSubjectIndex === idx
                                        ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]'
                                        : 'bg-white text-black hover:bg-[#ff69b4] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    }
                                `}
                            >
                                {sub.subject_name}
                            </button>
                        ))}
                    </div>

                    {/* Chart Area */}
                    {activeSubject && (
                        <div className="bg-white border-4 border-black p-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b-2 border-black pb-4">
                                <h4 className="text-2xl font-black uppercase">{activeSubject.subject_name}</h4>
                                <div className="flex gap-4">
                                    <div className="text-right">
                                        <div className="text-xs font-bold text-gray-500 uppercase">Total Marks</div>
                                        <div className="text-2xl font-black">{activeSubject.total_marks}<span className="text-sm text-gray-400">/{activeSubject.maxMarks || 50}</span></div>
                                    </div>
                                    <div className="text-right pl-4 border-l-2 border-black">
                                        <div className="text-xs font-bold text-gray-500 uppercase">Subject Rank</div>
                                        <div className={`text-2xl font-black ${activeSubject.rank <= 3 ? 'text-[#ffde00] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]' : 'text-[#ff69b4]'}`}>#{activeSubject.rank || '-'}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[250px] w-full">
                                <ViewRechartsBarChart
                                    activeSubject={activeSubject}
                                    maxMarks={Math.max(activeSubject.ese || 0, activeSubject.mse || 0, activeSubject.th_ise1 || 0, 50)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Analysis Overlay */}
            {showAnalysis && analysisData && (
                <div className="absolute inset-0 z-[70] bg-[#ffde00] flex flex-col animate-in slide-in-from-bottom-full duration-300">
                    <div className="border-b-4 border-black p-4 flex justify-between items-center bg-white sticky top-0 z-10 shadow-md">
                        <div className="flex flex-col">
                            <h2 className="text-xl md:text-2xl font-black uppercase">SGPI BREAKDOWN</h2>
                            <a href="https://frcrce.ac.in/wp-content/uploads/2025/11/Academic_Rule_Book_FrCRCE_2024_25.pdf" target="_blank" rel="noopener noreferrer" className="text-xs md:text-sm font-bold underline hover:text-[#ff69b4]">
                                Fr. CRCE Academic Rule Book 2024-25 ↗
                            </a>
                        </div>
                        <button onClick={() => setShowAnalysis(false)} className="border-2 border-black p-1 hover:bg-black hover:text-white transition-colors"><X size={24} /></button>
                    </div>

                    <div className="p-4 md:p-8 overflow-y-auto flex-1">
                        {/* Double Minor Warning */}
                        {analysisData.dropped && analysisData.dropped.length > 0 && (
                            <div className="bg-orange-100 border-4 border-black p-4 mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <p className="font-black text-orange-600 uppercase mb-2">⚠ Double Minor — Not Counted in SGPI</p>
                                <div className="space-y-1">
                                    {analysisData.dropped.map((d, idx) => (
                                        <div key={idx} className="flex justify-between font-bold text-sm border-b border-black/10 pb-1 last:border-0">
                                            <span>{d.subject}</span>
                                            <span className="bg-orange-200 px-2 uppercase text-xs border border-black">Excluded</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 text-center">
                            <div className="text-sm font-bold uppercase mb-2">CALCULATED SGPI</div>
                            <div className="text-6xl md:text-8xl font-black text-[#ff69b4] drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                                {analysisData.sgpi}
                            </div>

                            {/* Formula Visualization */}
                            <div className="mt-6 pt-6 border-t-4 border-black">
                                <p className="font-bold text-xs uppercase mb-4 text-gray-500">Applied Formula (Section 16.2)</p>
                                <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-xl md:text-2xl font-black">
                                    <div className="flex flex-col items-center">
                                        <span className="border-b-4 border-black px-2">{analysisData.totalWeightedPoints}</span>
                                        <span className="px-2">{analysisData.totalCredits}</span>
                                    </div>
                                    <span className="text-4xl">=</span>
                                    <span className="text-[#00ffff] bg-black px-2 drop-shadow-[4px_4px_0px_rgba(0,0,0,0.5)]">{analysisData.sgpi}</span>
                                </div>
                                <div className="flex gap-4 justify-center mt-4 text-xs font-bold text-gray-500 uppercase">
                                    <span>Σ (Credits × Grade Points)</span>
                                    <span>÷</span>
                                    <span>Σ Credits</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 pb-12">
                            <div className="flex justify-between items-center border-b-4 border-black pb-2 mb-4 bg-white p-2 sticky top-[80px] z-10">
                                <span className="font-black text-sm uppercase w-[40%]">Subject</span>
                                <div className="flex gap-2 text-right w-[60%] justify-end">
                                    <span className="font-black text-xs uppercase w-12">Marks</span>
                                    <span className="font-black text-xs uppercase w-12">GP</span>
                                    <span className="font-black text-xs uppercase w-12">C</span>
                                    <span className="font-black text-xs uppercase w-16">CxGP</span>
                                </div>
                            </div>
                            {analysisData.breakdown.map((row, idx) => (
                                <div key={idx} className="flex justify-between items-center border-b-2 border-black pb-2 border-dashed px-2 bg-white/50 hover:bg-white transition-colors">
                                    <span className="font-bold text-xs md:text-sm uppercase truncate w-[40%]" title={row.subject}>{row.subject}</span>
                                    <div className="flex gap-2 text-right w-[60%] justify-end">
                                        <div className="w-12 font-mono font-bold">{row.marks}</div>
                                        <div className={`w-12 font-mono font-bold ${row.gradePoint === 0 ? 'text-red-600 bg-red-100' : ''}`}>{row.gradePoint}</div>
                                        <div className="w-12 font-mono font-bold">{row.credits}</div>
                                        <div className="w-16 font-mono font-black bg-[#ffde00] border-2 border-black text-center">{row.weightedPoint}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
