import { Slot } from '@radix-ui/react-slot'
import { Ellipsis, type LucideIcon } from 'lucide-react'
import { Children, type CSSProperties, type MouseEventHandler, type ReactNode, useId } from 'react'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useTelaGrande } from '@/hooks/useTelaGrande'
import { fecharPainelAoAgir } from '@/lib/popover'
import { cn } from '@/lib/utils'

/** O tom do ícone: perigo é o vermelho das ações que removem ou encerram. */
export type TomDaAcao = 'neutra' | 'perigo'

/**
 * As ações de uma linha de tabela: a pílula com um ícone por ação, como no anexo.
 *
 * Cada ação é só ícone — o que ela faz está no tooltip (e no `aria-label`, para o leitor de
 * tela e o toque, onde não há hover). Ação que abre confirmação usa `AcaoComConfirmacao`;
 * ação que abre formulário continua sendo o diálogo da feature, com o gatilho trocado por
 * `AcaoDaLinha`.
 *
 * No celular (Sprint 41) a pílula vira um "⋯" que abre as mesmas ações num menu preso a ele, cada uma
 * com o ícone e o nome — sem hover, o ícone sozinho não diz o que faz. Os filhos são os mesmos: é o
 * `data-menu` do menu que faz cada `AcaoDaLinha` mostrar o nome e ocupar a linha.
 */
export function AcoesDaLinha({
  rotulo,
  children,
  className,
}: {
  /** De quem são as ações: "Ações da Mesa 1". É o nome do grupo para o leitor de tela. */
  rotulo: string
  children: ReactNode
  className?: string
}) {
  const telaGrande = useTelaGrande()
  const id = useId()

  if (!telaGrande) {
    // Linha sem ação nenhuma não ganha um "⋯" que abre vazio.
    if (Children.toArray(children).length === 0) return null

    // Uma âncora por linha: com nome fixo, todo menu da lista abriria preso ao "⋯" da última.
    const ancora = `--acoes-${id.replaceAll(/[^\w-]/g, '')}`

    return (
      <>
        <button
          type="button"
          popoverTarget={id}
          aria-label={rotulo}
          style={{ anchorName: ancora } as CSSProperties}
          className={cn(
            'text-muted-foreground hover:bg-muted focus-visible:ring-ring grid size-9 place-items-center rounded-full focus-visible:ring-2 focus-visible:outline-none',
            className,
          )}
        >
          <Ellipsis className="size-5" aria-hidden />
        </button>
        {/* Preso ao "⋯" pela direita, e não centrado como os painéis da barra: é o menu de uma linha. */}
        <div
          id={id}
          popover="auto"
          aria-label={rotulo}
          data-menu=""
          onClickCapture={fecharPainelAoAgir}
          style={{ positionAnchor: ancora } as CSSProperties}
          className="bg-card shadow-cartao text-foreground inset-auto m-0 mt-1 w-60 overflow-hidden rounded-2xl border [position-area:bottom_span-left] [position-try-fallbacks:flip-block]"
        >
          <div className="divide-border grid divide-y">{children}</div>
        </div>
      </>
    )
  }

  return (
    <div
      role="toolbar"
      aria-label={rotulo}
      className={cn(
        'bg-card divide-border inline-flex items-center divide-x overflow-hidden rounded-full border shadow-xs empty:hidden',
        className,
      )}
    >
      {children}
    </div>
  )
}

/**
 * O botão da ação. Dentro do menu do celular (`in-data-[menu]`) ele vira item: a linha inteira, o ícone
 * e o nome ao lado, escrito a partir do `data-rotulo` — com `asChild`, o filho é um link que já traz
 * o próprio conteúdo, e o nome não teria onde entrar de outro jeito.
 */
const estilosDoBotao = (tom: TomDaAcao) =>
  cn(
    'flex h-9 min-w-10 cursor-pointer items-center justify-center px-2.5 transition-colors outline-none focus-visible:bg-accent focus-visible:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40',
    // O clique responde na hora: o ícone encolhe sob o dedo, como o `Button` (06/10/2026). Encolher o segmento
    // inteiro descolaria a pílula.
    '[&_svg]:transition-transform motion-safe:active:[&_svg]:scale-90',
    'in-data-[menu]:h-12 in-data-[menu]:w-full in-data-[menu]:justify-start in-data-[menu]:gap-3 in-data-[menu]:px-4 in-data-[menu]:text-[15px] in-data-[menu]:after:content-[attr(data-rotulo)]',
    tom === 'perigo'
      ? 'text-danger-text hover:bg-danger-bg'
      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
  )

