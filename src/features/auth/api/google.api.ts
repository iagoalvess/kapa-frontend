import { z } from 'zod'
import { api } from '@/lib/http/cliente'
import { convitePendente } from '@/lib/convitePendente'
import { ehErroDaApi } from '@/lib/http/erros'
import type { ParDeTokens } from '@/lib/http/sessao'
import type { AceiteDeDocumento } from '@/types/legal'

const BASE = '/api/v1/auth/google'
const esquemaDeContexto = z.object({
  contexto: z.string(),
  nome: z.string(),
  email: z.email(),
  exige_recuperacao: z.boolean(),
})
export type ContextoGoogle = z.infer<typeof esquemaDeContexto>
export type EntradaGoogle =
  | ParDeTokens
  | { codigo: 'auth.cadastro_necessario' | 'auth.google_vinculo_necessario'; dados: ContextoGoogle }

/** Configuração efetiva da API evita oferecer um provedor desligado ou divergente. */
export const configuracaoGoogle = (signal?: AbortSignal) =>
  api.get<{ client_id: string | null }>(`${BASE}/configuracao`, { autenticar: false, signal })
/** Tentativa e nonce ficam apenas na memória; a API vincula ao cookie HttpOnly. */
export const iniciarGoogle = (signal?: AbortSignal, convite?: string) =>
  api.post<{ tentativa: string; nonce: string }>(`${BASE}/iniciar`, {
    body: { convite: convite ?? convitePendente.ler() },
    autenticar: false,
    signal,
  })
/** Os conflitos de cadastro/vínculo são próximos passos, sem publicar sessão antecipadamente. */
export async function entrarGoogle(dados: { tentativa: string; credencial: string }): Promise<EntradaGoogle> {
  try {
    return await api.post<ParDeTokens>(BASE, { body: dados, autenticar: false })
  } catch (erro) {
    if (
      ehErroDaApi(erro) &&
      (erro.codigo === 'auth.cadastro_necessario' || erro.codigo === 'auth.google_vinculo_necessario')
    ) {
      const validado = esquemaDeContexto.safeParse(erro.dados)
      if (validado.success) return { codigo: erro.codigo, dados: validado.data }
    }
    throw erro
  }
}
export const cadastrarGoogle = (dados: {
  contexto: string
  nome: string
  aceites: AceiteDeDocumento[]
  receber_comunicacao_do_kapa: boolean
}) => api.post<ParDeTokens>(`${BASE}/cadastro`, { body: dados, autenticar: false })
export const solicitarVinculoGoogle = (contexto: string) =>
  api.post<void>(`${BASE}/vinculo/solicitar`, { body: { contexto }, autenticar: false })
export const vincularGoogle = (comprovante: string) =>
  api.post<ParDeTokens>(`${BASE}/vinculo`, { body: { contexto: null, comprovante }, autenticar: false })
