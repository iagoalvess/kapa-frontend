import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'

/**
 * A coluna da direita de Pedidos, como a de Parcelas e a da Conferência: um guia curto sobre como o
 * pedido do formando se comporta depois de feito, e o caminho para os pedidos do próprio membro da
 * comissão, que antes era um botão na barra, competindo com a busca e os filtros.
 */
export function LateralDePedidos() {
  return (
    <div className="hidden min-w-0 gap-5 lg:grid">
      <Cartao titulo="Como funciona o pedido">
        <OrientacoesDePedidos />
      </Cartao>

      <Cartao
        titulo="Meus pedidos"
        className="hidden lg:grid"
        descricao="A comissão também pede: veja o que você pediu dos opcionais e quanto já pagou de cada um."
      >
        <Button asChild variant="outline" size="sm" className="justify-self-start">
          <LinkDaPagina to={ROTAS.meusPedidos}>Ver meus pedidos</LinkDaPagina>
        </Button>
      </Cartao>

      {/* A Loja saiu do menu e virou atalho, como "Meus pedidos": quem compra convite pelo link
          público não é formando, então a lista não é um pedido desta tela — mas é aqui que a
          comissão a procura, ao lado de quem pediu o quê. */}
      <Cartao
        titulo="Compras da loja"
        className="hidden lg:grid"
        descricao="Quem comprou convite pelo link público, o que está preso esperando pagamento e o que precisa devolver."
      >
        <Button asChild variant="outline" size="sm" className="justify-self-start">
          <LinkDaPagina to={ROTAS.comprasDaLoja}>Ver compras da loja</LinkDaPagina>
        </Button>
      </Cartao>
    </div>
  )
}

export function OrientacoesDePedidos() {
  return (
    <TextoDoCartao as="ol" className="divide-y">
      <li className="pb-3">
        O pedido vira parcelas no extrato do formando, no valor e no parcelamento que ele escolheu na hora de
        pedir.
      </li>
      <li className="py-3">
        Enquanto o item estiver à venda, ele pode ajustar a quantidade. Na vitrine dele, o botão vira “Mudar
        quantidade”.
      </li>
      <li className="pt-3">
        A coluna Unidades mostra o que foi reservado, e não o que já foi pago. Para acompanhar o dinheiro que
        entrou, use Parcelas ou a Conferência.
      </li>
    </TextoDoCartao>
  )
}
