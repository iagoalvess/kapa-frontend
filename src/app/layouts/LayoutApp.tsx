import { Menu, X } from 'lucide-react'
import { useRef } from 'react'
import { Link, Outlet, useMatches } from 'react-router'
import { Avatar } from '@/components/Avatar'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { useMeuPerfil } from '@/features/formandos'
import { FaixaDeStatus, SeletorDeFormatura } from '@/features/formaturas'
import { useFormaturaAtiva, useSessao } from '@/hooks/useSessao'
import { BarraLateral } from './BarraLateral'

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
  const { selecionada } = useFormaturaAtiva()
  const titulo = useTituloDaRota()
  const gaveta = useRef<HTMLDialogElement>(null)
  const fecharGaveta = () => gaveta.current?.close()
  // O cadastro incompleto marca a porta dele, que é o avatar — e não um aviso no meio do Início.
  const cadastroPendente = useMeuPerfil().data?.essencial_pendente === true

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
            <SeletorDeFormatura />
            {/* O avatar é a porta do próprio cadastro, como em quase todo app. Sem formatura não há
                cadastro na turma para abrir: fica só a identificação. */}
            {usuario && selecionada ? (
              <Link
                to={ROTAS.meuCadastro}
                title={`${usuario.nome} — meu cadastro`}
                className="focus-visible:ring-ring relative shrink-0 rounded-full hover:opacity-85 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              >
                <span className="sr-only">Meu cadastro{cadastroPendente ? ', incompleto' : ''}</span>
                <Avatar nome={usuario.nome} semente={usuario.id} className="size-8 text-sm" />
                {/* O ponto na porta do cadastro: a borda da cor do fundo o descola do avatar. */}
                {cadastroPendente ? (
                  <span
                    aria-hidden
                    className="bg-warning-text border-background absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2"
                  />
                ) : null}
              </Link>
            ) : usuario ? (
              <div className="shrink-0" title={usuario.nome}>
                <span className="sr-only">{usuario.nome}</span>
                <Avatar nome={usuario.nome} semente={usuario.id} className="size-8 text-sm" />
              </div>
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
