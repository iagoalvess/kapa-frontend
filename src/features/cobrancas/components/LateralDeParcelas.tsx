import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'

/**
 * A coluna da direita de Parcelas, como a da Conferência: um guia curto para quem cobra, já que a
 * tesouraria muda a cada turma e quem chega não sabe que o valor da vencida já traz encargos nem
 * onde registrar o dinheiro que entrou fora do PIX. Abaixo, o caminho para as próprias parcelas da
 * comissão, que antes era um botão na barra, competindo com a busca.
 */
export function LateralDeParcelas() {
  return (
    <div className="grid min-w-0 gap-5">
      <Cartao titulo="Como cobrar">
        <TextoDoCartao as="ol" className="divide-y">
          <li className="pb-3">
            O valor que aparece é o de hoje. Na parcela vencida, ele já vem com multa e juros. Quando há
            desconto, o valor original fica logo abaixo.
          </li>
          <li className="py-3">
            Quando o dinheiro entra fora do PIX, registre o pagamento na própria linha, em “Registrar
            pagamento”. Se o formando avisou que pagou, use “Conferir” e confirme na Conferência.
          </li>
          <li className="pt-3">
            Se registrou uma baixa por engano, desfaça em “Estornar”. Para lembrar quem está vencido, use
            “Cobrar” e a pessoa recebe um e-mail, no máximo um por dia.
          </li>
        </TextoDoCartao>
      </Cartao>

      <Cartao
        titulo="Minhas parcelas"
        descricao="A comissão também tem parcelas: acompanhe vencimentos, pagamentos e comprovantes."
      >
        <Button asChild variant="outline" size="sm" className="justify-self-start">
          <LinkDaPagina to={ROTAS.extrato}>Ver minhas parcelas</LinkDaPagina>
        </Button>
      </Cartao>
    </div>
  )
}
