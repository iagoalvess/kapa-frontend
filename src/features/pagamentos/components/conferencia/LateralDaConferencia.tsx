import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'

/**
 * A coluna da direita: o passo a passo de quem confere — a tesouraria muda a cada turma, e quem
 * chega não sabe que o valor se corrige antes de confirmar — e o caminho do pagamento que ninguém
 * avisou, que antes era um botão laranja na barra, disputando com o lote.
 */
export function LateralDaConferencia() {
  return (
    <div className="hidden min-w-0 gap-5 lg:grid">
      <Cartao titulo="Como conferir">
        <OrientacoesDaConferencia />
      </Cartao>

      <Cartao
        titulo="Pagou e não avisou?"
        className="hidden lg:grid"
        descricao={
          <>
            <p>Encontrou um pagamento no extrato que o formando não avisou?</p>
            <p className="mt-3">Registre o pagamento na página de Parcelas.</p>
          </>
        }
      >
        <Button asChild variant="outline" size="sm" className="justify-self-start">
          <LinkDaPagina to={ROTAS.parcelas}>Ir para Parcelas</LinkDaPagina>
        </Button>
      </Cartao>
    </div>
  )
}

export function OrientacoesDaConferencia() {
  return (
    <TextoDoCartao as="ol" className="divide-y">
      <li className="pb-3">Confira o extrato do banco. Para dinheiro em mãos, confirme com quem recebeu.</li>
      <li className="py-3">
        Ache cada pagamento pelo dia e pelo valor. Se entrou outro valor, corrija na linha antes de confirmar:
        depois, a diferença fica registrada para conferência.
      </li>
      <li className="pt-3">
        Clique nas linhas para selecioná-las; pelo teclado, use Tab e Espaço. O botão de confirmação aparece
        com a seleção. Confirmado, o formando recebe o recibo por e-mail.
      </li>
    </TextoDoCartao>
  )
}
