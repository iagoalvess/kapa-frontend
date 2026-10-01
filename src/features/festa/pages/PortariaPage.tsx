import {
  CalendarDays,
  CircleCheck,
  Clock,
  DoorOpen,
  Download,
  MapPin,
  Plus,
  Ticket,
  UserRound,
  WifiOff,
} from 'lucide-react'
import { useState } from 'react'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { toast } from 'sonner'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { Cartao } from '@/components/Cartao'
import { Chip } from '@/components/Chip'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeCartao, EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltroDeOrdenacao } from '@/components/FiltroDeOrdenacao'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ListaDeDados, Dado } from '@/components/ListaDeDados'
import { ListaVazia } from '@/components/ListaVazia'
import { Button } from '@/components/ui/button'
import { ROTAS } from '@/config/rotas'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { useResumoDosConvites } from '@/hooks/useResumoDosConvites'
import { useSessao } from '@/hooks/useSessao'
import { contemBusca } from '@/lib/busca'
import { formatarData, formatarDataHora, formatarHorario } from '@/lib/formato'
import { avisarErro, ErroDeRede, ehErroDaApi } from '@/lib/http/erros'
import { ehOpcao } from '@/lib/opcao'
import { ordenarPor } from '@/lib/ordenar'
import { DialogoDoConvidado } from '../components/DialogoDoConvidado'
import { DetalheDoConvite } from '../components/DetalheDoConvite'
import { DialogoDaValidacao } from '../components/DialogoDaValidacao'
import { ListaDaPortaria } from '../components/ListaDaPortaria'
import {
  useBaixarListaDaPortaria,
  useEmitirPendentes,
  usePortaria,
  useReemitirConvite,
  useSincronizarEntradas,
  useValidarEntrada,
} from '../hooks/useConvitesDaFesta'
import { useEntradasSemRede } from '../hooks/useEntradasSemRede'
import { type ResultadoDaValidacao as Resultado, resultadoDaValidacao } from '../lib/resultadoDaValidacao'
import {
  type ConviteNaPortaria,
  type MeuConvite,
  ROTULOS_DE_SITUACAO,
  ROTULOS_DO_EVENTO,
  type SituacaoNaPortaria,
  type TipoDoEventoDoConvite,
} from '../types/convites.types'

/**
 * O que cada coluna do painel de ordenação compara. Sem escolha vale a ordem da API — o sequencial.
 */
const CHAVES: Record<string, (convite: ConviteNaPortaria) => string> = {
  nome: (convite) => convite.nome_do_convidado ?? '',
  codigo: (convite) => convite.codigo,
}

/**
 * A portaria da festa: a lista e a contagem (P4).
 *
 * O caminho principal é a câmera do celular abrindo a página do convite (decisão 3); a lista é a
 * redundância quando o QR ou a internet falham (P5). A busca filtra a lista **já carregada**: sem
 * internet, ela continua funcionando, e a entrada pode ser registrada no celular para subir depois
 * (decisões 7 e 16). O cartão lateral diz de quando é a lista, porque sem internet ela envelhece.
 *
 * A validação sai da linha da lista, e o resultado — grande — abre num diálogo: quem usa isto está
 * em pé, no escuro, com fila na frente. A lista segue o desenho das planilhas da gestão — filtros,
 * busca e ações à direita.
 */
