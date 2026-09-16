import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RouterProvider } from 'react-router/dom'
import { Toaster } from 'sonner'
import mascoteAcenando from '@/assets/mascote/acenando.webp'
import mascoteAlerta from '@/assets/mascote/alerta.webp'
import mascoteErro from '@/assets/mascote/erro.webp'
import mascoteFeliz from '@/assets/mascote/feliz.webp'
import mascoteFoguete from '@/assets/mascote/foguete.webp'
import { queryClient } from '@/lib/query/client'
import { router } from './router'

/**
 * Raiz da aplicação.
 *
 * Ordem importa: o cache existe antes das rotas, porque as páginas consultam no primeiro render.
 */
export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      {/*
        Aviso no desenho dos cartões (branco, `shadow-cartao`, sobre o creme), sem o verde e o
        vermelho chapados do `richColors`: quem diz o tom é o mascote. `unstyled` desliga o CSS do
        sonner para os utilitários valerem — o empilhamento e a animação continuam dele.

        Qual usar: `success` quando algo bom aconteceu; `info` quando a ação deu certo mas não é
        para comemorar (cancelar, revogar); `warning` quando nada foi feito e o próprio usuário
        resolve (arquivo grande, navegador sem permissão); `error` quando a ação falhou — inclusive a
        recusa por regra de negócio da API (decisão do produto).
      */}
      <Toaster
        position="top-right"
        icons={{
          success: <Mascote src={mascoteFeliz} className="bg-success-bg" />,
          info: <Mascote src={mascoteAcenando} className="bg-neutral-bg" />,
          warning: <Mascote src={mascoteAlerta} className="bg-warning-bg" />,
          error: <Mascote src={mascoteErro} className="bg-danger-bg" />,
          // O mascote também no "carregando", no tom da marca: sem ele o sonner põe a roda dele, que
          // é o único elemento do produto sem a nossa cara. O progresso é a barra laranja no pé do
          // aviso (`[data-type='loading']` em `styles/index.css`) — indeterminada de propósito, já
          // que o worker não diz em que ponto está. Lá também mora a regra que tira o mascote do
          // meio do cartão: o sonner posiciona o ícone de carregamento `absolute`.
          loading: <Mascote src={mascoteFoguete} className="bg-brand-tint" />,
        }}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              'bg-card shadow-cartao flex w-(--width) items-center gap-3 rounded-2xl border py-2.5 pr-4 pl-2.5 font-sans',
            icon: 'shrink-0',
            title: 'text-foreground text-sm font-medium',
            description: 'text-muted-foreground text-[13px]',
          },
        }}
      />
      {import.meta.env.DEV ? <ReactQueryDevtools buttonPosition="bottom-right" /> : null}
    </QueryClientProvider>
  )
}

/** O mascote do aviso: num ladrilho no tom do estado, com a cabeça escapando pelo alto. */
function Mascote({ src, className }: { src: string; className: string }) {
  return (
    <span className={`flex size-9 items-end justify-center rounded-xl ${className}`}>
      <img src={src} alt="" className="size-11 max-w-none object-contain drop-shadow-sm" />
    </span>
  )
}
