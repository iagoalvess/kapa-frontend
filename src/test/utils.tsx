import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { createMemoryRouter, type InitialEntry } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { PERFIS } from '@/config/perfis'
import { MODULOS } from '@/config/planos'
import { CHAVE_DA_FORMATURA_ATUAL } from '@/hooks/useFormaturaAtual'
import { formatarCentavos } from '@/lib/formato'
import { sessao } from '@/lib/http/sessao'
import type { PlanoDaTurma } from '@/types/plano'

/**
 * O plano com que toda turma de teste nasce: pago, com todos os módulos.
 *
 * Como a fábrica do backend, que cria a turma contratada no maior plano: sem isto, toda tela que
 * pergunta ao plano (o menu, as áreas do Premium, as consultas da festa) pediria
 * `/formaturas/atual/plano` e o MSW derrubaria o teste — por um motivo que não é o que ele testa.
 * Quem testa o gratuito passa o plano dele a {@link renderizar}.
 */
export const PLANO_COMPLETO: PlanoDaTurma = {
  codigo: 'premium',
  nome: 'Premium',
  modulos: Object.values(MODULOS),
  pago: true,
}

/** A turma no gratuito: os módulos do Essencial sem a festa, e nada pago. */
export const PLANO_GRATUITO: PlanoDaTurma = {
  codigo: 'gratuito',
  nome: 'Gratuito',
  modulos: [MODULOS.membros, MODULOS.termo, MODULOS.cobrancas, MODULOS.pix, MODULOS.despesas, MODULOS.caixa],
  pago: false,
}

/**
 * Renderiza um componente com roteador e cache próprios.
 *
 * Cada teste ganha um `QueryClient` novo — cache compartilhado faz um teste passar por causa do
 * anterior, e o conjunto quebra assim que alguém roda em outra ordem.
 *
 * @param elemento Componente sob teste.
 * @param rota Caminho inicial do roteador — ou `{ pathname, search, state }` quando a tela lê a
 * query string ou o recado deixado pela tela anterior.
 * @param caminho Padrão da rota, para a tela que lê parâmetro (`/extrato/parcelas/:id/pagar`).
 * @param plano O plano da turma da sessão, já no cache e sem recarga — {@link PLANO_COMPLETO} por padrão.
 *   Nulo não semeia: o teste declara `/formaturas/atual/plano` no MSW.
 * @returns O resultado do `render`, com o `router` junto — é nele que se lê para onde a tela foi.
 */
export function renderizar(
  elemento: ReactElement,
  rota: InitialEntry = '/',
  caminho = '*',
  plano: PlanoDaTurma | null = PLANO_COMPLETO,
) {
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })

  const formaturaId = sessao.estado().usuario?.formaturaId
  if (plano && formaturaId) {
    const chave = [...CHAVE_DA_FORMATURA_ATUAL, formaturaId, 'plano']
    cliente.setQueryDefaults(chave, { staleTime: Infinity })
    cliente.setQueryData(chave, plano)
  }

  const router = createMemoryRouter([{ path: caminho, element: elemento }], {
    initialEntries: [rota],
  })

  return {
    ...render(
      <QueryClientProvider client={cliente}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
    router,
  }
}

/**
 * Entra com um papel na formatura `f-1`, como o token da API diria — é o que `usePapel` lê.
 *
 * Encerre no `afterEach` com `sessao.encerrar()`: sessão que sobra vaza para o teste seguinte.
 *
 * @param papel `Presidente`, `Tesoureiro`, `Comissao` ou `Formando`.
 */
export function entrarComo(papel: string) {
  const corpo = {
    sub: 'u-9',
    name: 'Pedro',
    email: 'pedro@kapa.dev',
    role: [PERFIS.usuario],
    formatura_id: 'f-1',
    papel,
  }
  sessao.autenticar({
    access_token: `c.${btoa(JSON.stringify(corpo))}.a`,
    expira_em: new Date(Date.now() + 900_000).toISOString(),
  })
}

/**
 * Uma página da API com os itens dados — a resposta de toda listagem paginada.
 *
 * @param itens Os itens da página; o total sai deles.
 * @param tamanho O `TAMANHO_DA_PAGINA` da tela sob teste.
 */
export function pagina(itens: unknown[], tamanho = 20) {
  return { itens, pagina: 1, tamanho, total: itens.length, total_paginas: 1, tem_proxima: false }
}

/**
 * Centavos como a tela escreve.
 *
 * O `Intl` separa `R$` do número com espaço estreito insecável (U+00A0/U+202F); o jsdom devolve o
 * mesmo caractere no `textContent`, mas o literal digitado no teste traz um espaço comum e a busca
 * por texto não acha. Formatar e normalizar aqui deixa `expect(reais(34990))` falar.
 */
export function reais(centavos: number) {
  return formatarCentavos(centavos).replace(/\s/g, ' ')
}
