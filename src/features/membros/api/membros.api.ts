import type { Papel } from '@/config/perfis'
import { api } from '@/lib/http/cliente'
import type { Pagina } from '@/types/paginacao'
import type { ContagemDeMembros, FiltroDeMembros, MembroDaFormatura } from '../types/membros.types'

// `atual`, e não o id: a formatura vem do token, nunca de um valor que o cliente escolhe.
const BASE = '/api/v1/formaturas/atual/membros'

/** Uma página dos vínculos da formatura selecionada. */
export function listarMembros(filtro: FiltroDeMembros, signal?: AbortSignal) {
  return api.get<Pagina<MembroDaFormatura>>(BASE, {
    query: {
      pagina: filtro.pagina,
      tamanho: filtro.tamanho,
      busca: filtro.busca,
      ativo: filtro.ativo,
      papel: filtro.papel,
    },
    signal,
  })
}

/** Quantos membros a formatura tem em cada papel e situação. */
export function resumirMembros(signal?: AbortSignal) {
  return api.get<ContagemDeMembros[]>(`${BASE}/resumo`, { signal })
}

/** Troca o papel de um membro. Só o Presidente. */
export function alterarPapel({ usuarioId, papel }: { usuarioId: string; papel: Papel }) {
  return api.put<void>(`${BASE}/${usuarioId}/papel`, { body: { papel } })
}

/** Desativa o vínculo de um membro, preservando o histórico dele. Só o Presidente. */
export function removerMembro(usuarioId: string) {
  return api.delete<void>(`${BASE}/${usuarioId}`)
}
