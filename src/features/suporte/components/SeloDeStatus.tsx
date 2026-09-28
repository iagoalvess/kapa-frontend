import { Selo, type TomDoSelo } from '@/components/Selo'
import { APARENCIA_DA_ASSINATURA } from '@/types/assinatura'

/**
 * O rótulo de cada status de formatura no painel.
 *
 * "A contratar" e "A pagar" em vez de `Rascunho` e `AguardandoPagamento`: é o vocabulário que a
 * comissão vê no produto, e quem atende precisa falar a mesma língua de quem ligou.
 */
const TURMA = {
  Rascunho: { rotulo: 'A contratar', tom: 'cinza' },
  AguardandoPagamento: { rotulo: 'A pagar', tom: 'alerta' },
  Ativa: { rotulo: 'Ativa', tom: 'sucesso' },
  Suspensa: { rotulo: 'Suspensa', tom: 'perigo' },
  Encerrada: { rotulo: 'Encerrada', tom: 'neutro' },
  Descartada: { rotulo: 'Descartada', tom: 'neutro' },
} as const

type Mapa = typeof TURMA | typeof APARENCIA_DA_ASSINATURA

/** O status como o produto o chama, ou o valor cru se o backend mandar um que a tela não conhece. */
function ler(mapa: Mapa, status: string) {
  return (mapa as Record<string, { rotulo: string; tom: TomDoSelo }>)[status]
}

/** O status da formatura, no vocabulário do produto. */
export function SeloDaTurma({ status }: { status: string }) {
  const item = ler(TURMA, status)

  return <Selo tom={item?.tom ?? 'neutro'}>{item?.rotulo ?? status}</Selo>
}

/** O status da assinatura — o mesmo nome e a mesma cor da tela da assinatura. */
export function SeloDaAssinatura({ status }: { status: string }) {
  const item = ler(APARENCIA_DA_ASSINATURA, status)

  return <Selo tom={item?.tom ?? 'neutro'}>{item?.rotulo ?? status}</Selo>
}
