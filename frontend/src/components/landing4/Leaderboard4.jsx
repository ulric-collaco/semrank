import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Crown } from 'lucide-react';
import { formatClassName } from '../../utils/format';
import StudentModal4 from './StudentModal4';

export default function Leaderboard4({ data }) {
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
                <div className="text-center mb-20">
                    <Link to="/4/leaderboard" className="inline-block group relative">
                        <div className="absolute inset-0 bg-black translate-x-3 translate-y-3 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform"></div>
                        <div className="relative bg-[#ff69b4] border-4 border-black px-8 py-4 md:px-12 md:py-6 flex items-center justify-center gap-4 hover:-translate-y-1 transition-transform cursor-pointer">
                            <h2 className="text-4xl md:text-6xl font-black uppercase text-center m-0 leading-none">
                                The Leaderboard
                            </h2>
                            <span className="hidden md:block bg-black text-[#ffde00] text-xl px-4 py-2 font-mono font-bold transform rotate-6 group-hover:rotate-12 transition-transform border-2 border-white">
                                VIEW ALL
                            </span>
                        </div>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-8 pt-6">
                    {data.slice(0, 6).map((student, index) => (
                        <div
                            key={student.student_id}
                            onClick={() => setSelectedStudentRoll(student.roll_no)}
                            className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col items-center text-center relative cursor-pointer group mt-4"
                        >
                            <div className={`absolute -top-8 -left-6 md:-left-8 flex items-center justify-center font-black rounded-full transition-transform group-hover:scale-110 ${getRankStyle(index)}`}>
                                {index === 0 ? <Crown size={36} strokeWidth={2.5} /> : (index + 1)}
                            </div>

                            <div className="w-24 h-24 bg-[#ffde00] border-4 border-black rounded-full mb-4 overflow-hidden shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group-hover:scale-110 transition-transform duration-300">
                                <img
                                    src={`/student_faces/${student.roll_no}.png`}
                                    alt={student.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { e.target.style.display = 'none'; }}
                                />
                            </div>

                            <h3 className="text-2xl font-black uppercase leading-tight mb-2">{student.name}</h3>
                            <div className="bg-black text-white px-3 py-1 font-mono text-sm font-bold mb-4 rotate-[-2deg]">
                                {formatClassName(student.class)}
                            </div>

                            <div className="w-full border-t-4 border-black pt-4 mt-auto">
                                <div className="flex justify-between items-center px-4">
                                    <span className="font-bold text-gray-500 uppercase">Score</span>
                                    <span className="text-4xl font-black">{student.cgpa}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selectedStudentRoll && (
                <StudentModal4
                    rollNo={selectedStudentRoll}
                    onClose={() => setSelectedStudentRoll(null)}
                />
            )}
        </section>
    );
}
