import type { UseQueryResult } from '@tanstack/react-query'
import { ChevronDown, ChevronsUpDown, ChevronUp } from 'lucide-react'
import { createContext, type ReactNode, use } from 'react'
import { EsqueletoDeTabela } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { ListaVazia } from '@/components/ListaVazia'
import { Paginacao } from '@/components/Paginacao'
import { cn } from '@/lib/utils'
import type { Pagina } from '@/types/paginacao'

/** A ordenação em vigor e como pedir outra. O `useOrdenacao` da tela devolve exatamente isto. */
export interface Ordenacao {
  /** A coluna ordenada, ou nada — aí vale a ordem padrão da listagem. */
  por?: string
  descendente: boolean
  /** Chamado com a coluna clicada; quem trata decide o próximo passo do ciclo. */
  aoOrdenar: (coluna: string) => void
}

/**
 * A ordenação, do `Planilha` para as colunas do cabeçalho.
 *
 * Por contexto porque o cabeçalho é montado pela tela e passado como `ReactNode` — ele é renderizado
 * aqui dentro, mas escrito lá fora, e passar a ordenação de coluna em coluna repetiria três props em
 * cada `<th>` de seis telas.
 */
const ContextoDeOrdenacao = createContext<Ordenacao | null>(null)

/** A seta do cabeçalho: `align-middle` a centra na linha do rótulo, que é quem dá a linha de base. */
const classesDaSeta = 'inline-block size-3.5 shrink-0 align-middle opacity-30'
const corDaSeta = 'text-brand-text opacity-100'

interface Props<T> {
  /** Nomeia a lista para o leitor de tela: "Lista de membros". */
  rotulo: string
  /** A consulta da página, como o React Query a devolve. */
  consulta: UseQueryResult<Pagina<T>>
  /** Os `<th>` do cabeçalho; a `<tr>` em volta é daqui. */
  cabecalho: ReactNode
  /** Uma `<tr>` por item da página. */
  children: ReactNode
  /**
   * O que dizer quando não veio nada — com filtro ligado, a mensagem costuma mudar.
   *
   * `mascote` é o desenho ao lado do texto, e o padrão é a lupa: lista vazia costuma ser busca que
   * não achou. Onde o vazio é **notícia boa** ("Tudo bateu: nenhuma divergência") ou **começo**
   * ("ninguém aderiu ainda"), passe outro — a lupa ali desenha um fracasso que não houve.
   */
  vazio: { titulo: string; dica: string; mascote?: string }
  /** Chamado com a página pedida. Sem ele, a lista não pagina. */
  aoMudarPagina?: (pagina: number) => void
  /** Sem isto, `ColunaOrdenavel` desenha um cabeçalho comum: a lista não ordena. */
  ordenacao?: Ordenacao
}

/**
 * A lista paginada das telas de gestão — membros, adesões, despesas, fornecedores: o cartão branco,
 * os três estados (carregando, erro, vazio), a tabela e a paginação.
 *
 * Só desenha. Filtro, busca e página vivem na URL da tela, que passa a consulta já feita — assim
 * cada lista continua dona das suas colunas e das suas linhas.
 *
 * @param T O item da lista; vem da consulta, não precisa ser escrito.
 */
export function Planilha<T>({
  rotulo,
  consulta,
  cabecalho,
  children,
  vazio,
  aoMudarPagina,
  ordenacao,
}: Props<T>) {
  const itens = consulta.data?.itens ?? []

  return (
    <>
      <section aria-label={rotulo} className="bg-card shadow-cartao rounded-3xl px-5 py-2">
        {consulta.isPending ? <EsqueletoDeTabela colunas={5} /> : null}

        {consulta.isError ? <ErroDaConsulta erro={consulta.error} className="py-4" /> : null}

        {consulta.data && itens.length === 0 ? <ListaVazia {...vazio} /> : null}

        {itens.length > 0 ? (
          <Tabela cabecalho={cabecalho} ordenacao={ordenacao}>
            {children}
          </Tabela>
        ) : null}
      </section>

      {consulta.data && aoMudarPagina ? (
        <Paginacao
          pagina={consulta.data.pagina}
          totalPaginas={consulta.data.total_paginas}
          total={consulta.data.total}
          ocupado={consulta.isPlaceholderData}
          aoMudar={aoMudarPagina}
        />
      ) : null}
    </>
  )
}

