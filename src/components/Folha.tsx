import { useId } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/**
 * Folha de papel sobre outra, presa por um clipe na quina de cima ou por uma espiral na lateral —
 * o idioma de papelaria da landing e dos criativos.
 *
 * As camadas são irmãs em `-z-10` dentro de um `isolate`: a folha de trás, a volta de trás do clipe e
 * a folha da frente, nessa ordem. É a folha da frente que esconde a perna do clipe abaixo da borda,
 * e é isso que faz o clipe parecer entrar entre as folhas.
 *
 * @param prende `grampo` (clipe na quina superior esquerda) ou `espiral` (arame pelos furos à esquerda;
 *   a folha já reserva o recuo do conteúdo).
 * @param dobra Canto inferior direito dobrado.
 * @param pautada Linhas de caderno na folha da frente.
 * @param tom `creme` pinta a folha da frente; a de trás é sempre branca, e é ela que aparece na dobra.
 * @param compacto Escala reduzida do clipe, da espiral e da dobra, para cartões pequenos.
 * @param className Rotação, espaçamento e grade de quem chama.
 */
export function Folha({
  prende,
  dobra = false,
  pautada = false,
  tom = 'branca',
  compacto = false,
  className,
  children,
}: {
  prende: 'grampo' | 'espiral'
  dobra?: boolean
  pautada?: boolean
  tom?: 'branca' | 'creme'
  compacto?: boolean
  className?: string
  children: ReactNode
}) {
  const id = useId()
  const espiral = prende === 'espiral'
  return (
    <div className={cn('relative isolate', espiral && (compacto ? 'pl-8' : 'pl-9 sm:pl-11'), className)}>
      <span
        aria-hidden
        className={cn(
          'bg-card border-border pointer-events-none absolute inset-0 -z-10 rounded-[3px] border',
          espiral ? 'translate-x-1 translate-y-1.5 -rotate-1' : 'translate-x-2 translate-y-2 rotate-3',
        )}
      />
      {espiral ? null : <Grampo compacto={compacto} parte="tras" />}
      <span
        aria-hidden
        className={cn(
          'shadow-foto pointer-events-none absolute inset-0 -z-10 rounded-[3px]',
          tom === 'creme' ? 'bg-brand-wash' : 'bg-card',
          pautada &&
            // Como no caderno: o topo da folha fica sem linha, e a pauta começa abaixo dele.
            'bg-[repeating-linear-gradient(to_bottom,transparent_0,transparent_calc(1.25rem-1px),var(--ilustracao-pauta)_calc(1.25rem-1px),var(--ilustracao-pauta)_1.25rem)] bg-[position:0_1.5rem] bg-no-repeat',
        )}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {espiral ? <Espiral id={id} compacto={compacto} /> : <Grampo compacto={compacto} parte="frente" />}
        {dobra ? (
          <Dobra id={id} className={cn('absolute right-0 bottom-0', compacto ? 'size-9' : 'size-16')} />
        ) : null}
      </div>
      {children}
    </div>
  )
}

/**
 * A margem vermelha e o arame. Um padrão de 22px repete o aro, e a altura da folha decide quantos
 * cabem. A borda esquerda da folha fica em x=18 do SVG: o furo fica dentro dela, e o arame sai por
 * cima da folha, contorna a borda e volta por trás.
 */
