import {
  CalendarClock,
  ExternalLink,
  GraduationCap,
  Link2,
  PartyPopper,
  Ticket,
  TicketCheck,
  UserRound,
} from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import mascoteCelular from '@/assets/mascote/celular.webp'
import { Cartao } from '@/components/Cartao'
import { CartaoDeValor } from '@/components/CartaoDeValor'
import { EsqueletoDeCartao, EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { ListaVazia } from '@/components/ListaVazia'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { ROTAS, rotaDoIngresso } from '@/config/rotas'
import { copiar } from '@/lib/copiar'
import { cn } from '@/lib/utils'
import { formatarData, formatarDataHora, formatarHora, formatarNumero } from '@/lib/formato'
import { DialogoDoConvidado } from '../components/DialogoDoConvidado'
import { useMeusConvites } from '../hooks/useConvitesDaFesta'
import type { MeuConvite, MeusConvites } from '../types/convites.types'

/**
 * "Meus convites": os convites da festa que a pessoa comprou e os da colação que a cota deu, um por
 * convidado (P1), separados por evento.
 *
 * Cada linha é uma pessoa — a avó leva o dela, e o link vai pelo WhatsApp. Nomear e trocar o nome
 * ficam abertos até o fechamento da lista, 24 h antes do evento (P5); depois disso a tela só mostra,
 * e quem muda é a comissão. O convite da festa só nasce quitado (P2): o que ainda está sendo pago
 * aparece como "aguardando pagamento", para ninguém achar que o pedido sumiu. O da colação nasce
 * quando a comissão abre a cota (Sprint 30) — uma tela só para as duas, porque a ação é a mesma.
 */
export default function MeusConvitesPage() {
  const festa = useMeusConvites('Festa')
  const colacao = useMeusConvites('Colacao')
  const [editando, definirEditando] = useState<false | { convite: MeuConvite }>(false)

  if (festa.isPending || colacao.isPending)
    return (
      <EsqueletoDeCartao>
        <EsqueletoDeTexto linhas={4} />
      </EsqueletoDeCartao>
    )

  if (festa.isError) return <ErroDaConsulta erro={festa.error} aoTentarDeNovo={() => void festa.refetch()} />
  if (colacao.isError)
    return <ErroDaConsulta erro={colacao.error} aoTentarDeNovo={() => void colacao.refetch()} />

  const secoes = [festa.data, colacao.data]
    .filter((meus) => meus.evento && meus.convites.length > 0)
    .toSorted((a, b) => (a.evento?.data ?? '').localeCompare(b.evento?.data ?? ''))
  const convites = secoes.flatMap((meus) => meus.convites)
  const semNome = convites.filter((convite) => !convite.nome_do_convidado).length
  const aguardando = festa.data.aguardando_pagamento
  const proximoFechamento = secoes.find((meus) => meus.lista_aberta)?.evento?.fechamento_da_lista

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo dos meus convites"
        indicadores={[
          { rotulo: 'Convites', valor: convites.length, icone: Ticket },
          { rotulo: 'Sem nome', valor: semNome, icone: UserRound },
          { rotulo: 'Aguardando pagamento', valor: aguardando, icone: CalendarClock },
          {
            rotulo: 'A lista fecha',
            valor: proximoFechamento ? formatarDataHora(proximoFechamento) : '—',
            icone: TicketCheck,
          },
        ]}
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="grid min-w-0 gap-5">
          {secoes.length === 0 ? (
            <ListaVazia
              mascote={mascoteCelular}
              titulo="Nenhum convite ainda"
              dica={
                <>
                  Convites extras da festa se pedem em <Link to={ROTAS.meusPedidos}>Meus pedidos</Link>. Os da
                  colação aparecem aqui quando a comissão abrir a cota.
                </>
              }
            />
          ) : (
            secoes.map((meus) => (
              <SecaoDoEvento
                key={meus.evento?.id}
                meus={meus}
                aoEditar={(convite) => definirEditando({ convite })}
              />
            ))
          )}
        </div>

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
              <Link to={ROTAS.meusPedidos}>Ver meus pedidos</Link>
            </Button>
          }
        />
      ) : null}

      <Cartao titulo="Nomear e enviar">
        <ul className="text-muted-foreground divide-y text-sm leading-relaxed">
          <li className="pb-3">
            Cada convite é de uma pessoa: o link aparece quando você dá o nome, e aí vai pelo WhatsApp.
          </li>
          <li className="py-3">Na entrada, a portaria confere o código e o documento do convidado.</li>
          <li className="pt-3">
            Dá para trocar o nome até 24 horas antes do evento. Depois, só com a comissão.
          </li>
        </ul>
      </Cartao>

      <Cartao titulo="Mais convites" descricao="Convites extras da festa se pedem como os outros opcionais.">
        <Button asChild variant="outline" size="sm" className="justify-self-start">
          <Link to={ROTAS.meusPedidos}>Ir para Meus pedidos</Link>
        </Button>
      </Cartao>
    </div>
  )
}

