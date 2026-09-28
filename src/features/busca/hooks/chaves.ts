export const chaves = {
  tudo: ['busca'] as const,
  termo: (termo: string) => ['busca', termo] as const,
}
