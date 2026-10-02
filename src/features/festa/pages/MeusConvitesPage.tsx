import {
  CalendarClock,
  ExternalLink,
  GraduationCap,
  Link2,
  PartyPopper,
  Pencil,
  Ticket,
  TicketCheck,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import mascoteCelular from '@/assets/mascote/celular.webp'
import { AcaoDaLinha, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { CartaoDeValor } from '@/components/CartaoDeValor'
import { Chip } from '@/components/Chip'
import { EsqueletoDeCartao, EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { ListaVazia } from '@/components/ListaVazia'
import { Paginacao } from '@/components/Paginacao'
import { ColunaOrdenavel, Tabela } from '@/components/Planilha'
import { Selo, type TomDoSelo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { ROTAS, rotaDoIngresso } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import { useTamanhoDaPagina } from '@/hooks/useTelaGrande'
import { contemBusca } from '@/lib/busca'
import { copiar } from '@/lib/copiar'
import { formatarData, formatarDataHora, formatarHora, formatarNumero } from '@/lib/formato'
import { ehOpcao } from '@/lib/opcao'
import { paginar } from '@/lib/paginar'
import { cn } from '@/lib/utils'
import type { EventoDoConvite } from '@/types/festa'
import { DialogoDoConvidado } from '../components/DialogoDoConvidado'
import { useMeusConvites } from '../hooks/useConvitesDaFesta'
import type { MeuConvite, TipoDoEventoDoConvite } from '../types/convites.types'

/** Os eventos que a lista separa, como vão na URL. */
const EVENTOS = { Festa: 'Festa', Colacao: 'Colação' } as const satisfies Record<
  TipoDoEventoDoConvite,
  string
>

/**
 * Em que pé está um convite, para o selo e o filtro. A precedência é a de sempre: quem já entrou
 * não está mais "pronto"; quem não tem nome não tem documento a cobrar.
 */
type Situacao = 'semNome' | 'semDocumento' | 'pronto' | 'entrou'

const SITUACOES: Record<Situacao, { rotulo: string; tom: TomDoSelo }> = {
  semNome: { rotulo: 'Sem nome', tom: 'neutro' },
  semDocumento: { rotulo: 'Falta o documento', tom: 'alerta' },
  pronto: { rotulo: 'Pronto', tom: 'sucesso' },
  entrou: { rotulo: 'Entrou', tom: 'sucesso' },
}

const ehEvento = (valor: string | null): valor is TipoDoEventoDoConvite => ehOpcao(valor, EVENTOS)
const ehSituacao = (valor: string | null): valor is Situacao => ehOpcao(valor, SITUACOES)

function situacaoDe(convite: MeuConvite): Situacao {
  if (convite.validado_em) return 'entrou'
  if (!convite.nome_do_convidado) return 'semNome'
  if (!convite.documento) return 'semDocumento'
  return 'pronto'
}

/** Uma linha da lista: o convite e o evento a que ele pertence. */
interface LinhaDeConvite {
  convite: MeuConvite
  evento: EventoDoConvite | null
  listaAberta: boolean
}

/**
 * O que cada coluna ordenável compara. Sem coluna escolhida vale a ordem de chegada — evento pela
 * data, e dentro dele a ordem em que os convites foram emitidos.
 */
const CHAVES: Record<string, (linha: LinhaDeConvite) => string> = {
  convidado: (linha) => linha.convite.nome_do_convidado ?? '',
  evento: (linha) => linha.evento?.titulo ?? '',
  situacao: (linha) => SITUACOES[situacaoDe(linha.convite)].rotulo,
}

/** `toSorted` porque a lista sai do cache do React Query: ordenar no lugar mexeria no cache. */
function ordenar(linhas: LinhaDeConvite[], por: string | undefined, descendente: boolean) {
  const chave = por ? CHAVES[por] : undefined
  if (!chave) return linhas

  return linhas.toSorted((a, b) => {
    const ordem = chave(a).localeCompare(chave(b))
    return descendente ? -ordem : ordem
  })
}

/**
 * "Meus convites": os convites da festa que a pessoa comprou e os da colação que a cota deu, um por
 * convidado (P1), numa tabela só com filtro por evento, por situação e busca.
 *
 * Nomear e trocar o nome ficam abertos até o fechamento da lista, 24 h antes do evento (P5); depois
 * disso a tela só mostra, e quem muda é a comissão. O convite da festa só nasce quitado (P2): o que
 * ainda está sendo pago aparece como "aguardando pagamento", para ninguém achar que o pedido sumiu.
 * O da colação nasce quando a comissão abre a cota (Sprint 30) — uma tela só para as duas, porque a
 * ação é a mesma.
 *
 * A lista vem inteira nas duas consultas (é a grade de um formando), então filtro, busca, ordenação
 * e página são todos no navegador. O evento, a situação e a busca vivem na URL, como nas demais
 * listas: voltar, recarregar e mandar o link devolvem a mesma tela.
 */
export default function MeusConvitesPage() {
  const tamanhoDaPagina = useTamanhoDaPagina()
  const festa = useMeusConvites('Festa')
  const colacao = useMeusConvites('Colacao')
  const { parametros, pagina: paginaNaUrl, busca, atualizar } = useFiltrosDaUrl()
  const [editando, definirEditando] = useState<false | { convite: MeuConvite }>(false)
  const ordenacao = useOrdenacao(atualizar)

  if (festa.isPending || colacao.isPending)
    return (
      <EsqueletoDeCartao>
        <EsqueletoDeTexto linhas={6} />
      </EsqueletoDeCartao>
    )

  if (festa.isError) return <ErroDaConsulta erro={festa.error} aoTentarDeNovo={() => void festa.refetch()} />
  if (colacao.isError)
    return <ErroDaConsulta erro={colacao.error} aoTentarDeNovo={() => void colacao.refetch()} />

  const linhas = [festa.data, colacao.data]
    .flatMap((meus) =>
      meus.convites.map((convite) => ({
        convite,
        evento: meus.evento,
        listaAberta: meus.lista_aberta,
      })),
    )
    .toSorted(
      (a, b) =>
        (a.evento?.data ?? '').localeCompare(b.evento?.data ?? '') ||
        a.convite.sequencial - b.convite.sequencial,
    )

  const tipoNaUrl = parametros.get('evento')
  const tipo = ehEvento(tipoNaUrl) ? tipoNaUrl : undefined
  const situacaoNaUrl = parametros.get('situacao')
  const situacao = ehSituacao(situacaoNaUrl) ? situacaoNaUrl : undefined

  const doEvento = tipo ? linhas.filter((linha) => linha.evento?.tipo === tipo) : linhas
  const visiveis = ordenar(
    doEvento.filter(
      (linha) =>
        (!situacao || situacaoDe(linha.convite) === situacao) &&
        contemBusca(
          busca,
          linha.convite.nome_do_convidado,
          linha.convite.codigo,
          linha.convite.documento,
          linha.evento?.titulo,
        ),
    ),
    ordenacao.por,
    ordenacao.descendente,
  )
  const pagina = paginar(visiveis, paginaNaUrl, tamanhoDaPagina)

  const semNome = linhas.filter((linha) => !linha.convite.nome_do_convidado).length
  const aguardando = festa.data.aguardando_pagamento
  const proximoFechamento = [festa.data, colacao.data]
    .filter((meus) => meus.lista_aberta)
    .map((meus) => meus.evento?.fechamento_da_lista)
    .filter((fechamento): fechamento is string => Boolean(fechamento))
    .toSorted()[0]

  const contarEvento = (valor: TipoDoEventoDoConvite) =>
    linhas.filter((linha) => linha.evento?.tipo === valor).length
  const contarSituacao = (valor: Situacao) =>
    doEvento.filter((linha) => situacaoDe(linha.convite) === valor).length

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo dos meus convites"
        indicadores={[
          { rotulo: 'Convites', valor: linhas.length, icone: Ticket },
          { rotulo: 'Sem nome', valor: semNome, icone: UserRound },
          { rotulo: 'Aguardando pagamento', valor: aguardando, icone: CalendarClock },
          {
            rotulo: 'A lista fecha',
            valor: proximoFechamento ? formatarDataHora(proximoFechamento) : '—',
            icone: TicketCheck,
          },
        ]}
      />

      {linhas.length > 0 ? (
        <FiltrosDaPlanilha
          principal={
            <fieldset className="flex flex-wrap gap-2">
              <legend className="sr-only">Evento</legend>
              <Chip
                tom="claro"
                ativo={!tipo}
                contagem={linhas.length}
                onClick={() => atualizar({ evento: null })}
              >
                Todos
              </Chip>
              {Object.entries(EVENTOS).map(([valor, rotulo]) => (
                <Chip
                  key={valor}
                  tom="claro"
                  ativo={tipo === valor}
                  contagem={contarEvento(valor as TipoDoEventoDoConvite)}
                  onClick={() => atualizar({ evento: tipo === valor ? null : valor })}
                >
                  {rotulo}
                </Chip>
              ))}
            </fieldset>
          }
          legenda="Situação"
          filtros={Object.entries(SITUACOES).map(([valor, { rotulo }]) => (
            <Chip
              key={valor}
              ativo={situacao === valor}
              contagem={contarSituacao(valor as Situacao)}
              onClick={() => atualizar({ situacao: situacao === valor ? null : valor })}
            >
              {rotulo}
            </Chip>
          ))}
          busca={{
            valor: busca,
            rotulo: 'Buscar convidado',
            aoBuscar: (termo) => atualizar({ busca: termo }),
          }}
          contagem={{ mostrando: pagina.visiveis.length, total: visiveis.length, unidade: 'convites' }}
        />
      ) : null}

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Sem título nem descrição, como as listas da gestão: o `h1` da tela já diz "Meus convites". */}
        <Cartao rotulo="Meus convites" className="min-w-0 px-5 py-2">
          {linhas.length === 0 ? (
            <ListaVazia
              mascote={mascoteCelular}
              titulo="Nenhum convite ainda"
              dica={
                <>
                  Convites extras da festa se pedem em{' '}
                  <LinkDaPagina to={ROTAS.meusPedidos}>Meus pedidos</LinkDaPagina>. Os da colação aparecem
                  aqui quando a comissão abrir a cota.
                </>
              }
            />
          ) : visiveis.length === 0 ? (
            // Três vazios diferentes: quem não tem convite, quem filtrou por evento ou situação e quem
            // só digitou um termo. Dizer "nenhum convite ainda" a quem buscou é responder outra coisa.
            <ListaVazia
              titulo={busca ? `Nada encontrado para “${busca}”` : 'Nenhum convite neste filtro'}
              dica={
                busca
                  ? 'Procure pelo nome do convidado, pelo código ou pelo documento — ou limpe a busca.'
                  : 'Toque em “Todos” ou tire a situação para ver a lista inteira.'
              }
            />
          ) : (
            <>
              <Tabela
                emLista
                ordenacao={ordenacao}
                cabecalho={
                  <>
                    <ColunaOrdenavel coluna="convidado">Convidado</ColunaOrdenavel>
                    <ColunaOrdenavel coluna="evento">Evento</ColunaOrdenavel>
                    <ColunaOrdenavel coluna="situacao">Situação</ColunaOrdenavel>
                  </>
                }
              >
                {pagina.visiveis.map((linha) => (
                  <LinhaDoConvite
                    key={linha.convite.id}
                    linha={linha}
                    aoEditar={() => definirEditando({ convite: linha.convite })}
                  />
                ))}
              </Tabela>
              <Paginacao
                pagina={pagina.pagina}
                totalPaginas={pagina.totalPaginas}
                total={pagina.total}
                aoMudar={(numero) => atualizar({ pagina: String(numero) })}
              />
            </>
          )}
        </Cartao>

        <LateralDosConvites aguardando={aguardando} />
      </div>

      <DialogoDoConvidado aberto={editando} aoFechar={() => definirEditando(false)} />
    </>
  )
}

/**
 * A coluna da direita, como a de "Meus pedidos": o que ainda está sendo pago, como a lista funciona
 * e onde se pedem mais. O que era a faixa amarela acima da lista virou o primeiro cartão.
 */
function LateralDosConvites({ aguardando }: { aguardando: number }) {
  return (
    <div className="grid min-w-0 gap-5">
      {aguardando > 0 ? (
        <CartaoDeValor
          titulo="Aguardando pagamento"
          destaque
          rotulo="Convites pedidos"
          valor={formatarNumero(aguardando)}
          nota={`${aguardando === 1 ? 'Ainda está sendo pago' : 'Ainda estão sendo pagos'}. O convite sai quando a última parcela do pedido for confirmada.`}
          acao={
            <Button asChild variant="outline">
              <LinkDaPagina to={ROTAS.meusPedidos}>Ver meus pedidos</LinkDaPagina>
            </Button>
          }
        />
      ) : null}

      <Cartao titulo="Nomear e enviar">
        <TextoDoCartao as="ul" className="divide-y">
          <li className="pb-3">
            Cada convite é de uma pessoa: o link aparece quando você dá o nome, e aí vai pelo WhatsApp.
          </li>
          <li className="py-3">Na entrada, a portaria confere o código e o documento do convidado.</li>
          <li className="pt-3">
            Dá para trocar o nome até 24 horas antes do evento. Depois, só com a comissão.
          </li>
        </TextoDoCartao>
      </Cartao>

      <Cartao titulo="Mais convites" descricao="Convites extras da festa se pedem como os outros opcionais.">
        <Button asChild variant="outline" size="sm" className="justify-self-start">
          <LinkDaPagina to={ROTAS.meusPedidos}>Ir para Meus pedidos</LinkDaPagina>
        </Button>
      </Cartao>
    </div>
  )
}

/** O dia, a hora e o local de um evento numa linha de apoio. */
function descricaoDoEvento(evento: EventoDoConvite) {
  return `${formatarData(evento.data)}${evento.hora ? ` · ${formatarHora(evento.hora)}` : ''}${evento.local ? ` · ${evento.local}` : ''}`
}

/**
 * O ícone do evento e quem vai usar o convite — a primeira célula da linha, que a nomeia.
 *
 * É um componente próprio porque a célula que só encadeia `<div>` e `<span>` com um `<svg>` não é
 * reconhecida como rotulada pelo linter de acessibilidade; delegando a um componente, como o
 * `Avatar` de Membros, a célula passa e o rótulo continua sendo o nome do convidado.
 */
function BlocoDoConvidado({ convite, colacao }: { convite: MeuConvite; colacao: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          'text-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg',
          colacao ? 'bg-avatar-4/20' : 'bg-avatar-3/20',
        )}
      >
        {colacao ? (
          <GraduationCap className="size-4.5" strokeWidth={1.75} aria-hidden />
        ) : (
          <PartyPopper className="size-4.5" strokeWidth={1.75} aria-hidden />
        )}
      </span>
      <div className="grid min-w-0 gap-0.5">
        <span className="text-foreground font-medium break-words">
          {convite.nome_do_convidado ?? (
            <span className="text-muted-foreground font-normal">Convidado a definir</span>
          )}
        </span>
        <span className="text-muted-foreground font-mono text-xs">
          {convite.codigo}
          {convite.documento ? <span className="font-sans"> · {convite.documento}</span> : null}
        </span>
      </div>
    </div>
  )
}

