import {
  CalendarCheck,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  PartyPopper,
  Plus,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import mascoteAcenando from '@/assets/mascote/acenando.webp'
import { Chip } from '@/components/Chip'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ListaVazia } from '@/components/ListaVazia'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { useAgenda } from '@/hooks/useAgenda'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { useResumoDosConvites } from '@/hooks/useResumoDosConvites'
import { usePapel } from '@/hooks/useSessao'
import { formatarData, formatarMesLongo, formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { ehOpcao } from '@/lib/opcao'
import { type EventoDaTurma, jaPassou, ROTULOS_DE_TIPO, type TipoDeEvento } from '@/types/agenda'
import { IndicadorDoEvento } from '../components/IndicadorDoEvento'
import { CartaoDoEvento } from '../components/CartaoDoEvento'
import { DialogoDeEvento } from '../components/DialogoDeEvento'
import { useExcluirEvento } from '../hooks/useEscritaDaAgenda'
import {
  agruparPorMes,
  dataDoTipo,
  emQuantosDias,
  filtrar,
  intervalo,
  primeiroMesDaqui,
  proximo,
  vazio,
} from '../lib/agenda'

/**
 * Quantos meses o quadro mostra de uma vez.
 *
 * Quatro, como as quatro colunas do modelo: é o que cabe sem a coluna ficar estreita demais para o
 * título de um evento. Além disso, desliza — as setas andam um mês por clique.
 */
const COLUNAS = 4

/** As pílulas de tipo, na ordem em que a turma pensa: os dois dias grandes, depois a rotina. */
const TIPOS = ['Colacao', 'Festa', 'Reuniao', 'Prazo', 'Outro'] as const satisfies readonly TipoDeEvento[]

const ehTipo = (valor: string | null): valor is TipoDeEvento => ehOpcao(valor, ROTULOS_DE_TIPO)

/**
 * A agenda da turma: colação, festa, reunião, prazo — todas as datas num lugar só.
 *
 * **Um quadro de colunas**, como o modelo — só que a coluna é um mês, e não um profissional: uma
 * formatura tem entre 6 e 20 datas espalhadas por dois anos, e a grade hora × dia do modelo daria
 * um dia com um evento e 364 vazios. Quatro meses por vez, e as setas deslizam de mês em mês.
 *
 * A tela abre no mês de hoje, e o que já passou continua no quadro — é só deslizar para trás. Os
 * cartões de datas vencidas ficam discretos para distinguir o passado.
 *
 * A Gestão escreve, a turma inteira lê. Esta é a tela que responde "quando é a prova da beca?" —
 * até aqui, a resposta morava no grupo do WhatsApp.
 */
export default function AgendaPage() {
  const [cadastro, definirCadastro] = useState<false | { evento?: EventoDaTurma; leitura?: boolean }>(false)
  const [excluindo, definirExcluindo] = useState<false | EventoDaTurma>(false)
  // Por onde o quadro está deslizando; `null` é "onde a tela abre sozinha". Fica no componente, e
  // não na URL: é posição de leitura, não recorte do dado — e o recorte, que é o filtro, está lá.
  const [mesEscolhido, definirMesEscolhido] = useState<number | null>(null)
  const { parametros, busca, atualizar } = useFiltrosDaUrl()
  const { tem } = usePapel()
  const ehGestao = tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  const editavel = useEscritaLiberada() && ehGestao

  const agenda = useAgenda()
  const excluir = useExcluirEvento()

  const todos = agenda.data ?? []
  const tipoNaUrl = parametros.get('tipo')
  const tipo = ehTipo(tipoNaUrl) ? tipoNaUrl : null
  const visiveis = filtrar(todos, tipo, busca)
  const meses = agruparPorMes(visiveis)

  // A posição é presa no render que a usa, e não corrigida por efeito: o filtro pode encolher o
  // quadro embaixo do pé de quem já tinha deslizado, e o padrão muda quando a lista muda.
  const ultimoInicio = Math.max(0, meses.length - COLUNAS)
  const padrao = Math.min(primeiroMesDaqui(meses), ultimoInicio)
  const inicio = Math.min(mesEscolhido ?? padrao, ultimoInicio)
  const janela = meses.slice(inicio, inicio + COLUNAS)
  const temMaisMeses = meses.length > COLUNAS

  const emSeguida = proximo(todos)
  const colacao = dataDoTipo(todos, 'Colacao')
  const festa = dataDoTipo(todos, 'Festa')
  const aConfirmar = todos.filter((evento) => !jaPassou(evento) && evento.situacao === 'AConfirmar').length

  const confirmarExclusao = () => {
    if (!excluindo) return

    const evento = excluindo
    definirExcluindo(false)

    excluir.mutate(evento.id, {
      onSuccess: () => toast.info('Evento excluído.'),
      onError: avisarErro,
    })
  }

  if (agenda.isError) return <ErroDaConsulta erro={agenda.error} />

  return (
    <>
      <FaixaDeIndicadores
        rotulo="A agenda em números"
        indicadores={[
          {
            rotulo: 'Próximo evento',
            valor: agenda.data ? (emSeguida?.titulo ?? 'Nada marcado') : null,
            icone: CalendarClock,
            nota: emSeguida ? emQuantosDias(emSeguida.data) : undefined,
          },
          {
            rotulo: 'Colação',
            valor: agenda.data ? (colacao ? formatarData(colacao) : 'A marcar') : null,
            icone: GraduationCap,
            nota: colacao ? emQuantosDias(colacao) : undefined,
          },
          {
            rotulo: 'Festa',
            valor: agenda.data ? (festa ? formatarData(festa) : 'A marcar') : null,
            icone: PartyPopper,
            nota: festa ? emQuantosDias(festa) : undefined,
          },
          {
            rotulo: 'A confirmar',
            valor: agenda.data ? aConfirmar : null,
            icone: CalendarCheck,
            nota: aConfirmar > 0 ? 'de datas que ainda vêm' : undefined,
          },
        ]}
      />

      {ehGestao ? <AvisoDosConvites /> : null}

      {/* As pílulas recortam a lista inteira, passado incluído — por isso ficam acima do cartão,
          como no mural e na festa. A contagem embaixo fala do que ainda vem, que é o que a tela
          mostra aberto. */}
      <FiltrosDaPlanilha
        principal={
          <>
            <Chip tom="claro" ativo={!tipo} contagem={todos.length} onClick={() => atualizar({ tipo: null })}>
              Todas
            </Chip>
            {meses.length > 0 ? (
              <nav aria-label="Navegação da agenda" className="flex flex-wrap items-center gap-2">
                <div className="border-border text-muted-foreground flex h-7 max-w-full min-w-0 items-center rounded-full border">
                  {temMaisMeses ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-6 p-0"
                      aria-label="Meses anteriores"
                      disabled={inicio === 0}
                      onClick={() => definirMesEscolhido(Math.max(0, inicio - 1))}
                    >
                      <ChevronLeft aria-hidden />
                    </Button>
                  ) : null}
                  <p aria-live="polite" aria-atomic="true" className="min-w-0 truncate px-2 text-sm">
                    {intervalo(janela)}
                  </p>
                  {temMaisMeses ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="size-6 p-0"
                      aria-label="Próximos meses"
                      disabled={inicio >= ultimoInicio}
                      onClick={() => definirMesEscolhido(Math.min(ultimoInicio, inicio + 1))}
                    >
                      <ChevronRight aria-hidden />
                    </Button>
                  ) : null}
                </div>
                {temMaisMeses ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border text-muted-foreground hover:bg-card h-7 bg-transparent px-3 text-sm font-normal shadow-none"
                    disabled={inicio === padrao}
                    onClick={() => definirMesEscolhido(null)}
                  >
                    Hoje
                  </Button>
                ) : null}
              </nav>
            ) : null}
          </>
        }
        legenda="Tipo de evento"
        filtros={TIPOS.map((valor) => (
          <Chip
            key={valor}
            ativo={tipo === valor}
            contagem={todos.filter((evento) => evento.tipo === valor).length}
            onClick={() => atualizar({ tipo: tipo === valor ? null : valor })}
          >
            {ROTULOS_DE_TIPO[valor]}
          </Chip>
        ))}
        busca={{
          valor: busca,
          rotulo: 'Buscar evento',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        acaoPrincipal={
          editavel ? (
            <Button size="xs" onClick={() => definirCadastro({})}>
              <Plus aria-hidden />
              Novo evento
            </Button>
          ) : null
        }
        antesDaContagem={
          meses.length > 0 ? (
            <ul
              aria-label="Situações dos eventos"
              className="text-muted-foreground flex flex-wrap items-center gap-4 text-sm"
            >
              <li className="flex items-center gap-1.5">
                <IndicadorDoEvento situacao="Confirmado" />
                <span aria-hidden>Confirmado</span>
              </li>
              <li className="flex items-center gap-1.5">
                <IndicadorDoEvento situacao="AConfirmar" />
                <span aria-hidden>A confirmar</span>
              </li>
              {visiveis.some((evento) => evento.situacao === 'Cancelado') ? (
                <li className="flex items-center gap-1.5">
                  <IndicadorDoEvento situacao="Cancelado" />
                  <span aria-hidden>Cancelado</span>
                </li>
              ) : null}
            </ul>
          ) : null
        }
        contagem={{ mostrando: visiveis.length, total: todos.length, unidade: 'datas' }}
      />

      {agenda.isPending ? <EsqueletoDeTexto linhas={6} /> : null}

      {agenda.data && visiveis.length === 0 ? (
        <ListaVazia
          titulo={vazio(todos.length).titulo}
          dica={vazio(todos.length, ehGestao).dica}
          mascote={mascoteAcenando}
        />
      ) : null}

      {/* O quadro: uma coluna por mês, como o modelo faz com os profissionais. Sem cartão branco em
          volta, como o acervo: a coluna cinza é a moldura, e o quadro fica no fundo da página. */}
      {meses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {janela.map(({ mes, eventos }) => {
            return (
              <section
                key={mes}
                aria-label={formatarMesLongo(mes)}
                className="bg-muted grid min-w-0 content-start gap-3 rounded-3xl p-3"
              >
                <h3 className="flex items-center gap-2 px-1 pt-0.5">
                  <span className="text-foreground truncate font-medium">{formatarMesLongo(mes)}</span>
                  <span className="text-muted-foreground shrink-0 text-sm tabular-nums">
                    {formatarNumero(eventos.length)} {eventos.length === 1 ? 'evento' : 'eventos'}
                  </span>
                </h3>
                <ul className="grid min-w-0 gap-3">
                  {eventos.map((evento) => (
                    <CartaoDoEvento
                      key={evento.id}
                      evento={evento}
                      passado={jaPassou(evento)}
                      aoAbrir={() => definirCadastro({ evento, leitura: true })}
                      aoEditar={editavel ? () => definirCadastro({ evento }) : undefined}
                      aoExcluir={editavel ? () => definirExcluindo(evento) : undefined}
                    />
                  ))}
                </ul>
              </section>
            )
          })}
        </div>
      ) : null}

      <DialogoDeEvento
        aberto={cadastro}
        ehGestao={editavel}
        somenteLeitura={!!cadastro && !!cadastro.leitura}
        aoFechar={() => definirCadastro(false)}
      />

      <DialogoDeConfirmacao
        aberto={excluindo !== false}
        aoFechar={() => definirExcluindo(false)}
        titulo="Excluir o evento?"
        descricao={
          excluindo
            ? `"${excluindo.titulo}" sai da agenda e não aparece para mais ninguém. Se a data só foi desmarcada, cancele em vez de excluir — assim a turma vê que ela existiu.`
            : ''
        }
        rotulo="Excluir"
        rotuloDeCancelar="Voltar"
        destrutivo
        aoConfirmar={confirmarExclusao}
      />
    </>
  )
}

