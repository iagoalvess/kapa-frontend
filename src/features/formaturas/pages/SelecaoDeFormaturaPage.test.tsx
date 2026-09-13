import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import SelecaoDeFormaturaPage from './SelecaoDeFormaturaPage'

const MINHAS = `${env.VITE_API_URL}/api/v1/formaturas/minhas`

describe('SelecaoDeFormaturaPage', () => {
  /**
   * Lista vazia não é "nenhum resultado": é o começo do produto. Quem chega aqui ou vai criar a
   * turma ou vai esperar um convite, e a tela precisa dizer qual dos dois — mostrar "escolha a
   * formatura" sobre uma lista vazia manda o presidente da comissão procurar o que não existe.
   */
  it('mostra o onboarding quando o usuário não tem nenhuma formatura', async () => {
    servidor.use(http.get(MINHAS, () => HttpResponse.json([])))

    renderizar(<SelecaoDeFormaturaPage />)

    expect(await screen.findByText(/não está em uma formatura/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /sou da comissão/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /sou formando/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Criar uma formatura' })).toHaveAttribute(
      'href',
      '/formaturas/nova',
    )
    expect(screen.getByRole('textbox', { name: 'Código do convite' })).toBeInTheDocument()
    expect(screen.queryByText('Escolha a formatura')).not.toBeInTheDocument()
  })

  it('lista as formaturas quando há mais de uma', async () => {
    servidor.use(
      http.get(MINHAS, () =>
        HttpResponse.json([
          {
            id: 'f-1',
            nome: 'Engenharia 2026',
            curso: 'Engenharia',
            instituicao: 'UFPR',
            ano: 2026,
            papel: 'Presidente',
          },
          {
            id: 'f-2',
            nome: 'Medicina 2027',
            curso: 'Medicina',
            instituicao: 'UFSC',
            ano: 2027,
            papel: 'Formando',
          },
        ]),
      ),
    )

    renderizar(<SelecaoDeFormaturaPage />)

    // Curso, instituição e ano junto do nome: turmas homônimas precisam ser distinguíveis.
    expect(
      await screen.findByRole('button', { name: /Engenharia 2026.*Engenharia · UFPR · 2026/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Medicina 2027/ })).toBeInTheDocument()
    expect(screen.queryByText(/não está em uma formatura/i)).not.toBeInTheDocument()
  })
})
