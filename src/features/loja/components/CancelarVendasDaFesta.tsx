import { useState } from 'react'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { Cartao } from '@/components/Cartao'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Button } from '@/components/ui/button'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { avisarErro } from '@/lib/http/erros'
import { useCancelarVendasDaFesta } from '../hooks/useCancelamento'
import { CampoDoMotivo } from './EscolhaDeConvites'

/**
 * Festa cancelada (Sprint 38, P6): uma ação do Presidente cancela todas as compras pagas da loja e as
 * põe na lista a devolver — 300 compradores não se cancelam um a um.
 *
 * Mora na coluna lateral da tela, e não na barra: é ação de contexto, com explicação que a barra não
 * cabe, como o "Pagou e não avisou?" da Conferência.
 *
 * A confirmação é dupla, porque não tem volta: o motivo, e a caixa marcada dizendo que entendeu. Só a
 * loja: os convites de formando seguem o cancelamento de pedido da tesouraria.
 *
 * @param festaId A festa da agenda; sem festa, o cartão não aparece.
 */
export function CancelarVendasDaFesta({ festaId }: { festaId: string | null }) {
  const { ehPresidente } = usePapel()
  const editavel = useEscritaLiberada()
  const cancelar = useCancelarVendasDaFesta()
  const [aberto, definirAberto] = useState(false)
  const [motivo, definirMotivo] = useState('')
  const [entendi, definirEntendi] = useState(false)

  if (!festaId || !ehPresidente || !editavel) return null

  const abrir = () => {
    definirMotivo('')
    definirEntendi(false)
    definirAberto(true)
  }

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault()
    cancelar.mutate(
      { festaId, motivo: motivo.trim() },
      {
        onSuccess: ({ compras_canceladas }) => {
          toast.info(
            compras_canceladas === 0
              ? 'Nenhuma compra paga para cancelar.'
              : `${compras_canceladas === 1 ? '1 compra cancelada' : `${compras_canceladas} compras canceladas`}. Estão na lista a devolver.`,
          )
          definirAberto(false)
        },
        onError: avisarErro,
      },
    )
  }

  return (
    <>
      <Cartao
        titulo="Vendas da festa"
        descricao="Encerra as vendas da loja de uma vez: as compras pagas vão para a lista a devolver e as que aguardam PIX vencem sozinhas."
      >
        <Button size="sm" variant="outline" className="text-danger-text justify-self-start" onClick={abrir}>
          Cancelar as vendas da festa
        </Button>
      </Cartao>

      <DialogoDeFormulario
        aberto={aberto}
        aoFechar={() => definirAberto(false)}
        titulo="Cancelar todas as vendas da loja?"
        descricao="Todos os convites comprados na loja serão cancelados. As compras pagas entrarão na lista de valores a devolver; as que aguardam PIX vencerão sozinhas. Os convites pedidos pelos formandos devem ser cancelados separadamente."
      >
        <form onSubmit={enviar} noValidate className="grid gap-4">
          <CampoDoMotivo valor={motivo} aoMudar={definirMotivo} exemplo="O salão cancelou a data" />
          <label className="flex w-fit cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={entendi}
              onChange={(evento) => definirEntendi(evento.target.checked)}
              className="accent-primary size-4 shrink-0"
            />
            Entendo que isto cancela todas as compras da loja e não tem volta.
          </label>
          <AcoesDoFormulario
            aoCancelar={() => definirAberto(false)}
            ocupado={cancelar.isPending}
            desabilitado={!motivo.trim() || !entendi}
            rotulo="Cancelar as vendas"
            rotuloOcupado="Cancelando…"
            rotuloDeCancelar="Voltar"
          />
        </form>
      </DialogoDeFormulario>
    </>
  )
}
