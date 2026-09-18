import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  /** Título visível, que também nomeia a seção para o leitor de tela. */
  titulo?: string
  /** Nome da seção só para o leitor de tela, quando o título visível vem de dentro. */
  rotulo?: string
  /** Ícone no bloco cinza à esquerda do título, como nos cartões do modelo de design. */
  icone?: LucideIcon
  /** Número do passo no lugar do ícone: o cartão é uma etapa de um caminho ("1", depois "2"). */
  passo?: number
  /** Etiqueta logo depois do título — a situação do que o cartão mostra. */
  selo?: ReactNode
  /** Uma linha, em cinza, embaixo do título: para que serve o cartão. */
  descricao?: ReactNode
  /** Botões à direita do título. */
  acao?: ReactNode
  className?: string
  children: ReactNode
}

/**
 * O cartão branco das telas do app: fundo, sombra e respiro de sempre.
 *
 * O cabeçalho segue os cartões do modelo (`docs/design/modelo`): ícone num bloco cinza, título,
 * descrição curta embaixo e as ações encostadas à direita. Tudo opcional — sem título, é só a
 * superfície.
 */
export function Cartao({
  titulo,
  rotulo,
  icone: Icone,
  passo,
  selo,
  descricao,
  acao,
  className,
  children,
}: Props) {
  return (
    <section
      aria-label={titulo ?? rotulo}
      className={cn('bg-card shadow-cartao grid content-start gap-5 rounded-3xl p-5', className)}
    >
      {titulo ? (
        // Sem descrição, o título sozinho centra na altura do ícone.
        <header className={cn('flex flex-wrap gap-3', descricao ? 'items-start' : 'items-center')}>
          {passo === undefined ? null : (
            // Redondo, e não o bloco quadrado do ícone: número em círculo é passo, e a tela toda
            // se lê como uma sequência.
            <span className="bg-brand-tint text-brand-text inline-flex size-10 shrink-0 items-center justify-center rounded-full font-medium tabular-nums">
              {passo}
            </span>
          )}
          {Icone && passo === undefined ? (
            <span className="bg-brand-tint text-brand-text inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
              <Icone className="size-5" strokeWidth={1.75} aria-hidden />
            </span>
          ) : null}
          {/* `basis-60`: sem espaço para o texto e as ações lado a lado, as ações descem de linha. */}
          <div className="grid min-w-0 flex-1 basis-60 gap-0.5">
            <h2 className="text-foreground flex flex-wrap items-center gap-2 text-xl leading-snug font-medium">
              {titulo}
              {selo}
            </h2>
            {descricao ? <p className="text-muted-foreground text-[15px]">{descricao}</p> : null}
          </div>
          {acao ? <div className="flex flex-wrap items-center gap-2">{acao}</div> : null}
        </header>
      ) : null}
      {children}
    </section>
  )
}
