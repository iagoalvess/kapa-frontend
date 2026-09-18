import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  /** Âncora do menu do cabeçalho (`#recursos`). */
  id?: string
  /** A palavra pequena acima do título, em laranja. */
  etiqueta?: string
  /** Título da seção. */
  titulo?: ReactNode
  /** Uma ou duas linhas embaixo do título. */
  descricao?: ReactNode
  /** Fundo creme, para alternar com o branco e dar ritmo à rolagem. */
  creme?: boolean
  /** Alinha o cabeçalho à esquerda — usado onde o conteúdo ao lado é uma imagem. */
  aEsquerda?: boolean
  className?: string
  children?: ReactNode
}

/**
 * Uma faixa da página institucional: respiro vertical, largura máxima e cabeçalho opcional.
 *
 * Existe para as onze seções da Sprint 16 terem a mesma métrica. A alternativa — cada seção com o
 * próprio `py` e o próprio `max-w` — é como uma landing fica com quatro respiros diferentes e o
 * texto de uma seção mais largo que o da vizinha.
 *
 * O cabeçalho entra com `revelar`, a animação de rolagem nativa do CSS (`styles/index.css`): sem
 * suporte no navegador, ou com movimento reduzido, ele simplesmente já está lá.
 */
export function SecaoDaLanding({
  id,
  etiqueta,
  titulo,
  descricao,
  creme = false,
  aEsquerda = false,
  className,
  children,
}: Props) {
  return (
    <section id={id} className={cn('scroll-mt-24 px-4 py-16 sm:py-24', creme && 'bg-brand-wash')}>
      <div className={cn('mx-auto grid w-full max-w-6xl gap-10', className)}>
        {/* `col-span-full` no cabeçalho: numa seção de coluna única não faz nada, e nas de duas
            colunas (contato, perguntas) é o que impede o título de ocupar só a primeira e empurrar
            o conteúdo para a linha de baixo, deixando meia tela vazia ao lado dele. */}
        {titulo || etiqueta || descricao ? (
          <header
            className={cn(
              'revelar col-span-full grid gap-3',
              aEsquerda ? 'max-w-2xl' : 'mx-auto max-w-2xl justify-items-center text-center',
            )}
          >
            {etiqueta ? (
              <p className="text-brand-text text-sm font-semibold tracking-wide uppercase">{etiqueta}</p>
            ) : null}
            {titulo ? (
              <h2 className="text-foreground text-3xl font-semibold text-balance sm:text-4xl">{titulo}</h2>
            ) : null}
            {descricao ? <p className="text-muted-foreground text-lg text-pretty">{descricao}</p> : null}
          </header>
        ) : null}

        {children}
      </div>
    </section>
  )
}
