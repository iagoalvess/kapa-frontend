import { ArrowUpRight, PartyPopper } from 'lucide-react'
import { Link } from 'react-router'
import { Cartao } from '@/components/Cartao'
import { LinkDoCartao } from '@/components/LinkDoCartao'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { ROTAS, rotaDoItemDaFesta } from '@/config/rotas'
import { useItensDaFesta, useMetaDaFesta } from '@/hooks/useItensDaFesta'
import { formatarCentavos } from '@/lib/formato'
import { percentualDaMeta } from '@/types/festa'

/** O orçamento real da festa e até três escolhas que ainda faltam fazer. */
export function CartaoDaFesta() {
  const consulta = useMetaDaFesta()
  const itens = useItensDaFesta()
  const meta = consulta.data
  const percentual = meta ? percentualDaMeta(meta.arrecadado_em_centavos, meta.custo_em_centavos) : 0
  const aContratar = (itens.data ?? []).filter((item) => item.estado === 'AContratar').slice(0, 3)

  return (
    <Cartao rotulo="A festa">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="bg-brand-wash text-brand-text grid size-10 place-items-center rounded-xl">
            <PartyPopper className="size-5" aria-hidden />
          </span>
          <div>
            <p className="text-muted-foreground text-xs">Um plano de todos</p>
            <h2 className="text-lg font-semibold">Nossa festa tomando forma</h2>
          </div>
        </div>
        <LinkDoCartao to={ROTAS.festa} rotulo="Ver a festa" />
      </header>
      {consulta.isPending ? <EsqueletoDeTexto linhas={3} /> : null}
      {consulta.isError ? <ErroDaConsulta erro={consulta.error} /> : null}
      {meta && meta.custo_em_centavos <= 0 ? (
        <div className="bg-background rounded-2xl p-5">
          <p className="font-medium">Toda festa começa com uma ideia.</p>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
            O orçamento ainda está sendo preparado. Acompanhe os itens e as escolhas da turma.
          </p>
          <Link
            to={ROTAS.festa}
            className="text-brand-text mt-4 inline-flex items-center gap-2 text-sm font-medium"
          >
            Explorar a festa <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>
      ) : meta ? (
        <div className="bg-background rounded-2xl p-5">
          <p className="text-muted-foreground text-xs">Já juntamos</p>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-3xl font-semibold tracking-tight tabular-nums">
              {formatarCentavos(meta.arrecadado_em_centavos)}
            </p>
            <span className="bg-brand-tint text-brand-text rounded-full px-2.5 py-1 text-xs font-semibold">
              {percentual}% da meta
            </span>
          </div>
          <div aria-hidden className="bg-border my-4 h-2.5 overflow-hidden rounded-full">
            <div className="bg-brand h-full rounded-full" style={{ width: `${percentual}%` }} />
          </div>
          <div className="text-muted-foreground flex flex-wrap justify-between gap-2 text-xs">
            <span>Meta da festa</span>
            <span className="font-medium tabular-nums">{formatarCentavos(meta.custo_em_centavos)}</span>
          </div>
          <p className="border-border text-muted-foreground mt-4 border-t pt-4 text-sm">
            {meta.falta_arrecadar_em_centavos > 0 ? (
              <>
                <span className="text-foreground font-semibold">
                  {formatarCentavos(meta.falta_arrecadar_em_centavos)}
                </span>{' '}
                para alcançar a meta da festa.
              </>
            ) : (
              'Meta alcançada. Mais um motivo para comemorar!'
            )}
          </p>
        </div>
      ) : null}
      {itens.isPending ? <EsqueletoDeTexto linhas={2} /> : null}
      {itens.isError ? <ErroDaConsulta erro={itens.error} /> : null}
      {aContratar.length > 0 ? (
        <div>
          <div className="mb-2 flex items-center justify-between gap-3">
            <h3 className="text-muted-foreground text-xs font-semibold tracking-wider uppercase">
              Próximas escolhas
            </h3>
            <span className="text-muted-foreground text-xs">A contratar</span>
          </div>
          <ul className="divide-border divide-y">
            {aContratar.map((item) => (
              <li key={item.id}>
                <Link
                  to={rotaDoItemDaFesta(item.id)}
                  className="group focus-visible:outline-ring flex items-center gap-3 rounded-lg py-3 focus-visible:outline-2"
                >
                  <span className="bg-brand-soft size-2 shrink-0 rounded-full" aria-hidden />
                  <span className="group-hover:text-brand-text min-w-0 flex-1 text-sm font-medium break-words">
                    {item.titulo}
                  </span>
                  <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                    {item.custo_em_centavos === 0
                      ? 'Sem orçamento'
                      : formatarCentavos(item.custo_em_centavos)}
                  </span>
                  <ArrowUpRight className="text-texto-muted size-4 shrink-0" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Cartao>
  )
}
