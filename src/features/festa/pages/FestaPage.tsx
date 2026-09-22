import { CircleCheck, PartyPopper, Plus, Wallet } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import { Cartao } from '@/components/Cartao'
import { Chip } from '@/components/Chip'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeCartao, EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { LinkDeVolta } from '@/components/LinkDeVolta'
import { ListaVazia } from '@/components/ListaVazia'
import { Button } from '@/components/ui/button'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useDetalheDoItem, useItensDaFesta, useMetaDaFesta } from '@/hooks/useItensDaFesta'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { usePapel } from '@/hooks/useSessao'
import { formatarCentavos, formatarNumero } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'
import { type EstadoDoItem, type ItemDaFesta, percentualDaMeta, ROTULOS_DE_ESTADO } from '@/types/festa'
import { DetalheDoItem } from '../components/DetalheDoItem'
import { DialogoDeItem } from '../components/DialogoDeItem'
import { LinhaDoItem } from '../components/LinhaDoItem'
import { useCancelarItem, useExcluirItem, useReativarItem } from '../hooks/useEscritaDaFesta'

/** Toda falha de escrita desta tela vira o mesmo aviso: o texto certo vem da API, pelo código. */
const aoFalhar = (erro: unknown) => toast.error(mensagemDoErro(erro))

/**
 * As seções da lista, na ordem da vida do item.
 *
 * São o que o quadro por colunas daria — "o que falta contratar" é uma seção, e não um clique —
 * sem espremer a descrição do item numa coluna de 288px. Seção vazia não aparece: turma nova tem
 * tudo em "A contratar", e dois cabeçalhos com "nenhum" embaixo seriam ruído em toda abertura.
 */
const SECOES = ['AContratar', 'Contratado', 'Pago', 'Cancelado'] as const satisfies readonly EstadoDoItem[]

const ehEstado = (valor: string | null): valor is EstadoDoItem => valor !== null && valor in ROTULOS_DE_ESTADO

/**
 * Filtro e busca acontecem aqui, e não na API.
 *
 * A lista da festa vem inteira numa consulta só — são seis itens numa turma nova e dificilmente
 * passam de vinte —, então paginar ou filtrar no servidor custaria uma ida a cada pílula clicada
 * para uma lista que já está na memória.
 *
 * @param itens Todos os itens da turma.
 * @param estado Estado escolhido, ou nulo para todos.
 * @param busca O que foi digitado, já sem acento na comparação.
 */
function filtrar(itens: readonly ItemDaFesta[], estado: EstadoDoItem | null, busca: string) {
  const termo = semAcento(busca.trim())

  return itens.filter(
    (item) =>
      (estado === null || item.estado === estado) &&
      (termo === '' ||
        semAcento(item.titulo).includes(termo) ||
        semAcento(item.fornecedor ?? '').includes(termo)),
  )
}

/** Busca por nome ignora acento e caixa, como a das listas que o backend atende com `unaccent`. */
const semAcento = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()

/**
 * O que a turma está comprando, e quanto falta para pagar por isso.
 *
 * É a única tela do produto que responde "pelo que eu estou pagando?" — até aqui, a resposta morava
 * no termo, em prosa, congelada no dia da adesão. A Gestão escreve, a turma inteira lê.
 *
 * **Lista à esquerda, item aberto à direita**, como o mural: a rota é a seleção (`/festa/:id`), e
 * sem id abre o primeiro da lista. Era uma grade de cartões, e o cartão não tinha onde caber o que
 * a tela precisa mostrar — a descrição inteira e as propostas com preço e voto. No celular não há
 * as duas colunas: sem id é a lista, com id é o item, com um "A festa" para voltar.
 *
 * Nenhum número desta tela é digitado duas vezes: o selo de cada item e o custo da festa saem das
 * despesas da Sprint 10, e o arrecadado é o mesmo número da tela do Caixa.
 */
