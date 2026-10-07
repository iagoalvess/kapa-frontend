import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Rabisco } from './Rabiscos'

interface Props {
  /**
   * Âncora do menu do cabeçalho (`#recursos`).
   *
   * Vai no conteúdo, não na `<section>` — ver o comentário no corpo.
   */
  id?: string
  /** O começo do título, em peso cheio. */
  titulo?: ReactNode
  /** O fim do título: a palavra que leva a cor e o sublinhado à mão ("ao baile."). */
  destaque?: ReactNode
  /** O recado à mão embaixo do título, em Caveat — no lugar da etiqueta em caixa alta. */
  nota?: ReactNode
  /** Uma ou duas linhas de texto corrido. */
  descricao?: ReactNode
  /**
   * O fundo da faixa: o branco do hero, o creme ou o laranja da marca. As seções se alternam para dar
   * ritmo à rolagem, como os posts creme e laranja do Instagram.
   */
  tom?: 'branco' | 'creme' | 'laranja'
  /**
   * De que lado fica o cabeçalho no desktop. As seções se revezam, como a foto que muda de lado de um
   * post para o outro; no celular fica sempre à esquerda, onde título grande se lê sem esforço.
   */
  lado?: 'esquerda' | 'direita'
  className?: string
  children?: ReactNode
}

/** O contorno do destaque na cor do fundo de cada tom, escrito por extenso para o Tailwind achar. */
const CONTORNO = {
  branco: '[-webkit-text-stroke:0.12em_var(--background)]',
  creme: '[-webkit-text-stroke:0.12em_var(--brand-wash)]',
  laranja: '[-webkit-text-stroke:0.12em_var(--brand)]',
} as const

/**
 * O título de seção da landing: a escala do Hero, a última palavra na cor da marca e o rabisco por
 * baixo. Exportado para a seção que põe o título dentro de uma coluna, e não acima dela (Segurança).
 */
export function TituloDaSecao({
  titulo,
  destaque,
  tom = 'branco',
}: {
  titulo: ReactNode
  destaque?: ReactNode
  tom?: 'branco' | 'creme' | 'laranja'
}) {
  const laranja = tom === 'laranja'

  return (
    <h2
      className={cn(
        // A mesma escala do título do Hero: as seções não podem gritar mais alto que a capa.
        'text-3xl leading-[1.12] font-extrabold tracking-tight text-balance sm:text-[2.5rem] lg:text-[2.875rem]',
        laranja ? 'text-on-brand' : 'text-foreground',
      )}
    >
      {titulo}
      {destaque ? (
        <>
          {' '}
          <span className={cn('relative isolate inline-block', !laranja && 'text-brand')}>
            {/* Como no Hero: o contorno da cor do fundo abre espaço no rabisco ao redor das letras, e
                o traço se interrompe nas pernas do "g" em vez de passar por cima. */}
            <span className={cn('[paint-order:stroke_fill]', CONTORNO[tom])}>{destaque}</span>
            <Rabisco
              className={cn(
                'pointer-events-none absolute -bottom-3 left-0 -z-10 h-5 w-full sm:-bottom-4 sm:h-7',
                laranja ? 'text-on-brand/50' : 'text-brand/50',
              )}
            />
          </span>
        </>
      ) : null}
    </h2>
  )
}

/**
 * Uma faixa da página institucional, no idioma dos criativos aprovados (05/10/2026): título grande à
 * esquerda, a última palavra sublinhada à mão, recado em Caveat e fundo chapado — nada de degradê.
 *
 * Existe para todas as seções terem a mesma métrica. A alternativa — cada seção com o próprio `py` e o
 * próprio `max-w` — é como uma landing fica com quatro respiros diferentes e o texto de uma seção mais
 * largo que o da vizinha.
 */
export function SecaoDaLanding({
  id,
  titulo,
  destaque,
  nota,
  descricao,
  tom = 'branco',
  lado = 'esquerda',
  className,
  children,
}: Props) {
  const laranja = tom === 'laranja'

  return (
    <section
      className={cn(
        'overflow-x-clip px-4 py-16 sm:py-24',
        tom === 'creme' && 'bg-brand-wash',
        laranja && 'bg-brand text-on-brand',
      )}
    >
      {/*
        A âncora fica no conteúdo, e não na `<section>`: o respiro de cima é `py-24`, e um
        `scroll-mt` na seção **soma** a ele — a pessoa clicava em "Planos", caía 96px acima do
        título e os cards terminavam 170px abaixo da dobra, parecendo cortados. Mirando o conteúdo,
        o `scroll-mt` só precisa dar conta do cabeçalho grudado (64px) e de um respiro.
      */}
      <div id={id} className={cn('mx-auto grid w-full max-w-6xl scroll-mt-20 gap-12', className)}>
        {/* `col-span-full` no cabeçalho: nas seções de duas colunas é o que impede o título de ocupar
            só a primeira e empurrar o conteúdo para a linha de baixo. */}
        {titulo ? (
          <header
            className={cn(
              'col-span-full grid max-w-3xl gap-4',
              lado === 'direita' && 'lg:justify-items-end lg:justify-self-end lg:text-right',
            )}
          >
            <TituloDaSecao titulo={titulo} destaque={destaque} tom={tom} />
            {nota ? (
              <p
                className={cn(
                  'font-hand -rotate-1 text-2xl leading-tight sm:text-3xl',
                  lado === 'direita' && 'lg:rotate-1',
                  laranja ? 'text-on-brand' : 'text-brand-text',
                )}
              >
                {nota}
              </p>
            ) : null}
            {descricao ? (
              <p
                className={cn(
                  'max-w-2xl text-base text-pretty sm:text-lg',
                  laranja ? 'text-on-brand/90' : 'text-muted-foreground',
                )}
              >
                {descricao}
              </p>
            ) : null}
          </header>
        ) : null}

        {children}
      </div>
    </section>
  )
}
