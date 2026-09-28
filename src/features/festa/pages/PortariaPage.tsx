import { CircleCheck, DoorOpen, FileDown, Gift, Search, Ticket, UserRound, WifiOff } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Link } from 'react-router'
import { toast } from 'sonner'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import { Cartao } from '@/components/Cartao'
import { Chip } from '@/components/Chip'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeCartao, EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { ListaVazia } from '@/components/ListaVazia'
import { Selo, type TomDoSelo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ROTAS } from '@/config/rotas'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useResumoDosConvites } from '@/hooks/useResumoDosConvites'
import { useSessao } from '@/hooks/useSessao'
import { contemBusca } from '@/lib/busca'
import { formatarDataHora, formatarHorario } from '@/lib/formato'
import { avisarErro, ErroDeRede, ehErroDaApi } from '@/lib/http/erros'
import { ehOpcao } from '@/lib/opcao'
import { cn } from '@/lib/utils'
import { DialogoDoConvidado } from '../components/DialogoDoConvidado'
import { ResultadoDaValidacao } from '../components/ResultadoDaValidacao'
import {
  useBaixarListaDaPortaria,
  useDesfazerEntrada,
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

const TOM_DA_SITUACAO = {
  Valido: 'cinza',
  SemTitular: 'alerta',
  Validado: 'sucesso',
  Revogado: 'perigo',
} as const satisfies Record<SituacaoNaPortaria, TomDoSelo>

/**
 * A portaria da festa: um campo, a lista e a contagem (P4).
 *
 * O caminho principal é a câmera do celular abrindo a página do convite (decisão 3); aqui fica o
 * fallback — o código ditado pelo convidado com o print apagado — e a lista, que é a redundância de
 * papel quando o QR ou a rede falham (P5). A busca por nome filtra a lista **já carregada**: sem
 * rede, ela continua funcionando, e a entrada pode ser marcada no aparelho para subir depois (decisões
 * 7 e 16). A faixa do topo diz de quando é a lista, porque sem rede ela envelhece.
 *
 * Fonte grande e alvo de toque grande: quem usa isto está em pé, no escuro, com fila na frente.
 */
export default function PortariaPage() {
  const [busca, definirBusca] = useState('')
  const [codigo, definirCodigo] = useState('')
  const [resultado, definirResultado] = useState<(Resultado & { codigo: string }) | null>(null)
  const [cortesia, definirCortesia] = useState(false)
  const [editando, definirEditando] = useState<false | { convite: MeuConvite }>(false)
  const [reemitindo, definirReemitindo] = useState<ConviteNaPortaria | null>(null)
  const editavel = useEscritaLiberada()
  const { usuario } = useSessao()
  const { parametros, atualizar } = useFiltrosDaUrl()
  const eventoNaUrl = parametros.get('evento')
  const tipo: TipoDoEventoDoConvite = ehOpcao(eventoNaUrl, ROTULOS_DO_EVENTO) ? eventoNaUrl : 'Festa'
  const lista = usePortaria(tipo, '')
  const resumo = useResumoDosConvites()
  const validar = useValidarEntrada()
  const desfazer = useDesfazerEntrada()
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

  const seletor = (
    <nav aria-label="Evento da portaria" className="flex flex-wrap gap-2">
      {(Object.keys(ROTULOS_DO_EVENTO) as TipoDoEventoDoConvite[]).map((valor) => (
        <Chip
          key={valor}
          ativo={tipo === valor}
          onClick={() => {
            definirResultado(null)
            atualizar({ evento: valor === 'Festa' ? null : valor })
          }}
        >
          {ROTULOS_DO_EVENTO[valor]}
        </Chip>
      ))}
    </nav>
  )

  const enviarCodigo = (evento: FormEvent) => {
    evento.preventDefault()
    const limpo = codigo.trim().toUpperCase()
    if (limpo) validarCodigo(limpo)
  }

  if (lista.isPending)
    return (
      <>
        {seletor}
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
          {seletor}
          <ListaVazia
            mascote={mascoteChecklist}
            titulo={`A ${nome} ainda não está na agenda`}
            dica={
              <>
                A portaria abre com a {nome} marcada em <Link to={ROTAS.agenda}>Agenda</Link>, com data, hora
                e local.
              </>
            }
          />
        </>
      )

    return (
      <>
        {seletor}
        <ErroDaConsulta erro={lista.error} aoTentarDeNovo={() => void lista.refetch()} />
      </>
    )
  }

  const { evento, convites } = lista.data
  const offline = lista.isError && lista.error instanceof ErroDeRede
  const visiveis = busca
    ? convites.filter((c) => contemBusca(busca, c.nome_do_convidado, c.convidado_de, c.codigo))
    : convites
  const pendentes = tipo === 'Festa' ? (resumo.data?.pedidos_quitados_sem_convite ?? 0) : 0

  return (
    <>
      {seletor}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="xs"
          variant="outline"
          disabled={baixarLista.isPending}
          onClick={() => baixarLista.mutate(tipo, { onError: avisarErro })}
        >
          <FileDown aria-hidden />
          Lista em PDF
        </Button>
        {editavel ? (
          <Button size="xs" variant="outline" onClick={() => definirCortesia(true)}>
            <Gift aria-hidden />
            Nova cortesia
          </Button>
        ) : null}
        {editavel && pendentes > 0 ? (
          <Button
            size="xs"
            disabled={emitirPendentes.isPending}
            onClick={() =>
              emitirPendentes.mutate(undefined, {
                onSuccess: ({ quantidade }) =>
                  toast.success(`Convites emitidos para ${quantidade} pedido${quantidade === 1 ? '' : 's'}.`),
                onError: avisarErro,
              })
            }
          >
            Emitir convites pendentes ({pendentes})
          </Button>
        ) : null}
      </div>

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
          Sem conexão. A lista é de {formatarHorario(lista.data.gerada_em)} — um convite revogado depois disso
          ainda aparece válido aqui. Confira nome e documento e marque a entrada no aparelho.
        </p>
      ) : null}

      {!lista.data.janela_aberta ? (
        <p className="bg-muted rounded-xl p-4 text-sm">
          {new Date(evento.janela_abre_em) > new Date()
            ? `A validação abre em ${formatarDataHora(evento.janela_abre_em)} — 6 horas antes do evento.`
            : 'A validação deste evento já fechou.'}
        </p>
      ) : null}

      {semRede.entradas.length > 0 ? (
        <div className="bg-warning-bg text-warning-text flex flex-wrap items-center justify-between gap-3 rounded-xl p-4 text-sm">
          <span>
            {semRede.entradas.length} entrada{semRede.entradas.length === 1 ? '' : 's'} marcada
            {semRede.entradas.length === 1 ? '' : 's'} sem rede neste aparelho.
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

      <Cartao
        titulo={evento.titulo}
        icone={DoorOpen}
        descricao="Digite o código que o convidado ditar, ou procure pelo nome."
      >
        <form onSubmit={enviarCodigo} className="flex flex-col gap-2 sm:flex-row">
          <Input
            aria-label="Código do convite"
            value={codigo}
            onChange={(mudanca) => definirCodigo(mudanca.target.value)}
            placeholder={`${convites[0]?.codigo.split('-')[0] ?? 'MED27'}-XXXX`}
            autoCapitalize="characters"
            autoComplete="off"
            className="h-12 font-mono text-lg uppercase"
          />
          <Button
            type="submit"
            size="lg"
            className="h-12"
            disabled={validar.isPending || !lista.data.janela_aberta}
          >
            {validar.isPending ? 'Validando…' : 'Validar código'}
          </Button>
        </form>

        {resultado ? (
          <div className="mt-4 grid gap-2">
            <ResultadoDaValidacao resultado={resultado} />
            {resultado.semRede ? (
              <Button size="lg" variant="outline" onClick={() => semRede.marcar(resultado.codigo, aparelho)}>
                Marcar entrada sem rede
              </Button>
            ) : null}
            {resultado.entrada ? (
              <Button
                size="sm"
                variant="outline"
                className="justify-self-center"
                disabled={desfazer.isPending}
                onClick={() => {
                  if (resultado.entrada)
                    desfazer.mutate(resultado.entrada.check_in_id, {
                      onSuccess: () => {
                        toast.info('Entrada desfeita.')
                        definirResultado(null)
                      },
                      onError: avisarErro,
                    })
                }}
              >
                Desfazer entrada
              </Button>
            ) : null}
          </div>
        ) : null}
      </Cartao>

      <Cartao titulo="Lista de convidados" rotulo={`${visiveis.length} de ${convites.length}`}>
        <div className="relative mb-3">
          <Search
            className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden
          />
          <Input
            aria-label="Procurar convidado"
            placeholder="Nome, quem convidou ou código"
            value={busca}
            onChange={(mudanca) => definirBusca(mudanca.target.value)}
            className="h-12 pl-9 text-base"
          />
        </div>

        {visiveis.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum convite com esse nome ou código.</p>
        ) : (
          <ul className="divide-y">
            {visiveis.map((convite) => (
              <LinhaDaPortaria
                key={convite.id}
                convite={convite}
                janelaAberta={lista.data.janela_aberta}
                offline={offline}
                marcadoSemRede={semRede.marcado(convite.codigo)}
                editavel={editavel}
                aoValidar={() => validarCodigo(convite.codigo)}
                aoMarcarSemRede={() => semRede.marcar(convite.codigo, aparelho)}
                aoEditar={() => definirEditando({ convite: paraEdicao(convite) })}
                aoReemitir={() => definirReemitindo(convite)}
              />
            ))}
          </ul>
        )}
      </Cartao>

      <DialogoDoConvidado
        aberto={cortesia ? 'cortesia' : editando}
        eventoId={evento.id}
        aoFechar={() => (definirCortesia(false), definirEditando(false))}
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

interface PropsDaLinha {
  convite: ConviteNaPortaria
  janelaAberta: boolean
  offline: boolean
  marcadoSemRede: boolean
  editavel: boolean
  aoValidar: () => void
  aoMarcarSemRede: () => void
  aoEditar: () => void
  aoReemitir: () => void
}

/** Um convidado na lista: nome grande, código, documento mascarado, a situação e a ação que cabe. */
function LinhaDaPortaria({
  convite,
  janelaAberta,
  offline,
  marcadoSemRede,
  editavel,
  aoValidar,
  aoMarcarSemRede,
  aoEditar,
  aoReemitir,
}: PropsDaLinha) {
  const revogado = convite.situacao === 'Revogado'

  return (
    <li
      className={cn(
        'flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4',
        revogado && 'bg-danger-bg/60 -mx-3 rounded-lg px-3',
      )}
    >
      <div className="grid min-w-0 flex-1 gap-0.5">
        <p className="flex flex-wrap items-center gap-2 text-base font-medium">
          {convite.nome_do_convidado ?? (
            <span className="text-muted-foreground font-normal">Convidado a definir</span>
          )}
          <Selo tom={marcadoSemRede ? 'sucesso' : TOM_DA_SITUACAO[convite.situacao]}>
            {marcadoSemRede ? 'Entrou (sem rede)' : ROTULOS_DE_SITUACAO[convite.situacao]}
          </Selo>
          {convite.entrou_sem_rede_duas_vezes ? <Selo tom="perigo">Entrou duas vezes sem rede</Selo> : null}
        </p>
        <p className="text-muted-foreground text-sm">
          <span className="font-mono">{convite.codigo}</span>
          {convite.documento ? ` · ${convite.documento}` : ''}
          {' · '}
          {convite.convidado_de ? `convidado de ${convite.convidado_de}` : 'cortesia da turma'}
        </p>
        {revogado && convite.motivo_da_revogacao ? (
          <p className="text-danger-text text-sm">Revogado: {convite.motivo_da_revogacao}</p>
        ) : null}
        {convite.entrada ? (
          <p className="text-muted-foreground text-sm">
            Entrou às {formatarHorario(convite.entrada.validado_em)}, por {convite.entrada.validado_por}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {convite.situacao === 'Valido' && janelaAberta && !offline ? (
          <Button size="sm" onClick={aoValidar}>
            Validar
          </Button>
        ) : null}
        {offline && convite.situacao === 'Valido' && !marcadoSemRede ? (
          <Button size="sm" variant="outline" onClick={aoMarcarSemRede}>
            Marcar entrada
          </Button>
        ) : null}
        {editavel && !revogado && !offline ? (
          <>
            <Button size="sm" variant="outline" onClick={aoEditar}>
              {convite.nome_do_convidado ? 'Editar' : 'Nomear'}
            </Button>
            {convite.situacao !== 'Validado' ? (
              <Button size="sm" variant="ghost" onClick={aoReemitir}>
                Reemitir
              </Button>
            ) : null}
          </>
        ) : null}
      </div>
    </li>
  )
}
