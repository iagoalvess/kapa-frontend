import { CircleCheck, ListChecks, Scale, Wallet } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate } from 'react-router'
import { toast } from 'sonner'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import mascoteFeliz from '@/assets/mascote/feliz.webp'
import { Avatar } from '@/components/Avatar'
import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { CampoDeMoeda } from '@/components/CampoDeMoeda'
import { Chip } from '@/components/Chip'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ColunaOrdenavel, Planilha } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import {
  diaDeHoje,
  diasAte,
  ehDia,
  formatarCentavos,
  formatarData,
  formatarDataHora,
  formatarNumero,
} from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'
import { rotuloDoItem } from '@/types/cobranca'
import { DialogoDeTexto } from '../components/DialogoDeTexto'
import {
  useAbrirComprovante,
  useConfirmarInformes,
  useDivergencias,
  useInformes,
  useRecusarInforme,
} from '../hooks/useInformes'
import { esquemaDaRecusa, ROTULOS_DE_FORMA } from '../schemas/pagamento.schema'
import type { Divergencia, Informe, Parcela } from '../types/pagamentos.types'

const TAMANHO_DA_PAGINA = 20

/**
 * As três situações da conferência: a fila, e os dois registros do que já saiu dela.
 *
 * Não são etapas que se arrastam — são recortes, e a ordem é a do tempo real: o aviso chega em
 * "A conferir", vira baixa em "Confirmados hoje" e, se o recebido não foi o devido, aparece também
 * em "Divergências". Divergência nasce **depois** da baixa e não tem o que marcar: é registro.
 */
const ABAS = {
  conferir: 'A conferir',
  confirmados: 'Confirmados hoje',
  divergencias: 'Divergências',
} as const

type Aba = keyof typeof ABAS

const ehAba = (valor: string | null): valor is Aba => valor !== null && valor in ABAS

/**
 * As faixas do período do pagamento informado — é o extrato do banco que a tesouraria tem aberto ao
 * lado, e ele se lê por dia.
 *
 * @param hoje Referência; o padrão é agora.
 */
