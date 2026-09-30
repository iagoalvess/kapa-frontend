import { Navigate, Outlet } from 'react-router'
import type { Perfil } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { usePerfil } from '@/hooks/useSessao'

/**
 * Restringe um ramo de rotas a quem tem o perfil informado.
 *
 * Só o perfil pedido passa: o administrador não é coringa (D4 da Sprint 44).
 *
 * @param perfil Perfil exigido.
 */
export function ExigePerfil({ perfil }: { perfil: Perfil }) {
  const { tem } = usePerfil()

  if (!tem(perfil)) return <Navigate to={ROTAS.inicio} replace />

  return <Outlet />
}
