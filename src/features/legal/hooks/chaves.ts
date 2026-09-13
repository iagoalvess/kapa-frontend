export const chaves = {
  tudo: ['legal'] as const,
  versao: (tipo: string, versao: string) => ['legal', 'versao', tipo, versao] as const,
  // Com o id do usuário: a mesma aba pode trocar de conta, e a pendência é de quem está logado.
  meusAceites: (usuarioId: string) => ['legal', 'meus-aceites', usuarioId] as const,
}
