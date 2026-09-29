import { Children, Fragment, isValidElement, type ReactElement, type ReactNode, useId } from 'react'
import { BotaoDeFiltros, ContextoDoPainelDeFiltros } from '@/components/BotaoDeFiltros'
import { CampoDeBusca } from '@/components/CampoDeBusca'
import { AcaoFixa } from '@/components/layout/AcaoFixa'
import { useTelaGrande } from '@/hooks/useTelaGrande'
import { formatarNumero } from '@/lib/formato'

interface Props {
  /** Pílula(s) da primeira linha — normalmente o "Todos", que é tirar o filtro. */
  principal: ReactNode
  /** Pílulas da segunda linha, agrupadas num `fieldset`. */
  filtros?: ReactNode
  /** Nomeia o grupo da segunda linha para o leitor de tela. */
  legenda?: string
  /** A busca da lista: cada tela diz o que se busca ("Buscar membro"). Ausente, a linha fica só com as ações. */
  busca?: { valor: string; rotulo: string; aoBuscar: (termo: string | null) => void }
  /** O `BotaoDeFiltros` (ou o que faz o papel dele): colado à busca em qualquer largura. */
  filtrosAvancados?: ReactNode
  /** As ações secundárias — ir a outra tela, exportar. No celular ficam à vista, na linha das pílulas. */
  acoes?: ReactNode
  /** A ação que é a razão da tela (Nova despesa). No celular vira `AcaoFixa`, acima da barra inferior. */
  acaoPrincipal?: ReactNode
  /** O que fica colado à esquerda da contagem: a ação do lote, uma legenda de cores. */
  antesDaContagem?: ReactNode
  /** "Mostrando 20 de 80 membros" — o da página sobre o total do filtro. Só no computador. */
  contagem?: { mostrando: number; total: number; unidade: string }
  /** Texto no lugar da contagem, para a tela que não lista registros ("1 de janeiro a 16 de setembro"). */
  nota?: ReactNode
}

/**
 * As linhas acima de toda `Planilha`: o filtro principal, a busca e as ações; embaixo os demais
 * filtros e quantos itens a página está mostrando.
 *
 * Só desenha e avisa — o filtro vive na URL da tela, que monta as pílulas e recebe a busca. Onde
 * cada coisa fica é decisão daqui, e não da tela: ela só diz o que é filtro avançado, o que é ação
 * secundária e qual é a principal.
 */
export function FiltrosDaPlanilha(props: Props) {
  return useTelaGrande() ? <NoComputador {...props} /> : <NoCelular {...props} />
}

