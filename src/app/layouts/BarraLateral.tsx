import {
  BadgeCheck,
  BellRing,
  Handshake,
  ClipboardCheck,
  Coins,
  Crown,
  FileSignature,
  FileText,
  FolderOpen,
  GraduationCap,
  LogOut,
  Megaphone,
  type LucideIcon,
  PiggyBank,
  Receipt,
  ReceiptText,
  Send,
  ShieldCheck,
  UserRound,
  Users,
  Wallet,
  WalletMinimal,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { env } from '@/config/env'
import { PAPEIS, type Papel, ROTULOS_DE_PAPEL } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useAdesaoPendente } from '@/features/adesoes'
import { ICONE_DE_PLANO_PADRAO, ICONES_DE_PLANO, useAssinatura } from '@/features/assinaturas'
import { useSair } from '@/features/auth'
import { useDespesasAtrasadas } from '@/features/financeiro'
import { useParcelasVencidas, usePendentesDeConferencia } from '@/features/pagamentos'
import { useFormaturaAtiva, usePapel } from '@/hooks/useSessao'
import { formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'

/** Comissão e Formando repetem os ícones da faixa de membros ("Na comissão", "Formandos"). */
const ICONES_DE_PAPEL: Record<Papel, LucideIcon> = {
  Presidente: Crown,
  Tesoureiro: Wallet,
  Comissao: ShieldCheck,
  Formando: GraduationCap,
}

const formaDoItem =
  'flex h-9 w-full items-center gap-3 rounded-lg px-3 text-[15px] [&_svg]:size-5 [&_svg]:shrink-0'

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
 */
function ItemDeMenu({
  to,
  icone: Icone,
  aoNavegar,
  secao = false,
  sinal,
  rotuloDoSinal = 'pendente',
  children,
}: {
  to: string
  icone: LucideIcon
  aoNavegar?: () => void
  secao?: boolean
  sinal?: number | boolean
  rotuloDoSinal?: string
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
          <SinalDoItem sinal={sinal} ativo={isActive} rotulo={rotuloDoSinal} />
        </>
      )}
    </NavLink>
  )
}

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

/**
 * O plano da turma, embaixo do papel: nome do contratado e, num clique, a vitrine.
 *
 * Só quem é da Gestão monta este item — a rota dos planos e a API da assinatura têm esse mesmo
 * recorte. Sem assinatura (404 de quem ainda não contratou) o item convida a ver os planos.
 *
 * O ícone é o do próprio plano (`ICONES_DE_PLANO`), o mesmo que o card mostra na vitrine: dois
 * desenhos diferentes para a mesma coisa fazem o menu parecer levar a outro lugar.
 */
function PlanoDaTurma({ aoNavegar }: { aoNavegar?: () => void }) {
  const assinatura = useAssinatura()
  const plano = assinatura.data?.plano

  return (
    <ItemDeMenu
      to={ROTAS.planos}
      icone={(plano ? ICONES_DE_PLANO[plano.codigo] : undefined) ?? ICONE_DE_PLANO_PADRAO}
      aoNavegar={aoNavegar}
    >
      {plano ? `Plano ${plano.nome}` : 'Ver planos'}
    </ItemDeMenu>
  )
}

/**
 * O que é da pessoa, e não da turma: o termo dela, as parcelas dela, o cadastro dela.
 *
 * Os três nomes começam com "Meu/Minhas" de propósito: para quem administra, este bloco convive no
 * mesmo menu com "Parcelas" (as da turma inteira) e com "Adesões" (as de todo mundo), e sem o
 * possessivo os dois pares ficam indistinguíveis.
 *
 * Fica no topo para o formando e no fim para quem administra: para um, é o produto; para o outro,
 * é o canto pessoal, ao lado do papel e do "Sair".
 */