function faixasDoPagamento(hoje = new Date()): Record<string, [string, string]> {
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()
  const dia = hoje.getDate()

  return {
    Hoje: [diaDeHoje(hoje), diaDeHoje(hoje)],
    'Últimos 7 dias': [diaDeHoje(new Date(ano, mes, dia - 6)), diaDeHoje(hoje)],
    'Este mês': [diaDeHoje(new Date(ano, mes, 1)), diaDeHoje(hoje)],
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
  const { parametros, pagina, busca, atualizar: gravarFiltro } = useFiltrosDaUrl()
  const abaNaUrl = parametros.get('aba')
  const aba: Aba = ehAba(abaNaUrl) ? abaNaUrl : 'conferir'
  const deNaUrl = parametros.get('de')
  const de = ehDia(deNaUrl) ? deNaUrl : undefined
  const ateNaUrl = parametros.get('ate')
  const ate = ehDia(ateNaUrl) ? ateNaUrl : undefined
  const filtrando = Boolean(busca || de || ate)

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
    tamanho: TAMANHO_DA_PAGINA,
    busca: busca || undefined,
    de,
    ate,
    ...ordenacaoDe('conferir'),
  })
  const confirmados = useInformes({
    status: 'Confirmado',
    conferidos_hoje: true,
    pagina: paginaDe('confirmados'),
    tamanho: TAMANHO_DA_PAGINA,
    busca: busca || undefined,
    de,
    ate,
    ...ordenacaoDe('confirmados'),
  })
  // A divergência não guarda o dia informado, e sim a baixa: o período é da fila, não dela.
  const divergencias = useDivergencias({
    pagina: paginaDe('divergencias'),
    tamanho: TAMANHO_DA_PAGINA,
    busca: busca || undefined,
    ...ordenacaoDe('divergencias'),
  })

  const pendentes = informes.data?.itens ?? []
  const recebido = (informe: Informe) => valores[informe.id] ?? informe.valor_em_centavos
  const selecionados = pendentes.filter((informe) => marcados.includes(informe.id))
  const totalSelecionado = selecionados.reduce((soma, informe) => soma + recebido(informe), 0)
  const somaDaPagina = pendentes.reduce((soma, informe) => soma + informe.devido_em_centavos, 0)
  // O lote é sempre o da página à vista: `marcados` se esvazia a cada troca de filtro ou de página.
  const paginaInteira = pendentes.length > 0 && selecionados.length === pendentes.length

  const consulta = { conferir: informes, confirmados, divergencias }[aba]
  const total = consulta.data?.total ?? 0
  const mostrando = consulta.data?.itens.length ?? 0

  // Confirmou o último da última página: a página pedida deixou de existir, volta para a última.
  if (consulta.data && mostrando === 0 && pagina > 1) {
    const ultima = new URLSearchParams(parametros)
    ultima.set('pagina', String(Math.max(1, consulta.data.total_paginas)))
    return <Navigate to={{ search: ultima.toString() }} replace />
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
          </>
        }
        busca={{
          valor: busca,
          rotulo: 'Buscar formando',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        acoes={
          <>
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

            {/* O caminho do pagamento que ninguém avisou: a tesouraria viu no extrato e baixa por lá. */}
            <Button asChild size="sm" className="h-8">
              <Link to={ROTAS.parcelas}>Pagou e não avisou?</Link>
            </Button>
          </>
        }
        lote={
          <ConfirmarLote
            informes={selecionados}
            total={totalSelecionado}
            recebido={recebido}
            aoConcluir={() => {
              definirMarcados([])
              definirValores({})
            }}
          />
        }
        contagem={{ mostrando, total, unidade: aba === 'divergencias' ? 'divergências' : 'avisos' }}
      />

      {aba === 'conferir' ? (
        <Planilha
          rotulo="Fila da conferência"
          consulta={informes}
          vazio={{
            titulo: filtrando ? 'Nenhum aviso com esses filtros' : 'Nada a conferir',
            dica: filtrando
              ? 'Tente outro nome ou outro período.'
              : 'Quando um formando avisar que pagou, o aviso aparece aqui.',
            // Fila vazia sem filtro é trabalho em dia, não busca que falhou.
            mascote: filtrando ? undefined : mascoteFeliz,
          }}
          ordenacao={ordenacao}
          cabecalho={
            <>
              {/* Marca a página inteira de uma vez. Meio-termo (alguns marcados) fica no traço do
                  `indeterminate`, que só existe por JS — não há atributo HTML para ele. */}
              <th className="w-9 py-3 pr-2 font-normal">
                <input
                  type="checkbox"
                  aria-label="Marcar todos os avisos desta página"
                  checked={paginaInteira}
                  ref={(campo) => {
                    if (campo) campo.indeterminate = selecionados.length > 0 && !paginaInteira
                  }}
                  onChange={() =>
                    definirMarcados(paginaInteira ? [] : pendentes.map((informe) => informe.id))
                  }
                  className="accent-primary size-4 cursor-pointer"
                />
              </th>
              {/* "Formando" e "Devido" vêm da parcela, buscada depois por id: não ordenam. */}
              <th className="py-3 pr-4 font-normal">Formando</th>
              <ColunaOrdenavel coluna="pago_em">Pagou em</ColunaOrdenavel>
              <th className="py-3 pr-4 text-right font-normal">Devido</th>
              <ColunaOrdenavel coluna="recebido" numerica>
                Recebido
              </ColunaOrdenavel>
              <th className="py-3 font-normal">
                <span className="sr-only">Ações</span>
              </th>
            </>
          }
          aoMudarPagina={(nova) => atualizar({ aba: 'conferir', pagina: nova === 1 ? null : String(nova) })}
        >
          {pendentes.map((informe) => (
            <LinhaDeAviso
              key={informe.id}
              informe={informe}
              marcado={marcados.includes(informe.id)}
              recebido={recebido(informe)}
              aoMarcar={() =>
                definirMarcados((atuais) =>
                  atuais.includes(informe.id)
                    ? atuais.filter((id) => id !== informe.id)
                    : [...atuais, informe.id],
                )
              }
              aoEditarValor={(centavos) =>
                definirValores((atuais) => ({ ...atuais, [informe.id]: centavos }))
              }
              aoRecusar={() => definirMarcados((atuais) => atuais.filter((id) => id !== informe.id))}
            />
          ))}
        </Planilha>
      ) : null}

      {aba === 'confirmados' ? (
        <Planilha
          rotulo="Confirmados hoje"
          consulta={confirmados}
          vazio={{
            titulo: 'Nada confirmado hoje ainda',
            dica: 'As baixas que você fizer hoje aparecem aqui, com a hora de cada uma.',
            // Nenhuma busca aconteceu aqui: o dia é que ainda não começou.
            mascote: mascoteChecklist,
          }}
          ordenacao={ordenacao}
          cabecalho={
            <>
              <th className="py-3 pr-4 font-normal">Formando</th>
              <ColunaOrdenavel coluna="pago_em">Pagou em</ColunaOrdenavel>
              <ColunaOrdenavel coluna="recebido" numerica>
                Baixado
              </ColunaOrdenavel>
              <ColunaOrdenavel coluna="conferido">Conferido</ColunaOrdenavel>
              <th className="py-3 font-normal">
                <span className="sr-only">Ações</span>
              </th>
            </>
          }
          aoMudarPagina={(nova) =>
            atualizar({ aba: 'confirmados', pagina: nova === 1 ? null : String(nova) })
          }
        >
          {(confirmados.data?.itens ?? []).map((informe) => (
            <LinhaDeConfirmado key={informe.id} informe={informe} />
          ))}
        </Planilha>
      ) : null}

      {aba === 'divergencias' ? (
        <Planilha
          rotulo="Divergências"
          consulta={divergencias}
          vazio={{
            titulo: filtrando ? 'Nenhuma divergência com esses filtros' : 'Nenhuma divergência',
            dica: filtrando
              ? 'Tente outro nome.'
              : 'Tudo bateu: nenhuma baixa saiu por valor diferente do devido.',
            // "Tudo bateu" é a melhor notícia da tela; não se anuncia com cara de procura.
            mascote: filtrando ? undefined : mascoteFeliz,
          }}
          ordenacao={ordenacao}
          cabecalho={
            <>
              <th className="py-3 pr-4 font-normal">Formando</th>
              <ColunaOrdenavel coluna="pago_em">Pagou em</ColunaOrdenavel>
              <ColunaOrdenavel coluna="devido" numerica>
                Devido
              </ColunaOrdenavel>
              <ColunaOrdenavel coluna="recebido" numerica>
                Recebido
              </ColunaOrdenavel>
              {/* A diferença é a subtração das duas colunas, feita na projeção: não ordena. */}
              <th className="py-3 pr-4 font-normal">Diferença</th>
              <ColunaOrdenavel coluna="baixa">Baixa</ColunaOrdenavel>
            </>
          }
          aoMudarPagina={(nova) =>
            atualizar({ aba: 'divergencias', pagina: nova === 1 ? null : String(nova) })
          }
        >
          {(divergencias.data?.itens ?? []).map((divergencia) => (
            <LinhaDeDivergencia key={divergencia.recebimento_id} divergencia={divergencia} />
          ))}
        </Planilha>
      ) : null}
    </>
  )
}

