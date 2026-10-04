import type { ReactNode } from 'react'
import { Selo } from '@/components/Selo'
import { formatarCentavos, formatarData, formatarNumero, jaChegou } from '@/lib/formato'
import { cn } from '@/lib/utils'
import { aVenda, estaAberto } from '../lib/disponibilidade'
import type { ItemDaLoja } from '../types/loja.types'
import { ContagemRegressiva } from './ContagemRegressiva'

/**
 * Os convites à venda em cartões. Com `aoEscolher`, viram a etapa de escolha da compra: o cartão escolhido
 * ganha a borda da marca e recebe a quantidade (os `children`), e o que não está à venda aparece no lugar,
 * desabilitado. Sem `aoEscolher` são só leitura — é assim que a loja mostra o que esgotou ou ainda vai abrir.
 *
 * @param itens Os convites da loja, na ordem da API.
 * @param agora O agora do servidor, em milissegundos.
 * @param escolhidoId O convite escolhido, quando há escolha.
 * @param aoEscolher Recebe o id do cartão tocado.
 * @param children O que aparece dentro do cartão escolhido — a quantidade.
 */
export function CartoesDeConvite({
  itens,
  agora,
  escolhidoId,
  aoEscolher,
  children,
}: {
  itens: ItemDaLoja[]
  agora: number
  escolhidoId?: string
  aoEscolher?: (id: string) => void
  children?: ReactNode
}) {
  return (
    <ul aria-label="Convites à venda" className="grid gap-3">
      {itens.map((item) => (
        <CartaoDeConvite
          key={item.id}
          item={item}
          agora={agora}
          escolhido={item.id === escolhidoId}
          aoEscolher={aoEscolher}
        >
          {children}
        </CartaoDeConvite>
      ))}
    </ul>
  )
}

/** Um cartão: nome, preço, situação e prazos — e, quando há escolha, a marca de rádio e o clique. */
function CartaoDeConvite({
  item,
  agora,
  escolhido,
  aoEscolher,
  children,
}: {
  item: ItemDaLoja
  agora: number
  escolhido: boolean
  aoEscolher?: (id: string) => void
  children?: ReactNode
}) {
  const aberto = estaAberto(item, agora)
  const aVender = aVenda(item, agora)

  const conteudo = (
    <>
      <span className="flex items-start justify-between gap-3">
        <span className="flex min-w-0 items-start gap-3">
          {aoEscolher ? <MarcaDeEscolha escolhido={escolhido} /> : null}
          <span className="grid">
            <span className="font-medium">{item.descricao}</span>
            <span className="text-lg font-semibold tabular-nums">
              {formatarCentavos(item.preco_em_centavos)}
            </span>
          </span>
        </span>
        <SituacaoDoItem item={item} aberto={aberto} />
      </span>
      <PrazosDoItem item={item} aberto={aberto} agora={agora} />
    </>
  )

  return (
    <li
      className={cn(
        'grid gap-2 rounded-xl border p-4',
        escolhido && 'border-brand-border bg-brand-wash',
        !aVender && 'opacity-60',
      )}
    >
      {aoEscolher ? (
        <label className={cn('grid gap-2', aVender ? 'cursor-pointer' : 'cursor-not-allowed')}>
          <input
            type="radio"
            name="convite-da-loja"
            className="sr-only"
            checked={escolhido}
            disabled={!aVender}
            onChange={() => aoEscolher(item.id)}
          />
          {conteudo}
        </label>
      ) : (
        conteudo
      )}
      {escolhido ? children : null}
    </li>
  )
}

/** A bolinha da escolha — decorativa; quem manda no formulário é o rádio escondido. */
function MarcaDeEscolha({ escolhido }: { escolhido: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'mt-1 grid size-5 shrink-0 place-items-center rounded-full border-2',
        escolhido ? 'border-brand-border' : 'border-border',
      )}
    >
      {escolhido ? <span className="bg-brand size-2.5 rounded-full" /> : null}
    </span>
  )
}

/** Quando as vendas abrem (em contagem regressiva) e até quando vão. */
export function PrazosDoItem({ item, aberto, agora }: { item: ItemDaLoja; aberto: boolean; agora: number }) {
  return (
    <>
      {!aberto && item.abertura_de_vendas !== null && !jaChegou(item.abertura_de_vendas, agora) ? (
        <p className="text-sm">
          <ContagemRegressiva ate={item.abertura_de_vendas} agora={agora} prefixo="As vendas abrem em" />
        </p>
      ) : null}
      {item.vendas_ate ? (
        <p className="text-muted-foreground text-xs">Vendas até {formatarData(item.vendas_ate)}.</p>
      ) : null}
    </>
  )
}

/** Esgotado, quantos restam, ou que ainda não abriu — o número é **reservado**, não pago. */
export function SituacaoDoItem({ item, aberto }: { item: ItemDaLoja; aberto: boolean }) {
  if (item.disponivel === 0) return <Selo tom="perigo">Esgotado</Selo>
  if (!aberto) return <Selo tom="alerta">Em breve</Selo>
  if (item.disponivel === null) return <Selo tom="sucesso">À venda</Selo>

  return <Selo tom="sucesso">Restam {formatarNumero(item.disponivel)}</Selo>
}
