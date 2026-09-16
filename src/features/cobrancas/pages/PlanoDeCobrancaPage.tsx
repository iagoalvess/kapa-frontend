import { BadgeCheck, CalendarDays, Coins, type LucideIcon, PartyPopper, Receipt, Ticket } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import mascoteCofrinho from '@/assets/mascote/cofrinho.webp'
import { Cartao } from '@/components/Cartao'
import { DialogoDeConfirmacao } from '@/components/DialogoDeConfirmacao'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import {
  EsqueletoDeCartao,
  EsqueletoDeCartoes,
  EsqueletoDeDados,
  EsqueletoDeTexto,
} from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { Button } from '@/components/ui/button'
import { useEscritaLiberada, useFormaturaAtual } from '@/hooks/useFormaturaAtual'
import { formatarCentavos, formatarMesAno, formatarNumero } from '@/lib/formato'
import { mensagemDoErro } from '@/lib/http/erros'
import { cn } from '@/lib/utils'
import { CartaoDoPlano } from '../components/CartaoDoPlano'
import { FormularioDeItemEmEdicao, FormularioDeItemNovo } from '../components/FormularioDeItem'
import { FormularioDoPlano } from '../components/FormularioDoPlano'
import { PreviaDaGrade } from '../components/PreviaDaGrade'
import { RegrasDoPlano } from '../components/RegrasDoPlano'
import { ResumoDoPlano } from '../components/ResumoDoPlano'
import { useEncerrarItem, usePlano, usePlanos, useRemoverItem } from '../hooks/usePlano'
import { useSimulacao } from '../hooks/useSimulacao'
import { dadosDe } from '../schemas/cobranca.schema'
import {
  type ItemDeCobranca,
  type PlanoDeCobranca,
  rotuloDoItem,
  type TipoDeCobranca,
} from '../types/cobrancas.types'

/** O ícone de cada tipo na lista de itens, no bloco cinza dos cartões do modelo. */
const ICONES_DE_TIPO: Record<TipoDeCobranca, LucideIcon> = {
  Mensalidade: CalendarDays,
  Adesao: BadgeCheck,
  Rifa: Ticket,
  ConviteExtra: PartyPopper,
  Avulsa: Receipt,
}

/**
 * O plano financeiro da turma, no desenho do modelo de planos: números no topo, os itens à esquerda
 * — na tabela do cartão, com a inclusão no cabeçalho — e à direita o que se consulta, as regras e a
 * grade de um formando.
 *
 * A turma tem um plano em uso por vez; a tela mostra o vigente ou, antes dele, o que está em
 * montagem. Sem plano, a tela é o formulário que cria o primeiro.
 */
export default function PlanoDeCobrancaPage() {
  const planos = usePlanos()
  const editavel = useEscritaLiberada()

  if (planos.isPending) return <EsqueletoDoPlano />

  if (planos.isError) return <ErroDaConsulta erro={planos.error} />

  const plano = planos.data[0]

  if (!plano) {
    return (
      <Cartao
        titulo="Plano de cobrança"
        icone={Coins}
        descricao="A turma ainda não tem plano. Dê um nome e confira as regras de atraso; os itens vêm em seguida."
        className="max-w-2xl"
      >
        <div className="flex items-center gap-4">
          <img src={mascoteCofrinho} alt="" className="w-20 shrink-0 drop-shadow-lg" />
          <p className="text-muted-foreground text-sm">
            Mensalidade, adesão, rifa: os itens vêm depois, e a grade de um formando aparece ao lado deles,
            parcela por parcela, antes de o Presidente colocar o plano em vigor.
          </p>
        </div>
        <FormularioDoPlano editavel={editavel} />
      </Cartao>
    )
  }

  // Chave pelo plano: o formulário do item e o que está em edição não atravessam de um plano a outro.
  return <TelaDoPlano key={plano.id} planoId={plano.id} />
}

