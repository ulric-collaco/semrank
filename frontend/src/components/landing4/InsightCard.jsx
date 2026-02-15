import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function InsightCard({ title, subtitle, type, data, accentColor = '#ffde00', icon: Icon }) {
    // Brutalist Card Container
    return (
        <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all relative group overflow-hidden h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-start mb-6 z-10 relative">
                <div>
                    <h3 className="text-2xl font-black uppercase leading-none mb-1">{title}</h3>
                    <p className="font-mono text-sm font-bold text-gray-500 uppercase">{subtitle}</p>
                </div>
                {Icon && <Icon className="w-8 h-8 text-black stroke-[2.5]" />}
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col justify-center z-10 relative min-h-[160px]">
                {type === 'rivalry' && <RivalryContent data={data} />}
                {type === 'chart' && <ChartContent data={data} color={accentColor} />}
                {type === 'stat' && <StatContent data={data} color={accentColor} />}
                {type === 'list' && <ListContent data={data} />}
            </div>

            {/* Decorative Background Element */}
            <div className={`absolute -bottom-12 -right-12 w-32 h-32 rounded-full opacity-20 z-0`} style={{ backgroundColor: accentColor }}></div>
        </div>
    );
}

// Sub-components for specific insight types

function RivalryContent({ data }) {
    if (!data || data.length < 2) return <div className="text-center font-bold text-gray-400">NO DATA</div>;
    const [p1, p2] = data;

    return (
        <div className="flex items-center justify-between px-2">
            {/* Player 1 */}
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 border-3 border-black rounded-full overflow-hidden bg-gray-200 mb-2 relative">
                    <img src={`/student_faces/${p1.roll_no}.png`} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} alt={p1.name} />
                </div>
                <div className="text-xs font-bold uppercase max-w-[80px] text-center leading-tight">{p1.name.split(' ')[0]}</div>
                <div className="font-black text-xl">{p1.cgpa}</div>
            </div>

            {/* VS Badge */}
            <div className="relative">
                <div className="absolute inset-0 bg-black translate-x-1 translate-y-1"></div>
                <div className="relative bg-[#ff0000] text-white font-black text-xl px-2 py-1 border-2 border-black rotate-12 z-10">VS</div>
            </div>

            {/* Player 2 */}
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-20 md:h-20 border-3 border-black rounded-full overflow-hidden bg-gray-200 mb-2 relative">
                    <img src={`/student_faces/${p2.roll_no}.png`} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} alt={p2.name} />
                </div>
                <div className="text-xs font-bold uppercase max-w-[80px] text-center leading-tight">{p2.name.split(' ')[0]}</div>
                <div className="font-black text-xl">{p2.cgpa}</div>
            </div>
        </div>
    );
}

function ChartContent({ data, color }) {
    if (!data) return null;
    return (
        <div className="w-full h-40">
            <ResponsiveContainer width="100%" height="100%">
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

function ListContent({ data }) {
    if (!data) return <div className="text-center font-bold text-gray-300 animate-pulse">LOADING...</div>;
    return (
        <div className="space-y-3">
            {data.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between items-center border-b-2 border-black/10 pb-2 last:border-0">
                    <span className="font-bold uppercase text-sm">{item.label}</span>
                    <span className="font-mono font-black">{item.value}</span>
                </div>
            ))}
        </div>
    );
}
