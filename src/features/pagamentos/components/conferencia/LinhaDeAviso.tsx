import { X } from 'lucide-react'
import { toast } from 'sonner'
import { AcoesDaLinha } from '@/components/AcoesDaLinha'
import { CampoDeMoeda } from '@/components/CampoDeMoeda'
import { LinhaSelecionavel } from '@/components/LinhaSelecionavel'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { diasAte, formatarCentavos, formatarData, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { rotuloDoMeio } from '@/types/recebimento'
import { useRecusarInforme } from '../../hooks/useInformes'
import { esquemaDaRecusa } from '../../schemas/pagamento.schema'
import type { Informe } from '../../types/pagamentos.types'
import { DialogoDeTexto } from '../DialogoDeTexto'
import { Comprovante } from './Comprovante'
import { Formando } from './Formando'

interface PropsDoAviso {
  informe: Informe
  marcado: boolean
  recebido: number
  aoMarcar: () => void
  aoEditarValor: (centavos: number) => void
  aoRecusar: () => void
}

/**
 * Um aviso na fila: quem pagou, quanto devia, quanto entrou — e as duas saídas, confirmar no lote
 * ou recusar com motivo.
 *
 * O aviso do valor diferente aparece **aqui**, antes de confirmar: depois da baixa a diferença vira
 * divergência, que já não se desfaz por esta tela.
 */
export function LinhaDeAviso({
  informe,
  marcado,
  recebido,
  aoMarcar,
  aoEditarValor,
  aoRecusar,
}: PropsDoAviso) {
  const liberado = useEscritaLiberada()
  const recusar = useRecusarInforme()
  const difere = recebido !== informe.devido_em_centavos
  const dias = Math.max(0, -(diasAte(informe.informado_em) ?? 0))

  return (
    <LinhaSelecionavel selecionada={marcado} aoAlternar={aoMarcar}>
      <Formando parcela={informe.parcela} />

      <td className="py-3 pr-4 whitespace-nowrap">
        {formatarData(informe.pago_em)}
        {/* O meio que o formando avisou fica aqui, e não em coluna própria: é o que a tesouraria
            procura no extrato junto com o dia, e uma coluna a mais empurraria o campo do valor. */}
        <span className="text-texto-muted block text-xs">
          {rotuloDoMeio(informe.meio_escolhido)} ·{' '}
          {dias === 0 ? 'avisou hoje' : `há ${formatarNumero(dias)}d`}
        </span>
      </td>

      <td className="py-3 pr-4 text-right whitespace-nowrap">
        {formatarCentavos(informe.devido_em_centavos)}
      </td>

      {/* Diferente do devido, o próprio campo fica âmbar — é a linha inteira que se lê de relance,
          e um aviso escrito ao lado só faria a coluna crescer. O leitor de tela ouve o mesmo pelo
          texto escondido, que a cor sozinha não alcança. */}
      <td className="py-3 pr-4 text-right">
        <CampoDeMoeda
          value={recebido}
          onChange={aoEditarValor}
          aria-label={`Valor recebido de ${informe.parcela.nome}`}
          // `ml-auto`: o `Input` é `flex`, e caixa de bloco ignora o `text-right` da célula — sem
          // isso o campo encosta na coluna do devido em vez de alinhar com o cabeçalho "Recebido".
          className={cn(
            'ml-auto h-11 w-40 rounded-full px-4 text-right text-base lg:h-8 lg:w-32 lg:text-sm',
            difere && 'border-warning bg-warning-bg text-warning-text',
          )}
        />
        {difere ? <span className="sr-only">Valor diferente do devido.</span> : null}
      </td>

      <td className="py-3 text-right">
        <AcoesDaLinha rotulo={`Ações do aviso de ${informe.parcela.nome}`}>
          <Comprovante informe={informe} />
          <DialogoDeTexto
            gatilho="Recusar"
            gatilhoIcone={{ icone: X, tom: 'perigo' }}
            titulo="Recusar pagamento"
            descricao={`${informe.parcela.nome} recebe o motivo por e-mail, e a parcela continua em aberto.`}
            campo="motivo"
            rotulo="Motivo"
            esquema={esquemaDaRecusa}
            confirmar="Recusar"
            confirmarOcupado="Recusando…"
            ocupado={recusar.isPending}
            desabilitado={!liberado}
            aoEnviar={(motivo, concluir, falhar) =>
              recusar.mutate(
                { informe_id: informe.id, motivo },
                {
                  onSuccess: () => {
                    toast.info('Pagamento recusado. O formando foi avisado por e-mail.')
                    aoRecusar()
                    concluir()
                  },
                  onError: falhar,
                },
              )
            }
          />
        </AcoesDaLinha>
      </td>
    </LinhaSelecionavel>
  )
}
