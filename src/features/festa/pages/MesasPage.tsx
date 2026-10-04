import { AtalhosDaPagina } from '@/components/AtalhosDaPagina'
import { Armchair, Lock, Map as IconeDoMapa, Pencil, Plus, ShoppingBag, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import { AcaoComConfirmacao, AcaoDaLinha, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { Chip } from '@/components/Chip'
import { EsqueletoDeCartao, EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { LinkDaPagina } from '@/components/LinkDaPagina'
import { ListaVazia } from '@/components/ListaVazia'
import { Paginacao } from '@/components/Paginacao'
import { Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { rotaDoMapaDeMesas } from '@/config/rotas'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { contemBusca } from '@/lib/busca'
import { formatarNumero } from '@/lib/formato'
import { ehOpcao } from '@/lib/opcao'
import { avisarErro } from '@/lib/http/erros'
import { paginar } from '@/lib/paginar'
import { DialogoDeMesa } from '../components/DialogoDeMesa'
import { PreviaDoMapa } from '../components/salao/PreviaDoMapa'
import { SeletorDeDono } from '../components/SeletorDeDono'
import { useExcluirMesa, useMapaDeMesas } from '../hooks/useMesas'
import type { Mesa } from '../types/mesas.types'
import { useTamanhoDaPagina } from '@/hooks/useTelaGrande'

/**
 * A situação da mesa no filtro: com dono, sem dono ou reservada. "Sem dono" exclui a reservada, que
 * também não tem vínculo — ela é da turma, e não está à venda (P3).
 */
const SITUACOES = {
  comDono: { rotulo: 'Com dono', passa: (mesa: Mesa) => mesa.vinculo_id !== null },
  semDono: { rotulo: 'Sem dono', passa: (mesa: Mesa) => mesa.vinculo_id === null && !mesa.reservada },
  reservada: { rotulo: 'Reservadas', passa: (mesa: Mesa) => mesa.reservada },
} as const

/** O formato da mesa, para quem procura a retangular na lista. */
const FORMATOS = {
  Redonda: { rotulo: 'Redonda', passa: (mesa: Mesa) => mesa.formato === 'Redonda' },
  Retangular: { rotulo: 'Retangular', passa: (mesa: Mesa) => mesa.formato === 'Retangular' },
} as const

/** Se a mesa já tem lugar no salão — "Fora do mapa" é a fila de quem ainda falta posicionar. */
const POSICOES = {
  noMapa: { rotulo: 'No mapa', passa: (mesa: Mesa) => mesa.x !== null },
  foraDoMapa: { rotulo: 'Fora do mapa', passa: (mesa: Mesa) => mesa.x === null },
} as const

const ehSituacao = (valor: string | null): valor is keyof typeof SITUACOES => ehOpcao(valor, SITUACOES)
const ehFormato = (valor: string | null): valor is keyof typeof FORMATOS => ehOpcao(valor, FORMATOS)
const ehPosicao = (valor: string | null): valor is keyof typeof POSICOES => ehOpcao(valor, POSICOES)

/**
 * As mesas do jantar, na Gestão (Sprint 27): a lista como conteúdo principal e, na lateral, a
 * prévia do mapa do salão e quem comprou mesa.
 *
 * A mesa é nome e lugares; quem compra o opcional `Mesa` leva a mesa inteira, e a comissão só diz
 * qual mesa é de quem (P1). Os filtros ficam fora do cartão, na barra padrão das listas, e o mapa
 * do salão (28/09/2026) mora numa página própria, aberta pelo card lateral — arrastar precisa de
 * largura, e a lista continua sendo a leitura densa que todo mundo já conhece. A busca filtra a
 * lista já carregada — são dezenas de mesas, e tudo vem numa consulta só.
 */
export default function MesasPage() {
  const tamanhoDaPagina = useTamanhoDaPagina()
  const mapa = useMapaDeMesas()
  const editavel = useEscritaLiberada()
  const { busca, pagina: paginaNaUrl, parametros, atualizar } = useFiltrosDaUrl()
  const [dialogo, definirDialogo] = useState<false | { mesa?: Mesa }>(false)
  const excluir = useExcluirMesa()

  if (mapa.isPending)
    return (
      <EsqueletoDeCartao>
        <EsqueletoDeTexto linhas={6} />
      </EsqueletoDeCartao>
    )

  if (mapa.isError) return <ErroDaConsulta erro={mapa.error} aoTentarDeNovo={() => void mapa.refetch()} />

  const { lista, compradores } = mapa.data
  const situacaoNaUrl = parametros.get('situacao')
  const situacao = ehSituacao(situacaoNaUrl) ? situacaoNaUrl : undefined
  const formatoNaUrl = parametros.get('formato')
  const formato = ehFormato(formatoNaUrl) ? formatoNaUrl : undefined
  const posicaoNaUrl = parametros.get('posicao')
  const posicao = ehPosicao(posicaoNaUrl) ? posicaoNaUrl : undefined

  const visiveis = lista.filter(
    (mesa) =>
      contemBusca(busca, mesa.identificacao, mesa.dono) &&
      (!situacao || SITUACOES[situacao].passa(mesa)) &&
      (!formato || FORMATOS[formato].passa(mesa)) &&
      (!posicao || POSICOES[posicao].passa(mesa)),
  )
  const pagina = paginar(visiveis, paginaNaUrl, tamanhoDaPagina)

  return (
    <>
      <FaixaDeIndicadores
        rotulo="Resumo das mesas"
        indicadores={[
          {
            rotulo: 'Mesas',
            valor: formatarNumero(mapa.data.mesas),
            icone: Armchair,
            nota: `${formatarNumero(mapa.data.com_dono)} com dono`,
          },
          { rotulo: 'Lugares', valor: formatarNumero(mapa.data.lugares), icone: Armchair },
          { rotulo: 'Reservadas', valor: formatarNumero(mapa.data.reservadas), icone: Lock },
          {
            rotulo: 'Compradas sem mesa',
            valor: formatarNumero(mapa.data.mesas_por_atribuir),
            icone: ShoppingBag,
          },
        ]}
      />

      {/* No celular, a lateral não aparece: o mapa fica no atalho. */}
      <AtalhosDaPagina atalhos={[{ titulo: 'Mapa do salão', para: rotaDoMapaDeMesas, icone: IconeDoMapa }]} />

      <FiltrosDaPlanilha
        principal={
          <fieldset className="flex flex-wrap gap-2">
            <legend className="sr-only">Situação</legend>
            <Chip
              tom="claro"
              ativo={!situacao}
              contagem={lista.length}
              onClick={() => atualizar({ situacao: null })}
            >
              Todas
            </Chip>
            {Object.entries(SITUACOES).map(([valor, { rotulo, passa }]) => (
              <Chip
                key={valor}
                ativo={situacao === valor}
                contagem={lista.filter(passa).length}
                onClick={() => atualizar({ situacao: situacao === valor ? null : valor })}
              >
                {rotulo}
              </Chip>
            ))}
          </fieldset>
        }
        busca={{
          valor: busca,
          rotulo: 'Buscar mesa ou dono',
          aoBuscar: (termo) => atualizar({ busca: termo }),
        }}
        filtrosAvancados={
          <BotaoDeFiltros
            id="filtros-de-mesas"
            ligados={(formato ? 1 : 0) + (posicao ? 1 : 0)}
            largura="w-72"
          >
            <div className="grid gap-4">
              <fieldset className="grid gap-2">
                <legend className="text-muted-foreground mb-2 text-sm">Formato</legend>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(FORMATOS).map(([valor, { rotulo, passa }]) => (
                    <Chip
                      key={valor}
                      ativo={formato === valor}
                      contagem={lista.filter(passa).length}
                      onClick={() => atualizar({ formato: formato === valor ? null : valor })}
                    >
                      {rotulo}
                    </Chip>
                  ))}
                </div>
              </fieldset>

              <fieldset className="grid gap-2">
                <legend className="text-muted-foreground mb-2 text-sm">No salão</legend>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(POSICOES).map(([valor, { rotulo, passa }]) => (
                    <Chip
                      key={valor}
                      ativo={posicao === valor}
                      contagem={lista.filter(passa).length}
                      onClick={() => atualizar({ posicao: posicao === valor ? null : valor })}
                    >
                      {rotulo}
                    </Chip>
                  ))}
                </div>
              </fieldset>
            </div>
          </BotaoDeFiltros>
        }
        acaoPrincipal={
          editavel ? (
            <Button size="xs" onClick={() => definirDialogo({})}>
              <Plus aria-hidden />
              Nova mesa
            </Button>
          ) : null
        }
        contagem={{ mostrando: pagina.visiveis.length, total: visiveis.length, unidade: 'mesas' }}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <Cartao rotulo="Mesas" className="min-w-0 px-5 py-2">
          {lista.length === 0 ? (
            <ListaVazia
              mascote={mascoteChecklist}
              titulo="Nenhuma mesa ainda"
              dica="Cadastre as mesas do salão com os lugares de cada uma. Para vender mesa, crie o opcional do tipo Mesa em Plano."
            />
          ) : visiveis.length === 0 ? (
            <ListaVazia
              titulo="Nenhuma mesa neste filtro"
              dica="Tente outra busca ou tire um filtro para ver a lista inteira."
            />
          ) : (
            <>
              <Tabela
                emLista
                legenda="Mesas do jantar"
                cabecalho={
                  <>
                    <th className="py-3 pr-4 font-normal">Mesa</th>
                    <th className="py-3 pr-4 text-right font-normal">Lugares</th>
                    <th className="py-3 pr-4 font-normal">Dono</th>
                  </>
                }
              >
                {pagina.visiveis.map((mesa) => (
                  <tr key={mesa.id} className="border-b last:border-0">
                    <td className="text-foreground py-3 pr-4 font-medium">
                      <div className="grid min-w-24">
                        {mesa.identificacao}
                        {mesa.x === null ? (
                          <span className="text-muted-foreground text-xs font-normal">Fora do mapa</span>
                        ) : null}
                        {mesa.observacao ? (
                          <span className="text-muted-foreground text-xs font-normal">{mesa.observacao}</span>
                        ) : null}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">{formatarNumero(mesa.lugares)}</td>
                    <td className="py-3 pr-4">
                      {mesa.reservada ? (
                        <Selo>Reservada</Selo>
                      ) : editavel ? (
                        <SeletorDeDono mesa={mesa} compradores={compradores} />
                      ) : (
                        (mesa.dono ?? <span className="text-muted-foreground">Sem dono</span>)
                      )}
                    </td>
                    {editavel ? (
                      <td className="py-3 text-right">
                        <AcoesDaLinha rotulo={`Ações de ${mesa.identificacao}`}>
                          <AcaoDaLinha
                            rotulo="Editar"
                            icone={Pencil}
                            onClick={() => definirDialogo({ mesa })}
                          />
                          <AcaoComConfirmacao
                            rotulo="Excluir"
                            icone={X}
                            desabilitada={excluir.isPending || !!mesa.vinculo_id}
                            confirmacao={{
                              titulo: `Excluir “${mesa.identificacao}”?`,
                              descricao:
                                'A mesa será removida do mapa. Se estiver reservada para alguém, libere a mesa antes de excluir.',
                              rotulo: 'Excluir',
                              aoConfirmar: () =>
                                excluir.mutate(mesa.id, {
                                  onSuccess: () => toast.info('Mesa excluída.'),
                                  onError: avisarErro,
                                }),
                            }}
                          />
                        </AcoesDaLinha>
                      </td>
                    ) : null}
                  </tr>
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

        <div className="hidden min-w-0 content-start gap-5 lg:grid">
          <Cartao
            titulo="Mapa do salão"
            icone={IconeDoMapa}
            descricao="Onde cada mesa fica no salão. A turma vê o mapa; a comissão o edita."
            acao={
              <Button asChild variant="outline" size="sm">
                <LinkDaPagina to={rotaDoMapaDeMesas}>Abrir o mapa</LinkDaPagina>
              </Button>
            }
          >
            <PreviaDoMapa mapa={mapa.data} />
          </Cartao>

          <Cartao titulo="Como funcionam as mesas">
            <TextoDoCartao as="ol" className="divide-y">
              <li className="pb-3">
                A mesa é um opcional do Plano de cobrança: quem compra o item <b>Mesa</b> leva a mesa inteira.
              </li>
              <li className="py-3">
                Aqui você diz qual é de quem, na coluna <b>Dono</b>. Quem já recebeu todas as mesas que
                comprou não aparece na lista.
              </li>
              <li className="pt-3">
                No mapa do salão você arrasta as mesas e monta o ambiente — o formando vê onde fica a dele.
              </li>
            </TextoDoCartao>
          </Cartao>
        </div>
      </div>

      <DialogoDeMesa aberto={dialogo} aoFechar={() => definirDialogo(false)} />
    </>
  )
}
