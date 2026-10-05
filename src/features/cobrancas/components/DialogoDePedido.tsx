import { Minus, Plus } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { AcoesDoFormulario } from '@/components/AcoesDoFormulario'
import { DialogoDeFormulario } from '@/components/DialogoDeFormulario'
import { Select } from '@/components/Select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatarCentavos, formatarData, formatarNumero } from '@/lib/formato'
import { avisarErro } from '@/lib/http/erros'
import { useAjustarPedido, usePedir } from '../hooks/usePedidos'
import { gradeDoPedido, passaDoLimite } from '../lib/gradeDoPedido'
import type { Opcional, Pedido } from '../types/cobrancas.types'

/**
 * Quanto o formando pode pedir: a cota do item e o que resta no estoque, o que for menor.
 *
 * Quem já tem pedido conta o que já reservou: o estoque livre é o de fora, e as unidades dele já
 * estão reservadas — sem isso, quem pediu 3 de 10 veria teto 7 ao tentar chegar a 4.
 */
function teto(item: Opcional, jaPedidas: number) {
  const porEstoque = item.disponivel === null ? Number.POSITIVE_INFINITY : item.disponivel + jaPedidas
  const porCota = item.limite_por_formando ?? Number.POSITIVE_INFINITY

  return Math.max(1, Math.min(porEstoque, porCota))
}

/**
 * "Pedir e pagar": quantidade, em quantas vezes, total, o calendário dos vencimentos e o botão que
 * leva ao PIX.
 *
 * O parcelamento é escolha do formando, até o teto do item, e nasce **à vista** (22/09): foto, kit
 * e convite são compras de cada um, e parcelar é conveniência de quem compra. Só se escolhe no pedido
 * novo — no de pé ele aparece fixo, porque o aumento de quantidade sai com a mesma divisão.
 *
 * O calendário aparece **antes** de confirmar — mesma regra da Sprint 7, em que o que se paga vem
 * antes do termo. Ninguém deve descobrir o vencimento no extrato.
 *
 * Não há aprovação no meio (P2): o pedido nasce confirmado, as parcelas entram no extrato e a tela
 * cai no PIX da primeira. Quem preferir pagar depois fecha o diálogo — o que ele passou a dever já
 * está lá.
 *
 * @param item O item pedido.
 * @param pedido O pedido que a pessoa já tem deste item, se tiver: o diálogo abre na quantidade dele.
 * @param aoFechar Fecha o diálogo.
 * @param aoPedir Depois de gravar. Quem hospeda a vitrine leva daqui ao PIX — o extrato é de
 *   `pagamentos`, e é lá que as parcelas recém-criadas têm id.
 */
