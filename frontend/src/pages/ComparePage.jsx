
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { ArrowLeft, Users, X, Search, Check } from 'lucide-react';
import { studentAPI } from '../utils/api';
import { formatClassName } from '../utils/format';

// Theme colors - Softer, less high-contrast palette
const THEME_COLORS = [
  '#818cf8', // Indigo 400
  '#34d399', // Emerald 400
  '#fbbf24', // Amber 400
  '#f472b6', // Pink 400
  '#60a5fa', // Blue 400
];

// Elective grouping logic - Removed 'Mandatory' as per request
const ELECTIVE_GROUPS = {
  'PE-II': ['DLRL', 'HMI'],
  'PEL-II': ['IPDL', 'NLP', 'OSINT'],
  // 'Mandatory' group removed to treat ESI/HWP as regular subjects
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

// CustomTooltip removed in favor of ChartTooltipContent

const CustomPolarAngleAxisTick = ({ payload, x, y, cx, cy, ...rest }) => {
  // Use only the first non-trivial word or acronym for cleaner mobile view
  // E.g. "Software Architecture" -> "Software", "Cloud Computing" -> "Cloud"
  // Or just take the first word always.
  let label = payload.value;
  // Simple heuristic: if contain ' - ', split and take first part. Then take first word.
  label = label.split(' - ')[0].trim();
  // Take first word if it's long, or up to 2 words if short
  const words = label.split(/\s+/);
  const shortLabel = words[0].length > 4 ? words[0] : (words.slice(0, 2).join(' '));

  // Calculate a slight offset multiplier based on position if needed,
  // but for now, just pushing them out a bit more with a fixed radius offset logic
  // handled by Recharts, or we can adjust dy manually.
  // Recharts passes x,y for the tick. We can shift it slightly outward.

  return (
    <text
      {...rest}
      x={x}
      y={y}
      className="text-[10px] md:text-[11px] font-bold fill-gray-300"
      textAnchor="middle"
      alignmentBaseline="central"
    >
      <tspan x={x} dy="0.3em">{shortLabel}</tspan>
    </text>
  );
};

export default function ComparePage() {
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [fetchingDetails, setFetchingDetails] = useState(false);
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



  // Extract unique classes
  const classes = useMemo(() => {
    const unique = new Set(students.map(s => s.class).filter(Boolean));
    return ['All', ...Array.from(unique).sort()];
  }, [students]);

  const filteredStudents = useMemo(() => {
    let filtered = students;

    // Filter by class
    if (selectedClass !== 'All') {
      filtered = filtered.filter(s => s.class === selectedClass);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) => s.name?.toLowerCase().includes(q) || s.roll_no?.toString().toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [students, searchQuery, selectedClass]);

  const toggleStudent = async (student) => {
    const isSelected = selectedStudents.find(s => s.roll_no === student.roll_no);

    if (isSelected) {
      setSelectedStudents(prev => prev.filter(s => s.roll_no !== student.roll_no));
    } else if (selectedStudents.length < 2) {
      let studentDetail = student;
      if (!student.subjects) {
        try {
          setFetchingDetails(true);
          studentDetail = await studentAPI.getStudentByRoll(student.roll_no);
        } catch (err) {
          console.error("Failed to fetch details for", student.name, err);
          return;
        } finally {
          setFetchingDetails(false);
        }
      }

      const subjectsObj = {};
      if (studentDetail.subjects && Array.isArray(studentDetail.subjects)) {
        studentDetail.subjects.forEach(sub => {
          subjectsObj[sub.subject_name] = {
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

      setSelectedStudents([...selectedStudents, { ...studentDetail, subjectsObj }]);
    }
  };

  const comparisonData = useMemo(() => {
    if (selectedStudents.length === 0) return null;

    const allSubjects = new Set();
    const electiveGroupsUsed = new Set();

    selectedStudents.forEach(student => {
      Object.keys(student.subjectsObj || {}).forEach(subject => {
        const electiveGroup = getElectiveGroup(subject);
        if (electiveGroup) {
          electiveGroupsUsed.add(electiveGroup);
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
              if (typeof student.subjectsObj[subj][exam] === 'number') {
                examTypes.add(exam);
              }
            });
          }
        });
      });

      if (examTypes.has('Total')) examTypes.delete('Total');
      if (examTypes.size === 0) return null;

      return Array.from(examTypes).map(examType => {
        const dataPoint = { exam: examType };
        selectedStudents.forEach(student => {
          let marks = 0;
          const studentSubject = subjectsList.find(s => student.subjectsObj?.[s]);

          if (studentSubject) {
            marks = student.subjectsObj[studentSubject][examType] || 0;
          }
          dataPoint[`s_${student.roll_no}`] = marks;
        });
        return dataPoint;
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
          if (getElectiveGroup(sub) === groupName) {
            actualSubjectsInGroup.add(sub);
          }
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
      // Shorter labels for radar chart
      // For simplified view, we might try to abbreviate common subject names
      // Use full category name, wrapping handled by custom tick
      const displayLabel = category;

      const dataPoint = { subject: displayLabel, fullSubject: category };
      const potentialSubjects = categoryMap[category];

      // CRITICAL FIX: Iterate through ALL selected students to ensure everyone has a value (even 0)
      // This guarantees the radar chart draws a point/line for every student at every axis.
      selectedStudents.forEach(student => {
        let total = 0;
        // Find if this student has any subject that maps to this category
        const match = potentialSubjects.find(s => student.subjectsObj?.[s]);
        if (match) {
          total = student.subjectsObj[match]['Total'] || 0;
        }
        dataPoint[`s_${student.roll_no}`] = total;
      });

      // valid if at least one student has this subject (even if marks are 0, checking if subject exists in curriculum)
      // Actually, we should show the axis if ANY student has the subject in their list.
      // The `uniqueCategories` set already ensures we only look at relevant subjects.
      dataPoints.push(dataPoint);
    });

    return dataPoints;

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

  // Common container style - flat, no shadow, subtle border
  const containerClass = "bg-[#1a1a2e]/50 border border-white/5 p-6 rounded-xl backdrop-blur-sm";

  return (
    <div className="min-h-screen text-ink px-4 py-6 pt-32 md:p-8 md:pt-32 font-sans overflow-x-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">Compare Students</h1>

          </div>

          <div className={`${containerClass} px-4 py-2 flex items-center gap-2 !p-2 !rounded-lg`}>
            <Users className="w-5 h-5 text-accent" />
            <span className="font-semibold text-ink">
              {selectedStudents.length} / 2 Selected
            </span>
          </div>
        </div>

        {/* Search & Selection Area */}
        <div className={containerClass}>
          {/* ... existing search ... */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-body/50" />
            <input
              type="text"
              placeholder="Search by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-black/20 rounded-lg border border-white/5 text-ink placeholder:text-body/50 focus:outline-none focus:border-accent/40 transition-all font-sans"
            />
          </div>

          {/* Class Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {classes.map(cls => (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`
                  px-4 py-2 rounded-lg text-sm font-semibold transition-all border
                  ${selectedClass === cls
                    ? 'bg-accent text-ink border-accent shadow-bubble-hover'
                    : 'bg-white/5 text-body border-white/10 hover:bg-white/10 hover:text-ink'
                  }
                `}
              >
                {formatClassName(cls)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-8 text-body">Loading students...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar mt-6">
              {filteredStudents.map((student) => {
                const isSelected = selectedStudents.some(s => s.roll_no === student.roll_no);
                const isDisabled = !isSelected && selectedStudents.length >= 2;

                return (
                  <button
                    key={student.roll_no}
                    onClick={() => toggleStudent(student)}
                    disabled={isDisabled || fetchingDetails}
                    className={`
                      group relative p-3 rounded-lg border text-left transition-all duration-200
                      ${isSelected
                        ? 'bg-accent/10 border-accent/40'
                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
                      }
                      ${isDisabled ? 'opacity-30 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className={`font-semibold text-sm line-clamp-2 leading-tight ${isSelected ? 'text-ink' : 'text-body group-hover:text-ink'}`}>
                          {student.name}
                        </div>
                        <div className="text-xs text-body/50 truncate font-mono mt-1">
                          {student.roll_no}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="bg-accent text-white rounded-full p-1">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Students Chips */}
        {/* Selected Students Chips - Grid 2x2 on mobile, flex row on desktop */}
        {selectedStudents.length > 0 && (
          <div className="grid grid-cols-2 lg:flex lg:flex-wrap gap-3 animate-in fade-in slide-in-from-top-4 duration-300 mb-12 mt-6">
            {selectedStudents.map((student, idx) => (
              <div
                key={student.roll_no}
                className="flex items-center justify-between gap-2 pl-3 pr-2 py-2 bg-[#1a1a2e]/80 border border-white/10 rounded-lg hover:bg-white/5 transition-all w-full lg:w-auto lg:rounded-full"
                style={{ borderLeft: `4px solid ${THEME_COLORS[idx % THEME_COLORS.length]}` }}
              >
                <span className="font-semibold text-sm text-ink truncate flex-1">{student.name}</span>
                <button
                  onClick={() => toggleStudent(student)}
                  className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors text-body/50 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Visualization Section */}
        {selectedStudents.length > 0 ? (
          <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">

            {/* Overall Radar Chart */}
            <div className={containerClass}>
              <h2 className="text-xl font-bold mb-6 text-center text-ink flex items-center justify-center gap-2">
                Overall Performance
              </h2>
              <div className="h-[350px] sm:h-[450px] w-full -ml-[10px] sm:ml-0">
                <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="#94a3b8" strokeOpacity={0.4} />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={<CustomPolarAngleAxisTick />}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    {selectedStudents.map((student, idx) => (
                      <Radar
                        key={student.roll_no}
                        name={student.name}
                        dataKey={`s_${student.roll_no}`}
                        stroke={`var(--color-s_${student.roll_no})`}
                        fill={`var(--color-s_${student.roll_no})`}
                        fillOpacity={0.4}
                        strokeWidth={3}
                      />
                    ))}
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </RadarChart>
                </ChartContainer>
              </div>

              {/* Custom Legend to prevent overlap */}
              <div className="flex flex-wrap justify-center gap-4 mt-2 px-4">
                {selectedStudents.map((student, idx) => (
                  <div key={student.roll_no} className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: THEME_COLORS[idx % THEME_COLORS.length] }}
                    />
                    <span className="text-sm text-body font-medium">{student.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject-wise Bar Charts */}
            <div className="grid grid-cols-1 gap-8">
              {comparisonData && Object.entries(comparisonData).map(([subject, data], chartIdx) => (
                <div key={subject} className={`${containerClass} flex flex-col`}>
                  <h3 className="text-lg font-bold mb-4 text-center text-ink truncate relative" title={subject}>
                    {subject}
                    <div className="h-0.5 w-12 bg-white/10 mx-auto mt-2 rounded-full"></div>
                  </h3>
                  <div className="h-[400px] w-full flex-grow">
                    <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
                      <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barGap={2}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.1} />
                        <XAxis
                          dataKey="exam"
                          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                          axisLine={false}
                          tickLine={false}
                          dy={10}
                        />
                        <YAxis
                          tick={{ fill: '#64748b', fontSize: 11 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <ChartTooltip
                          cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                          content={<ChartTooltipContent />}
                        />
                        <ChartLegend content={<ChartLegendContent />} />
                        {selectedStudents.map((student, idx) => (
                          <Bar
                            key={student.roll_no}
                            dataKey={`s_${student.roll_no}`}
                            fill={`var(--color-s_${student.roll_no})`}
                            radius={[4, 4, 0, 0]}
                            maxBarSize={60}
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
            <div className={`${containerClass} py-16 px-6 text-center border-dashed border-white/10`}>
              <div className="bg-white/5 w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4">
                <Users className="w-10 h-10 text-body/30" />
              </div>
              <h3 className="text-xl font-bold text-ink mb-2">No Students Selected</h3>
              <p className="text-body max-w-md mx-auto">
                Search and select students from the list above to verify and compare their academic performance.
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
