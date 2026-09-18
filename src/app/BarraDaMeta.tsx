import { Link } from 'react-router'
import { ROTAS } from '@/config/rotas'
import { useMetaDaFesta } from '@/hooks/useItensDaFesta'
import { formatarCentavos } from '@/lib/formato'
import { percentualDaMeta } from '@/types/festa'

/**
 * Quanto falta juntar para pagar a festa — o "quanto falta" na moeda dinheiro.
 *
 * A Página Inicial existe para responder "quanto falta", e até aqui respondia só em dias. Isto não é
 * a repetição de outra tela: é a única aparição de um número que não existe em nenhuma outra, e é o
 * que o anel de 72% do carrossel da marca promete desde sempre.
 *
 * Some quando não há o que medir: turma que ainda não descreveu a festa não ganha uma barra em zero,
 * que seria pior do que não ter barra nenhuma.
 */
export function BarraDaMeta() {
  const meta = useMetaDaFesta().data

  if (!meta || meta.custo_em_centavos <= 0) return null

  const percentual = percentualDaMeta(meta.arrecadado_em_centavos, meta.custo_em_centavos)

  return (
    <section aria-label="A meta da festa" className="motion-safe:animate-entrar grid gap-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-muted-foreground text-sm">
          {/* "X arrecadados · meta de Y", e não "X de Y": a turma que já passou da meta arrecadou
              mais do que ela, e "R$ 77.450 de R$ 54.000" se lê como erro de conta. */}
          <strong className="text-foreground font-medium">{percentual}% da meta</strong>{' '}
          {formatarCentavos(meta.arrecadado_em_centavos)} arrecadados · meta de{' '}
          {formatarCentavos(meta.custo_em_centavos)}
        </p>
        <Link to={ROTAS.festa} className="text-brand-text text-sm underline underline-offset-4">
          Ver a festa
        </Link>
      </div>

      {/* A barra é decorativa: o número que ela desenha já está escrito na linha acima, e um
          segundo anúncio do mesmo percentual só atrapalharia quem usa leitor de tela. */}
      <span aria-hidden className="bg-border h-2 overflow-hidden rounded-full">
        <span className="bg-brand block h-full rounded-full" style={{ width: `${percentual}%` }} />
      </span>

      {meta.falta_arrecadar_em_centavos > 0 ? (
        <p className="text-texto-muted text-sm">
          Faltam {formatarCentavos(meta.falta_arrecadar_em_centavos)} para pagar tudo o que a turma contratou.
        </p>
      ) : (
        <p className="text-texto-muted text-sm">A turma já arrecadou tudo o que a festa vai custar.</p>
      )}
    </section>
  )
}
