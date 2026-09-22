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
import { usePapel } from '@/hooks/useSessao'
import { diasAte, formatarData, formatarMesLongo, formatarNumero } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { type EventoDaTurma, jaPassou, ROTULOS_DE_TIPO, type TipoDeEvento } from '@/types/agenda'
import { IndicadorDoEvento } from '../components/IndicadorDoEvento'
import { CartaoDoEvento } from '../components/CartaoDoEvento'
import { DialogoDeEvento } from '../components/DialogoDeEvento'
import { useExcluirEvento } from '../hooks/useEscritaDaAgenda'

/**
 * Quantos meses o quadro mostra de uma vez.
 *
 * Quatro, como as quatro colunas do modelo: é o que cabe sem a coluna ficar estreita demais para o
 * título de um evento. Além disso, desliza — as setas andam um mês por clique.
 */
const COLUNAS = 4

/** As pílulas de tipo, na ordem em que a turma pensa: os dois dias grandes, depois a rotina. */
const TIPOS = ['Colacao', 'Festa', 'Reuniao', 'Prazo', 'Outro'] as const satisfies readonly TipoDeEvento[]

const ehTipo = (valor: string | null): valor is TipoDeEvento => valor !== null && valor in ROTULOS_DE_TIPO

/**
 * Filtro e busca acontecem aqui, e não na API.
 *
 * A agenda vem inteira numa consulta só — são dezenas de datas na vida de uma turma —, então
 * filtrar no servidor custaria uma ida a cada pílula clicada para uma lista que já está na
 * memória. É a mesma decisão da tela da festa.
 *
 * @param eventos Todos os eventos da turma.
 * @param tipo Tipo escolhido, ou nulo para todos.
 * @param busca O que foi digitado, comparado sem acento no título, no local e na descrição.
 */
function filtrar(eventos: readonly EventoDaTurma[], tipo: TipoDeEvento | null, busca: string) {
  const termo = semAcento(busca.trim())

  return eventos.filter(
    (evento) =>
      (tipo === null || evento.tipo === tipo) &&
      (termo === '' ||
        semAcento(evento.titulo).includes(termo) ||
        semAcento(evento.local ?? '').includes(termo) ||
        semAcento(evento.descricao ?? '').includes(termo)),
  )
}

/** Busca por texto ignora acento e caixa, como a das listas que o backend atende com `unaccent`. */
const semAcento = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/**
 * Os eventos agrupados por mês, na ordem em que já chegaram da API.
 *
 * O mês é a chave `yyyy-MM-01` — o primeiro dia —, que também serve de entrada para
 * `formatarMesLongo`. Mês sem evento não existe aqui: a distância entre dezembro e julho é o
 * próprio salto de um cabeçalho para o outro, que é o que substitui o calendário do modelo.
 *
 * @param eventos Eventos já ordenados por data.
 */
function agruparPorMes(eventos: readonly EventoDaTurma[]) {
  const meses: { mes: string; eventos: EventoDaTurma[] }[] = []

  for (const evento of eventos) {
    const mes = `${evento.data.slice(0, 7)}-01`
    const ultimo = meses.at(-1)

    if (ultimo?.mes === mes) ultimo.eventos.push(evento)
    else meses.push({ mes, eventos: [evento] })
  }

  return meses
}

/**
 * Em que coluna o quadro abre: a do mês de hoje, ou a do primeiro mês que ainda vem.
 *
 * A turma que ainda não começou a marcar nada — e a que já se formou — caem no primeiro e no
 * último mês, que é o que sobra de sensato nos dois extremos.
 *
 * @param meses Os meses do quadro, do mais antigo para o mais novo.
 */
function primeiroMesDaqui(meses: readonly { eventos: readonly EventoDaTurma[] }[]) {
  const daqui = meses.findIndex((mes) => mes.eventos.some((evento) => !jaPassou(evento)))

  return daqui === -1 ? Math.max(0, meses.length - 1) : daqui
}

/**
 * O que o quadro está mostrando, em texto: "Outubro de 2026 — Março de 2027".
 *
 * É o rótulo do deslizar: sem ele, as setas movem colunas e quem olha não sabe para onde foi —
 * os cabeçalhos das colunas dizem o mês, mas só depois de a pessoa procurar.
 *
 * @param janela Os meses à vista.
 */
function intervalo(janela: readonly { mes: string }[]) {
  const primeiro = janela.at(0)
  const ultimo = janela.at(-1)

  if (!primeiro || !ultimo) return ''

  return primeiro.mes === ultimo.mes
    ? formatarMesLongo(primeiro.mes)
    : `${formatarMesLongo(primeiro.mes)} — ${formatarMesLongo(ultimo.mes)}`
}

/** O próximo evento que ainda vai acontecer e não foi cancelado. */
function proximo(eventos: readonly EventoDaTurma[]) {
  return eventos.find((evento) => !jaPassou(evento) && evento.situacao !== 'Cancelado')
}

/** A data de um tipo único (colação, festa), ignorando o que foi cancelado. */
function dataDoTipo(eventos: readonly EventoDaTurma[], tipo: 'Colacao' | 'Festa') {
  return eventos.find((evento) => evento.tipo === tipo && evento.situacao !== 'Cancelado')?.data ?? null
}

/** Quantos dias faltam, dito como se fala. */
function emQuantosDias(data: string) {
  const dias = diasAte(data)

  if (dias === null) return undefined
  if (dias === 0) return 'é hoje'
  if (dias === 1) return 'é amanhã'

  return `em ${formatarNumero(dias)} dias`
}

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
      onSuccess: () => toast.success('Evento excluído.'),
      onError: (erro) => toast.error(mensagemDoErro(erro)),
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
        acoes={
          editavel ? (
            <Button size="sm" className="h-8" onClick={() => definirCadastro({})}>
              <Plus aria-hidden />
              Novo evento
            </Button>
          ) : null
        }
        antesDaContagem={
          meses.length > 0 ? (
            <ul
              aria-label="Situações dos eventos"
              className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs"
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
          {janela.map(({ mes, eventos }) => (
            <section
              key={mes}
              aria-label={formatarMesLongo(mes)}
              className="bg-muted grid min-w-0 content-start gap-3 rounded-3xl p-3"
            >
              <h3 className="flex items-center gap-2 px-1 pt-0.5">
                <span className="text-foreground truncate font-medium">{formatarMesLongo(mes)}</span>
                <span className="bg-border text-muted-foreground inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium tabular-nums">
                  {formatarNumero(eventos.length)}
                </span>
              </h3>
              <ul className="grid gap-3">
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
          ))}
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
        titulo="Excluir este evento?"
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
 * O que dizer quando o quadro está vazio — e são dois vazios diferentes.
 *
 * Turma sem data nenhuma é começo; quadro vazio com a turma cheia de datas é engano de filtro. Um
 * texto só para os dois mandaria a comissão criar evento quando o que ela precisa é tirar a pílula.
 *
 * @param total Quantos eventos a turma tem, sem filtro.
 * @param ehGestao Se quem olha pode marcar data.
 */
function vazio(total: number, ehGestao = false) {
  if (total > 0) return { titulo: 'Nenhuma data encontrada', dica: 'Tente outra busca ou tire o filtro.' }

  return {
    titulo: 'A turma ainda não tem datas',
    dica: ehGestao
      ? 'Comece pelas duas que todo mundo pergunta: a colação e a festa.'
      : 'A comissão ainda não marcou nenhuma data.',
  }
}