/**
 * Quem pagou e qual parcela — o cabeçalho de linha das três planilhas.
 *
 * É `th scope="row"`, como na lista de fornecedores: é o que o leitor de tela repete antes de cada
 * valor da linha.
 */
function Formando({ parcela }: { parcela: Parcela }) {
  return (
    <th scope="row" className="py-3 pr-4 text-left font-normal">
      <div className="flex items-center gap-3">
        <Avatar nome={parcela.nome} semente={parcela.usuario_id} className="size-8 shrink-0 text-sm" />
        <div className="grid min-w-0">
          <span className="text-foreground truncate font-medium">{parcela.nome}</span>
          <span className="text-texto-muted truncate text-xs font-normal">
            {rotuloDoItem(parcela)} {parcela.numero}/{parcela.de} · vence {formatarData(parcela.vencimento)}
          </span>
        </div>
      </div>
    </th>
  )
}

/** A aba nasce antes da ida ao servidor: aberta depois dela, o navegador a trataria como pop-up. */
function useComprovanteEmNovaAba() {
  const comprovante = useAbrirComprovante()

  return (informe_id: string) => {
    const aba = window.open('', '_blank')
    comprovante.mutate(informe_id, {
      onSuccess: (arquivo) => {
        if (aba) aba.location.href = URL.createObjectURL(arquivo)
      },
      onError: (erro) => {
        aba?.close()
        toast.error(mensagemDoErro(erro))
      },
    })
  }
}

