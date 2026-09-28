import { CircleAlert, Download, Hourglass, Ticket, Wallet } from 'lucide-react'
import { Navigate } from 'react-router'
import { BotaoDoLinkDaLoja } from '@/components/BotaoDoLinkDaLoja'
import { Chip } from '@/components/Chip'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { Planilha } from '@/components/Planilha'
import { SeletorDeFiltro } from '@/components/SeletorDeFiltro'
import { Selo, type TomDoSelo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { formatarCentavos, formatarDataHora, formatarNumero } from '@/lib/formato'
import { ehOpcao } from '@/lib/opcao'
import { MEIOS_DE_PAGAMENTO } from '@/types/pagamento'
import { useComprasDaLoja, useExportarCompras, useResumoDaLoja } from '../hooks/useComprasDaLoja'
import { ROTULOS_DA_COMPRA, type StatusDaCompra } from '../types/loja.types'

const TAMANHO_DA_PAGINA = 20

const TOM_DA_COMPRA = {
  Pendente: 'alerta',
  Paga: 'sucesso',
  Expirada: 'neutro',
  ADevolver: 'perigo',
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
  const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()
  const resumo = useResumoDaLoja()
  const exportar = useExportarCompras()

  const statusNaUrl = parametros.get('status')
  const status = ehOpcao(statusNaUrl, ROTULOS_DA_COMPRA) ? statusNaUrl : undefined
  const filtrando = Boolean(status || busca)

  const compras = useComprasDaLoja({ pagina, tamanho: TAMANHO_DA_PAGINA, status, busca: busca || undefined })

  if (compras.data && compras.data.itens.length === 0 && pagina > 1) {
    const ultima = new URLSearchParams(parametros)
    ultima.set('pagina', String(Math.max(1, compras.data.total_paginas)))
    return <Navigate to={{ search: ultima.toString() }} replace />
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
            nota: 'pagaram sem lugar',
          },
          {
            rotulo: 'Arrecadado',
            valor: resumo.data ? formatarCentavos(resumo.data.arrecadado_em_centavos) : null,
            icone: Wallet,
          },
        ]}
      />

      <FiltrosDaPlanilha
        principal={
          <Chip tom="claro" ativo={!status} onClick={() => atualizar({ status: null })}>
            Todas
          </Chip>
        }
        legenda="Situação"
        filtros={
          <SeletorDeFiltro
            rotulo="Situação"
            todos="Situações"
            valor={status}
            opcoes={Object.entries(ROTULOS_DA_COMPRA).map(([id, nome]) => ({ id, nome }))}
            aoMudar={(id) => atualizar({ status: id ?? null })}
          />
        }
        busca={{
          valor: busca,
          rotulo: 'Buscar comprador ou e-mail',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        acoes={
          <>
            <BotaoDoLinkDaLoja tamanho="xs" />
            <Button
              size="xs"
              variant="outline"
              disabled={exportar.isPending}
              onClick={() => exportar.mutate({ status, busca: busca || undefined })}
            >
              <Download aria-hidden />
              {exportar.isPending ? 'Baixando…' : 'Planilha'}
            </Button>
          </>
        }
        contagem={{
          mostrando: compras.data?.itens.length ?? 0,
          total: compras.data?.total ?? 0,
          unidade: 'compras',
        }}
      />

      <Planilha
        rotulo="Compras da loja"
        consulta={compras}
        vazio={{
          titulo: filtrando ? 'Nenhuma compra com esses filtros' : 'Nenhuma compra ainda',
          dica: filtrando
            ? 'Tente outra situação ou outro nome.'
            : 'As compras aparecem aqui quando alguém compra pelo link da loja. Abra a loja num opcional de convite, na tela do Plano.',
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
                {compra.email ? <span className="text-muted-foreground text-xs">{compra.email}</span> : null}
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
              </div>
            </td>
          </tr>
        ))}
      </Planilha>
    </>
  )
}
