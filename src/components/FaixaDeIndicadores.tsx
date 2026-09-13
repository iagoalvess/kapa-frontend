import type { LucideIcon } from 'lucide-react'
import { formatarNumero } from '@/lib/formato'

export interface Indicador {
  rotulo: string
  /** Nulo enquanto carrega: a faixa mostra um traço e guarda a altura. */
  valor: number | null
  /** Unidade depois do número, em cinza ("membros", "de 203"). */
  unidade?: string
  icone: LucideIcon
}

/**
 * Faixa branca de números do topo da tela: ícone num bloco cinza, rótulo e o valor grande.
 *
 * Os números ficam lado a lado, separados por um traço vertical, e viram duas colunas no celular.
 *
 * @param indicadores Os números, na ordem de leitura.
 * @param rotulo Nome da faixa para o leitor de tela ("Resumo dos membros").
 */
export function FaixaDeIndicadores({ indicadores, rotulo }: { indicadores: Indicador[]; rotulo: string }) {
  return (
    <section
      aria-label={rotulo}
      className="bg-card shadow-cartao grid grid-cols-2 gap-y-5 rounded-2xl p-5 lg:grid-cols-4"
    >
      {indicadores.map(({ rotulo: nome, valor, unidade, icone: Icone }, indice) => (
        <dl
          key={nome}
          className={
            indice === 0 ? 'flex items-center gap-3 px-2' : 'flex items-center gap-3 px-2 lg:border-l lg:pl-6'
          }
        >
          {/* Cinza da paleta (--text-secondary), e não o preto do CTA: o bloco é ícone, não ação. */}
          <span className="bg-muted-foreground text-card inline-flex size-9 shrink-0 items-center justify-center rounded-xl">
            <Icone className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div className="grid min-w-0 gap-0.5">
            <dt className="text-muted-foreground text-sm leading-snug">{nome}</dt>
            <dd className="text-foreground text-[1.75rem] leading-tight font-medium tracking-tight">
              {valor === null ? '—' : formatarNumero(valor)}
              {unidade ? (
                <span className="text-muted-foreground ml-1 text-base font-normal">{unidade}</span>
              ) : null}
            </dd>
          </div>
        </dl>
      ))}
    </section>
  )
}
