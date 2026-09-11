/** Identidade extraída do access token. */
export interface UsuarioAutenticado {
  id: string
  nome: string
  email: string
  perfis: string[]
  /** Formatura selecionada na sessão. `null` enquanto o usuário não escolheu uma. */
  formaturaId: string | null
  /** Papel do usuário na formatura selecionada. `null` sem formatura. */
  papel: string | null
}

interface CorpoDoToken {
  sub?: string
  name?: string
  email?: string
  role?: string | string[]
  formatura_id?: string
  papel?: string
}

/**
 * Lê as claims do access token emitido pela API.
 *
 * O token é a mesma fonte que o backend usa para autorizar, então a tela mostra exatamente o
 * que a API vai aceitar. Isso **não** é controle de acesso: assinatura não é conferida aqui, e
 * esconder um botão não protege um endpoint. Quem decide é sempre a API.
 *
 * @param token Access token no formato JWT.
 * @returns A identidade, ou `null` se o token não for legível.
 */
export function lerAccessToken(token: string): UsuarioAutenticado | null {
  const corpo = token.split('.')[1]
  if (!corpo) return null

  try {
    const json = new TextDecoder().decode(
      Uint8Array.from(
        atob(corpo.replaceAll('-', '+').replaceAll('_', '/')),
        (caractere) => caractere.codePointAt(0) ?? 0,
      ),
    )
    const claims = JSON.parse(json) as CorpoDoToken
    const papeis = claims.role ?? []

    return {
      id: claims.sub ?? '',
      nome: claims.name ?? '',
      email: claims.email ?? '',
      perfis: Array.isArray(papeis) ? papeis : [papeis],
      formaturaId: claims.formatura_id ?? null,
      papel: claims.papel ?? null,
    }
  } catch {
    return null
  }
}
