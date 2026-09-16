import { ChevronDown, Download, Loader2 } from 'lucide-react'
import { Chip } from '@/components/Chip'
import {
  FORMATOS,
  type FormatoDoRelatorio,
  RELATORIOS,
  type TipoDeRelatorio,
} from '../types/relatorios.types'

/** Id do painel e nome da âncora — um menu de exportação por tela. */
const MENU = 'menu-de-exportacao'

/**
 * O "Exportar" da barra de filtros: o formato em cima, os quatro relatórios embaixo.
 *
 * Mesmo desenho do `BotaoDeFiltros` — `popover` nativo preso ao botão (`[data-painel]`), em que
 * clique fora e Esc fecham sem uma linha de JS.
 *
 * O formato é uma escolha do menu, e não um item por combinação: oito linhas com o mesmo nome
 * repetido duas vezes é uma lista que ninguém lê. Ele fica na URL, com o resto dos filtros, então o
 * tesoureiro que exporta tudo em PDF escolhe uma vez.
 *
 * @param formato O formato em vigor.
 * @param aoTrocarFormato Recebe o formato escolhido; a tela grava na URL.
 * @param aoExportar Recebe o relatório escolhido, para baixar no formato em vigor.
 * @param ocupado Se há um download ou um pedido a caminho.
 */
export function MenuDeExportacao({
  formato,
  aoTrocarFormato,
  aoExportar,
  ocupado,
}: {
  formato: FormatoDoRelatorio
  aoTrocarFormato: (formato: FormatoDoRelatorio) => void
  aoExportar: (tipo: TipoDeRelatorio) => void
  ocupado: boolean
}) {
  return (
    <>
      <button
        type="button"
        popoverTarget={MENU}
        className="text-muted-foreground border-border hover:bg-card focus-visible:ring-ring inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors [anchor-name:--exportar] focus-visible:ring-2 focus-visible:outline-none"
      >
        {ocupado ? (
          <Loader2 className="size-4 animate-spin" aria-hidden />
        ) : (
          <Download className="size-4" aria-hidden />
        )}
        Exportar
        <ChevronDown className="size-4" aria-hidden />
      </button>

      {/* Nenhuma classe de `display` na raiz do popover: o `display: none` que o fecha vem da folha
          do navegador, e qualquer `grid` ou `flex` do autor o vence — o menu nasceria aberto e não
          fecharia nunca. Quem faz o arranjo é a `div` de dentro. */}
      <div
        id={MENU}
        popover="auto"
        data-painel=""
        className="bg-card shadow-cartao text-foreground w-80 rounded-2xl border p-2 [position-anchor:--exportar]"
      >
        <div className="grid gap-1">
          <fieldset className="grid gap-2 px-3 py-2">
            <legend className="text-muted-foreground mb-2 text-sm">Formato</legend>
            <div className="flex flex-wrap gap-2">
              {Object.entries(FORMATOS).map(([valor, { rotulo }]) => (
                <Chip
                  key={valor}
                  ativo={formato === valor}
                  onClick={() => aoTrocarFormato(valor as FormatoDoRelatorio)}
                >
                  {rotulo}
                </Chip>
              ))}
            </div>
            <p className="text-texto-muted text-xs">{FORMATOS[formato].dica}</p>
          </fieldset>

          {RELATORIOS.map((relatorio) => (
            <button
              key={relatorio.tipo}
              type="button"
              disabled={ocupado}
              // `popovertarget` no próprio item: escolher um relatório fecha o menu, e o arquivo
              // vem sem ele aberto por cima da tela.
              popoverTarget={MENU}
              popoverTargetAction="hide"
              onClick={() => aoExportar(relatorio.tipo)}
              className="hover:bg-border/40 focus-visible:ring-ring grid gap-0.5 rounded-xl border-t px-3 py-2 pt-3 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-60"
            >
              <span className="text-foreground text-sm font-medium">{relatorio.rotulo}</span>
              <span className="text-muted-foreground text-xs">{relatorio.descricao}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  )
}
