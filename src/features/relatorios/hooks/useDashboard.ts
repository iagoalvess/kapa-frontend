import { useQuery } from '@tanstack/react-query'
import { obterDashboardPublico } from '../api/relatorios.api'
import { chaves } from './chaves'

/** O painel de todo membro: caixa, adimplência e no que a turma gastou. */
export function useDashboardPublico() {
  return useQuery({
    queryKey: chaves.dashboardPublico,
    queryFn: ({ signal }) => obterDashboardPublico(signal),
  })
}
