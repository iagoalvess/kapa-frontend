import { Check, Lock } from 'lucide-react'
import mascoteCadeado from '@/assets/mascote/cadeado.webp'
import { AcaoDeUpgrade } from '@/components/AcaoDeUpgrade'
import { Cartao } from '@/components/Cartao'
import { AREAS_DO_PLANO, type AreaDoPlano, type Modulo } from '@/config/planos'
import { usePlanoQueLibera } from '@/hooks/usePlanoDaTurma'

/**
 * A tela de uma área que o plano da turma não inclui: a maquete da área ao fundo e, por cima, o que ela
 * faz e como liberar (Sprint 45, P2).
 *
 * Entra no lugar da página, e a página nem monta — nenhuma consulta sai só para voltar 403. Antes a
 * turma abria o item do menu e via o erro vermelho "Esta área não está incluída no plano da turma.", sem
 * saída.
 *
 * @param modulo O módulo que a área exige.
 */
export function AreaBloqueada({ modulo }: { modulo: Modulo }) {
  const area = AREAS_DO_PLANO[modulo]
  const plano = usePlanoQueLibera(modulo)

  return (
    <div className="relative isolate grid min-h-[32rem] place-items-center overflow-hidden rounded-3xl">
      {area ? <Maquete area={area} /> : null}

      <section
        aria-labelledby="area-bloqueada"
        className="bg-card shadow-cartao relative z-10 m-4 grid w-full max-w-md justify-items-center gap-4 rounded-3xl p-6 text-center"
      >
        <img src={mascoteCadeado} alt="" className="w-24 drop-shadow-lg" />
        <p className="bg-brand-tint text-brand-text inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold">
          <Lock className="size-3.5" aria-hidden />
          {plano ? `Disponível no plano ${plano.nome}` : 'Fora do plano da turma'}
        </p>
        <h2 id="area-bloqueada" className="text-xl font-semibold tracking-tight text-balance">
          {area?.titulo ?? 'Esta área não está no plano da turma'}
        </h2>
        {area ? (
          <>
            <p className="text-muted-foreground text-sm text-balance">{area.frase}</p>
            <ul className="grid gap-2 text-left text-sm">
              {area.beneficios.map((beneficio) => (
                <li key={beneficio} className="flex gap-2">
                  <Check className="text-brand-text mt-0.5 size-4 shrink-0" aria-hidden />
                  {beneficio}
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <AcaoDeUpgrade />
      </section>
    </div>
  )
}

/**
 * A área como ela seria, com dados de exemplo e desfocada: os números do topo e uma lista, nas mesmas
 * peças das telas de verdade. Enfeite — fora da árvore de acessibilidade e sem receber clique.
 */
function Maquete({ area }: { area: AreaDoPlano }) {
  const Icone = area.icone

  return (
    <div
      aria-hidden
      inert
      className="absolute inset-0 grid content-start gap-5 opacity-70 blur-[2px] select-none"
    >
      <div className="grid grid-cols-3 gap-3">
        {area.indicadores.map(([rotulo, valor]) => (
          <div key={rotulo} className="bg-card shadow-cartao grid gap-1 rounded-2xl p-4">
            <span className="text-muted-foreground truncate text-xs">{rotulo}</span>
            <span className="truncate text-lg font-semibold tabular-nums">{valor}</span>
          </div>
        ))}
      </div>
      <Cartao titulo={area.titulo} icone={Icone}>
        <ul className="grid">
          {area.exemplo.map((linha) => (
            <li
              key={linha.titulo}
              className="border-border flex items-center gap-3 border-b py-3 last:border-0"
            >
              <span className="bg-brand-tint text-brand-text grid size-10 shrink-0 place-items-center rounded-full">
                <Icone className="size-4" />
              </span>
              <span className="grid min-w-0 flex-1">
                <span className="truncate text-sm font-medium">{linha.titulo}</span>
                <span className="text-muted-foreground truncate text-xs">{linha.detalhe}</span>
              </span>
              {linha.valor ? <span className="text-sm font-medium tabular-nums">{linha.valor}</span> : null}
            </li>
          ))}
        </ul>
      </Cartao>
    </div>
  )
}
