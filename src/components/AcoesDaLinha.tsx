import { Slot } from '@radix-ui/react-slot'
import type { LucideIcon } from 'lucide-react'
import type { MouseEventHandler, ReactNode } from 'react'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
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

const estilosDoBotao = (tom: TomDaAcao) =>
  cn(
    'flex h-9 min-w-10 cursor-pointer items-center justify-center px-2.5 transition-colors outline-none focus-visible:bg-accent focus-visible:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40',
    tom === 'perigo'
      ? 'text-destructive hover:bg-destructive/10'
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
        {desabilitada && !asChild ? <span className="inline-flex">{botao}</span> : botao}
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
              <span className="inline-flex">
                <button type="button" aria-label={nome} disabled className={estilosDoBotao(tom)}>
                  {Icone ? <Icone aria-hidden className="size-4" /> : null}
                </button>
              </span>
            ) : (
              <button type="button" aria-label={nome} className={estilosDoBotao(tom)}>
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
