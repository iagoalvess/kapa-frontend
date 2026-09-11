import { Outlet } from 'react-router'
import { Cabecalho } from '@/components/layout/Cabecalho'
import { env } from '@/config/env'

/** Moldura das telas autenticadas: cabeçalho fixo, a rota filha no corpo e a versão no rodapé. */
export function LayoutApp() {
  return (
    <div className="flex min-h-full flex-col">
      {/* Primeiro elemento focável da página: quem navega por teclado pula o cabeçalho inteiro
          em vez de tabular por ele em toda troca de tela. */}
      <a
        href="#conteudo"
        className="bg-background focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20 focus:rounded-md focus:border focus:px-3 focus:py-2 focus:ring-2"
      >
        Pular para o conteúdo
      </a>

      <Cabecalho />

      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <Outlet />
      </main>

      {/* A pergunta "qual versão você está vendo?" aparece em todo atendimento. */}
      <footer className="text-muted-foreground mx-auto w-full max-w-5xl px-6 py-4 text-xs">
        {env.VITE_APP_NOME} {__VERSAO__}
      </footer>
    </div>
  )
}
