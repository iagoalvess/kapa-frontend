import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { queryClient } from '@/lib/query/client'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import { SeletorDeFormatura } from './SeletorDeFormatura'

const MINHAS = `${env.VITE_API_URL}/api/v1/formaturas/minhas`

function tokenCom(formaturaId: string): string {
  const corpo = { sub: 'u-1', name: 'Teste', email: 'teste@exemplo.com', formatura_id: formaturaId }
  const base64 = btoa(JSON.stringify(corpo)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')

  return `cabecalho.${base64}.assinatura`
}

function entrarNa(formaturaId: string) {
  sessao.autenticar({
    accessToken: tokenCom(formaturaId),
    expiraEm: new Date(Date.now() + 900_000).toISOString(),
  })
}

function duasFormaturas() {
  servidor.use(
    http.get(MINHAS, () =>
      HttpResponse.json([
        { id: 'f-1', nome: 'Engenharia 2026', papel: 'Presidente' },
        { id: 'f-2', nome: 'Medicina 2027', papel: 'Formando' },
      ]),
    ),
  )
}

afterEach(() => {
  sessao.encerrar()
  vi.restoreAllMocks()
})

describe('SeletorDeFormatura', () => {
  /**
   * O critério da sprint: sem a limpeza, a tela seguinte mostra por alguns segundos os dados em
   * cache da turma anterior — o mesmo vazamento que o isolamento fecha no backend, só que do
   * lado do cliente.
   */
  it('troca a sessão e limpa o cache do React Query', async () => {
    entrarNa('f-1')
    duasFormaturas()
    servidor.use(
      http.post(`${env.VITE_API_URL}/api/v1/formaturas/f-2/selecionar`, () =>
        HttpResponse.json({
          accessToken: tokenCom('f-2'),
          expiraEm: new Date(Date.now() + 900_000).toISOString(),
        }),
      ),
    )

    const limpar = vi.spyOn(queryClient, 'clear')

    renderizar(<SeletorDeFormatura />)

    const seletor = await screen.findByLabelText('Formatura selecionada')
    await userEvent.selectOptions(seletor, 'f-2')

    await waitFor(() => {
      expect(limpar).toHaveBeenCalled()
    })
    expect(sessao.estado().usuario?.formaturaId).toBe('f-2')
  })

  /** Um seletor de uma opção só é ruído no cabeçalho. */
  it('some quando o usuário só tem uma formatura', async () => {
    entrarNa('f-1')
    servidor.use(
      http.get(MINHAS, () =>
        HttpResponse.json([{ id: 'f-1', nome: 'Engenharia 2026', papel: 'Presidente' }]),
      ),
    )

    renderizar(<SeletorDeFormatura />)

    await waitFor(() => {
      expect(screen.queryByLabelText('Formatura selecionada')).not.toBeInTheDocument()
    })
  })
})
