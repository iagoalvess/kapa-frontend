import { Cartao } from '@/components/Cartao'
import { BotaoDoLinkDaLoja } from '@/components/BotaoDoLinkDaLoja'
import { CancelarVendasDaFesta } from './CancelarVendasDaFesta'

/**
 * A coluna da direita da tela de compras da loja, como a de Conferir e a de Minhas parcelas: o que se
 * faz com a loja fora da lista — divulgar e encerrar as vendas da festa.
 *
 * As duas ações saíram da barra de filtros (Sprint 43): divulgar é ação de contexto, não filtro, e o
 * cancelamento em massa merece a explicação que a barra não cabe — antes disputava com a exportação.
 *
 * @param festaId A festa da agenda; o cartão de cancelamento só aparece com ela.
 */
export function LateralDaLoja({ festaId }: { festaId: string | null }) {
  return (
    <div className="grid min-w-0 gap-5">
      <Cartao
        titulo="Divulgar a loja"
        descricao="Copie o link e mande no grupo da turma: é por ele que a loja abre para quem vai comprar."
      >
        <BotaoDoLinkDaLoja tamanho="default" variante="default" />
      </Cartao>

      <CancelarVendasDaFesta festaId={festaId} />
    </div>
  )
}
