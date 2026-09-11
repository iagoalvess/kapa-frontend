import { useSyncExternalStore } from 'react'
import type { Perfil } from '@/config/perfis'
import { PERFIS } from '@/config/perfis'
import { sessao, type EstadoDaSessao } from '@/lib/http/sessao'

/** Estado da sessão, re-renderizando quem usa quando o usuário entra ou sai. */
export function useSessao(): EstadoDaSessao {
  return useSyncExternalStore(sessao.inscrever, sessao.estado, sessao.estado)
}

/**
 * Verificação de perfil para **exibição** — esconder menu, desabilitar botão.
 *
 * O administrador passa em qualquer checagem, como na política do backend. Isto não protege
 * nada: a autorização real é a da API.
 */
export function usePerfil() {
  const { usuario } = useSessao()
  const perfis = usuario?.perfis ?? []

  const ehAdministrador = perfis.includes(PERFIS.administrador)

  return {
    perfis,
    ehAdministrador,
    tem: (perfil: Perfil) => ehAdministrador || perfis.includes(perfil),
  }
}
