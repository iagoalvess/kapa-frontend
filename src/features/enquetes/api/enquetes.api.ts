import { api } from '@/lib/http/cliente'
import type { DadosDaEnquete, EnqueteDetalhe } from '@/types/enquete'

const ENQUETES = '/api/v1/enquetes'

/** Publica uma consulta da turma. */
export const criarEnquete = (dados: DadosDaEnquete) => api.post<EnqueteDetalhe>(ENQUETES, { body: dados })
/** Corrige o cadastro antes dos votos ou adia o prazo. */
export const atualizarEnquete = ({ id, dados }: { id: string; dados: DadosDaEnquete }) =>
  api.put<EnqueteDetalhe>(`${ENQUETES}/${id}`, { body: dados })
/** Envia ou substitui a resposta do próprio titular. */
export const responderEnquete = ({ id, opcoes }: { id: string; opcoes: string[] }) =>
  api.put<void>(`${ENQUETES}/${id}/resposta`, { body: { opcoes } })
/** Retira a resposta enquanto a consulta está aberta. */
export const retirarResposta = (id: string) => api.delete<void>(`${ENQUETES}/${id}/resposta`)
/** Encerra a consulta antecipadamente. */
export const encerrarEnquete = (id: string) => api.post<void>(`${ENQUETES}/${id}/encerrar`)
/** Cancela a consulta preservando seu registro. */
export const cancelarEnquete = (id: string) => api.post<void>(`${ENQUETES}/${id}/cancelar`)
