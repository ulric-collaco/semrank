
import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a2e]/95 p-3 rounded-lg border border-white/10 text-xs text-ink shadow-none">
        <p className="font-bold mb-2 border-b border-white/10 pb-1">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="font-medium text-body">{entry.name}:</span>
            <span className="font-bold text-ink ml-auto">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
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
    } else if (selectedStudents.length < 4) {
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
          dataPoint[student.name] = marks;
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
      let displayLabel = category;
      if (displayLabel.length > 15) {
        // Try to create initials if it's long? Or just truncate
        displayLabel = category.substring(0, 15) + '...';
      }

      const dataPoint = { subject: displayLabel, fullSubject: category };
      const potentialSubjects = categoryMap[category];

      selectedStudents.forEach(student => {
        let total = 0;
        const match = potentialSubjects.find(s => student.subjectsObj?.[s]);
        if (match) {
          total = student.subjectsObj[match]['Total'] || 0;
        }
        dataPoint[student.name] = total;
      });

      if (selectedStudents.some(s => dataPoint[s.name] > 0)) {
        dataPoints.push(dataPoint);
      }
    });

    return dataPoints;

  }, [selectedStudents]);

  // Common container style - flat, no shadow, subtle border
  const containerClass = "bg-[#1a1a2e]/50 border border-white/5 p-6 rounded-xl backdrop-blur-sm";

  return (
    <div className="min-h-screen bg-background text-ink p-8 pt-24 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-display font-bold mb-2">Compare Students</h1>
            <p className="text-body text-sm md:text-base">
              Select up to 4 students to analyze their performance side-by-side.
            </p>
          </div>

          <div className={`${containerClass} px-4 py-2 flex items-center gap-2 !p-2 !rounded-lg`}>
            <Users className="w-5 h-5 text-accent" />
            <span className="font-semibold text-ink">
              {selectedStudents.length} / 4 Selected
            </span>
          </div>
        </div>

        {/* Search & Selection Area */}
        <div className={containerClass}>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar mt-6">
              {filteredStudents.map((student) => {
                const isSelected = selectedStudents.some(s => s.roll_no === student.roll_no);
                const isDisabled = !isSelected && selectedStudents.length >= 4;

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
                      <div className="min-w-0">
                        <div className={`font-semibold text-sm truncate ${isSelected ? 'text-ink' : 'text-body group-hover:text-ink'}`}>
                          {student.name}
                        </div>
                        <div className="text-xs text-body/50 truncate font-mono mt-0.5">
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
        {selectedStudents.length > 0 && (
          <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            {selectedStudents.map((student, idx) => (
              <div
                key={student.roll_no}
                className="flex items-center gap-2 pl-3 pr-2 py-1.5 bg-[#1a1a2e]/80 border border-white/10 rounded-full hover:bg-white/5 transition-all"
                style={{ borderLeft: `4px solid ${THEME_COLORS[idx % THEME_COLORS.length]}` }}
              >
                <span className="font-semibold text-sm text-ink max-w-[150px] truncate">{student.name}</span>
                <button
                  onClick={() => toggleStudent(student)}
                  className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded-full transition-colors text-body/50"
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
              <div className="h-[300px] sm:h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                    <PolarGrid stroke="#94a3b8" strokeOpacity={0.4} />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#f8fafc', fontSize: 12, fontWeight: 600 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    {selectedStudents.map((student, idx) => (
                      <Radar
                        key={student.roll_no}
                        name={student.name}
                        dataKey={student.name}
                        stroke={THEME_COLORS[idx % THEME_COLORS.length]}
                        fill={THEME_COLORS[idx % THEME_COLORS.length]}
                        fillOpacity={0.4}
                        strokeWidth={3}
                      />
                    ))}
                    <Legend iconType="circle" />
                    <Tooltip content={<CustomTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Subject-wise Bar Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {comparisonData && Object.entries(comparisonData).map(([subject, data], chartIdx) => (
                <div key={subject} className={`${containerClass} flex flex-col`}>
                  <h3 className="text-lg font-bold mb-4 text-center text-ink truncate relative" title={subject}>
                    {subject}
                    <div className="h-0.5 w-12 bg-white/10 mx-auto mt-2 rounded-full"></div>
                  </h3>
                  <div className="h-[250px] w-full flex-grow">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" strokeOpacity={0.2} />
                        <XAxis
                          dataKey="exam"
                          tick={{ fill: '#cbd5e1', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fill: '#cbd5e1', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                        <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px' }} />
                        {selectedStudents.map((student, idx) => (
                          <Bar
                            key={student.roll_no}
                            dataKey={student.name}
                            fill={THEME_COLORS[idx % THEME_COLORS.length]}
                            radius={[4, 4, 0, 0]} // Keep rounded top
                            maxBarSize={50}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
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
