import type { Papel } from '@/config/perfis'
import { api } from '@/lib/http/cliente'
import { type Pagina, paginacaoNaQuery } from '@/types/paginacao'
import type { ContagemDeMembros, FiltroDeMembros, MembroDaFormatura } from '../types/membros.types'

// `atual`, e não o id: a formatura vem do token, nunca de um valor que o cliente escolhe.
const BASE = '/api/v1/formaturas/atual/membros'

/** Uma página dos vínculos da formatura selecionada, com a completude do cadastro. */
export function listarMembros(filtro: FiltroDeMembros, signal?: AbortSignal) {
  return api.get<Pagina<MembroDaFormatura>>(BASE, {
    query: {
      ...paginacaoNaQuery(filtro),
      busca: filtro.busca,
      ativo: filtro.ativo,
      papel: filtro.papel,
      cadastro: filtro.cadastro,
    },
    signal,
  })
}

/** Quantos membros a formatura tem em cada papel e situação. */
export function resumirMembros(signal?: AbortSignal) {
  return api.get<ContagemDeMembros[]>(`${BASE}/resumo`, { signal })
}

/** Troca o papel de um membro. Só o Presidente. */
export function alterarPapel({ usuario_id, papel }: { usuario_id: string; papel: Papel }) {
  return api.put<void>(`${BASE}/${usuario_id}/papel`, { body: { papel } })
}

/** Desativa o vínculo de um membro, preservando o histórico dele. Só o Presidente. */
export function removerMembro(usuario_id: string) {
  return api.delete<void>(`${BASE}/${usuario_id}`)
}
