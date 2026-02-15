
import React from 'react';
import { Link } from 'react-router-dom';
import SearchInput4 from './SearchInput4';

export default function Hero4() {
    return (
        <header className="relative py-12 md:py-24 px-4 md:px-6 bg-white text-black flex flex-col items-center text-center border-b-4 border-black overflow-hidden w-full max-w-full">
            {/* Decorative elements - Hidden on mobile/small screens to prevent overflow/distraction */}
            <div className="absolute top-10 left-10 w-12 h-12 md:w-16 md:h-16 bg-[#ff69b4] rounded-full border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] animate-bounce delay-100 hidden lg:block"></div>
            <div className="absolute bottom-10 right-10 w-16 h-16 md:w-24 md:h-24 bg-[#00ffff] rotate-12 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hidden lg:block"></div>

            {/* Tagline */}
            <div className="bg-black text-white px-3 py-1 font-mono font-bold text-xs md:text-sm mb-6 md:mb-8 rotate-[-2deg] max-w-[90vw] truncate">
                NOW WITH 100% MORE DATA
            </div>

            {/* Main Heading - Responsive Typography */}
            <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black uppercase leading-[0.9] tracking-tighter mb-8 md:mb-12 w-full break-words hyphens-auto">
                SEM <span className="text-[#00ffff] inline-block transform skew-x-[-10deg]" style={{ textShadow: '4px 4px 0px #000' }}>3</span><br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffde00] to-[#ff69b4] stroke-black text-stroke-1 md:text-stroke-2 lg:text-stroke-3 block mt-2" style={{ WebkitTextStroke: '1px black' }}>
                    UNLEASHED
                </span>
            </h1>

            {/* Scrolling Marquee Section */}
            <div className="w-full bg-[#ffde00] border-y-4 border-black py-3 mb-12 overflow-hidden rotate-1 transform scale-105 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <div className="whitespace-nowrap animate-marquee inline-block font-mono font-black text-lg md:text-xl uppercase">
                    Compare student performance • Track attendance • Dominate the semester • No fluff, just stats •  Compare student performance • Track attendance • Dominate the semester • No fluff, just stats •
                </div>
            </div>

            {/* Search Input Container */}
            <div className="w-full max-w-md md:max-w-2xl px-2 md:px-0 mb-8 md:mb-12 relative z-20">
                <SearchInput4 />
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 w-full max-w-md justify-center px-4 md:px-0">
                <Link to="/4/leaderboard" className="w-full sm:w-auto text-center bg-[#ff69b4] text-black border-4 border-black px-6 md:px-8 py-3 md:py-4 text-lg md:text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 md:hover:translate-x-1 md:hover:translate-y-1 transition-all active:shadow-none active:translate-x-1 active:translate-y-1">
                    Check My Rank
                </Link>
                <Link to="/4/compare" className="w-full sm:w-auto text-center bg-white text-black border-4 border-black px-6 md:px-8 py-3 md:py-4 text-lg md:text-xl font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] md:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] md:hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-0.5 hover:translate-y-0.5 md:hover:translate-x-1 md:hover:translate-y-1 transition-all active:shadow-none active:translate-x-1 active:translate-y-1">
                    Fight Me
                </Link>
            </div>
        </header>
    );
}
