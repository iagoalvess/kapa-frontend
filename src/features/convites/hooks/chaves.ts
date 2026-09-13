// A formatura não entra na chave da gestão: trocar de formatura limpa o cache inteiro.
export const chaves = {
  tudo: ['convites'] as const,
  lista: () => ['convites', 'lista'] as const,
  publico: (token: string) => ['convites', 'publico', token] as const,
}