function TelaDoPlano({ planoId }: { planoId: string }) {
  const plano = usePlano(planoId)
  const formatura = useFormaturaAtual()
  const editavel = useEscritaLiberada()
  // `false` fechado, `{}` inclui um item, `{ item }` edita aquele — o mesmo diálogo dos documentos.
  const [dialogo, definirDialogo] = useState<false | { item?: ItemDeCobranca }>(false)

  const gravado = useSimulacao(planoId)

  if (plano.isPending) return <EsqueletoDoPlano />

  if (plano.isError) return <ErroDaConsulta erro={plano.error} />

  const emEdicao = dialogo === false ? undefined : dialogo.item
  const ativos = plano.data.itens.filter((item) => !item.encerrado_em)

  return (
    <>
      <ResumoDoPlano simulacao={gravado.data} estimados={formatura.data?.quantidade_estimada_de_formandos} />

      {/* O arranjo das telas de formatura e adesão: o que se faz à esquerda — o plano e os itens —,
          e à direita o que se consulta: as regras e a grade que sai delas. */}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
        <CartaoDoPlano
          plano={plano.data}
          simulacao={gravado.data}
          editavel={editavel}
          aoIncluirItem={() => definirDialogo({})}
        >
          <ListaDeItens
            plano={plano.data}
            editavel={editavel}
            aoEditar={(item) => definirDialogo({ item })}
          />
        </CartaoDoPlano>

        {/* Incluir e editar são o mesmo formulário, no mesmo diálogo: era a única tela do app que
            criava num formulário sempre aberto dentro do cartão. */}
        <DialogoDeFormulario
          aberto={dialogo !== false}
          aoFechar={() => definirDialogo(false)}
          titulo={emEdicao ? `Editar ${rotuloDoItem(emEdicao).toLowerCase()}` : 'Incluir item'}
          descricao={
            emEdicao?.em_uso
              ? 'Este item já gerou parcela: só o valor e a descrição mudam.'
              : 'Tipo, valor, parcelas, dia de vencimento e primeiro mês.'
          }
          largura="largo"
        >
          {emEdicao ? (
            <FormularioDeItemEmEdicao
              key={emEdicao.id}
              planoId={planoId}
              item={emEdicao}
              editavel={editavel}
              aoConcluir={() => definirDialogo(false)}
            />
          ) : (
            <FormularioDeItemNovo
              planoId={planoId}
              itensDoPlano={ativos.map(dadosDe)}
              editavel={editavel}
              aoConcluir={() => definirDialogo(false)}
              jaAderiram={plano.data.formandos_com_parcela}
            />
          )}
        </DialogoDeFormulario>

        <div className="grid gap-5">
          <RegrasDoPlano plano={plano.data} editavel={editavel} />

          {/* Sem ícone no título: é a regra dos cartões laterais das telas de formatura e adesão. */}
          <Cartao
            titulo="Prévia da grade"
            descricao="Um formando, parcela a parcela — calculada pelo servidor, como vai ser cobrada."
          >
            <PreviaDaGrade simulacao={gravado.data} atualizando={gravado.isFetching} erro={gravado.error} />
          </Cartao>
        </div>
      </div>
    </>
  )
}

/**
 * O desenho da tela antes de saber se a turma tem plano: os números no topo e, embaixo, os itens à
 * esquerda com a grade à direita. As duas consultas encadeadas (a lista e o plano) caem no mesmo
 * esqueleto — entre uma e outra a tela não pisca.
 */
function EsqueletoDoPlano() {
  return (
    <>
      <EsqueletoDeCartoes quantidade={1} altura="h-32" className="md:grid-cols-1" />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
        <EsqueletoDeCartao>
          <EsqueletoDeTexto linhas={5} />
        </EsqueletoDeCartao>
        <EsqueletoDeCartao>
          <EsqueletoDeDados linhas={4} />
        </EsqueletoDeCartao>
      </div>
    </>
  )
}

/** A mensagem da API já diz o que fazer (`cobranca.item_em_uso` e companhia). */
const avisar = (erro: unknown) => toast.error(mensagemDoErro(erro))

/**
 * A situação do item, que é também o que dá para fazer com ele: o que já gerou parcela encerra, o
 * que nunca gerou se remove, e o encerrado é histórico.
 *
 * "Cobrando" e "Sem parcelas" no lugar do antigo "Em uso"/nada: o rótulo antigo não dizia o que
 * decidia o par de botões ao lado, e quem lia a linha não sabia por que um item tinha "Encerrar" e
 * o outro "Remover".
 */
function SituacaoDoItem({ item }: { item: ItemDeCobranca }) {
  if (item.encerrado_em) return <Selo>Encerrado</Selo>

  return item.em_uso ? <Selo tom="sucesso">Cobrando</Selo> : <Selo tom="cinza">Sem parcelas</Selo>
}

