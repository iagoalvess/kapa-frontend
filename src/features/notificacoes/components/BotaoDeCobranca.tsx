import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Button } from '@/components/ui/button'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { mensagemDoErro } from '@/lib/http/erros'
import { formatarData } from '@/lib/formato'
import type { Parcela } from '@/types/cobranca'
import { useCobrarParcela } from '../hooks/useRegras'

/**
 * O disparo avulso da tesouraria, na linha de uma parcela vencida: manda agora o texto do degrau de
 * atraso mais próximo, sem esperar a régua.
 *
 * Confirma antes porque é uma mensagem de verdade para uma pessoa de verdade. A API repete as mesmas
 * barreiras da régua: parcela paga, cancelada ou com aviso de pagamento pendente é recusada, e a
 * segunda cobrança do mesmo dia também.
 */
export function BotaoDeCobranca({ parcela }: { parcela: Parcela }) {
  const cobrar = useCobrarParcela()
  const liberado = useEscritaLiberada()

  return (
    <DialogoDeConfirmacao
      gatilho={
        <Button variant="outline" size="sm" disabled={!liberado || cobrar.isPending}>
          <Send aria-hidden />
          Cobrar
        </Button>
      }
      titulo="Cobrar agora?"
      descricao={
        <>
          {parcela.nome} recebe por e-mail o texto da régua para uma parcela em atraso, com o valor atualizado
          e o vencimento de {formatarData(parcela.vencimento)}. Cada pessoa recebe no máximo uma cobrança por
          dia.
        </>
      }
      rotulo={cobrar.isPending ? 'Enviando…' : 'Enviar cobrança'}
      aoConfirmar={() =>
        cobrar.mutate(parcela.id, {
          onSuccess: () => toast.success('Cobrança enviada.'),
          onError: (erro) => toast.error(mensagemDoErro(erro)),
        })
      }
    />
  )
}
