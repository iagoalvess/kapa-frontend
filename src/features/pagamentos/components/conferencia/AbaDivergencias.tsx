import type { UseQueryResult } from '@tanstack/react-query'
import mascoteFeliz from '@/assets/mascote/feliz.webp'
import { ColunaOrdenavel, type Ordenacao, Planilha } from '@/components/Planilha'
import type { Pagina } from '@/types/paginacao'
import type { Divergencia } from '../../types/pagamentos.types'
import { LinhaDeDivergencia } from './LinhaDeDivergencia'

interface PropsDaAbaDivergencias {
  consulta: UseQueryResult<Pagina<Divergencia>>
  ordenacao: Ordenacao
  filtrando: boolean
  aoMudarPagina: (pagina: number) => void
}

/** As baixas que não bateram com o devido. É registro: não há o que marcar nem confirmar. */
export function AbaDivergencias({ consulta, ordenacao, filtrando, aoMudarPagina }: PropsDaAbaDivergencias) {
  return (
    <Planilha
      rotulo="Divergências"
      consulta={consulta}
      vazio={{
        titulo: filtrando ? 'Nenhuma divergência com esses filtros' : 'Nenhuma divergência',
        dica: filtrando
          ? 'Tente outro nome.'
          : 'Tudo certo: nenhum pagamento foi confirmado com valor diferente do esperado.',
        // "Tudo bateu" é a melhor notícia da tela; não se anuncia com cara de procura.
        mascote: filtrando ? undefined : mascoteFeliz,
      }}
      ordenacao={ordenacao}
      cabecalho={
        <>
          <th className="py-3 pr-4 font-normal">Formando</th>
          <ColunaOrdenavel coluna="pago_em">Pagou em</ColunaOrdenavel>
          <ColunaOrdenavel coluna="devido" numerica>
            Devido
          </ColunaOrdenavel>
          <ColunaOrdenavel coluna="recebido" numerica>
            Recebido
          </ColunaOrdenavel>
          {/* A diferença é a subtração das duas colunas, feita na projeção: não ordena. */}
          <th className="py-3 pr-4 font-normal">Diferença</th>
          <ColunaOrdenavel coluna="baixa">Registrado em</ColunaOrdenavel>
        </>
      }
      aoMudarPagina={aoMudarPagina}
    >
      {(consulta.data?.itens ?? []).map((divergencia) => (
        <LinhaDeDivergencia key={divergencia.recebimento_id} divergencia={divergencia} />
      ))}
    </Planilha>
  )
}
