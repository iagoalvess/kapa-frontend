import {
  ClipboardList,
  CreditCard,
  Crown,
  GraduationCap,
  House,
  IdCard,
  KeyRound,
  LogOut,
  type LucideIcon,
  ShieldCheck,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { LogoKapa } from '@/components/layout/LogoKapa'
import { env } from '@/config/env'
import { PAPEIS, type Papel, ROTULOS_DE_PAPEL } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useSair } from '@/features/auth'
import { useFormaturaAtiva, usePapel } from '@/hooks/useSessao'
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

function ItemDeMenu({
  to,
  icone: Icone,
  aoNavegar,
  children,
}: {
  to: string
  icone: LucideIcon
  aoNavegar?: () => void
  children: ReactNode
}) {
  return (
    <NavLink to={to} end onClick={aoNavegar} className={({ isActive }) => estiloDoItem(isActive)}>
      <Icone strokeWidth={1.75} aria-hidden />
      {children}
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

  return (
    <div className="flex h-full flex-col gap-6 px-3 py-5">
      <div className="px-3">
        <LogoKapa className="text-foreground h-11" />
      </div>

      {selecionada ? (
        <nav aria-label="Principal" className="grid gap-6">
          <Secao titulo="Formatura">
            <ItemDeMenu to={ROTAS.inicio} icone={House} aoNavegar={aoNavegar}>
              Início
            </ItemDeMenu>
            <ItemDeMenu to={ROTAS.dadosDaFormatura} icone={GraduationCap} aoNavegar={aoNavegar}>
              Dados da turma
            </ItemDeMenu>
            <ItemDeMenu to={ROTAS.meuCadastro} icone={IdCard} aoNavegar={aoNavegar}>
              Meu cadastro
            </ItemDeMenu>
          </Secao>

          {/* Mesmo recorte da rota em `router.tsx`: Tesoureiro e Comissão; o Presidente passa sempre. */}
          {tem(PAPEIS.tesoureiro, PAPEIS.comissao) ? (
            <Secao titulo="Gestão">
              <ItemDeMenu to={ROTAS.membros} icone={Users} aoNavegar={aoNavegar}>
                Membros
              </ItemDeMenu>
              <ItemDeMenu to={ROTAS.formandos} icone={ClipboardList} aoNavegar={aoNavegar}>
                Formandos
              </ItemDeMenu>
              <ItemDeMenu to={ROTAS.convites} icone={UserPlus} aoNavegar={aoNavegar}>
                Convites
              </ItemDeMenu>
              <ItemDeMenu to={ROTAS.assinatura} icone={CreditCard} aoNavegar={aoNavegar}>
                Assinatura
              </ItemDeMenu>
            </Secao>
          ) : null}
        </nav>
      ) : null}

      <div className="mt-auto grid gap-1">
        {/* Mesma forma dos itens, sem hover: é informação, não link. */}
        {papel ? <PapelNaTurma papel={papel} /> : null}
        <ItemDeMenu to={ROTAS.alterarSenha} icone={KeyRound} aoNavegar={aoNavegar}>
          Alterar senha
        </ItemDeMenu>
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
