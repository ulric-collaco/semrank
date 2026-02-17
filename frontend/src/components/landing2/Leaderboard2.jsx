
import OptimizedImage from '../common/OptimizedImage';
import { formatClassName } from '../../utils/format';

export default function Leaderboard2({ data }) {
    if (!data || data.length === 0) return null;

    return (
        <section className="py-24 px-4 bg-[#080808] border-t border-green-900/30 relative font-mono">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-12">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-ping"></div>
                    <h2 className="text-3xl text-green-400 font-bold uppercase tracking-widest">Global_Rankings_Database</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {data.slice(0, 6).map((student, index) => (
                        <div
                            key={student.student_id}
                            className="group relative bg-black/50 border border-green-500/20 p-6 transition-all hover:border-green-400 hover:shadow-[0_0_20px_rgba(34,197,94,0.2)] overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 bg-green-500/10 text-green-400 text-xs px-2 py-1 border-bl border-green-500/20 font-mono">
                                RANK_0{index + 1}
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 bg-green-900/20 border border-green-500/30 relative overflow-hidden group-hover:border-green-400/60 transition-colors">
                                    <OptimizedImage
                                        src={`/student_faces/${student.roll_no}.png`}
                                        alt={student.name}
                                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all duration-500"
                                        onError={(e) => {
                                            // Handled by OptimizedImage fallback
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-scanlines opacity-20 pointer-events-none"></div>
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="text-green-100 font-bold truncate text-lg uppercase tracking-tight mb-1 group-hover:text-white transition-colors">
                                        {student.name}
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2 text-[10px] text-green-500/60 uppercase">
                                        <div>
                                            <span className="block opacity-50">Class_ID</span>
                                            <span className="text-green-400">{formatClassName(student.class)}</span>
                                        </div>
                                        <div>
                                            <span className="block opacity-50">Roll_No</span>
                                            <span className="text-green-400">{student.roll_no}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-green-500/10 flex justify-between items-end">
                                <div className="text-xs text-green-600 font-mono">SUCCESS_RATE</div>
                                <div className="text-3xl font-black text-green-400 leading-none drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">
                                    {student.cgpa}
                                </div>
                            </div>

                            {/* Corner accents */}
                            <div className="absolute bottom-0 left-0 w-2 h-2 border-l border-b border-green-500/50"></div>
                            <div className="absolute top-0 left-0 w-2 h-2 border-l border-t border-green-500/50"></div>
                            <div className="absolute bottom-0 right-0 w-2 h-2 border-r border-b border-green-500/50"></div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
