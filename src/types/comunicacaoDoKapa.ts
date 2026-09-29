/** De onde veio a mudança da preferência de marketing. */
export type OrigemDaComunicacaoDoKapa = 'cadastro' | 'descadastro_pelo_email' | 'minha_privacidade'

/** Uma mudança de "Receber novidades do Kapa". Espelha `RegistroDaComunicacaoDoKapaDTO`. */
export interface RegistroDaComunicacaoDoKapa {
  aceito: boolean
  origem: OrigemDaComunicacaoDoKapa
  versao_do_texto: string
  registrado_em: string
}

/** Um e-mail de marketing já mandado. Espelha `EnvioDoKapaDTO`. */
export interface EnvioDoKapa {
  jornada: string
  formatura: string
  enviado_em: string
}

/**
 * "Receber novidades do Kapa": a preferência, o histórico e os envios (Sprint 40). Espelha
 * `ComunicacaoDoKapaDTO` — "Minha privacidade" e o painel de suporte leem o mesmo objeto.
 */
export interface ComunicacaoDoKapa {
  receber: boolean
  historico: RegistroDaComunicacaoDoKapa[]
  envios: EnvioDoKapa[]
}

/** Como cada jornada aparece na tela. */
export const ROTULOS_DAS_JORNADAS: Record<string, string> = {
  criou_e_nao_voltou: 'Criou e não voltou',
  montou_e_parou: 'Montou e parou',
}
