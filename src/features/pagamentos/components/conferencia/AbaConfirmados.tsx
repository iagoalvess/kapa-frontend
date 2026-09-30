import type { UseQueryResult } from '@tanstack/react-query'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import { ColunaOrdenavel, type Ordenacao, Planilha } from '@/components/Planilha'
import type { Pagina } from '@/types/paginacao'
import type { Informe } from '../../types/pagamentos.types'
import { LinhaDeConfirmado } from './LinhaDeConfirmado'

interface PropsDaAbaConfirmados {
  consulta: UseQueryResult<Pagina<Informe>>
  ordenacao: Ordenacao
  aoMudarPagina: (pagina: number) => void
}

/** O que a tesouraria confirmou hoje, com o horário de cada baixa. */
export function AbaConfirmados({ consulta, ordenacao, aoMudarPagina }: PropsDaAbaConfirmados) {
  return (
    <Planilha
      rotulo="Confirmados hoje"
      consulta={consulta}
      vazio={{
        titulo: 'Nada confirmado hoje ainda',
        dica: 'Os pagamentos que você confirmar hoje aparecerão aqui, com o horário de cada confirmação.',
        // Nenhuma busca aconteceu aqui: o dia é que ainda não começou.
        mascote: mascoteChecklist,
      }}
      ordenacao={ordenacao}
      cabecalho={
        <>
          <th className="py-3 pr-4 font-normal">Formando</th>
          <ColunaOrdenavel coluna="pago_em">Pagou em</ColunaOrdenavel>
          <ColunaOrdenavel coluna="recebido" numerica>
            Recebido
          </ColunaOrdenavel>
          <ColunaOrdenavel coluna="conferido">Conferido</ColunaOrdenavel>
        </>
      }
      aoMudarPagina={aoMudarPagina}
    >
      {(consulta.data?.itens ?? []).map((informe) => (
        <LinhaDeConfirmado key={informe.id} informe={informe} />
      ))}
    </Planilha>
  )
}
