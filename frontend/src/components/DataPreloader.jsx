import { useEffect } from 'react';
import { leaderboardAPI, studentAPI } from '../utils/api';

const preloadImage = (src) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
        img.onerror = reject;
    });
};

const DataPreloader = () => {
    useEffect(() => {
        const loadInitialData = async () => {
            if (typeof window === 'undefined') return;

            // Use requestIdleCallback to avoid blocking main thread interactivity
            const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));

            idleCallback(async () => {
                console.log('Starting background data preload...');
                try {
                    // 1. Fetch Leaderboard Data (Top 50)
                    // This populates the API cache for the Leaderboard page
                    const topStudents = await leaderboardAPI.getTopBySGPA(50, 'all');

                    // 2. Preload images for top students
                    // We stagger this slightly to not choke network
                    if (topStudents && topStudents.length > 0) {
                        const top20 = topStudents.slice(0, 20);
                        top20.forEach((student, index) => {
                            setTimeout(() => {
                                preloadImage(`/student_faces/${student.roll_no}.png`);
                            }, index * 100); // 100ms stagger
                        });
                    }

                    // 3. Preload "All Students" list for search
                    // This is 'heavy' but crucial for instant search
                    await studentAPI.getAllStudents(); // Caches the result

                    console.log('Background preload complete.');
                } catch (error) {
                    console.warn('Preload warning:', error);
                }
            });
        };

        loadInitialData();
    }, []);

    return null; // Renderless component
};

export default DataPreloader;
