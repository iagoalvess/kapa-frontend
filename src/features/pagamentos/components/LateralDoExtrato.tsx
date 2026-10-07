import { LinkDaPagina } from '@/components/LinkDaPagina'
import { Cartao, TextoDoCartao } from '@/components/Cartao'
import { CartaoDeValor } from '@/components/CartaoDeValor'
import { WalletMinimal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROTAS, rotaDoPagamento } from '@/config/rotas'
import { formatarCentavos, formatarData } from '@/lib/formato'
import { aPagar, quitouTudo, rotuloDoItem, valorNaLista } from '@/types/cobranca'
import type { Extrato } from '../types/pagamentos.types'

/**
 * A coluna da direita de "Minhas parcelas", como a de "Meus pedidos": o que fazer agora, o que está
 * esperando a tesouraria e o caminho para os pedidos.
 *
 * O botão da próxima parcela abre os meios que a turma aceita: um botão cheio só na tela.
 */
export function LateralDoExtrato({
  extrato,
  mostrarResumo = true,
}: {
  extrato: Extrato
  mostrarResumo?: boolean
}) {
  const emConferencia = extrato.parcelas.filter((parcela) => parcela.em_conferencia)

  return (
    <div className="grid min-w-0 gap-5 max-lg:contents">
      {mostrarResumo ? <ResumoDaProximaParcela extrato={extrato} /> : null}

      {emConferencia.length > 0 ? (
        <Cartao
          titulo="Em conferência"
          className="hidden lg:grid"
          descricao="A tesouraria confere com o extrato do banco. Confirmado, o recibo chega por e-mail."
        >
          <ParcelasEmConferencia extrato={extrato} />
        </Cartao>
      ) : null}

      <Cartao
        titulo="Meus pedidos"
        className="hidden lg:grid"
        descricao="Convite extra, foto, kit: o que você pede vira parcela aqui."
      >
        <Button asChild variant="outline" size="sm" className="justify-self-start">
          <LinkDaPagina to={ROTAS.meusPedidos}>Ver meus pedidos</LinkDaPagina>
        </Button>
      </Cartao>
    </div>
  )
}

export function ParcelasEmConferencia({ extrato }: { extrato: Extrato }) {
  return (
    <TextoDoCartao as="ul" className="text-foreground divide-y" aria-label="Parcelas em conferência">
      {extrato.parcelas
        .filter((parcela) => parcela.em_conferencia)
        .map((parcela) => (
          <li key={parcela.id} className="flex justify-between gap-3 py-2 first:pt-0 last:pb-0">
            <span className="min-w-0 truncate">
              {rotuloDoItem(parcela)} {parcela.numero}/{parcela.de}
            </span>
            <span className="tabular-nums">{formatarCentavos(valorNaLista(parcela))}</span>
          </li>
        ))}
    </TextoDoCartao>
  )
}

export function ResumoDaProximaParcela({ extrato }: { extrato: Extrato }) {
  const { proxima } = extrato
  if (quitouTudo(extrato.parcelas)) {
    const pago = extrato.parcelas
      .filter((parcela) => parcela.status === 'Paga')
      .reduce((soma, parcela) => soma + valorNaLista(parcela), 0)

    return (
      <CartaoDeValor
        titulo="Tudo quitado"
        rotulo="Total pago"
        valor={formatarCentavos(pago)}
        nota="Você pagou todas as suas parcelas."
      />
    )
  }
  if (!proxima) {
    return (
      <CartaoDeValor
        titulo="Parcelas em dia"
        rotulo="Falta pagar"
        valor={formatarCentavos(extrato.em_aberto_em_centavos)}
        nota="Nenhuma parcela a pagar agora."
      />
    )
  }
  return (
    <CartaoDeValor
      titulo="Próxima parcela"
      destaque={aPagar(proxima)}
      rotulo={`${rotuloDoItem(proxima)} ${proxima.numero}/${proxima.de}`}
      valor={formatarCentavos(valorNaLista(proxima))}
      nota={
        aPagar(proxima)
          ? `${proxima.status === 'Vencida' ? 'Venceu' : 'Vence'} em ${formatarData(proxima.vencimento)}.`
          : 'Você já avisou este pagamento.'
      }
      acao={
        aPagar(proxima) ? (
          <Button asChild>
            <LinkDaPagina to={rotaDoPagamento(proxima.id)}>
              <WalletMinimal />
              Pagar parcela
            </LinkDaPagina>
          </Button>
        ) : null
      }
      rodape="O valor é o de hoje: na vencida, já com multa e juros. Pague várias de uma vez pela barra da lista."
    />
  )
}
