import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function InsightCard({ title, subtitle, type, data, accentColor = '#ffde00', icon: Icon, onStudentClick }) {
    // Brutalist Card Container
    return (
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all relative group overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start mb-4 z-10 relative">
                <div>
                    <h3 className="text-2xl font-black uppercase leading-none mb-1">{title}</h3>
                    <p className="font-mono text-sm font-bold text-gray-500 uppercase">{subtitle}</p>
                </div>
                {Icon && <Icon className="w-8 h-8 text-black stroke-[2.5]" />}
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col justify-center z-10 relative min-h-[160px]">
                {type === 'rivalry' && <RivalryContent data={data} onClick={onStudentClick} />}
                {type === 'chart' && <ChartContent data={data} color={accentColor} />}
                {type === 'stat' && <StatContent data={data} color={accentColor} />}
                {type === 'list' && <ListContent data={data} onClick={onStudentClick} />}
            </div>

            {/* Decorative Background Element */}
            <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full opacity-20 z-0`} style={{ backgroundColor: accentColor }}></div>
        </div>
    );
}

// Sub-components for specific insight types

function RivalryContent({ data, onClick }) {
    if (!data || data.length < 2) return <div className="text-center font-bold text-gray-400">NO DATA</div>;
    const [p1, p2] = data;

    return (
        <div className="flex items-center justify-between px-1 w-full relative h-full">
            {/* Player 1 */}
            <div
                className="flex flex-col items-center w-[40%] cursor-pointer group/p1 transition-transform hover:scale-105"
                onClick={() => onClick && onClick(p1.roll_no)}
            >
                <div className="w-16 h-16 md:w-20 md:h-20 border-3 border-black rounded-full overflow-hidden bg-gray-200 mb-2 relative shadow-sm group-hover/p1:shadow-md transition-all">
                    <img src={`/student_faces/${p1.roll_no}.png`} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} alt={p1.name} />
                </div>
                <div className="h-10 w-full flex items-center justify-center mb-1">
                    <span className="font-bold text-[10px] md:text-sm uppercase text-center leading-tight line-clamp-2 w-full">{p1.name}</span>
                </div>
                <div className="text-[10px] font-black bg-black text-white px-1.5 py-0.5">{p1.class || 'N/A'}</div>
                <div className="font-black text-lg md:text-xl mt-1">{p1.cgpa}</div>
            </div>

            {/* VS Badge */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[80%] z-10 pointer-events-none">
                <div className="relative transform rotate-12 hover:rotate-0 transition-transform duration-300">
                    <div className="absolute inset-0 bg-black translate-x-0.5 translate-y-0.5"></div>
                    <div className="relative bg-[#ff0000] text-white font-black text-xl px-2 py-0.5 border-2 border-black">VS</div>
                </div>
            </div>

            {/* Player 2 */}
            <div
                className="flex flex-col items-center w-[40%] cursor-pointer group/p2 transition-transform hover:scale-105"
                onClick={() => onClick && onClick(p2.roll_no)}
            >
                <div className="w-16 h-16 md:w-20 md:h-20 border-3 border-black rounded-full overflow-hidden bg-gray-200 mb-2 relative shadow-sm group-hover/p2:shadow-md transition-all">
                    <img src={`/student_faces/${p2.roll_no}.png`} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} alt={p2.name} />
                </div>
                <div className="h-10 w-full flex items-center justify-center mb-1">
                    <span className="font-bold text-[10px] md:text-sm uppercase text-center leading-tight line-clamp-2 w-full">{p2.name}</span>
                </div>
                <div className="text-[10px] font-black bg-black text-white px-1.5 py-0.5">{p2.class || 'N/A'}</div>
                <div className="font-black text-lg md:text-xl mt-1">{p2.cgpa}</div>
            </div>
        </div>
    );
}

function ChartContent({ data, color }) {
    if (!data) return null;
    return (
        <div className="w-full h-40 relative group/chart cursor-pointer active:scale-[0.98] transition-transform">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={data}>
                    <XAxis dataKey="name" hide />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ border: '3px solid black', borderRadius: '0', boxShadow: '4px 4px 0 0 #000', fontWeight: 'bold' }}
                    />
                    <Bar dataKey="value" fill={color} stroke="#000" strokeWidth={2} radius={[4, 4, 0, 0]}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#000' : color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Interactive Hint Overlay */}
            <div className="absolute top-2 right-2 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none md:opacity-0">
                View Details
            </div>

            {/* Mobile Tap Hint (Always visible on mobile, or maybe just subtle) */}
            <div className="absolute bottom-2 right-2 md:hidden">
                <div className="bg-black text-white text-[9px] font-black px-1.5 py-0.5 uppercase shadow-sm animate-pulse">
                    TAP
                </div>
            </div>
        </div>
    );
}

function StatContent({ data }) {
    if (!data) return <div className="text-center font-bold text-gray-300 animate-pulse">LOADING...</div>;
    return (
        <div className="text-center">
            <div className="text-5xl md:text-6xl font-black mb-2" style={{ WebkitTextStroke: '2px black', color: 'transparent', backgroundImage: 'linear-gradient(45deg, #000, #333)', WebkitBackgroundClip: 'text' }}>
                {data.value}
            </div>
            <div className="text-lg font-bold bg-black text-white inline-block px-3 py-1 transform -rotate-2">
                {data.label}
            </div>
            {data.subtext && <div className="text-xs font-mono mt-3 text-gray-500 font-bold">{data.subtext}</div>}
        </div>
    );
}

function ListContent({ data, onClick }) {
    if (!data) return <div className="text-center font-bold text-gray-300 animate-pulse">LOADING...</div>;

    // Single Profile Mode (Refined for "Birthday" single card)
    if (data.length === 1) {
        return <SingleProfileContent item={data[0]} onClick={onClick} />;
    }

    return (
        <div className="space-y-3 w-full">
            {data.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 border-b-2 border-black/10 pb-3 last:border-0 last:pb-0">
                    {/* Avatar with Fallback */}
                    {item.image && (
                        <div className="w-12 h-12 border-2 border-black rounded-full overflow-hidden bg-yellow-300 flex-shrink-0 flex items-center justify-center relative shadow-sm">
                            <span className="font-black text-lg">{item.label.charAt(0)}</span>
                            <img
                                src={item.image}
                                className="absolute inset-0 w-full h-full object-cover"
                                onError={(e) => e.target.style.display = 'none'}
                                alt=""
                            />
                        </div>
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="font-bold uppercase text-sm md:text-base truncate">{item.label}</div>
                        {item.subtext && (
                            <div className="flex items-center mt-0.5">
                                <span className="text-[10px] md:text-xs font-black bg-black text-white px-1.5 py-0.5 rounded-sm">
                                    {item.subtext}
                                </span>
                            </div>
                        )}
                    </div>

                    <span className="font-mono font-black text-xl">{item.value}</span>
                </div>
            ))}
            {data.length === 0 && <div className="text-center text-gray-400 font-bold text-sm py-4">NO BIRTHDAYS TODAY</div>}
        </div>
    );
}

function SingleProfileContent({ item, onClick }) {
    return (
        <div
            className="flex flex-col items-center justify-center h-full w-full cursor-pointer group hover:scale-[1.02] transition-transform"
            onClick={() => onClick && item.id && onClick(item.id)}
        >
            <div className="relative mb-4">
                <div className="w-24 h-24 md:w-28 md:h-28 border-4 border-black rounded-full overflow-hidden bg-yellow-300 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative z-10">
                    <span className="font-black text-4xl">{item.label.charAt(0)}</span>
                    {/* Fallback Initials above, Image Overlay below */}
                    {item.image && (
                        <img
                            src={item.image}
                            className="absolute inset-0 w-full h-full object-cover"
                            onError={(e) => e.target.style.display = 'none'}
                            alt={item.label}
                        />
                    )}
                </div>
                {/* Decorative Icon (e.g. Cake) absolute */}
                <div className="absolute -bottom-2 -right-2 text-3xl z-20 transform rotate-12 group-hover:rotate-0 transition-transform">
                    {item.value}
                </div>
            </div>

            <h4 className="font-black text-xl md:text-2xl uppercase text-center leading-tight mb-2 px-2 line-clamp-2">
                {item.label}
            </h4>

            {item.subtext && (
                <div className="bg-black text-white font-mono font-bold text-sm px-3 py-1 transform -rotate-2 group-hover:rotate-0 transition-transform">
                    {item.subtext}
                </div>
            )}
        </div>
    );
}
