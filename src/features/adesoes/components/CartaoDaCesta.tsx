import { X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { AcoesDaLinha } from '@/components/AcoesDaLinha'
import { Cartao } from '@/components/Cartao'
import { DialogoDeTexto } from '@/components/DialogoDeTexto'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { formatarCentavos, formatarData } from '@/lib/formato'
import { beneficiosPorExtenso, cancelavelHoje, rotuloDoItem } from '@/types/cobranca'
import { useMinhaCesta, useSolicitarCancelamentoDoPacote } from '../hooks/useCesta'
import type { PacoteDaCesta, PacoteNaCesta } from '../types/adesoes.types'
import { DialogoDoAditivo } from './DialogoDoAditivo'
import { QuadroDeEscolhas } from './QuadroDeEscolhas'

const esquemaDoMotivo = z.object({
  motivo: z.string().trim().max(300, 'Escreva o motivo em até 300 caracteres.'),
})

const nomeDoPacote = (pacote: Pick<PacoteNaCesta, 'grupo' | 'tipo' | 'descricao'>) =>
  pacote.grupo ? `${pacote.grupo} — ${rotuloDoItem(pacote)}` : rotuloDoItem(pacote)

/**
 * A cesta viva do formando (Sprint 48): o que ele tem hoje, depois dos aditivos e dos cancelamentos — o quadro do termo
 * é o do dia do aceite, e este é o de agora.
 *
 * Acrescentar é o aditivo (D38), com o rito da adesão; tirar é pedir à comissão (D8), até o "cancelável até" do pacote
 * (D36). Sem acesso à cesta — quem foi desligado —, fica o quadro do termo.
 *
 * @param cestaAceita O quadro do termo assinado, para quando a cesta viva não responde.
 */
export function CartaoDaCesta({ cestaAceita }: { cestaAceita: PacoteDaCesta[] | null }) {
  const cesta = useMinhaCesta()
  const editavel = useEscritaLiberada()
  const [acrescentando, definirAcrescentando] = useState(0)

  if (cesta.isError || (cesta.data && cesta.data.pacotes.length === 0 && !cesta.data.disponiveis.length))
    return <QuadroDeEscolhas cesta={cestaAceita} />

  if (!cesta.data) return null

  return (
    <Cartao
      titulo="Minha cesta"
      descricao="O que você tem contratado hoje. Para tirar um pacote, peça à comissão."
      acao={
        editavel && cesta.data.disponiveis.length > 0 ? (
          <Button variant="outline" size="sm" onClick={() => definirAcrescentando((vez) => vez + 1)}>
            Acrescentar
          </Button>
        ) : null
      }
    >
      <ul className="grid gap-3">
        {cesta.data.pacotes.map((pacote) => (
          <li key={pacote.item_de_cobranca_id} className="flex items-start justify-between gap-3 text-sm">
            <span className="grid min-w-0">
              <span className="text-foreground font-medium">{nomeDoPacote(pacote)}</span>
              {beneficiosPorExtenso(pacote) ? (
                <span className="text-muted-foreground text-xs">{beneficiosPorExtenso(pacote)}</span>
              ) : null}
              {pacote.observacao ? (
                <span className="text-muted-foreground text-xs">“{pacote.observacao}”</span>
              ) : null}
              {pacote.cancelamento_solicitado ? (
                <Selo tom="alerta" className="mt-1 justify-self-start">
                  Cancelamento pedido à comissão
                </Selo>
              ) : pacote.cancelavel_ate ? (
                <span className="text-texto-muted text-xs">
                  Cancelável até {formatarData(pacote.cancelavel_ate)}.
                </span>
              ) : null}
            </span>
            <span className="flex items-center gap-2">
              <span className="text-foreground tabular-nums">
                {formatarCentavos(pacote.contratado_em_centavos)}
              </span>
              {editavel && !pacote.cancelamento_solicitado && cancelavelHoje(pacote.cancelavel_ate) ? (
                <AcoesDaLinha rotulo={`Ações de ${nomeDoPacote(pacote)}`}>
                  <PedirCancelamento pacote={pacote} />
                </AcoesDaLinha>
              ) : null}
            </span>
          </li>
        ))}
      </ul>

      {acrescentando > 0 ? (
        <DialogoDoAditivo
          key={acrescentando}
          disponiveis={cesta.data.disponiveis}
          aoFechar={() => definirAcrescentando(0)}
        />
      ) : null}
    </Cartao>
  )
}

/** Tirar um pacote é pedir à comissão (D8): até a resposta, as parcelas dele não são cobradas (D12). */
function PedirCancelamento({ pacote }: { pacote: PacoteNaCesta }) {
  const solicitar = useSolicitarCancelamentoDoPacote()

  return (
    <DialogoDeTexto
      gatilho="Pedir cancelamento"
      gatilhoIcone={{ icone: X, tom: 'perigo' }}
      titulo={`Pedir o cancelamento de ${nomeDoPacote(pacote)}?`}
      descricao="A comissão decide. Se aprovar, o pacote sai da sua cesta e o que você já pagou por ele entra na lista de devolução da turma. Até a resposta, as parcelas dele não são cobradas."
      campo="motivo"
      rotulo="Motivo (opcional)"
      esquema={esquemaDoMotivo}
      confirmar="Pedir cancelamento"
      confirmarOcupado="Enviando…"
      ocupado={solicitar.isPending}
      aoEnviar={(motivo, concluir, falhar) =>
        solicitar.mutate(
          { itemId: pacote.item_de_cobranca_id, motivo },
          {
            onSuccess: () => {
              toast.success('Pedido enviado à comissão. Ela responde em até 7 dias.')
              concluir()
            },
            onError: falhar,
          },
        )
      }
    />
  )
}
