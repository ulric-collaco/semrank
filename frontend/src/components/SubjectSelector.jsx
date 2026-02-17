import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

export default function SubjectSelector({ subjects, selectedValue, onChange, placeholder = "SELECT SUBJECT" }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isMobile, setIsMobile] = useState(false);

    // Safety check for subject lookup
    const selectedSubject = subjects.find(s => s.subject_code === selectedValue);
    // Display value fallback
    const displayValue = selectedSubject ? selectedSubject.subject_name : placeholder;

    // Filter logic
    const filteredSubjects = subjects.filter(s =>
        s.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.subject_code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Refs for click outside
    const containerRef = useRef(null);
    const searchInputRef = useRef(null);

    // Detect mobile for responsive behavior
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Handle outside clicks
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                // If it's a portal (mobile or desktop dropdown), we might need more complex logic, 
                // but for now, if we click outside the trigger on desktop, we close.
                // However, since we plan to portal the content, checking containerRef (the trigger) is not enough.
                // We'll handle 'close on overlay click' separately in the portal.
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            // Focus search input after opening
            setTimeout(() => searchInputRef.current.focus(), 100);
        }
        if (isOpen) {
            // Prevent body scroll when open on mobile
            if (isMobile) document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }, [isOpen, isMobile]);

    const handleSelect = (code) => {
        onChange(code);
        setIsOpen(false);
        setSearchQuery('');
    };

    // Portal for dropdown/modal
    const OverlayContent = () => (
        <div
            className={`
                fixed inset-0 z-[100] flex flex-col text-black
                ${isMobile ? 'bg-white' : 'bg-transparent'}
            `}
            onClick={(e) => {
                // Close if clicking the background (desktop overlay)
                if (e.target === e.currentTarget && !isMobile) setIsOpen(false);
            }}
        >
            {/* Desktop Backdrop (Invisible but blocking) / Mobile is full white bg */}
            {!isMobile && (
                <div className="absolute inset-0" onClick={() => setIsOpen(false)} />
            )}

            {/* The Dropdown/Modal Content */}
            <div
                className={`
                    flex flex-col bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black
                    ${isMobile
                        ? 'h-full w-full animate-in slide-in-from-bottom duration-300'
                        : 'absolute max-h-[400px] w-[90vw] max-w-[500px] animate-in fade-in zoom-in-95 duration-200'}
                `}
                style={!isMobile ? {
                    // Position filtering logic usually requires calculating coords.
                    // For simplicity in this custom implementation, we'll center it or place it near mouse?
                    // Actually, a centered modal is best for "Search Subject" if the list is huge.
                    // Let's do a centered modal overlay for desktop too for simpler UX with huge lists,
                    // OR position it relative to trigger. 
                    // Given "Search", a centered command palette style is very "Pro Max".
                    // Let's go with Centered Command Palette for Desktop.
                    top: '20%',
                    left: '50%',
                    transform: 'translate(-50%, 0)'
                } : {}}
                onClick={(e) => e.stopPropagation()} // Prevent close on content click
            >
                {/* Header / Search */}
                <div className="flex items-center border-b-4 border-black p-4 gap-3 bg-[#ffde00]">
                    <Search className="w-6 h-6 shrink-0 stroke-[3] text-black" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="SEARCH SUBJECT..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent font-bold uppercase text-lg sm:text-xl text-black placeholder:text-black/50 outline-none min-w-0 font-mono"
                    />
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-1 hover:bg-black hover:text-white transition-colors border-2 border-black bg-white text-black"
                    >
                        <X className="w-6 h-6 stroke-[3]" />
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto p-2 scroll-smooth bg-white">
                    {filteredSubjects.length === 0 ? (
                        <div className="p-8 text-center font-bold text-gray-400 uppercase">
                            No subjects found
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredSubjects.map((sub) => {
                                const isSelected = sub.subject_code === selectedValue;
                                return (
                                    <button
                                        key={sub.subject_code}
                                        onClick={() => handleSelect(sub.subject_code)}
                                        className={`
                                            w-full text-left p-4 font-bold uppercase border-2 border-black transition-all flex items-center justify-between group
                                            ${isSelected
                                                ? 'bg-black text-[#00ffff] shadow-[4px_4px_0px_0px_#00ffff]'
                                                : 'bg-white text-black hover:bg-[#ff69b4] hover:text-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'
                                            }
                                        `}
                                    >
                                        <div className="flex-1 mr-4">
                                            <div className="text-sm sm:text-base leading-tight">
                                                {sub.subject_name}
                                            </div>
                                            <div className={`text-[10px] font-mono mt-1 ${isSelected ? 'opacity-80' : 'text-gray-600 group-hover:text-black/70'}`}>
                                                {sub.subject_code}
                                            </div>
                                        </div>
                                        {isSelected && <Check className="w-6 h-6 stroke-[4]" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div
                ref={containerRef}
                onClick={() => setIsOpen(true)}
                className="
                    relative w-full md:w-auto md:min-w-[300px] cursor-pointer group
                    border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                    hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                    transition-all active:translate-x-[4px] active:translate-y-[4px] active:shadow-none
                "
            >
                <div className="flex items-center justify-between p-3 min-h-[44px]">
                    <span className="font-bold uppercase truncate mr-2 select-none text-xs md:text-sm">
                        {displayValue}
                    </span>
                    <div className="bg-[#ffde00] border-2 border-black rounded-full p-0.5 shrink-0 group-hover:bg-[#ff69b4] transition-colors">
                        <ChevronDown className="w-4 h-4 stroke-[3]" />
                    </div>
                </div>
            </div>

            {isOpen && createPortal(<OverlayContent />, document.body)}
        </>
    );
}