function NoComputador({
  principal,
  filtros,
  legenda,
  busca,
  filtrosAvancados,
  acoes,
  acaoPrincipal,
  antesDaContagem,
  contagem,
  nota,
}: Props) {
  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {principal}

        {/* Quebra quando falta espaço: o botão da barra não encolhe (`whitespace-nowrap`). */}
        <div className="ml-auto flex flex-wrap gap-2">
          {busca ? (
            <CampoDeBusca valor={busca.valor} rotulo={busca.rotulo} aoBuscar={busca.aoBuscar} />
          ) : null}
          {filtrosAvancados}
          {acoes}
          {acaoPrincipal}
        </div>
      </div>

      {filtros || antesDaContagem || contagem || nota ? (
        <div className="flex flex-wrap items-center gap-2">
          {filtros ? (
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">{legenda ?? 'Filtros'}</legend>
              {filtros}
            </fieldset>
          ) : null}

          {/* Encosta na contagem, e não no rodapé da tela: é aqui que se lê quantos itens a lista
              tem, e é onde a pessoa já está olhando ao terminar de marcar. */}
          <div className="ml-auto flex flex-wrap items-center gap-3">
            {antesDaContagem}

            {contagem && contagem.mostrando > 0 ? (
              <p className="text-muted-foreground text-sm">
                Mostrando {formatarNumero(contagem.mostrando)} de {formatarNumero(contagem.total)}{' '}
                {contagem.unidade}
              </p>
            ) : null}

            {nota ? <p className="text-muted-foreground text-sm">{nota}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/** As pílulas de um trecho da barra, onde quer que estejam embrulhadas (fragmento, `fieldset`). */
function pilulasDe(no: ReactNode): ReactElement<{ ativo?: boolean }>[] {
  return Children.toArray(no).flatMap((filho) => {
    if (!isValidElement<{ ativo?: unknown; children?: ReactNode }>(filho)) return []
    // Pílula é o que tem `ativo` — o `Chip`. O resto é embrulho: desce nos filhos dele.
    if (typeof filho.props.ativo === 'boolean') return [filho as ReactElement<{ ativo?: boolean }>]
    return pilulasDe(filho.props.children)
  })
}

/**
 * O celular (Sprint 41), em duas linhas. Em cima, a busca e o botão de filtros. Embaixo, o que leva a
 * outro lugar — os botões da tela (Adesões, Fornecedores) —, à vista porque é o que não se acha de
 * outro jeito, e no máximo duas pílulas: a primeira ("Todas", "Ativos") e a ligada — ou, sem nenhuma
 * ligada, a segunda, para preencher a linha. Todas as pílulas estão no painel de filtros; a contagem
 * sai, porque o total está na pílula e a página na paginação.
 *
 * O painel é o da tela (`filtrosAvancados`), que recebe as pílulas por `ContextoDoPainelDeFiltros`;
 * sem ele, a barra monta um.
 */
function NoCelular({
  principal,
  filtros,
  legenda,
  busca,
  filtrosAvancados,
  acoes,
  acaoPrincipal,
  antesDaContagem,
  nota,
}: Props) {
  const id = `filtros-${useId()}`
  const todas = [...pilulasDe(principal), ...pilulasDe(filtros)]
  const ligadas = todas.slice(1).filter((pilula) => pilula.props.ativo)
  // Tela cuja pílula não se reconhece (sem `ativo`) segue com a principal à vista, como antes.
  const deFora = todas.length === 0 ? [principal] : [todas[0], ligadas[0] ?? todas[1]]

  const painel =
    todas.length > 1 ? (
      <div className="grid gap-4">
        <div className="grid gap-2">
          <p className="text-muted-foreground text-sm">Mostrar</p>
          <div className="flex flex-wrap gap-2">{principal}</div>
        </div>
        {filtros ? (
          <fieldset className="grid gap-2">
            <legend className="text-muted-foreground mb-2 text-sm">{legenda ?? 'Filtros'}</legend>
            <div className="flex flex-wrap gap-2">{filtros}</div>
          </fieldset>
        ) : null}
      </div>
    ) : null

  return (
    <div className="grid gap-3">
      {busca || filtrosAvancados || painel ? (
        <div className="flex items-center gap-2">
          {busca ? (
            <CampoDeBusca
              valor={busca.valor}
              rotulo={busca.rotulo}
              aoBuscar={busca.aoBuscar}
              className="min-w-0 flex-1"
            />
          ) : (
            <span className="flex-1" />
          )}
          {filtrosAvancados ? (
            <ContextoDoPainelDeFiltros value={painel ? { conteudo: painel, ligados: ligadas.length } : null}>
              {filtrosAvancados}
            </ContextoDoPainelDeFiltros>
          ) : painel ? (
            <BotaoDeFiltros id={id} ligados={ligadas.length}>
              {painel}
            </BotaoDeFiltros>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {deFora.map((pilula, indice) => (
          <Fragment key={indice}>{pilula}</Fragment>
        ))}
        {acoes ? <div className="ml-auto flex flex-wrap justify-end gap-2">{acoes}</div> : null}
      </div>

      {antesDaContagem ? <div className="flex flex-wrap items-center gap-3">{antesDaContagem}</div> : null}
      {nota ? <p className="text-muted-foreground text-sm">{nota}</p> : null}
      {acaoPrincipal ? <AcaoFixa>{acaoPrincipal}</AcaoFixa> : null}
    </div>
  )
}
