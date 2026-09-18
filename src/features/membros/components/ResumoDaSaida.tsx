import { Esqueleto } from '@/components/Esqueleto'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { ResumoDaSaida as Resumo } from '../types/membros.types'

/**
 * Uma linha do quadro: rótulo à esquerda, valor à direita, e entre parênteses quantas parcelas.
 *
 * @param destaque Vermelho — o atraso, que é a linha sobre a qual a comissão precisa decidir.
 */
function Linha({
  rotulo,
  centavos,
  parcelas,
  destaque = false,
}: {
  rotulo: string
  centavos: number
  parcelas?: number
  destaque?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-muted-foreground">{rotulo}</span>
      <span className={cn('font-medium tabular-nums', destaque ? 'text-danger-text' : 'text-foreground')}>
        {formatarCentavos(centavos)}
        {typeof parcelas === 'number' ? (
          <span className="text-muted-foreground ml-2 font-normal">
            ({formatarNumero(parcelas)} {parcelas === 1 ? 'parcela' : 'parcelas'})
          </span>
        ) : null}
      </span>
    </div>
  )
}

/**
 * Os números da saída, no topo do diálogo de desligamento: o que a pessoa já pagou, o que ainda
 * deve e quanto disso já venceu.
 *
 * Vêm **antes** da escolha do motivo de propósito: desligar sem ver estes números é assinar em
 * branco, e é sobre o atraso que a comissão precisa decidir logo abaixo.
 *
 * "Em atraso" é um recorte de "em aberto", e não uma terceira linha a somar — por isso vem recuado
 * e com o rótulo "dos quais".
 */
export function ResumoDaSaida({ resumo }: { resumo: Resumo | undefined }) {
  if (!resumo) {
    return (
      <div className="border-border grid gap-3 rounded-xl border p-4">
        <Esqueleto className="h-5" />
        <Esqueleto className="h-5" />
        <Esqueleto className="h-5" />
      </div>
    )
  }

  return (
    <div className="border-border grid gap-3 rounded-xl border p-4 text-[15px]">
      <Linha rotulo="Já pagou" centavos={resumo.ja_pago_em_centavos} />
      <Linha
        rotulo="Em aberto"
        centavos={resumo.em_aberto_em_centavos}
        parcelas={resumo.parcelas_em_aberto}
      />
      {resumo.parcelas_em_atraso > 0 ? (
        <Linha
          rotulo="Dos quais, em atraso"
          centavos={resumo.em_atraso_em_centavos}
          parcelas={resumo.parcelas_em_atraso}
          destaque
        />
      ) : null}
    </div>
  )
}
