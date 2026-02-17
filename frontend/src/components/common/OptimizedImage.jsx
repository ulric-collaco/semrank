import React, { useState, useEffect } from 'react';


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
    const [currentSrc, setCurrentSrc] = useState(src);
    const [triedFallback, setTriedFallback] = useState(false);

    useEffect(() => {
        if (!src) return;

        // Reset state when src prop changes
        setIsLoaded(false);
        setHasError(false);
        setTriedFallback(false);
        setCurrentSrc(src);

        const img = new Image();
        img.src = src;

        // If image is already cached
        if (img.complete) {
            setIsLoaded(true);
            if (onLoad) onLoad();
        }
    }, [src]);

    const handleLoad = (e) => {
        setIsLoaded(true);
        if (onLoad) onLoad(e);
    };

    const handleError = (e) => {
        // Try fallback extension if not already tried
        if (currentSrc && !hasError && !triedFallback) {
            if (currentSrc.endsWith('.png')) {
                setCurrentSrc(currentSrc.replace('.png', '.jpg'));
                setTriedFallback(true);
                return;
            } else if (currentSrc.endsWith('.jpg')) {
                setCurrentSrc(currentSrc.replace('.jpg', '.png'));
                setTriedFallback(true);
                return;
            }
        }

        setHasError(true);
        if (onError) onError(e);
    };

    // Construct common props
    const imgProps = {
        src: currentSrc,
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

    // Extract layout-related classes to apply to wrapper
    const wrapperClasses = className ? className.split(' ').filter(c =>
        c.startsWith('w-') || c.startsWith('h-') || c.includes('rounded') || c.includes('object-')
    ).join(' ') : '';

    if (hasError) return props.fallback || null;

    return (
        <div className={`relative overflow-hidden ${wrapperClasses}`} style={{
            width: width ? 'fit-content' : undefined,
            height: height ? 'fit-content' : undefined
        }}>
            {/* Placeholder / Skeleton - Shows until loaded or error */}
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}

            {/* The Image */}
            <img {...imgProps} />
        </div>
    );
};

export default OptimizedImage;
