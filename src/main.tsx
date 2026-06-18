import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'
import { getPreferredLocale, translate } from './app/i18n'
import './app/styles.css'

const root = document.querySelector<HTMLDivElement>('#root')

if (!root) {
  throw new Error(
    translate(getPreferredLocale(), 'errors.rootNotFound'),
  )
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
