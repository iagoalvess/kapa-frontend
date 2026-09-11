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
