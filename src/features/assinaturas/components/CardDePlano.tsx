import { Check } from 'lucide-react'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { cn } from '@/lib/utils'
import type { Plano } from '../types/assinaturas.types'
import { ICONE_DE_PLANO_PADRAO, ICONES_DE_PLANO } from '@/config/planos'

const POR_CICLO = { Mensal: '/mês', Anual: '/ano' } as const

/** Quanto o preço com desconto economiza, em porcentagem inteira. */
const descontoEmPorcento = (plano: Plano) =>
  plano.preco_cheio_em_centavos
    ? Math.round((1 - plano.preco_em_centavos / plano.preco_cheio_em_centavos) * 100)
    : 0

/**
 * Um plano, lado a lado com os outros: nome, para quem serve, preço, limite e os módulos incluídos.
 *
 * O destacado — o recomendado, ou o que a turma já assina — ganha borda `--brand-border` e faixa
 * `--brand` com texto `--on-brand`.
 *
 * Quem não pode contratar vê o botão desabilitado com o motivo: em `title`, para o mouse, e num
 * parágrafo só de leitor de tela, ligado ao botão por `aria-describedby` — `title` sozinho não
 * chega a quem navega por teclado.
 *
 * @param atual Se é o plano que a turma já assina.
 * @param aoContratar Chamado com o código do plano. Ausente, o botão fica desabilitado.
 * @param motivo Por que não dá para contratar. Vira o texto de apoio do botão desabilitado.
 * @param contratando Se o checkout deste plano está a caminho do provedor.
 */
export function CardDePlano({
  plano,
  atual = false,
  aoContratar,
  motivo,
  contratando = false,
}: {
  plano: Plano
  atual?: boolean
  aoContratar?: (codigo: string) => void
  motivo?: string
  contratando?: boolean
}) {
  const Icone = ICONES_DE_PLANO[plano.codigo] ?? ICONE_DE_PLANO_PADRAO
  const destaque = atual || plano.recomendado
  const desconto = descontoEmPorcento(plano)
  const idDoMotivo = `motivo-${plano.codigo}`

  return (
    <article
      aria-labelledby={`plano-${plano.codigo}`}
      className={cn(
        'bg-card shadow-cartao flex flex-col overflow-hidden rounded-3xl border',
        destaque ? 'border-brand-border border-2' : 'border-border',
      )}
    >
      {destaque ? (
        <p className="bg-brand text-on-brand px-5 py-1.5 text-center text-xs font-semibold tracking-wide uppercase">
          {atual ? 'Plano atual' : 'Recomendado'}
        </p>
      ) : null}

      <div className="flex flex-1 flex-col gap-4 p-5">
        <header className="grid gap-2">
          <span className="bg-brand-tint text-brand-text inline-flex size-10 items-center justify-center rounded-xl">
            <Icone className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <h2 id={`plano-${plano.codigo}`} className="text-foreground text-lg font-medium">
            {plano.nome}
          </h2>
          <p className="text-muted-foreground text-sm">{plano.descricao}</p>
        </header>

        <div className="grid gap-1">
          <p className="text-foreground">
            <span className="text-3xl font-semibold tracking-tight">
              {formatarCentavos(plano.preco_em_centavos)}
            </span>
            <span className="text-muted-foreground text-sm"> {POR_CICLO[plano.ciclo]}</span>
          </p>

          {desconto > 0 ? (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <s className="text-muted-foreground">{formatarCentavos(plano.preco_cheio_em_centavos)}</s>
              <Selo tom="marca">Economize {desconto}%</Selo>
            </p>
          ) : null}

          {plano.ciclo === 'Anual' ? (
            <p className="text-muted-foreground text-sm">
              Equivale a {formatarCentavos(Math.round(plano.preco_em_centavos / 12))} por mês
            </p>
          ) : null}
        </div>

        <p className="bg-muted text-muted-foreground rounded-lg px-3 py-2 text-center text-sm">
          Até {formatarNumero(plano.limite_de_formandos)} formandos
        </p>

        <ul className="grid gap-2 text-sm">
          {plano.modulos.map((modulo) => (
            <li key={modulo} className="text-foreground flex items-start gap-2">
              <Check className="text-brand-text mt-0.5 size-4 shrink-0" strokeWidth={2.5} aria-hidden />
              {modulo}
            </li>
          ))}
        </ul>

        {/* O `title` mora no `span`: em botão desabilitado o navegador não dispara o hover. */}
        <span className="mt-auto grid pt-1" title={motivo}>
          <Button
            disabled={!aoContratar || contratando}
            aria-describedby={motivo ? idDoMotivo : undefined}
            onClick={() => aoContratar?.(plano.codigo)}
          >
            {atual ? 'Plano atual' : contratando ? 'Indo para o pagamento…' : `Contratar ${plano.nome}`}
          </Button>
          {motivo ? (
            <span id={idDoMotivo} className="sr-only">
              {motivo}
            </span>
          ) : null}
        </span>
      </div>
    </article>
  )
}
