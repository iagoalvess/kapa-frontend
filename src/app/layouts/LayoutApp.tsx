import { Menu, X } from 'lucide-react'
import { useRef } from 'react'
import { Outlet, useMatches } from 'react-router'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { Button } from '@/components/ui/button'
import { useMeuPerfil } from '@/features/formandos'
import { BuscaGlobal } from '@/features/busca'
import { SinoDeNovidades } from '@/features/comunicacao'
import { FaixaDeStatus } from '@/features/formaturas'
import { useFormaturaAtiva, useSessao } from '@/hooks/useSessao'
import { BarraLateral } from './BarraLateral'
import { MenuDaConta } from './MenuDaConta'

/** Título da tela, declarado na rota: `{ handle: { titulo: 'Membros' } }` em `router.tsx`. */
function useTituloDaRota() {
  return useMatches()
    .map((rota) => rota.handle)
    .findLast(
      (handle): handle is { titulo: string } =>
        typeof handle === 'object' && handle !== null && 'titulo' in handle,
    )?.titulo
}

/**
 * Moldura das telas autenticadas: barra lateral à esquerda; no topo, o título da tela, a
 * formatura da sessão e o avatar.
 *
 * No celular a barra lateral vira gaveta num `<dialog>` nativo — ele já traz Esc, foco preso e
 * fundo escurecido. Os links da barra fecham a gaveta ao navegar.
 */
export function LayoutApp() {
  const { usuario } = useSessao()
  const { selecionada, desligadoEm } = useFormaturaAtiva()
  const titulo = useTituloDaRota()
  const gaveta = useRef<HTMLDialogElement>(null)
  const fecharGaveta = () => gaveta.current?.close()
  // O cadastro incompleto marca a porta dele, que é o avatar — e não um aviso no meio do Início.
  // Quem foi desligado não tem cadastro na turma para completar: o ponto some, e a consulta também.
  const perfil = useMeuPerfil(!desligadoEm).data
  const cadastroPendente = perfil?.essencial_pendente === true

  return (
    <div className="flex min-h-full">
      {/* Primeiro elemento focável da página: quem navega por teclado pula a navegação inteira
          em vez de tabular por ela em toda troca de tela. */}
      <a
        href="#conteudo"
        className="bg-background focus:ring-ring sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-20 focus:rounded-md focus:border focus:px-3 focus:py-2 focus:ring-2"
      >
        Pular para o conteúdo
      </a>

      {/* Sem rolagem aqui: quem rola é o miolo do menu, para o rodapé (o "Sair") nunca sair da tela. */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 overflow-hidden lg:block">
        <BarraLateral />
      </aside>

      {/* `closedby="any"`: clique fora e Esc fecham sem uma linha de JS. Onde o navegador ainda
          não o suporta, sobram o Esc e o botão de fechar.

          A gaveta desliza da esquerda e o fundo esmaece, só com CSS: `starting:` dá o ponto de
          partida da abertura, e `transition-discrete` segura `display`/`overlay` até o fim do
          fechamento. Navegador sem `@starting-style` abre e fecha sem animação. */}
      <dialog
        ref={gaveta}
        closedby="any"
        aria-label="Menu"
        className="bg-background backdrop:bg-foreground/20 m-0 h-dvh max-h-none w-72 max-w-[85vw] -translate-x-full overflow-hidden transition-[translate,overlay,display] transition-discrete backdrop:opacity-0 backdrop:transition-[opacity,overlay,display] backdrop:transition-discrete open:translate-x-0 open:backdrop:opacity-100 motion-reduce:transition-none motion-reduce:backdrop:transition-none lg:hidden starting:open:-translate-x-full starting:open:backdrop:opacity-0"
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fechar menu"
          className="absolute top-4 right-3"
          onClick={fecharGaveta}
        >
          <X />
        </Button>
        <BarraLateral aoNavegar={fecharGaveta} />
      </dialog>

      <div className="flex min-w-0 flex-1 flex-col px-4 pb-8 lg:px-6">
        <header className="flex h-16 shrink-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Abrir menu"
            className="-ml-2 lg:hidden"
            onClick={() => gaveta.current?.showModal()}
          >
            <Menu />
          </Button>

          {titulo ? (
            <h1 className="text-foreground min-w-0 truncate text-[1.625rem] font-medium tracking-tight">
              {titulo}
            </h1>
          ) : (
            <LogoKapa className="text-foreground h-6 lg:hidden" />
          )}

          <div className="ml-auto flex min-w-0 items-center gap-3">
            {/* A busca é do que a turma tem — gente, despesa, fornecedor, aviso —, e por isso só
                existe com uma turma na sessão. */}
            {selecionada ? <BuscaGlobal /> : null}
            {/* O sino é do mural, e por isso só existe com uma turma na sessão. */}
            {selecionada ? <SinoDeNovidades /> : null}
            {/* O avatar abre o que é da conta — cadastro, privacidade, papel, plano e "Sair" —, e é
                por isso que nada disso ocupa linha no menu da esquerda, que é o menu da turma. */}
            {usuario ? (
              <MenuDaConta
                usuario={usuario}
                perfil={perfil}
                comCadastro={Boolean(selecionada) && !desligadoEm}
                cadastroPendente={cadastroPendente}
              />
            ) : null}
          </div>
        </header>

        {/* `*:animate-entrar`: toda raiz de tela que entra aqui — rota nova, ou o conteúdo que
            substitui o esqueleto — aparece com a animação padrão. Sem `key`: remontar a
            rota zeraria o estado das guardas. */}
        <main
          id="conteudo"
          tabIndex={-1}
          className="*:motion-safe:animate-entrar grid flex-1 content-start gap-5 outline-none"
        >
          {/* Aqui, e não em cada página: formatura inativa tem de estar dita em toda tela. */}
          <FaixaDeStatus />
          <Outlet />
        </main>
      </div>
    </div>
  )
}
