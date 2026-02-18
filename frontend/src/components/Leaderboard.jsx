import { useState, lazy, Suspense } from 'react';
import { Link } from 'react-router-dom';
import Crown from 'lucide-react/dist/esm/icons/crown';
import { formatClassName } from '../utils/format';
import OptimizedImage from './common/OptimizedImage';

const StudentModal = lazy(() => import('./StudentModal'));

export default function Leaderboard({ data, sortBy = 'sgpa', setSortBy }) {
    const [selectedStudentRoll, setSelectedStudentRoll] = useState(null);

    if (!data || data.length === 0) return null;

    const getRankStyle = (index) => {
        if (index === 0) return 'bg-[#ffde00] text-black border-4 border-black w-14 h-14 md:w-20 md:h-20 text-2xl md:text-4xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10 rotate-[-10deg]';
        if (index === 1) return 'bg-gray-300 text-black border-4 border-black w-12 h-12 md:w-16 md:h-16 text-xl md:text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10 rotate-[5deg]';
        if (index === 2) return 'bg-orange-400 text-black border-4 border-black w-12 h-12 md:w-16 md:h-16 text-xl md:text-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] z-10 rotate-[-5deg]';
        return 'bg-black text-white w-8 h-8 md:w-10 md:h-10 text-sm md:text-base font-bold shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]';
    };

    return (
        <section className="bg-[#f0f0f0] py-24 px-6 border-b-4 border-black">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col items-center mb-12 relative z-10">
                    <Link to="/leaderboard" className="inline-block group relative">
                        <div className="absolute inset-0 bg-black translate-x-3 translate-y-3 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform"></div>
                        <div className="relative bg-[#ff69b4] border-4 border-black px-6 py-5 md:px-16 md:py-8 flex items-center justify-center gap-4 hover:-translate-y-1 transition-transform cursor-pointer">
                            <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-7xl font-black uppercase text-center m-0 leading-none text-black whitespace-normal md:whitespace-nowrap break-words">
                                The Leaderboard
                            </h2>
                            {/* Sticker Badge */}
                            <span className="absolute -top-4 -right-2 md:-top-5 md:-right-6 bg-black text-[#ffde00] text-xs md:text-lg px-3 py-1 md:px-5 md:py-2 font-mono font-bold transform rotate-12 border-2 border-white shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] z-20">
                                VIEW ALL
                            </span>
                        </div>
                    </Link>

                    {/* Tiny Flick Toggle - Bigger & Spaced */}
                    <div className="flex border-3 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-white text-sm md:text-base font-black mt-10 md:mt-12 cursor-pointer transform rotate-[-2deg] hover:rotate-0 transition-transform">
                        <button
                            onClick={() => setSortBy && setSortBy('sgpa')}
                            className={`px-8 py-3 transition-colors ${sortBy === 'sgpa' ? 'bg-black text-[#ff69b4]' : 'bg-white text-gray-400 hover:text-black'}`}
                        >
                            SGPA
                        </button>
                        <div className="w-1 bg-black"></div>
                        <button
                            onClick={() => setSortBy && setSortBy('attendance')}
                            className={`px-8 py-3 transition-colors ${sortBy === 'attendance' ? 'bg-black text-[#00ffff]' : 'bg-white text-gray-400 hover:text-black'}`}
                        >
                            ATTENDANCE
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8 pt-6">
                    {data.slice(0, 6).map((student, index) => (
                        <div
                            key={student.student_id}
                            onClick={() => setSelectedStudentRoll(student.roll_no)}
                            className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col items-center text-center relative cursor-pointer group mt-4"
                        >
                            <div className={`absolute -top-8 -left-2 md:-left-8 flex items-center justify-center font-black rounded-full transition-transform group-hover:scale-110 ${getRankStyle(index)}`}>
                                {index === 0 ? <Crown size={36} strokeWidth={2.5} /> : (index + 1)}
                            </div>

                            <div className="w-24 h-24 bg-[#ffde00] border-4 border-black rounded-full mb-4 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:scale-110 transition-transform duration-300">
                                <OptimizedImage
                                    src={`/student_faces/${student.roll_no}.png`}
                                    alt={student.name}
                                    className="w-full h-full object-cover"
                                    width={96}
                                    height={96}
                                />
                            </div>

                            <h3 className="text-2xl font-black uppercase leading-tight mb-2 text-black">{student.name}</h3>
                            <div className="bg-black text-white px-3 py-1 font-mono text-sm font-bold mb-4 rotate-[-2deg]">
                                {formatClassName(student.class)}
                            </div>

                            <div className="w-full border-t-4 border-black pt-4 mt-auto">
                                <div className="flex justify-between items-center px-4">
                                    <span className="font-bold text-gray-500 uppercase">{sortBy === 'attendance' ? 'Attendance' : 'SGPA'}</span>
                                    <span className="text-4xl font-black">
                                        {sortBy === 'attendance'
                                            ? `${parseFloat(student.attendance || 0).toFixed(1)}%`
                                            : student.cgpa || student.sgpa
                                        }
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedStudentRoll && (
                <Suspense fallback={null}>
                    <StudentModal
                        rollNo={selectedStudentRoll}
                        onClose={() => setSelectedStudentRoll(null)}
                    />
                </Suspense>
            )}
        </section>
    );
}
