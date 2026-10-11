import { Cartao } from '@/components/Cartao'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Button } from '@/components/ui/button'
import { MODULOS } from '@/config/planos'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { usePlanoDaTurma } from '@/hooks/usePlanoDaTurma'
import { usePapel } from '@/hooks/useSessao'
/** As consultas da turma ficam junto aos avisos do Mural. */
export function AtalhoDasEnquetes() {
  const { inclui } = usePlanoDaTurma()
  const gestao = usePapel().tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  if (!gestao && !inclui(MODULOS.enquetes)) return null
  return (
    <Cartao titulo="Enquetes" descricao="As consultas da comissão e os resultados da turma.">
      <Button asChild variant="outline" size="sm" className="justify-self-start">
        <LinkDaPagina to={ROTAS.enquetes}>Abrir enquetes</LinkDaPagina>
      </Button>
    </Cartao>
  )
}
