export const chaves = {
  busca: (termo: string) => ['suporte', 'busca', termo] as const,
  turma: (id: string) => ['suporte', 'turma', id] as const,
  conta: (id: string) => ['suporte', 'conta', id] as const,
}
