
import React from 'react';
import { Link } from 'react-router-dom';
import SearchInput4 from './SearchInput4';

export default function Hero4() {
    return (
        <header className="relative py-8 md:py-16 px-4 md:px-6 bg-white text-black flex flex-col items-center text-center border-b-4 border-black overflow-hidden w-full max-w-full justify-center min-h-[60svh] md:min-h-[70svh]">
            {/* Decorative elements - Adjusted for compact view */}
            <div className="absolute top-4 left-4 w-10 h-10 md:w-16 md:h-16 bg-[#ff69b4] rounded-full border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] animate-bounce delay-100 hidden lg:block"></div>
            <div className="absolute bottom-10 right-4 w-12 h-12 md:w-20 md:h-20 bg-[#00ffff] rotate-12 border-3 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hidden lg:block"></div>

            {/* Tagline - Funkier rotation */}
            <div className="bg-black text-white px-3 py-1 font-mono font-bold text-xs md:text-sm mb-4 rotate-[-3deg] max-w-[90vw] truncate shadow-[2px_2px_0px_0px_#ff69b4]">
                NOW WITH 100% MORE DATA
            </div>

            {/* Main Heading - Slightly smaller but punchy */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase leading-[0.85] tracking-tighter mb-6 w-full break-words hyphens-auto text-black relative z-10 flex flex-col items-center">
                <div className="flex items-center justify-center gap-2">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffde00] to-[#ff69b4] stroke-black text-stroke-2 md:text-stroke-2" style={{ WebkitTextStroke: '2px black' }}>SEM</span>
                    <span className="text-[#00ffff] inline-block transform skew-x-[-10deg] rotate-2" style={{ textShadow: '4px 4px 0px #000' }}>3</span>
                </div>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffde00] to-[#ff69b4] stroke-black text-stroke-2 md:text-stroke-2 block mt-1 rotate-[-1deg]" style={{ WebkitTextStroke: '2px black' }}>
                    UNLEASHED
                </span>
            </h1>

            {/* Scrolling Marquee - tighter spacing */}
            <div className="w-[110%] bg-[#ffde00] border-y-4 border-black py-2 mb-8 overflow-hidden rotate-2 transform scale-105 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative z-0 flex flex-nowrap rounded-sm">
                <div className="whitespace-nowrap animate-marquee font-mono font-black text-base md:text-lg uppercase px-4 min-w-full text-center shrink-0">
                    Compare student performance • Track attendance • Dominate the semester • No fluff, just stats •  Compare student performance • Track attendance • Dominate the semester • No fluff, just stats •
                </div>
                <div className="whitespace-nowrap animate-marquee font-mono font-black text-base md:text-lg uppercase px-4 min-w-full text-center shrink-0" aria-hidden="true">
                    Compare student performance • Track attendance • Dominate the semester • No fluff, just stats •  Compare student performance • Track attendance • Dominate the semester • No fluff, just stats •
                </div>
            </div>

            {/* Search Input - Tilted */}
            <div className="w-full max-w-md md:max-w-2xl px-2 md:px-0 mb-8 relative z-20 rotate-[-1deg]">
                <SearchInput4 />
            </div>

            {/* CTA Buttons - Offset rotations */}
            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md justify-center px-4 md:px-0 relative z-20">
                <Link to="/4/leaderboard" className="w-full sm:w-auto text-center bg-[#ff69b4] text-black border-4 border-black px-6 py-3 text-lg font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all active:shadow-none rotate-1">
                    Check Rank
                </Link>
                <Link to="/4/compare" className="w-full sm:w-auto text-center bg-white text-black border-4 border-black px-6 py-3 text-lg font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 transition-all active:shadow-none rotate-[-1deg] text-nowrap">
                    Fight Me
                </Link>
            </div>
        </header>
    );
}
