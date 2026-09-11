/**
 * Perfis de acesso criados pelo backend. Espelha `PerfisPadrao`.
 *
 * São constantes porque viram comparação de string na guarda de rota, onde erro de digitação
 * não quebra o build — some o menu e ninguém entende por quê.
 */
export const PERFIS = {
  administrador: 'Administrador',
  usuario: 'Usuario',
} as const

export type Perfil = (typeof PERFIS)[keyof typeof PERFIS]

/**
 * Papéis dentro de uma formatura. Espelha `PapelNaFormatura` do backend.
 *
 * Não são perfis do Identity: perfil é o nível plataforma (administrador, usuário), papel é por
 * turma — a mesma pessoa pode ser tesoureira de uma e formanda de outra.
 */
export const PAPEIS = {
  presidente: 'Presidente',
  tesoureiro: 'Tesoureiro',
  comissao: 'Comissao',
  formando: 'Formando',
} as const

export type Papel = (typeof PAPEIS)[keyof typeof PAPEIS]

/** Como cada papel aparece na tela. O valor de `PAPEIS` é contrato da API e vem sem acento. */
export const ROTULOS_DE_PAPEL: Record<Papel, string> = {
  Presidente: 'Presidente',
  Tesoureiro: 'Tesoureiro',
  Comissao: 'Comissão',
  Formando: 'Formando',
}