/**
 * Um convidado na tabela: quem é, para que evento e em que pé está, com as ações da linha. No
 * celular a primeira célula nomeia e a última é a ação, como manda a lista densa (Sprint 41).
 */
function LinhaDoConvite({ linha, aoEditar }: { linha: LinhaDeConvite; aoEditar: () => void }) {
  const { convite, evento, listaAberta } = linha
  const colacao = evento?.tipo === 'Colacao'
  const situacao = SITUACOES[situacaoDe(convite)]

  return (
    <tr className="border-b last:border-0">
      <td className="py-3 pr-4">
        <BlocoDoConvidado convite={convite} colacao={colacao} />
      </td>

      <td className="py-3 pr-4">
        <span className="text-foreground block">{evento?.titulo ?? 'Convite'}</span>
        {evento ? <span className="text-texto-muted block text-xs">{descricaoDoEvento(evento)}</span> : null}
      </td>

      <td className="py-3 pr-4">
        <Selo tom={situacao.tom}>{situacao.rotulo}</Selo>
      </td>

      <td className="py-3 text-right">
        <AcoesDaLinha rotulo={`Ações do convite ${convite.codigo}`}>
          {listaAberta ? (
            <AcaoDaLinha
              rotulo={convite.nome_do_convidado ? 'Editar' : 'Nomear'}
              icone={Pencil}
              onClick={aoEditar}
            />
          ) : null}
          {convite.token ? <AcoesDoLink token={convite.token} codigo={convite.codigo} /> : null}
        </AcoesDaLinha>
      </td>
    </tr>
  )
}

/**
 * Copiar e abrir o convite. Só com convidado: "a definir" é vaga paga, sem link — a API nem manda o
 * token, e a página pública responde que o convite não existe.
 */
function AcoesDoLink({ token, codigo }: { token: string; codigo: string }) {
  const link = `${window.location.origin}${rotaDoIngresso(token)}`
  const abrir = `Abrir o convite ${codigo}`

  const copiarLink = async () => {
    if (await copiar(link)) toast.success('Link do convite copiado.')
    else toast.warning('Não deu para copiar. Abra o convite e compartilhe pela página.')
  }

  return (
    <>
      <AcaoDaLinha rotulo="Copiar link" icone={Link2} onClick={() => void copiarLink()} />
      <AcaoDaLinha asChild rotulo="Abrir" descricaoAcessivel={abrir}>
        <a href={link} target="_blank" rel="noreferrer" aria-label={abrir}>
          <ExternalLink aria-hidden className="size-4" />
        </a>
      </AcaoDaLinha>
    </>
  )
}
