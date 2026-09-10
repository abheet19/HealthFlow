// Import debug environment script
import './debug-env';

import * as React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const mount = async () => {
  try {
    await import('./index.css')
  } catch (error) {
    // Keep the access flow usable if the stylesheet request is interrupted.
    console.error('HealthFlow styles failed to load.', error)
  }

  const root = document.getElementById('root')!
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )

  const revealApp = () => {
    document.getElementById('access-gate-prepaint')?.remove()
    document.getElementById('access-gate-prepaint-styles')?.remove()
    root.removeAttribute('aria-hidden')
  }

  // Keep the accessible prepaint in front until React has completed a paint.
  requestAnimationFrame(() => requestAnimationFrame(revealApp))
}

void mount()
