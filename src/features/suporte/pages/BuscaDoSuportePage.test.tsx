import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import BuscaDoSuportePage from './BuscaDoSuportePage'

const BUSCA = `${env.VITE_API_URL}/api/v1/admin/suporte/busca`

const RESULTADO = {
  turmas: [
    {
      id: 'f-1',
      nome: 'Medicina 2027',
      instituicao: 'UFPR',
      curso: 'Medicina',
      status: 'Ativa',
      membros: 82,
    },
    {
      id: 'f-2',
      nome: 'Medicina Veterinária 2028',
      instituicao: 'UFPR',
      curso: 'Medicina Veterinária',
      status: 'Rascunho',
      membros: 3,
    },
  ],
  usuarios: [
    { id: 'u-1', nome: 'Ana Souza', email: 'ana@exemplo.com', ativo: true, turmas: 1 },
    { id: 'u-2', nome: 'Bruno Lima', email: 'bruno@exemplo.com', ativo: false, turmas: 0 },
  ],
}

/** Registra a busca e devolve os termos que chegaram ao servidor. */
function interceptarBusca(resposta: typeof RESULTADO = RESULTADO) {
  const termos: (string | null)[] = []

  servidor.use(
    http.get(BUSCA, ({ request }) => {
      termos.push(new URL(request.url).searchParams.get('termo'))
      return HttpResponse.json(resposta)
    }),
  )

  return termos
}

describe('BuscaDoSuportePage', () => {
  /**
   * O piso de três letras é do backend, e a tela o repete: sem ele, cada tecla mandaria uma
   * consulta que varreria as duas maiores tabelas do banco para voltar vazia.
   */
  it('não consulta a API com menos de três letras', async () => {
    // Arrange
    const termos = interceptarBusca()
    const usuario = userEvent.setup()
    renderizar(<BuscaDoSuportePage />)

    // Act
    await usuario.type(screen.getByLabelText('Turma, pessoa ou e-mail'), 'ab{Enter}')

    // Assert
    expect(await screen.findByText('Comece digitando')).toBeInTheDocument()
    expect(termos).toHaveLength(0)
  })

  it('lista turmas e contas do mesmo termo', async () => {
    interceptarBusca()
    const usuario = userEvent.setup()
    renderizar(<BuscaDoSuportePage />)

    await usuario.type(screen.getByLabelText('Turma, pessoa ou e-mail'), 'medicina{Enter}')

    expect(await screen.findByText('Medicina 2027')).toBeInTheDocument()
    expect(screen.getByText('ana@exemplo.com')).toBeInTheDocument()
    // Cada resultado é um link para a tela dele — é assim que se chega às ações.
    expect(screen.getByRole('link', { name: /Medicina 2027/ })).toHaveAttribute(
      'href',
      '/suporte/formaturas/f-1',
    )
    expect(screen.getByRole('link', { name: /Ana Souza/ })).toHaveAttribute('href', '/suporte/usuarios/u-1')
  })

  /** "Rascunho" não é palavra do produto: a comissão lê "A contratar", e o suporte também. */
  it('mostra o status no vocabulário do produto', async () => {
    interceptarBusca()
    const usuario = userEvent.setup()
    renderizar(<BuscaDoSuportePage />)

    await usuario.type(screen.getByLabelText('Turma, pessoa ou e-mail'), 'medicina{Enter}')

    expect(await screen.findByText('A contratar')).toBeInTheDocument()
    expect(screen.queryByText('Rascunho')).not.toBeInTheDocument()
  })

  it('avisa quando o termo não acha nada', async () => {
    interceptarBusca({ turmas: [], usuarios: [] })
    const usuario = userEvent.setup()
    renderizar(<BuscaDoSuportePage />)

    await usuario.type(screen.getByLabelText('Turma, pessoa ou e-mail'), 'zzzzz{Enter}')

    expect(await screen.findByText('Nada com esse termo')).toBeInTheDocument()
  })

  /** O termo vive na URL: o atendente cola o link da busca no chamado. */
  it('lê o termo que já está na URL', async () => {
    const termos = interceptarBusca()
    renderizar(<BuscaDoSuportePage />, '/suporte?termo=medicina')

    expect(await screen.findByText('Medicina 2027')).toBeInTheDocument()
    expect(termos).toEqual(['medicina'])
  })
})
