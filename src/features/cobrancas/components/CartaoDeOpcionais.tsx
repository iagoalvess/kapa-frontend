import { OctagonX, Pencil, Plus, ShoppingBag, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { AcaoComConfirmacao, AcaoDaLinha, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { BotaoDoLinkDaLoja } from '@/components/BotaoDoLinkDaLoja'
import { Cartao } from '@/components/Cartao'
import { Paginacao } from '@/components/Paginacao'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { formatarCentavos, formatarDataHora, formatarNumero, jaChegou } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { paginar } from '@/lib/paginar'
import { cn } from '@/lib/utils'
import { useEncerrarOpcional, useExcluirOpcional } from '../hooks/useOpcionais'
import { type ItemDeCobranca, type PlanoDeCobranca, rotuloDoItem } from '../types/cobrancas.types'
import { FormularioDeOpcional } from './FormularioDeOpcional'
import { useTamanhoDaPagina } from '@/hooks/useTelaGrande'

/**
 * Os opcionais da turma: o que o formando pode pedir só para ele.
 *
 * Cartão da tela de Plano, logo abaixo das contribuições, e não item de menu próprio: o item de
 * opcionais **é** um `ItemDeCobranca` do mesmo plano. Foi aba até 22/09 — escondia os itens de quem
 * olhava o plano e perguntava onde estavam.
 *
 * O preço da coluna é **unitário** (decisão 2), e a tabela diz isso: "cada". Quem multiplica pela
 * quantidade é o pedido.
 */
export function CartaoDeOpcionais({ plano, editavel }: { plano: PlanoDeCobranca; editavel: boolean }) {
  const tamanhoDaPagina = useTamanhoDaPagina()
  const [dialogo, definirDialogo] = useState<false | { item?: ItemDeCobranca }>(false)
  const encerrar = useEncerrarOpcional()
  const excluir = useExcluirOpcional()
  const ocupado = encerrar.isPending || excluir.isPending

  const emEdicao = dialogo === false ? undefined : dialogo.item
  const itens = plano.itens.filter((item) => item.opcional)
  const abertos = itens.filter((item) => !item.encerrado_em)
  const ordenados = [...abertos, ...itens.filter((item) => item.encerrado_em)]
  const temLoja = abertos.some((item) => item.modo_de_venda === 'Publica')
  const [paginaPedida, definirPagina] = useState(1)
  const pagina = paginar(ordenados, paginaPedida, tamanhoDaPagina)

  return (
    <>
      <Cartao
        titulo="Opcionais"
        icone={ShoppingBag}
        descricao="Convites extras, kits e fotos são cobrados apenas de quem pedir. Cada pedido gera parcelas para o formando."
        acao={
          <div className="flex flex-wrap gap-2">
            {temLoja ? <BotaoDoLinkDaLoja /> : null}
            {editavel ? (
              <Button variant="outline" size="sm" onClick={() => definirDialogo({})}>
                <Plus aria-hidden />
                Novo opcional
              </Button>
            ) : null}
          </div>
        }
      >
        {ordenados.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nada à venda ainda. Um item aqui aparece em “Minhas parcelas” de quem já aderiu, com o botão de
            pedir.
          </p>
        ) : (
          <Tabela
            emLista
            cabecalho={
              <>
                <th className="py-3 pr-4 font-normal">Item</th>
                <th className="py-3 pr-4 text-right font-normal">Preço</th>
                <th className="py-3 pr-4 text-right font-normal">Parcelas até</th>
                <th className="py-3 pr-4 text-right font-normal">Pedidas</th>
                <th className="py-3 pr-4 font-normal">Venda</th>
              </>
            }
          >
            {pagina.visiveis.map((item) => (
              <tr key={item.id} className={cn('border-b last:border-0', item.encerrado_em && 'opacity-60')}>
                <td className="text-foreground py-3 pr-4 font-medium">
                  <div className="grid">
                    {rotuloDoItem(item)}
                    {item.limite_por_formando ? (
                      <span className="text-muted-foreground text-xs font-normal">
                        até {formatarNumero(item.limite_por_formando)}{' '}
                        {item.modo_de_venda === 'Publica' ? 'por CPF' : 'por formando'}
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="py-3 pr-4 text-right whitespace-nowrap tabular-nums">
                  {formatarCentavos(item.valor_em_centavos)}{' '}
                  <span className="text-texto-muted text-xs">cada</span>
                  {item.preco_publico_em_centavos ? (
                    <span className="text-muted-foreground block text-xs">
                      {formatarCentavos(item.preco_publico_em_centavos)} na loja
                    </span>
                  ) : null}
                </td>
                <td className="py-3 pr-4 text-right">{formatarNumero(item.numero_de_parcelas)}×</td>
                <td className="py-3 pr-4 text-right tabular-nums">
                  {formatarNumero(item.reservados)}
                  {item.estoque === null ? null : (
                    <span className="text-texto-muted text-xs"> de {formatarNumero(item.estoque)}</span>
                  )}
                </td>
                <td className="py-3 pr-4">
                  <SituacaoDaVenda item={item} />
                </td>
                {editavel ? (
                  <td className="py-3 text-right">
                    {item.encerrado_em ? null : (
                      <AcoesDaLinha rotulo={`Ações de ${rotuloDoItem(item)}`}>
                        <AcaoDaLinha
                          rotulo="Editar"
                          icone={Pencil}
                          onClick={() => definirDialogo({ item })}
                        />
                        {item.reservados > 0 || item.em_uso ? (
                          <AcaoComConfirmacao
                            rotulo="Encerrar"
                            icone={OctagonX}
                            desabilitada={ocupado}
                            confirmacao={{
                              titulo: `Encerrar a venda de ${rotuloDoItem(item).toLowerCase()}?`,
                              descricao:
                                'O item para de aceitar pedidos. O que já foi pedido continua valendo, e as parcelas em aberto que ainda não venceram são canceladas.',
                              rotulo: 'Encerrar',
                              aoConfirmar: () =>
                                encerrar.mutate(
                                  { itemId: item.id },
                                  { onSuccess: () => toast.info('Venda encerrada.'), onError: avisarErro },
                                ),
                            }}
                          />
                        ) : (
                          <AcaoComConfirmacao
                            rotulo="Excluir"
                            icone={X}
                            desabilitada={ocupado}
                            confirmacao={{
                              titulo: `Excluir ${rotuloDoItem(item).toLowerCase()}?`,
                              descricao:
                                'Ninguém pediu este item ainda, então nada se perde além do que está escrito aqui.',
                              rotulo: 'Excluir',
                              aoConfirmar: () =>
                                excluir.mutate(
                                  { itemId: item.id },
                                  { onSuccess: () => toast.info('Opcional excluído.'), onError: avisarErro },
                                ),
                            }}
                          />
                        )}
                      </AcoesDaLinha>
                    )}
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
          aoMudar={definirPagina}
        />
      </Cartao>

      <DialogoDeFormulario
        aberto={dialogo !== false}
        aoFechar={() => definirDialogo(false)}
        titulo={emEdicao ? `Editar ${rotuloDoItem(emEdicao).toLowerCase()}` : 'Novo opcional'}
        descricao="Preço de uma unidade, parcelas, cota por formando, estoque e quando a venda abre e fecha."
        largura="largo"
      >
        <FormularioDeOpcional
          key={emEdicao?.id ?? 'novo'}
          item={emEdicao}
          editavel={editavel}
          aoConcluir={() => definirDialogo(false)}
        />
      </DialogoDeFormulario>
    </>
  )
}

/**
 * Em que pé está a venda: o que a coluna decide é também o par de botões da linha. O item da loja
 * ganha o selo dela, porque some da vitrine dos formandos (P8).
 */
function SituacaoDaVenda({ item }: { item: ItemDeCobranca }) {
  if (item.encerrado_em) return <Selo>Encerrada</Selo>

  const loja = item.modo_de_venda === 'Publica' ? <Selo tom="marca">Loja pública</Selo> : null

  if (item.abertura_de_vendas && !jaChegou(item.abertura_de_vendas))
    return (
      <span className="flex flex-wrap gap-1">
        {loja}
        <Selo tom="alerta">Abre em {formatarDataHora(item.abertura_de_vendas)}</Selo>
      </span>
    )

  if (item.estoque !== null && item.reservados >= item.estoque) return <Selo tom="perigo">Esgotado</Selo>

  return loja ?? <Selo tom="sucesso">À venda</Selo>
}
