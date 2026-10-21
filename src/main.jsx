import React from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-600.css'
import './index.css'
import './readability.css'
import './agents.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(<App />)
