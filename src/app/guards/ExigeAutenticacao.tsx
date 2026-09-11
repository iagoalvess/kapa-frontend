import { Navigate, Outlet, useLocation } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { useSessao } from '@/hooks/useSessao'

/**
 * Bloqueia o ramo autenticado da aplicação.
 *
 * Guarda cuida de **navegação**, não de segurança: quem protege dado é a API. O caminho
 * pretendido vai no `state` para o login devolver o usuário ao lugar certo.
 */
export function ExigeAutenticacao() {
  const { autenticado } = useSessao()
  const local = useLocation()

  if (!autenticado) {
    return <Navigate to={ROTAS.login} state={{ de: local.pathname + local.search }} replace />
  }

  return <Outlet />
}
