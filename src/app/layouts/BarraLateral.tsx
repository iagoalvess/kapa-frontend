import {
  BadgeCheck,
  CalendarDays,
  HandCoins,
  Lock,
  Coins,
  FileSignature,
  FileText,
  Crown,
  LogOut,
  GraduationCap,
  ShieldCheck,
  Wallet,
  Megaphone,
  type LucideIcon,
  PartyPopper,
  DoorOpen,
  Ticket,
  PiggyBank,
  Receipt,
  ReceiptText,
  ShoppingBag,
  Users,
  Store,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { env } from '@/config/env'
import { PAPEIS, type Papel, ROTULOS_DE_PAPEL } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useAdesaoPendente } from '@/features/adesoes'
import { ICONE_DE_PLANO_PADRAO, ICONES_DE_PLANO, MODULOS } from '@/config/planos'
import { useSair } from '@/features/auth'
import { useDespesasAtrasadas } from '@/features/financeiro'
import { useParcelasVencidas, usePendentesDeConferencia } from '@/features/pagamentos'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'
import { useFormaturaAtiva, usePapel } from '@/hooks/useSessao'
import { formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { MENU_DO_PAINEL, useNoPainel } from './menuDoPainel'

/**
 * A forma de um item do menu: 32px de altura, ícone de 18 e texto de 14.
 *
 * A densidade é o que faz caber: com 36px e 4 de respiro entre itens, os dezesseis do menu da
 * Gestão passavam de mil pixels e a lista nascia com rolagem numa tela de notebook — e item de
 * menu que só aparece rolando é item que ninguém acha.
 */
const formaDoItem =
  'flex h-8 w-full items-center gap-2.5 rounded-lg px-3 text-sm [&_svg]:size-[18px] [&_svg]:shrink-0'

const estiloDoItem = (ativo: boolean) =>
  cn(
    formaDoItem,
    'focus-visible:ring-ring transition-colors focus-visible:ring-2 focus-visible:outline-none',
    ativo ? 'bg-brand text-on-brand font-medium' : 'text-foreground/80 hover:bg-muted hover:text-foreground',
  )

/**
 * O que espera a pessoa naquele item: o número da fila, ou o ponto de "tem algo pendente".
 *
 * É a marca na porta, e não um aviso no meio da tela: a pendência fica onde a pessoa vai resolvê-la
 * e não ocupa espaço nenhum do conteúdo. O número é para trabalho que se conta (avisos de pagamento
 * a conferir); o ponto, para pendência que só existe ou não (assinar o termo).
 *
 * @param sinal `true` desenha o ponto; um número maior que zero desenha o número.
 * @param ativo O item aceso — o contraste do selo muda sobre o laranja.
 * @param rotulo O que o leitor de tela ouve no lugar do número solto.
 */
function SinalDoItem({ sinal, ativo, rotulo }: { sinal?: number | boolean; ativo: boolean; rotulo: string }) {
  if (!sinal) return null

  if (sinal === true)
    return (
      <span className={cn('ml-auto size-2 shrink-0 rounded-full', ativo ? 'bg-on-brand' : 'bg-brand')}>
        <span className="sr-only">{rotulo}</span>
      </span>
    )

  return (
    <span
      className={cn(
        'ml-auto inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums',
        ativo ? 'bg-on-brand/25 text-on-brand' : 'bg-brand-tint text-brand-text',
      )}
    >
      {formatarNumero(sinal)}
      <span className="sr-only"> {rotulo}</span>
    </span>
  )
}

/**
 * @param secao Aceso também nas rotas abaixo de `to` — o detalhe de um item da seção. Sem
 *   ele, só no caminho exato: `/formatura` não pode acender em `/formatura/membros`.
 * @param sinal A pendência daquele item; ver {@link SinalDoItem}.
 * @param rotuloDoSinal O que o sinal quer dizer, para quem não o vê ("a conferir").
 * @param trancado A área está fora do plano da turma (Sprint 45): o item continua, com um cadeado no
 *   lugar do sinal, e leva à vitrine da área. Esconder mataria a descoberta; desabilitar pareceria defeito.
 */
function ItemDeMenu({
  to,
  icone: Icone,
  aoNavegar,
  secao = false,
  sinal,
  rotuloDoSinal = 'pendente',
  trancado = false,
  children,
}: {
  to: string
  icone: LucideIcon
  aoNavegar?: () => void
  secao?: boolean
  sinal?: number | boolean
  rotuloDoSinal?: string
  trancado?: boolean
  children: ReactNode
}) {
  return (
    <NavLink to={to} end={!secao} onClick={aoNavegar} className={({ isActive }) => estiloDoItem(isActive)}>
      {({ isActive }) => (
        <>
          <Icone strokeWidth={1.75} aria-hidden />
          {/* `truncate`: nome que não couber vira reticências, e nunca uma segunda linha — o item
              tem altura fixa, e a linha extra vazaria por cima do vizinho. */}
          <span className="min-w-0 truncate">{children}</span>
          {trancado ? (
            <span className={cn('ml-auto shrink-0', isActive ? 'text-on-brand' : 'text-texto-muted')}>
              <Lock className="size-3.5!" strokeWidth={2} aria-hidden />
              <span className="sr-only"> (fora do plano da turma)</span>
            </span>
          ) : (
            <SinalDoItem sinal={sinal} ativo={isActive} rotulo={rotuloDoSinal} />
          )}
        </>
      )}
    </NavLink>
  )
}

/**
 * O papel na turma, no rodapé do menu: informação, e não link.
 *
 * Mesma forma dos itens, sem hover e sem destino — não há tela de "meu papel", e um item que não
 * leva a lugar nenhum não pode parecer clicável. Fica acima do plano porque a pergunta que ele
 * responde é a primeira: o que eu sou nesta turma.
 *
 * @param papel Papel ativo de quem está na sessão.
 */
function PapelNaTurma({ papel }: { papel: Papel }) {
  const Icone = ICONES_DE_PAPEL[papel]

  return (
    <p className={cn(formaDoItem, 'text-foreground/80')}>
      <Icone strokeWidth={1.75} aria-hidden />
      <span className="sr-only">Seu papel na turma: </span>
      {ROTULOS_DE_PAPEL[papel]}
    </p>
  )
}

/** Comissão e Formando repetem os ícones da faixa de membros ("Na comissão", "Formandos"). */
const ICONES_DE_PAPEL: Record<Papel, LucideIcon> = {
  Presidente: Crown,
  Tesoureiro: Wallet,
  Comissao: ShieldCheck,
  Formando: GraduationCap,
}

/**
 * O plano contratado pela turma, no rodapé: o nome do que está valendo e, num clique, a vitrine.
 *
 * Só quem é da Gestão monta este item — a rota dos planos tem esse mesmo recorte. Sem plano pago (o
 * gratuito, ou a assinatura que venceu) o item convida a ver os planos.
 *
 * O ícone é o do próprio plano (`ICONES_DE_PLANO`), o mesmo que o card mostra na vitrine: dois
 * desenhos diferentes para a mesma coisa fazem o menu parecer levar a outro lugar.
 */
function PlanoDaTurma({ aoNavegar }: { aoNavegar?: () => void }) {
  // O plano vigente, e não a assinatura (Sprint 45): a mesma leitura que tranca o menu, e a turma
  // vencida, que voltou ao gratuito, deixa de ver "Plano Essencial" aqui.
  const { plano } = usePlanoDaTurma()
  const pago = plano?.pago ? plano : undefined

  return (
    <ItemDeMenu
      to={ROTAS.planos}
      icone={(pago ? ICONES_DE_PLANO[pago.codigo] : undefined) ?? ICONE_DE_PLANO_PADRAO}
      aoNavegar={aoNavegar}
    >
      {pago ? `Plano ${pago.nome}` : 'Ver planos'}
    </ItemDeMenu>
  )
}

/** O termo e os convites da pessoa; Parcelas e Pedidos entram aqui só para quem não é da Gestão. */
function Meu({
  aoNavegar,
  adesaoPendente,
  parcelasVencidas,
  mostrarParcelas = true,
  mostrarPedidos = true,
  mostrarConvites = true,
  convitesTrancados = false,
}: {
  aoNavegar?: () => void
  adesaoPendente: boolean
  parcelasVencidas?: number
  mostrarParcelas?: boolean
  mostrarPedidos?: boolean
  mostrarConvites?: boolean
  convitesTrancados?: boolean
}) {
  return (
    <Secao titulo="Minhas coisas">
      {/* Todo membro adere, a comissão inclusive: é o termo de cada um. O ponto é o único lugar em
          que a adesão pendente aparece fora da tela do termo. */}
      <ItemDeMenu
        to={ROTAS.adesao}
        icone={FileSignature}
        aoNavegar={aoNavegar}
        sinal={adesaoPendente}
        rotuloDoSinal="a assinar"
      >
        Meu termo
      </ItemDeMenu>
      {mostrarParcelas ? (
        <ItemDeMenu
          to={ROTAS.extrato}
          icone={ReceiptText}
          aoNavegar={aoNavegar}
          secao
          sinal={parcelasVencidas}
          rotuloDoSinal="minhas vencidas"
        >
          Parcelas
        </ItemDeMenu>
      ) : null}
      {mostrarPedidos ? (
        <ItemDeMenu to={ROTAS.meusPedidos} icone={ShoppingBag} aoNavegar={aoNavegar}>
          Pedidos
        </ItemDeMenu>
      ) : null}
      {mostrarConvites ? (
        <ItemDeMenu to={ROTAS.meusConvites} icone={Ticket} aoNavegar={aoNavegar} trancado={convitesTrancados}>
          Meus convites
        </ItemDeMenu>
      ) : null}
    </Secao>
  )
}

/**
 * Para onde o dinheiro da turma vai — e isto todo membro vê, o formando inclusive: quem paga três
 * anos de parcela tem direito de saber no que a turma gastou. São telas de soma e de contrato, sem
 * nome de ninguém.
 *
 * Os relatórios entram aqui, e não numa seção própria: o balancete e as exportações atravessam o
 * que entra e o que sai, e esta é a seção que fala do dinheiro inteiro — o Caixa já soma os dois
 * lados. Sozinho, sem seção, o item ficava boiando entre dois grupos.
 *
 * @param comRelatorios Balancete e exportações são da Gestão.
 * @param relatoriosTrancados Os relatórios estão fora do plano da turma: o item leva o cadeado.
 * @param despesasAtrasadas Só a Tesouraria recebe o número: para quem não paga despesa, ele não é
 *   ação nenhuma — é a conta da turma exposta como se fosse cobrança.
 */
function DinheiroDaTurma({
  aoNavegar,
  comRelatorios = false,
  relatoriosTrancados = false,
  despesasAtrasadas,
}: {
  aoNavegar?: () => void
  comRelatorios?: boolean
  relatoriosTrancados?: boolean
  despesasAtrasadas?: number
}) {
  return (
    <Secao titulo="Dinheiro da turma">
      <ItemDeMenu to={ROTAS.caixa} icone={PiggyBank} aoNavegar={aoNavegar}>
        Caixa
      </ItemDeMenu>
      <ItemDeMenu
        to={ROTAS.despesas}
        icone={Receipt}
        aoNavegar={aoNavegar}
        secao
        sinal={despesasAtrasadas}
        rotuloDoSinal="atrasadas"
      >
        Despesas
      </ItemDeMenu>
      <ItemDeMenu to={ROTAS.outrasReceitas} icone={HandCoins} aoNavegar={aoNavegar} secao>
        Outras receitas
      </ItemDeMenu>
      {comRelatorios ? (
        <ItemDeMenu
          to={ROTAS.relatorios}
          icone={FileText}
          aoNavegar={aoNavegar}
          trancado={relatoriosTrancados}
        >
          Relatórios
        </ItemDeMenu>
      ) : null}
    </Secao>
  )
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="grid gap-px">
      <p className="text-texto-muted px-3 pb-0.5 text-xs">{titulo}</p>
      {children}
    </div>
  )
}

