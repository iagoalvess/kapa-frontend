import { GraduationCap, LayoutDashboard, type LucideIcon, TicketPercent, UsersRound } from 'lucide-react'
import { PERFIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useFormaturaAtiva, usePerfil } from '@/hooks/useSessao'

/** Um destino do painel do Kapa, na barra lateral e na barra de baixo do celular. */
interface DestinoDoPainel {
  rotulo: string
  para: string
  icone: LucideIcon
  /** Aceso também no detalhe: `/painel/turmas/:id` acende "Turmas". */
  secao?: boolean
}

/** O menu do painel (Sprint 44): Visão geral · Turmas · Contas · Cupons (Sprint 51). Sem Equipe (P5). */
export const MENU_DO_PAINEL: readonly DestinoDoPainel[] = [
  { rotulo: 'Visão geral', para: ROTAS.painelVisaoGeral, icone: LayoutDashboard },
  { rotulo: 'Turmas', para: ROTAS.painelTurmas, icone: GraduationCap, secao: true },
  { rotulo: 'Contas', para: ROTAS.painelContas, icone: UsersRound, secao: true },
  { rotulo: 'Cupons', para: ROTAS.painelCupons, icone: TicketPercent },
]

/**
 * A moldura está no painel do Kapa: quem é da Kapa, sem turma na sessão. É o que troca o menu das turmas pelo do
 * painel — o administrador não vê a gestão das turmas (D4).
 *
 * @returns Verdadeiro para o `Administrador` sem formatura selecionada.
 */
export function useNoPainel() {
  const { selecionada } = useFormaturaAtiva()
  const ehDaKapa = usePerfil().tem(PERFIS.administrador)

  return !selecionada && ehDaKapa
}
