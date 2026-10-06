export const chaves = {
  tudo: ['formaturas'] as const,
  minhas: () => ['formaturas', 'minhas'] as const,
  primeirosPassos: () => ['formaturas', 'primeiros-passos'] as const,
}