export default function FestaPage() {
  const { id } = useParams()
  const [cadastro, definirCadastro] = useState<false | { item?: ItemDaFesta }>(false)
  const [confirmando, definirConfirmando] = useState<
    false | { item: ItemDaFesta; acao: 'excluir' | 'cancelar' }
  >(false)
  const navegar = useNavigate()
  const { parametros, busca, atualizar } = useFiltrosDaUrl()
  const { tem } = usePapel()
  const ehGestao = tem(PAPEIS.tesoureiro, PAPEIS.comissao)
  const editavel = useEscritaLiberada() && ehGestao
  const podeContratar = tem(PAPEIS.tesoureiro)

  const itens = useItensDaFesta()
  const meta = useMetaDaFesta().data
  const estadoNaUrl = parametros.get('estado')
  const estado = ehEstado(estadoNaUrl) ? estadoNaUrl : null
  const todos = itens.data ?? []
  const visiveis = filtrar(todos, estado, busca)

  // Sem id na rota, o primeiro da lista é o que abre — a direita nunca fica vazia.
  const escolhido = id ?? visiveis[0]?.id
  const detalhe = useDetalheDoItem(escolhido ?? '')
  const aberto = detalhe.data

  const cancelar = useCancelarItem()
  const reativar = useReativarItem()
  const excluir = useExcluirItem()

  const confirmar = () => {
    if (!confirmando) return

    const { item, acao } = confirmando
    definirConfirmando(false)

    if (acao === 'excluir')
      excluir.mutate(item.id, {
        onSuccess: () => {
          toast.success('Item excluído.')
          navegar(ROTAS.festa)
        },
        onError: aoFalhar,
      })
    else cancelar.mutate(item.id, { onSuccess: () => toast.success('Item cancelado.'), onError: aoFalhar })
  }

  if (itens.isError) return <ErroDaConsulta erro={itens.error} />

  return (
    <>
      <FaixaDeIndicadores
        rotulo="A festa em números"
        indicadores={[
          {
            rotulo: 'Custo da festa',
            valor: meta ? formatarCentavos(meta.custo_em_centavos) : null,
            icone: PartyPopper,
            nota: meta
              ? `${meta.itens} ${meta.itens === 1 ? 'item' : 'itens'}, ${meta.a_contratar} a contratar`
              : undefined,
          },
          {
            rotulo: 'Arrecadado',
            valor: meta ? formatarCentavos(meta.arrecadado_em_centavos) : null,
            icone: Wallet,
            sinal: meta
              ? {
                  texto: `${percentualDaMeta(meta.arrecadado_em_centavos, meta.custo_em_centavos)}% da meta`,
                  tom: 'positivo',
                }
              : undefined,
          },
          {
            rotulo: 'Falta juntar',
            valor: meta ? formatarCentavos(meta.falta_arrecadar_em_centavos) : null,
            icone: Wallet,
          },
          {
            rotulo: 'Já pago aos fornecedores',
            valor: meta ? formatarCentavos(meta.pago_em_centavos) : null,
            icone: CircleCheck,
            nota:
              meta && meta.pagos > 0
                ? `${meta.pagos} ${meta.pagos === 1 ? 'item quitado' : 'itens quitados'}`
                : undefined,
          },
        ]}
      />

      {/* A escadinha e a busca ficam acima das duas colunas, como no mural: é a lista inteira que
          elas recortam, e não o painel da direita. No celular somem junto com a lista.

          As pílulas convivem com as seções da lista, e não competem com elas: a seção agrupa o que
          está à vista, a pílula escolhe o que entra. Com o filtro ligado sobra uma seção só, e o
          cabeçalho dela continua dizendo qual é — que é o que o quadro por colunas mostraria. */}
      <div className={cn(id && 'max-lg:hidden')}>
        <FiltrosDaPlanilha
          principal={
            <Chip
              tom="claro"
              ativo={!estado}
              contagem={todos.length}
              onClick={() => atualizar({ estado: null })}
            >
              Todos
            </Chip>
          }
          legenda="Estado"
          filtros={SECOES.map((valor) => (
            <Chip
              key={valor}
              ativo={estado === valor}
              contagem={todos.filter((item) => item.estado === valor).length}
              onClick={() => atualizar({ estado: estado === valor ? null : valor })}
            >
              {ROTULOS_DE_ESTADO[valor]}
            </Chip>
          ))}
          busca={{ valor: busca, rotulo: 'Buscar item', aoBuscar: (termo) => atualizar({ busca: termo }) }}
          acoes={
            editavel ? (
              <Button size="sm" className="h-8" onClick={() => definirCadastro({})}>
                <Plus aria-hidden />
                Novo item
              </Button>
            ) : null
          }
          contagem={{ mostrando: visiveis.length, total: todos.length, unidade: 'itens' }}
        />
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Cartao
          rotulo="Itens da festa"
          // O cartão da lista não leva o respiro dos outros: as linhas encostam na borda.
          className={cn('gap-0 overflow-hidden p-0', id && 'max-lg:hidden')}
        >
          {itens.isPending ? <EsqueletoDeTexto linhas={6} className="p-4" /> : null}

          {itens.data && visiveis.length === 0 ? (
            <div className="px-5 py-2">
              <ListaVazia
                titulo={todos.length === 0 ? 'A festa ainda não tem itens' : 'Nenhum item encontrado'}
                dica={
                  todos.length === 0
                    ? ehGestao
                      ? 'Comece pelo maior: o buffet.'
                      : 'A comissão ainda não descreveu o que a turma está comprando.'
                    : 'Tente outra busca ou tire o filtro.'
                }
              />
            </div>
          ) : null}

          {SECOES.map((secao) => {
            const daSecao = visiveis.filter((item) => item.estado === secao)

            if (daSecao.length === 0) return null

            return (
              <section key={secao} aria-label={ROTULOS_DE_ESTADO[secao]}>
                <h2 className="bg-muted text-muted-foreground flex items-center justify-between gap-2 px-4 py-2 text-xs font-medium tracking-wide uppercase">
                  {ROTULOS_DE_ESTADO[secao]}
                  <span className="tabular-nums">{formatarNumero(daSecao.length)}</span>
                </h2>
                <ul className="divide-y">
                  {daSecao.map((item) => (
                    <LinhaDoItem key={item.id} item={item} aberto={item.id === escolhido} />
                  ))}
                </ul>
              </section>
            )
          })}
        </Cartao>

        <div className={cn('grid min-w-0 gap-3', !id && 'max-lg:hidden')}>
          {/* Só no celular: no desktop a lista está ao lado, e não há de onde voltar. */}
          <LinkDeVolta para={ROTAS.festa} className="lg:hidden">
            A festa
          </LinkDeVolta>

          {aberto ? (
            <DetalheDoItem
              item={aberto.item}
              propostas={aberto.propostas}
              ehGestao={ehGestao}
              editavel={editavel}
              podeContratar={podeContratar}
              aoEditar={() => definirCadastro({ item: aberto.item })}
              aoContratar={() => void navegar(`${ROTAS.despesas}?item=${aberto.item.id}`)}
              aoCancelar={() => definirConfirmando({ item: aberto.item, acao: 'cancelar' })}
              aoReativar={() =>
                reativar.mutate(aberto.item.id, {
                  onSuccess: () => toast.success('Item reativado.'),
                  onError: aoFalhar,
                })
              }
              aoExcluir={() => definirConfirmando({ item: aberto.item, acao: 'excluir' })}
            />
          ) : null}
          {!aberto && detalhe.isPending && escolhido ? <EsqueletoDeCartao /> : null}
          {/* Link direto para um item que não existe mais — a comissão pode tê-lo excluído. */}
          {!aberto && detalhe.isError ? (
            <Cartao titulo="Item não encontrado">
              <p role="alert" className="text-muted-foreground text-sm">
                Ele pode ter sido excluído pela comissão. Escolha um da lista.
              </p>
            </Cartao>
          ) : null}
        </div>
      </div>

      <DialogoDeItem aberto={cadastro} aoFechar={() => definirCadastro(false)} />

      <DialogoDeConfirmacao
        aberto={confirmando !== false}
        aoFechar={() => definirConfirmando(false)}
        titulo={confirmando && confirmando.acao === 'excluir' ? 'Excluir este item?' : 'Cancelar este item?'}
        descricao={
          confirmando && confirmando.acao === 'excluir'
            ? `"${confirmando.item.titulo}" sai da lista e do custo da festa. Não há despesa lançada nele, então nada do caixa muda — as propostas levantadas vão junto.`
            : confirmando
              ? `"${confirmando.item.titulo}" sai do custo da festa e continua na lista, marcado como cancelado. As despesas já lançadas nele não são canceladas — o que saiu do caixa continua no balancete.`
              : ''
        }
        rotulo={confirmando && confirmando.acao === 'excluir' ? 'Excluir' : 'Cancelar item'}
        rotuloDeCancelar="Voltar"
        destrutivo
        aoConfirmar={confirmar}
      />
    </>
  )
}