/** Os convites de um evento: o cartão com o dia, a hora e o local, e uma linha por convidado. */
function SecaoDoEvento({ meus, aoEditar }: { meus: MeusConvites; aoEditar: (convite: MeuConvite) => void }) {
  const { evento, convites, lista_aberta } = meus

  return (
    <Cartao
      titulo={evento?.titulo ?? 'Convites'}
      icone={evento?.tipo === 'Colacao' ? GraduationCap : PartyPopper}
      descricao={
        evento
          ? `${formatarData(evento.data)}${evento.hora ? ` · ${formatarHora(evento.hora)}` : ''}${evento.local ? ` · ${evento.local}` : ''}`
          : null
      }
    >
      {/* As colunas da vitrine de "Meus pedidos": item, situação e ação, com o cabeçalho miúdo só
          quando cabem lado a lado. */}
      <div className="@container">
        <div
          aria-hidden
          className="text-texto-muted hidden grid-cols-[minmax(0,1fr)_9rem_auto] gap-4 px-3 pb-2 text-xs @min-[42rem]:grid"
        >
          <span>Convidado e código</span>
          <span>Situação</span>
          <span className="text-right">Ações</span>
        </div>
        <ul className="grid gap-2" aria-label={`Convites: ${evento?.titulo ?? 'evento'}`}>
          {convites.map((convite) => (
            <LinhaDoConvite
              key={convite.id}
              convite={convite}
              colacao={evento?.tipo === 'Colacao'}
              editavel={lista_aberta}
              aoEditar={() => aoEditar(convite)}
            />
          ))}
        </ul>
      </div>
      {!lista_aberta ? (
        <p className="text-muted-foreground pt-4 text-sm">
          A lista de convidados fechou 24 horas antes do evento. Para mudar um nome agora, fale com a
          comissão.
        </p>
      ) : null}
    </Cartao>
  )
}

/**
 * Um convidado, no desenho de um item da vitrine: bloco do ícone na cor do evento (a mesma da
 * agenda), nome e código; a situação no meio; as ações à direita.
 */
function LinhaDoConvite({
  convite,
  colacao,
  editavel,
  aoEditar,
}: {
  convite: MeuConvite
  colacao: boolean
  editavel: boolean
  aoEditar: () => void
}) {
  return (
    <li className="grid items-center gap-4 rounded-xl border-b p-3 @min-[42rem]:grid-cols-[minmax(0,1fr)_9rem_auto]">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'text-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-lg',
            colacao ? 'bg-avatar-4/20' : 'bg-avatar-3/20',
          )}
        >
          {colacao ? (
            <GraduationCap className="size-4.5" strokeWidth={1.75} aria-hidden />
          ) : (
            <Ticket className="size-4.5" strokeWidth={1.75} aria-hidden />
          )}
        </span>
        <div className="grid min-w-0 gap-0.5">
          <h3 className="text-foreground font-medium break-words">
            {convite.nome_do_convidado ?? (
              <span className="text-muted-foreground font-normal">Convidado a definir</span>
            )}
          </h3>
          <p className="text-muted-foreground font-mono text-xs">
            {convite.codigo}
            {convite.documento ? <span className="font-sans"> · {convite.documento}</span> : null}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {convite.validado_em ? (
          <Selo tom="sucesso">Entrou</Selo>
        ) : !convite.nome_do_convidado ? (
          <Selo tom="neutro">Sem nome</Selo>
        ) : !convite.documento ? (
          <Selo tom="alerta">Falta o documento</Selo>
        ) : (
          <Selo tom="sucesso">Pronto</Selo>
        )}
      </div>

      <div className="flex flex-wrap gap-2 @min-[42rem]:justify-end">
        {editavel ? (
          <Button variant="outline" size="sm" onClick={aoEditar}>
            {convite.nome_do_convidado ? 'Editar' : 'Nomear'}
          </Button>
        ) : null}
        {convite.token ? <AcoesDoLink token={convite.token} /> : null}
      </div>
    </li>
  )
}

/**
 * Copiar e abrir o convite. Só com convidado: "a definir" é vaga paga, sem link — a API nem manda o
 * token, e a página pública responde que o convite não existe.
 */
function AcoesDoLink({ token }: { token: string }) {
  const link = `${window.location.origin}${rotaDoIngresso(token)}`

  const copiarLink = async () => {
    if (await copiar(link)) toast.success('Link do convite copiado.')
    else toast.warning('Não deu para copiar. Abra o convite e compartilhe pela página.')
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => void copiarLink()}>
        <Link2 aria-hidden />
        Copiar link
      </Button>
      <Button variant="outline" size="sm" asChild>
        <a href={link} target="_blank" rel="noreferrer">
          <ExternalLink aria-hidden />
          Abrir
        </a>
      </Button>
    </>
  )
}
