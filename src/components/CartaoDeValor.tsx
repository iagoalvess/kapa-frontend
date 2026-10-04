import type { ReactNode } from 'react'
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { cn } from '@/lib/utils'

interface Props {
  titulo: string
  /** Fundo laranja-claro: há algo a fazer. Sem pendência, o cartão volta ao branco. */
  destaque?: boolean
  /** A linha miúda acima do número ("Falta pagar", "Mensalidade 3/12"). */
  rotulo: ReactNode
  valor: ReactNode
  /** A frase embaixo do número. */
  nota?: ReactNode
  /** O botão, de largura inteira. */
  acao?: ReactNode
  /** A observação do pé, depois de um traço. */
  rodape?: ReactNode
  className?: string
}

/**
 * O cartão do topo das laterais do formando — rótulo, número grande, frase, ação e pé —, nascido em
 * "Pagamento dos pedidos" e repetido em "Próxima parcela" e nos convites aguardando pagamento.
 */
export function CartaoDeValor({ titulo, destaque, rotulo, valor, nota, acao, rodape, className }: Props) {
  return (
    <Cartao titulo={titulo} className={cn(destaque && 'bg-brand-wash', className)}>
      <div className="grid gap-1">
        <TextoDoCartao>{rotulo}</TextoDoCartao>
        <p className="text-foreground text-3xl font-medium tabular-nums">{valor}</p>
        {nota ? <TextoDoCartao as="div">{nota}</TextoDoCartao> : null}
      </div>
      {acao ? <div className="grid [&_a]:w-full [&_button]:w-full">{acao}</div> : null}
      {rodape ? <TextoDoCartao className="border-t pt-4">{rodape}</TextoDoCartao> : null}
    </Cartao>
  )
}
