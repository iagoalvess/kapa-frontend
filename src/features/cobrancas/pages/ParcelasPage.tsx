import { CalendarClock, CircleCheck, ReceiptText, TriangleAlert } from 'lucide-react'
import type { ComponentType } from 'react'
import { Navigate } from 'react-router'
import { Avatar } from '@/components/Avatar'
import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { Chip } from '@/components/Chip'
import { ChipDeStatus, ROTULOS_DE_STATUS } from '@/components/ChipDeStatus'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltroDePeriodo } from '@/components/FiltroDePeriodo'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ColunaOrdenavel, Planilha } from '@/components/Planilha'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { ehDia, formatarCentavos, formatarData } from '@/lib/formato'
import { useParcelas, useResumoDeParcelas } from '../hooks/useParcelas'
import {
  type Parcela,
  type ResumoDeParcelas,
  rotuloDoItem,
  type StatusDaParcela,
} from '../types/cobrancas.types'

const TAMANHO_DA_PAGINA = 20

/**
 * Os filtros de situação no plural, como os de Membros ("Ativos", "Removidos"), com a chave do
 * resumo que conta cada um. Renegociada fica de fora: nada a produz antes do pós-lançamento.
 */
const FILTROS = {
  Aberta: { rotulo: 'A vencer', soma: 'aberta' },
  Vencida: { rotulo: 'Vencidas', soma: 'vencida' },
  Paga: { rotulo: 'Pagas', soma: 'paga' },
  Cancelada: { rotulo: 'Canceladas', soma: 'cancelada' },
} as const satisfies Partial<Record<StatusDaParcela, { rotulo: string; soma: keyof ResumoDeParcelas }>>

const ehStatus = (valor: string | null): valor is StatusDaParcela =>
  valor !== null && valor in ROTULOS_DE_STATUS

interface Props {
  /**
   * O que dá para fazer com a parcela, na última coluna — a baixa manual e o estorno, que moram em
   * `pagamentos`. Chega por aqui porque uma feature não importa de outra: quem compõe é `app/`.
   */
  AcoesDaLinha?: ComponentType<{ parcela: Parcela }>
}

/**
 * As parcelas da turma, por vencimento: quem deve o quê, e quando — no desenho de Membros e do
 * modelo de cobranças: dinheiro no topo, filtros com contagem, busca, a lista com o avatar de cada um.
 *
 * As parcelas nascem na adesão do formando; antes dela a lista é vazia, e a tela diz isso em vez
 * de parecer quebrada. Situação, período e busca vivem na URL — recarregar e mandar o link devolvem
 * a mesma lista. A faixa e as pílulas saem de um resumo só, no mesmo período e busca da lista.
 */
