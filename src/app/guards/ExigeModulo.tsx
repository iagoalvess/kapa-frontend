import { Outlet } from 'react-router'
import { AreaBloqueada } from '@/components/AreaBloqueada'
import { EsqueletoDeCartao } from '@/components/Esqueleto'
import type { Modulo } from '@/config/planos'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'

/**
 * Restringe um ramo de rotas às turmas cujo plano inclui o módulo (Sprint 45).
 *
 * Diferente de `ExigePapel`, não redireciona: a área existe, só não foi contratada — e o que a turma
 * precisa ver ali é o que ela faz e como liberar, na {@link AreaBloqueada}. A página não monta enquanto o
 * plano não chega, para nenhuma consulta dela sair e voltar 403. Navegação, não segurança: quem recusa é
 * `[ExigeModulo]` na API.
 *
 * @param modulo O módulo que as rotas do ramo exigem.
 */
export function ExigeModulo({ modulo }: { modulo: Modulo }) {
  const { carregando, bloqueia } = usePlanoDaTurma()

  if (carregando) return <EsqueletoDeCartao className="h-80 overflow-hidden" />
  if (bloqueia(modulo)) return <AreaBloqueada modulo={modulo} />

  return <Outlet />
}