function Meu({
  aoNavegar,
  adesaoPendente,
  parcelasVencidas,
}: {
  aoNavegar?: () => void
  adesaoPendente: boolean
  parcelasVencidas?: number
}) {
  return (
    <Secao titulo="Meu">
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
      {/* Todo membro paga: o extrato e o PIX de cada parcela. O número é o que já venceu e ele
          ainda não avisou — a única pendência da tela que corre juros enquanto espera. */}
      <ItemDeMenu
        to={ROTAS.extrato}
        icone={WalletMinimal}
        aoNavegar={aoNavegar}
        secao
        sinal={parcelasVencidas}
        rotuloDoSinal="vencidas"
      >
        Minhas parcelas
      </ItemDeMenu>
      {/* Também se chega por aqui, e não só pelo avatar: era a única tela pessoal sem porta no menu. */}
      <ItemDeMenu to={ROTAS.meuCadastro} icone={UserRound} aoNavegar={aoNavegar}>
        Meus dados
      </ItemDeMenu>
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
 * @param comFornecedores O cadastro de fornecedor é da Tesouraria.
 * @param comRelatorios Balancete e exportações são da Gestão.
 * @param despesasAtrasadas Só a Tesouraria recebe o número: para quem não paga despesa, ele não é
 *   ação nenhuma — é a conta da turma exposta como se fosse cobrança.
 */
function DinheiroDaTurma({
  aoNavegar,
  comFornecedores,
  comRelatorios = false,
  despesasAtrasadas,
}: {
  aoNavegar?: () => void
  comFornecedores: boolean
  comRelatorios?: boolean
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
      {comFornecedores ? (
        <ItemDeMenu to={ROTAS.fornecedores} icone={Handshake} aoNavegar={aoNavegar} secao>
          Fornecedores
        </ItemDeMenu>
      ) : null}
      {comRelatorios ? (
        <ItemDeMenu to={ROTAS.relatorios} icone={FileText} aoNavegar={aoNavegar}>
          Relatórios
        </ItemDeMenu>
      ) : null}
    </Secao>
  )
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div className="grid gap-1">
      <p className="text-texto-muted px-3 pb-1 text-[13px]">{titulo}</p>
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
 * @param aoNavegar Chamado ao clicar num link — é o que fecha a gaveta no celular.
 */
export function BarraLateral({ aoNavegar }: { aoNavegar?: () => void }) {
  const { papel, tem } = usePapel()
  const { selecionada } = useFormaturaAtiva()
  const sair = useSair()
  // Mesmo recorte das rotas em `router.tsx`: Tesoureiro e Comissão; o Presidente passa sempre.
  const ehGestao = tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  const ehTesouraria = tem(PAPEIS.tesoureiro)
  // As pendências que marcam a porta. Todas passam pelo mesmo critério: zero é o estado normal, e
  // o selo some quando o trabalho é feito. Por isso "Parcelas" e "Adesões" não têm nenhum — numa
  // turma de oitenta pessoas eles nunca zerariam, e número sempre aceso ninguém mais lê.
  const adesaoPendente = useAdesaoPendente()
  const { data: pendentesDeConferencia } = usePendentesDeConferencia(ehTesouraria)
  const { data: parcelasVencidas } = useParcelasVencidas()
  const { data: despesasAtrasadas } = useDespesasAtrasadas(ehTesouraria)

  return (
    // Três faixas: logo e rodapé presos, e só o miolo rola. `min-h-0` no miolo porque, sem ele, um
    // filho de flex não encolhe abaixo do próprio conteúdo — e o menu comprido empurraria o rodapé
    // para fora da tela, que é justamente o que não pode acontecer com o "Sair".
    <div className="flex h-full flex-col gap-6 px-3 py-5">
      {/* A logo leva ao início, como em quase todo produto. Sem formatura na sessão não há para
          onde ir, e aí ela é só a marca. */}
      <div className="shrink-0 px-3">
        {selecionada ? (
          <Link
            to={ROTAS.inicio}
            onClick={aoNavegar}
            aria-label="Kapa — início"
            className="focus-visible:ring-ring inline-block rounded-md hover:opacity-85 focus-visible:ring-2 focus-visible:outline-none"
          >
            <LogoKapa className="text-foreground h-11" />
          </Link>
        ) : (
          <LogoKapa className="text-foreground h-11" />
        )}
      </div>

      {selecionada ? (
        <nav
          aria-label="Principal"
          className="rolagem-discreta grid min-h-0 flex-1 content-start gap-6 overflow-y-auto"
        >
          {/* Não há item "Início": quem leva para lá é a logo, como em Linear, Notion e GitHub. Um
              item a mais para o mesmo lugar só encurta a lista de quem tem dezessete. */}

          {/* Para quem administra, o trabalho do dia vem antes do que é dele: a fila de conferência
              e as parcelas se abrem toda semana, e antes desta ordem elas eram o 13º e o 14º item,
              atrás de "Formatura", que se edita uma vez na vida. O bloco "Meu" desce para o fim.
              Para o formando é o contrário, e ele está logo abaixo. */}
          {ehGestao ? (
            <>
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
                <ItemDeMenu to={ROTAS.parcelas} icone={ReceiptText} aoNavegar={aoNavegar}>
                  Parcelas
                </ItemDeMenu>
                {ehTesouraria ? (
                  <ItemDeMenu to={ROTAS.cobrancas} icone={Coins} aoNavegar={aoNavegar}>
                    Plano
                  </ItemDeMenu>
                ) : null}
                {/* Um item por pessoa, e não dois: quem escreve a régua chega aos avisos enviados
                    pelo botão da própria tela, e a Comissão — que lê o histórico e não edita a
                    régua — chega direto. */}
                {ehTesouraria ? (
                  <ItemDeMenu to={ROTAS.regua} icone={BellRing} aoNavegar={aoNavegar}>
                    Lembretes
                  </ItemDeMenu>
                ) : (
                  <ItemDeMenu to={ROTAS.avisosEnviados} icone={Send} aoNavegar={aoNavegar}>
                    Avisos enviados
                  </ItemDeMenu>
                )}
              </Secao>

              <DinheiroDaTurma
                aoNavegar={aoNavegar}
                comFornecedores={ehTesouraria}
                comRelatorios
                despesasAtrasadas={despesasAtrasadas}
              />

              <Secao titulo="Turma">
                <ItemDeMenu to={ROTAS.membros} icone={Users} aoNavegar={aoNavegar} secao>
                  Membros
                </ItemDeMenu>
                <ItemDeMenu to={ROTAS.adesoes} icone={ClipboardCheck} aoNavegar={aoNavegar}>
                  Adesões
                </ItemDeMenu>
                <ItemDeMenu to={ROTAS.mural} icone={Megaphone} aoNavegar={aoNavegar} secao>
                  Mural
                </ItemDeMenu>
                <ItemDeMenu to={ROTAS.documentos} icone={FolderOpen} aoNavegar={aoNavegar}>
                  Documentos
                </ItemDeMenu>
                <ItemDeMenu to={ROTAS.formatura} icone={GraduationCap} aoNavegar={aoNavegar}>
                  Dados da formatura
                </ItemDeMenu>
              </Secao>

              <Meu
                aoNavegar={aoNavegar}
                adesaoPendente={adesaoPendente}
                parcelasVencidas={parcelasVencidas}
              />
            </>
          ) : (
            <>
              <Meu
                aoNavegar={aoNavegar}
                adesaoPendente={adesaoPendente}
                parcelasVencidas={parcelasVencidas}
              />

              {/* O que não pode se perder na rolagem do grupo, e a turma que ele lê sem administrar. */}
              <Secao titulo="A turma">
                <ItemDeMenu to={ROTAS.mural} icone={Megaphone} aoNavegar={aoNavegar} secao>
                  Mural
                </ItemDeMenu>
                <ItemDeMenu to={ROTAS.documentos} icone={FolderOpen} aoNavegar={aoNavegar}>
                  Documentos
                </ItemDeMenu>
                <ItemDeMenu to={ROTAS.formatura} icone={GraduationCap} aoNavegar={aoNavegar}>
                  Dados da formatura
                </ItemDeMenu>
              </Secao>

              <DinheiroDaTurma aoNavegar={aoNavegar} comFornecedores={false} />
            </>
          )}
        </nav>
      ) : null}

      <div className="mt-auto grid shrink-0 gap-1">
        {/* Mesma forma dos itens, sem hover: é informação, não link. */}
        {papel ? <PapelNaTurma papel={papel} /> : null}
        {selecionada && tem(PAPEIS.tesoureiro, PAPEIS.comissao) ? (
          <PlanoDaTurma aoNavegar={aoNavegar} />
        ) : null}
        {/* "Alterar senha" saiu daqui: é da conta, e vive no cartão do próprio cadastro. */}
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
