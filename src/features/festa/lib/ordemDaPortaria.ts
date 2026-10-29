import type { ConviteNaPortaria } from '../types/convites.types'

/** Vem depois de qualquer letra: o convite sem nome vai para o fim da ordem crescente, como na ordem da API. */
const SEM_NOME = '￿'

/**
 * O que cada coluna ordenável da lista da portaria compara. Sem escolha vale a ordem da API: válidos antes dos
 * revogados, por nome, com os sem nome no fim.
 */
export const CHAVES_DA_PORTARIA: Record<string, (convite: ConviteNaPortaria) => string> = {
  nome: (convite) => convite.nome_do_convidado ?? SEM_NOME,
  codigo: (convite) => convite.codigo,
}