/**
 * Navegação das telas autenticadas: módulos agrupados por seção e, no pé, o papel na turma e a
 * conta. A formatura da sessão fica no cabeçalho (`LayoutApp`), não aqui.
 *
 * Cada item aparece só para quem o pode abrir (`usePapel`), e cada módulo novo entra numa seção —
 * exibição só; quem recusa é a API.
 *
 * @param aoNavegar Chamado ao clicar num link.
 * @param comLogo Sem ela na folha "Mais" do celular, que já tem a busca no topo.
 */
export function BarraLateral({ aoNavegar, comLogo = true }: { aoNavegar?: () => void; comLogo?: boolean }) {
  const { papel, tem } = usePapel()
  const { selecionada, desligadoEm } = useFormaturaAtiva()
  // Perfil de plataforma, e não papel de turma: no painel o menu é outro (Sprint 44).
  const noPainel = useNoPainel()
  const sair = useSair()
  // Mesmo recorte das rotas em `router.tsx`: Tesoureiro e Comissão; o Presidente passa sempre.
  // Quem foi desligado cai fora dos dois: a claim `papel` sobrevive à saída — ela é a fotografia de
  // quando ele estava na turma —, mas a API já não aceita nada dele além do próprio histórico.
  const ehGestao = !desligadoEm && tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  const ehTesouraria = !desligadoEm && tem(PAPEIS.tesoureiro)
  // As pendências que marcam a porta. Todas passam pelo mesmo critério: zero é o estado normal, e
  // o selo some quando o trabalho é feito. Por isso "Parcelas" e "Adesões" não têm nenhum — numa
  // turma de oitenta pessoas eles nunca zerariam, e número sempre aceso ninguém mais lê.
  const adesaoPendente = useAdesaoPendente(selecionada && !desligadoEm)
  const { data: pendentesDeConferencia } = usePendentesDeConferencia(ehTesouraria)
  const { data: parcelasVencidas } = useParcelasVencidas(selecionada)
  const { data: despesasAtrasadas } = useDespesasAtrasadas(ehTesouraria)
  // Fora do plano: a Gestão vê o item com cadeado, que leva à vitrine da área; o formando não vê o
  // item — quem contrata é a comissão, e para ele seria só uma porta trancada (Sprint 45, P4).
  const { bloqueia } = usePlanoDaTurma()
  const festaTrancada = bloqueia(MODULOS.festa)
  const muralTrancado = bloqueia(MODULOS.mural)

  return (
    // Três faixas: logo e rodapé presos, e só o miolo rola. `min-h-0` no miolo porque, sem ele, um
    // filho de flex não encolhe abaixo do próprio conteúdo — e o menu comprido empurraria o rodapé
    // para fora da tela, que é justamente o que não pode acontecer com o "Sair".
    <div className="flex h-full flex-col gap-4 px-3 py-4">
      {/* A logo leva ao início, como em quase todo produto. Sem formatura na sessão não há para
          onde ir, e aí ela é só a marca. */}
      <div className={cn('shrink-0 px-3', !comLogo && 'hidden')}>
        {selecionada || noPainel ? (
          <Link
            to={selecionada ? ROTAS.inicio : ROTAS.painelVisaoGeral}
            onClick={aoNavegar}
            aria-label="Kapa — início"
            className="focus-visible:ring-ring inline-block rounded-md hover:opacity-85 focus-visible:ring-2 focus-visible:outline-none"
          >
            <LogoKapa className="text-foreground h-9" />
          </Link>
        ) : (
          <LogoKapa className="text-foreground h-9" />
        )}
      </div>

      {selecionada ? (
        <nav
          aria-label="Principal"
          className="rolagem-discreta grid min-h-0 flex-1 content-start gap-4 overflow-y-auto"
        >
          {/* Não há item "Início": quem leva para lá é a logo, como em Linear, Notion e GitHub. Um
              item a mais para o mesmo lugar só encurta a lista de quem tem dezessete. */}

          {/* O termo e os convites continuam pessoais. Parcelas e Pedidos têm um só item cada:
              a Gestão abre a lista da turma e o formando abre a própria lista. */}
          {desligadoEm ? (
            /* Quem saiu fica com o que é dele e mais nada: é o mesmo recorte de
               `LEITURAS_DO_DESLIGADO` e da política `TitularDoProprioHistorico`. Mostrar o menu
               inteiro seria oferecer dez portas que respondem 403. */
            <Meu
              aoNavegar={aoNavegar}
              adesaoPendente={false}
              parcelasVencidas={undefined}
              mostrarPedidos={false}
              mostrarConvites={false}
            />
          ) : ehGestao ? (
            <>
              <Meu
                aoNavegar={aoNavegar}
                adesaoPendente={adesaoPendente}
                parcelasVencidas={parcelasVencidas}
                mostrarParcelas={false}
                mostrarPedidos={false}
                convitesTrancados={festaTrancada}
              />

              <Secao titulo="Cobrança">
                {/* Mesmo recorte da rota: a Tesouraria confere e monta o plano; a Comissão consulta
                    as parcelas e lê o histórico do que já foi enviado. */}
                {ehTesouraria ? (
                  <ItemDeMenu
                    to={ROTAS.conferencia}
                    icone={BadgeCheck}
                    aoNavegar={aoNavegar}
                    sinal={pendentesDeConferencia}
                    rotuloDoSinal="a conferir"
                  >
                    Conferir
                  </ItemDeMenu>
                ) : null}
                <ItemDeMenu
                  to={ROTAS.parcelas}
                  icone={ReceiptText}
                  aoNavegar={aoNavegar}
                  sinal={parcelasVencidas}
                  rotuloDoSinal="minhas vencidas"
                >
                  Parcelas
                </ItemDeMenu>
                {/* Item próprio por causa de quem não é tesouraria: o Plano é tela de tesouraria, e
                    sem esta a comissão ficaria sem lugar para responder ao formando que diz "pedi e
                    não apareceu". Os opcionais em si ficam num cartão da tela de Plano. */}
                <ItemDeMenu to={ROTAS.pedidos} icone={ShoppingBag} aoNavegar={aoNavegar} secao>
                  Pedidos
                </ItemDeMenu>
                <ItemDeMenu
                  to={ROTAS.comprasDaLoja}
                  icone={Store}
                  aoNavegar={aoNavegar}
                  trancado={festaTrancada}
                >
                  Loja
                </ItemDeMenu>
                {ehTesouraria ? (
                  <ItemDeMenu to={ROTAS.cobrancas} icone={Coins} aoNavegar={aoNavegar}>
                    Plano
                  </ItemDeMenu>
                ) : null}
              </Secao>

              <DinheiroDaTurma
                aoNavegar={aoNavegar}
                comRelatorios
                relatoriosTrancados={bloqueia(MODULOS.relatorios)}
                despesasAtrasadas={despesasAtrasadas}
              />

              <Secao titulo="Turma">
                <ItemDeMenu to={ROTAS.membros} icone={Users} aoNavegar={aoNavegar} secao>
                  Membros
                </ItemDeMenu>
                <ItemDeMenu to={ROTAS.agenda} icone={CalendarDays} aoNavegar={aoNavegar} secao>
                  Agenda
                </ItemDeMenu>
                <ItemDeMenu
                  to={ROTAS.festa}
                  icone={PartyPopper}
                  aoNavegar={aoNavegar}
                  trancado={muralTrancado}
                >
                  Festa
                </ItemDeMenu>
                <ItemDeMenu
                  to={ROTAS.portaria}
                  icone={DoorOpen}
                  aoNavegar={aoNavegar}
                  trancado={festaTrancada}
                >
                  Portaria
                </ItemDeMenu>
                <ItemDeMenu to={ROTAS.mural} icone={Megaphone} aoNavegar={aoNavegar} trancado={muralTrancado}>
                  Mural
                </ItemDeMenu>
              </Secao>
            </>
          ) : (
            <>
              <Meu
                aoNavegar={aoNavegar}
                adesaoPendente={adesaoPendente}
                parcelasVencidas={parcelasVencidas}
                mostrarConvites={!festaTrancada}
              />

              {/* O que não pode se perder na rolagem do grupo, e a turma que ele lê sem administrar. */}
              <Secao titulo="A turma">
                <ItemDeMenu to={ROTAS.agenda} icone={CalendarDays} aoNavegar={aoNavegar} secao>
                  Agenda
                </ItemDeMenu>
                {muralTrancado ? null : (
                  <>
                    <ItemDeMenu to={ROTAS.festa} icone={PartyPopper} aoNavegar={aoNavegar}>
                      Festa
                    </ItemDeMenu>
                    <ItemDeMenu to={ROTAS.mural} icone={Megaphone} aoNavegar={aoNavegar}>
                      Mural
                    </ItemDeMenu>
                  </>
                )}
              </Secao>

              <DinheiroDaTurma aoNavegar={aoNavegar} />
            </>
          )}
        </nav>
      ) : noPainel ? (
        /* O menu do painel do Kapa (Sprint 44): quem é da Kapa não vê a gestão das turmas (D4) — entra
           numa turma pelo painel, e só para ler. Exibição só; quem recusa é a API. */
        <nav aria-label="Painel do Kapa" className="grid content-start gap-4">
          <Secao titulo="Painel do Kapa">
            {MENU_DO_PAINEL.map(({ rotulo, para, icone, secao }) => (
              <ItemDeMenu key={para} to={para} icone={icone} aoNavegar={aoNavegar} secao={secao}>
                {rotulo}
              </ItemDeMenu>
            ))}
          </Secao>
        </nav>
      ) : null}

      {/* O rodapé é a zona presa embaixo, fora da lista que se percorre todo dia: o plano
          contratado e a porta de sair — que nunca pode depender de rolagem. */}
      <div className="mt-auto grid shrink-0 gap-px">
        {papel ? <PapelNaTurma papel={papel} /> : null}
        {selecionada && ehGestao ? <PlanoDaTurma aoNavegar={aoNavegar} /> : null}

        <button
          type="button"
          disabled={sair.isPending}
          onClick={() => sair.mutate()}
          className={estiloDoItem(false)}
        >
          <LogOut strokeWidth={1.75} aria-hidden />
          Sair
        </button>

        {/* A pergunta "qual versão você está vendo?" aparece em todo atendimento. */}
        <p className="text-texto-muted px-3 pt-3 text-xs">
          {env.VITE_APP_NOME} {__VERSAO__}
        </p>
      </div>
    </div>
  )
}
