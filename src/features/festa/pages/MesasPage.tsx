import { Armchair, List, Lock, Map as IconeDoMapa, Pencil, Plus, ShoppingBag, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import { AcaoComConfirmacao, AcaoDaLinha, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { Cartao } from '@/components/Cartao'
import { CampoDeBusca } from '@/components/CampoDeBusca'
import { Chip } from '@/components/Chip'
import { EsqueletoDeCartao, EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { ListaVazia } from '@/components/ListaVazia'
import { Paginacao } from '@/components/Paginacao'
import { Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { contemBusca } from '@/lib/busca'
import { formatarNumero } from '@/lib/formato'
import { ehOpcao } from '@/lib/opcao'
import { avisarErro } from '@/lib/http/erros'
import { paginar } from '@/lib/paginar'
import { DialogoDeMesa } from '../components/DialogoDeMesa'
import { EditorDoSalao } from '../components/EditorDoSalao'
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

const ehSituacao = (valor: string | null): valor is keyof typeof SITUACOES => ehOpcao(valor, SITUACOES)

/**
 * As mesas do jantar, na Gestão (Sprint 27): o mapa do salão e a lista.
 *
 * A mesa é nome e lugares; quem compra o opcional `Mesa` leva a mesa inteira, e a comissão só diz
 * qual mesa é de quem (P1). O mapa (28/09/2026) põe as mesas no salão junto com palco, pista e
 * entrada; a lista continua para quem prefere tabela e para o celular. A busca filtra a lista já
 * carregada — são dezenas de mesas, e tudo vem numa consulta só.
 *
 * As duas vistas ficam montadas, e a escondida só some: trocar de vista no meio de um mapa por salvar
 * não pode perder o rascunho.
 */
export default function MesasPage() {
  const tamanhoDaPagina = useTamanhoDaPagina()
  const mapa = useMapaDeMesas()
  const editavel = useEscritaLiberada()
  const { busca, pagina: paginaNaUrl, parametros, atualizar } = useFiltrosDaUrl()
  const [paginaDosCompradores, definirPaginaDosCompradores] = useState(1)
  const vista = parametros.get('vista') === 'lista' ? 'lista' : 'mapa'
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
  const visiveis = lista.filter(
    (mesa) =>
      contemBusca(busca, mesa.identificacao, mesa.dono) && (!situacao || SITUACOES[situacao].passa(mesa)),
  )
  const pagina = paginar(visiveis, paginaNaUrl, tamanhoDaPagina)
  const paginaDeCompradores = paginar(compradores, paginaDosCompradores, tamanhoDaPagina)

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

      <div className="flex gap-2">
        <Chip tom="claro" ativo={vista === 'mapa'} onClick={() => atualizar({ vista: null })}>
          <IconeDoMapa aria-hidden className="size-4" />
          Mapa
        </Chip>
        <Chip tom="claro" ativo={vista === 'lista'} onClick={() => atualizar({ vista: 'lista' })}>
          <List aria-hidden className="size-4" />
          Lista
        </Chip>
      </div>

      <div hidden={vista !== 'mapa'}>
        <Cartao
          titulo="Mapa do salão"
          icone={IconeDoMapa}
          descricao="Arraste as mesas e monte o salão: palco, pista, entrada e o que mais houver. A turma vê onde fica a própria mesa."
        >
          <EditorDoSalao mapa={mapa.data} editavel={editavel} />
        </Cartao>
      </div>

      <div hidden={vista !== 'lista'}>
        <Cartao
          titulo="Mesas"
          icone={Armchair}
          descricao="Cada mesa com os lugares que tem. Quem comprou mesa no opcional leva ela inteira — escolha aqui qual é de quem."
          acao={
            editavel ? (
              <Button variant="outline" size="sm" onClick={() => definirDialogo({})}>
                <Plus aria-hidden />
                Nova mesa
              </Button>
            ) : null
          }
        >
          {lista.length === 0 ? (
            <ListaVazia
              mascote={mascoteChecklist}
              titulo="Nenhuma mesa ainda"
              dica="Cadastre as mesas do salão com os lugares de cada uma. Para vender mesa, crie o opcional do tipo Mesa em Plano."
            />
          ) : (
            <div className="grid gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <CampoDeBusca
                  valor={busca}
                  rotulo="Mesa ou dono"
                  aoBuscar={(termo) => atualizar({ busca: termo })}
                  className="min-w-0 sm:max-w-xs"
                />
                <BotaoDeFiltros id="filtros-de-mesas" ligados={situacao ? 1 : 0}>
                  <fieldset className="grid gap-2">
                    <legend className="text-muted-foreground mb-2 text-sm">Situação</legend>
                    <div className="flex flex-wrap gap-2">
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
                    </div>
                  </fieldset>
                </BotaoDeFiltros>
              </div>
              {visiveis.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhuma mesa com {situacao ? 'esse filtro' : 'esse nome ou dono'}.
                </p>
              ) : (
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
                            <span className="text-muted-foreground text-xs font-normal">
                              {mesa.observacao}
                            </span>
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
              )}
              <Paginacao
                pagina={pagina.pagina}
                totalPaginas={pagina.totalPaginas}
                total={pagina.total}
                aoMudar={(numero) => atualizar({ pagina: String(numero) })}
              />
            </div>
          )}
        </Cartao>
      </div>

      {compradores.length > 0 ? (
        <Cartao
          titulo="Quem comprou mesa"
          descricao="Pedidos confirmados do opcional Mesa, e quantas já têm mesa no mapa."
        >
          <Tabela
            emLista
            legenda="Quem comprou mesa"
            cabecalho={
              <>
                <th className="py-3 pr-4 font-normal">Formando</th>
                <th className="py-3 pr-4 text-right font-normal">Compradas</th>
                <th className="py-3 text-right font-normal">No mapa</th>
              </>
            }
          >
            {paginaDeCompradores.visiveis.map((comprador) => (
              <tr key={comprador.vinculo_id} className="border-b last:border-0">
                <td className="text-foreground py-3 pr-4">{comprador.nome}</td>
                <td className="py-3 pr-4 text-right tabular-nums">{formatarNumero(comprador.compradas)}</td>
                <td className="py-3 text-right tabular-nums">
                  {comprador.atribuidas < comprador.compradas ? (
                    <Selo tom="alerta">
                      {formatarNumero(comprador.atribuidas)} de {formatarNumero(comprador.compradas)}
                    </Selo>
                  ) : (
                    formatarNumero(comprador.atribuidas)
                  )}
                </td>
              </tr>
            ))}
          </Tabela>
          <Paginacao
            pagina={paginaDeCompradores.pagina}
            totalPaginas={paginaDeCompradores.totalPaginas}
            total={paginaDeCompradores.total}
            aoMudar={definirPaginaDosCompradores}
          />
        </Cartao>
      ) : null}

      <DialogoDeMesa aberto={dialogo} aoFechar={() => definirDialogo(false)} />
    </>
  )
}
