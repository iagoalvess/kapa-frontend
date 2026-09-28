import { ChartColumn, CircleCheck, Package, ShoppingBag, ShoppingBasket, Wallet } from 'lucide-react'
import { Link, Navigate } from 'react-router'
import { AcoesDaLinha } from '@/components/AcoesDaLinha'
import { Avatar } from '@/components/Avatar'
import { Chip } from '@/components/Chip'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ColunaOrdenavel, Planilha } from '@/components/Planilha'
import { SeletorDeFiltro } from '@/components/SeletorDeFiltro'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { formatarCentavos, formatarData, formatarNumero } from '@/lib/formato'
import { usePedidos, useResumoDosPedidos } from '../hooks/usePedidos'
import { ehOpcao } from '@/lib/opcao'
import { rotuloDoItem, type FiltroDePedidos } from '../types/cobrancas.types'
import { AcoesDoPedido } from '../components/AcoesDoPedido'
import { LiberarConvites } from '../components/LiberarConvites'
import { SituacaoDoPedido } from '../components/SituacaoDoPedido'

const TAMANHO_DA_PAGINA = 20

/** As pílulas de situação, como as de Parcelas, e o filtro que cada uma manda à API. */
const SITUACOES = {
  pagos: { rotulo: 'Pagos', filtro: { status: 'Confirmado', quitado: true } },
  aguardando: { rotulo: 'Aguardando', filtro: { status: 'Confirmado', quitado: false } },
  cancelados: { rotulo: 'Cancelados', filtro: { status: 'Cancelado' } },
} as const satisfies Record<string, { rotulo: string; filtro: Pick<FiltroDePedidos, 'status' | 'quitado'> }>

/**
 * Quem pediu o quê: a lista da turma, com o filtro por item e por situação.
 *
 * Item próprio no menu, e não uma cartão da tela de Plano, por causa de quem **não** é tesouraria: o Plano é
 * tela de tesouraria, e sem esta a comissão ficaria só com a contagem do cartão da festa — sem
 * lugar para responder ao formando que diz "pedi e não apareceu".
 *
 * A conta aberta de cada item — o número que vai ao fornecedor — mora em "Pedidos por item", a
 * porta na linha da busca: como grade de cartões aqui em cima, empurrava a lista para baixo.
 */
