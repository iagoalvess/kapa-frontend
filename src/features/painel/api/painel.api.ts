import { api } from '@/lib/http/cliente'
import type { Pagina, PaginacaoRequest } from '@/types/paginacao'
import { paginacaoNaQuery } from '@/types/paginacao'
import type {
  AcaoNaConta,
  AnalyticsDaPlataforma,
  ContaNoPainel,
  FiltroDeContas,
  FiltroDeTurmas,
  MembroNoSuporte,
  MesDaPlataforma,
  ModoDeEstorno,
  TurmaNoPainel,
  TurmaNoSuporte,
  UsuarioNoSuporte,
} from '../types/painel.types'

const ADMIN = '/api/v1/admin'
const SUPORTE = `${ADMIN}/suporte`

/** Contas, turmas, dinheiro e uso no período. Sem período, a API usa os últimos 30 dias. */
export function obterAnalytics(periodo: { de?: string; ate?: string }, signal?: AbortSignal) {
  return api.get<AnalyticsDaPlataforma>(`${ADMIN}/analytics`, { query: periodo, signal })
}

/** Cadastros, turmas novas e recebido do Kapa, mês a mês, terminando no mês corrente. */
export function obterSerieMensal(meses: number, signal?: AbortSignal) {
  return api.get<MesDaPlataforma[]>(`${ADMIN}/analytics/serie`, { query: { meses }, signal })
}

/** Uma página das turmas, com a licença de cada uma. */
export function listarTurmas({ termo, licenca, ...paginacao }: FiltroDeTurmas, signal?: AbortSignal) {
  return api.get<Pagina<TurmaNoPainel>>(`${SUPORTE}/turmas`, {
    query: { termo, licenca, ...paginacaoNaQuery(paginacao) },
    signal,
  })
}

/** Uma página das contas. */
export function listarContas({ termo, situacao, ...paginacao }: FiltroDeContas, signal?: AbortSignal) {
  return api.get<Pagina<ContaNoPainel>>(`${SUPORTE}/contas`, {
    query: { termo, situacao, ...paginacaoNaQuery(paginacao) },
    signal,
  })
}

/** A turma: situação, licença, pagamentos do plano e as contagens. */
export function obterTurmaNoSuporte(id: string, signal?: AbortSignal) {
  return api.get<TurmaNoSuporte>(`${SUPORTE}/formaturas/${id}`, { signal })
}

/** Uma página dos membros da turma, ativos primeiro. O CPF vem mascarado. */
export function listarMembros(id: string, paginacao: PaginacaoRequest, signal?: AbortSignal) {
  return api.get<Pagina<MembroNoSuporte>>(`${SUPORTE}/formaturas/${id}/membros`, {
    query: paginacaoNaQuery(paginacao),
    signal,
  })
}

/** Ativa a licença à mão — o pagamento entrou e o webhook se perdeu. */
export function ativarAssinatura(id: string) {
  return api.post<TurmaNoSuporte>(`${SUPORTE}/formaturas/${id}/ativar-assinatura`)
}

/** Estorna um pagamento do plano e encerra a assinatura na hora (P7). Devolve a turma atualizada. */
export function estornarPagamento(id: string, cobrancaId: string, modo: ModoDeEstorno) {
  return api.post<TurmaNoSuporte>(`${SUPORTE}/formaturas/${id}/pagamentos/${cobrancaId}/estornar`, {
    body: { modo },
  })
}

/** A planilha (.xlsx) dos pagamentos do plano confirmados no mês — a base da nota fiscal manual (P6). */
export function baixarPagamentosDoMes(ano: number, mes: number) {
  return api.get<Blob>(`${SUPORTE}/pagamentos`, { query: { ano, mes }, resposta: 'blob' })
}

/** A conta: acesso, bloqueio e em que turmas a pessoa está. */
export function obterContaNoSuporte(id: string, signal?: AbortSignal) {
  return api.get<UsuarioNoSuporte>(`${SUPORTE}/usuarios/${id}`, { signal })
}

/** Reenvia confirmação, dispara redefinição de senha ou levanta o bloqueio. */
export function executarNaConta(id: string, acao: AcaoNaConta) {
  return api.post<void>(`${SUPORTE}/usuarios/${id}/${acao}`)
}
