import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { InspectProvider } from './inspector'

const root = (
  <StrictMode>
    <App />
  </StrictMode>
)

const isDev = process.env.NODE_ENV !== 'production'

createRoot(document.getElementById('root')!).render(isDev ? <InspectProvider>{root}</InspectProvider> : root)
