
import { useState, useEffect, useRef } from 'react';
import { studentAPI } from '../../utils/api';
import { Search } from 'lucide-react';
import StudentModal4 from './StudentModal4';

export default function SearchInput4() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [selectedStudentRoll, setSelectedStudentRoll] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const timeoutId = setTimeout(async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const data = await studentAPI.searchStudents(query);
                const students = Array.isArray(data) ? data : (data.students || []);
                setResults(students);
            } catch (err) {
                console.error("Search error:", err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (rollNo) => {
        setSelectedStudentRoll(rollNo);
        setShowResults(false);
        setQuery('');
    };

    return (
        <>
            <div ref={containerRef} className="relative w-full max-w-2xl mx-auto font-mono z-40">
                <div className="relative group">
                    <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 group-focus-within:translate-x-3 group-focus-within:translate-y-3 transition-transform"></div>
                    <div className="relative flex items-center bg-white border-4 border-black">
                        <Search className="w-5 h-5 md:w-6 md:h-6 ml-3 md:ml-4 text-black stroke-[3]" />
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                            placeholder="SEARCH NAME OR ROLL..."
                            className="w-full px-3 py-3 md:px-4 md:py-4 font-bold text-sm md:text-lg uppercase bg-transparent outline-none placeholder:text-gray-400"
                        />
                    </div>
                </div>

                {showResults && (query.length >= 2) && (
                    <div className="absolute left-0 right-0 top-[calc(100%+12px)] bg-white border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[300px] md:max-h-[400px] overflow-y-auto z-50">
                        {loading ? (
                            <div className="p-4 md:p-6 text-center font-black animate-pulse bg-[#ffde00] text-sm md:text-base">
                                SEARCHING DATABASE...
                            </div>
                        ) : results.length > 0 ? (
                            results.map((student) => (
                                <div
                                    key={student.roll_no}
                                    onClick={() => handleSelect(student.roll_no)}
                                    className="p-3 md:p-4 border-b-4 border-black last:border-b-0 hover:bg-[#00ffff] cursor-pointer transition-colors flex justify-between items-center group"
                                >
                                    <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                                        <div className="w-8 h-8 md:w-10 md:h-10 border-2 border-black bg-gray-200 flex-shrink-0 overflow-hidden">
                                            <img
                                                src={`/student_faces/${student.roll_no}.png`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-black uppercase text-sm md:text-lg leading-none truncate">{student.name}</div>
                                            <div className="text-[10px] md:text-xs font-bold bg-black text-white px-1 inline-block mt-1">{student.roll_no}</div>
                                        </div>
                                    </div>
                                    <div className="font-black text-lg md:text-xl pl-2">{student.cgpa || '?'}</div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 md:p-6 text-center font-black text-gray-500 text-sm md:text-base">
                                NO RECORDS FOUND
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedStudentRoll && (
                <StudentModal4
                    rollNo={selectedStudentRoll}
                    onClose={() => setSelectedStudentRoll(null)}
                />
            )}
        </>
    );
}
