import { PartyPopper } from 'lucide-react'
import { Cartao } from '@/components/Cartao'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { ROTAS } from '@/config/rotas'
import { useMetaDaFesta } from '@/hooks/useItensDaFesta'
import { formatarCentavos } from '@/lib/formato'
import { percentualDaMeta } from '@/types/festa'

/**
 * Quanto a turma já juntou para a festa, contra a meta.
 *
 * Enxuto de propósito (22/09): o valor, a barra e quanto falta. As escolhas a contratar moram na
 * tela da festa — aqui elas dobravam a altura do cartão ao lado da próxima parcela, e a home virava
 * uma lista. A seta no canto leva à festa.
 */
export function CartaoDaFesta() {
  const consulta = useMetaDaFesta()
  const meta = consulta.data
  const percentual = meta ? percentualDaMeta(meta.arrecadado_em_centavos, meta.custo_em_centavos) : 0

  return (
    <Cartao
      titulo="Nossa festa tomando forma"
      icone={PartyPopper}
      para={ROTAS.festa}
      rotuloDoAtalho="Ver a festa"
      className="gap-4"
    >
      {consulta.isPending ? <EsqueletoDeTexto linhas={2} /> : null}
      {consulta.isError ? <ErroDaConsulta erro={consulta.error} /> : null}

      {meta && meta.custo_em_centavos <= 0 ? (
        <p className="text-muted-foreground text-sm">
          Toda festa começa com uma ideia. O orçamento ainda está sendo preparado.
        </p>
      ) : meta ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-2xl font-bold tracking-tight tabular-nums">
              {formatarCentavos(meta.arrecadado_em_centavos)}
            </p>
            <span className="bg-brand-tint text-brand-text rounded-full px-2.5 py-1 text-xs font-semibold">
              {percentual}% da meta
            </span>
          </div>
          <div aria-hidden className="bg-border h-2.5 overflow-hidden rounded-full">
            <div className="bg-brand h-full rounded-full" style={{ width: `${percentual}%` }} />
          </div>
          <div className="text-muted-foreground flex flex-wrap justify-between gap-2 text-sm">
            <span className="tabular-nums">Meta da festa: {formatarCentavos(meta.custo_em_centavos)}</span>
            {meta.falta_arrecadar_em_centavos > 0 ? (
              <span>
                Faltam{' '}
                <span className="text-foreground font-semibold tabular-nums">
                  {formatarCentavos(meta.falta_arrecadar_em_centavos)}
                </span>
              </span>
            ) : (
              <span className="text-foreground font-medium">Meta alcançada!</span>
            )}
          </div>
        </>
      ) : null}
    </Cartao>
  )
}
