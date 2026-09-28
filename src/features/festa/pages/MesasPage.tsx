import { Armchair, List, Lock, Map as IconeDoMapa, Pencil, Plus, ShoppingBag, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import { AcaoComConfirmacao, AcaoDaLinha, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { Cartao } from '@/components/Cartao'
import { CampoDeBusca } from '@/components/CampoDeBusca'
import { Chip } from '@/components/Chip'
import { EsqueletoDeCartao, EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { ListaVazia } from '@/components/ListaVazia'
import { Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { contemBusca } from '@/lib/busca'
import { formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { DialogoDeMesa } from '../components/DialogoDeMesa'
import { EditorDoSalao } from '../components/EditorDoSalao'
import { SeletorDeDono } from '../components/SeletorDeDono'
import { useExcluirMesa, useMapaDeMesas } from '../hooks/useMesas'
import type { Mesa } from '../types/mesas.types'

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
  const mapa = useMapaDeMesas()
  const editavel = useEscritaLiberada()
  const { busca, parametros, atualizar } = useFiltrosDaUrl()
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
  const visiveis = lista.filter((mesa) => contemBusca(busca, mesa.identificacao, mesa.dono))

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
              <CampoDeBusca
                valor={busca}
                rotulo="Mesa ou dono"
                aoBuscar={(termo) => atualizar({ busca: termo })}
                className="max-w-xs"
              />
              {visiveis.length === 0 ? (
                <p className="text-muted-foreground text-sm">Nenhuma mesa com esse nome ou dono.</p>
              ) : (
                <Tabela
                  legenda="Mesas do jantar"
                  cabecalho={
                    <>
                      <th className="py-3 pr-4 font-normal">Mesa</th>
                      <th className="py-3 pr-4 text-right font-normal">Lugares</th>
                      <th className="py-3 pr-4 font-normal">Dono</th>
                    </>
                  }
                >
                  {visiveis.map((mesa) => (
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
                                  'A mesa sai do mapa. Mesa com dono não se exclui: solte o dono antes.',
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
            legenda="Quem comprou mesa"
            cabecalho={
              <>
                <th className="py-3 pr-4 font-normal">Formando</th>
                <th className="py-3 pr-4 text-right font-normal">Compradas</th>
                <th className="py-3 text-right font-normal">No mapa</th>
              </>
            }
          >
            {compradores.map((comprador) => (
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
        </Cartao>
      ) : null}

      <DialogoDeMesa aberto={dialogo} aoFechar={() => definirDialogo(false)} />
    </>
  )
}
