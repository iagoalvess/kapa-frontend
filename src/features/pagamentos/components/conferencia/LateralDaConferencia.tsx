import { Link } from 'react-router'
import { Cartao } from '@/components/Cartao'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'

/**
 * A coluna da direita: o passo a passo de quem confere — a tesouraria muda a cada turma, e quem
 * chega não sabe que o valor se corrige antes de confirmar — e o caminho do pagamento que ninguém
 * avisou, que antes era um botão laranja na barra, disputando com o lote.
 */
export function LateralDaConferencia() {
  return (
    <div className="grid min-w-0 gap-5">
      <Cartao titulo="Como conferir">
        <ol className="text-muted-foreground divide-y text-sm leading-relaxed">
          <li className="pb-3">Abra o extrato do banco no período dos avisos.</li>
          <li className="py-3">
            Ache cada pagamento pelo dia e pelo valor. Se entrou outro valor, corrija na linha antes de
            confirmar: depois, a diferença fica registrada para conferência.
          </li>
          <li className="pt-3">
            Marque o que bateu e confirme em lote. O formando recebe o recibo por e-mail.
          </li>
        </ol>
      </Cartao>

      <Cartao
        titulo="Pagou e não avisou?"
        descricao="Encontrou um pagamento no extrato que o formando não avisou? Registre-o na página de Parcelas."
      >
        <Button asChild variant="outline" size="sm" className="justify-self-start">
          <Link to={ROTAS.parcelas}>Ir para Parcelas</Link>
        </Button>
      </Cartao>
    </div>
  )
}
