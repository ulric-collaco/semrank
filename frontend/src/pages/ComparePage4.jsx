
import React, { useState, useEffect, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, Tooltip,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Users, X, Search, Check, ArrowLeft, Trash2 } from 'lucide-react';
import { studentAPI } from '../utils/api';
import { formatClassName } from '../utils/format';
import Navbar4 from '../components/landing4/Navbar4';
import Footer4 from '../components/landing4/Footer4';

// Neo-Brutalist Palette
const THEME_COLORS = [
    '#ff69b4', // Hot Pink
    '#00ffff', // Cyan
    '#ffde00', // Yellow
    '#9333ea', // Purple
    '#ff4500', // Orange Red
];

const ELECTIVE_GROUPS = {
    'PE-II': ['DLRL', 'HMI'],
    'PEL-II': ['IPDL', 'NLP', 'OSINT'],
    'OE-I': ['SCM', 'IoT', '3D Printing', 'E-Vehicle']
};

function getElectiveGroup(subjectName) {
    for (const [groupName, subjects] of Object.entries(ELECTIVE_GROUPS)) {
        if (subjects.some(s => subjectName.includes(s))) {
            return groupName;
        }
    }
    return null;
}

const CustomPolarAngleAxisTick = ({ payload, x, y, cx, cy, ...rest }) => {
    if (!payload || !payload.value) return null;
    let label = payload.value.split(' - ')[0].trim();
    const words = label.split(/\s+/);
    const shortLabel = words[0].length > 4 ? words[0] : (words.slice(0, 2).join(' '));

    return (
        <text
            {...rest}
            x={x}
            y={y}
            className="text-[10px] md:text-xs font-bold fill-black font-mono uppercase"
            textAnchor="middle"
            alignmentBaseline="central"
        >
            <tspan x={x} dy="0.3em">{shortLabel}</tspan>
        </text>
    );
};

// Custom Tooltip for brutalist theme (fixes black-on-black issue from ChartTooltipContent)
const BrutalTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border-3 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-mono">
            <p className="font-black text-sm text-black uppercase mb-1">{label}</p>
            {payload.map((entry, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 border-2 border-black" style={{ backgroundColor: entry.color || entry.fill }} />
                    <span className="text-gray-700 font-bold">{entry.name}:</span>
                    <span className="font-black text-black">{entry.value}</span>
                </div>
            ))}
        </div>
    );
};

