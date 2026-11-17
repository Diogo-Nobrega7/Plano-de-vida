import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './App'
import './index.css'

// Aplica o tema salvo antes do primeiro desenho (evita piscar).
const t = localStorage.getItem('rumo:tema')
if (t === 'claro' || t === 'escuro') document.documentElement.setAttribute('data-theme', t === 'escuro' ? 'dark' : 'light')

ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>)
