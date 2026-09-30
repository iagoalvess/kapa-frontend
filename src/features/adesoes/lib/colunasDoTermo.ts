/**
 * As duas colunas das telas do termo: à esquerda o resumo do Kapinha e, logo abaixo, o texto largo
 * (com o aceite no fim, antes de assinar); à direita o dinheiro (e o registro do aceite, depois).
 *
 * Cada coluna empilha sozinha: cartão que às vezes não aparece (o resumo, as versões) não deixa
 * buraco, como deixava na grade de linhas contadas. O termo fica na primeira linha da coluna 1 — no
 * celular, depois da lateral.
 */
export const COLUNAS = 'grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]'
export const LATERAL = 'grid gap-5 lg:col-start-2'
export const TERMO = 'grid min-w-0 gap-5 lg:col-start-1 lg:row-start-1'
