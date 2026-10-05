import { Clock, Package, PackageOpen, Wallet } from 'lucide-react'
import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { Chip } from '@/components/Chip'
import { EsqueletoDeTabela } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltroDeOrdenacao } from '@/components/FiltroDeOrdenacao'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { ListaVazia } from '@/components/ListaVazia'
import { ColunaOrdenavel, Tabela } from '@/components/Planilha'
import { ROTAS } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { contemBusca } from '@/lib/busca'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { ehOpcao } from '@/lib/opcao'
import { cn } from '@/lib/utils'
import { CORES_DE_TIPO } from '@/types/cobranca'
import { ICONES_DE_TIPO } from '../lib/iconesDeTipo'
import { useResumoDosPedidos } from '../hooks/usePedidos'
import { rotuloDoItem, type ResumoDoItemPedido } from '../types/cobrancas.types'

const aguardando = (linha: ResumoDoItemPedido) => linha.unidades - linha.unidades_quitadas

/**
 * As pílulas de situação, como as de Parcelas. "Pagos" é o item pedido sem nada a quitar;
 * "Esgotados", o limitado sem unidade livre.
 */
const FILTROS = {
  pagos: {
    rotulo: 'Pagos',
    passa: (linha: ResumoDoItemPedido) => linha.unidades > 0 && aguardando(linha) === 0,
  },
  aguardando: { rotulo: 'Aguardando', passa: (linha: ResumoDoItemPedido) => aguardando(linha) > 0 },
  esgotados: { rotulo: 'Esgotados', passa: (linha: ResumoDoItemPedido) => linha.disponivel === 0 },
} as const

/** O valor que cada coluna ordenável compara. "Livres" sem estoque conta como infinito: vai ao fim. */
const COLUNAS = {
  item: rotuloDoItem,
  pedidos: (linha: ResumoDoItemPedido) => linha.pedidos,
  unidades: (linha: ResumoDoItemPedido) => linha.unidades,
  pagas: (linha: ResumoDoItemPedido) => linha.unidades_quitadas,
  aguardando,
  livres: (linha: ResumoDoItemPedido) => linha.disponivel ?? Infinity,
  recebido: (linha: ResumoDoItemPedido) => linha.pago_em_centavos,
} satisfies Record<string, (linha: ResumoDoItemPedido) => string | number>

/**
 * A conta aberta de cada item: 80 · 41 pagos · 27 aguardando · 12 livres. É o número que a comissão
 * leva ao fornecedor ("fecharam 132 convites").
 *
 * Porta de Pedidos, no desenho de Adesões: o "voltar", os números no topo e a lista na largura
 * toda. Era uma grade de cartões em cima da lista de pedidos, que empurrava a lista para baixo.
 *
 * O resumo vem inteiro — uma linha por item —, então situação, busca e ordem se resolvem aqui, sem
 * ida à API; ficam na URL como nas listas paginadas.
 *
 * "Livres" quer dizer **reservados**, não pagos: sem baixa automática, a diferença entre pedido e
 * dinheiro existe, e esconder isso da Gestão seria mentir para quem tem de decidir o que fazer com ela.
 */
