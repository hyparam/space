import 'hightable/src/HighTable.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './components/App.js'
import './styles/index.css'

const app = document.getElementById('app')
if (!app) throw new Error('No app element')
createRoot(app).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
