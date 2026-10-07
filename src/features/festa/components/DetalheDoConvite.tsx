import { DoorOpen, FileText, NotebookPen, Tag, Ticket, TriangleAlert, UserRound } from 'lucide-react'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Dado, ListaDeDados } from '@/components/ListaDeDados'
import { Button } from '@/components/ui/button'
import { formatarHorario } from '@/lib/formato'
import { type ConviteNaPortaria } from '../types/convites.types'
import { SeloDaSituacao } from './SeloDaSituacao'

interface Props {
  /** O convite aberto ao clicar no convidado da lista; fechado, é `null`. */
  convite: ConviteNaPortaria | null
  /** Se este celular registrou a entrada — entra junto da situação. */
  marcadoSemRede: boolean
  aoFechar: () => void
}

/**
 * O convite da portaria num diálogo, em leitura — a lista fica enxuta para a fila da porta, e o
 * detalhe (situação, motivo, quem entrou e quando) mora aqui.
 *
 * É o desenho da agenda: a tela é uma lista contínua, e não tem coluna de detalhe ao lado — na
 * portaria a coluna lateral é da validação e do evento. Abre pelo clique na linha, como as
 * parcelas acendem a linha escolhida no lote.
 */
export function DetalheDoConvite({ convite, marcadoSemRede, aoFechar }: Props) {
  const revogado = convite?.situacao === 'Revogado'

  return (
    <DialogoDeFormulario
      aberto={!!convite}
      aoFechar={aoFechar}
      titulo={convite?.nome_do_convidado ?? 'Convidado a definir'}
      descricao={convite ? `Convite ${convite.codigo}` : ''}
      largura="medio"
    >
      {convite ? (
        <div className="grid gap-5">
          <ListaDeDados>
            <Dado icone={Tag} rotulo="Situação">
              <span className="flex flex-wrap items-center gap-2">
                <SeloDaSituacao situacao={convite.situacao} marcadoSemRede={marcadoSemRede} />
                {revogado && convite.motivo_da_revogacao ? (
                  <span className="text-danger-text font-normal">{convite.motivo_da_revogacao}</span>
                ) : null}
              </span>
            </Dado>
            <Dado icone={Ticket} rotulo="Convite">
              <span className="font-mono">{convite.codigo}</span>
            </Dado>
            <Dado icone={UserRound} rotulo="Convidado de">
              {convite.convidado_de ? `convidado de ${convite.convidado_de}` : 'cortesia da turma'}
            </Dado>
            <Dado icone={FileText} rotulo="Documento">
              {convite.documento ?? 'Ainda sem documento'}
            </Dado>
            <Dado icone={DoorOpen} rotulo="Entrada">
              {convite.entrada
                ? `Entrou às ${formatarHorario(convite.entrada.validado_em)}, por ${convite.entrada.validado_por}`
                : 'Ainda não entrou'}
            </Dado>
            {convite.observacoes ? (
              <Dado icone={NotebookPen} rotulo="Observações">
                <span className="whitespace-pre-line">{convite.observacoes}</span>
              </Dado>
            ) : null}
          </ListaDeDados>

          {convite.entrou_sem_rede_duas_vezes ? (
            <p
              role="alert"
              className="bg-warning-bg text-warning-text flex items-start gap-2 rounded-xl p-4 text-sm"
            >
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />O mesmo convite foi deixado
              entrar em dois celulares sem internet. Confira se era a mesma pessoa — o convite pode estar com
              quem não devia.
            </p>
          ) : null}

          <div className="ml-auto">
            <Button type="button" variant="outline" onClick={aoFechar}>
              Fechar
            </Button>
          </div>
        </div>
      ) : null}
    </DialogoDeFormulario>
  )
}
