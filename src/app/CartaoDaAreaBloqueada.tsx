import { Lock } from 'lucide-react'
import { AcaoDeUpgrade } from '@/components/AcaoDeUpgrade'
import { Cartao } from '@/components/Cartao'
import { AREAS_DO_PLANO, type Modulo } from '@/config/planos'
import { usePlanoQueLibera } from '@/hooks/usePlanoDaTurma'

/**
 * O lugar de um cartão do Início cuja área está fora do plano: o que ela faz e como liberar (Sprint 45).
 *
 * Um só no lugar dos dois cartões do módulo `mural` (a meta da festa e os recados): dois convites a
 * contratar lado a lado na primeira tela viram anúncio. Só a Gestão o vê — quem contrata é a comissão.
 *
 * @param modulo O módulo fora do plano.
 */
export function CartaoDaAreaBloqueada({ modulo }: { modulo: Modulo }) {
  const area = AREAS_DO_PLANO[modulo]
  const plano = usePlanoQueLibera(modulo)

  if (!area) return null

  return (
    <Cartao
      titulo={area.titulo}
      icone={area.icone}
      selo={
        <span className="bg-brand-tint text-brand-text inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
          <Lock className="size-3" aria-hidden />
          {plano ? `Plano ${plano.nome}` : 'Fora do plano'}
        </span>
      }
      className="gap-4"
    >
      <p className="text-muted-foreground text-sm">{area.frase}</p>
      <div>
        <AcaoDeUpgrade />
      </div>
    </Cartao>
  )
}
