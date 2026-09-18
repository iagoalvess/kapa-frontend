import { api } from '@/lib/http/cliente'
import type { AcaoNaConta, ResultadoDaBusca, TurmaNoSuporte, UsuarioNoSuporte } from '../types/suporte.types'

const SUPORTE = '/api/v1/admin/suporte'

/** Procura turma e conta pelo mesmo termo. Menos de três letras volta vazio. */
export function buscarNoSuporte(termo: string, signal?: AbortSignal) {
  return api.get<ResultadoDaBusca>(`${SUPORTE}/busca`, { query: { termo }, signal })
}

/** A turma: situação, licença, membros e as contagens. */
export function obterTurmaNoSuporte(id: string, signal?: AbortSignal) {
  return api.get<TurmaNoSuporte>(`${SUPORTE}/formaturas/${id}`, { signal })
}

/** Ativa a licença à mão — o pagamento entrou e o webhook se perdeu. */
export function ativarAssinatura(id: string) {
  return api.post<TurmaNoSuporte>(`${SUPORTE}/formaturas/${id}/ativar-assinatura`)
}

/** A conta: acesso, bloqueio e em que turmas a pessoa está. */
export function obterContaNoSuporte(id: string, signal?: AbortSignal) {
  return api.get<UsuarioNoSuporte>(`${SUPORTE}/usuarios/${id}`, { signal })
}

/** Reenvia confirmação, dispara redefinição de senha ou levanta o bloqueio. */
export function executarNaConta(id: string, acao: AcaoNaConta) {
  return api.post<void>(`${SUPORTE}/usuarios/${id}/${acao}`)
}
