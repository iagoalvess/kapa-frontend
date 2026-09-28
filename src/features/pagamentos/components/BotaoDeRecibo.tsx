import { FileText } from 'lucide-react'
import { AcaoDaLinha } from '@/components/AcoesDaLinha'
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
 * @param descricaoAcessivel O nome completo para o leitor de tela: "Recibo da parcela 3/24". O
 * tooltip é só "Recibo".
 */
export function BotaoDeRecibo({
  recebimentoId,
  descricaoAcessivel,
}: {
  recebimentoId: string
  descricaoAcessivel: string
}) {
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
    <AcaoDaLinha
      rotulo="Recibo"
      descricaoAcessivel={descricaoAcessivel}
      icone={FileText}
      desabilitada={recibo.isPending}
      onClick={abrir}
    />
  )
}