export default function ComparePage4() {
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedClass, setSelectedClass] = useState('All');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const data = await studentAPI.getAllStudents();
                setStudents(data);
            } catch (error) {
                console.error('Error fetching students:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, []);

    const classes = useMemo(() => {
        const unique = new Set(students.map(s => s.class).filter(Boolean));
        return ['All', ...Array.from(unique).sort()];
    }, [students]);

    const filteredStudents = useMemo(() => {
        let filtered = students;
        if (selectedClass !== 'All') {
            filtered = filtered.filter(s => s.class === selectedClass);
        }
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (s) => s.name?.toLowerCase().includes(q) || s.roll_no?.toString().toLowerCase().includes(q)
            );
        }
        return filtered;
    }, [students, searchQuery, selectedClass]);

    const buildSubjectsObj = (subjects) => {
        const obj = {};
        if (subjects && Array.isArray(subjects)) {
            subjects.forEach(sub => {
                obj[sub.subject_name] = {
                    'MSE': sub.mse,
                    'ESE': sub.ese,
                    'TH-ISE1': sub.th_ise1,
                    'TH-ISE2': sub.th_ise2,
                    'PR-ISE1': sub.pr_ise1,
                    'PR-ISE2': sub.pr_ise2,
                    'Total': sub.total_marks
                };
            });
        }
        return obj;
    };

    const toggleStudent = (student) => {
        const isSelected = selectedStudents.find(s => s.roll_no === student.roll_no);

        if (isSelected) {
            setSelectedStudents(prev => prev.filter(s => s.roll_no !== student.roll_no));
            return;
        }

        if (selectedStudents.length >= 2) return;

        // If we already have full details, add immediately
        if (student.subjects) {
            setSelectedStudents(prev => [...prev, { ...student, subjectsObj: buildSubjectsObj(student.subjects) }]);
            return;
        }

        // Optimistic: add student immediately with basic info + loading flag
        const placeholder = { ...student, subjectsObj: {}, _loading: true };
        setSelectedStudents(prev => [...prev, placeholder]);

        // Fetch details in background, then update in-place
        studentAPI.getStudentByRoll(student.roll_no)
            .then(detail => {
                const subjectsObj = buildSubjectsObj(detail.subjects);
                setSelectedStudents(prev =>
                    prev.map(s => s.roll_no === student.roll_no ? { ...detail, subjectsObj } : s)
                );
            })
            .catch(err => {
                console.error("Failed to fetch details", err);
                // Remove the placeholder on failure
                setSelectedStudents(prev => prev.filter(s => s.roll_no !== student.roll_no));
            });
    };

    const radarData = useMemo(() => {
        if (selectedStudents.length === 0) return [];
        const uniqueCategories = new Set();
        const categoryMap = {};

        selectedStudents.forEach(student => {
            Object.keys(student.subjectsObj || {}).forEach(subject => {
                const group = getElectiveGroup(subject);
                if (group) {
                    uniqueCategories.add(group);
                    if (!categoryMap[group]) categoryMap[group] = [];
                    if (!categoryMap[group].includes(subject)) categoryMap[group].push(subject);
                } else {
                    uniqueCategories.add(subject);
                    if (!categoryMap[subject]) categoryMap[subject] = [subject];
                }
            });
        });

        const dataPoints = [];
        uniqueCategories.forEach(category => {
            const dataPoint = { subject: category, fullSubject: category };
            const potentialSubjects = categoryMap[category];

            selectedStudents.forEach(student => {
                let total = 0;
                const match = potentialSubjects.find(s => student.subjectsObj?.[s]);
                if (match) {
                    total = student.subjectsObj[match]['Total'] || 0;
                }
                dataPoint[`s_${student.roll_no}`] = total;
            });
            dataPoints.push(dataPoint);
        });
        return dataPoints;
    }, [selectedStudents]);

    const comparisonData = useMemo(() => {
        if (selectedStudents.length === 0) return null;
        const allSubjects = new Set();
        const electiveGroupsUsed = new Set();

        selectedStudents.forEach(student => {
            Object.keys(student.subjectsObj || {}).forEach(subject => {
                const group = getElectiveGroup(subject);
                if (group) {
                    electiveGroupsUsed.add(group);
                } else {
                    allSubjects.add(subject);
                }
            });
        });

        const subjectComparisons = {};
        const processChartData = (subjectsList) => {
            const examTypes = new Set();
            selectedStudents.forEach(student => {
                subjectsList.forEach(subj => {
                    if (student.subjectsObj?.[subj]) {
                        Object.keys(student.subjectsObj[subj]).forEach(exam => {
                            if (typeof student.subjectsObj[subj][exam] === 'number') examTypes.add(exam);
                        })
                    }
                })
            });
            if (examTypes.has('Total')) examTypes.delete('Total');
            if (examTypes.size === 0) return null;

            return Array.from(examTypes).map(examType => {
                const dp = { exam: examType };
                selectedStudents.forEach(student => {
                    let marks = 0;
                    const studentSubject = subjectsList.find(s => student.subjectsObj?.[s]);
                    if (studentSubject) marks = student.subjectsObj[studentSubject][examType] || 0;
                    dp[`s_${student.roll_no}`] = marks;
                });
                return dp;
            });
        };

        allSubjects.forEach(subject => {
            const data = processChartData([subject]);
            if (data) subjectComparisons[subject] = data;
        });

        electiveGroupsUsed.forEach(groupName => {
            const actualSubjectsInGroup = new Set();
            selectedStudents.forEach(student => {
                Object.keys(student.subjectsObj || {}).forEach(sub => {
                    if (getElectiveGroup(sub) === groupName) actualSubjectsInGroup.add(sub);
                });
            });

            const data = processChartData(Array.from(actualSubjectsInGroup));
            const label = selectedStudents
                .map(s => {
                    const subj = Object.keys(s.subjectsObj || {}).find(k => getElectiveGroup(k) === groupName);
                    return subj ? subj.split(' - ')[0] : '';
                })
                .filter(Boolean)
                .join(' / ');

            if (data) subjectComparisons[label || groupName] = data;
        });

        return subjectComparisons;
    }, [selectedStudents]);

    const chartConfig = useMemo(() => {
        return selectedStudents.reduce((acc, student, idx) => {
            acc[`s_${student.roll_no}`] = {
                label: student.name,
                color: THEME_COLORS[idx % THEME_COLORS.length]
            };
            return acc;
        }, {});
    }, [selectedStudents]);

    return (
        <div className="min-h-screen bg-white text-black font-mono selection:bg-[#ffde00] overflow-x-hidden w-full max-w-full">
            <Navbar4 />

            <div className="w-full max-w-7xl mx-auto px-4 py-8 md:py-12 md:px-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 border-b-4 border-black pb-6 gap-4">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-2 break-words hyphens-auto text-black">
                            Fight Club
                        </h1>
                        <p className="bg-black text-white inline-block px-2 py-1 font-bold text-xs md:text-base">
                            COMPARE PERFORMANCE METRICS
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {selectedStudents.length > 0 && (
                            <button
                                onClick={() => setSelectedStudents([])}
                                className="bg-white border-4 border-black px-3 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 hover:bg-red-100 hover:border-red-600 hover:shadow-[4px_4px_0px_0px_rgba(220,38,38,1)] transition-all active:translate-x-1 active:translate-y-1 active:shadow-none"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-xs md:text-sm">CLEAR</span>
                            </button>
                        )}
                        <div className="bg-[#ffde00] border-4 border-black px-4 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 flex-1 md:flex-none justify-center">
                            <Users className="w-5 h-5" />
                            <span>{selectedStudents.length} / 2 FIGHTERS READY</span>
                        </div>
                    </div>
                </div>

                {/* Search & Selection */}
                <div className="bg-[#f0f0f0] border-4 border-black p-3 md:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] mb-8 md:mb-12">
                    <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-black" />
                        <input
                            type="text"
                            placeholder="FIND FIGHTER (NAME OR ROLL NO)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-14 pr-4 py-3 md:py-4 bg-white border-4 border-black font-bold placeholder:text-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all uppercase text-sm md:text-base truncate"
                        />
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6">
                        {classes.map(cls => (
                            <button
                                key={cls}
                                onClick={() => setSelectedClass(cls)}
                                className={`px-3 md:px-4 py-2 font-bold border-2 border-black transition-all uppercase text-xs md:text-sm ${selectedClass === cls
                                    ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(100,100,100,1)]'
                                    : 'bg-white hover:bg-[#ff69b4] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                    }`}
                            >
                                {formatClassName(cls)}
                            </button>
                        ))}
                    </div>

                    {loading ? (
                        <div className="text-center py-8 font-bold animate-pulse">LOADING ROSTER...</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3 max-h-[320px] md:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar border-2 border-black/10 p-2">
                            {filteredStudents.map((student) => {
                                const isSelected = selectedStudents.some(s => s.roll_no === student.roll_no);
                                const isDisabled = !isSelected && selectedStudents.length >= 2;

                                return (
                                    <button
                                        key={student.roll_no}
                                        onClick={() => toggleStudent(student)}
                                        disabled={isDisabled}
                                        className={`
                                            relative p-2 border-2 border-black text-left transition-all
                                            ${isSelected
                                                ? 'bg-[#00ffff] shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5'
                                                : 'bg-white hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                                            }
                                            ${isDisabled ? 'opacity-40 cursor-not-allowed bg-gray-200' : ''}
                                        `}
                                    >
                                        <div className="flex items-center gap-2">
                                            {/* Student Photo */}
                                            <div className="w-9 h-9 md:w-10 md:h-10 border-2 border-black bg-gray-100 flex-shrink-0 overflow-hidden">
                                                {student.roll_no ? (
                                                    <img
                                                        src={`/student_faces/${student.roll_no}.png`}
                                                        alt={student.name}
                                                        className="w-full h-full object-cover"
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            e.target.style.display = 'none';
                                                            e.target.nextSibling.style.display = 'flex';
                                                        }}
                                                    />
                                                ) : null}
                                                <div className={`${student.roll_no ? 'hidden' : 'flex'} w-full h-full items-center justify-center text-xs font-black text-gray-400`}>
                                                    {student.name?.charAt(0)}
                                                </div>
                                            </div>
                                            {/* Info */}
                                            <div className="overflow-hidden min-w-0 flex-1">
                                                <div className="font-bold truncate uppercase text-[11px] md:text-xs leading-tight">{student.name}</div>
                                                <div className="flex items-center gap-1 mt-0.5">
                                                    <span className="text-[10px] font-mono bg-black text-white px-1 leading-relaxed">{student.roll_no}</span>
                                                    {student.class && (
                                                        <span className="text-[9px] font-bold text-gray-500 uppercase hidden md:inline">{formatClassName(student.class)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Check */}
                                            {isSelected && (
                                                <Check className="w-4 h-4 stroke-[3] flex-shrink-0" />
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Comparison Viz */}
                {selectedStudents.length > 0 ? (
                    <div className="space-y-8 md:space-y-12">
                        {/* Active Fighters Bar */}
                        <div className="flex flex-wrap gap-4 md:gap-6 justify-center">
                            {selectedStudents.map((student, idx) => (
                                <div
                                    key={student.roll_no}
                                    className="flex items-center gap-3 bg-white border-4 border-black p-3 md:p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] w-full md:w-auto md:min-w-[240px]"
                                    style={{ borderLeftWidth: '12px', borderLeftColor: THEME_COLORS[idx % THEME_COLORS.length] }}
                                >
                                    {/* Fighter Photo */}
                                    <div className="w-12 h-12 border-3 border-black bg-gray-100 flex-shrink-0 overflow-hidden">
                                        {student.roll_no ? (
                                            <img
                                                src={`/student_faces/${student.roll_no}.png`}
                                                alt={student.name}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div className={`${student.roll_no ? 'hidden' : 'flex'} w-full h-full items-center justify-center font-black text-gray-400`}>
                                            {student.name?.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-black uppercase text-base md:text-lg truncate">{student.name}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] font-mono bg-black text-white px-1">{student.roll_no}</span>
                                            {student.class && (
                                                <span className="text-[10px] font-bold text-gray-500">{formatClassName(student.class)}</span>
                                            )}
                                            {student._loading && (
                                                <span className="text-[10px] font-bold text-orange-500 animate-pulse">LOADING...</span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => toggleStudent(student)}
                                            className="text-[10px] font-bold underline hover:text-red-600 mt-1 uppercase"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Radar Chart */}
                        <div className="bg-white border-4 border-black p-4 md:p-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                            <h2 className="text-2xl md:text-3xl font-black uppercase text-center mb-4 md:mb-8 decoration-wavy underline decoration-[#ff69b4]">
                                Power Level Analysis
                            </h2>
                            <div className="h-[300px] md:h-[400px] w-full -ml-2 md:ml-0 relative">
                                <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                                        <PolarGrid stroke="#000" strokeWidth={2} />
                                        <PolarAngleAxis dataKey="subject" tick={<CustomPolarAngleAxisTick />} />
                                        <PolarRadiusAxis angle={30} domain={[0, 50]} tick={false} axisLine={false} />
                                        {selectedStudents.map((student, idx) => (
                                            <Radar
                                                key={student.roll_no}
                                                name={student.name}
                                                dataKey={`s_${student.roll_no}`}
                                                stroke={THEME_COLORS[idx % THEME_COLORS.length]}
                                                strokeWidth={3}
                                                fill={THEME_COLORS[idx % THEME_COLORS.length]}
                                                fillOpacity={0.5}
                                            />
                                        ))}
                                        <Tooltip content={<BrutalTooltip />} />
                                    </RadarChart>
                                </ChartContainer>
                            </div>
                            {/* Legend */}
                            <div className="flex flex-wrap justify-center gap-4 md:gap-6 mt-4 pt-4 border-t-2 border-black/10">
                                {selectedStudents.map((student, idx) => (
                                    <div key={student.roll_no} className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: THEME_COLORS[idx % THEME_COLORS.length] }} />
                                        <span className="font-bold text-sm uppercase">{student.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Bar Charts */}
                        <div className="grid grid-cols-1 gap-8 md:gap-12">
                            {comparisonData && Object.entries(comparisonData).map(([subject, data]) => (
                                <div key={subject} className="bg-white border-4 border-black p-4 md:p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                                    <h3 className="text-xl md:text-2xl font-black uppercase mb-6 bg-[#ffde00] inline-block px-2 border-2 border-black rotate-1 truncate max-w-full">
                                        {subject}
                                    </h3>
                                    <div className="h-[250px] md:h-[300px] w-full">
                                        <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                                            <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#000" strokeOpacity={0.1} vertical={false} />
                                                <XAxis dataKey="exam" tick={{ fill: '#000', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={false} />
                                                <YAxis tick={{ fill: '#000', fontSize: 11, fontFamily: 'monospace' }} axisLine={{ stroke: '#000', strokeWidth: 2 }} tickLine={false} domain={[0, 50]} allowDecimals={false} />
                                                <Tooltip content={<BrutalTooltip />} />
                                                <ChartLegend content={<ChartLegendContent />} />
                                                {selectedStudents.map((student, idx) => (
                                                    <Bar
                                                        key={student.roll_no}
                                                        dataKey={`s_${student.roll_no}`}
                                                        fill={THEME_COLORS[idx % THEME_COLORS.length]}
                                                        stroke="#000"
                                                        strokeWidth={2}
                                                        radius={0}
                                                    />
                                                ))}
                                            </BarChart>
                                        </ChartContainer>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    /* Empty State */
                    !loading && (
                        <div className="bg-[#f0f0f0] border-4 border-dashed border-black p-12 md:p-16 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                            <div className="bg-white border-4 border-black w-20 h-20 mx-auto flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rotate-3">
                                <Users className="w-10 h-10" />
                            </div>
                            <h3 className="text-2xl md:text-3xl font-black uppercase mb-3">No Fighters Selected</h3>
                            <p className="text-gray-500 font-bold max-w-md mx-auto">
                                SEARCH AND SELECT 2 FIGHTERS FROM THE ROSTER ABOVE TO BEGIN THE COMPARISON.
                            </p>
                        </div>
                    )
                )}
            </div>
            <Footer4 />
        </div>
    );
}
