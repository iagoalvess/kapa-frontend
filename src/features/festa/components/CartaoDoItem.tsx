import {
  Camera,
  Coins,
  FileText,
  GraduationCap,
  Landmark,
  type LucideIcon,
  Mail,
  Music,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react'
import { TextoEmMarkdown } from '@/components/TextoEmMarkdown'
import { Button } from '@/components/ui/button'
import { useAbrirArquivoDoAcervo } from '@/hooks/useAcervoDaTurma'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { CategoriaDeDespesa } from '@/types/financeiro'
import type { ItemDaFesta } from '@/types/festa'
import { SeloDoItem } from './SeloDoItem'

/** O ícone de cada categoria — o mesmo vocabulário visual das despesas. */
const ICONES = {
  Buffet: UtensilsCrossed,
  Espaco: Landmark,
  Banda: Music,
  Fotografia: Camera,
  Decoracao: Sparkles,
  Convites: Mail,
  Beca: GraduationCap,
  Taxas: Coins,
  Outros: FileText,
} as const satisfies Record<CategoriaDeDespesa, LucideIcon>

interface Props {
  item: ItemDaFesta
  /** A Gestão vê as ações; o formando, só o cartão. */
  ehGestao: boolean
  /** Falso esconde as ações de escrita — formatura fora de `Ativa`. */
  editavel: boolean
  /** Só a Tesouraria lança despesa, e é ela quem contrata. */
  podeContratar: boolean
  aoEditar: () => void
  aoContratar: () => void
  aoCancelar: () => void
  aoReativar: () => void
  aoExcluir: () => void
}

/**
 * Um item da festa: o que é, o que vai ter, de quem, quanto custa e em que pé está.
 *
 * O cartão é a resposta da tela inteira à pergunta "pelo que eu estou pagando?". Por isso o que
 * vai ter vem antes do dinheiro, e o dinheiro vem antes das ações.
 *
 * A barra de quanto do item já foi pago só aparece no contratado: no "a contratar" ela seria uma
 * barra vazia em todo cartão novo, e no cancelado não há o que medir.
 */
export function CartaoDoItem({
  item,
  ehGestao,
  editavel,
  podeContratar,
  aoEditar,
  aoContratar,
  aoCancelar,
  aoReativar,
  aoExcluir,
}: Props) {
  const { abrir, abrindo } = useAbrirArquivoDoAcervo()
  const Icone = ICONES[item.categoria]
  const porFormando = item.rateio === 'PorFormando'
  const contrato = item.documento
  const pagoDoItem =
    item.contratado_em_centavos > 0 ? (item.pago_em_centavos / item.contratado_em_centavos) * 100 : 0

  return (
    <section
      aria-label={item.titulo}
      className={cn(
        'bg-card shadow-cartao grid content-start gap-4 rounded-3xl p-5',
        item.cancelado && 'opacity-70',
      )}
    >
      <header className="flex flex-wrap items-start gap-3">
        <span className="bg-brand-tint text-brand-text inline-flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Icone className="size-5" strokeWidth={1.75} aria-hidden />
        </span>
        <div className="grid min-w-0 flex-1 basis-40 gap-0.5">
          <h3 className="text-foreground flex flex-wrap items-center gap-2 text-lg leading-snug font-medium">
            <span className={cn('min-w-0 break-words', item.cancelado && 'line-through')}>{item.titulo}</span>
            <SeloDoItem estado={item.estado} />
          </h3>
          <p className="text-muted-foreground text-sm">
            {item.fornecedor ?? (item.cancelado ? 'A turma desistiu deste item.' : 'Fornecedor a definir.')}
          </p>
        </div>
      </header>

      {item.o_que_inclui ? (
        <TextoEmMarkdown conteudo={item.o_que_inclui} variante="resumo" className="text-sm" />
      ) : (
        <p className="text-texto-muted text-sm">
          {ehGestao
            ? 'Sem descrição. Diga o que vai ter para a turma saber pelo que está pagando.'
            : 'A comissão ainda não descreveu o que vai ter.'}
        </p>
      )}

      <dl className="grid gap-1 text-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <dt className="text-muted-foreground">
            {item.quantidade_de_despesas > 0 ? 'Contratado' : 'Orçado'}
          </dt>
          {/* Zero sem despesa é "ninguém orçou ainda", e não "custa nada" — é o estado em que os seis
              itens sugeridos nascem, e R$ 0,00 em todos eles faria a tela parecer conta fechada. */}
          <dd className="text-foreground text-base font-medium tabular-nums">
            {item.custo_em_centavos === 0 ? (
              <span className="text-texto-muted text-sm font-normal">Sem orçamento</span>
            ) : (
              formatarCentavos(item.custo_em_centavos)
            )}
          </dd>
        </div>
        {porFormando ? (
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <dt className="text-muted-foreground">Por formando</dt>
            <dd className="text-texto-muted tabular-nums">
              {formatarCentavos(item.valor_previsto_em_centavos)}
              <span className="text-muted-foreground">
                {' '}
                × {formatarNumero(item.quantidade_estimada)} estimados
              </span>
            </dd>
          </div>
        ) : null}
        {item.quantidade_de_despesas > 0 && !item.cancelado ? (
          <div className="grid gap-1.5 pt-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <dt className="text-muted-foreground">Já pago</dt>
              <dd className="text-texto-muted tabular-nums">{formatarCentavos(item.pago_em_centavos)}</dd>
            </div>
            <span className="bg-border h-1.5 overflow-hidden rounded-full">
              <span className="bg-brand block h-full rounded-full" style={{ width: `${pagoDoItem}%` }} />
            </span>
          </div>
        ) : null}
      </dl>

      {/* O contrato é a prova do que a turma comprou — por isso ele fica no cartão, e não escondido
          no acervo. O arquivo continua lá: quem confere formatura e visibilidade é o endpoint do
          acervo, de novo, a cada clique. */}
      {contrato ? (
        <button
          type="button"
          onClick={() => abrir(contrato)}
          disabled={abrindo}
          className="text-brand-text flex w-fit items-center gap-1.5 text-sm underline underline-offset-4"
        >
          <FileText className="size-4 shrink-0" aria-hidden />
          {contrato.titulo}
        </button>
      ) : null}

      {ehGestao && editavel ? (
        <div className="flex flex-wrap gap-2">
          {item.cancelado ? (
            <Button size="sm" variant="outline" onClick={aoReativar}>
              Reativar
            </Button>
          ) : (
            <>
              {podeContratar && item.quantidade_de_despesas === 0 ? (
                <Button size="sm" onClick={aoContratar}>
                  Contratar
                </Button>
              ) : null}
              <Button size="sm" variant="outline" onClick={aoEditar}>
                Editar
              </Button>
              {item.quantidade_de_despesas === 0 ? (
                <Button size="sm" variant="ghost" onClick={aoExcluir}>
                  Excluir
                </Button>
              ) : (
                <Button size="sm" variant="ghost" onClick={aoCancelar}>
                  Cancelar item
                </Button>
              )}
            </>
          )}
        </div>
      ) : null}
    </section>
  )
}