/**
 * O que a agenda precisa dizer à Gestão sobre o convite da festa (Sprint 21).
 *
 * Duas coisas: sem hora e local na festa, nenhum convite sai (P6); e, se a festa foi antecipada
 * depois de os pedidos existirem, quantos pedidos ficaram com parcela vencendo depois do fechamento
 * da lista (P2.1) — bloquear aqui não faz sentido, a data é fato do mundo, mas a comissão precisa
 * saber antes de o convidado descobrir.
 */
function AvisoDosConvites() {
  const resumo = useResumoDosConvites()
  const dados = resumo.data

  if (!dados?.evento) return null

  const avisos = [
    !dados.evento_completo && dados.pedidos_quitados_sem_convite + dados.emitidos > 0
      ? 'Informe o horário e o local da festa para liberar os convites que já foram pagos.'
      : null,
    dados.pedidos_com_parcela_depois_do_fechamento > 0
      ? `${dados.pedidos_com_parcela_depois_do_fechamento} ${dados.pedidos_com_parcela_depois_do_fechamento === 1 ? 'pedido tem' : 'pedidos têm'} parcela de convite com vencimento depois do fechamento da lista, 24 horas antes da festa. O convite só é emitido após o pagamento total. Combine a antecipação com quem fez o pedido.`
      : null,
  ].filter((aviso) => aviso !== null)

  if (avisos.length === 0) return null

  return (
    <output className="bg-warning-bg text-warning-text grid gap-1 rounded-xl p-4 text-sm">
      {avisos.map((aviso) => (
        <p key={aviso}>{aviso}</p>
      ))}
    </output>
  )
}
