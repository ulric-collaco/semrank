
export default function Hero2() {
    return (
        <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-4 overflow-hidden bg-[#050505]">
            {/* Background Grid */}
            <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#0a0a0a_1px,transparent_1px),linear-gradient(to_bottom,#0a0a0a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>

            <div className="z-10 max-w-5xl mx-auto space-y-6">
                <div className="inline-block border border-green-500/30 bg-green-500/5 px-3 py-1 text-xs font-mono text-green-400 uppercase tracking-widest mb-4 animate-pulse">
                    System Online • awaiting input
                </div>
                <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-500 to-cyan-500 drop-shadow-[0_0_35px_rgba(34,197,94,0.4)] font-mono">
                    ACADEMIC<br />DOMINANCE
                </h1>
                <p className="text-lg md:text-2xl text-green-400/60 font-mono max-w-2xl mx-auto border-l-2 border-green-500/40 pl-6 text-left md:text-center md:border-l-0">
          > Analyzing student performance data...<br />
          > Calculating global rankings...<br />
          > Optimize your academic trajectory.
                </p>

                <div className="flex flex-col md:flex-row gap-6 justify-center pt-8">
                    <button className="relative group overflow-hidden bg-green-500 text-black font-mono font-bold uppercase tracking-wider py-4 px-10 text-sm hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] transition-all duration-300">
                        <span className="relative z-10">Access Data Stream</span>
                        <div className="absolute inset-0 h-full w-full bg-white/30 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                    </button>
                    <button className="border border-green-500/30 text-green-400 font-mono font-bold uppercase tracking-wider py-4 px-10 text-sm hover:bg-green-500/10 hover:border-green-500 transition-all duration-300">
                        Run Diagnostics
                    </button>
                </div>
            </div>

            {/* Decorative scanline */}
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.8)] animate-[scanline_3s_linear_infinite] opacity-50 pointer-events-none"></div>
        </section>
    );
}
