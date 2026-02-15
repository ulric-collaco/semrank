
import { Link } from 'react-router-dom';

export default function Footer4() {
    return (
        <footer className="bg-black text-white p-12 border-t-4 border-white font-mono">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-12">
                <div className="flex-1">
                    <h2 className="text-6xl font-black uppercase mb-6 text-[#ffde00]">SemRank</h2>
                </div>

                <div className="grid grid-cols-2 gap-12 font-bold text-lg">
                    <div className="flex flex-col gap-4">
                        <Link to="/" className="hover:text-[#00ffff] hover:translate-x-2 transition-transform">{`->`} HOME</Link>
                        <a href="#" className="hover:text-[#00ffff] hover:translate-x-2 transition-transform">{`->`} ABOUT</a>
                        <a href="#" className="hover:text-[#00ffff] hover:translate-x-2 transition-transform">{`->`} LEGAL</a>
                    </div>
                    <div className="flex flex-col gap-4">
                        <a href="https://ulriccollaco.me" className="hover:text-[#ffde00] hover:translate-x-2 transition-transform">{`->`} CREATOR</a>
                        <a href="#" className="hover:text-[#ffde00] hover:translate-x-2 transition-transform">{`->`} GITHUB</a>
                        <a href="#" className="hover:text-[#ffde00] hover:translate-x-2 transition-transform">{`->`} TWITTER</a>
                    </div>
                </div>
            </div>
            <div className="mt-12 pt-12 border-t-4 border-[#333] text-center text-[#666] uppercase text-sm font-bold">
                (C) 2026 SEMRANK. NO RIGHTS RESERVED. JUST KIDDING.
            </div>
        </footer>
    );
}
