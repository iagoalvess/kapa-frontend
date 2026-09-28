import { FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { abrirNaAba } from '@/lib/download'
import { avisarErro } from '@/lib/http/erros'
import { useAbrirRecibo } from '../hooks/useRecibo'

/**
 * O recibo de uma baixa, numa aba nova — como o termo e o comprovante da despesa.
 *
 * Entra na linha da parcela com baixa, em Minhas parcelas e na lista da gestão, e no cartão da parcela
 * paga. A API decide quem vê: o próprio formando recebe o CPF inteiro; a gestão, mascarado.
 *
 * @param recebimentoId A baixa — é também o número do recibo.
 * @param rotulo O que o leitor de tela diz: "Recibo da parcela 3/24".
 */
export function BotaoDeRecibo({ recebimentoId, rotulo }: { recebimentoId: string; rotulo: string }) {
  const recibo = useAbrirRecibo()

  /** A aba nasce antes da ida ao servidor: aberta depois dela, o navegador a trataria como pop-up. */
  const abrir = () => {
    const aba = window.open('', '_blank')
    recibo.mutate(recebimentoId, {
      onSuccess: (arquivo) => abrirNaAba(arquivo, aba),
      onError: (erro) => {
        aba?.close()
        avisarErro(erro)
      },
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={abrir} disabled={recibo.isPending} aria-label={rotulo}>
      <FileText aria-hidden />
      Recibo
    </Button>
  )
}