/**
 * A tabela das listas do app: rolagem lateral quando não cabe, cabeçalho em cinza pequeno e a
 * linha divisória embaixo dele.
 *
 * É a casca que a `Planilha` desenha, sem os estados nem a paginação — para a lista curta que já
 * vem inteira com o cartão que a hospeda (as despesas de um fornecedor, os convites por e-mail).
 *
 * @param cabecalho Os `<th>`; a `<tr>` em volta é daqui.
 * @param children Uma `<tr>` por item.
 * @param ordenacao Sem ela, `ColunaOrdenavel` desenha cabeçalho comum: a lista não ordena.
 */
export function Tabela({
  cabecalho,
  children,
  ordenacao,
}: {
  cabecalho: ReactNode
  children: ReactNode
  ordenacao?: Ordenacao
}) {
  return (
    <div className="motion-safe:animate-entrar overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-texto-muted text-left text-xs">
          <tr className="border-b">
            <ContextoDeOrdenacao value={ordenacao ?? null}>{cabecalho}</ContextoDeOrdenacao>
          </tr>
        </thead>
        {/* `tabular-nums`: valor e data alinham coluna a coluna, e não mexe em texto. */}
        <tbody className="tabular-nums">{children}</tbody>
      </table>
    </div>
  )
}

/**
 * Um cabeçalho de coluna que ordena a lista ao ser clicado.
 *
 * Três estados, num ciclo: sem ordenação → crescente → decrescente → sem ordenação, que é voltar à
 * ordem padrão da tela. A seta é o único aviso — apagada enquanto a coluna não é a ordenada, e
 * `aria-sort` diz o mesmo a quem não vê a seta.
 *
 * Sem `ordenacao` no `Planilha` (lista que o servidor não sabe ordenar), vira um `<th>` comum: a
 * tela não precisa saber se aquela coluna ordena ou não para escrever o cabeçalho.
 *
 * @param coluna O nome que o repositório espera em `ordenar_por` — `nome`, `vencimento`.
 * @param numerica Alinha o rótulo à direita, como a coluna de valores embaixo.
 */
export function ColunaOrdenavel({
  coluna,
  numerica = false,
  className,
  children,
}: {
  coluna: string
  numerica?: boolean
  className?: string
  children: ReactNode
}) {
  const ordenacao = use(ContextoDeOrdenacao)
  const classes = cn('py-3 pr-4 font-normal', numerica && 'text-right', className)

  if (!ordenacao) return <th className={classes}>{children}</th>

  const ativa = ordenacao.por === coluna
  const Seta = !ativa ? ChevronsUpDown : ordenacao.descendente ? ChevronDown : ChevronUp

  return (
    <th className={classes} aria-sort={!ativa ? 'none' : ordenacao.descendente ? 'descending' : 'ascending'}>
      {/* Botão de texto, e não caixa `flex`: a linha de base dele é a do próprio rótulo, e o
          cabeçalho ordenável fica na mesma altura do fixo ao lado ("Situação", "Ações"). Com
          `inline-flex`, quem mandava na linha de base era a seta — e na coluna numérica, que
          inverte a ordem, o rótulo subia um pixel e meio só nela. */}
      <button
        type="button"
        onClick={() => ordenacao.aoOrdenar(coluna)}
        className={cn(
          'hover:text-foreground focus-visible:ring-ring cursor-pointer rounded whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:outline-none',
          ativa && 'text-foreground font-medium',
        )}
      >
        {/* A coluna não ordenada guarda o espaço da seta, bem apagada: sem isso o cabeçalho pula de
            largura no primeiro clique. Ordenada, a seta fica na cor da marca — é o que se procura
            de relance para saber por onde a lista está ordenada. Na coluna numérica ela vem antes
            do rótulo, do lado de dentro da tabela. */}
        {numerica ? <Seta className={cn(classesDaSeta, 'mr-1', ativa && corDaSeta)} aria-hidden /> : null}
        {children}
        {numerica ? null : <Seta className={cn(classesDaSeta, 'ml-1', ativa && corDaSeta)} aria-hidden />}
      </button>
    </th>
  )
}
