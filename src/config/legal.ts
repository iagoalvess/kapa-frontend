import { ROTAS } from './rotas'

/**
 * Documentos legais da plataforma. Espelha `TipoDeDocumento` do backend.
 *
 * O cadastro exige um aceite por tipo, então a lista é fechada: um documento novo entra aqui e no
 * backend no mesmo pull request.
 */
export const TIPOS_DE_DOCUMENTO = {
  termosDeUso: 'TermosDeUso',
  politicaDePrivacidade: 'PoliticaDePrivacidade',
} as const

export type TipoDeDocumento = (typeof TIPOS_DE_DOCUMENTO)[keyof typeof TIPOS_DE_DOCUMENTO]

/** Como cada documento aparece na tela e onde ele abre. */
export const DOCUMENTOS: Record<TipoDeDocumento, { rotulo: string; artigo: string; rota: string }> = {
  TermosDeUso: { rotulo: 'Termos de Uso', artigo: 'os', rota: ROTAS.termosDeUso },
  PoliticaDePrivacidade: { rotulo: 'Política de Privacidade', artigo: 'a', rota: ROTAS.privacidade },
}
