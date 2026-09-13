import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { createMemoryRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { PAPEIS, PERFIS } from '@/config/perfis'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import DetalheDoFormandoPage from './DetalheDoFormandoPage'

const BRUNO = `${env.VITE_API_URL}/api/v1/formandos/u-2`

const perfil = {
  usuarioId: 'u-2',
  nome: 'Bruno',
  email: 'bruno@exemplo.com',
  papel: 'Formando',
  pessoais: { nomeCompleto: 'Bruno Lima' },
  endereco: {},
  contatoDeEmergencia: {},
  completude: 10,
  faltando: ['cpf', 'telefone'],
  essencialPendente: true,
}

function entrarComo(papel: string) {
  const corpo = { sub: 'u-1', name: 'Ana', role: [PERFIS.usuario], formatura_id: 'f-1', papel }
  sessao.autenticar({
    accessToken: `c.${btoa(JSON.stringify(corpo))}.a`,
    expiraEm: new Date(Date.now() + 900_000).toISOString(),
  })
}

/** A página lê o id da rota: precisa do caminho com parâmetro, não do `*` de `renderizar`. */
function renderizarDetalhe() {
  const cliente = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const router = createMemoryRouter(
    [
      { path: '/formatura/formandos/:usuarioId', element: <DetalheDoFormandoPage /> },
      { path: '/formatura/formandos', element: <p>Lista</p> },
    ],
    { initialEntries: ['/formatura/formandos/u-2'] },
  )

  return render(
    <QueryClientProvider client={cliente}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}

describe('DetalheDoFormandoPage', () => {
  beforeEach(() => {
    servidor.use(
      http.get(`${env.VITE_API_URL}/api/v1/formaturas/atual`, () =>
        HttpResponse.json({ id: 'f-1', status: 'Ativa' }),
      ),
      http.get(BRUNO, () => HttpResponse.json(perfil)),
    )
  })

  afterEach(() => sessao.encerrar())

  it('Comissão lê o cadastro com os campos travados e sem botão de salvar', async () => {
    entrarComo(PAPEIS.comissao)

    renderizarDetalhe()

    expect(await screen.findByLabelText('Nome completo')).toHaveValue('Bruno Lima')
    expect(screen.getByLabelText('Nome completo')).toBeDisabled()
    expect(screen.queryByRole('button', { name: /^Salvar/ })).not.toBeInTheDocument()
    expect(screen.getByText(/Falta o essencial para emitir cobrança/)).toBeInTheDocument()
  })

  /** O arquivo é do formando: a comissão busca pela rota dele, não pelo módulo de arquivos. */
  it('Comissão vê a foto do formando, baixada pela rota do formando', async () => {
    servidor.use(
      http.get(BRUNO, () => HttpResponse.json({ ...perfil, fotoArquivoId: 'a-1' })),
      http.get(`${BRUNO}/foto`, () =>
        HttpResponse.arrayBuffer(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]).buffer, {
          headers: { 'Content-Type': 'image/jpeg' },
        }),
      ),
    )
    entrarComo(PAPEIS.comissao)

    renderizarDetalhe()

    expect(await screen.findByRole('img', { name: 'Foto de Bruno Lima' })).toHaveAttribute(
      'src',
      'data:image/jpeg;base64,/9j/4A==',
    )
    expect(screen.queryByText('Sem foto')).not.toBeInTheDocument()
  })

  it('Presidente corrige pela rota do formando, não pela própria', async () => {
    let enviado: unknown
    servidor.use(
      http.put(BRUNO, async ({ request }) => {
        enviado = await request.json()
        return HttpResponse.json(perfil)
      }),
    )
    entrarComo(PAPEIS.presidente)

    renderizarDetalhe()
    const pessoais = await screen.findByRole('form', { name: 'Dados pessoais' })
    await userEvent.type(within(pessoais).getByLabelText('RG'), '12.345.678-9')
    await userEvent.click(within(pessoais).getByRole('button', { name: 'Salvar dados pessoais' }))

    await waitFor(() => expect(enviado).toMatchObject({ pessoais: { rg: '12.345.678-9' } }))
    expect(screen.getByText('Correções feitas aqui ficam registradas com o seu nome.')).toBeInTheDocument()
  })
})
