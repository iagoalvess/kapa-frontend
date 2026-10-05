import { X } from 'lucide-react'
import { useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { DialogoDeUpgrade } from '@/components/DialogoDeUpgrade'
import { VoltaDaPagina } from '@/components/VoltaDaPagina'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { Button } from '@/components/ui/button'
import { useAdesaoObrigatoria } from '@/features/adesoes'
import { useMeuPerfil } from '@/features/formandos'
import { BuscaGlobal } from '@/features/busca'
import { SinoDeNovidades } from '@/features/comunicacao'
import { FaixaDeStatus } from '@/features/formaturas'
import { MODULOS } from '@/config/planos'
import { ROTAS } from '@/config/rotas'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'
import { useFormaturaAtiva, useSessao } from '@/hooks/useSessao'
import { useTelaGrande } from '@/hooks/useTelaGrande'
import { useTituloDaRota } from '@/hooks/useNavegacaoDaPagina'
import { cn } from '@/lib/utils'
import { BarraInferior } from './BarraInferior'
import { BarraLateral } from './BarraLateral'
import { MenuDaConta } from './MenuDaConta'
import { useNoPainel } from './menuDoPainel'

/**
 * Moldura das telas autenticadas: barra lateral à esquerda; no topo, o título da tela, a
 * formatura da sessão e o avatar.
 *
 * No celular (Sprint 41) a barra lateral sai: embaixo, ao alcance do polegar, fica a `BarraInferior`
 * com os quatro destinos do papel, e o "Mais" dela abre o menu inteiro e a busca numa folha que sobe
 * de baixo — um `<dialog>` nativo, que já traz Esc, foco preso e fundo escurecido. O topo fica com o
 * título, o sino e o avatar.
 */
export function LayoutApp() {
  const { usuario } = useSessao()
  const { selecionada, desligadoEm } = useFormaturaAtiva()
  const titulo = useTituloDaRota()
  const { pathname } = useLocation()
  // A largura de leitura é só do Início: nas telas de trabalho (planilha, relatório, caixa), a tabela
  // usa a tela inteira. Aqui o miolo encolhe e centraliza, sobrando margem dos dois lados.
  const soOInicio = pathname === ROTAS.inicio
  const noPainel = useNoPainel()
  const telaGrande = useTelaGrande()
  const muralForaDoPlano = usePlanoDaTurma().bloqueia(MODULOS.mural)
  // Antes da adesão o mural responde 403 (Sprint 47, D18): o sino só aparece para quem já pode lê-lo.
  const adesao = useAdesaoObrigatoria()
  const adesaoPendente = adesao.carregando || adesao.pendente
  const folha = useRef<HTMLDialogElement>(null)
  const fecharFolha = () => folha.current?.close()
  // O cadastro incompleto marca a porta dele, que é o avatar — e não um aviso no meio do Início.
  // Quem foi desligado não tem cadastro na turma para completar: o ponto some, e a consulta também.
  const perfil = useMeuPerfil(selecionada && !desligadoEm).data
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

      {/* A folha "Mais": sobe de baixo e o fundo esmaece, só com CSS — `starting:` dá o ponto de
          partida da abertura, e `transition-discrete` segura `display`/`overlay` até o fim do
          fechamento. `closedby="any"`: clique fora e Esc fecham sem uma linha de JS. Altura fixa
          porque a `BarraLateral` rola o próprio miolo, e precisa de uma altura para medir. */}
      {selecionada && !telaGrande ? (
        <dialog
          ref={folha}
          closedby="any"
          aria-label="Mais"
          className="bg-background backdrop:bg-foreground/20 m-0 mt-auto h-[85dvh] max-h-none w-full max-w-none translate-y-full overflow-hidden rounded-t-3xl pt-3 transition-[translate,overlay,display] transition-discrete backdrop:opacity-0 backdrop:transition-[opacity,overlay,display] backdrop:transition-discrete open:translate-y-0 open:backdrop:opacity-100 motion-reduce:transition-none motion-reduce:backdrop:transition-none starting:open:translate-y-full starting:open:backdrop:opacity-0"
        >
          <div className="flex h-full flex-col pb-[env(safe-area-inset-bottom)]">
            <div className="flex shrink-0 items-center gap-2 px-4">
              {/* O "Fechar" vem antes no DOM porque o `<dialog>` foca o primeiro controle ao abrir: se
                  fosse o campo, o teclado do celular subiria a cada toque em "Mais". */}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Fechar"
                className="order-last"
                onClick={fecharFolha}
              >
                <X />
              </Button>
              {/* Escolher um resultado ou um item do menu é ir a outra tela: a folha fecha junto. */}
              <BuscaGlobal larga aoEscolher={fecharFolha} />
            </div>
            <div className="min-h-0 flex-1">
              <BarraLateral comLogo={false} aoNavegar={fecharFolha} />
            </div>
          </div>
        </dialog>
      ) : null}

      {/* O respiro de baixo, no celular, é o da barra inferior mais o da área segura do aparelho — e o
          do botão, quando a tela tem uma `AcaoFixa`. */}
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] has-[[data-acao-fixa]]:max-lg:pb-[calc(9.5rem+env(safe-area-inset-bottom))] lg:px-6 lg:pb-8',
          soOInicio && 'mx-auto w-full max-w-[1440px]',
        )}
      >
        <header className="flex min-h-16 shrink-0 items-center gap-3 py-3 lg:h-16 lg:py-0">
          {titulo ? (
            <h1 className="text-foreground min-w-0 text-[1.375rem] leading-tight font-medium tracking-tight lg:truncate lg:text-[1.625rem]">
              {titulo}
            </h1>
          ) : (
            <LogoKapa className="text-foreground h-6 lg:hidden" />
          )}

          <div className="ml-auto flex min-w-0 items-center gap-3">
            {/* A busca é do que a turma tem — gente, despesa, fornecedor, aviso —, e por isso só
                existe com uma turma na sessão. */}
            {/* No celular ela mora na folha "Mais" (P2), e só uma existe por vez: o painel tem id fixo. */}
            {selecionada && telaGrande ? <BuscaGlobal /> : null}
            {/* O sino é do mural, e por isso só existe com uma turma na sessão — e com o mural no plano. */}
            {selecionada && !muralForaDoPlano && !adesaoPendente ? <SinoDeNovidades /> : null}
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
          <VoltaDaPagina>
            <FaixaDeStatus />
            <Outlet />
          </VoltaDaPagina>
        </main>
        {/* Um só, para qualquer tela: é aonde vai toda falha de plano que a API devolver (Sprint 45). */}
        <DialogoDeUpgrade />
      </div>

      {selecionada ? <BarraInferior aoAbrirMais={() => folha.current?.showModal()} /> : null}
      {/* O painel do Kapa (Sprint 44) tem três destinos e nenhuma folha: cabem todos na barra. */}
      {noPainel ? <BarraInferior /> : null}
    </div>
  )
}