export default function ParcelasPage({ AcoesDaLinha }: Props) {
  const { parametros, pagina, busca, atualizar } = useFiltrosDaUrl()

  const statusNaUrl = parametros.get('status')
  const status = ehStatus(statusNaUrl) ? statusNaUrl : undefined
  const deNaUrl = parametros.get('de')
  const de = ehDia(deNaUrl) ? deNaUrl : undefined
  const ateNaUrl = parametros.get('ate')
  const ate = ehDia(ateNaUrl) ? ateNaUrl : undefined
  const filtrando = Boolean(status || de || ate || busca)

  /** Grava mudanças na URL; vazio remove o parâmetro. Filtro novo sempre volta à página 1. */
  const ordenacao = useOrdenacao(atualizar)
  const parcelas = useParcelas({
    pagina,
    tamanho: TAMANHO_DA_PAGINA,
    status,
    de,
    ate,
    busca: busca || undefined,
    ...ordenacao.filtro,
  })
  const resumo = useResumoDeParcelas({ de, ate, busca: busca || undefined }).data

  // A página pedida deixou de existir (filtro mais estreito): volta para a última que existe.
  if (parcelas.data && parcelas.data.itens.length === 0 && pagina > 1) {
    const ultima = new URLSearchParams(parametros)
    ultima.set('pagina', String(Math.max(1, parcelas.data.total_paginas)))
    return <Navigate to={{ search: ultima.toString() }} replace />
  }

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo das parcelas"
        indicadores={[
          {
            rotulo: de || ate ? 'Parcelas no período' : 'Parcelas',
            valor: resumo?.todas.quantidade ?? null,
            icone: ReceiptText,
          },
          {
            rotulo: 'A receber',
            valor: resumo ? formatarCentavos(resumo.aberta.valor_em_centavos) : null,
            icone: CalendarClock,
          },
          {
            rotulo: 'Vencido, com multa e juros',
            valor: resumo ? formatarCentavos(resumo.vencido_atualizado_em_centavos) : null,
            icone: TriangleAlert,
            sinal: resumo?.vencida.quantidade ? { texto: 'cobrar', tom: 'negativo' } : undefined,
          },
          {
            rotulo: 'Recebido',
            valor: resumo ? formatarCentavos(resumo.paga.valor_em_centavos) : null,
            icone: CircleCheck,
          },
        ]}
      />

      <FiltrosDaPlanilha
        principal={
          <Chip
            tom="claro"
            ativo={!status}
            contagem={resumo?.todas.quantidade}
            onClick={() => atualizar({ status: null })}
          >
            Todas
          </Chip>
        }
        legenda="Situação"
        filtros={Object.entries(FILTROS).map(([valor, { rotulo, soma }]) => (
          <Chip
            key={valor}
            ativo={status === valor}
            contagem={resumo?.[soma].quantidade}
            onClick={() => atualizar({ status: status === valor ? null : valor })}
          >
            {rotulo}
          </Chip>
        ))}
        busca={{
          valor: busca,
          rotulo: 'Buscar formando',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        acoes={
          <BotaoDeFiltros id="filtros-de-parcelas" ligados={de || ate ? 1 : 0}>
            <FiltroDePeriodo de={de} ate={ate} aoMudar={atualizar} />
          </BotaoDeFiltros>
        }
        contagem={{
          mostrando: parcelas.data?.itens.length ?? 0,
          total: parcelas.data?.total ?? 0,
          unidade: 'parcelas',
        }}
      />

      <Planilha
        rotulo="Lista de parcelas"
        consulta={parcelas}
        vazio={{
          titulo: filtrando ? 'Nenhuma parcela com esses filtros' : 'Nenhuma parcela ainda',
          dica: filtrando
            ? 'Tente outra situação, outro período ou outro nome.'
            : 'As parcelas de cada formando nascem quando ele adere ao plano de cobrança em vigor.',
        }}
        ordenacao={ordenacao}
        cabecalho={
          <>
            <ColunaOrdenavel coluna="formando">Formando</ColunaOrdenavel>
            <ColunaOrdenavel coluna="parcela">Parcela</ColunaOrdenavel>
            <ColunaOrdenavel coluna="vencimento">Vencimento</ColunaOrdenavel>
            <ColunaOrdenavel coluna="valor" numerica>
              Valor
            </ColunaOrdenavel>
            {/* "Vencida" sai do vencimento contra hoje, depois da consulta: não ordena. */}
            <th className="py-3 pr-4 font-normal">Situação</th>
            {AcoesDaLinha ? (
              <th className="py-3 font-normal">
                <span className="sr-only">Ações</span>
              </th>
            ) : null}
          </>
        }
        aoMudarPagina={(nova) => atualizar({ pagina: nova === 1 ? null : String(nova) })}
      >
        {(parcelas.data?.itens ?? []).map((parcela) => (
          <tr key={parcela.id} className="border-b last:border-0">
            {/* O formando nomeia a linha: cabeçalho de linha, como nas outras planilhas — é o que
                o leitor de tela repete antes de cada valor. */}
            <th scope="row" className="py-3 pr-4 text-left font-normal">
              <div className="flex items-center gap-3">
                <Avatar nome={parcela.nome} semente={parcela.usuario_id} className="size-8 text-sm" />
                <span className="text-foreground truncate font-medium">{parcela.nome}</span>
              </div>
            </th>
            <td className="py-3 pr-4">
              {rotuloDoItem(parcela)}{' '}
              <span className="text-texto-muted text-xs">
                {parcela.numero}/{parcela.de}
              </span>
            </td>
            <td className="py-3 pr-4">{formatarData(parcela.vencimento)}</td>
            <td className="py-3 pr-4 text-right">
              <ValorDaLinha parcela={parcela} />
            </td>
            <td className="py-3 pr-4">
              <ChipDeStatus status={parcela.status} em_conferencia={parcela.em_conferencia} />
            </td>
            {AcoesDaLinha ? (
              <td className="py-3 text-right">
                <AcoesDaLinha parcela={parcela} />
              </td>
            ) : null}
          </tr>
        ))}
      </Planilha>
    </>
  )
}

/**
 * O valor que importa na situação: o que entrou, na paga; o de hoje, na aberta e na vencida — com o
 * original embaixo quando multa, juros ou desconto o mudaram.
 */
function ValorDaLinha({ parcela }: { parcela: Parcela }) {
  if (typeof parcela.valor_pago_em_centavos === 'number')
    return <>{formatarCentavos(parcela.valor_pago_em_centavos)}</>

  const total = parcela.valor_do_dia?.total_em_centavos ?? parcela.valor_original_em_centavos

  return (
    <span className="grid justify-items-end">
      {formatarCentavos(total)}
      {total !== parcela.valor_original_em_centavos ? (
        <span className="text-muted-foreground text-xs">
          de {formatarCentavos(parcela.valor_original_em_centavos)}
        </span>
      ) : null}
    </span>
  )
}
