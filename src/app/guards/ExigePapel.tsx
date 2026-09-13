import { Navigate, Outlet } from 'react-router'
import type { Papel } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { usePapel } from '@/hooks/useSessao'

/**
 * Restringe um ramo de rotas a quem tem um dos papéis informados na formatura selecionada.
 *
 * O Presidente passa em qualquer um, como na política do backend. Navegação, não segurança: quem
 * recusa o dado é a API.
 *
 * @param papeis Papéis que têm acesso, além do Presidente.
 */
export function ExigePapel({ papeis }: { papeis: Papel[] }) {
  const { tem } = usePapel()

  if (!tem(...papeis)) return <Navigate to={ROTAS.inicio} replace />

  return <Outlet />
}
