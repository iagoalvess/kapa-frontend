// A formatura não entra na chave: trocar de formatura limpa o cache inteiro.
export const chaves = {
  tudo: ['recebimentos'] as const,
  conta: () => ['recebimentos', 'conta'] as const,
  pixDeTeste: () => ['recebimentos', 'pix-de-teste'] as const,
}
