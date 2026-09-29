import { Send } from 'lucide-react'
import { toast } from 'sonner'
import { AcaoComConfirmacao } from '@/components/AcoesDaLinha'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { avisarErro } from '@/lib/http/erros'
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
    <AcaoComConfirmacao
      rotulo="Cobrar"
      icone={Send}
      tom="neutra"
      desabilitada={!liberado || cobrar.isPending}
      confirmacao={{
        titulo: 'Cobrar agora?',
        descricao: (
          <>
            {parcela.nome} receberá um e-mail sobre a parcela em atraso, com o valor atualizado e o vencimento
            de {formatarData(parcela.vencimento)}. Cada pessoa recebe no máximo uma cobrança por dia.
          </>
        ),
        rotulo: cobrar.isPending ? 'Enviando…' : 'Enviar cobrança',
        aoConfirmar: () =>
          cobrar.mutate(parcela.id, {
            onSuccess: () => toast.success('Cobrança enviada.'),
            onError: avisarErro,
          }),
      }}
    />
  )
}
