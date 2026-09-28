import type { Opcional } from '../types/cobrancas.types'

/**
 * A grade que o pedido vai gerar: uma linha por vencimento, em centavos.
 *
 * Existe porque o diálogo mostra o calendário **antes** de confirmar (mesma regra da Sprint 7: o
 * que se paga vem antes do aceite), e a quantidade muda a cada clique no `+` — uma ida ao servidor
 * por clique seria uma consulta por tecla.
 *
 * Espelha `GradeDeParcelas` e `PedidoService.PrimeiroMes` do backend, e as três regras dele valem
 * aqui igual: o preço é **unitário** e multiplica pela quantidade; a divisão é inteira em centavos
 * com o resto na **primeira** parcela; e o primeiro vencimento é o maior entre o mês do item e o
 * próximo dia de vencimento a partir de hoje — parcela de pedido nunca nasce vencida.
 *
 * `ponytail: é a única conta repetida entre front e back nesta sprint, e ela é repetida de
 * propósito. O que a mantém honesta é o teste ao lado, com os mesmos números do critério de aceite
 * (3 × R$ 180 em 2× = 2 × R$ 270). Se um dia divergirem, o servidor manda — ele é quem grava.`
 *
 * @param item O item da vitrine.
 * @param quantidade Quantas unidades.
 * @param parcelas Em quantas vezes o formando escolheu pagar — o `numero_de_parcelas` do item é só o teto.
 * @param hoje Dia de referência; existe para o teste.
 */
export function gradeDoPedido(item: Opcional, quantidade: number, parcelas: number, hoje = new Date()) {
  const total = item.valor_em_centavos * quantidade
  const basica = Math.trunc(total / parcelas)
  const resto = total - basica * parcelas
  const inicio = primeiroVencimento(item, hoje)

  return Array.from({ length: parcelas }, (_, posicao) => ({
    numero: posicao + 1,
    vencimento: vencimento(inicio.getFullYear(), inicio.getMonth() + posicao, item.dia_de_vencimento),
    valor_em_centavos: posicao === 0 ? basica + resto : basica,
  }))
}

/** O mês em que a grade do pedido começa: o do item, ou o próximo vencimento que ainda acontece. */
function primeiroVencimento(item: Opcional, hoje: Date) {
  const doItem = new Date(`${item.primeiro_mes}T00:00:00`)
  const esteMes = vencimento(hoje.getFullYear(), hoje.getMonth(), item.dia_de_vencimento)
  const proximo =
    esteMes >= new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())
      ? new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      : new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1)

  return doItem > proximo ? doItem : proximo
}

/** O vencimento no mês, com o dia limitado ao último dele: 31 em abril vira 30. */
function vencimento(ano: number, mes: number, dia: number) {
  const ultimo = new Date(ano, mes + 1, 0).getDate()

  return new Date(ano, mes, Math.min(dia, ultimo))
}
