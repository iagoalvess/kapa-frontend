import { ArrowUpRight, ChevronDown, type LucideIcon } from 'lucide-react'
import type { HTMLAttributes, ReactNode } from 'react'
import { Dica } from '@/components/Dica'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTelaGrande } from '@/hooks/useTelaGrande'

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
  /**
   * Rota da tela do assunto: vira a seta no canto do cabeçalho, como a dos planos no cartão da
   * assinatura. O cartão em si não é clicável — a borda que acendia no mouse saiu a pedido do produto.
   */
  para?: string
  /** Nome da seta para o leitor de tela e a dica do mouse. Sem ele, "Abrir" e o título. */
  rotuloDoAtalho?: string
  className?: string
  /** Guias longos viram uma seção expansível no celular; seu conteúdo continua acessível. */
  recolhivelNoCelular?: boolean
  children: ReactNode
}

/** Texto de apoio dos cartões: a mesma tipografia para descrições, orientações e listas laterais. */
export function TextoDoCartao({
  as: Elemento = 'p',
  className,
  ...props
}: HTMLAttributes<HTMLElement> & { as?: 'p' | 'div' | 'ul' | 'ol' }) {
  return (
    <Elemento
      {...props}
      className={cn(
        'text-muted-foreground text-[15px] leading-normal max-lg:[overflow-wrap:anywhere]',
        className,
      )}
    />
  )
}

/**
 * O cartão branco das telas do app: fundo, sombra e respiro de sempre.
 *
 * O cabeçalho segue os cartões do modelo (`marca/design/modelo`): ícone num bloco cinza, título,
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
  para,
  rotuloDoAtalho,
  className,
  recolhivelNoCelular = false,
  children,
}: Props) {
  const telaGrande = useTelaGrande()

  if (recolhivelNoCelular && !telaGrande && titulo) {
    return (
      <details className={cn('bg-card shadow-cartao group min-w-0 rounded-2xl p-4', className)}>
        <summary className="focus-visible:ring-ring flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg font-medium focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          <h2 className="text-base">{titulo}</h2>
          <ChevronDown className="text-muted-foreground size-5 shrink-0 group-open:rotate-180" aria-hidden />
        </summary>
        <div className="mt-3 grid gap-4 border-t pt-4">
          {descricao ? <TextoDoCartao as="div">{descricao}</TextoDoCartao> : null}
          {acao ? <div className="flex flex-wrap gap-2">{acao}</div> : null}
          {children}
        </div>
      </details>
    )
  }

  return (
    <section
      aria-label={titulo ?? rotulo}
      className={cn('bg-card shadow-cartao grid min-w-0 content-start gap-5 rounded-3xl p-5', className)}
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
          {/* `basis-60`: sem espaço para o texto e as ações lado a lado, as ações descem de linha. Só
              a seta não desce: ela cabe em qualquer largura, e sozinha numa linha parecia solta. */}
          <div className={cn('grid min-w-0 flex-1 gap-0.5', acao ? 'basis-40 lg:basis-60' : 'basis-0')}>
            <h2 className="text-foreground flex flex-wrap items-center gap-2 text-lg leading-snug font-medium lg:text-xl">
              {titulo}
              {selo}
            </h2>
            {descricao ? (
              <TextoDoCartao as={typeof descricao === 'string' ? 'p' : 'div'}>{descricao}</TextoDoCartao>
            ) : null}
          </div>
          {acao || para ? (
            <div className="flex flex-wrap items-center gap-2">
              {acao}
              {para ? (
                <Dica dica={rotuloDoAtalho ?? `Abrir ${titulo}`}>
                  <Button asChild variant="ghost" size="icon" className="text-muted-foreground -my-1 size-8">
                    <LinkDaPagina to={para} aria-label={rotuloDoAtalho ?? `Abrir ${titulo}`}>
                      <ArrowUpRight aria-hidden />
                    </LinkDaPagina>
                  </Button>
                </Dica>
              ) : null}
            </div>
          ) : null}
        </header>
      ) : null}
      {children}
    </section>
  )
}
