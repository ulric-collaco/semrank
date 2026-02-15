
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
            <div ref={containerRef} className="relative w-full max-w-3xl mx-auto font-mono z-40 px-4">
                <div className="relative group transform rotate-[-1deg] hover:rotate-0 transition-transform duration-300">
                    <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 group-focus-within:translate-x-4 group-focus-within:translate-y-4 group-hover:translate-x-3 group-hover:translate-y-3 transition-transform"></div>
                    <div className="relative flex items-stretch bg-white border-4 border-black">
                        <div className="flex items-center pl-4 md:pl-6">
                            <Search className="w-6 h-6 md:w-8 md:h-8 text-black stroke-[4]" />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                            placeholder="SEARCH ROLL NO..."
                            className="w-full h-14 md:h-20 px-4 md:px-6 font-black text-xl md:text-3xl uppercase bg-transparent outline-none placeholder:text-gray-300 text-black leading-none"
                        />
                        <button className="hidden md:flex items-center px-8 bg-[#ffde00] border-l-4 border-black font-black text-xl hover:bg-[#ff69b4] transition-colors" onClick={() => {
                            // Focus logic or search trigger if needed
                        }}>
                            SEARCH
                        </button>
                    </div>
                </div>

                {showResults && (query.length >= 2) && (
                    <div className="absolute left-4 right-4 top-[calc(100%+24px)] bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[60vh] overflow-y-auto z-50">
                        {loading ? (
                            <div className="p-4 md:p-6 text-center font-black animate-pulse bg-[#ffde00] text-lg md:text-xl border-b-4 border-black">
                                SCANNING DATABASE...
                            </div>
                        ) : results.length > 0 ? (
                            results.map((student) => (
                                <div
                                    key={student.roll_no}
                                    onClick={() => handleSelect(student.roll_no)}
                                    className="p-4 md:p-6 border-b-4 border-black last:border-b-0 hover:bg-[#00ffff] cursor-pointer transition-colors flex justify-between items-center group relative overflow-hidden"
                                >
                                    {/* Hover Effect Background */}
                                    <div className="absolute inset-0 bg-[#ff69b4] translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300 z-0"></div>

                                    <div className="relative z-10 flex items-center gap-4 md:gap-6 overflow-hidden w-full">
                                        <div className="w-12 h-12 md:w-16 md:h-16 border-4 border-black bg-white flex-shrink-0 overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                            <img
                                                src={`/student_faces/${student.roll_no}.png`}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="font-black uppercase text-lg md:text-2xl leading-none truncate mb-1">{student.name}</div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs md:text-sm font-bold bg-black text-white px-2 py-0.5">{student.roll_no}</span>
                                                <span className="text-xs md:text-sm font-bold border-2 border-black px-2 py-0.5">{student.class}</span>
                                            </div>
                                        </div>
                                        <div className="font-black text-2xl md:text-4xl pl-4">{student.cgpa || '?'}</div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center font-black text-gray-500 text-lg md:text-xl uppercase">
                                NO FIGHTERS FOUND
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
