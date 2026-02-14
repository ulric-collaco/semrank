import { useRef, useEffect, useState } from 'react'

export default function ToggleSwitch({ options, activeValue, onChange }) {
    const trackRef = useRef(null)
    const [thumbStyle, setThumbStyle] = useState({ left: 0, width: 0 })

    useEffect(() => {
        const track = trackRef.current
        if (!track) return

        const activeIndex = options.findIndex((o) => o.value === activeValue)
        const buttons = track.querySelectorAll('.toggle-label')
        const btn = buttons[activeIndex]
        if (!btn) return

        setThumbStyle({
            left: btn.offsetLeft,
            width: btn.offsetWidth,
        })
    }, [activeValue, options])

    return (
        <div className="toggle-track" ref={trackRef}>
            {/* Sliding thumb */}
            <div
                className="toggle-thumb"
                style={{
                    left: `${thumbStyle.left}px`,
                    width: `${thumbStyle.width}px`,
                }}
            />
            {/* Labels */}
            {options.map((opt) => (
                <button
                    key={opt.value}
                    className={`toggle-label ${activeValue === opt.value ? 'active' : ''}`}
                    onClick={() => onChange(opt.value)}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}