export default function PedidosPage() {
  const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()
  const resumo = useResumoDosPedidos()

  const situacaoNaUrl = parametros.get('situacao')
  const situacao = ehOpcao(situacaoNaUrl, SITUACOES) ? situacaoNaUrl : undefined
  const itemNaUrl = parametros.get('item') ?? undefined
  const item = resumo.data?.some((linha) => linha.item_de_cobranca_id === itemNaUrl) ? itemNaUrl : undefined
  const filtrando = Boolean(situacao || item || busca)

  const ordenacao = useOrdenacao(atualizar)
  const pedidos = usePedidos({
    pagina,
    tamanho: TAMANHO_DA_PAGINA,
    ...(situacao ? SITUACOES[situacao].filtro : {}),
    item_de_cobranca_id: item,
    busca: busca || undefined,
    ...ordenacao.filtro,
  })

  // A página pedida deixou de existir (filtro mais estreito): volta para a última que existe.
  if (pedidos.data && pedidos.data.itens.length === 0 && pagina > 1) {
    const ultima = new URLSearchParams(parametros)
    ultima.set('pagina', String(Math.max(1, pedidos.data.total_paginas)))
    return <Navigate to={{ search: ultima.toString() }} replace />
  }

  const linhas = resumo.data ?? []
  const totais = linhas.reduce(
    (soma, linha) => ({
      unidades: soma.unidades + linha.unidades,
      quitadas: soma.quitadas + linha.unidades_quitadas,
      total: soma.total + linha.total_em_centavos,
      pago: soma.pago + linha.pago_em_centavos,
    }),
    { unidades: 0, quitadas: 0, total: 0, pago: 0 },
  )

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo dos pedidos"
        indicadores={[
          {
            rotulo: 'Unidades pedidas',
            valor: resumo.data ? totais.unidades : null,
            icone: Package,
          },
          {
            rotulo: 'Unidades pagas',
            valor: resumo.data ? totais.quitadas : null,
            icone: CircleCheck,
            nota: 'pedidos já quitados',
          },
          {
            rotulo: 'Total pedido',
            valor: resumo.data ? formatarCentavos(totais.total) : null,
            icone: ShoppingBag,
          },
          {
            rotulo: 'Já recebido',
            valor: resumo.data ? formatarCentavos(totais.pago) : null,
            icone: Wallet,
          },
        ]}
      />

      <FiltrosDaPlanilha
        principal={
          <Chip
            tom="claro"
            ativo={!item && !situacao}
            onClick={() => atualizar({ item: null, situacao: null })}
          >
            Todos
          </Chip>
        }
        legenda="Item e situação"
        filtros={
          <>
            {/* Seletor, e não uma pílula por item: com os opcionais crescendo, as pílulas viravam
                várias linhas acima da lista. */}
            <SeletorDeFiltro
              rotulo="Item"
              todos="Itens"
              valor={item}
              opcoes={linhas.map((linha) => ({ id: linha.item_de_cobranca_id, nome: rotuloDoItem(linha) }))}
              aoMudar={(id) => atualizar({ item: id ?? null })}
            />
            {Object.entries(SITUACOES).map(([valor, { rotulo }]) => (
              <Chip
                key={valor}
                ativo={situacao === valor}
                onClick={() => atualizar({ situacao: situacao === valor ? null : valor })}
              >
                {rotulo}
              </Chip>
            ))}
          </>
        }
        busca={{
          valor: busca,
          rotulo: 'Buscar formando',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        acoes={
          <>
            <Button asChild size="xs">
              <Link to={ROTAS.meusPedidos}>
                <ShoppingBasket aria-hidden />
                Meus pedidos
              </Link>
            </Button>
            <Button asChild size="xs">
              <Link to={ROTAS.pedidosPorItem}>
                <ChartColumn aria-hidden />
                Itens
              </Link>
            </Button>
          </>
        }
        quebrarAcoesNoCelular
        contagem={{
          mostrando: pedidos.data?.itens.length ?? 0,
          total: pedidos.data?.total ?? 0,
          unidade: 'pedidos',
        }}
      />

      <Planilha
        rotulo="Lista de pedidos"
        consulta={pedidos}
        vazio={{
          titulo: filtrando ? 'Nenhum pedido com esses filtros' : 'Nenhum pedido ainda',
          dica: filtrando
            ? 'Tente outro item, outra situação ou outro nome.'
            : 'Os pedidos aparecem aqui quando a tesouraria cria um opcional no plano e alguém pede.',
        }}
        ordenacao={ordenacao}
        cabecalho={
          <>
            <ColunaOrdenavel coluna="formando">Formando</ColunaOrdenavel>
            <th className="py-3 pr-4 font-normal">Item</th>
            <ColunaOrdenavel coluna="quantidade" numerica>
              Unidades
            </ColunaOrdenavel>
            <th className="py-3 pr-4 text-right font-normal">Total</th>
            <ColunaOrdenavel coluna="pedido_em">Pedido em</ColunaOrdenavel>
            <th className="py-3 pr-4 font-normal">Situação</th>
          </>
        }
        aoMudarPagina={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
      >
        {(pedidos.data?.itens ?? []).map((pedido) => (
          <tr key={pedido.id} className="border-b last:border-0">
            <th scope="row" className="py-3 pr-4 text-left font-normal">
              <div className="flex items-center gap-3">
                <Avatar nome={pedido.nome} semente={pedido.usuario_id} className="size-8 text-sm" />
                <span className="text-foreground truncate font-medium">{pedido.nome}</span>
              </div>
            </th>
            <td className="py-3 pr-4">{rotuloDoItem(pedido)}</td>
            <td className="py-3 pr-4 text-right tabular-nums">{formatarNumero(pedido.quantidade)}</td>
            <td className="py-3 pr-4 text-right tabular-nums">
              {formatarCentavos(pedido.total_em_centavos)}
            </td>
            <td className="py-3 pr-4 whitespace-nowrap">{formatarData(pedido.pedido_em)}</td>
            <td className="py-3 pr-4">
              <SituacaoDoPedido pedido={pedido} />
            </td>
            <td className="py-3 text-right">
              <AcoesDaLinha rotulo={`Ações do pedido de ${pedido.nome}`}>
                <LiberarConvites pedido={pedido} />
                <AcoesDoPedido pedido={pedido} />
              </AcoesDaLinha>
            </td>
          </tr>
        ))}
      </Planilha>
    </>
  )
}
