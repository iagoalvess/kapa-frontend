import type { PeriodoDoRelatorio } from '../types/relatorios.types'

// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  tudo: ['relatorios'] as const,
  /** O painel de todo membro. */
  dashboardPublico: ['relatorios', 'dashboard', 'publico'] as const,
  balancete: (periodo: PeriodoDoRelatorio) => ['relatorios', 'balancete', periodo] as const,
  /** A fila de PDFs — o `POST` a invalida, e ela se repete enquanto houver algo gerando. */
  solicitacoes: ['relatorios', 'solicitacoes'] as const,
  /** O que os seletores de filtro oferecem. Sem parâmetro: é a turma inteira. */
  opcoesDeFiltro: ['relatorios', 'opcoes-de-filtro'] as const,
}
