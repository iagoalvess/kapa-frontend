import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { useMetaDaFesta } from '@/hooks/useItensDaFesta'
import { formatarCentavos } from '@/lib/formato'
import { percentualDaMeta } from '@/types/festa'

/**
 * Quanto a turma já juntou para a festa, contra a meta: o valor, a barra e quanto falta.
 *
 * As escolhas a contratar moram na tela da festa — aqui a pergunta é só "quanto temos hoje?".
 */
export function BlocoDaFesta() {
  const consulta = useMetaDaFesta()
  const meta = consulta.data
  const percentual = meta ? percentualDaMeta(meta.arrecadado_em_centavos, meta.custo_em_centavos) : 0

  if (consulta.isPending) return <EsqueletoDeTexto linhas={2} />
  if (consulta.isError)
    return <ErroDaConsulta compacto erro={consulta.error} aoTentarDeNovo={() => void consulta.refetch()} />

  if (meta && meta.custo_em_centavos <= 0)
    return (
      <p className="text-muted-foreground text-sm">
        Toda festa começa com uma ideia. O orçamento ainda está sendo preparado.
      </p>
    )

  if (!meta) return null

  return (
    <>
      <p className="text-brand text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl">
        {formatarCentavos(meta.arrecadado_em_centavos)}
      </p>

      {/* O percentual encosta na barra, em número discreto — o selo arredondado que ficava aqui
          repetia a informação que o próprio comprimento da barra já dá. */}
      <div className="flex items-center gap-3">
        <div aria-hidden className="bg-muted h-2.5 min-w-0 flex-1 overflow-hidden rounded-full">
          <div className="bg-brand h-full rounded-full" style={{ width: `${percentual}%` }} />
        </div>
        <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
          {percentual}%<span className="sr-only"> da meta</span>
        </span>
      </div>

      <p className="text-muted-foreground text-[13.5px]">
        {meta.falta_arrecadar_em_centavos > 0 ? (
          <>
            Faltam{' '}
            <b className="text-foreground font-semibold tabular-nums">
              {formatarCentavos(meta.falta_arrecadar_em_centavos)}
            </b>{' '}
            para a meta de{' '}
            <b className="text-foreground font-semibold tabular-nums">
              {formatarCentavos(meta.custo_em_centavos)}
            </b>
          </>
        ) : (
          <span className="text-foreground font-medium">Meta alcançada.</span>
        )}
      </p>
    </>
  )
}
