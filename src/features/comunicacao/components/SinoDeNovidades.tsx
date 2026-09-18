import { Bell, Megaphone } from 'lucide-react'
import { Link } from 'react-router'
import { Selo } from '@/components/Selo'
import { ROTAS, rotaDoAviso } from '@/config/rotas'
import { formatarDataRelativa, formatarNumero } from '@/lib/formato'
import { useNovidadesDoMural } from '../hooks/useAvisos'

/** Um sino por tela — o cabeçalho é único. */
const PAINEL = 'painel-do-sino'

/** Acima disto o selo vira "9+": três dígitos não cabem num ponto de 18px. */
const TETO_DO_SELO = 9

/**
 * O sino do cabeçalho: o que entrou no mural desde a última vez que a pessoa o abriu.
 *
 * O mural é o único fluxo de novidade do produto — o resto do que está pendente já marca a porta
 * onde se resolve (o ponto no "Meu termo", o número em "Conferir"). Repetir essas pendências aqui
 * seria a mesma coisa dita em dois lugares, e um selo que nunca zera ninguém mais lê.
 *
 * O que zera é **abrir o mural**, e não abrir o balão: dar uma olhada na lista de títulos não é ter
 * lido os avisos. Quem espia e sai continua com o selo aceso.
 *
 * `popover` nativo preso ao botão, como o menu da conta: clique fora e Esc fecham sem uma linha de
 * JS, e o balão vive na camada de cima — dentro do `<header>` ele sairia cortado.
 */
export function SinoDeNovidades() {
  const novidades = useNovidadesDoMural()
  const quantidade = novidades.data?.quantidade ?? 0
  const itens = novidades.data?.itens ?? []

  return (
    <>
      <button
        type="button"
        popoverTarget={PAINEL}
        className="text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-ring relative grid size-9 shrink-0 place-items-center rounded-full transition-colors [anchor-name:--sino] focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="sr-only">
          Novidades do mural{quantidade > 0 ? `: ${formatarNumero(quantidade)} avisos novos` : ', nenhuma'}
        </span>
        <Bell className="size-5" strokeWidth={1.75} aria-hidden />
        {quantidade > 0 ? (
          <span
            aria-hidden
            className="bg-brand text-on-brand border-background absolute -top-0.5 -right-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 px-1 text-[11px] leading-none font-medium tabular-nums"
          >
            {quantidade > TETO_DO_SELO ? `${TETO_DO_SELO}+` : quantidade}
          </span>
        ) : null}
      </button>

      {/* Sem classe de `display` na raiz: o `display:none` que fecha o popover vem da folha do
          navegador, e qualquer `grid` do autor o venceria — o balão nasceria aberto. */}
      <div
        id={PAINEL}
        popover="auto"
        data-painel=""
        className="bg-card shadow-cartao text-foreground w-[min(22rem,92vw)] rounded-2xl border p-2 [position-anchor:--sino]"
      >
        <p className="text-texto-muted px-3 pt-2 pb-1 text-xs">Novidades do mural</p>

        {quantidade === 0 ? (
          <p className="text-muted-foreground px-3 py-6 text-center text-sm">
            Nada novo desde a sua última visita ao mural.
          </p>
        ) : (
          <ul className="grid gap-0.5">
            {itens.map((aviso) => (
              <li key={aviso.id}>
                <Link
                  to={rotaDoAviso(aviso.id)}
                  popoverTarget={PAINEL}
                  popoverTargetAction="hide"
                  className="hover:bg-muted focus-visible:ring-ring grid gap-0.5 rounded-xl px-3 py-2 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <span className="flex items-center gap-2">
                    <Megaphone
                      className="text-muted-foreground size-4 shrink-0"
                      strokeWidth={1.75}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1 truncate text-[15px]">{aviso.titulo}</span>
                    {aviso.destaque ? <Selo tom="alerta">Importante</Selo> : null}
                  </span>
                  <span className="text-texto-muted pl-6 text-xs">
                    {formatarDataRelativa(aviso.publicado_em)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        {/* O link fecha o balão e leva ao mural — que é o que marca tudo como visto. */}
        <Link
          to={ROTAS.mural}
          popoverTarget={PAINEL}
          popoverTargetAction="hide"
          className="text-brand-text hover:bg-muted focus-visible:ring-ring border-border mt-1 block rounded-xl border-t px-3 py-2 pt-3 text-center text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          {quantidade > itens.length ? `Ver o mural (mais ${quantidade - itens.length})` : 'Ver o mural'}
        </Link>
      </div>
    </>
  )
}
