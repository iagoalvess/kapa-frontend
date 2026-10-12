import { api } from '@/lib/http/cliente'
import type { CondicaoDaPessoa, DadosDaCondicao, PessoaDaCondicao } from '../types/adesoes.types'

const BASE = '/api/v1/cobrancas/condicoes'

/** O membro vai pela rota; o convidado, pelo e-mail na query. */
const enderecoDe = (pessoa: PessoaDaCondicao) =>
  'usuario_id' in pessoa
    ? { caminho: `${BASE}/membros/${pessoa.usuario_id}`, query: {} }
    : { caminho: `${BASE}/convidados`, query: { email: pessoa.email } }

/** O desconto ou a isenção da pessoa (Sprint 54). Gestão. */
export function obterCondicao(pessoa: PessoaDaCondicao, signal?: AbortSignal) {
  const { caminho, query } = enderecoDe(pessoa)
  return api.get<CondicaoDaPessoa>(caminho, { query, signal })
}

/** Concede ou altera. Tesouraria. O que a pessoa já aceitou não muda. */
export function salvarCondicao({ pessoa, dados }: { pessoa: PessoaDaCondicao; dados: DadosDaCondicao }) {
  const { caminho, query } = enderecoDe(pessoa)
  return api.put<CondicaoDaPessoa>(caminho, { query, body: dados })
}

/** Revoga. Tesouraria. O que a pessoa já aceitou continua valendo. */
export function removerCondicao(pessoa: PessoaDaCondicao) {
  const { caminho, query } = enderecoDe(pessoa)
  return api.delete<void>(caminho, { query })
}