export default function PedidosPorItemPage() {
  const { parametros, busca, atualizar } = useFiltrosDaUrl()
  const ordenacao = useOrdenacao(atualizar)
  const situacaoNaUrl = parametros.get('situacao')
  const situacao = ehOpcao(situacaoNaUrl, FILTROS) ? situacaoNaUrl : undefined
  const filtrando = Boolean(situacao || busca)

  const resumo = useResumoDosPedidos()
  const linhas = resumo.data ?? []
  // As contagens das pílulas seguem a busca, como em Parcelas; a faixa segue a turma inteira.
  const achadas = linhas.filter((linha) => contemBusca(busca, rotuloDoItem(linha)))
  const visiveis = situacao ? achadas.filter(FILTROS[situacao].passa) : achadas
  const coluna = ordenacao.por ?? null
  if (ehOpcao(coluna, COLUNAS)) {
    const valor: (linha: ResumoDoItemPedido) => string | number = COLUNAS[coluna]
    const sinal = ordenacao.descendente ? -1 : 1
    visiveis.sort((a, b) => {
      const x = valor(a)
      const y = valor(b)
      return sinal * (typeof x === 'string' ? x.localeCompare(y as string, 'pt-BR') : x - (y as number))
    })
  }

  const soma = (campo: (linha: ResumoDoItemPedido) => number) =>
    resumo.data ? linhas.reduce((total, linha) => total + campo(linha), 0) : null
  const aReceber = soma((linha) => linha.total_em_centavos - linha.pago_em_centavos)
  const temEstoque = linhas.some((linha) => linha.disponivel !== null)

  return (
    <>
      <LinkDeVolta para={ROTAS.pedidos}>Pedidos</LinkDeVolta>

      <FaixaDeIndicadores
        rotulo="Resumo por item"
        indicadores={[
          { rotulo: 'Opcionais à venda', valor: resumo.data ? linhas.length : null, icone: Package },
          {
            rotulo: 'Unidades aguardando',
            valor: soma(aguardando),
            icone: Clock,
            nota: 'pedidas e ainda não quitadas',
          },
          {
            rotulo: 'Unidades livres',
            valor: temEstoque ? soma((linha) => linha.disponivel ?? 0) : resumo.data ? '—' : null,
            icone: PackageOpen,
            nota: temEstoque ? 'no estoque dos itens limitados' : 'nenhum item tem estoque',
          },
          {
            rotulo: 'Falta receber',
            valor: aReceber === null ? null : formatarCentavos(aReceber),
            icone: Wallet,
          },
        ]}
      />

      <FiltrosDaPlanilha
        principal={
          <Chip
            tom="claro"
            ativo={!situacao}
            contagem={resumo.data ? achadas.length : undefined}
            onClick={() => atualizar({ situacao: null })}
          >
            Todos
          </Chip>
        }
        legenda="Situação"
        filtros={Object.entries(FILTROS).map(([valor, { rotulo, passa }]) => (
          <Chip
            key={valor}
            ativo={situacao === valor}
            contagem={resumo.data ? achadas.filter(passa).length : undefined}
            onClick={() => atualizar({ situacao: situacao === valor ? null : valor })}
          >
            {rotulo}
          </Chip>
        ))}
        busca={{
          valor: busca,
          rotulo: 'Buscar item',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        filtrosAvancados={
          <BotaoDeFiltros id="filtros-por-item" ligados={ordenacao.por ? 1 : 0}>
            <FiltroDeOrdenacao
              ordenacao={ordenacao}
              opcoes={[
                { por: 'item', rotulo: 'Item' },
                { por: 'pedidos', rotulo: 'Pedidos' },
                { por: 'unidades', rotulo: 'Unidades' },
                { por: 'pagas', rotulo: 'Pagas' },
                { por: 'aguardando', rotulo: 'Aguardando' },
                { por: 'livres', rotulo: 'Livres' },
                { por: 'recebido', rotulo: 'Recebido' },
              ]}
            />
          </BotaoDeFiltros>
        }
        contagem={{ mostrando: visiveis.length, total: linhas.length, unidade: 'itens' }}
      />

      {/* A casca da `Planilha`, sem a paginação: o resumo não é uma `Pagina`. */}
      <section aria-label="Pedidos por item" className="bg-card shadow-cartao rounded-3xl px-5 py-2">
        {resumo.isPending ? <EsqueletoDeTabela colunas={7} /> : null}
        {resumo.isError ? (
          <ErroDaConsulta
            compacto
            erro={resumo.error}
            className="py-4"
            aoTentarDeNovo={() => void resumo.refetch()}
          />
        ) : null}
        {resumo.data && visiveis.length === 0 ? (
          <ListaVazia
            titulo={filtrando ? 'Nenhum item com esses filtros' : 'Nenhum item pedido ainda'}
            dica={
              filtrando
                ? 'Tente outra situação ou outro nome.'
                : 'Os itens aparecem aqui quando a tesouraria cria um opcional no plano e alguém pede.'
            }
          />
        ) : null}

        {visiveis.length > 0 ? (
          <Tabela
            emLista
            ordenacao={ordenacao}
            cabecalho={
              <>
                <ColunaOrdenavel coluna="item">Item</ColunaOrdenavel>
                <ColunaOrdenavel coluna="pedidos" numerica>
                  Pedidos
                </ColunaOrdenavel>
                <ColunaOrdenavel coluna="unidades" numerica>
                  Unidades
                </ColunaOrdenavel>
                <ColunaOrdenavel coluna="pagas" numerica>
                  Pagas
                </ColunaOrdenavel>
                <ColunaOrdenavel coluna="aguardando" numerica>
                  Aguardando
                </ColunaOrdenavel>
                <ColunaOrdenavel coluna="livres" numerica>
                  Livres
                </ColunaOrdenavel>
                <ColunaOrdenavel coluna="recebido" numerica className="pr-0">
                  Recebido
                </ColunaOrdenavel>
              </>
            }
          >
            {visiveis.map((linha) => {
              const Icone = ICONES_DE_TIPO[linha.tipo]

              return (
                <tr key={linha.item_de_cobranca_id} className="border-b last:border-0">
                  <th scope="row" className="text-foreground py-3 pr-4 text-left font-medium">
                    <div className="flex items-center gap-3">
                      <span
                        className={cn(
                          'text-on-brand inline-flex size-8 shrink-0 items-center justify-center rounded-lg',
                          CORES_DE_TIPO[linha.tipo],
                        )}
                      >
                        <Icone className="size-4" strokeWidth={1.75} aria-hidden />
                      </span>
                      {rotuloDoItem(linha)}
                    </div>
                  </th>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-texto-muted lg:hidden">Pedidos: </span>
                    {formatarNumero(linha.pedidos)}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-texto-muted lg:hidden">Unidades: </span>
                    {formatarNumero(linha.unidades)}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-texto-muted lg:hidden">Pagas: </span>
                    {formatarNumero(linha.unidades_quitadas)}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-texto-muted lg:hidden">Aguardando: </span>
                    {formatarNumero(aguardando(linha))}
                  </td>
                  <td className="py-3 pr-4 text-right">
                    <span className="text-texto-muted lg:hidden">Livres: </span>
                    {linha.disponivel === null ? '—' : formatarNumero(linha.disponivel)}
                  </td>
                  <td className="py-3 text-right whitespace-nowrap">
                    <span className="text-texto-muted block text-xs lg:hidden">Recebido</span>
                    {formatarCentavos(linha.pago_em_centavos)}
                    <span className="text-texto-muted block text-xs">
                      de {formatarCentavos(linha.total_em_centavos)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </Tabela>
        ) : null}
      </section>
    </>
  )
}
