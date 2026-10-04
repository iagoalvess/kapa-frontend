import { Lock } from 'lucide-react'
import { AcaoDeUpgrade } from '@/components/AcaoDeUpgrade'
import { AREAS_DO_PLANO, type Modulo } from '@/config/planos'
import { usePlanoQueLibera } from '@/hooks/usePlanoDaTurma'

/**
 * O bloco do Início cuja área está fora do plano: o que ela faz e como liberar (Sprint 45).
 *
 * Em fio e rótulo, como o resto do Início — não um cartão: a tela é uma leitura, não uma grade de
 * superfícies. Um só no lugar dos dois blocos do módulo `mural` (a meta da festa e os recados): dois
 * convites a contratar lado a lado na primeira tela viram anúncio. Só a Gestão o vê — quem contrata é
 * a comissão.
 *
 * @param modulo O módulo fora do plano.
 */
export function BlocoDaAreaBloqueada({ modulo }: { modulo: Modulo }) {
  const area = AREAS_DO_PLANO[modulo]
  const plano = usePlanoQueLibera(modulo)

  if (!area) return null

  const Icone = area.icone

  return (
    <div className="grid gap-3">
      <p className="flex items-center gap-2 font-semibold">
        <Icone className="text-brand size-5 shrink-0" strokeWidth={1.75} aria-hidden />
        {area.titulo}
      </p>
      <p className="text-muted-foreground text-sm">{area.frase}</p>
      <div className="flex flex-wrap items-center gap-3">
        <span className="bg-brand-tint text-brand-text inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold">
          <Lock className="size-3" aria-hidden />
          {plano ? `Plano ${plano.nome}` : 'Fora do plano'}
        </span>
        <AcaoDeUpgrade />
      </div>
    </div>
  )
}
