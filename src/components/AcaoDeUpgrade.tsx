import { Link } from 'react-router'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { usePapel } from '@/hooks/useSessao'

/**
 * O que fazer diante de uma área fora do plano, conforme quem olha (Sprint 45, P4).
 *
 * Só o Presidente contrata, então só ele recebe o botão. O resto da Gestão fica sabendo a quem pedir —
 * um "Ver planos" que termina num checkout recusado é pior que nenhum botão. O formando não recebe nada:
 * a área nem aparece no menu dele.
 */
export function AcaoDeUpgrade() {
  const { ehPresidente, tem } = usePapel()

  if (ehPresidente)
    return (
      <Button asChild>
        <Link to={ROTAS.planos}>Ver planos</Link>
      </Button>
    )

  if (tem(PAPEIS.tesoureiro, PAPEIS.comissao))
    return <p className="text-muted-foreground text-sm">Peça ao presidente da comissão para contratar.</p>

  return null
}
