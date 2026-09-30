import type { UseQueryResult } from '@tanstack/react-query'
import mascoteFeliz from '@/assets/mascote/feliz.webp'
import { PRIMEIRA_COLUNA_SELECIONAVEL } from '@/components/LinhaSelecionavel'
import { ColunaOrdenavel, type Ordenacao, Planilha } from '@/components/Planilha'
import type { Pagina } from '@/types/paginacao'
import type { Informe } from '../../types/pagamentos.types'
import { LinhaDeAviso } from './LinhaDeAviso'

interface PropsDaAbaConferir {
  consulta: UseQueryResult<Pagina<Informe>>
  ordenacao: Ordenacao
  filtrando: boolean
  marcados: string[]
  recebido: (informe: Informe) => number
  aoMarcar: (informeId: string) => void
  aoEditarValor: (informeId: string, centavos: number) => void
  aoRecusar: (informeId: string) => void
  aoMudarPagina: (pagina: number) => void
}

/**
 * A fila da conferência: os avisos pendentes, cada um com o valor recebido editável e a marca do
 * lote. O que está marcado e o valor corrigido são da página, que os confirma de uma vez.
 */
export function AbaConferir({
  consulta,
  ordenacao,
  filtrando,
  marcados,
  recebido,
  aoMarcar,
  aoEditarValor,
  aoRecusar,
  aoMudarPagina,
}: PropsDaAbaConferir) {
  return (
    <Planilha
      rotulo="Fila da conferência"
      consulta={consulta}
      vazio={{
        titulo: filtrando ? 'Nenhum aviso com esses filtros' : 'Nada a conferir',
        dica: filtrando
          ? 'Tente outro nome ou outro período.'
          : 'Quando um formando avisar que pagou, o aviso aparece aqui.',
        // Fila vazia sem filtro é trabalho em dia, não busca que falhou.
        mascote: filtrando ? undefined : mascoteFeliz,
      }}
      ordenacao={ordenacao}
      cabecalho={
        <>
          {/* "Formando" e "Devido" vêm da parcela, buscada depois por id: não ordenam. */}
          <th className={`${PRIMEIRA_COLUNA_SELECIONAVEL} py-3 pr-4 font-normal`}>Formando</th>
          <ColunaOrdenavel coluna="pago_em">Pagou em</ColunaOrdenavel>
          <th className="py-3 pr-4 text-right font-normal">Devido</th>
          <ColunaOrdenavel coluna="recebido" numerica>
            Recebido
          </ColunaOrdenavel>
        </>
      }
      aoMudarPagina={aoMudarPagina}
    >
      {(consulta.data?.itens ?? []).map((informe) => (
        <LinhaDeAviso
          key={informe.id}
          informe={informe}
          marcado={marcados.includes(informe.id)}
          recebido={recebido(informe)}
          aoMarcar={() => aoMarcar(informe.id)}
          aoEditarValor={(centavos) => aoEditarValor(informe.id, centavos)}
          aoRecusar={() => aoRecusar(informe.id)}
        />
      ))}
    </Planilha>
  )
}
