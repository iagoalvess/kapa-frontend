import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { HttpResponse, http } from 'msw'
import { createMemoryRouter, useLocation } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS } from '@/config/perfis'
import { ROTAS } from '@/config/rotas'
import type { SituacaoDaMinhaAdesao } from '@/features/adesoes/types/adesoes.types'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo } from '@/test/utils'
import { ExigeAdesao } from './ExigeAdesao'

const SITUACAO = `${env.VITE_API_URL}/api/v1/adesoes/eu/situacao`

const semAdesao: SituacaoDaMinhaAdesao = { termo_publicado: true, plano_vigente: true, aderiu: false }

/** O termo mostra para onde devolveria a pessoa depois do aceite. */
function Termo() {
  const { state } = useLocation() as { state: { de?: string } | null }
  return <p>meu termo, voltar para {state?.de ?? 'nenhum lugar'}</p>
}

/** Responde a situação do formando e conta as consultas — comissão não pode disparar nenhuma. */
function responder(situacao: SituacaoDaMinhaAdesao) {
  const pedidos = { situacao: 0 }
  servidor.use(
    http.get(SITUACAO, () => {
      pedidos.situacao += 1
      return HttpResponse.json(situacao)
    }),
  )
  return pedidos
}

/** A guarda à frente das rotas de domínio, como em `router.tsx`, partindo de `rota`. */
function renderizarGuarda(rota: string) {
  const cliente = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter(
    [
      {
        element: <ExigeAdesao />,
        children: [
          { path: ROTAS.agenda, element: <p>agenda da turma</p> },
          { path: ROTAS.adesao, element: <Termo /> },
          { path: ROTAS.meuCadastro, element: <p>meu cadastro</p> },
          { path: ROTAS.extrato, element: <p>meu extrato</p> },
          { path: `${ROTAS.recibos}/:id`, element: <p>um recibo</p> },
        ],
      },
    ],
    { initialEntries: [rota] },
  )
  render(
    <QueryClientProvider client={cliente}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('ExigeAdesao', () => {
  afterEach(() => sessao.encerrar())

  it('leva ao termo o formando sem adesão que tenta uma rota de domínio, guardando o destino', async () => {
    responder(semAdesao)
    entrarComo(PAPEIS.formando)

    renderizarGuarda(`${ROTAS.agenda}?mes=3`)

    expect(await screen.findByText(`meu termo, voltar para ${ROTAS.agenda}?mes=3`)).toBeInTheDocument()
    expect(screen.queryByText('agenda da turma')).not.toBeInTheDocument()
  })

  it('deixa passar o formando que já aderiu, com uma consulta só e sem baixar o termo', async () => {
    const pedidos = responder({ ...semAdesao, aderiu: true })
    entrarComo(PAPEIS.formando)

    renderizarGuarda(ROTAS.agenda)

    expect(await screen.findByText('agenda da turma')).toBeInTheDocument()
    expect(pedidos.situacao).toBe(1)
  })

  it.each([
    ['o termo', ROTAS.adesao, 'meu termo, voltar para nenhum lugar'],
    ['o cadastro', ROTAS.meuCadastro, 'meu cadastro'],
    ['o extrato', ROTAS.extrato, 'meu extrato'],
    ['o recibo', `${ROTAS.recibos}/r-1`, 'um recibo'],
  ])('sem adesão, %s continua liberado', async (_nome, rota, texto) => {
    responder(semAdesao)
    entrarComo(PAPEIS.formando)

    renderizarGuarda(rota)

    expect(await screen.findByText(texto)).toBeInTheDocument()
  })

  it('sem termo publicado, o formando sem adesão não é barrado', async () => {
    responder({ termo_publicado: false, plano_vigente: false, aderiu: false })
    entrarComo(PAPEIS.formando)

    renderizarGuarda(ROTAS.agenda)

    expect(await screen.findByText('agenda da turma')).toBeInTheDocument()
  })

  it.each([PAPEIS.comissao, PAPEIS.presidente])('%s não é barrado nem consulta a adesão', async (papel) => {
    const pedidos = responder(semAdesao)
    entrarComo(papel)

    renderizarGuarda(ROTAS.agenda)

    expect(await screen.findByText('agenda da turma')).toBeInTheDocument()
    expect(pedidos.situacao).toBe(0)
  })
})
