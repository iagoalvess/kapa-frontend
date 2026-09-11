import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from '@/app/providers'
import { sessao } from '@/lib/http/sessao'
import { aplicarTema, temaSalvo } from '@/lib/tema'
import '@/styles/index.css'

const raiz = document.querySelector('#root')
if (!raiz) throw new Error('Elemento #root não encontrado em index.html.')

// Antes do primeiro pixel, senão o usuário vê meio segundo de tema branco e pisca para o escuro.
aplicarTema(temaSalvo())

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
