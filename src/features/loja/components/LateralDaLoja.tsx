import { Cartao } from '@/components/Cartao'
import { BotaoDoLinkDaLoja } from '@/components/BotaoDoLinkDaLoja'

/**
 * A coluna da direita da tela de compras da loja, como a de Conferir e a de Minhas parcelas: o que se
 * faz com a loja fora da lista — divulgar.
 *
 * A ação saiu da barra de filtros (Sprint 43): divulgar é ação de contexto, não filtro, e antes
 * disputava com a exportação.
 */
export function LateralDaLoja() {
  return (
    <div className="grid min-w-0 gap-5">
      <Cartao
        titulo="Divulgar a loja"
        descricao="Copie o link e mande no grupo da turma: é por ele que a loja abre para quem vai comprar."
      >
        <BotaoDoLinkDaLoja tamanho="default" variante="default" />
      </Cartao>
    </div>
  )
}
