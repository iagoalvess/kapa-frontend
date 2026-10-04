import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Cartao } from '@/components/Cartao'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'

/**
 * A coluna da direita do mural, ao lado do aviso aberto: o que se faz com o acervo da turma fora do
 * mural — os documentos.
 *
 * O atalho saiu da barra de filtros porque não recorta a lista nem disputa com a busca; ao lado do
 * aviso, ele encolhe o cartão do detalhe. Como no resto do app, a lateral só vira coluna na tela bem
 * larga; abaixo, desce.
 */
export function LateralDoMural() {
  return (
    <div className="grid min-w-0 gap-5">
      <Cartao
        titulo="Documentos"
        descricao="O acervo da turma: atas, comprovantes e contratos, guardados para quem precisar."
      >
        <Button asChild variant="outline" size="sm" className="justify-self-start">
          <LinkDaPagina to={ROTAS.documentos}>Abrir documentos</LinkDaPagina>
        </Button>
      </Cartao>
    </div>
  )
}
