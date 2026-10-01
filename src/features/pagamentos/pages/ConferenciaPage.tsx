import { CircleCheck, ListChecks, Scale, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { Chip } from '@/components/Chip'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { diaDeHoje, ehDia, formatarCentavos, somarDias } from '@/lib/formato'
import { ehOpcao } from '@/lib/opcao'
import { AbaADevolver } from '../components/conferencia/AbaADevolver'
import { AbaConferir } from '../components/conferencia/AbaConferir'
import { AbaConfirmados } from '../components/conferencia/AbaConfirmados'
import { AbaDivergencias } from '../components/conferencia/AbaDivergencias'
import { ConfirmarLote } from '../components/conferencia/ConfirmarLote'
import { LateralDaConferencia } from '../components/conferencia/LateralDaConferencia'
import { useDivergencias, useInformes } from '../hooks/useInformes'
import { useValoresADevolver } from '../hooks/useValoresADevolver'
import type { Informe } from '../types/pagamentos.types'
import { useTamanhoDaPagina } from '@/hooks/useTelaGrande'

const TAMANHO_DA_PAGINA = 20

/**
 * As situações da conferência: a fila, os dois registros do que já saiu dela e o dinheiro a devolver.
 *
 * Não são etapas que se arrastam — são recortes, e a ordem é a do tempo real: o aviso chega em
 * "A conferir", vira baixa em "Confirmados hoje" e, se o recebido não foi o devido, aparece também
 * em "Divergências". Divergência nasce **depois** da baixa e não tem o que marcar: é registro.
 *
 * "A devolver" (Sprint 42) é o dinheiro que entrou e não paga mais nada — crédito de pedido,
 * parcela cancelada com pagamento, pago no Mercado Pago sem parcela. É da tesouraria, como a fila:
 * fica aqui até a comissão resolver.
 */
const ABAS = {
  conferir: 'A conferir',
  confirmados: 'Confirmados hoje',
  divergencias: 'Divergências',
  devolver: 'A devolver',
} as const

type Aba = keyof typeof ABAS

/** Como a contagem da lista chama o que ela mostra. */
const UNIDADES: Record<Aba, string> = {
  conferir: 'avisos',
  confirmados: 'avisos',
  divergencias: 'divergências',
  devolver: 'valores',
}

const ehAba = (valor: string | null): valor is Aba => ehOpcao(valor, ABAS)

/**
 * As faixas do período do pagamento informado — é o extrato do banco que a tesouraria tem aberto ao
 * lado, e ele se lê por dia.
 *
 * @param hoje Referência; o padrão é agora.
 */
function faixasDoPagamento(hoje = new Date()): Record<string, [string, string]> {
  const dia = diaDeHoje(hoje)

  return {
    Hoje: [dia, dia],
    'Últimos 7 dias': [somarDias(dia, -6), dia],
    'Este mês': [`${dia.slice(0, 8)}01`, dia],
  }
}

/**
 * A conferência da tesouraria: a fila de avisos de pagamento, o que já foi baixado hoje e as baixas
 * que não bateram com o devido.
 *
 * O desenho é o das outras telas de gestão — membros, adesões, despesas, fornecedores: faixa de
 * indicadores, pílulas e busca numa linha, e uma planilha paginada embaixo. As pílulas trocam a
 * situação; cada uma traz suas colunas, porque divergência não é aviso e não se lê igual.
 *
 * O valor recebido vem preenchido com o informado e se edita na linha: o que entrou na conta é o
 * que vale. Diferente do devido, acende o aviso âmbar ali mesmo — é a chance de corrigir antes de
 * confirmar, porque depois da baixa a diferença vira divergência e já não se desfaz por aqui.
 *
 * A seleção é do lote: marcar várias linhas e confirmar de uma vez, no botão que aparece ao lado da
 * contagem da lista. Ela se esvazia a cada troca de filtro, de situação ou de página — o lote era
 * daquela lista.
 */
export default function ConferenciaPage() {
  const tamanhoDaPagina = useTamanhoDaPagina(TAMANHO_DA_PAGINA)
  const { parametros, pagina, busca, atualizar: gravarFiltro } = useFiltrosDaUrl()
  const { state } = useLocation()
  const abaNaUrl = parametros.get('aba')
  const aba: Aba = ehAba(abaNaUrl) ? abaNaUrl : 'conferir'
  const deNaUrl = parametros.get('de')
  const de = ehDia(deNaUrl) ? deNaUrl : undefined
  const ateNaUrl = parametros.get('ate')
  const ate = ehDia(ateNaUrl) ? ateNaUrl : undefined
  const filtrando = Boolean(busca || de || ate)
  const resolvidos = parametros.get('resolvidos') === 'sim'

  // Só a aba à vista navega; as outras duas ficam na página 1 — o que se quer delas é o total da
  // pílula, e `total` não depende da página pedida.
  const paginaDe = (qual: Aba) => (aba === qual ? pagina : 1)

  const [marcados, definirMarcados] = useState<string[]>([])
  const [valores, definirValores] = useState<Record<string, number>>({})

  /** Grava o filtro na URL; o que muda a lista também limpa o lote, que era daquela lista. */
  const atualizar = (mudancas: Record<string, string | null>) => {
    gravarFiltro(mudancas)
    definirMarcados([])
  }

  // A coluna ordenada é da lista à vista; as outras duas ficam na ordem padrão delas, senão um
  // `ordenar=conferido` vazaria para a fila, que não tem essa coluna.
  const ordenacao = useOrdenacao(atualizar)
  const ordenacaoDe = (qual: Aba) => (aba === qual ? ordenacao.filtro : {})

  const informes = useInformes({
    status: 'Pendente',
    pagina: paginaDe('conferir'),
    tamanho: tamanhoDaPagina,
    busca: busca || undefined,
    de,
    ate,
    ...ordenacaoDe('conferir'),
  })
  const confirmados = useInformes({
    status: 'Confirmado',
    conferidos_hoje: true,
    pagina: paginaDe('confirmados'),
    tamanho: tamanhoDaPagina,
    busca: busca || undefined,
    de,
    ate,
    ...ordenacaoDe('confirmados'),
  })
  // A divergência não guarda o dia informado, e sim a baixa: o período é da fila, não dela.
  const divergencias = useDivergencias({
    pagina: paginaDe('divergencias'),
    tamanho: tamanhoDaPagina,
    busca: busca || undefined,
    ...ordenacaoDe('divergencias'),
  })
  // A pílula conta os que esperam; os resolvidos são consulta à parte, só na aba.
  const aDevolver = useValoresADevolver({
    pagina: paginaDe('devolver'),
    tamanho: tamanhoDaPagina,
    busca: busca || undefined,
    resolvidos: aba === 'devolver' && resolvidos ? true : undefined,
    ...ordenacaoDe('devolver'),
  })

  const pendentes = informes.data?.itens ?? []
  const recebido = (informe: Informe) => valores[informe.id] ?? informe.valor_em_centavos
  const selecionados = pendentes.filter((informe) => marcados.includes(informe.id))
  const totalSelecionado = selecionados.reduce((soma, informe) => soma + recebido(informe), 0)
  const somaDaPagina = pendentes.reduce((soma, informe) => soma + informe.devido_em_centavos, 0)

  const consulta = { conferir: informes, confirmados, divergencias, devolver: aDevolver }[aba]
  const total = consulta.data?.total ?? 0
  const mostrando = consulta.data?.itens.length ?? 0

  const mudarPagina = (qual: Aba) => (nova: number) =>
    atualizar({ aba: qual, pagina: nova === 1 ? null : String(nova) })

  // Confirmou o último da última página: a página pedida deixou de existir, volta para a última.
  if (consulta.data && mostrando === 0 && pagina > 1) {
    const ultima = new URLSearchParams(parametros)
    ultima.set('pagina', String(Math.max(1, consulta.data.total_paginas)))
    return <Navigate to={{ search: ultima.toString() }} state={state} replace />
  }

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo da conferência"
        indicadores={[
          { rotulo: 'A conferir', valor: informes.data?.total ?? null, icone: ListChecks },
          {
            rotulo: 'Soma desta página',
            valor: informes.data ? formatarCentavos(somaDaPagina) : null,
            icone: Wallet,
          },
          { rotulo: 'Confirmados hoje', valor: confirmados.data?.total ?? null, icone: CircleCheck },
          {
            rotulo: 'Divergências',
            valor: divergencias.data?.total ?? null,
            icone: Scale,
            sinal: divergencias.data?.total ? { texto: 'revisar', tom: 'negativo' } : undefined,
          },
        ]}
      />

      <FiltrosDaPlanilha
        principal={
          <Chip
            tom="claro"
            ativo={aba === 'conferir'}
            contagem={informes.data?.total}
            onClick={() => atualizar({ aba: null, ordenar: null, desc: null })}
          >
            {ABAS.conferir}
          </Chip>
        }
        legenda="Situação"
        filtros={
          <>
            <Chip
              ativo={aba === 'confirmados'}
              contagem={confirmados.data?.total}
              onClick={() => atualizar({ aba: 'confirmados', ordenar: null, desc: null })}
            >
              {ABAS.confirmados}
            </Chip>
            <Chip
              ativo={aba === 'divergencias'}
              contagem={divergencias.data?.total}
              onClick={() => atualizar({ aba: 'divergencias', ordenar: null, desc: null })}
            >
              {ABAS.divergencias}
            </Chip>
            <Chip
              ativo={aba === 'devolver'}
              contagem={resolvidos && aba === 'devolver' ? undefined : aDevolver.data?.total}
              onClick={() => atualizar({ aba: 'devolver', resolvidos: null, ordenar: null, desc: null })}
            >
              {ABAS.devolver}
            </Chip>
          </>
        }
        busca={{
          valor: busca,
          rotulo: 'Buscar formando',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        filtrosAvancados={
          <BotaoDeFiltros id="filtros-da-conferencia" ligados={de || ate ? 1 : 0}>
            <fieldset className="grid gap-2">
              <legend className="text-muted-foreground mb-2 text-sm">Pagamento informado</legend>
              <div className="flex flex-wrap gap-2">
                {Object.entries(faixasDoPagamento()).map(([rotulo, [inicio, fim]]) => {
                  const ativo = de === inicio && ate === fim
                  return (
                    <Chip
                      key={rotulo}
                      ativo={ativo}
                      onClick={() => atualizar(ativo ? { de: null, ate: null } : { de: inicio, ate: fim })}
                    >
                      {rotulo}
                    </Chip>
                  )
                })}
              </div>
            </fieldset>
          </BotaoDeFiltros>
        }
        antesDaContagem={
          <>
            <ConfirmarLote
              informes={selecionados}
              total={totalSelecionado}
              recebido={recebido}
              aoConcluir={() => {
                definirMarcados([])
                definirValores({})
              }}
            />
          </>
        }
        contagem={{ mostrando, total, unidade: UNIDADES[aba] }}
      />

      {/* A lateral só na tela bem larga (`2xl`, e não o `xl` de Meus pedidos): a fila tem o campo do
          valor e duas ações por linha, e 22rem a menos a espremeria. Abaixo disso, ela desce. */}
      <div className="grid items-start gap-5 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          {aba === 'conferir' ? (
            <AbaConferir
              consulta={informes}
              ordenacao={ordenacao}
              filtrando={filtrando}
              marcados={marcados}
              recebido={recebido}
              aoMarcar={(id) =>
                definirMarcados((atuais) =>
                  atuais.includes(id) ? atuais.filter((outro) => outro !== id) : [...atuais, id],
                )
              }
              aoEditarValor={(id, centavos) => definirValores((atuais) => ({ ...atuais, [id]: centavos }))}
              aoRecusar={(id) => definirMarcados((atuais) => atuais.filter((outro) => outro !== id))}
              aoMudarPagina={mudarPagina('conferir')}
            />
          ) : null}

          {aba === 'confirmados' ? (
            <AbaConfirmados
              consulta={confirmados}
              ordenacao={ordenacao}
              aoMudarPagina={mudarPagina('confirmados')}
            />
          ) : null}

          {aba === 'divergencias' ? (
            <AbaDivergencias
              consulta={divergencias}
              ordenacao={ordenacao}
              filtrando={filtrando}
              aoMudarPagina={mudarPagina('divergencias')}
            />
          ) : null}

          {aba === 'devolver' ? (
            <AbaADevolver
              consulta={aDevolver}
              ordenacao={ordenacao}
              filtrando={filtrando}
              resolvidos={resolvidos}
              aoAlternarResolvidos={() =>
                atualizar({ resolvidos: resolvidos ? null : 'sim', ordenar: null, desc: null })
              }
              aoMudarPagina={mudarPagina('devolver')}
            />
          ) : null}
        </div>

        {consulta.isPending ? (
          <EsqueletoDeCartoes quantidade={2} className="md:grid-cols-1" />
        ) : (
          <LateralDaConferencia />
        )}
      </div>
    </>
  )
}
