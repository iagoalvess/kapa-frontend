import { api } from '@/lib/http/cliente'

const PRIVACIDADE = '/api/v1/privacidade'

/** Descadastro pelo token do e-mail, sem login. */
export function descadastrar(token: string) {
  return api.post<void>(`${PRIVACIDADE}/descadastro`, {
    query: { token },
    autenticar: false,
  })
}
