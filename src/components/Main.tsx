import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import '../styles/index.css'

const root = document.getElementById('app')
if (!root) throw new Error('No root element')
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
