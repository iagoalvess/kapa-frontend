import type { UseQueryResult } from '@tanstack/react-query'
import mascoteFeliz from '@/assets/mascote/feliz.webp'
import { Chip } from '@/components/Chip'
import { ColunaOrdenavel, type Ordenacao, Planilha } from '@/components/Planilha'
import type { Pagina } from '@/types/paginacao'
import type { ValorADevolver } from '../../types/pagamentos.types'
import { LinhaDeValorADevolver } from './LinhaDeValorADevolver'

interface PropsDaAbaADevolver {
  consulta: UseQueryResult<Pagina<ValorADevolver>>
  ordenacao: Ordenacao
  filtrando: boolean
  /** Os já devolvidos e fechados, em vez dos que esperam. */
  resolvidos: boolean
  aoAlternarResolvidos: () => void
  aoMudarPagina: (pagina: number) => void
}

/**
 * O dinheiro que entrou e não paga mais nada (Sprint 42): o crédito do pedido cancelado, o que já
 * tinha entrado na parcela cancelada e o pago no Mercado Pago sem parcela. Fica aqui até a comissão
 * resolver — e, enquanto fica, a turma não encerra.
 */
export function AbaADevolver({
  consulta,
  ordenacao,
  filtrando,
  resolvidos,
  aoAlternarResolvidos,
  aoMudarPagina,
}: PropsDaAbaADevolver) {
  return (
    <div className="grid gap-3">
      <div>
        <Chip ativo={resolvidos} onClick={aoAlternarResolvidos}>
          Já resolvidos
        </Chip>
      </div>
      <Planilha
        rotulo={resolvidos ? 'Valores já devolvidos ou resolvidos' : 'Valores a devolver'}
        consulta={consulta}
        vazio={{
          titulo: filtrando
            ? 'Nenhum valor com esses filtros'
            : resolvidos
              ? 'Nada resolvido ainda'
              : 'Nada a devolver',
          dica: filtrando
            ? 'Tente outro nome.'
            : resolvidos
              ? 'As devoluções registradas e os avisos fechados aparecem aqui.'
              : 'Crédito de pedido, pagamento de parcela cancelada e pagamento sem parcela aparecem aqui até a comissão resolver.',
          mascote: filtrando || resolvidos ? undefined : mascoteFeliz,
        }}
        ordenacao={ordenacao}
        cabecalho={
          <>
            <ColunaOrdenavel coluna="formando">Formando</ColunaOrdenavel>
            <th className="py-3 pr-4 font-normal">Origem</th>
            <ColunaOrdenavel coluna="valor" numerica>
              Valor
            </ColunaOrdenavel>
            <ColunaOrdenavel coluna="criado">{resolvidos ? 'Resolvido em' : 'Desde'}</ColunaOrdenavel>
            <th className="py-3 pr-4 font-normal">Situação</th>
          </>
        }
        aoMudarPagina={aoMudarPagina}
      >
        {(consulta.data?.itens ?? []).map((valor) => (
          <LinhaDeValorADevolver key={valor.id} valor={valor} />
        ))}
      </Planilha>
    </div>
  )
}
