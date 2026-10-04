import { CircleAlert, Download, Hourglass, Link2, Ticket, Wallet } from 'lucide-react'
import { AtalhosDaPagina } from '@/components/AtalhosDaPagina'
import { useCopiarLinkDaLoja } from '@/hooks/useCopiarLinkDaLoja'
import { Navigate, useLocation } from 'react-router'
import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { Chip } from '@/components/Chip'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltroDeOrdenacao } from '@/components/FiltroDeOrdenacao'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { Planilha } from '@/components/Planilha'
import { Selo, type TomDoSelo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { formatarCentavos, formatarDataHora, formatarNumero } from '@/lib/formato'
import { ehOpcao } from '@/lib/opcao'
import { MEIOS_DE_PAGAMENTO } from '@/types/pagamento'
import { AcoesDaCompra } from '../components/AcoesDaCompra'
import { LateralDaLoja } from '../components/LateralDaLoja'
import { PedidosDeCancelamento } from '../components/PedidosDeCancelamento'
import { useComprasDaLoja, useExportarCompras, useResumoDaLoja } from '../hooks/useComprasDaLoja'
import { ROTULOS_DA_COMPRA, type StatusDaCompra } from '../types/loja.types'
import { useTamanhoDaPagina, useTelaGrande } from '@/hooks/useTelaGrande'

const TAMANHO_DA_PAGINA = 20

const TOM_DA_COMPRA = {
  Pendente: 'alerta',
  Paga: 'sucesso',
  Expirada: 'neutro',
  ADevolver: 'perigo',
  Devolvida: 'neutro',
} as const satisfies Record<StatusDaCompra, TomDoSelo>

/**
 * As compras da loja pública (Sprint 26), para a Gestão: a lista que sustenta a devolução (P5), com
 * nome, e-mail e valor, e a conta do que está preso esperando pagamento, pela mesma honestidade que mostra
 * quantos aguardam (decisão 3).
 *
 * A devolução é da turma, não do Kapa: a tela entrega a lista e a planilha; o PIX de volta, a comissão
 * faz no banco dela.
 */
export default function ComprasDaLojaPage() {
  const telaGrande = useTelaGrande()
  const linkDaLoja = useCopiarLinkDaLoja()
  const tamanhoDaPagina = useTamanhoDaPagina(TAMANHO_DA_PAGINA)
  const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()
  const { state } = useLocation()
  const resumo = useResumoDaLoja()
  const exportar = useExportarCompras()

  const statusNaUrl = parametros.get('status')
  const status = ehOpcao(statusNaUrl, ROTULOS_DA_COMPRA) ? statusNaUrl : undefined
  const filtrando = Boolean(status || busca)

  const ordenacao = useOrdenacao(atualizar)
  const compras = useComprasDaLoja({
    pagina,
    tamanho: tamanhoDaPagina,
    status,
    busca: busca || undefined,
    ...ordenacao.filtro,
  })

  if (compras.data && compras.data.itens.length === 0 && pagina > 1) {
    const ultima = new URLSearchParams(parametros)
    ultima.set('pagina', String(Math.max(1, compras.data.total_paginas)))
    return <Navigate to={{ search: ultima.toString() }} state={state} replace />
  }

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo da loja"
        indicadores={[
          {
            rotulo: 'Convites vendidos',
            valor: resumo.data ? resumo.data.convites_vendidos : null,
            icone: Ticket,
          },
          {
            rotulo: 'Aguardando PIX',
            valor: resumo.data ? resumo.data.aguardando_pix : null,
            icone: Hourglass,
            nota: 'lugares presos por até 30 min',
          },
          {
            rotulo: 'A devolver',
            valor: resumo.data ? resumo.data.compras_a_devolver : null,
            icone: CircleAlert,
            nota: 'canceladas ou pagas sem lugar',
          },
          {
            rotulo: 'Arrecadado',
            valor: resumo.data ? formatarCentavos(resumo.data.arrecadado_em_centavos) : null,
            icone: Wallet,
          },
        ]}
      />

      <AtalhosDaPagina
        atalhos={[
          {
            titulo: 'Copiar link da loja',
            icone: Link2,
            aoAcionar: () => void linkDaLoja.copiarLink(),
            desabilitado: !linkDaLoja.disponivel,
          },
          {
            titulo: 'Exportar planilha',
            icone: Download,
            aoAcionar: () => exportar.mutate({ status, busca: busca || undefined }),
            carregando: exportar.isPending,
          },
        ]}
      />

      <PedidosDeCancelamento />

      <FiltrosDaPlanilha
        principal={
          <Chip tom="claro" ativo={!status} onClick={() => atualizar({ status: null })}>
            Todas
          </Chip>
        }
        legenda="Situação"
        filtros={Object.entries(ROTULOS_DA_COMPRA).map(([id, nome]) => (
          <Chip
            key={id}
            ativo={status === id}
            onClick={() => atualizar({ status: status === id ? null : id })}
          >
            {nome}
          </Chip>
        ))}
        busca={{
          valor: busca,
          rotulo: 'Buscar comprador ou e-mail',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        filtrosAvancados={
          <BotaoDeFiltros id="filtros-das-compras" ligados={ordenacao.por ? 1 : 0}>
            <FiltroDeOrdenacao
              ordenacao={ordenacao}
              opcoes={[
                { por: 'comprou_em', rotulo: 'Comprou em' },
                { por: 'valor', rotulo: 'Valor' },
                { por: 'comprador', rotulo: 'Comprador' },
              ]}
            />
          </BotaoDeFiltros>
        }
        acoes={
          telaGrande ? (
            <Button
              size="xs"
              disabled={exportar.isPending}
              onClick={() => exportar.mutate({ status, busca: busca || undefined })}
            >
              <Download aria-hidden />
              {exportar.isPending ? 'Baixando…' : 'Planilha'}
            </Button>
          ) : null
        }
        contagem={{
          mostrando: compras.data?.itens.length ?? 0,
          total: compras.data?.total ?? 0,
          unidade: 'compras',
        }}
      />

      {/* A lateral a partir do `2xl`, como na Conferência: a planilha tem sete colunas e, mais
          estreita que isso, as células quebram e a situação sai de vista. Abaixo, ela desce. */}
      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <Planilha
            rotulo="Compras da loja"
            consulta={compras}
            vazio={{
              titulo: filtrando ? 'Nenhuma compra com esses filtros' : 'Nenhuma compra ainda',
              dica: filtrando
                ? 'Tente outra situação ou outro nome.'
                : 'As compras aparecerão aqui quando alguém usar o link da loja. Para começar a vender convites, configure um item opcional no Plano de cobrança.',
            }}
            cabecalho={
              <>
                <th className="py-3 pr-4 font-normal">Comprador</th>
                <th className="py-3 pr-4 font-normal">Convite</th>
                <th className="py-3 pr-4 text-right font-normal">Total</th>
                <th className="py-3 pr-4 font-normal">Meio</th>
                <th className="py-3 pr-4 font-normal">Comprou em</th>
                <th className="py-3 font-normal">Situação</th>
              </>
            }
            aoMudarPagina={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
          >
            {(compras.data?.itens ?? []).map((compra) => (
              <tr key={compra.id} className="border-b last:border-0">
                <th scope="row" className="py-3 pr-4 text-left font-normal">
                  <div className="grid">
                    <span className="text-foreground font-medium">{compra.nome ?? 'Dados apagados'}</span>
                    {compra.email ? (
                      <span className="text-muted-foreground text-xs">{compra.email}</span>
                    ) : null}
                    {compra.cpf ? <span className="text-texto-muted text-xs">{compra.cpf}</span> : null}
                  </div>
                </th>
                <td className="py-3 pr-4">
                  {formatarNumero(compra.quantidade)}× {compra.item}
                </td>
                <td className="py-3 pr-4 text-right tabular-nums">
                  {formatarCentavos(compra.valor_em_centavos)}
                </td>
                <td className="py-3 pr-4">{MEIOS_DE_PAGAMENTO[compra.meio].rotulo}</td>
                <td className="py-3 pr-4 whitespace-nowrap">{formatarDataHora(compra.criada_em)}</td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-1">
                    <Selo tom={TOM_DA_COMPRA[compra.status]}>{ROTULOS_DA_COMPRA[compra.status]}</Selo>
                    {compra.pagador_diferente ? <Selo tom="alerta">Pagou outro CPF</Selo> : null}
                    {compra.pedido_de_cancelamento_aberto ? (
                      <Selo tom="alerta">Pediu cancelamento</Selo>
                    ) : null}
                  </div>
                  {compra.convites_cancelados > 0 && compra.convites_cancelados < compra.quantidade ? (
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatarNumero(compra.convites_cancelados)} de {formatarNumero(compra.quantidade)}{' '}
                      cancelado
                      {compra.convites_cancelados === 1 ? '' : 's'}
                    </p>
                  ) : null}
                  {compra.valor_a_devolver_em_centavos > 0 ? (
                    <p className="text-danger-text mt-1 text-xs">
                      {formatarCentavos(compra.valor_a_devolver_em_centavos)} a devolver
                    </p>
                  ) : null}
                </td>
                <td className="py-3 text-right">
                  <AcoesDaCompra compra={compra} />
                </td>
              </tr>
            ))}
          </Planilha>
        </div>

        {compras.isPending ? (
          <EsqueletoDeCartoes quantidade={1} className="md:grid-cols-1" />
        ) : telaGrande ? (
          <LateralDaLoja />
        ) : null}
      </div>
    </>
  )
}
