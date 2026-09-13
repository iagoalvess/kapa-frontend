import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { afterEach, describe, expect, it } from 'vitest'
import { env } from '@/config/env'
import { sessao } from '@/lib/http/sessao'
import { servidor } from '@/test/msw/server'
import { renderizar } from '@/test/utils'
import CriarFormaturaPage from './CriarFormaturaPage'

const FORMATURAS = `${env.VITE_API_URL}/api/v1/formaturas`
const ANO = String(new Date().getFullYear() + 1)

function tokenNaFormatura() {
  const corpo = { sub: 'u-1', name: 'Ana', formatura_id: 'f-nova', papel: 'Presidente' }
  return `c.${btoa(JSON.stringify(corpo))}.a`
}

/** Conta os `POST /formaturas` e guarda os corpos. */
function registrarCriacao() {
  const corpos: unknown[] = []
  servidor.use(
    http.post(FORMATURAS, async ({ request }) => {
      corpos.push(await request.json())
      return HttpResponse.json({
        accessToken: tokenNaFormatura(),
        expiraEm: new Date(Date.now() + 900_000).toISOString(),
      })
    }),
  )
  return corpos
}

async function preencherATurma() {
  await userEvent.type(screen.getByLabelText('Curso'), 'Medicina')
  await userEvent.type(screen.getByLabelText('Instituição'), 'UFPR')
  await userEvent.selectOptions(screen.getByLabelText('Ano de conclusão'), ANO)
  await userEvent.selectOptions(screen.getByLabelText('Semestre'), '1')
  await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
}

async function preencherOTamanho() {
  await userEvent.type(await screen.findByLabelText('Número estimado de formandos'), '80')
  await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
}

describe('CriarFormaturaPage', () => {
  afterEach(() => sessao.encerrar())

  /** O critério da sprint: o wizard guarda tudo no cliente e grava uma vez, no fim. */
  it('faz exatamente um POST, no último passo, e entra na formatura criada', async () => {
    const corpos = registrarCriacao()
    renderizar(<CriarFormaturaPage />)

    await preencherATurma()
    await preencherOTamanho()

    expect(await screen.findByLabelText('Nome da formatura')).toHaveValue(`Medicina ${ANO}.1 — UFPR`)
    expect(corpos).toHaveLength(0)

    await userEvent.click(screen.getByRole('button', { name: 'Criar formatura' }))

    await waitFor(() => expect(sessao.estado().usuario?.formaturaId).toBe('f-nova'))
    expect(corpos).toEqual([
      {
        nome: `Medicina ${ANO}.1 — UFPR`,
        curso: 'Medicina',
        instituicao: 'UFPR',
        ano: Number(ANO),
        semestre: 1,
        previsaoDeColacao: null,
        quantidadeEstimadaDeFormandos: 80,
      },
    ])
  })

  /** Abandonar no meio não deixa formatura pela metade: nada foi à API. */
  it('abandonar no passo 2 não chama a API', async () => {
    const corpos = registrarCriacao()
    const { unmount } = renderizar(<CriarFormaturaPage />)

    await preencherATurma()
    expect(await screen.findByLabelText('Número estimado de formandos')).toBeInTheDocument()
    unmount()

    expect(corpos).toHaveLength(0)
  })

  it('não avança com o passo incompleto', async () => {
    registrarCriacao()
    renderizar(<CriarFormaturaPage />)

    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(await screen.findByText('O curso é obrigatório.')).toBeInTheDocument()
    expect(screen.getByText('Passo 1 de 3')).toBeInTheDocument()
  })

  /** O nome é da comissão: voltar e mudar a turma não apaga o que ela escreveu. */
  it('não sobrescreve o nome editado ao voltar e avançar', async () => {
    registrarCriacao()
    renderizar(<CriarFormaturaPage />)

    await preencherATurma()
    await preencherOTamanho()
    const nome = await screen.findByLabelText('Nome da formatura')
    await userEvent.clear(nome)
    await userEvent.type(nome, 'Turma da Ana')

    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Continuar' }))

    expect(await screen.findByLabelText('Nome da formatura')).toHaveValue('Turma da Ana')
  })

  it('mostra o 409 de rascunho pendente sem sair da tela', async () => {
    servidor.use(
      http.post(FORMATURAS, () =>
        HttpResponse.json(
          {
            status: 409,
            title: 'Conflito',
            detail: 'Você já tem uma formatura aguardando contratação.',
            codigo: 'formatura.rascunho_pendente',
          },
          { status: 409 },
        ),
      ),
    )
    renderizar(<CriarFormaturaPage />)

    await preencherATurma()
    await preencherOTamanho()
    await userEvent.click(await screen.findByRole('button', { name: 'Criar formatura' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('aguardando contratação')
    expect(screen.getByText('Passo 3 de 3')).toBeInTheDocument()
  })
})