interface AcaoProps {
  /** A ação, curta: "Cancelar". É o texto do tooltip. */
  rotulo: string
  /** O nome completo para o leitor de tela — "Cancelar Mensalidade". Sem ele, vale o `rotulo`. */
  descricaoAcessivel?: string
  /** O ícone do botão. Com `asChild`, o filho já o traz. */
  icone?: LucideIcon
  tom?: TomDaAcao
  desabilitada?: boolean
}

/**
 * Uma ação da pílula: ícone com tooltip.
 *
 * Sem `asChild`, o botão é o `icone`. Com `asChild`, o filho é um link (Pagar, Conferir) e já
 * traz o próprio ícone: o estilo, o tooltip e o nome vão para ele.
 */
export function AcaoDaLinha({
  rotulo,
  descricaoAcessivel,
  icone: Icone,
  tom = 'neutra',
  desabilitada = false,
  asChild = false,
  onClick,
  children,
}: AcaoProps & {
  asChild?: boolean
  onClick?: MouseEventHandler<HTMLElement>
  children?: ReactNode
}) {
  const nome = descricaoAcessivel ?? rotulo
  const botao = asChild ? (
    <Slot
      aria-label={nome}
      data-rotulo={rotulo}
      aria-disabled={desabilitada || undefined}
      onClick={(evento) => {
        if (desabilitada) evento.preventDefault()
        else onClick?.(evento)
      }}
      className={estilosDoBotao(tom)}
    >
      {children}
    </Slot>
  ) : (
    <button
      type="button"
      aria-label={nome}
      data-rotulo={rotulo}
      disabled={desabilitada}
      onClick={onClick}
      className={estilosDoBotao(tom)}
    >
      {Icone ? <Icone aria-hidden className="size-4" /> : children}
    </button>
  )

  return (
    <Tooltip>
      {/* Botão desabilitado não recebe hover: o vão mostra o tooltip por ele. */}
      <TooltipTrigger asChild>
        {desabilitada && !asChild ? <span className="inline-flex in-data-[menu]:flex">{botao}</span> : botao}
      </TooltipTrigger>
      <TooltipContent>{rotulo}</TooltipContent>
    </Tooltip>
  )
}

/**
 * Uma ação da pílula que pede confirmação: o X vermelho do anexo.
 *
 * O `AlertDialogTrigger` e o `TooltipTrigger` aninhados dividem o mesmo botão — os dois repassam
 * ref e clique por `asChild`, então o foco volta para o ícone ao fechar, como antes.
 */
export function AcaoComConfirmacao({
  rotulo,
  descricaoAcessivel,
  icone: Icone,
  tom = 'perigo',
  desabilitada = false,
  confirmacao,
}: AcaoProps & {
  confirmacao: {
    titulo: ReactNode
    descricao: ReactNode
    rotulo: string
    rotuloDeCancelar?: string
    aoConfirmar: () => void
  }
}) {
  const nome = descricaoAcessivel ?? rotulo
  return (
    <Tooltip>
      <DialogoDeConfirmacao
        gatilho={
          <TooltipTrigger asChild>
            {desabilitada ? (
              <span className="inline-flex in-data-[menu]:flex">
                <button
                  type="button"
                  aria-label={nome}
                  data-rotulo={rotulo}
                  disabled
                  className={estilosDoBotao(tom)}
                >
                  {Icone ? <Icone aria-hidden className="size-4" /> : null}
                </button>
              </span>
            ) : (
              <button type="button" aria-label={nome} data-rotulo={rotulo} className={estilosDoBotao(tom)}>
                {Icone ? <Icone aria-hidden className="size-4" /> : null}
              </button>
            )}
          </TooltipTrigger>
        }
        titulo={confirmacao.titulo}
        descricao={confirmacao.descricao}
        rotulo={confirmacao.rotulo}
        rotuloDeCancelar={confirmacao.rotuloDeCancelar}
        destrutivo={tom === 'perigo'}
        aoConfirmar={confirmacao.aoConfirmar}
      />
      <TooltipContent>{rotulo}</TooltipContent>
    </Tooltip>
  )
}
