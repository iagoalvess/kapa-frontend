import { Selo } from '@/components/Selo'
import { APARENCIA_DA_ASSINATURA } from '@/types/assinatura'
import type { StatusDaAssinatura } from '../types/assinaturas.types'

/** Situação da assinatura, com a cor da família certa. O valor da API vem sem acento e sem espaço. */
export function SeloDeStatus({ status }: { status: StatusDaAssinatura }) {
  const { tom, rotulo } = APARENCIA_DA_ASSINATURA[status]

  return <Selo tom={tom}>{rotulo}</Selo>
}
