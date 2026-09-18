import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/providers'
import { sessao } from '@/lib/http/sessao'
// Fonte auto-hospedada: o Vite copia os woff2 (um por conjunto de caracteres) para /assets, e o
// navegador baixa só o conjunto que a página usa. Sem depender do Google Fonts em produção.
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/caveat'
import '@/styles/index.css'

const raiz = document.querySelector('#root')
if (!raiz) throw new Error('Elemento #root não encontrado em index.html.')

// Depois de um deploy, a aba aberta ainda aponta para chunks que já foram apagados do servidor,
// e o próximo lazy() falha com a tela quebrada. Recarregar busca o index novo.
globalThis.addEventListener('vite:preloadError', () => {
  globalThis.location.reload()
})

// Renova a sessão antes do primeiro render: sem isso a guarda de rota veria "não autenticado"
// a cada F5 e mandaria para o login quem tem refresh token válido.
await sessao.restaurar()

createRoot(raiz).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
