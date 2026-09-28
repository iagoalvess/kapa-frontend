import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/http/cliente'

/**
 * Reenvio do e-mail de confirmação da conta. A API responde 204 exista a conta ou não.
 *
 * Mora em `hooks/`, e não em `features/auth`, porque o convite pessoal (feature `convites`) também
 * oferece o reenvio — só aceita conta confirmada — e uma feature não importa de outra. A chamada
 * fica aqui junto do hook pelo mesmo motivo: é a única dele.
 */
export function useReenviarConfirmacao() {
  return useMutation({
    mutationFn: (email: string) =>
      api.post<void>('/api/v1/conta/reenviar-confirmacao', { body: { email }, autenticar: false }),
  })
}
