import { ArrowRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { cn } from '@/lib/utils'

/** Uma pendência da lista: o que falta e, quando quem lê pode resolver, a porta. */
export interface Pendencia {
  /** Identidade da linha, para o React. */
  chave: string
  texto: ReactNode
  acao?: { rotulo: string; para: string }
}

/**
 * A lista numerada do que falta, no mesmo marcador dos "Primeiros passos" do Início: o círculo da
 * marca com o número, a frase e, à direita, o link que resolve — quando existe.
 *
 * É o "o que falta" das telas de adesão, nas duas pontas: o formando em `FaltaParaAderir` e a gestão
 * em `AdesoesPage`. Um cartão por pendência empilhava superfícies iguais e um selo "Falta" repetia a
 * mesma notícia em cada linha; o número é o que ordena a leitura e casa com o guia do Início.
 *
 * @param pendencias As linhas, já na ordem em que devem ser resolvidas.
 * @param className Do lado de quem chama; a lista centralizada da tela do formando passa a largura.
 */
export function ListaDePendencias({
  pendencias,
  className,
}: {
  pendencias: Pendencia[]
  className?: string
}) {
  if (pendencias.length === 0) return null

  return (
    <ol className={cn('grid', className)}>
      {pendencias.map((pendencia, indice) => (
        <li
          key={pendencia.chave}
          className="border-border flex flex-wrap items-center gap-3 border-b py-3.5 last:border-0"
        >
          <span
            aria-hidden
            className="bg-brand-tint text-brand-text grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums"
          >
            {indice + 1}
          </span>
          <span className="text-muted-foreground min-w-0 flex-1 text-[15px]">{pendencia.texto}</span>
          {pendencia.acao ? (
            <LinkDaPagina
              to={pendencia.acao.para}
              className="text-brand-text inline-flex shrink-0 items-center gap-1 font-semibold whitespace-nowrap"
            >
              {pendencia.acao.rotulo}
              <ArrowRight className="size-4" aria-hidden />
            </LinkDaPagina>
          ) : null}
        </li>
      ))}
    </ol>
  )
}
