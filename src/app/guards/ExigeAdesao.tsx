import { Navigate, Outlet, useLocation } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { useAdesaoObrigatoria } from '@/features/adesoes'

/**
 * O que o formando sem adesão ainda alcança — a mesma lista curta de exceções da API (`MembroAntesDaAdesao` e
 * `TitularDoProprioHistorico`): o termo, o cadastro que a adesão exige, e o extrato com o pagamento e o recibo.
 */
const LIBERADAS = [ROTAS.adesao, ROTAS.meuCadastro, ROTAS.extrato, ROTAS.recibos]

/**
 * Leva ao termo o formando que ainda não aderiu (Sprint 47, D18): antes do aceite, ele só vê o que está em
 * {@link LIBERADAS}.
 *
 * Navegação, não bloqueio: quem barra o atalho pela URL é a API (`adesao.pendente`). Se a consulta falhar, deixa
 * passar, como `ExigeAceites` — a tela de destino mostra o erro da API. O destino vai no `state`, para o termo
 * devolver a pessoa ao lugar certo depois do aceite.
 */
export function ExigeAdesao() {
  const { carregando, pendente } = useAdesaoObrigatoria()
  const local = useLocation()
  const liberada = LIBERADAS.some((rota) => local.pathname === rota || local.pathname.startsWith(`${rota}/`))

  if (liberada) return <Outlet />

  if (carregando) return null

  if (pendente) return <Navigate to={ROTAS.adesao} state={{ de: local.pathname + local.search }} replace />

  return <Outlet />
}
