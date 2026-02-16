
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function Navbar4() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <nav className="border-b-4 border-black bg-[#ffde00] text-black py-3 md:py-4 px-4 md:px-6 flex justify-between items-center font-mono sticky top-0 z-[100] w-full max-w-full">
            <Link to="/" className="text-xl md:text-2xl font-black uppercase tracking-tighter hover:skew-x-6 transition-transform cursor-pointer relative z-[101]">
                SemRank®
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex gap-8 font-bold text-sm">
                <Link to="/leaderboard" className="hover:underline decoration-4 decoration-black underline-offset-4 uppercase">Leaderboard</Link>
                <Link to="/compare" className="hover:underline decoration-4 decoration-black underline-offset-4 uppercase">Compare</Link>
                <Link to="/game" className="hover:underline decoration-4 decoration-black underline-offset-4 uppercase">Game</Link>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:block">
                <Link to="/game" className="bg-white border-2 border-black px-6 py-2 font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-2">
                    <span>PLAY</span>
                    <span className="bg-black text-white px-1 text-xs">NEW</span>
                </Link>
            </div>


            {/* Mobile Controls */}
            <div className="flex items-center gap-2 md:hidden z-[101]">
                {/* Mobile Game Button */}
                <Link to="/game" className="bg-white border-2 border-black px-3 py-1.5 font-bold text-xs shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all flex items-center gap-1 hover:bg-[#ffde00] hover:text-black hover:border-black">
                    <span>PLAY</span>
                </Link>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={toggleMenu}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center border-2 border-black bg-white active:translate-y-1 transition-transform hover:bg-black hover:text-white"
                    aria-label="Toggle Menu"
                >
                    {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Overlay */}
            {isMenuOpen && (
                <div className="fixed inset-0 bg-[#ffde00] z-[100] flex flex-col justify-center items-center gap-6 md:hidden animate-in fade-in zoom-in-95 duration-200 p-6 overflow-y-auto">
                    <Link
                        to="/leaderboard"
                        onClick={closeMenu}
                        className="w-full py-4 text-3xl font-black uppercase hover:underline decoration-4 decoration-black underline-offset-8 text-center active:bg-black/5"
                    >
                        Leaderboard
                    </Link>
                    <Link
                        to="/compare"
                        onClick={closeMenu}
                        className="w-full py-4 text-3xl font-black uppercase hover:underline decoration-4 decoration-black underline-offset-8 text-center active:bg-black/5"
                    >
                        Compare
                    </Link>
                    <Link
                        to="/game"
                        onClick={closeMenu}
                        className="w-full py-4 text-3xl font-black uppercase hover:underline decoration-4 decoration-black underline-offset-8 text-center active:bg-black/5"
                    >
                        Game
                    </Link>

                    <Link
                        to="/game"
                        onClick={closeMenu}
                        className="w-full max-w-xs justify-center bg-white border-4 border-black px-8 py-5 font-black text-xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-2 active:translate-y-2 active:shadow-none transition-all mt-8 flex items-center gap-3"
                    >
                        <span>PLAY GAME</span>
                        <span className="bg-black text-white px-2 py-0.5 text-sm">NEW</span>
                    </Link>
                </div>
            )}
        </nav>
    );
}
