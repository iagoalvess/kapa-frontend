import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { Site } from './Site'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/caveat'
import '@/styles/index.css'

const raiz = document.querySelector('#root')
if (!raiz) throw new Error('Elemento #root não encontrado em site.html.')

// Depois de um deploy, a aba aberta aponta para chunks que já foram apagados. Recarregar busca o novo.
globalThis.addEventListener('vite:preloadError', () => {
  globalThis.location.reload()
})

const site = (
  <StrictMode>
    <BrowserRouter>
      <Site />
    </BrowserRouter>
  </StrictMode>
)

// Na build, o HTML chega pré-renderizado e o React só o assume; no `npm run dev:site` a raiz vem vazia.
if (raiz.firstElementChild) hydrateRoot(raiz, site)
else createRoot(raiz).render(site)