function Espiral({ id, compacto }: { id: string; compacto: boolean }) {
  return (
    <>
      <span className={cn('bg-destructive/20 absolute inset-y-0 w-px', compacto ? 'left-6' : 'left-8')} />
      <svg className="absolute inset-y-3 -left-[18px] h-[calc(100%-1.5rem)] w-11 overflow-visible">
        <defs>
          <linearGradient id={`${id}-arame`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--ilustracao-metal-brilho)" />
            <stop offset="0.5" stopColor="var(--ilustracao-metal-claro)" />
            <stop offset="1" stopColor="var(--ilustracao-metal-escuro)" />
          </linearGradient>
          <pattern id={`${id}-aro`} width="44" height="22" patternUnits="userSpaceOnUse">
            <ellipse
              cx="30"
              cy="11"
              rx="3"
              ry="3.4"
              className="fill-background stroke-foreground/15"
              strokeWidth=".8"
            />
            <path d="M27 10a3 3.4 0 0 1 6 0" fill="none" className="stroke-foreground/20" strokeWidth="1" />
            <path
              d="M7 7C2 11 7 17 18 16.5"
              fill="none"
              className="stroke-ilustracao-metal-escuro"
              strokeWidth="2.4"
            />
            {/* A sombra do arame na folha. */}
            <path d="M30 12C25 6 14 4 8 8" fill="none" className="stroke-foreground/10" strokeWidth="3" />
            <path
              d="M30 10.5C25 4 12 1 7 7"
              fill="none"
              stroke={`url(#${id}-arame)`}
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <path
              d="M27 6.5C22 3.5 14 3 10 5"
              fill="none"
              className="stroke-ilustracao-metal-brilho"
              strokeWidth=".8"
            />
          </pattern>
        </defs>
        <rect width="44" height="100%" fill={`url(#${id}-aro)`} />
      </svg>
    </>
  )
}

/**
 * O clipe na quina de cima, em duas partes: a volta de fora (`tras`) fica entre as folhas, e a folha
 * da frente esconde o que passa da borda (y≈30 do SVG); a volta de dentro (`frente`) fica por cima.
 */
function Grampo({ compacto, parte }: { compacto: boolean; parte: 'tras' | 'frente' }) {
  return (
    <svg
      viewBox="0 0 28 76"
      aria-hidden
      className={cn(
        'pointer-events-none absolute -rotate-6 overflow-visible',
        compacto ? '-top-[17px] left-2.5 h-11 w-4' : '-top-[25px] left-5 h-16 w-6',
        parte === 'tras' ? '-z-10' : 'z-10 drop-shadow-sm',
      )}
    >
      {parte === 'tras' ? (
        <>
          <path
            d="M25 32V15C25 -2 2 -2 2 15V51"
            fill="none"
            className="stroke-foreground/45"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path d="M4 32V15C4 1 23 1 23 15V32" fill="none" className="stroke-card/95" strokeWidth="0.9" />
        </>
      ) : (
        <>
          <path
            d="M18 50V17C18 8 7 8 7 17V57C7 70 25 70 25 57V29"
            fill="none"
            className="stroke-foreground/45"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M9 17V55C9 65 22 65 22 57"
            fill="none"
            className="stroke-card/75"
            strokeWidth="0.7"
            strokeLinecap="round"
          />
        </>
      )}
    </svg>
  )
}

/**
 * Canto dobrado: a ponta se rebate sobre a diagonal. Embaixo aparece a folha de trás; em cima, o
 * verso da ponta, mais escuro na pontinha, com as laterais levemente curvas e sombra para dentro.
 */
function Dobra({ id, className }: { id: string; className?: string }) {
  const aba = 'M0 64 64 0C42 4 20 6 5 5 6 20 4 42 0 64Z'
  return (
    <svg viewBox="0 0 64 64" className={cn('overflow-visible', className)}>
      <defs>
        <linearGradient id={`${id}-verso`} x1="32" y1="32" x2="5" y2="5" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="var(--card)" />
          <stop offset="0.6" stopColor="var(--brand-wash)" />
          <stop offset="1" stopColor="var(--brand-tint)" />
        </linearGradient>
        <filter id={`${id}-sombra`} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx="-2"
            dy="-2"
            stdDeviation="2.5"
            floodColor="var(--foreground)"
            floodOpacity=".28"
          />
        </filter>
      </defs>
      <path d="M0 64 64 0v64Z" className="fill-card" />
      <path d="M8 64 64 8" className="stroke-foreground/5" strokeWidth="6" />
      <path d={aba} fill={`url(#${id}-verso)`} filter={`url(#${id}-sombra)`} />
      <path d={aba} fill="none" className="stroke-brand-soft/60" strokeWidth=".8" />
      <path d="M1 63 63 1" className="stroke-card" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}
