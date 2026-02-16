import { Link } from 'react-router-dom';
import { Github, ExternalLink, Star } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-black text-white p-8 md:p-12 border-t-4 border-white font-mono">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-8">

                {/* Brand */}
                <div>
                    <h2 className="text-4xl md:text-6xl font-black uppercase mb-2 text-[#ffde00] leading-none">
                        SemRank
                    </h2>
                    <a
                        href="https://ulriccollaco.me"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-3 mt-4 px-6 py-3 border-4 border-[#333] hover:border-[#00ffff] bg-black hover:bg-[#0a0a0a] transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[8px_8px_0_0_#00ffff]"
                    >
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] leading-none mb-1 group-hover:text-[#00ffff] transition-colors">Created By</span>
                            <span className="text-xl font-black text-white uppercase leading-none tracking-wide group-hover:text-white transition-colors">Ulric Collaco</span>
                        </div>
                        <ExternalLink size={24} className="text-[#333] group-hover:text-[#00ffff] group-hover:rotate-45 transition-all duration-300 ml-1" />
                    </a>
                </div>

                {/* Credits & Links */}
                <div className="flex flex-col gap-4 items-start md:items-end">

                    {/* Inspiration Credit */}
                    <div className="text-right flex flex-col items-start md:items-end gap-1">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-none">Inspiration</span>
                        <a
                            href="https://whereyoustand.vercel.app"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-black text-2xl uppercase hover:text-[#00ffff] transition-colors leading-none"
                        >
                            WhereYouStand
                        </a>
                        <a
                            href="https://www.romeirofernandes.tech"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-bold text-gray-400 uppercase tracking-wide hover:text-[#ffde00] transition-colors"
                        >
                            by Romeiro Fernandes
                        </a>
                    </div>

                    {/* Repo Star Button */}
                    <a
                        href="https://github.com/romeirofernandes/whereyoustand"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-white text-black border-2 border-transparent hover:border-[#ffde00] px-4 py-2 flex items-center gap-3 font-black uppercase tracking-wider hover:-translate-y-1 hover:shadow-[4px_4px_0_0_#ffde00] transition-all"
                    >
                        <Github size={20} />
                        <span>Star 'WhereYouStand'</span>
                        <Star size={16} className="fill-black group-hover:fill-[#ffde00] transition-colors" />
                    </a>

                </div>
            </div>

            {/* Copyright */}
            <div className="mt-12 pt-8 border-t-2 border-[#333] flex flex-col md:flex-row justify-between items-center gap-4 text-[#666] text-xs font-bold uppercase">
                <span>(C) 2026 SEMRANK.</span>
                <span className="opacity-50">Because numbers don't lie, but students do.</span>
            </div>
        </footer>
    );
}