/**
 * O comprovante, na mesma pílula das outras ações da linha ("Recusar", "Estornar"). Quem não
 * anexou nada não ganha botão desabilitado: a coluna de ações fica só com o que há para fazer.
 */
function Comprovante({ informe }: { informe: Informe }) {
  const abrir = useComprovanteEmNovaAba()

  if (!informe.tem_comprovante) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => abrir(informe.id)}
      aria-label={`Abrir o comprovante de ${informe.parcela.nome}`}
    >
      Comprovante
    </Button>
  )
}

interface PropsDoAviso {
  informe: Informe
  marcado: boolean
  recebido: number
  aoMarcar: () => void
  aoEditarValor: (centavos: number) => void
  aoRecusar: () => void
}

/**
 * Um aviso na fila: quem pagou, quanto devia, quanto entrou — e as duas saídas, confirmar no lote
 * ou recusar com motivo.
 *
 * O aviso do valor diferente aparece **aqui**, antes de confirmar: depois da baixa a diferença vira
 * divergência, que já não se desfaz por esta tela.
 */
function LinhaDeAviso({ informe, marcado, recebido, aoMarcar, aoEditarValor, aoRecusar }: PropsDoAviso) {
  const liberado = useEscritaLiberada()
  const recusar = useRecusarInforme()
  const difere = recebido !== informe.devido_em_centavos
  const dias = Math.max(0, -(diasAte(informe.informado_em) ?? 0))

  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-2">
        <input
          type="checkbox"
          aria-label={`Marcar o pagamento de ${informe.parcela.nome}`}
          checked={marcado}
          onChange={aoMarcar}
          className="accent-primary size-4 cursor-pointer"
        />
      </td>

      <Formando parcela={informe.parcela} />

      <td className="py-3 pr-4 whitespace-nowrap">
        {formatarData(informe.pago_em)}
        <span className="text-texto-muted block text-xs">
          {dias === 0 ? 'avisou hoje' : `avisou há ${formatarNumero(dias)}d`}
        </span>
      </td>

      <td className="py-3 pr-4 text-right whitespace-nowrap">
        {formatarCentavos(informe.devido_em_centavos)}
      </td>

      {/* Diferente do devido, o próprio campo fica âmbar — é a linha inteira que se lê de relance,
          e um aviso escrito ao lado só faria a coluna crescer. O leitor de tela ouve o mesmo pelo
          texto escondido, que a cor sozinha não alcança. */}
      <td className="py-3 pr-4 text-right">
        <CampoDeMoeda
          value={recebido}
          onChange={aoEditarValor}
          aria-label={`Valor recebido de ${informe.parcela.nome}`}
          // `ml-auto`: o `Input` é `flex`, e caixa de bloco ignora o `text-right` da célula — sem
          // isso o campo encosta na coluna do devido em vez de alinhar com o cabeçalho "Recebido".
          className={cn(
            'ml-auto h-8 w-32 rounded-full px-4 text-right text-sm',
            difere && 'border-warning bg-warning-bg text-warning-text',
          )}
        />
        {difere ? <span className="sr-only">Valor diferente do devido.</span> : null}
      </td>

      <td className="py-3">
        <div className="flex flex-wrap justify-end gap-2">
          <Comprovante informe={informe} />
          <DialogoDeTexto
            gatilho="Recusar"
            titulo="Recusar pagamento"
            descricao={`${informe.parcela.nome} recebe o motivo por e-mail, e a parcela continua em aberto.`}
            campo="motivo"
            rotulo="Motivo"
            esquema={esquemaDaRecusa}
            confirmar={recusar.isPending ? 'Recusando…' : 'Recusar'}
            ocupado={recusar.isPending}
            desabilitado={!liberado}
            aoEnviar={(motivo, concluir, falhar) =>
              recusar.mutate(
                { informe_id: informe.id, motivo },
                {
                  onSuccess: () => {
                    toast.info('Pagamento recusado. O formando foi avisado por e-mail.')
                    aoRecusar()
                    concluir()
                  },
                  onError: falhar,
                },
              )
            }
          />
        </div>
      </td>
    </tr>
  )
}

