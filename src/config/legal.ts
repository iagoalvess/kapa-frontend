import { ROTAS, urlDoSite } from './rotas'

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

/**
 * A caixa opcional do cadastro e de "Minha privacidade" (Sprint 40). Espelha
 * `TextoDoConsentimentoDeMarketing.Texto` do backend: mudou a frase, suba a versão lá — o registro prova
 * qual texto a pessoa viu.
 */
export const TEXTO_DO_CONSENTIMENTO_DE_MARKETING = 'Quero receber dicas e novidades do Kapa por e-mail.'

export type TipoDeDocumento = (typeof TIPOS_DE_DOCUMENTO)[keyof typeof TIPOS_DE_DOCUMENTO]

/** Como cada documento aparece na tela e onde ele abre — no site, em endereço absoluto (Sprint 33). */
export const DOCUMENTOS: Record<TipoDeDocumento, { rotulo: string; artigo: string; rota: string }> = {
  TermosDeUso: { rotulo: 'Termos de Uso', artigo: 'os', rota: urlDoSite(ROTAS.termosDeUso) },
  PoliticaDePrivacidade: {
    rotulo: 'Política de Privacidade',
    artigo: 'a',
    rota: urlDoSite(ROTAS.privacidade),
  },
}
