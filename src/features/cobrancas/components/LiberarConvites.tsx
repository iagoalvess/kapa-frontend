import { Ticket } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { AcaoDaLinha } from '@/components/AcoesDaLinha'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Input } from '@/components/ui/input'
import { PAPEIS } from '@/config/perfis'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { avisarErro } from '@/lib/http/erros'
import { useLiberarConvites } from '../hooks/usePedidos'
import type { Pedido } from '../types/cobrancas.types'

/**
 * Libera os convites de um pedido de convite extra que ainda não foi quitado (Sprint 21, P2).
 *
 * O convite só nasce quitado — é o único momento em que a turma já tem o dinheiro. A válvula existe
 * porque o caso real existe ("pagou 2 de 3, paga o resto na porta"), e é da Gestão, nunca do
 * formando: com motivo obrigatório, que vai para a auditoria com o nome de quem liberou.
 */
export function LiberarConvites({ pedido }: { pedido: Pedido }) {
  const { tem } = usePapel()
  const editavel = useEscritaLiberada()
  const liberar = useLiberarConvites()
  const [aberto, definirAberto] = useState(false)
  const [motivo, definirMotivo] = useState('')
  const campo = useId()

  if (pedido.tipo !== 'ConviteExtra' || pedido.status !== 'Confirmado' || pedido.quitado) return null
  if (!editavel || !tem(PAPEIS.tesoureiro, PAPEIS.comissao)) return null

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault()
    liberar.mutate(
      { pedido_id: pedido.id, motivo: motivo.trim() },
      {
        onSuccess: ({ quantidade }) => {
          toast.success(
            `${quantidade} convite${quantidade === 1 ? '' : 's'} liberado${quantidade === 1 ? '' : 's'}.`,
          )
          definirAberto(false)
        },
        onError: avisarErro,
      },
    )
  }

  return (
    <>
      <AcaoDaLinha rotulo="Liberar convites" icone={Ticket} onClick={() => definirAberto(true)} />

      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo={`Liberar os convites de ${pedido.nome}?`}
        descricao="O convite sai antes de o pedido estar pago. O motivo fica na auditoria, com o seu nome."
        largura="estreito"
      >
        <form onSubmit={enviar} noValidate className="grid gap-4">
          <div className="grid gap-2 text-sm">
            <label htmlFor={campo} className="text-foreground w-fit font-medium">
              Motivo
            </label>
            <Input
              id={campo}
              value={motivo}
              onChange={(e) => definirMotivo(e.target.value)}
              placeholder="Pagou 2 de 3, paga o resto na porta"
            />
          </div>
          <AcoesDoFormulario
            aoCancelar={() => definirAberto(false)}
            ocupado={liberar.isPending}
            desabilitado={!motivo.trim()}
            rotulo="Liberar"
            rotuloOcupado="Liberando…"
          />
        </form>
      </DialogoDeFormulario>
    </>
  )
}
