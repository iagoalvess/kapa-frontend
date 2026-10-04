import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Cartao } from '@/components/Cartao'
import { CartaoDeValor } from '@/components/CartaoDeValor'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos } from '@/lib/formato'
import type { ResumoDeDespesas } from '../types/financeiro.types'

/**
 * A coluna da direita de Despesas, como a de Parcelas e a da Conferência: o que a turma tem a pagar,
 * no desenho da "Próxima parcela" de Minhas parcelas, e o caminho para os fornecedores, que antes era
 * um botão na barra.
 *
 * O total sai do mesmo resumo da faixa e dos filtros, então acompanha o recorte da tela. Quem paga
 * uma despesa é a linha da lista; aqui o cartão é só o número grande.
 */
export function LateralDeDespesas({
  resumo,
  mostrarResumo = true,
}: {
  resumo?: ResumoDeDespesas
  mostrarResumo?: boolean
}) {
  const { tem } = usePapel()
  const tesouraria = tem(PAPEIS.tesoureiro)

  return (
    <div className="grid min-w-0 gap-5 max-lg:contents">
      {mostrarResumo ? <ResumoDeDespesasAPagar resumo={resumo} /> : null}

      {tesouraria ? (
        <Cartao
          titulo="Fornecedores"
          className="hidden lg:grid"
          descricao="Quem a turma contrata, e o que já saiu para cada um."
        >
          <Button asChild variant="outline" size="sm" className="justify-self-start">
            <LinkDaPagina to={ROTAS.fornecedores}>Ver fornecedores</LinkDaPagina>
          </Button>
        </Cartao>
      ) : null}
    </div>
  )
}

export function ResumoDeDespesasAPagar({ resumo }: { resumo?: ResumoDeDespesas }) {
  const aPagar = resumo?.prevista.valor_em_centavos ?? 0
  return (
    <CartaoDeValor
      titulo="Despesas a pagar"
      destaque={aPagar > 0}
      rotulo="A pagar"
      valor={resumo ? formatarCentavos(aPagar) : null}
      nota={
        resumo?.atrasada.quantidade
          ? `${formatarCentavos(resumo.atrasada.valor_em_centavos)} em atraso.`
          : 'Nada em atraso.'
      }
      rodape="Pagar uma despesa registra a saída no Caixa. O comprovante é obrigatório."
    />
  )
}
