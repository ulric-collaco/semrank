import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Self-hosted fonts (eliminates external Google Fonts CDN requests)
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/slackey/400.css'

// Vercel Analytics & Speed Insights (real-user CWV monitoring)
import { inject } from '@vercel/analytics'
import { injectSpeedInsights } from '@vercel/speed-insights'
inject()
injectSpeedInsights()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