export function DialogoDePedido({
  item,
  pedido,
  aoFechar,
  aoPedir,
}: {
  item: Opcional
  pedido?: Pedido
  aoFechar: () => void
  aoPedir?: (pedido: Pedido) => void
}) {
  const jaPedidas = pedido?.status === 'Confirmado' ? pedido.quantidade : 0
  const [quantidade, definirQuantidade] = useState(Math.max(1, jaPedidas))
  const [escolhidas, definirEscolhidas] = useState(1)
  const [observacao, definirObservacao] = useState('')
  const idDasParcelas = useId()
  const idDaObservacao = useId()
  // No pedido de pé a divisão é a dele; o teto só se aplica à escolha.
  const parcelas = jaPedidas > 0 && pedido ? pedido.parcelas : Math.min(escolhidas, item.numero_de_parcelas)
  const criar = usePedir()
  const ajustar = useAjustarPedido()
  const salvando = criar.isPending || ajustar.isPending

  const maximo = teto(item, jaPedidas)
  const grade = gradeDoPedido(item, quantidade, parcelas)
  const total = item.valor_em_centavos * quantidade

  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault()

    const aoTerminar = {
      onSuccess: (gravado: Pedido) => {
        toast.success(
          jaPedidas > 0
            ? 'Pedido salvo. O extrato já mostra a quantidade nova.'
            : 'Pedido feito. As parcelas já estão no seu extrato.',
        )
        aoFechar()
        aoPedir?.(gravado)
      },
      onError: avisarErro,
    }

    if (pedido && pedido.status === 'Confirmado')
      ajustar.mutate({ pedidoId: pedido.id, quantidade }, aoTerminar)
    else criar.mutate({ itemId: item.id, quantidade, parcelas, observacao: observacao.trim() }, aoTerminar)
  }

  return (
    <DialogoDeFormulario
      aberto
      aoFechar={aoFechar}
      titulo={item.descricao ?? item.tipo}
      descricao={
        <>
          <span className="tabular-nums">{formatarCentavos(item.valor_em_centavos)}</span> cada
          {item.limite_por_formando
            ? ` · até ${formatarNumero(item.limite_por_formando)} por formando`
            : null}
          {item.disponivel !== null ? ` · restam ${formatarNumero(item.disponivel)}` : null}
        </>
      }
      largura="estreito"
    >
      <form onSubmit={enviar} noValidate className="grid gap-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-foreground font-medium">Quantidade</span>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Menos uma unidade"
              disabled={quantidade <= 1 || salvando}
              onClick={() => definirQuantidade((atual) => Math.max(1, atual - 1))}
            >
              <Minus className="size-4" aria-hidden />
            </Button>
            <output className="text-foreground w-8 text-center text-lg font-medium tabular-nums">
              {formatarNumero(quantidade)}
            </output>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Mais uma unidade"
              disabled={quantidade >= maximo || salvando}
              onClick={() => definirQuantidade((atual) => Math.min(maximo, atual + 1))}
            >
              <Plus className="size-4" aria-hidden />
            </Button>
          </div>
        </div>

        {item.numero_de_parcelas > 1 && jaPedidas === 0 ? (
          <div className="flex items-center justify-between gap-4">
            <label htmlFor={idDasParcelas} className="text-foreground font-medium">
              Pagar em
            </label>
            {/* Cada opção já diz o valor da parcela: é ele que decide, e não o número de vezes. */}
            <Select
              className="w-auto"
              id={idDasParcelas}
              value={parcelas}
              disabled={salvando}
              onChange={(evento) => definirEscolhidas(Number(evento.target.value))}
            >
              {Array.from({ length: item.numero_de_parcelas }, (_, posicao) => posicao + 1).map((vezes) => (
                <option key={vezes} value={vezes}>
                  {vezes === 1
                    ? `À vista — ${formatarCentavos(total)}`
                    : `${vezes}× de ${formatarCentavos(Math.trunc(total / vezes))}`}
                </option>
              ))}
            </Select>
          </div>
        ) : null}

        {/* Sprint 48, D26: tamanho da beca, nome no convite — a comissão lê na lista de Pedidos. */}
        {jaPedidas === 0 ? (
          <div className="grid gap-2">
            <label htmlFor={idDaObservacao} className="text-foreground w-fit font-medium">
              Detalhe (opcional)
            </label>
            <Input
              id={idDaObservacao}
              value={observacao}
              maxLength={300}
              placeholder="Tamanho, nome, cor"
              disabled={salvando}
              onChange={(evento) => definirObservacao(evento.target.value)}
            />
          </div>
        ) : null}

        <div className="bg-muted grid gap-1 rounded-xl px-4 py-3 text-sm">
          <p className="flex items-baseline justify-between gap-4">
            <span className="text-muted-foreground">Total</span>
            <span className="text-foreground text-lg font-medium tabular-nums">
              {formatarCentavos(total)}
            </span>
          </p>
          <p className="text-muted-foreground">
            {grade.length === 1
              ? `Parcela única, vence ${formatarData(grade[0]?.vencimento)}`
              : `Em ${formatarNumero(grade.length)}× — vence ${grade.map((parcela) => formatarData(parcela.vencimento)).join(', ')}`}
          </p>
          {grade.length > 1 ? (
            <ul className="text-muted-foreground grid gap-0.5">
              {grade.map((parcela) => (
                <li key={parcela.numero} className="flex justify-between gap-4 tabular-nums">
                  <span>
                    {parcela.numero}/{grade.length} · {formatarData(parcela.vencimento)}
                  </span>
                  <span>{formatarCentavos(parcela.valor_em_centavos)}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        {passaDoLimite(item, grade) ? (
          <p role="alert" className="text-warning-text text-sm">
            A última parcela passaria de {formatarData(item.ultimo_vencimento)}, o último vencimento deste
            item. Escolha menos parcelas.
          </p>
        ) : null}

        <p className="text-texto-muted text-xs">
          O valor entra no seu extrato e é pago pelo mesmo PIX da turma.
        </p>

        <AcoesDoFormulario
          aoCancelar={aoFechar}
          ocupado={salvando}
          rotulo={jaPedidas > 0 ? 'Salvar' : 'Pedir e pagar'}
          rotuloOcupado={jaPedidas > 0 ? 'Salvando…' : 'Pedindo…'}
        />
      </form>
    </DialogoDeFormulario>
  )
}
