import { Armchair, Lock, Plus, ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import { Cartao } from '@/components/Cartao'
import { CampoDeBusca } from '@/components/CampoDeBusca'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { EsqueletoDeCartao, EsqueletoDeTexto } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FaixaDeIndicadores } from '@/components/FaixaDeIndicadores'
import { ListaVazia } from '@/components/ListaVazia'
import { Tabela } from '@/components/Planilha'
import { Select } from '@/components/Select'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useEscritaLiberada } from '@/hooks/useFormaturaAtual'
import { contemBusca } from '@/lib/busca'
import { formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { DialogoDeMesa } from '../components/DialogoDeMesa'
import { useDefinirDonoDaMesa, useExcluirMesa, useMapaDeMesas } from '../hooks/useMesas'
import type { CompradorDeMesa, Mesa } from '../types/mesas.types'

/**
 * As mesas do jantar, na Gestão (Sprint 27).
 *
 * A mesa é nome e lugares; quem compra o opcional `Mesa` leva a mesa inteira, e a comissão só diz
 * qual mesa é de quem (P1). A busca filtra a lista já carregada — são dezenas de mesas, e o mapa
 * vem numa consulta só.
 */
export default function MesasPage() {
  const mapa = useMapaDeMesas()
  const editavel = useEscritaLiberada()
  const { busca, atualizar } = useFiltrosDaUrl()
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
                    {editavel ? <th className="py-3 text-right font-normal">Ações</th> : null}
                  </>
                }
              >
                {visiveis.map((mesa) => (
                  <tr key={mesa.id} className="border-b last:border-0">
                    <td className="text-foreground py-3 pr-4 font-medium">
                      <div className="grid min-w-24">
                        {mesa.identificacao}
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
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => definirDialogo({ mesa })}>
                            Editar
                          </Button>
                          <DialogoDeConfirmacao
                            gatilho={
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={excluir.isPending || !!mesa.vinculo_id}
                              >
                                Excluir
                              </Button>
                            }
                            titulo={`Excluir “${mesa.identificacao}”?`}
                            descricao="A mesa sai do mapa. Mesa com dono não se exclui: solte o dono antes."
                            rotulo="Excluir"
                            destrutivo
                            aoConfirmar={() =>
                              excluir.mutate(mesa.id, {
                                onSuccess: () => toast.info('Mesa excluída.'),
                                onError: avisarErro,
                              })
                            }
                          />
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))}
              </Tabela>
            )}
          </div>
        )}
      </Cartao>

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

/**
 * Quem é o dono da mesa: o atual, "Sem dono" e os compradores que ainda têm mesa a receber.
 *
 * Quem já tem todas as mesas que comprou não aparece — a API recusaria com
 * `festa.mesas_alem_do_pedido`, e a opção só existiria para dar erro.
 */
function SeletorDeDono({ mesa, compradores }: { mesa: Mesa; compradores: CompradorDeMesa[] }) {
  const definir = useDefinirDonoDaMesa()
  const disponiveis = compradores.filter(
    (comprador) => comprador.vinculo_id === mesa.vinculo_id || comprador.atribuidas < comprador.compradas,
  )

  return (
    <Select
      aria-label={`Dono da ${mesa.identificacao}`}
      className="h-9 min-w-44 text-sm md:text-sm"
      value={mesa.vinculo_id ?? ''}
      disabled={definir.isPending}
      onChange={(evento) => {
        const vinculoId = evento.target.value || null
        definir.mutate(
          { id: mesa.id, vinculoId },
          {
            onSuccess: () => (vinculoId ? toast.success('Mesa atribuída.') : toast.info('Mesa sem dono.')),
            onError: avisarErro,
          },
        )
      }}
    >
      <option value="">Sem dono</option>
      {mesa.vinculo_id && !disponiveis.some((comprador) => comprador.vinculo_id === mesa.vinculo_id) ? (
        <option value={mesa.vinculo_id}>{mesa.dono}</option>
      ) : null}
      {disponiveis.map((comprador) => (
        <option key={comprador.vinculo_id} value={comprador.vinculo_id}>
          {comprador.vinculo_id === mesa.vinculo_id
            ? comprador.nome
            : `${comprador.nome} (${comprador.atribuidas} de ${comprador.compradas})`}
        </option>
      ))}
    </Select>
  )
}
