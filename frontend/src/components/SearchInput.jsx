import { useState, useEffect, useRef } from 'react';
import { studentAPI } from '../utils/api';
import './SearchInput.css';

export default function SearchInput({ onSelectStudent }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        // Debounce search
        const timeoutId = setTimeout(async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const data = await studentAPI.searchStudents(query);
                // The API might return { students: [...] } or just [...]
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

    // Click outside to close
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [containerRef]);

    const handleSelect = (rollNo) => {
        if (onSelectStudent) {
            onSelectStudent(rollNo);
        }
        setShowResults(false);
        setQuery('');
    };

    const labelText = "SEARCH BY NAME OR ROLL NO";

    return (
        <div ref={containerRef} className="search-input__wrapper z-20">
            <input
                type="text"
                value={query}
                required
                onChange={(e) => {
                    setQuery(e.target.value);
                    setShowResults(true);
                }}
                onFocus={() => setShowResults(true)}
            />
            <label>
                {labelText.split("").map((char, index) => (
                    <span
                        key={index}
                        style={{ transitionDelay: `${index * 30}ms` }}
                    >
                        {char === " " ? "\u00A0" : char}
                    </span>
                ))}
            </label>


            {/* Results Dropdown */}
            {showResults && (query.length >= 2) && (
                <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-bubbleSecondary border-2 border-accent shadow-[0_4px_12px_rgba(245,130,174,0.3)] z-50 max-h-[300px] overflow-y-auto rounded-xl">
                    {loading ? (
                        <div className="p-4 text-center font-bold text-accent">SEARCHING...</div>
                    ) : results.length > 0 ? (
                        results.map((student) => (
                            <div
                                key={student.roll_no}
                                className="p-3 border-b border-accent/20 last:border-b-0 hover:bg-accent/10 cursor-pointer transition-colors flex justify-between items-center group"
                                onClick={() => handleSelect(student.roll_no)}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-bubble overflow-hidden border border-accent/50 flex-shrink-0">
                                        <img
                                            src={`/student_faces/${student.roll_no}.png`}
                                            alt={student.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-bold text-ink uppercase truncate font-display">{student.name}</div>
                                        <div className="text-xs text-body font-mono">{student.roll_no}</div>
                                    </div>
                                </div>
                                <div className="text-sm font-bold bg-accent text-bubbleSecondary px-2 py-0.5 rounded-sm flex-shrink-0 ml-2">
                                    {student.cgpa || '?'}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center font-bold text-body">NO STUDENTS FOUND</div>
                    )}
                </div>
            )}
        </div>
    );
}
