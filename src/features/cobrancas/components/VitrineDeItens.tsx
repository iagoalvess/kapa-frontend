import { ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { Cartao } from '@/components/Cartao'
import { Chip } from '@/components/Chip'
import { FiltrosDaPlanilha } from '@/components/FiltrosDaPlanilha'
import { Button } from '@/components/ui/button'
import { useFiltrosDaUrl } from '@/hooks/useFiltrosDaUrl'
import { contemBusca } from '@/lib/busca'
import { EsqueletoDeCartoes } from '@/components/Esqueleto'
import { ErroDaConsulta } from '@/components/EstadoDaConsulta'
import { useOpcionais } from '../hooks/useOpcionais'
import { useMeusPedidos } from '../hooks/usePedidos'
import {
  type Opcional,
  type Pedido,
  ROTULOS_DE_TIPO,
  rotuloDoItem,
  TIPOS_DOS_OPCIONAIS,
} from '../types/cobrancas.types'
import { CartaoDoItem } from './CartaoDoItem'
import { DialogoDePedido } from './DialogoDePedido'

const DESCRICAO =
  'Peça convites extras, kits ou fotos. O valor aparece nas suas parcelas, para você pagar pelos meios aceitos pela turma.'

/** O catálogo recortado pela URL; a vitrine e os filtros leem o mesmo recorte. */
function useRecorte() {
  const opcionais = useOpcionais()
  const { parametros, busca, atualizar } = useFiltrosDaUrl()
  const todos = opcionais.data ?? []
  const categorias = TIPOS_DOS_OPCIONAIS.filter((tipo) => todos.some((item) => item.tipo === tipo))
  const categoria = categorias.find((tipo) => tipo === parametros.get('tipo'))
  const itens = todos.filter(
    (item) =>
      (!categoria || item.tipo === categoria) &&
      contemBusca(busca, rotuloDoItem(item), ROTULOS_DE_TIPO[item.tipo]),
  )

  return { opcionais, categorias, categoria, itens, busca, atualizar }
}

/**
 * Busca e tipo da vitrine. Ficam acima das colunas da tela, como em Mural e Festa, e não dentro do
 * cartão; sem nada à venda, não aparecem.
 */
export function FiltrosDaVitrine() {
  const { opcionais, categorias, categoria, itens, busca, atualizar } = useRecorte()

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
      contagem={{ mostrando: itens.length, total: opcionais.data.length, unidade: 'itens' }}
    />
  )
}

/**
 * "O que você pode pedir": a vitrine do formando, na tela "Meus pedidos".
 *
 * Morava acima do extrato, em "Minhas parcelas", quando eram três itens; com a turma vendendo foto,
 * kit, camiseta e mesa, ganhou tela própria (22/09). Por isso, sem nada à venda, ela diz que não há —
 * é o conteúdo da tela, e sumir deixaria a página em branco.
 *
 * @param aoPedir Depois de pedir. Quem hospeda a vitrine leva daqui ao PIX das parcelas novas.
 */
export function VitrineDeItens({ aoPedir }: { aoPedir?: (pedido: Pedido) => void }) {
  const { opcionais, itens, atualizar } = useRecorte()
  const meus = useMeusPedidos()
  const [aberto, definirAberto] = useState<Opcional | null>(null)

  if (opcionais.isPending) return <EsqueletoDeCartoes quantidade={2} altura="h-36" />

  if (opcionais.isError) return <ErroDaConsulta erro={opcionais.error} />

  if (opcionais.data.length === 0)
    return (
      <Cartao titulo="O que você pode pedir" icone={ShoppingBag} descricao={DESCRICAO}>
        <p className="text-muted-foreground text-sm">
          A turma ainda não abriu nenhum opcional. Quando a tesouraria abrir — o convite a mais, a foto, a
          mesa —, ele aparece aqui.
        </p>
      </Cartao>
    )

  const pedidoDe = (item: Opcional) =>
    meus.data?.find((pedido) => pedido.item_de_cobranca_id === item.id && pedido.status === 'Confirmado')

  return (
    <Cartao titulo="O que você pode pedir" icone={ShoppingBag} descricao={DESCRICAO}>
      <div className="@container">
        <div
          aria-hidden
          className="text-texto-muted hidden grid-cols-[minmax(0,1fr)_10rem_9rem] gap-4 px-3 pb-2 text-xs @min-[42rem]:grid"
        >
          <span>Item e valor unitário</span>
          <span>Disponibilidade</span>
          <span className="text-right">Ação</span>
        </div>
        <ul className="grid gap-2" aria-label="Itens disponíveis">
          {itens.map((item) => (
            <li key={item.id}>
              <CartaoDoItem item={item} pedido={pedidoDe(item)} aoPedir={() => definirAberto(item)} />
            </li>
          ))}
        </ul>
        {itens.length === 0 ? (
          <div className="grid justify-items-start gap-3 py-5">
            <p className="text-muted-foreground text-sm">Nenhum item encontrado com esses filtros.</p>
            <Button variant="outline" size="sm" onClick={() => atualizar({ tipo: null, busca: null })}>
              Limpar filtros
            </Button>
          </div>
        ) : null}
      </div>

      {aberto ? (
        <DialogoDePedido
          key={aberto.id}
          item={aberto}
          pedido={pedidoDe(aberto)}
          aoFechar={() => definirAberto(null)}
          aoPedir={aoPedir}
        />
      ) : null}
    </Cartao>
  )
}