export default function PortariaPage() {
  const [resultado, definirResultado] = useState<(Resultado & { codigo: string }) | null>(null)
  const [cortesia, definirCortesia] = useState(false)
  const [editando, definirEditando] = useState<false | { convite: MeuConvite }>(false)
  const [reemitindo, definirReemitindo] = useState<ConviteNaPortaria | null>(null)
  const [detalhe, definirDetalhe] = useState<ConviteNaPortaria | null>(null)
  const editavel = useEscritaLiberada()
  const { usuario } = useSessao()
  const { parametros, pagina: paginaNaUrl, busca, atualizar } = useFiltrosDaUrl()
  const ordenacao = useOrdenacao(atualizar)
  const eventoNaUrl = parametros.get('evento')
  const tipo: TipoDoEventoDoConvite = ehOpcao(eventoNaUrl, ROTULOS_DO_EVENTO) ? eventoNaUrl : 'Festa'
  const situacaoNaUrl = parametros.get('situacao')
  const situacao: SituacaoNaPortaria | null = ehOpcao(situacaoNaUrl, ROTULOS_DE_SITUACAO)
    ? situacaoNaUrl
    : null
  const lista = usePortaria(tipo, '')
  const resumo = useResumoDosConvites()
  const validar = useValidarEntrada()
  const reemitir = useReemitirConvite()
  const emitirPendentes = useEmitirPendentes()
  const baixarLista = useBaixarListaDaPortaria()
  const sincronizar = useSincronizarEntradas()
  const semRede = useEntradasSemRede()
  const aparelho = `${usuario?.nome ?? 'Portaria'} · ${navigator.platform || 'celular'}`

  const validarCodigo = (alvo: string) =>
    validar.mutate(
      { codigo: alvo, eventoId: lista.data?.evento.id },
      {
        onSuccess: (entrada) =>
          definirResultado({ ...resultadoDaValidacao({ entrada }, usuario?.id ?? null), codigo: alvo }),
        onError: (erro) =>
          definirResultado({ ...resultadoDaValidacao({ erro }, usuario?.id ?? null), codigo: alvo }),
      },
    )

  /** Marca a entrada neste celular e fecha o resultado — a linha passa a mostrar a marca. */
  const marcarSemRede = (alvo: string) => {
    semRede.marcar(alvo, aparelho)
    definirResultado(null)
  }

  /** Troca de evento limpa o resultado e o filtro de situação: o lote era daquela lista. */
  const trocarEvento = (valor: TipoDoEventoDoConvite) => {
    definirResultado(null)
    atualizar({ evento: valor === 'Festa' ? null : valor, situacao: null })
  }

  /** Clique na linha: abre o detalhe do convite, ou fecha o que já estava aberto. */
  const alternarDetalhe = (convite: ConviteNaPortaria) =>
    definirDetalhe((atual) => (atual?.id === convite.id ? null : convite))

  const seletorDeEvento = (
    <>
      {(Object.keys(ROTULOS_DO_EVENTO) as TipoDoEventoDoConvite[]).map((valor) => (
        <Chip key={valor} tom="claro" ativo={tipo === valor} onClick={() => trocarEvento(valor)}>
          {ROTULOS_DO_EVENTO[valor]}
        </Chip>
      ))}
    </>
  )

  if (lista.isPending)
    return (
      <>
        <nav aria-label="Evento da portaria" className="flex flex-wrap gap-2">
          {seletorDeEvento}
        </nav>
        <EsqueletoDeCartao>
          <EsqueletoDeTexto linhas={6} />
        </EsqueletoDeCartao>
      </>
    )

  if (!lista.data) {
    const nome = tipo === 'Colacao' ? 'colação' : 'festa'

    if (ehErroDaApi(lista.error) && lista.error.status === 404)
      return (
        <>
          <nav aria-label="Evento da portaria" className="flex flex-wrap gap-2">
            {seletorDeEvento}
          </nav>
          <ListaVazia
            mascote={mascoteChecklist}
            titulo={`A ${nome} ainda não está na agenda`}
            dica={
              <>
                A portaria abre com a {nome} marcada em <LinkDaPagina to={ROTAS.agenda}>Agenda</LinkDaPagina>,
                com data, hora e local.
              </>
            }
          />
        </>
      )

    return (
      <>
        <nav aria-label="Evento da portaria" className="flex flex-wrap gap-2">
          {seletorDeEvento}
        </nav>
        <ErroDaConsulta erro={lista.error} aoTentarDeNovo={() => void lista.refetch()} />
      </>
    )
  }

  const { evento, convites } = lista.data
  const offline = lista.isError && lista.error instanceof ErroDeRede
  const contagens = Object.fromEntries(
    (Object.keys(ROTULOS_DE_SITUACAO) as SituacaoNaPortaria[]).map((valor) => [
      valor,
      convites.filter((c) => c.situacao === valor).length,
    ]),
  ) as Record<SituacaoNaPortaria, number>
  const visiveis = ordenarPor(
    convites.filter(
      (c) =>
        (situacao === null || c.situacao === situacao) &&
        (!busca || contemBusca(busca, c.nome_do_convidado, c.convidado_de, c.codigo)),
    ),
    CHAVES,
    ordenacao.por,
    ordenacao.descendente,
  )
  const pendentes = tipo === 'Festa' ? (resumo.data?.pedidos_quitados_sem_convite ?? 0) : 0

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Contagem da portaria"
        indicadores={[
          { rotulo: 'Entraram', valor: lista.data.validados, icone: CircleCheck },
          { rotulo: 'Convites válidos', valor: lista.data.total, icone: Ticket },
          { rotulo: 'Faltam entrar', valor: lista.data.total - lista.data.validados, icone: DoorOpen },
          { rotulo: 'Sem nome ou documento', valor: lista.data.sem_titular, icone: UserRound },
        ]}
      />

      {offline ? (
        <p
          role="alert"
          className="bg-warning-bg text-warning-text flex items-start gap-2 rounded-xl p-4 text-sm"
        >
          <WifiOff className="mt-0.5 size-4 shrink-0" aria-hidden />
          Sem internet. A lista é de {formatarHorario(lista.data.gerada_em)} — um convite revogado depois
          disso ainda aparece válido aqui. Confira nome e documento e registre a entrada no celular.
        </p>
      ) : null}

      {semRede.entradas.length > 0 ? (
        <div className="bg-warning-bg text-warning-text flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 text-sm">
          <span>
            {semRede.entradas.length} entrada{semRede.entradas.length === 1 ? '' : 's'} registrada
            {semRede.entradas.length === 1 ? '' : 's'} neste celular, aguardando internet.
          </span>
          <Button
            size="sm"
            disabled={sincronizar.isPending}
            onClick={() =>
              sincronizar.mutate(semRede.entradas, {
                onSuccess: (r) => {
                  semRede.limpar()
                  toast.success(
                    `${r.validadas} entrada${r.validadas === 1 ? '' : 's'} registrada${r.validadas === 1 ? '' : 's'}` +
                      (r.repetidas
                        ? `, ${r.repetidas} já tinha${r.repetidas === 1 ? '' : 'm'} entrado`
                        : '') +
                      (r.recusadas ? `, ${r.recusadas} recusada${r.recusadas === 1 ? '' : 's'}` : '') +
                      '.',
                  )
                },
                onError: avisarErro,
              })
            }
          >
            {sincronizar.isPending ? 'Sincronizando…' : 'Sincronizar'}
          </Button>
        </div>
      ) : null}

      <FiltrosDaPlanilha
        principal={seletorDeEvento}
        legenda="Situação"
        filtros={
          <>
            <Chip
              tom="claro"
              ativo={situacao === null}
              contagem={convites.length}
              onClick={() => atualizar({ situacao: null })}
            >
              Todos
            </Chip>
            {(Object.keys(ROTULOS_DE_SITUACAO) as SituacaoNaPortaria[]).map((valor) => (
              <Chip
                key={valor}
                ativo={situacao === valor}
                contagem={contagens[valor]}
                onClick={() => atualizar({ situacao: situacao === valor ? null : valor })}
              >
                {ROTULOS_DE_SITUACAO[valor]}
              </Chip>
            ))}
          </>
        }
        busca={{
          valor: busca,
          rotulo: 'Procurar convidado',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        filtrosAvancados={
          <BotaoDeFiltros id="filtros-da-portaria" ligados={ordenacao.por ? 1 : 0}>
            <FiltroDeOrdenacao
              ordenacao={ordenacao}
              opcoes={[
                { por: 'nome', rotulo: 'Convidado' },
                { por: 'codigo', rotulo: 'Convite' },
              ]}
            />
          </BotaoDeFiltros>
        }
        antesDaContagem={
          <>
            {editavel && pendentes > 0 ? (
              <Button
                size="xs"
                disabled={emitirPendentes.isPending}
                onClick={() =>
                  emitirPendentes.mutate(undefined, {
                    onSuccess: ({ quantidade }) =>
                      toast.success(
                        `Convites emitidos para ${quantidade} pedido${quantidade === 1 ? '' : 's'}.`,
                      ),
                    onError: avisarErro,
                  })
                }
              >
                Emitir convites pendentes ({pendentes})
              </Button>
            ) : null}
          </>
        }
        acaoPrincipal={
          editavel ? (
            <Button size="xs" onClick={() => definirCortesia(true)}>
              <Plus aria-hidden />
              Nova cortesia
            </Button>
          ) : null
        }
        contagem={{ mostrando: visiveis.length, total: convites.length, unidade: 'convites' }}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
        <ListaDaPortaria
          convites={convites}
          visiveis={visiveis}
          paginaNaUrl={paginaNaUrl}
          janelaAberta={lista.data.janela_aberta}
          offline={offline}
          editavel={editavel}
          marcadoSemRede={semRede.marcado}
          conviteAberto={detalhe}
          aoDetalhar={alternarDetalhe}
          aoValidar={(convite) => validarCodigo(convite.codigo)}
          aoMarcarSemRede={(convite) => marcarSemRede(convite.codigo)}
          aoEditar={(convite) => definirEditando({ convite: paraEdicao(convite) })}
          aoReemitir={definirReemitindo}
          aoMudarPagina={(numero) => atualizar({ pagina: String(numero) })}
        />

        <div className="grid min-w-0 content-start gap-5">
          <Cartao titulo={evento.titulo}>
            <ListaDeDados>
              <Dado icone={CalendarDays} rotulo="Quando">
                {formatarData(evento.data)}
                {evento.hora ? ` às ${evento.hora.slice(0, 5)}` : ''}
              </Dado>
              <Dado icone={MapPin} rotulo="Onde">
                {evento.local ?? '—'}
              </Dado>
              <Dado icone={Clock} rotulo="Lista gerada em">
                {formatarDataHora(lista.data.gerada_em)}
              </Dado>
            </ListaDeDados>
          </Cartao>

          {/* Sem ícone no título: é a regra dos cartões laterais das telas de formatura e adesão. */}
          <Cartao
            titulo="Exportar lista"
            descricao="Baixe a lista em PDF e leve para a porta — papel não fica sem bateria nem sem sinal."
          >
            <Button
              disabled={baixarLista.isPending}
              onClick={() => baixarLista.mutate(tipo, { onError: avisarErro })}
            >
              <Download aria-hidden />
              {baixarLista.isPending ? 'Baixando…' : 'Baixar lista em PDF'}
            </Button>
          </Cartao>
        </div>
      </div>

      <DialogoDoConvidado
        aberto={cortesia ? 'cortesia' : editando}
        eventoId={evento.id}
        aoFechar={() => (definirCortesia(false), definirEditando(false))}
      />

      <DetalheDoConvite
        convite={detalhe}
        marcadoSemRede={detalhe ? semRede.marcado(detalhe.codigo) : false}
        aoFechar={() => definirDetalhe(null)}
      />

      <DialogoDaValidacao
        resultado={resultado}
        aoFechar={() => definirResultado(null)}
        aoMarcarSemRede={marcarSemRede}
        aoDesfazer={() => definirResultado(null)}
      />

      <DialogoDeConfirmacao
        aberto={reemitindo !== null}
        aoFechar={() => definirReemitindo(null)}
        titulo={`Reemitir o convite ${reemitindo?.codigo ?? ''}?`}
        descricao="O código atual deixa de valer na portaria e o convidado recebe um código novo. Use quando o convite se perdeu ou foi parar com quem não devia."
        rotulo="Reemitir"
        aoConfirmar={() => {
          if (!reemitindo) return
          reemitir.mutate(reemitindo.id, {
            onSuccess: (novo) => {
              toast.success(`Convite reemitido. Código novo: ${novo.codigo}.`)
              definirReemitindo(null)
            },
            onError: avisarErro,
          })
        }}
      />
    </>
  )
}

/** O convite da portaria no formato do diálogo de edição — o documento vem mascarado, e fica se não for redigitado. */
function paraEdicao(convite: ConviteNaPortaria): MeuConvite {
  return {
    id: convite.id,
    sequencial: 0,
    codigo: convite.codigo,
    token: '',
    nome_do_convidado: convite.nome_do_convidado,
    tipo_do_documento: convite.documento?.startsWith('CPF') ? 'Cpf' : convite.documento ? 'Rg' : null,
    documento: convite.documento,
    email_do_convidado: null,
    emitido_em: '',
    validado_em: convite.entrada?.validado_em ?? null,
  }
}
