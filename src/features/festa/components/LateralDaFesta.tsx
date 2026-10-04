import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Cartao } from '@/components/Cartao'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'

/**
 * A coluna da direita de A festa, ao lado do item aberto: o que se faz com a festa fora do item —
 * a portaria no dia e o mapa do salão.
 *
 * Os atalhos saíram da barra de filtros e do menu porque não recortam a lista nem disputam com a
 * busca: ao lado do painel eles encolhem o cartão de detalhe (que é o que a tela inteira responde).
 * Como no resto do app, a lateral só vira coluna na tela bem larga; abaixo, desce.
 *
 * A Portaria é caso do padrão `useAtalhoNoMenu`: no Essencial, que não tem A festa, ela continua
 * no menu; só no Premium o card aqui é o único caminho.
 */
export function LateralDaFesta() {
  return (
    <div className="grid min-w-0 gap-5">
      <Cartao
        titulo="Portaria"
        descricao="A entrada da festa: liste os convites, busque pelo código e valide cada um na porta."
      >
        <Button asChild variant="outline" size="sm" className="justify-self-start">
          <LinkDaPagina to={ROTAS.portaria}>Abrir portaria</LinkDaPagina>
        </Button>
      </Cartao>

      <Cartao
        titulo="Mesas do jantar"
        descricao="Monte o mapa do salão: nome, lugares e o dono de cada mesa."
      >
        <Button asChild variant="outline" size="sm" className="justify-self-start">
          <LinkDaPagina to={ROTAS.mesas}>Abrir mesas</LinkDaPagina>
        </Button>
      </Cartao>
    </div>
  )
}
