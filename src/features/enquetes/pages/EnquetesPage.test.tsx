import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HttpResponse, http } from 'msw'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { entrarComo, renderizar } from '@/test/utils'
import { detalheDeTeste } from '../dadosDeTeste'
import EnquetesPage from './EnquetesPage'

const API = `${env.VITE_API_URL}/api/v1`

describe('EnquetesPage', () => {
  beforeEach(() => {
    entrarComo('Formando')
    servidor.use(
      http.get(`${API}/formaturas/atual`, () =>
        HttpResponse.json({ id: 'f-1', nome: 'Medicina 2027', status: 'Ativa' }),
      ),
    )
  })
  afterEach(() => sessao.encerrar())

  it('mostra placar antes do voto e permite enviar, mudar e retirar a própria resposta', async () => {
    const detalhe = detalheDeTeste()
    const envios: unknown[] = []
    servidor.use(
      http.get(`${API}/enquetes`, () => HttpResponse.json([detalhe.enquete])),
      http.get(`${API}/enquetes/e-1`, () => HttpResponse.json(detalhe)),
      http.put(`${API}/enquetes/e-1/resposta`, async ({ request }) => {
        const corpo = (await request.json()) as { opcoes: string[] }
        envios.push(corpo)
        detalhe.enquete.minha_resposta = corpo.opcoes
        return new HttpResponse(null, { status: 204 })
      }),
      http.delete(`${API}/enquetes/e-1/resposta`, () => {
        detalhe.enquete.minha_resposta = null
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderizar(<EnquetesPage />, '/enquetes/e-1', '/enquetes/:id')
    expect(await screen.findByRole('heading', { name: 'Resultado ao vivo' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Nova enquete' })).not.toBeInTheDocument()
    const usuario = userEvent.setup()
    await usuario.click(screen.getByText('Clássico').closest('label')!)
    expect(screen.getByRole('radio', { name: 'Clássico' })).toBeChecked()
    await usuario.click(screen.getByRole('button', { name: 'Enviar resposta' }))
    await usuario.click(await screen.findByRole('button', { name: 'Mudar minha resposta' }))
    expect(screen.getByRole('radio', { name: 'Clássico' })).toBeChecked()
    await usuario.click(screen.getByText('Tropical'))
    await usuario.click(screen.getByRole('button', { name: 'Enviar resposta' }))
    await waitFor(() => expect(envios).toEqual([{ opcoes: ['o-1'] }, { opcoes: ['o-2'] }]))
    await usuario.click(await screen.findByRole('button', { name: 'Retirar minha resposta' }))
    const dialogo = screen.getByRole('alertdialog')
    await usuario.click(within(dialogo).getByRole('button', { name: 'Retirar resposta' }))
    expect(await screen.findByRole('button', { name: 'Enviar resposta' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Quem participou' })).not.toBeInTheDocument()
  })

  it('mantém resultado encerrado sem quórum e impede novas respostas', async () => {
    const detalhe = detalheDeTeste({ situacao: 'Encerrada', pode_responder: false })
    servidor.use(
      http.get(`${API}/enquetes`, () => HttpResponse.json([detalhe.enquete])),
      http.get(`${API}/enquetes/e-1`, () => HttpResponse.json(detalhe)),
    )
    renderizar(<EnquetesPage />, '/enquetes/e-1', '/enquetes/:id')
    expect(await screen.findByText('Quórum não atingido')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Resultado da enquete' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enviar resposta' })).not.toBeInTheDocument()
  })

  it('oferece o aceite do termo na barra da lista e mantém as opções bloqueadas', async () => {
    const detalhe = detalheDeTeste({
      pode_responder: false,
      motivo_do_bloqueio: 'Aceite o termo da turma para responder.',
    })
    servidor.use(
      http.get(`${API}/enquetes`, () => HttpResponse.json([detalhe.enquete])),
      http.get(`${API}/enquetes/e-1`, () => HttpResponse.json(detalhe)),
    )
    renderizar(<EnquetesPage />, '/enquetes/e-1', '/enquetes/:id')
    const aceite = await screen.findByRole('link', { name: 'Aceite o termo para votar.' })
    expect(aceite).toHaveAttribute('href', '/meu-termo')
    const resultado = await screen.findByRole('region', { name: 'Resultado da enquete' })
    expect(
      within(resultado).queryByRole('link', { name: 'Aceite o termo para votar.' }),
    ).not.toBeInTheDocument()
    expect(within(resultado).getByRole('radio', { name: 'Clássico' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Enviar resposta' })).not.toBeInTheDocument()
  })

  it('filtra pela situação e mantém a busca na URL usando os controles compartilhados', async () => {
    const aberta = detalheDeTeste({ pergunta: 'Tema do baile' })
    const encerrada = detalheDeTeste({
      id: 'e-2',
      pergunta: 'Horário do jantar',
      situacao: 'Encerrada',
      pode_responder: false,
    })
    servidor.use(
      http.get(API + '/enquetes', () => HttpResponse.json([aberta.enquete, encerrada.enquete])),
      http.get(API + '/enquetes/e-1', () => HttpResponse.json(aberta)),
      http.get(API + '/enquetes/e-2', () => HttpResponse.json(encerrada)),
    )
    const { router } = renderizar(<EnquetesPage />, '/enquetes')
    const lista = await screen.findByRole('navigation', { name: 'Lista de enquetes' })
    expect(await within(lista).findByRole('link', { name: /Tema do baile/ })).toBeInTheDocument()
    const usuario = userEvent.setup()
    await usuario.click(screen.getByRole('button', { name: /^Encerradas/ }))
    await waitFor(() =>
      expect(within(lista).queryByRole('link', { name: /Tema do baile/ })).not.toBeInTheDocument(),
    )
    expect(within(lista).getByRole('link', { name: /Horário do jantar/ })).toBeInTheDocument()
    expect(router.state.location.search).toContain('situacao=Encerrada')
    await usuario.type(screen.getByRole('searchbox', { name: 'Buscar enquetes' }), 'inexistente')
    await usuario.click(screen.getByRole('button', { name: 'Buscar' }))
    expect(
      await within(lista).findByText('Nenhuma enquete encontrada. Ajuste os filtros.'),
    ).toBeInTheDocument()
    expect(router.state.location.search).toContain('busca=inexistente')
  })

  it('limita múltipla escolha e libera a opção quando outra é desmarcada', async () => {
    const detalhe = detalheDeTeste({ tipo: 'MultiplaEscolha', maximo_de_escolhas: 1 })
    servidor.use(
      http.get(`${API}/enquetes`, () => HttpResponse.json([detalhe.enquete])),
      http.get(`${API}/enquetes/e-1`, () => HttpResponse.json(detalhe)),
    )
    renderizar(<EnquetesPage />, '/enquetes/e-1', '/enquetes/:id')
    const usuario = userEvent.setup()
    await screen.findByRole('checkbox', { name: 'Clássico' })
    await usuario.click(screen.getByText('Clássico').closest('label')!)
    expect(screen.getByRole('checkbox', { name: 'Clássico' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Tropical' })).toBeDisabled()
    await usuario.click(screen.getByText('Clássico'))
    expect(screen.getByRole('checkbox', { name: 'Tropical' })).toBeEnabled()
  })
})
