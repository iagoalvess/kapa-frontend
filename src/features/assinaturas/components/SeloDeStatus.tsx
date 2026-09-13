import { Selo } from '@/components/Selo'
import type { StatusDaAssinatura } from '../types/assinaturas.types'

const APARENCIA = {
  Pendente: { tom: 'alerta', texto: 'Aguardando pagamento' },
  Ativa: { tom: 'sucesso', texto: 'Ativa' },
  Vencida: { tom: 'perigo', texto: 'Vencida' },
  Cancelada: { tom: 'neutro', texto: 'Renovação cancelada' },
} as const satisfies Record<StatusDaAssinatura, { tom: string; texto: string }>

/** Situação da assinatura, com a cor da família certa. O valor da API vem sem acento e sem espaço. */
export function SeloDeStatus({ status }: { status: StatusDaAssinatura }) {
  return <Selo tom={APARENCIA[status].tom}>{APARENCIA[status].texto}</Selo>
}
