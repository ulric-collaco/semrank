import React, { useState, useEffect } from 'react';
import { cn } from '../../utils/utils'; // Assuming you have a utils file for class merging, if not I'll just use template literals or install clsx/tailwind-merge. I see cn is common. I will check.

// Fallback to simple join if utils not found or I can just inline it.
// Checking previous file views... I see `utils/format` and `utils/api`. I don't see `utils/cn`.
// I'll assume standard className prop handling for now.

const OptimizedImage = ({
    src,
    alt,
    className,
    width,
    height,
    priority = false, // If true, eager load. If false, lazy load.
    onLoad,
    onError,
    ...props
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        if (!src) return;

        // Reset state when src changes
        setIsLoaded(false);
        setHasError(false);

        const img = new Image();
        img.src = src;

        // If image is already cached
        if (img.complete) {
            setIsLoaded(true);
            if (onLoad) onLoad();
        }
    }, [src, onLoad]);

    const handleLoad = (e) => {
        setIsLoaded(true);
        if (onLoad) onLoad(e);
    };

    const handleError = (e) => {
        setHasError(true);
        if (onError) onError(e);
        // Optional: Hide the broken image
        e.target.style.display = 'none';
    };

    // Construct common props
    const imgProps = {
        src,
        alt: alt || '',
        className: `transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className || ''}`,
        width,
        height,
        loading: priority ? 'eager' : 'lazy',
        decoding: 'async',
        onLoad: handleLoad,
        onError: handleError,
        ...props
    };

    return (
        <div className={`relative overflow-hidden ${className?.includes('rounded') ? '' : ''}`} style={{ width: width ? 'fit-content' : '100%', height: height ? 'fit-content' : '100%' }}>
            {/* Placeholder / Skeleton - Shows until loaded or error */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}

            {/* The Image */}
            <img {...imgProps} />

            {/* Error State Fallback (Optional - could be an icon) */}
            {hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400 text-xs text-center p-1">
                    failed
                </div>
            )}
        </div>
    );
};

export default OptimizedImage;
