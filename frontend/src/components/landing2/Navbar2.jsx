
export default function Navbar2() {
    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-green-500/20 py-4 px-6 md:px-12 flex justify-between items-center font-mono text-green-400">
            <div className="text-xl font-bold tracking-widest uppercase glitched" data-text="SEMRANK">SEMRANK_V2.0</div>
            <div className="hidden md:flex gap-8 text-sm uppercase tracking-widest text-green-400/60">
                <a href="#features" className="hover:text-green-400 hover:shadow-[0_0_10px_rgba(74,222,128,0.5)] transition-all">_Features</a>
                <a href="#leaderboard" className="hover:text-green-400 hover:shadow-[0_0_10px_rgba(74,222,128,0.5)] transition-all">_Rankings</a>
                <a href="#about" className="hover:text-green-400 hover:shadow-[0_0_10px_rgba(74,222,128,0.5)] transition-all">_Protocol</a>
            </div>
            <div>
                <button className="bg-green-500/10 border border-green-500 text-green-400 px-6 py-2 text-xs uppercase tracking-widest hover:bg-green-500 hover:text-black transition-all shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                    Init_Sequence
                </button>
            </div>
        </nav>
    );
}