/** O que a tesouraria já fechou hoje. Sem o que marcar: já está baixado. */
function LinhaDeConfirmado({ informe }: { informe: Informe }) {
  return (
    <tr className="border-b last:border-0">
      <Formando parcela={informe.parcela} />
      <td className="py-3 pr-4 whitespace-nowrap">{formatarData(informe.pago_em)}</td>
      <td className="text-success-text py-3 pr-4 text-right font-medium whitespace-nowrap">
        {formatarCentavos(informe.valor_em_centavos)}
      </td>
      <td className="py-3 pr-4 whitespace-nowrap">
        {informe.conferido_em ? formatarDataHora(informe.conferido_em) : '—'}
      </td>
      <td className="py-3">
        <div className="flex justify-end">
          <Comprovante informe={informe} />
        </div>
      </td>
    </tr>
  )
}

/** Uma baixa que não bateu com o devido. Registro: a diferença não vira saldo nem se resolve aqui. */
function LinhaDeDivergencia({ divergencia }: { divergencia: Divergencia }) {
  const diferenca = divergencia.recebido_em_centavos - divergencia.devido_em_centavos

  return (
    <tr className="border-b last:border-0">
      <Formando parcela={divergencia.parcela} />
      <td className="py-3 pr-4 whitespace-nowrap">{formatarData(divergencia.pago_em)}</td>
      <td className="py-3 pr-4 text-right whitespace-nowrap">
        {formatarCentavos(divergencia.devido_em_centavos)}
      </td>
      <td className="py-3 pr-4 text-right whitespace-nowrap">
        {formatarCentavos(divergencia.recebido_em_centavos)}
      </td>
      <td className="py-3 pr-4">
        <Selo tom="alerta">
          {diferenca > 0 ? 'A mais' : 'A menos'} {formatarCentavos(Math.abs(diferenca))}
        </Selo>
      </td>
      <td className="text-texto-muted py-3">
        {ROTULOS_DE_FORMA[divergencia.forma]}
        <span className="block text-xs">{divergencia.baixado_por}</span>
      </td>
    </tr>
  )
}

interface PropsDoLote {
  informes: Informe[]
  total: number
  recebido: (informe: Informe) => number
  aoConcluir: () => void
}

/**
 * Quantos foram marcados e o botão que fecha o lote, à esquerda da contagem da lista.
 *
 * O botão leva só o essencial — "Confirmar · R$ 650,00"; quantos são fica no rótulo ao lado, na
 * mesma linha em que se lê quantos itens a lista tem. Nada marcado, nada disso aparece.
 */
function ConfirmarLote({ informes, total, recebido, aoConcluir }: PropsDoLote) {
  const confirmar = useConfirmarInformes()
  const liberado = useEscritaLiberada()
  const quantidade = informes.length

  if (quantidade === 0) return null

  return (
    <div className="motion-safe:animate-entrar flex items-center gap-2">
      <span className="text-muted-foreground text-sm">
        {formatarNumero(quantidade)} {quantidade === 1 ? 'selecionado' : 'selecionados'}
      </span>

      <DialogoDeConfirmacao
        gatilho={
          <Button size="sm" className="h-8" disabled={!liberado || confirmar.isPending}>
            Confirmar · {formatarCentavos(total)}
          </Button>
        }
        titulo={`Confirmar ${formatarNumero(quantidade)} ${quantidade === 1 ? 'pagamento' : 'pagamentos'} · ${formatarCentavos(total)}`}
        descricao="Esta ação fica registrada em seu nome. Cada parcela marcada é baixada com o valor recebido, e o formando recebe um e-mail de confirmação."
        rotuloDeCancelar="Voltar"
        rotulo="Confirmar"
        aoConfirmar={() =>
          confirmar.mutate(
            informes.map((informe) => ({
              informe_id: informe.id,
              valor_recebido_em_centavos: recebido(informe),
            })),
            {
              onSuccess: ({ confirmados, ignorados }) => {
                toast.success(
                  `${formatarNumero(confirmados)} ${confirmados === 1 ? 'pagamento confirmado' : 'pagamentos confirmados'}.` +
                    (ignorados ? ` ${formatarNumero(ignorados)} já tinham sido conferidos.` : ''),
                )
                aoConcluir()
              },
              onError: (erro) => toast.error(mensagemDoErro(erro)),
            },
          )
        }
      />
    </div>
  )
}