/**
 * Os itens do plano, na tabela curta dentro do cartão — o desenho das listas do app.
 *
 * Eram três linhas-cartão com formas diferentes: o que já cobrava tinha dois botões, o encerrado
 * nenhum, e os dados de cada item vinham numa frase corrida. Em colunas, valor e parcelas alinham e
 * comparar dois itens deixa de exigir ler duas frases.
 *
 * Os encerrados descem para o fim, esmaecidos: são histórico, e num plano de dois anos passam a ser
 * a maioria das linhas. `ponytail: sem filtro de situação — um plano tem de dois a cinco itens, e
 * filtrar quatro linhas é ferramenta a mais. Se um dia passar de dez, os chips de Membros resolvem.`
 */
function ListaDeItens({
  plano,
  editavel,
  aoEditar,
}: {
  plano: PlanoDeCobranca
  editavel: boolean
  /** Abre o item no diálogo de edição. */
  aoEditar: (item: ItemDeCobranca) => void
}) {
  const remover = useRemoverItem()
  const encerrar = useEncerrarItem()
  const ocupado = remover.isPending || encerrar.isPending

  if (plano.itens.length === 0)
    return (
      <p className="text-muted-foreground text-sm">
        Nenhum item ainda. Comece pela mensalidade, em “Incluir item”.
      </p>
    )

  const itens = [
    ...plano.itens.filter((item) => !item.encerrado_em),
    ...plano.itens.filter((item) => item.encerrado_em),
  ]

  return (
    <Tabela
      cabecalho={
        <>
          <th className="py-3 pr-4 font-normal">Item</th>
          <th className="py-3 pr-4 text-right font-normal">Valor</th>
          <th className="py-3 pr-4 text-right font-normal">Parcelas</th>
          <th className="py-3 pr-4 font-normal">Vence</th>
          <th className="py-3 pr-4 font-normal">A partir de</th>
          <th className="py-3 pr-4 font-normal">Situação</th>
          {editavel ? <th className="py-3 text-right font-normal">Ações</th> : null}
        </>
      }
    >
      {itens.map((item) => {
        const Icone = ICONES_DE_TIPO[item.tipo]

        return (
          <tr key={item.id} className={cn('border-b last:border-0', item.encerrado_em && 'opacity-60')}>
            <td className="text-foreground py-3 pr-4 font-medium">
              <div className="flex items-center gap-3">
                <span className="bg-muted inline-flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icone className="size-4.5" strokeWidth={1.75} aria-hidden />
                </span>
                {rotuloDoItem(item)}
              </div>
            </td>
            <td className="py-3 pr-4 text-right whitespace-nowrap">
              {formatarCentavos(item.valor_em_centavos)}
            </td>
            <td className="py-3 pr-4 text-right">{formatarNumero(item.numero_de_parcelas)}×</td>
            <td className="py-3 pr-4 whitespace-nowrap">todo dia {item.dia_de_vencimento}</td>
            <td className="py-3 pr-4 whitespace-nowrap">{formatarMesAno(item.primeiro_mes)}</td>
            <td className="py-3 pr-4">
              <SituacaoDoItem item={item} />
            </td>
            {editavel ? (
              <td className="py-3">
                {item.encerrado_em ? null : (
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => aoEditar(item)}>
                      Editar
                    </Button>
                    {item.em_uso ? (
                      <DialogoDeConfirmacao
                        gatilho={
                          <Button variant="outline" size="sm" disabled={ocupado}>
                            Encerrar
                          </Button>
                        }
                        titulo={`Encerrar ${rotuloDoItem(item).toLowerCase()}?`}
                        descricao="O item para de cobrar: as parcelas que vencem de amanhã em diante são canceladas. O que já venceu ou foi pago continua como está."
                        rotulo="Encerrar"
                        destrutivo
                        aoConfirmar={() =>
                          encerrar.mutate({ planoId: plano.id, itemId: item.id }, { onError: avisar })
                        }
                      />
                    ) : (
                      <DialogoDeConfirmacao
                        gatilho={
                          <Button variant="outline" size="sm" disabled={ocupado}>
                            Remover
                          </Button>
                        }
                        titulo={`Remover ${rotuloDoItem(item).toLowerCase()}?`}
                        descricao="O item sai do plano e não fica no histórico. Como ele ainda não gerou parcela nenhuma, ninguém deixa de dever nada — mas o que estava escrito aqui se perde."
                        rotulo="Remover"
                        destrutivo
                        aoConfirmar={() =>
                          remover.mutate({ planoId: plano.id, itemId: item.id }, { onError: avisar })
                        }
                      />
                    )}
                  </div>
                )}
              </td>
            ) : null}
          </tr>
        )
      })}
    </Tabela>
  )
}
