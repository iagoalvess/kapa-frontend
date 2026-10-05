import { Pencil, ShoppingCart, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { DialogoDeTexto } from '@/components/DialogoDeTexto'
import { AcaoDaLinha, AcoesDaLinha } from '@/components/AcoesDaLinha'
import { BotaoDeFiltros } from '@/components/BotaoDeFiltros'
import { Chip } from '@/components/Chip'
import { EsqueletoDeTabela } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { FiltroDeOrdenacao } from '@/components/FiltroDeOrdenacao'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { ListaVazia } from '@/components/ListaVazia'
import { ColunaOrdenavel, Tabela } from '@/components/Planilha'
import { Selo } from '@/components/Selo'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { useOrdenacao } from '@/hooks/useOrdenacao'
import mascoteChecklist from '@/assets/mascote/checklist.webp'
import { contemBusca } from '@/lib/busca'
import { formatarCentavos, formatarData, formatarDataHora, formatarNumero } from '@/lib/formato'
import { ordenarPor } from '@/lib/ordenar'
import { useOpcionais } from '../hooks/useOpcionais'
import { useCancelarPedido, useMeusPedidos } from '../hooks/usePedidos'
import {
  cancelavelHoje,
  type Opcional,
  type Pedido,
  ROTULOS_DE_TIPO,
  rotuloDoItem,
  TIPOS_DOS_OPCIONAIS,
} from '../types/cobrancas.types'
import { IconeDoTipo } from './IconeDoTipo'
import { DialogoDePedido } from './DialogoDePedido'

/** O que cada coluna do painel compara. Sem escolha vale a ordem da API. */
const CHAVES: Record<string, (item: Opcional) => string | number> = {
  nome: rotuloDoItem,
  preco: (item) => item.valor_em_centavos,
}

/** O catálogo recortado pela URL; a vitrine e os filtros leem o mesmo recorte. */
function useRecorte() {
  const opcionais = useOpcionais()
  const { parametros, busca, atualizar } = useFiltrosDaUrl()
  const ordenacao = useOrdenacao(atualizar)
  const todos = opcionais.data ?? []
  const categorias = TIPOS_DOS_OPCIONAIS.filter((tipo) => todos.some((item) => item.tipo === tipo))
  const categoria = categorias.find((tipo) => tipo === parametros.get('tipo'))
  const itens = ordenarPor(
    todos.filter(
      (item) =>
        (!categoria || item.tipo === categoria) &&
        contemBusca(busca, rotuloDoItem(item), ROTULOS_DE_TIPO[item.tipo]),
    ),
    CHAVES,
    ordenacao.por,
    ordenacao.descendente,
  )

  return { opcionais, categorias, categoria, itens, busca, atualizar, ordenacao }
}

/**
 * Busca e tipo da vitrine. Ficam acima das colunas da tela, como em Mural e Festa, e não dentro do
 * cartão; sem nada à venda, não aparecem.
 */
export function FiltrosDaVitrine() {
  const { opcionais, categorias, categoria, itens, busca, atualizar, ordenacao } = useRecorte()

  if (!opcionais.data?.length) return null

  return (
    <FiltrosDaPlanilha
      principal={
        <Chip ativo={!categoria} onClick={() => atualizar({ tipo: null })}>
          Todos
        </Chip>
      }
      busca={{ valor: busca, rotulo: 'Buscar item', aoBuscar: (valor) => atualizar({ busca: valor }) }}
      legenda="Tipo de item"
      filtros={categorias.map((tipo) => (
        <Chip key={tipo} ativo={categoria === tipo} onClick={() => atualizar({ tipo })}>
          {ROTULOS_DE_TIPO[tipo]}
        </Chip>
      ))}
      filtrosAvancados={
        <BotaoDeFiltros id="filtros-da-vitrine" ligados={ordenacao.por ? 1 : 0}>
          <FiltroDeOrdenacao
            ordenacao={ordenacao}
            opcoes={[
              { por: 'nome', rotulo: 'Item' },
              { por: 'preco', rotulo: 'Preço' },
            ]}
          />
        </BotaoDeFiltros>
      }
      contagem={{ mostrando: itens.length, total: opcionais.data.length, unidade: 'itens' }}
    />
  )
}

/**
 * "O que você pode pedir": a vitrine do formando, na tela "Meus pedidos".
 *
 * É uma planilha como a de Membros — sem título no cartão, o `h1` da tela já diz onde se está —, com
 * a ação de cada item à direita, só ícone. O item que a pessoa já pediu diz quanto, e o botão vira
 * ajuste. Antes era um cartão com título e descrição; o texto saiu e o desenho ficou o das listas.
 *
 * Sem nada à venda, ela diz que não há — é o conteúdo da tela, e sumir deixaria a página em branco.
 *
 * @param aoPedir Depois de pedir. Quem hospeda a vitrine leva daqui ao PIX das parcelas novas.
 */
export function VitrineDeItens({ aoPedir }: { aoPedir?: (pedido: Pedido) => void }) {
  const { opcionais, itens, atualizar, ordenacao } = useRecorte()
  const meus = useMeusPedidos()
  const [aberto, definirAberto] = useState<Opcional | null>(null)

  const pedidoDe = (item: Opcional) =>
    meus.data?.find((pedido) => pedido.item_de_cobranca_id === item.id && pedido.status === 'Confirmado')

  if (opcionais.isPending) return <EsqueletoDeTabela colunas={3} />

  if (opcionais.isError)
    return <ErroDaConsulta compacto erro={opcionais.error} aoTentarDeNovo={() => void opcionais.refetch()} />

  return (
    <>
      <section
        aria-label="O que você pode pedir"
        className="bg-card shadow-cartao rounded-3xl px-5 py-2 max-lg:-mx-4 max-lg:rounded-none max-lg:border-y max-lg:px-4 max-lg:py-0 max-lg:shadow-none"
      >
        {opcionais.data.length === 0 ? (
          <ListaVazia
            titulo="Nada à venda ainda"
            dica="A turma ainda não abriu nenhum opcional. Quando a tesouraria abrir — o convite a mais, a foto, a mesa —, ele aparece aqui."
            mascote={mascoteChecklist}
          />
        ) : itens.length === 0 ? (
          <ListaVazia
            titulo="Nenhum item com esses filtros"
            dica={
              <>
                Tente outra busca ou tire o filtro.{' '}
                <button
                  type="button"
                  className="text-foreground font-medium underline"
                  onClick={() => atualizar({ tipo: null, busca: null })}
                >
                  Limpar filtros
                </button>
              </>
            }
          />
        ) : (
          <Tabela
            emLista
            legenda="Itens disponíveis"
            ordenacao={ordenacao}
            cabecalho={
              <>
                <ColunaOrdenavel coluna="nome">Item e valor unitário</ColunaOrdenavel>
                <th className="py-3 pr-4 font-normal">Disponibilidade</th>
                <th className="py-3 pr-4 font-normal">Seu pedido</th>
              </>
            }
          >
            {itens.map((item) => (
              <LinhaDaVitrine
                key={item.id}
                item={item}
                pedido={pedidoDe(item)}
                aoPedir={() => definirAberto(item)}
              />
            ))}
          </Tabela>
        )}
      </section>

      {aberto ? (
        <DialogoDePedido
          key={aberto.id}
          item={aberto}
          pedido={pedidoDe(aberto)}
          aoFechar={() => definirAberto(null)}
          aoPedir={aoPedir}
        />
      ) : null}
    </>
  )
}

/**
 * Uma linha da vitrine: o item nomeia, a disponibilidade diz o que resta, e a ação fica à direita,
 * só ícone — o mesmo desenho das ações de linha das outras planilhas.
 */
function LinhaDaVitrine({ item, pedido, aoPedir }: { item: Opcional; pedido?: Pedido; aoPedir: () => void }) {
  const esgotado = item.disponivel === 0
  const meu = pedido && pedido.status === 'Confirmado' ? pedido : undefined

  return (
    <tr className="border-b last:border-0">
      <th scope="row" className="py-3 pr-4 text-left font-normal">
        <div className="flex items-center gap-3">
          <IconeDoTipo tipo={item.tipo} />
          <div className="grid min-w-0 gap-0.5">
            <span className="text-foreground font-medium break-words">{rotuloDoItem(item)}</span>
            <span className="text-muted-foreground text-sm">
              <span className="tabular-nums">{formatarCentavos(item.valor_em_centavos)}</span> cada
              {item.numero_de_parcelas > 1 ? ` · até ${item.numero_de_parcelas}×` : null}
              {item.limite_por_formando
                ? ` · até ${formatarNumero(item.limite_por_formando)} por formando`
                : null}
            </span>
          </div>
        </div>
      </th>

      <td className="py-3 pr-4">
        <div className="grid justify-items-start gap-1">
          {/* Só com teto: a contagem existe para dizer que pode acabar. */}
          {item.disponivel !== null ? (
            <span className={esgotado ? 'text-sinal-negativo-text text-sm' : 'text-muted-foreground text-sm'}>
              {esgotado
                ? 'Esgotado'
                : `Restam ${formatarNumero(item.disponivel)} de ${formatarNumero(item.estoque ?? 0)}`}
            </span>
          ) : null}

          {item.pedidos_ate_dia ? (
            <span className="text-texto-muted text-xs">
              Pedidos até {formatarData(item.pedidos_ate_dia)}.
            </span>
          ) : null}

          {!item.aberto_a_pedido ? (
            <span className="text-muted-foreground text-sm">
              As vendas abrem em{' '}
              <span className="text-foreground font-medium">{formatarDataHora(item.abertura_de_vendas)}</span>
              .
            </span>
          ) : null}
        </div>
      </td>

      <td className="py-3 pr-4">
        {meu ? (
          <div className="grid justify-items-start gap-1">
            <Selo tom="sucesso">
              Você pediu {formatarNumero(meu.quantidade)}
              {meu.quantidade === 1 ? ' unidade' : ' unidades'}
            </Selo>
            {meu.cancelamento_solicitado ? <Selo tom="alerta">Cancelamento pedido à comissão</Selo> : null}
          </div>
        ) : null}
      </td>

      <td className="py-3 text-right">
        {item.aberto_a_pedido || meu ? (
          <AcoesDaLinha rotulo={`Ações de ${rotuloDoItem(item)}`}>
            {item.aberto_a_pedido ? (
              <AcaoDaLinha
                rotulo={meu ? 'Mudar quantidade' : 'Pedir'}
                icone={meu ? Pencil : ShoppingCart}
                desabilitada={(esgotado && !meu) || meu?.cancelamento_solicitado}
                onClick={aoPedir}
              />
            ) : null}
            {meu && !meu.cancelamento_solicitado && cancelavelHoje(meu.cancelavel_ate) ? (
              <PedirCancelamento pedido={meu} />
            ) : null}
          </AcoesDaLinha>
        ) : null}
      </td>
    </tr>
  )
}

const esquemaDoMotivo = z.object({
  motivo: z.string().trim().max(300, 'Escreva o motivo em até 300 caracteres.'),
})

/**
 * O formando não cancela sozinho, nem sem nada pago (Sprint 48, D8): pede à comissão, que aprova ou recusa. Enquanto
 * ela não responde — até 7 dias —, as parcelas do pedido saem da cobrança automática.
 */
function PedirCancelamento({ pedido }: { pedido: Pedido }) {
  const cancelar = useCancelarPedido()

  return (
    <DialogoDeTexto
      gatilho="Pedir cancelamento"
      gatilhoIcone={{ icone: X, tom: 'perigo' }}
      titulo={`Pedir o cancelamento de ${rotuloDoItem(pedido).toLowerCase()}?`}
      descricao={
        pedido.pago_em_centavos > 0
          ? 'A comissão decide. Se aprovar, o pedido cai e o que você já pagou entra na lista de devolução da turma. Até a resposta, as parcelas dele não são cobradas.'
          : 'A comissão decide. Até a resposta, as parcelas dele não são cobradas.'
      }
      campo="motivo"
      rotulo="Motivo (opcional)"
      esquema={esquemaDoMotivo}
      confirmar="Pedir cancelamento"
      confirmarOcupado="Enviando…"
      ocupado={cancelar.isPending}
      aoEnviar={(motivo, concluir, falhar) =>
        cancelar.mutate(
          { pedidoId: pedido.id, motivo },
          {
            onSuccess: () => {
              toast.success('Pedido enviado à comissão. Ela responde em até 7 dias.')
              concluir()
            },
            onError: falhar,
          },
        )
      }
    />
  )
}
