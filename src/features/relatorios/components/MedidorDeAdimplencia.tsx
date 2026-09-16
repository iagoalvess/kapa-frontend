import { formatarCentavos } from '@/lib/formato'
import type { Adimplencia } from '../types/relatorios.types'
import { percentualDeAdimplencia } from '../types/relatorios.types'

/** Geometria do arco, em unidades do `viewBox`. */
const RAIO = 54
const CENTRO = { x: 70, y: 66 }
const GROSSURA = 12

/** Meia volta: o medidor é um semicírculo, da esquerda para a direita. */
const ARCO = Math.PI * RAIO

/**
 * A partir de quanto o índice é bom, ruim, ou está no meio.
 *
 * Números redondos, e de propósito: são a régua que a comissão vai usar na assembleia, não um
 * cálculo. Abaixo de 70% a turma tem um problema de caixa, não um detalhe de cobrança.
 */
const FAIXAS = [
  { minimo: 90, cor: 'var(--success-fill)', rotulo: 'em dia' },
  { minimo: 70, cor: 'var(--brand)', rotulo: 'atenção' },
  { minimo: 0, cor: 'var(--danger-fill)', rotulo: 'crítico' },
] as const

/** O caminho do semicírculo, da esquerda para a direita. */
const SEMICIRCULO = `M${CENTRO.x - RAIO},${CENTRO.y} A${RAIO},${RAIO} 0 0 1 ${CENTRO.x + RAIO},${CENTRO.y}`

/**
 * O índice de adimplência da turma: quanto do que já venceu entrou.
 *
 * **O número vai sempre ao lado do medidor**, e não só na cor do arco: medidor sozinho não se lê, e
 * cor sozinha não é informação. A faixa ("em dia", "atenção", "crítico") é a terceira pista, em
 * texto.
 *
 * Percentual de dinheiro, não de gente (decisão 6 da Sprint 12) — a linha embaixo diz de quanto se
 * está falando, para o número não virar abstração.
 *
 * @param adimplencia O índice e as duas somas que o formam.
 */
export function MedidorDeAdimplencia({ adimplencia }: { adimplencia: Adimplencia }) {
  const percentual = percentualDeAdimplencia(adimplencia)
  const faixa = FAIXAS.find(({ minimo }) => percentual >= minimo) ?? FAIXAS[FAIXAS.length - 1]!
  const preenchido = (percentual / 100) * ARCO

  return (
    <figure className="motion-safe:animate-entrar grid justify-items-center gap-3">
      <div className="relative">
        <svg viewBox={`0 0 ${CENTRO.x * 2} ${CENTRO.y + 12}`} className="w-44" aria-hidden>
          <path
            d={SEMICIRCULO}
            fill="none"
            stroke="var(--line)"
            strokeWidth={GROSSURA}
            strokeLinecap="round"
          />
          <path
            d={SEMICIRCULO}
            fill="none"
            stroke={faixa.cor}
            strokeWidth={GROSSURA}
            strokeLinecap="round"
            strokeDasharray={`${preenchido} ${ARCO}`}
          />
          <text
            x={CENTRO.x}
            y={CENTRO.y - 8}
            textAnchor="middle"
            fontSize="26"
            fontWeight="500"
            fill="var(--text-primary)"
          >
            {percentual}%
          </text>
        </svg>
      </div>

      <figcaption className="grid justify-items-center gap-1 text-center">
        <p className="text-foreground text-sm font-medium">
          {percentual}% do que venceu foi pago · {faixa.rotulo}
        </p>
        <p className="text-muted-foreground text-sm">
          {formatarCentavos(adimplencia.recebido_em_centavos)} de{' '}
          {formatarCentavos(adimplencia.devido_em_centavos)}
        </p>
        {adimplencia.em_atraso_em_centavos > 0 ? (
          <p className="text-danger-text text-sm tabular-nums">
            {formatarCentavos(adimplencia.em_atraso_em_centavos)} em atraso
          </p>
        ) : null}
      </figcaption>
    </figure>
  )
}
