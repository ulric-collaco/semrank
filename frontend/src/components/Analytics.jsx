import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_TRACKING_ID;

export default function Analytics() {
    const location = useLocation();

    useEffect(() => {
        if (!GA_MEASUREMENT_ID) return;

        // Initialize GA script if not already present
        const scriptId = 'google-analytics-script';
        if (!document.getElementById(scriptId)) {
            const script = document.createElement('script');
            script.id = scriptId;
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
            document.head.appendChild(script);

            const inlineScript = document.createElement('script');
            inlineScript.innerHTML = `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}', {
                    page_path: window.location.pathname,
                });
            `;
            document.head.appendChild(inlineScript);
        }
    }, []);

    useEffect(() => {
        if (!GA_MEASUREMENT_ID) return;

        // Verify window.gtag exists before calling
        if (typeof window.gtag === 'function') {
            window.gtag('config', GA_MEASUREMENT_ID, {
                page_path: location.pathname + location.search,
            });
        }
    }, [location]);

    return null;
}
