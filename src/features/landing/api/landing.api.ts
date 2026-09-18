import { api } from '@/lib/http/cliente'
import type { NovoLead } from '../types/landing.types'

/** Registra um contato. Responde 204 também quando o envio é descartado pelo honeypot. */
export function enviarLead(dados: NovoLead) {
  return api.post<void>('/api/v1/leads', { body: dados, autenticar: false })
}
